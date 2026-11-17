import { getMe } from "./generated/me/me";
import { getLoanDetails, getLoanSummary, listLoanPeople } from "./generated/loans/loans";
import { getAutopay } from "./generated/auto-pay/auto-pay";
import { listBankAccounts } from "./generated/bank-accounts/bank-accounts";
import { listDocuments } from "./generated/documents/documents";
import { getAuthorizationTerms, getPaymentOptions, listPayments, listScheduledPayments } from "./generated/payments/payments";
import { getMyProfile } from "./generated/profile/profile";
import { getCommunicationPreferences } from "./generated/preferences/preferences";
import type { AuthorizationTerms, Autopay, BankAccount, CommunicationPreferences, LoanDetails, LoanListItem, LoanPerson, LoanSummary, PaymentDetail, PaymentListItem, PaymentOptions, Profile } from "./generated/model";
import type { PortalLoan, PortalPayment } from "@/lib/portal-data";
import type { BorrowerProfile, CancelledPayment } from "@/lib/borrower-types";
import type { MockPortalData } from "@/mocks/borrower-data";
import type { AutoPayRecord } from "@/lib/autopay";
import { ApiError } from "./http";
import { paymentToday } from "@/lib/payment-types";
import { bankDisplayName, bankLast4, paymentActorLabel } from "@/lib/portal-format";

export type PortalView = "dashboard" | "account" | "payments" | "history" | "documents" | "cancelled";
export type PortalApiView = MockPortalData & { preferences?: CommunicationPreferences; options?: PaymentOptions; terms?: AuthorizationTerms; recurringTerms?: AuthorizationTerms; autopayOptions?: Autopay; selfPersonId: string };
// A cancellation response can be displayed during client navigation. The spec has no GET cancellation-receipt operation.
export const cancellationReceipts = new Map<string, CancelledPayment>();
function loanView(item: LoanListItem, summary?: LoanSummary, details?: LoanDetails, options?: PaymentOptions): PortalLoan {
  const property = details?.propertyAddress ?? summary?.propertyAddress;
  return { rtr_loan_id: item.loanId, account_number: details?.rtrLoanNumber ?? item.loanId, asset_class: item.loanType, loan_position: null,
    property_address_line1: property?.line1 ?? item.propertyAddressShort, property_city: property?.city ?? null, property_state: property?.state ?? null, property_zip: property?.postalCode ?? null,
    account_payment_amount: summary?.nextPayment.amount ?? null, account_total_due: details?.totalAmountDue ?? null, account_due_date: details?.nextDueDate ?? summary?.nextPayment.dueDate ?? null,
    current_balance: details?.principalBalance ?? summary?.balance.principalBalance ?? null, original_balance: details?.originalAmount ?? summary?.balance.originalAmount ?? null, annual_interest_rate: details?.interestRate ?? summary?.terms.interestRate ?? null,
    origination_date: details?.originationDate ?? null, maturity_date: details?.maturityDate ?? summary?.terms.maturityDate ?? null, servicing_phone: details?.servicingPhone ?? null,
    current_payment_principal: summary?.nextPayment.breakdown.principal ?? null, current_payment_interest: summary?.nextPayment.breakdown.interest ?? null, current_payment_escrow: summary?.nextPayment.breakdown.escrow ?? null,
    account_payoff: options?.amountOptions.find(option => option.type === "PAYOFF")?.amount ?? null, servicing_status: item.status.toLowerCase() };
}
export function paymentView(payment: PaymentListItem | PaymentDetail, viewerName?: string): PortalPayment {
  const detail = "allocation" in payment ? payment : undefined;
  // paidFrom is free text in the contract. Only accept an explicitly masked
  // suffix; do not render the entire value as a bank label.
  const paidFrom = detail?.paidFrom?.match(/^(.*?)\s+(?:ending\s+|[•*·]+\s*)(\d{4})$/i);
  return { id: payment.paymentId, confirmation_number: payment.confirmationNumber, amount: payment.amount, process_date: payment.date, status: payment.status.toLowerCase(),
    principal_amount: detail?.allocation?.principal ?? "0.00", interest_amount: detail?.allocation?.interest ?? "0.00", escrow_amount: detail?.allocation?.escrow ?? "0.00", fees_amount: detail?.allocation?.fees ?? "0.00", additional_principal_amount: detail?.allocation?.additionalPrincipal ?? "0.00",
    posted_at: detail?.postedDate ?? null, initiated_by: paymentActorLabel(payment.madeBy, viewerName), bank_name: bankDisplayName(paidFrom?.[1]), account_last4: bankLast4(paidFrom?.[2]), applied_to: detail?.appliedToDueDate ?? null, allocation_pending: Boolean(detail && detail.allocation === null), return_reason: detail?.returnReason ?? null };
}
function profileView(person: LoanPerson, self: Profile, preferences?: CommunicationPreferences): BorrowerProfile {
  const own = person.personId === self.personId, names = person.displayName.trim().split(/\s+/), address = own ? self.mailingAddress : undefined;
  const enabled = (channel: string) => own && Boolean(preferences?.choices.find(choice => choice.channel === channel)?.enabled);
  return { customer_id: person.personId, borrower_role: person.role === "PRIMARY_BORROWER" ? "primary" : "co_borrower", first_name: names[0] ?? "", last_name: names.slice(1).join(" "), has_date_of_birth: own && Boolean(self.dateOfBirthMasked),
    mail_address_line1: address?.line1 ?? "", mail_address_line2: address?.line2 ?? "", mail_city: address?.city ?? "", mail_state: address?.state ?? "", mail_zip: address?.postalCode ?? "",
    primary_phone: own ? self.phones[0]?.number ?? "" : "", primary_phone_type: own && self.phones[0]?.type === "MOBILE" ? "Cell" : "Land Line", contact_email: own ? self.email : "",
    email_consent: enabled("EMAIL"), estatement_consent: enabled("ESTATEMENTS"), sms_consent: enabled("SMS"), prerecorded_consent: enabled("AUTOMATED_VOICE"), consent_updated_at: own ? preferences?.lastChangedAt ?? null : null, updated_at: "" };
}
export function autopayView(value: Autopay, personId: string): AutoPayRecord | null {
  if (!value.enrolled || !value.schedule || !value.bankAccount || !value.amountPerDraft || !value.nextDraftDate) return null;
  return { id: "current-autopay", customer_id: personId, funding_account_id: value.bankAccount.bankAccountId, frequency: value.schedule.frequency.toLowerCase() as AutoPayRecord["frequency"], first_day: Number(value.schedule.firstDraftDate.slice(8, 10)), second_day: value.schedule.secondDayOfMonth ?? null, anchor_date: value.schedule.firstDraftDate, amount: value.amountPerDraft, next_draft_date: value.nextDraftDate, bank_name: value.bankAccount.bankName, account_last4: value.bankAccount.last4 };
}
const fundingView = (bank: BankAccount) => ({ id: bank.bankAccountId, bank_name: bank.bankName, account_type: bank.accountType.toLowerCase(), account_last4: bank.last4 });
export async function loadPortalView(selected: string, view: PortalView, signal: AbortSignal): Promise<PortalApiView> {
  const request = { signal }, me = await getMe(request), item = me.loans.find(loan => loan.loanId === (selected || me.loans[0]?.loanId));
  if (!item) throw new ApiError({ type: "about:blank", title: "Loan not found", status: 404, code: "LOAN_NOT_FOUND" });
  const id = item.loanId;
  const [summary, details] = await Promise.all([getLoanSummary(id, request), getLoanDetails(id, request)]);
  const data: PortalApiView = { loan: loanView(item, summary, details), loans: me.loans.map(loan => loan.loanId === id ? loanView(item, summary, details) : loanView(loan)), user: { first_name: me.firstName ?? me.displayName.split(" ")[0], customer_id: me.userId }, selfPersonId: me.userId, today: paymentToday(), profiles: [], payments: [], banks: [], documents: [], autopay: null, scheduled: [], cancelled: [...cancellationReceipts.entries()].filter(([key]) => key.startsWith(`${id}:`)).map(([, receipt]) => receipt) };
  if (summary.lastPayment?.amount && summary.lastPayment.postedDate) data.payments = [paymentView({ paymentId: "last-posted", amount: summary.lastPayment.amount, date: summary.lastPayment.postedDate, status: "POSTED", confirmationNumber: "", madeBy: me.displayName }, me.displayName)];
  if (view === "account") {
    const [people, self, preferences] = await Promise.all([listLoanPeople(id, request), getMyProfile(request), getCommunicationPreferences({ loanId: id }, request)]);
    data.selfPersonId = self.personId; data.preferences = preferences; data.profiles = people.items.map(person => profileView(person, self, preferences));
    const options = await getPaymentOptions(id, request); data.loan.account_payoff = options.amountOptions.find(option => option.type === "PAYOFF")?.amount ?? null;
  }
  if (view === "payments") {
    const [options, banks, scheduled, active, terms, recurringTerms] = await Promise.all([getPaymentOptions(id, request), listBankAccounts(id, request), listScheduledPayments(id, request), getAutopay(id, request), getAuthorizationTerms(id, { type: "ONE_TIME" }, request), getAuthorizationTerms(id, { type: "RECURRING" }, request)]);
    data.options = options; data.terms = terms; data.recurringTerms = recurringTerms; data.autopayOptions = active; data.loan = loanView(item, summary, details, options); data.banks = banks.items.map(fundingView); data.autopay = autopayView(active, me.userId);
    data.scheduled = scheduled.items.map(payment => ({ id: payment.paymentId, amount: payment.amount, process_date: payment.draftDate, bank_name: payment.bankAccount.bankName, account_last4: payment.bankAccount.last4, confirmation_number: payment.paymentId }));
  }
  if (view === "history") {
    data.payments = []; let cursor: string | undefined; const seen = new Set<string>();
    do { const page = await listPayments(id, { limit: 100, ...(cursor ? { cursor } : {}) }, request); data.payments.push(...page.items.map(payment => paymentView(payment, me.displayName))); cursor = page.nextCursor ?? undefined; if (cursor && (seen.has(cursor) || seen.size >= 20)) throw new ApiError({ type: "about:blank", title: "Unable to load payment history", status: 502, code: "INVALID_PAGINATION" }); if (cursor) seen.add(cursor); } while (cursor);
  }
  if (view === "documents") {
    const page = await listDocuments(id, undefined, request); data.documents = page.items.map(document => ({ id: document.documentId, document_type: document.category === "STATEMENT" ? "statement" : document.category === "TAX_FORM" ? "form_1098" : document.category.toLowerCase(), title: document.title, document_date: document.documentDate, file_size_bytes: document.sizeBytes, tax_year: document.taxYear ?? null }));
  }
  return data;
}
