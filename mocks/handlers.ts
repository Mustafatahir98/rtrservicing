import { http, HttpResponse } from "msw";
import { createMockLoans, demoLogin } from "./borrower-data";
import type { MockLoanData } from "./borrower-data";
import { centsAmount, inputCents, paymentToday } from "@/lib/payment-types";
import { paymentOptions } from "./v1-data";
import { createV1Handlers } from "./v1-handlers";
import { submitContractCallback, submitContractContact } from "@/lib/api/public-contact";
import { paymentAmountError } from "@/lib/payment-rules";

let loans = createMockLoans();
let challengeUntil = 0;
let registration: "none" | "identity" | "verified" | "complete" = "none";
const attempts = new Map<string, { fingerprint: string; result: { id: string; confirmation_number?: string; status: string } }>();
const sessionKey = "rtr-mock-session-until";
let sessionUntil = 0;
const error = (message: string, status = 400) => HttpResponse.json({ error: message, title: "Mock request failed", detail: message, status }, { status });
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return isObject(body) ? body : {};
}
async function publicForm(request: Request) {
  if (!request.headers.get("Content-Type")?.includes("application/json")) return request.formData();
  const form = new FormData();
  for (const [key, value] of Object.entries(await bodyOf(request))) if (typeof value === "string") form.set(key, value);
  return form;
}
function readSession() {
  if (typeof window !== "undefined") sessionUntil = Number(window.sessionStorage.getItem(sessionKey) ?? 0);
  return sessionUntil > Date.now();
}
function saveSession(until: number) {
  sessionUntil = until;
  if (typeof window !== "undefined") {
    if (until) window.sessionStorage.setItem(sessionKey, String(until));
    else window.sessionStorage.removeItem(sessionKey);
  }
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function paymentMutation(loan: MockLoanData, body: Record<string, unknown>) {
  const today = paymentToday();
  const options = paymentOptions(loan);
  const window = { min: options.dateOptions.earliestDate, max: options.dateOptions.latestDate };
  const availableDate = (value: unknown): value is string => validDate(value) && value >= today && value >= window.min && value <= window.max && !options.dateOptions.blockedDates.includes(value) && (value !== today || Date.now() < Date.parse(options.sameDayCutoff));
  if (body.action === "cancel" || body.action === "change-date") {
    const payment = loan.scheduled.find(item => item.id === body.paymentId);
    if (!payment) return error("This draft is no longer available.", 409);
    if (body.action === "change-date") {
      if (!availableDate(body.processDate)) return error("Select an available draft date before the cutoff.");
      payment.process_date = body.processDate;
      return HttpResponse.json({ ok: true });
    }
    if (body.confirm !== true) return error("Please confirm cancellation.");
    loan.cancelled.unshift({ ...payment, cancelled_at: new Date().toISOString(), cancellation_confirmation_number: `MOCK-CXL-${crypto.randomUUID().slice(0, 8)}` });
    loan.scheduled = loan.scheduled.filter(item => item.id !== payment.id);
    return HttpResponse.json({ ok: true, redirectTo: `/dashboard/payment-cancelled?${new URLSearchParams({ loan: loan.loan.rtr_loan_id, payment: payment.id })}` });
  }
  if (body.action !== "create") return error("Unknown payment action.");
  const bank = loan.banks.find(item => item.id === body.fundingAccountId);
  const amounts: Record<string, string | null> = { regular: loan.loan.account_payment_amount, due: loan.loan.account_total_due, payoff: loan.loan.account_payoff };
  if (!["regular", "due", "payoff", "custom"].includes(String(body.amountType))) return error("Select a valid amount.");
  const base = inputCents(body.amountType === "custom" ? body.customAmount : amounts[String(body.amountType)]);
  const extra = inputCents(body.extraPrincipal);
  if (!bank || !base || base <= 0 || extra === null || body.authorized !== true || typeof body.idempotencyKey !== "string" || !/^[a-f0-9-]{36}$/i.test(body.idempotencyKey)) return error("Review the amount, bank account and authorization.");
  const fingerprint = JSON.stringify([loan.loan.rtr_loan_id, base, extra, body.processDate, bank.id]);
  const key = `payment:${body.idempotencyKey}`;
  const prior = attempts.get(key);
  if (prior) return prior.fingerprint === fingerprint ? HttpResponse.json({ ok: true, ...prior.result }) : error("This attempt key was used for different details.", 409);
  if (body.amountType === "payoff") return error("Request an official payoff quote and follow its payment instructions.", 409);
  const amountError = paymentAmountError(options, base, extra, body.amountType === "custom");
  if (amountError) return error(amountError, 422);
  if (!availableDate(body.processDate)) return error("Select an available draft date before the cutoff.");
  const result = { id: crypto.randomUUID(), confirmation_number: `MOCK-PAY-${crypto.randomUUID().slice(0, 8)}`, status: body.processDate === today ? "processing" : "scheduled" };
  const amount = centsAmount(base + extra);
  if (result.status === "scheduled") loan.scheduled.push({ ...result, amount, process_date: body.processDate, bank_name: bank.bank_name, account_last4: bank.account_last4 });
  else loan.payments.unshift({ ...result, amount, process_date: body.processDate, bank_name: bank.bank_name, account_last4: bank.account_last4, principal_amount: "0.00", interest_amount: "0.00", escrow_amount: "0.00", fees_amount: "0.00", additional_principal_amount: centsAmount(extra), posted_at: null, initiated_by: "Mustafa Tahir", applied_to: null });
  attempts.set(key, { fingerprint, result });
  return HttpResponse.json({ ok: true, ...result });
}

export const handlers = [
  ...createV1Handlers({ getLoans: () => loans, signedIn: readSession, payment: paymentMutation, completeRegistration: () => { registration = "complete"; } }),
  http.post("/api/auth/sign-in", async ({ request }) => {
    const body = await bodyOf(request);
    challengeUntil = 0;
    const registered = registration === "complete" && body.email === "new.borrower@example.com";
    if ((body.email !== demoLogin.email && !registered) || body.password !== demoLogin.password) return error("Email or password is incorrect.", 401);
    challengeUntil = Date.now() + 10 * 60_000;
    return HttpResponse.json({ requiresVerification: true });
  }),
  http.post("/api/auth/verify", async ({ request }) => {
    const body = await bodyOf(request);
    if (challengeUntil < Date.now() || body.code !== demoLogin.code) return error("The verification code is invalid or expired.", 401);
    challengeUntil = 0;
    saveSession(Date.now() + 15 * 60_000);
    return HttpResponse.json({ redirectTo: "/dashboard" });
  }),
  http.post("/api/auth/session", () => {
    if (!readSession()) return error("Sign in to the mock demo.", 401);
    saveSession(Date.now() + 15 * 60_000);
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/auth/sign-out", () => {
    saveSession(0); challengeUntil = 0; loans = createMockLoans(); attempts.clear(); registration = "none";
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/contact", async ({ request }) => submitContractContact(await publicForm(request))),
  http.post("/api/callback", async ({ request }) => submitContractCallback(await publicForm(request))),
  // Fail closed: an unimplemented API must never fall through to a real DB,
  // payment provider or email integration in mock mode.
  http.all(/\/api\//, () => error("This operation is not available in the borrower mock demo.", 501)),
];
