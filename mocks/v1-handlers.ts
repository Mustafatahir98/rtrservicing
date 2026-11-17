import { http, HttpResponse } from "msw";
import { getPublicMock } from "@/lib/api/generated/public/public.msw";
import { getSystemMock } from "@/lib/api/generated/system/system.msw";
import type { AutopayPreview, ContactReceipt, Me, PaymentConfirmation, PayoffQuote, Problem } from "@/lib/api/generated/model";
import type { MockLoanData } from "./borrower-data";
import { autoPaySummary, type Frequency } from "@/lib/autopay";
import { centsAmount, inputCents, paymentToday } from "@/lib/payment-types";
import { createSamplePdf } from "@/lib/sample-pdf";
import { faqs, categories } from "@/lib/public-faqs";
import { matchesPaymentSearch } from "@/lib/payment-search";
import * as dto from "./v1-data";
import { createConsentHandlers } from "./consent-handlers";
import { createBorrowerSupportHandlers } from "./borrower-support-handlers";
import { publicSiteInfo } from "@/lib/public-site-info";
import { authorizationText } from "@/lib/api/authorization";
import { bankDisplayName, bankLast4, money } from "@/lib/portal-format";
import { demoRegistration } from "@/lib/demo-login";
import { accountNumberValidationMessage, containsSensitiveNumber, nameValidationMessage, sensitiveMessageError, validName, validOptionalAccountNumber, validPhone } from "@/lib/form-validation";
import { paymentAmountError } from "@/lib/payment-rules";

// Synthetic evidence for this demo session only; not a production audit store.
type PaymentAuthorizationRecord = {
  recordId: string; source: "MSW_DEMO"; personId: string; loanId: string;
  paymentId: string; confirmationNumber: string; idempotencyKey: string;
  accepted: true; acceptedAt: string;
  terms: { version: string; template: string; text: string; revocationText: string };
  payment: { amount: string; additionalPrincipal: string; totalAmount: string; fee: string; draftDate: string };
  bank: { bankAccountId: string; label: string; last4: string };
};

type Store = { getLoans: () => MockLoanData[]; signedIn: () => boolean; payment: (loan: MockLoanData, body: Record<string, unknown>) => Response; completeRegistration: () => void };
const json = (data: unknown, status = 200) => new HttpResponse(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID(), "Cache-Control": "no-store" } });
const problem = (detail: string, status = 422, code = "VALIDATION_ERROR") => {
  const requestId = crypto.randomUUID();
  return HttpResponse.json({ type: "about:blank", title: status === 401 ? "Sign in required" : status === 403 ? "Access denied" : "Request could not be completed", status, detail, code, requestId } satisfies Problem, { status, headers: { "Content-Type": "application/problem+json", "X-Request-Id": requestId, "Cache-Control": "no-store" } });
};
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
async function body(request: Request) { const value: unknown = await request.json().catch(() => null); return object(value) ? value : {}; }
const uuid = (value: string | null): value is string => Boolean(value && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value));

export function createV1Handlers(store: Store) {
  const attempts = new Map<string, { fingerprint: string; result: unknown }>();
  const documentLinks = new Map<string, { loanId: string; documentId: string; expires: number }>();
  const emailChanges = new Map<string, { email: string; expires: number }>();
  const registrations = new Map<string, { expires: number; sent: boolean; verified: boolean }>();
  const paymentAuthorizations = new Map<string, PaymentAuthorizationRecord>();
  const payoffQuotes = new Map<string, PayoffQuote[]>();
  let records = store.getLoans();
  function resetRecords() {
    if (records === store.getLoans()) return;
    records = store.getLoans(); attempts.clear(); emailChanges.clear(); registrations.clear(); documentLinks.clear(); paymentAuthorizations.clear(); payoffQuotes.clear();
  }
  const loan = (id: unknown) => store.getLoans().find(item => item.loan.rtr_loan_id === id);
  const self = () => store.getLoans()[0].profiles.find(profile => profile.customer_id === dto.personId)!;
  const selfName = () => `${self().first_name} ${self().last_name}`.trim();
  const updateSelf = (patch: Partial<ReturnType<typeof self>>) => { for (const item of store.getLoans()) item.profiles = item.profiles.map(profile => profile.customer_id === dto.personId ? { ...profile, ...patch, updated_at: new Date().toISOString() } : profile); };
  return [
    http.all("/api/mock/loans/:loanId/people/:personId/profile", ({ request }) => problem("Only the co-borrower name is available. Personal details are private.", request.method === "GET" ? 404 : 403)),
    // Auth middleware runs before both stateful handlers and generated example handlers.
    http.all("/api/v1/*", ({ request }) => {
      resetRecords();
      const path = new URL(request.url).pathname;
      if (path.startsWith("/api/v1/public/") || path.startsWith("/api/v1/registration/") || path === "/api/v1/health") return;
      if (!store.signedIn() || request.headers.get("Authorization") !== "Bearer mock-borrower-access-token") return problem("Please sign in to the borrower portal.", 401, "UNAUTHENTICATED");
    }),
    ...createConsentHandlers(store),
    ...createBorrowerSupportHandlers(store),
    // Inspection-only demo extension; the generated production contract is unchanged.
    http.get("/api/mock/loans/:loanId/payments/:paymentId/authorization", ({ params, request }) => {
      resetRecords();
      if (!store.signedIn() || request.headers.get("Authorization") !== "Bearer mock-borrower-access-token") return problem("Please sign in.", 401, "UNAUTHENTICATED");
      const record = paymentAuthorizations.get(String(params.paymentId));
      if (!loan(params.loanId) || !record || record.loanId !== params.loanId || record.personId !== dto.personId) return problem("Authorization record not found.", 404);
      return json(record);
    }),
    http.get("/api/v1/public/site-info", () => json({ companyName: "Real Time Resolutions, Inc.", phones: [{ label: "Customer Solutions", number: publicSiteInfo.phone.label }], hours: [{ days: "Monday to Thursday", open: "07:00", close: "21:00", timeZone: "America/Chicago" }, { days: "Friday", open: "07:00", close: "19:00", timeZone: "America/Chicago" }], addresses: [{ purpose: "HEADQUARTERS", lines: publicSiteInfo.corporate }], nmlsId: publicSiteInfo.nmlsId, supportEmail: null, footerDisclosures: [] })),
    http.get("/api/v1/public/legal/:documentType", ({ params }) => params.documentType === "TERMS_OF_USE" || params.documentType === "ESIGN_DISCLOSURE" ? json({ documentType: params.documentType, version: `demo-${params.documentType}-v1`, effectiveDate: paymentToday(), title: String(params.documentType).replaceAll("_", " "), bodyMarkdown: "Synthetic preview disclosure. RTR compliance must supply the approved production wording." }) : problem("Approved portal legal content has not been supplied. Use the published reference links or contact Customer Solutions.", 503, "APPROVED_LEGAL_CONTENT_UNAVAILABLE")),
    http.get("/api/v1/public/faqs", ({ request }) => {
      const categoryIds = ["ACCOUNT_TRANSFERS", "PAYMENTS_AUTOPAY", "TAX_STATEMENTS", "HARDSHIP"] as const;
      const search = new URL(request.url).searchParams, category = search.get("category"), q = (search.get("q") ?? "").toLowerCase();
      return json({ categories: categories.map((label, index) => ({ id: categoryIds[index], label, count: faqs.filter(faq => faq.category === label).length })), items: faqs.map((faq, index) => ({ id: `faq-${index}`, category: categoryIds[categories.indexOf(faq.category)], question: faq.question, answerMarkdown: faq.answer })).filter(faq => (!category || faq.category === category) && (!q || `${faq.question} ${faq.answerMarkdown}`.toLowerCase().includes(q))) });
    }),
    http.post("/api/v1/public/messages", async ({ request }) => {
      const input = await body(request);
      if (!validName(input.fullName)) return problem(nameValidationMessage);
      if (!validOptionalAccountNumber(input.accountNumber)) return problem(accountNumberValidationMessage);
      if (input.phone != null && !validPhone(input.phone)) return problem("Enter a phone number with 10 to 15 digits.");
      if (typeof input.fullName !== "string" || !input.fullName.trim() || input.fullName.length > 100 || typeof input.email !== "string" || !/^\S+@\S+\.\S+$/.test(input.email) || typeof input.message !== "string" || !input.message.trim() || input.message.length > 2000 || !["PAYMENT_AUTOPAY", "ACCOUNT_TRANSFER", "STATEMENTS_TAX", "PAYMENT_ASSISTANCE", "OTHER"].includes(String(input.reason))) return problem("Check your name, email, reason and message.");
      if (containsSensitiveNumber(input.message)) return problem(sensitiveMessageError, 422, "SENSITIVE_MESSAGE_CONTENT");
      return json({ referenceNumber: `MOCK-CONTACT-${crypto.randomUUID().slice(0, 8)}`, receivedAt: new Date().toISOString() } satisfies ContactReceipt, 201);
    }),
    http.post("/api/v1/registration/verify-loan", async ({ request }) => {
      const input = await body(request);
      if (!store.getLoans().some(item => item.loan.rtr_loan_id === input.accountNumber || item.loan.account_number === input.accountNumber) || input.ssnLast4 !== "1234" || input.zipCode !== "90210") return problem("The demo identity could not be matched.", 422, "IDENTITY_NOT_MATCHED");
      const id = crypto.randomUUID(), expires = Date.now() + 600_000; registrations.set(id, { expires, sent: false, verified: false });
      return json({ registrationId: id, expiresAt: new Date(expires).toISOString(), contactOptions: [{ contactOptionId: "demo-email", channel: "EMAIL", maskedValue: "n***@example.com" }] });
    }),
    http.post("/api/v1/registration/:registrationId/send-code", async ({ params, request }) => { const session = registrations.get(String(params.registrationId)), input = await body(request); if (!session || session.expires < Date.now() || input.contactOptionId !== "demo-email") return problem("Restart registration.", 422, "REGISTRATION_EXPIRED"); session.sent = true; return json({ sentTo: "n***@example.com", expiresAt: new Date(session.expires).toISOString(), resendAvailableAt: new Date(Date.now() + 60_000).toISOString() }, 202); }),
    http.post("/api/v1/registration/:registrationId/verify-code", async ({ params, request }) => { const session = registrations.get(String(params.registrationId)), input = await body(request); if (!session || session.expires < Date.now() || !session.sent || input.code !== "123456") return problem("Enter the demo verification code.", 422, "INVALID_CODE"); session.verified = true; return json({ verified: true, suggestedEmail: demoRegistration.email }); }),
    http.post("/api/v1/registration/:registrationId/complete", async ({ params, request }) => { const id = String(params.registrationId), session = registrations.get(id), input = await body(request); if (!session || session.expires < Date.now() || !session.verified) return problem("Verify your details before creating the account."); if (input.email !== demoRegistration.email || input.password !== demoRegistration.password || input.acceptedTermsVersion !== "demo-TERMS_OF_USE-v1" || input.acceptedEsignVersion !== "demo-ESIGN_DISCLOSURE-v1") return problem("Use the predefined demo email/password and accept the displayed disclosures."); store.completeRegistration(); registrations.delete(id); return json({ username: input.email, nextStep: "SIGN_IN_AND_SET_UP_AUTHENTICATOR" }, 201); }),
    http.get("/api/v1/me", () => json({ userId: dto.personId, displayName: `${self().first_name} ${self().last_name}`, firstName: self().first_name, email: self().contact_email, mfaEnabled: true, loans: store.getLoans().map(dto.loanItem) } satisfies Me)),
    http.get("/api/v1/loans/:loanId/summary", ({ params }) => { const item = loan(params.loanId); return item ? json(dto.summary(item)) : problem("Loan not found.", 404, "LOAN_NOT_FOUND"); }),
    http.get("/api/v1/loans/:loanId", ({ params }) => { const item = loan(params.loanId); return item ? json(dto.details(item)) : problem("Loan not found.", 404, "LOAN_NOT_FOUND"); }),
    http.get("/api/v1/loans/:loanId/people", ({ params }) => { const item = loan(params.loanId); return item ? json({ items: item.profiles.map(profile => ({ personId: profile.customer_id, displayName: `${profile.first_name} ${profile.last_name}`, role: profile.borrower_role === "primary" ? "PRIMARY_BORROWER" : "CO_BORROWER", isMe: profile.customer_id === dto.personId })) }) : problem("Loan not found.", 404, "LOAN_NOT_FOUND"); }),
    http.get("/api/v1/loans/:loanId/payment-options", ({ params }) => { const item = loan(params.loanId); return item ? json(dto.paymentOptions(item)) : problem("Loan not found.", 404); }),
    http.get("/api/v1/loans/:loanId/authorization-terms", ({ params, request }) => { if (!loan(params.loanId)) return problem("Loan not found.", 404); const type = new URL(request.url).searchParams.get("type"); return type === "ONE_TIME" || type === "RECURRING" ? json(dto.authorization(type)) : problem("Select an authorization type."); }),
    http.get("/api/v1/loans/:loanId/bank-accounts", ({ params }) => { const item = loan(params.loanId); return item ? json({ items: dto.bankAccounts(item) }) : problem("Loan not found.", 404); }),
    http.get("/api/v1/loans/:loanId/payments", ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const search = new URL(request.url).searchParams, status = search.get("status"), q = (search.get("q") ?? "").toLowerCase();
      const payments = item.payments.map(payment => dto.paymentItem(payment, selfName())).filter(payment => (!status || status === "ALL" || payment.status === status) && matchesPaymentSearch(payment.confirmationNumber, payment.date, q, { amount: payment.amount, initiator: payment.madeBy, viewerName: selfName() }));
      const start = Number(search.get("cursor") ?? 0), limit = Math.min(100, Math.max(1, Number(search.get("limit") ?? 25)));
      if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(limit)) return problem("Invalid pagination.");
      return json({ items: payments.slice(start, start + limit), nextCursor: start + limit < payments.length ? String(start + limit) : null });
    }),
    http.get("/api/v1/loans/:loanId/payments/export", ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const search = new URL(request.url).searchParams, status = search.get("status"), q = (search.get("q") ?? "").toLowerCase();
      const escape = (value: string) => `"${(/^[\s]*[=+\-@]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
      const rows = item.payments.map(payment => dto.paymentItem(payment, selfName())).filter(payment => (!status || status === "ALL" || payment.status === status) && matchesPaymentSearch(payment.confirmationNumber, payment.date, q, { amount: payment.amount, initiator: payment.madeBy, viewerName: selfName() }));
      const csv = [["Payment Date", "Amount", "Status", "Confirmation Number", "Made By"], ...rows.map(payment => [payment.date, payment.amount, payment.status, payment.confirmationNumber, payment.madeBy])].map(row => row.map(escape).join(",")).join("\r\n");
      return new HttpResponse(csv, { headers: { "Content-Type": "text/csv", "X-Request-Id": crypto.randomUUID() } });
    }),
    http.get("/api/v1/loans/:loanId/payments/:paymentId", ({ params }) => { const payment = loan(params.loanId)?.payments.find(payment => payment.id === params.paymentId); return payment ? json(dto.paymentDetail(payment, selfName())) : problem("Payment not found.", 404); }),
    http.post("/api/v1/loans/:loanId/payments", async ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const input = await body(request), authorization = input.authorization, key = request.headers.get("Idempotency-Key");
      const terms = dto.authorization("ONE_TIME"), feeCents = inputCents(dto.paymentOptions(item).paymentFee);
      if (!uuid(key) || !object(authorization) || authorization.accepted !== true || authorization.termsVersion !== terms.version) return problem("Review the payment authorization and attempt key.");
      if (!terms.text.trim() || !terms.revocationText.trim() || feeCents === null) return problem("Payment authorization or fee is unavailable.", 409);
      const bank = dto.bankAccounts(item).find(bank => bank.bankAccountId === input.bankAccountId);
      if (!bank || !bankLast4(bank.last4)) return problem("Select an available masked bank account.");
      if (paymentAuthorizations.size >= 500 && !Array.from(paymentAuthorizations.values()).some(record => record.idempotencyKey === key)) return problem("The demo authorization record limit was reached. Reload before creating another demo payment.", 409);
      const kind = { REGULAR: "regular", TOTAL_DUE: "due", PAYOFF: "payoff", CUSTOM: "custom" }[String(input.amountType)];
      const option = dto.paymentOptions(item).amountOptions.find(option => option.type === input.amountType);
      const limits = dto.paymentOptions(item).customAmountLimits, amountCents = inputCents(input.amount);
      if (input.amountType === "CUSTOM" && (amountCents === null || amountCents < (inputCents(limits.min) ?? 1) || amountCents > (inputCents(limits.max) ?? 0))) return problem("Enter a custom amount within the available limits.");
      if (input.amountType === "PAYOFF" && (!option || !option.payoffQuoteId || input.payoffQuoteId !== option.payoffQuoteId)) return problem("Request a current official payoff quote before making a payoff payment.", 409, "PAYOFF_QUOTE_REQUIRED");
      if (!kind || (input.amountType !== "CUSTOM" && !option) || (option && input.amount !== option.amount)) return problem("Refresh the available payment amount.", 409, "PAYMENT_OPTIONS_CHANGED");
      const amountError = paymentAmountError(dto.paymentOptions(item), amountCents, inputCents(input.additionalPrincipal ?? "0.00"), input.amountType === "CUSTOM");
      if (amountError) return problem(amountError);
      const response = store.payment(item, { action: "create", amountType: kind, customAmount: input.amount, extraPrincipal: input.additionalPrincipal ?? "0.00", processDate: input.draftDate, fundingAccountId: input.bankAccountId, authorized: true, idempotencyKey: key });
      const result: unknown = await response.json(); if (!object(result)) return problem("Invalid payment response.", 500);
      if (!response.ok) return problem(String(result.detail ?? result.error ?? "Payment could not be accepted."), response.status, response.status === 409 ? "IDEMPOTENCY_CONFLICT" : "VALIDATION_ERROR");
      const paymentId = String(result.id), totalAmount = centsAmount((amountCents ?? 0) + (inputCents(input.additionalPrincipal ?? "0.00") ?? 0));
      // Retrying the same successful attempt must preserve its original evidence.
      if (!paymentAuthorizations.has(paymentId)) paymentAuthorizations.set(paymentId, {
        recordId: crypto.randomUUID(), source: "MSW_DEMO", personId: dto.personId, loanId: item.loan.rtr_loan_id,
        paymentId, confirmationNumber: String(result.confirmation_number), idempotencyKey: key,
        accepted: true, acceptedAt: new Date().toISOString(),
        terms: { version: terms.version, template: terms.text, text: authorizationText(terms, { amount: money(totalAmount), date: String(input.draftDate), schedule: "one time", last4: bank.last4 }), revocationText: terms.revocationText },
        payment: { amount: centsAmount(amountCents ?? 0), additionalPrincipal: centsAmount(inputCents(input.additionalPrincipal ?? "0.00") ?? 0), totalAmount, fee: centsAmount(feeCents), draftDate: String(input.draftDate) },
        bank: { bankAccountId: bank.bankAccountId, label: bankDisplayName(bank.bankName), last4: bank.last4 },
      });
      return json({ paymentId, confirmationNumber: String(result.confirmation_number), status: String(result.status).toUpperCase() as PaymentConfirmation["status"], amount: totalAmount, draftDate: String(input.draftDate), bankAccount: bank } satisfies PaymentConfirmation, 201);
    }),
    http.get("/api/v1/loans/:loanId/scheduled-payments", ({ params }) => { const item = loan(params.loanId); return item ? json({ items: dto.scheduledPayments(item) }) : problem("Loan not found.", 404); }),
    http.patch("/api/v1/loans/:loanId/scheduled-payments/:paymentId", async ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const input = await body(request), response = store.payment(item, { action: "change-date", paymentId: params.paymentId, processDate: input.draftDate });
      if (!response.ok) return problem("This draft cannot be rescheduled to that date.", response.status);
      return json(dto.scheduledPayments(item).find(payment => payment.paymentId === params.paymentId));
    }),
    http.delete("/api/v1/loans/:loanId/scheduled-payments/:paymentId", ({ params }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const response = store.payment(item, { action: "cancel", paymentId: params.paymentId, confirm: true }); if (!response.ok) return problem("Draft not found or already cancelled.", 409);
      const cancelled = item.cancelled.find(payment => payment.id === params.paymentId)!;
      return json({ paymentId: cancelled.id, cancellationNumber: cancelled.cancellation_confirmation_number, cancelledAt: cancelled.cancelled_at, stillDue: { amount: item.loan.account_total_due, dueDate: item.loan.account_due_date, lastDayBeforeLateFee: dto.paymentOptions(item).gracePeriodEndDate } });
    }),
    http.get("/api/v1/loans/:loanId/autopay", ({ params }) => { const item = loan(params.loanId); return item ? json(dto.autopay(item)) : problem("Loan not found.", 404); }),
    http.post("/api/v1/loans/:loanId/autopay/preview", async ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const input = await body(request); const result = preview(item, input); return result instanceof Response ? result : json(result);
    }),
    http.put("/api/v1/loans/:loanId/autopay", async ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const input = await body(request), schedule = input.schedule, auth = input.authorization, key = request.headers.get("Idempotency-Key");
      if (!object(schedule) || !object(auth) || auth.accepted !== true || auth.termsVersion !== dto.authorization("RECURRING").version || !uuid(key)) return problem("Review the schedule, authorization and attempt key.");
      const bank = item.banks.find(bank => bank.id === input.bankAccountId && bank.account_type === "checking"); if (!bank) return problem("Select a checking account.");
      const value = preview(item, schedule); if (value instanceof Response) return value;
      const fingerprint = JSON.stringify([item.loan.rtr_loan_id, input]); const prior = attempts.get(key);
      if (prior) return prior.fingerprint === fingerprint ? json(prior.result) : problem("The attempt key was already used for different details.", 409, "IDEMPOTENCY_CONFLICT");
      if (input.expectedRulesVersion !== value.rulesVersion || input.expectedAmountPerDraft !== value.amountPerDraft || input.expectedTotalPerYear !== value.totalPerYear) return problem("AutoPay rules or amounts changed. Review the current schedule before activating.", 409, "AUTOPAY_RULES_CHANGED");
      const frequency = String(schedule.frequency).toLowerCase() as Frequency, firstDate = String(schedule.firstDraftDate);
      item.autopay = { id: crypto.randomUUID(), customer_id: dto.personId, funding_account_id: bank.id, frequency, first_day: Number(firstDate.slice(8, 10)), second_day: typeof schedule.secondDayOfMonth === "number" ? schedule.secondDayOfMonth : null, anchor_date: firstDate, amount: value.amountPerDraft, next_draft_date: value.upcomingDrafts[0], bank_name: bank.bank_name, account_last4: bank.account_last4 };
      const result = dto.autopay(item); attempts.set(key, { fingerprint, result }); return json(result);
    }),
    http.delete("/api/v1/loans/:loanId/autopay", ({ params }) => { const item = loan(params.loanId); if (!item?.autopay) return problem("The schedule is no longer active.", 409, "AUTOPAY_CHANGED"); item.autopay = null; return json({ enrolled: false, lastDraftDate: null, confirmationNumber: `MOCK-AP-CXL-${crypto.randomUUID().slice(0, 8)}` }); }),
    http.get("/api/v1/me/profile", () => json(dto.profile(store.getLoans()[0]))),
    http.post("/api/v1/me/profile/email-change", async ({ request }) => { const input = await body(request); if (typeof input.newEmail !== "string" || !/^\S+@\S+\.\S+$/.test(input.newEmail)) return problem("Enter a valid email."); const id = crypto.randomUUID(), expires = Date.now() + 600_000; emailChanges.set(id, { email: input.newEmail, expires }); return json({ emailChangeId: id, expiresAt: new Date(expires).toISOString() }, 202); }),
    http.post("/api/v1/me/profile/email-change/confirm", async ({ request }) => { const input = await body(request), id = String(input.emailChangeId), change = emailChanges.get(id); if (!change || change.expires < Date.now() || input.code !== "123456") return problem("Enter the demo verification code before the request expires.", 422, "INVALID_CODE"); updateSelf({ contact_email: change.email }); emailChanges.delete(id); return json(dto.profile(store.getLoans()[0])); }),
    http.put("/api/v1/me/profile/mailing-address", async ({ request }) => { const input = await body(request); if (!["line1", "city", "state", "postalCode"].every(key => typeof input[key] === "string" && String(input[key]).trim()) || !/^[A-Z]{2}$/.test(String(input.state)) || !/^\d{5}(-\d{4})?$/.test(String(input.postalCode))) return problem("Check your mailing address."); updateSelf({ mail_address_line1: String(input.line1), mail_address_line2: String(input.line2 ?? ""), mail_city: String(input.city), mail_state: String(input.state), mail_zip: String(input.postalCode) }); return json(dto.profile(store.getLoans()[0])); }),
    http.put("/api/v1/me/profile/phone", async ({ request }) => { const input = await body(request); if (!/^\+[1-9]\d{7,14}$/.test(String(input.number)) || !["MOBILE", "HOME", "WORK"].includes(String(input.type))) return problem("Enter a valid phone number."); updateSelf({ primary_phone: String(input.number), primary_phone_type: input.type === "MOBILE" ? "Cell" : "Land Line" }); return json(dto.profile(store.getLoans()[0])); }),
    http.get("/api/v1/me/communication-preferences", ({ request }) => { const item = loan(new URL(request.url).searchParams.get("loanId")); return item ? json(dto.preferences(item)) : problem("Loan not found.", 404); }),
    http.get("/api/v1/loans/:loanId/documents", ({ params }) => { const item = loan(params.loanId); return item ? json({ items: dto.documents(item), nextCursor: null }) : problem("Loan not found.", 404); }),
    http.get("/api/v1/loans/:loanId/payoff-quotes", ({ params }) => {
      if (!loan(params.loanId)) return problem("Loan not found.", 404);
      return json({ items: (payoffQuotes.get(String(params.loanId)) ?? []).map(quote => ({ ...quote, status: quote.goodThroughDate < paymentToday() ? "EXPIRED" : quote.status })) });
    }),
    http.post("/api/v1/loans/:loanId/payoff-quotes", async ({ params, request }) => {
      const item = loan(params.loanId); if (!item) return problem("Loan not found.", 404);
      const input = await body(request), date = input.payoffDate;
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date || date < paymentToday()) return problem("Select a valid payoff date on or after today.");
      const quotes = payoffQuotes.get(item.loan.rtr_loan_id) ?? [];
      const prior = quotes.find(quote => quote.goodThroughDate === date && quote.status === "READY");
      if (prior) return json(prior, 202);
      if (quotes.length >= 30) return problem("The demo quote limit was reached. Reload before requesting more quotes.", 409);
      // Explicit synthetic fixture amounts, never a calculation from principal balance.
      const fixture = item.loan.rtr_loan_id === "100849201" ? { total: "349910.17", perDiem: "56.06" } : { total: "48410.50", perDiem: "9.25" };
      const quote: PayoffQuote = { quoteId: `DEMO-PQ-${crypto.randomUUID()}`, status: "READY", requestedAt: new Date().toISOString(), goodThroughDate: date, totalPayoffAmount: fixture.total, perDiemInterest: fixture.perDiem, documentId: crypto.randomUUID() };
      quotes.unshift(quote); payoffQuotes.set(item.loan.rtr_loan_id, quotes);
      item.documents.push({ id: quote.documentId!, document_type: "payoff_quote", title: `Synthetic payoff quote ${quote.quoteId}`, document_date: paymentToday(), tax_year: null, file_size_bytes: 1024 });
      return json(quote, 202);
    }),
    http.post("/api/v1/loans/:loanId/documents/:documentId/link", ({ params }) => {
      const item = loan(params.loanId), document = item?.documents.find(document => document.id === params.documentId); if (!item || !document) return problem("Document not found.", 404);
      const quote = payoffQuotes.get(item.loan.rtr_loan_id)?.find(quote => quote.documentId === document.id);
      if (document.document_type === "payoff_quote" && (!quote || quote.status !== "READY" || quote.goodThroughDate < paymentToday())) return problem("This payoff quote has expired. Request a new quote.", 409, "PAYOFF_QUOTE_EXPIRED");
      const key = crypto.randomUUID(), expires = Date.now() + 300_000; documentLinks.set(key, { loanId: item.loan.rtr_loan_id, documentId: document.id, expires });
      return json({ url: `${window.location.origin}/api/mock-document/${key}`, expiresAt: new Date(expires).toISOString() });
    }),
    http.get("/api/mock-document/:key", ({ params }) => {
      const link = documentLinks.get(String(params.key)); if (!link || !store.signedIn() || link.expires < Date.now()) return problem("This link has expired. Open the document again.", 403, "DOCUMENT_LINK_EXPIRED");
      const document = loan(link.loanId)?.documents.find(document => document.id === link.documentId); if (!document) return problem("Document not found.", 404);
      const quote = payoffQuotes.get(link.loanId)?.find(quote => quote.documentId === document.id);
      if (document.document_type === "payoff_quote" && (!quote || quote.goodThroughDate < paymentToday() || quote.status !== "READY")) return problem("This payoff quote has expired. Request a new quote.", 409, "PAYOFF_QUOTE_EXPIRED");
      const lines = quote ? ["SYNTHETIC DEMO PAYOFF QUOTE - NOT OFFICIAL", "No real payment instructions. Do not use to settle a loan.", quote.quoteId, `Loan: ${link.loanId}`, `Good through: ${quote.goodThroughDate}`, `Synthetic total: ${quote.totalPayoffAmount} USD`] : ["SYNTHETIC DEMO DOCUMENT", document.title, document.document_date];
      return new HttpResponse(createSamplePdf(lines), { headers: { "Content-Type": "application/pdf", "X-Request-Id": crypto.randomUUID() } });
    }),
    ...getSystemMock(), ...getPublicMock(),
    http.all("/api/v1/*", () => problem("This contract operation is not connected to the interactive demo yet.", 501, "NOT_IMPLEMENTED")),
  ];
}

function preview(item: MockLoanData, input: Record<string, unknown>): AutopayPreview | Response {
  if (!["MONTHLY", "SEMI_MONTHLY", "WEEKLY", "BIWEEKLY"].includes(String(input.frequency)) || typeof input.firstDraftDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.firstDraftDate) || !Number.isFinite(Date.parse(input.firstDraftDate)) || input.firstDraftDate < paymentToday()) return problem("Select an available schedule and first draft date.");
  if (new Date(`${input.firstDraftDate}T00:00:00Z`).toISOString().slice(0, 10) !== input.firstDraftDate) return problem("Select a valid first draft date.");
  const frequency = String(input.frequency).toLowerCase() as Frequency, day = Number(input.firstDraftDate.slice(8, 10));
  const weekday = new Date(`${input.firstDraftDate}T00:00:00Z`).getUTCDay();
  const options = dto.autopay(item);
  if (!options.allowedFrequencies.includes(input.frequency as typeof options.allowedFrequencies[number]) || ((frequency === "weekly" || frequency === "biweekly") && !options.weekdayRules[frequency].includes(weekday))) return problem("Select an available first draft weekday for this demo schedule.");
  const allowed = dto.autopay(item).allowedDays;
  if (typeof allowed.from !== "number" || typeof allowed.to !== "number") return problem("Draft day options are unavailable.");
  if ((frequency === "monthly" || frequency === "semi_monthly") && (day < allowed.from || day > allowed.to || (frequency === "semi_monthly" && (day + 15 > 28 || input.secondDayOfMonth !== day + 15)))) return problem("Select an available draft day.");
  const value = autoPaySummary(frequency, day, input.firstDraftDate, item.loan.account_payment_amount ?? "0.00", paymentToday());
  // Compare with the next installment's actual synthetic deadline. A draft in
  // the preceding month must not be warned against an invented earlier deadline.
  const terms = dto.paymentOptions(item);
  const threshold = terms.lateFee.appliesAfter;
  const secondDate = frequency === "semi_monthly" ? `${input.firstDraftDate.slice(0, 7)}-${String(day + 15).padStart(2, "0")}` : null;
  const drafts = secondDate ? [input.firstDraftDate, secondDate] : [input.firstDraftDate];
  const annualBase = centsAmount((inputCents(item.loan.account_payment_amount) ?? 0) * 12);
  const planDisclosure = `Synthetic ${frequency === "weekly" || frequency === "biweekly" ? "accelerated" : "standard"} plan: estimated yearly drafts ${money(value.annual)}, compared with ${money(annualBase)} for twelve monthly instalments. RTR must approve the real schedule and allocation rules before production use.`;
  return { amountPerDraft: value.amount, draftsPerYear: value.drafts, totalPerYear: value.annual, upcomingDrafts: drafts, planDisclosure, rulesVersion: "synthetic-servicing-v1", explanation: `Synthetic schedule estimate: ${value.description}. Draft amounts and annual totals are estimates for this demo. Payment allocation, posting and any principal reduction depend on the loan's servicing rules; a draft date is not a posting guarantee.`, warnings: drafts.some(date => date > threshold) ? [{ code: "AFTER_LATE_FEE_DATE", message: `This demo schedule includes a draft after ${threshold}. A late fee of ${terms.lateFee.amount} USD may apply if the amount due is not received in time. Review your loan's payment requirements before enrolling.` }] : [] };
}
