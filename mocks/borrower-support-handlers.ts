import { http, HttpResponse } from "msw";
import type { MockLoanData } from "./borrower-data";
import { demoAccountScenarios, type ServiceRequest } from "@/lib/borrower-support";
import { personId, details } from "./v1-data";

const json = (value: unknown, status = 200) => new HttpResponse(JSON.stringify(value), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Request-Id": crypto.randomUUID() } });
const problem = (detail: string, status = 422) => new HttpResponse(JSON.stringify({ type: "about:blank", title: "Request could not be completed", detail, status, code: "BORROWER_SUPPORT_ERROR" }), { status, headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store", "X-Request-Id": crypto.randomUUID() } });
export function createBorrowerSupportHandlers(store: { getLoans: () => MockLoanData[]; signedIn: () => boolean }) {
  let current = store.getLoans();
  const requests: ServiceRequest[] = [];
  const linked = (id: unknown) => store.getLoans().find(item => item.loan.rtr_loan_id === id && item.profiles.some(profile => profile.customer_id === personId));
  const state = (item: MockLoanData) => {
    const value = details(item), scenario = item.demoScenario ?? "CURRENT";
    return { scenario, contactRestricted: demoAccountScenarios[scenario].contactRestricted, pastDueAmount: value.pastDueAmount, feesOwed: value.feesOwed, totalAmountDue: value.totalAmountDue, daysPastDue: scenario === "PAST_DUE" ? 35 : null, requests: requests.filter(request => request.personId === personId && request.loanId === item.loan.rtr_loan_id).slice().reverse() };
  };
  return [
    http.all("/api/mock/loans/:loanId/support/*", ({ params, request }) => {
      if (current !== store.getLoans()) { current = store.getLoans(); requests.length = 0; }
      if (!store.signedIn() || request.headers.get("Authorization") !== "Bearer mock-borrower-access-token") return problem("Please sign in.", 401);
      if (!linked(params.loanId)) return problem("Loan not found.", 404);
    }),
    http.get("/api/mock/loans/:loanId/support/state", ({ params }) => json(state(linked(params.loanId)!))),
    http.post("/api/mock/loans/:loanId/support/requests", async ({ params, request }) => {
      const body: unknown = await request.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) return problem("Complete the request form.");
      const input = body as Record<string, unknown>;
      if (input.personId !== undefined && input.personId !== personId) return problem("Only your own requests can be submitted.", 403);
      if ((input.type !== "ERROR_NOTICE" && input.type !== "INFORMATION_REQUEST") || typeof input.subject !== "string" || input.subject.trim().length < 3 || input.subject.length > 120 || typeof input.message !== "string" || input.message.trim().length < 10 || input.message.length > 2000) return problem("Provide a subject (3–120 characters) and details (10–2000 characters).");
      if (/\b\d{3}-\d{2}-\d{4}\b|\b\d{12,19}\b/.test(input.message + " " + input.subject)) return problem("Remove full SSNs or account/card numbers from this request.");
      const item = linked(params.loanId)!;
      if (requests.filter(value => value.personId === personId && value.loanId === item.loan.rtr_loan_id).length >= 50) return problem("The demo request limit has been reached. Reload to reset synthetic data.", 429);
      const now = new Date().toISOString(), requestId = crypto.randomUUID();
      const value: ServiceRequest = { requestId, referenceNumber: `MOCK-REQ-${requestId.slice(0, 8).toUpperCase()}`, loanId: item.loan.rtr_loan_id, personId, type: input.type, subject: input.subject.trim(), message: input.message.trim(), status: "RECEIVED", submittedAt: now, updatedAt: now };
      requests.push(value); return json(value, 201);
    }),
    http.get("/api/mock/loans/:loanId/support/requests/:requestId", ({ params }) => {
      const value = requests.find(item => item.requestId === params.requestId && item.loanId === params.loanId && item.personId === personId);
      return value ? json(value) : problem("Request not found.", 404);
    }),
  ];
}
