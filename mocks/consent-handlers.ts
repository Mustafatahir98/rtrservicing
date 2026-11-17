import { http, HttpResponse } from "msw";
import type { MockLoanData } from "./borrower-data";
import { callbackConsent, demoEsign, type ConsentEvidence } from "@/lib/consent";
import { createSamplePdf } from "@/lib/sample-pdf";
import { personId, preferences } from "./v1-data";
import { demoAccountScenarios } from "@/lib/borrower-support";
import { accountNumberValidationMessage, nameValidationMessage, validName, validOptionalAccountNumber } from "@/lib/form-validation";

const json = (value: unknown, status = 200) => new HttpResponse(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID(), "Cache-Control": "no-store" } });
const problem = (detail: string, status = 422) => HttpResponse.json({ type: "about:blank", title: "Consent request could not be completed", status, detail, code: "CONSENT_VALIDATION_FAILED" }, { status, headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store", "X-Request-Id": crypto.randomUUID() } });
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
async function body(request: Request) { const value: unknown = await request.json().catch(() => null); return object(value) ? value : {}; }

export function createConsentHandlers(store: { getLoans: () => MockLoanData[]; signedIn: () => boolean }) {
  let loans = store.getLoans();
  const history: ConsentEvidence[] = [];
  const accessed = new Set<string>();
  const callbacks: { consentText: string; consentTextVersion: string; receivedAt: string }[] = [];
  const linked = (id: unknown) => store.getLoans().find(item => item.loan.rtr_loan_id === id && item.profiles.some(profile => profile.customer_id === personId));
  const state = (item: MockLoanData) => ({ preferences: preferences(item), disclosure: demoEsign, history: history.filter(entry => entry.loanId === item.loan.rtr_loan_id && entry.personId === personId).slice(-100).reverse() });
  function reset() { if (loans !== store.getLoans()) { loans = store.getLoans(); history.length = 0; callbacks.length = 0; accessed.clear(); } }
  function apply(item: MockLoanData, input: Record<string, unknown>, exactText: boolean) {
    if (!Array.isArray(input.choices) || !input.choices.length || input.choices.length > 4) return problem("Select your communication choices.");
    if (input.personId !== undefined && input.personId !== personId) return problem("Only your own preferences can be changed.", 403);
    const current = preferences(item), seen = new Set<string>();
    const changes: { option: (typeof current.choices)[number]; enabled: boolean }[] = [];
    for (const choice of input.choices) {
      if (!object(choice) || typeof choice.enabled !== "boolean" || typeof choice.channel !== "string" || seen.has(choice.channel)) return problem("Select each communication choice once.");
      seen.add(choice.channel);
      const option = current.choices.find(value => value.channel === choice.channel);
      if (!option?.editable || !option.consentText.trim() || choice.consentTextVersion !== option.consentTextVersion || (exactText && choice.consentText !== option.consentText)) return problem("Consent wording changed or is unavailable. Refresh and review it again.", 409);
      if (choice.enabled !== option.enabled) changes.push({ option, enabled: choice.enabled });
    }
    const enroll = changes.some(change => change.option.channel === "ESTATEMENTS" && change.enabled);
    const disclosure = object(input.disclosure) ? input.disclosure : {};
    if (enroll && (!exactText || !accessed.has(item.loan.rtr_loan_id) || disclosure.version !== demoEsign.version || disclosure.text !== demoEsign.text || disclosure.accepted !== true || disclosure.documentAccessConfirmed !== true)) return problem("Download the sample PDF, confirm document access and accept the current E-SIGN disclosure before enrolling.");
    const recordedAt = new Date().toISOString();
    const fields = { EMAIL: "email_consent", ESTATEMENTS: "estatement_consent", SMS: "sms_consent", AUTOMATED_VOICE: "prerecorded_consent" } as const;
    // Validate the whole batch before changing any choices or recording evidence.
    const patch = Object.fromEntries(changes.map(change => [fields[change.option.channel], change.enabled]));
    if (changes.length) item.profiles = item.profiles.map(profile => profile.customer_id === personId ? { ...profile, ...patch, consent_updated_at: recordedAt } : profile);
    for (const { option, enabled } of changes) history.push({ consentId: crypto.randomUUID(), loanId: item.loan.rtr_loan_id, personId, channel: option.channel, enabled, consentTextVersion: option.consentTextVersion, consentText: option.consentText, recordedAt, source: "PORTAL", ...(option.channel === "ESTATEMENTS" && enabled ? { disclosureVersion: demoEsign.version, disclosureText: demoEsign.text, documentAccessConfirmed: true } : {}) });
    if (history.length > 200) history.splice(0, history.length - 200);
    if (changes.some(change => change.option.channel === "ESTATEMENTS")) accessed.delete(item.loan.rtr_loan_id);
    return json(exactText ? state(item) : preferences(item));
  }
  return [
    http.all("/api/mock/loans/:loanId/consent/*", ({ params, request }) => {
      reset();
      if (!store.signedIn() || request.headers.get("Authorization") !== "Bearer mock-borrower-access-token") return problem("Sign in to view or change your preferences.", 401);
      if (!linked(params.loanId)) return problem("Loan not found.", 404);
    }),
    http.get("/api/mock/loans/:loanId/consent/state", ({ params }) => json(state(linked(params.loanId)!))),
    http.get("/api/mock/loans/:loanId/consent/sample", ({ params }) => {
      accessed.add(String(params.loanId));
      return new HttpResponse(createSamplePdf(["DEMO E-SIGN DOCUMENT ACCESS CHECK", "If you can read and retain this PDF, confirm access in the portal.", "This sample is not an approved servicing disclosure."]), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store", "X-Request-Id": crypto.randomUUID() } });
    }),
    http.put("/api/mock/loans/:loanId/consent/state", async ({ params, request }) => apply(linked(params.loanId)!, await body(request), true)),
    http.put("/api/v1/me/communication-preferences", async ({ request }) => {
      reset(); const input = await body(request), item = linked(input.loanId);
      return item ? apply(item, input, false) : problem("Loan not found.", 404);
    }),
    http.get("/api/v1/me/consent-history", ({ request }) => {
      reset(); const search = new URL(request.url).searchParams, id = search.get("loanId");
      if (id && !linked(id)) return problem("Loan not found.", 404);
      const entries = history.filter(entry => entry.personId === personId && (!id || entry.loanId === id));
      return json({ items: entries.slice(-100).reverse(), nextCursor: null });
    }),
    http.post("/api/v1/public/callback-requests", async ({ request }) => {
      reset(); const input = await body(request);
      if (!validName(input.fullName)) return problem(nameValidationMessage);
      if (!validOptionalAccountNumber(input.accountNumber)) return problem(accountNumberValidationMessage);
      if (typeof input.fullName !== "string" || !input.fullName.trim() || input.fullName.length > 100 || typeof input.phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(input.phone) || typeof input.timeZone !== "string" || !["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"].includes(input.timeZone) || !["NEXT_AVAILABLE", "MORNING", "AFTERNOON", "EVENING"].includes(String(input.preferredWindow)) || !["PAYMENT_AUTOPAY", "ACCOUNT_TRANSFER", "STATEMENTS_TAX", "PAYMENT_ASSISTANCE", "OTHER"].includes(String(input.reason)) || input.consentTextVersion !== callbackConsent.version) return problem("Review the callback details and current callback-only permission.");
      const receivedAt = new Date().toISOString();
      const account = store.getLoans().find(item => item.loan.account_number === input.accountNumber || item.loan.rtr_loan_id === input.accountNumber);
      if (account?.demoScenario && demoAccountScenarios[account.demoScenario].contactRestricted) return problem("This callback request cannot be accepted. Use authenticated account assistance for the appropriate contact process.");
      callbacks.push({ consentText: callbackConsent.text, consentTextVersion: callbackConsent.version, receivedAt });
      if (callbacks.length > 100) callbacks.shift();
      // Callback permission is independent of account SMS/automated-call choices.
      return json({ referenceNumber: `MOCK-CALLBACK-${crypto.randomUUID().slice(0, 8)}`, receivedAt }, 201);
    }),
  ];
}
