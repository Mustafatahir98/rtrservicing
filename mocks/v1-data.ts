import type { Address, Autopay, AuthorizationTerms, BankAccount, CommunicationPreferences, Document as ApiDocument, LoanDetails, LoanListItem, LoanSummary, PaymentDetail, PaymentListItem, PaymentOptions, Profile, ScheduledPayment as ApiScheduledPayment } from "@/lib/api/generated/model";
import type { MockLoanData } from "./borrower-data";
import { paymentActorLabel } from "@/lib/portal-format";
import { demoAccountScenarios } from "@/lib/borrower-support";
import type { PortalPayment } from "@/lib/portal-data";
import { centsAmount, inputCents, paymentToday } from "@/lib/payment-types";
import { demoPaymentMaximum } from "@/lib/demo-payment-rules";

export const personId = "mock-borrower";
// Synthetic servicing terms for the two demo fixtures; these are not RTR's production policies.
const demoLoanTerms: Record<string, { graceDays: number; lateFeeAmount: string; paymentFee: string; maximumTotalAmount: string }> = {
  "100849201": { graceDays: 15, lateFeeAmount: "45.00", paymentFee: "0.00", maximumTotalAmount: demoPaymentMaximum["100849201"] },
  "100849202": { graceDays: 10, lateFeeAmount: "25.00", paymentFee: "0.00", maximumTotalAmount: demoPaymentMaximum["100849202"] },
};
export const address = (data: MockLoanData): Address => ({ line1: data.loan.property_address_line1 ?? "", line2: null, city: data.loan.property_city ?? "", state: data.loan.property_state ?? "", postalCode: data.loan.property_zip ?? "" });
export function loanItem(data: MockLoanData): LoanListItem {
  const status: LoanListItem["status"] = data.demoScenario === "PAST_DUE" ? "PAST_DUE" : data.demoScenario && demoAccountScenarios[data.demoScenario].contactRestricted ? "ASSISTANCE_REQUIRED" : data.loan.servicing_status === "closed" ? "CLOSED" : data.loan.servicing_status === "grace" ? "IN_GRACE_PERIOD" : data.loan.servicing_status === "delinquent" ? "PAST_DUE" : "CURRENT";
  return { loanId: data.loan.rtr_loan_id, loanType: `${data.loan.asset_class}${data.loan.loan_position ? ` (${data.loan.loan_position})` : ""}`, propertyAddressShort: data.loan.property_address_line1 ?? "", role: "PRIMARY_BORROWER", status };
}
export function summary(data: MockLoanData): LoanSummary {
  const loan = data.loan, item = loanItem(data), last = data.payments.find(payment => payment.status === "posted");
  return {
    loanId: item.loanId, loanType: item.loanType, propertyAddress: address(data), status: item.status, assistanceUrl: item.status === "ASSISTANCE_REQUIRED" || item.status === "PAST_DUE" ? "/contact" : null,
    pastDue: data.demoScenario === "PAST_DUE" ? { amount: loan.account_payment_amount ?? "0.00", daysPastDue: 35 } : null,
    nextPayment: { amount: loan.account_payment_amount ?? "0.00", dueDate: loan.account_due_date ?? paymentToday(), breakdown: { principal: loan.current_payment_principal ?? "0.00", interest: loan.current_payment_interest ?? "0.00", escrow: loan.current_payment_escrow ?? "0.00", fees: "0.00", additionalPrincipal: "0.00", total: loan.account_payment_amount ?? "0.00" } },
    lastPayment: last ? { amount: last.amount, postedDate: last.process_date } : null,
    balance: { principalBalance: loan.current_balance ?? "0.00", originalAmount: loan.original_balance ?? "0.00" },
    terms: { interestRate: loan.annual_interest_rate ?? "0", rateType: "FIXED", monthlyPayment: loan.account_payment_amount ?? "0.00", maturityDate: loan.maturity_date ?? "" },
    autopay: { enrolled: Boolean(data.autopay), description: data.autopay?.frequency ?? null }, dataAsOf: new Date().toISOString(),
  };
}
export function details(data: MockLoanData): LoanDetails {
  const loan = data.loan;
  return { loanId: loan.rtr_loan_id, rtrLoanNumber: loan.account_number, previousLoanNumber: null, loanType: loanItem(data).loanType, status: loanItem(data).status,
    totalAmountDue: loan.account_total_due ?? "0.00", pastDueAmount: data.demoScenario === "PAST_DUE" ? loan.account_payment_amount ?? "0.00" : "0.00", feesOwed: data.demoScenario === "PAST_DUE" ? paymentOptions(data).lateFee.amount : "0.00", nextDueDate: loan.account_due_date ?? paymentToday(),
    principalBalance: loan.current_balance ?? "0.00", originalAmount: loan.original_balance ?? "0.00", principalPaidToDate: centsAmount((inputCents(loan.original_balance) ?? 0) - (inputCents(loan.current_balance) ?? 0)),
    interestRate: loan.annual_interest_rate ?? "0", rateType: "FIXED", originationDate: loan.origination_date, maturityDate: loan.maturity_date ?? "", propertyAddress: address(data), servicingPhone: loan.servicing_phone ?? "", lateFeeRule: `Synthetic preview: a late fee may apply after ${paymentOptions(data).lateFee.appliesAfter}.`, prepaymentPenalty: false };
}
export const bankAccounts = (data: MockLoanData): BankAccount[] => data.banks.map((bank, index) => ({ bankAccountId: bank.id, bankName: bank.bank_name, accountType: bank.account_type === "checking" ? "CHECKING" : "SAVINGS", last4: bank.account_last4, isPrimary: index === 0 }));
export function paymentItem(payment: PortalPayment, viewerName: string): PaymentListItem {
  return { paymentId: payment.id, date: payment.process_date, amount: payment.amount, status: payment.status.toUpperCase() as PaymentListItem["status"], confirmationNumber: payment.confirmation_number, madeBy: payment.initiated_by === viewerName ? viewerName : payment.initiated_by === "Ahsan Khan" ? "Co-borrower" : paymentActorLabel(payment.initiated_by) };
}
export function paymentDetail(payment: PortalPayment, viewerName: string): PaymentDetail {
  return { ...paymentItem(payment, viewerName), allocation: payment.status === "posted" ? { principal: payment.principal_amount, interest: payment.interest_amount, escrow: payment.escrow_amount, fees: payment.fees_amount, additionalPrincipal: payment.additional_principal_amount, total: payment.amount } : null,
    appliedToDueDate: payment.applied_to, postedDate: payment.posted_at?.slice(0, 10) ?? null, paidFrom: `${payment.bank_name} Checking ending ${payment.account_last4}`, returnReason: null };
}
export const scheduledPayments = (data: MockLoanData): ApiScheduledPayment[] => data.scheduled.map(payment => ({ paymentId: payment.id, amount: payment.amount, draftDate: payment.process_date, bankAccount: bankAccounts(data).find(bank => bank.last4 === payment.account_last4) ?? bankAccounts(data)[0], status: "SCHEDULED", changeableUntil: `${payment.process_date}T00:00:00Z`, source: "ONE_TIME" }));
export function paymentOptions(data: MockLoanData): PaymentOptions {
  const loan = data.loan, today = paymentToday(), terms = demoLoanTerms[loan.rtr_loan_id];
  const grace = new Date(`${loan.account_due_date ?? today}T00:00:00Z`);
  grace.setUTCDate(grace.getUTCDate() + terms.graceDays);
  const gracePeriodEndDate = grace.toISOString().slice(0, 10);
  return { amountOptions: [
    { type: "REGULAR", label: "Regular Payment", amount: loan.account_payment_amount ?? "0.00", note: `Due ${loan.account_due_date}`, payoffQuoteId: null },
    { type: "TOTAL_DUE", label: "Total Amount Due", amount: loan.account_total_due ?? "0.00", note: null, payoffQuoteId: null },
  ], dateOptions: { earliestDate: today, latestDate: gracePeriodEndDate, dueDate: loan.account_due_date ?? today, blockedDates: [] }, sameDayCutoff: `${today}T23:59:59Z`, gracePeriodEndDate,
    lateFee: { amount: terms.lateFeeAmount, appliesAfter: gracePeriodEndDate }, customAmountLimits: { min: "0.01", max: terms.maximumTotalAmount }, maximumTotalAmount: terms.maximumTotalAmount, additionalPrincipalAllowed: true, paymentFee: terms.paymentFee };
}
export function authorization(type: "ONE_TIME" | "RECURRING"): AuthorizationTerms {
  const version = type === "RECURRING" ? "demo-ach-recurring-v2" : "demo-ach-one_time-v1";
  return { type, version, text: type === "ONE_TIME" ? "I authorize this simulated ACH payment of {amount} from my account ending {last4} on {date}. No real funds will be withdrawn." : "I authorize simulated recurring ACH debits of {amount} from my account ending {last4}, {schedule}, starting {date}. No real funds will be withdrawn.", revocationText: type === "RECURRING" ? "Demo only. To cancel this simulated recurring authorization, open Make & Schedule Payments, select AutoPay, choose Turn off AutoPay, and confirm. Separately scheduled one-time payments must be reviewed and cancelled separately. Your loan payments remain due. Download your authorization copy before or after saving during this visit; this demo does not send email copies." : "Demo only. Scheduled drafts can be cancelled in this preview." };
}
export function autopay(data: MockLoanData): Autopay {
  const active = data.autopay;
  return { enrolled: Boolean(active), schedule: active ? { frequency: active.frequency.toUpperCase() as NonNullable<Autopay["schedule"]>["frequency"], firstDraftDate: active.anchor_date ?? active.next_draft_date, secondDayOfMonth: active.second_day } : null,
    amountPerDraft: active?.amount ?? null, bankAccount: active ? bankAccounts(data).find(bank => bank.bankAccountId === active.funding_account_id) ?? null : null, nextDraftDate: active?.next_draft_date ?? null, authorizationAcceptedAt: active ? new Date().toISOString() : null,
    allowedFrequencies: ["MONTHLY", "SEMI_MONTHLY", "BIWEEKLY", "WEEKLY"], allowedDays: { from: 1, to: 16 }, weekdayRules: { weekly: [1, 2, 3, 4, 5], biweekly: [5] } };
}
export function profile(data: MockLoanData): Profile {
  const self = data.profiles.find(item => item.customer_id === personId)!;
  return { personId, fullName: `${self.first_name} ${self.last_name}`, dateOfBirthMasked: self.has_date_of_birth ? "**/**/****" : null,
    mailingAddress: { line1: self.mail_address_line1, line2: self.mail_address_line2 || null, city: self.mail_city, state: self.mail_state, postalCode: self.mail_zip }, phones: [{ number: `+1${self.primary_phone.replace(/\D/g, "").slice(-10)}`, type: self.primary_phone_type === "Cell" ? "MOBILE" : "HOME" }], email: self.contact_email, pendingChanges: [] };
}
const channels = ["EMAIL", "ESTATEMENTS", "SMS", "AUTOMATED_VOICE"] as const;
const fields = ["email_consent", "estatement_consent", "sms_consent", "prerecorded_consent"] as const;
export function preferences(data: MockLoanData): CommunicationPreferences {
  const self = data.profiles.find(item => item.customer_id === personId)!;
  const wording = ["Demo: Receive servicing correspondence by email. This choice does not enroll paper-free statements.", "Demo: Receive periodic statements electronically for this loan after separate E-SIGN acceptance. Turn this choice off to withdraw paper-free enrollment.", "Demo: Receive servicing reminders and alerts by SMS at your contact number. This is optional and separate from automated calls; turn this choice off to revoke it.", "Demo: Receive automated servicing calls at your contact number. This is optional and separate from SMS; turn this choice off to revoke it."];
  return { loanId: data.loan.rtr_loan_id, choices: channels.map((channel, index) => ({ channel, enabled: self[fields[index]] === true, label: ["Email Correspondence", "Electronic Statements (E-SIGN)", "SMS Notifications & Alerts", "Automated Voice / Virtual Agent"][index], consentText: wording[index], consentTextVersion: `demo-${channel}-v2`, editable: !(data.demoScenario && demoAccountScenarios[data.demoScenario].contactRestricted && (channel === "SMS" || channel === "AUTOMATED_VOICE")), requiresDisclosure: channel === "ESTATEMENTS" ? "ESIGN_DISCLOSURE" : null })), restrictions: data.demoScenario && demoAccountScenarios[data.demoScenario].contactRestricted ? [{ code: data.demoScenario === "BANKRUPTCY_REVIEW" ? "BANKRUPTCY" : data.demoScenario === "ATTORNEY_REVIEW" ? "ATTORNEY_REPRESENTED" : "CEASE_COMMUNICATION", message: "Contact restrictions override saved choices in this synthetic account. SMS and automated-call preferences are locked pending specialist review." }] : [], lastChangedAt: self.consent_updated_at };
}
export const documents = (data: MockLoanData): ApiDocument[] => data.documents.map(document => ({ documentId: document.id, category: document.document_type === "statement" ? "STATEMENT" : document.document_type === "form_1098" ? "TAX_FORM" : document.document_type === "insurance" ? "INSURANCE" : "PAYOFF_QUOTE", title: document.title, documentDate: document.document_date, taxYear: document.tax_year, sizeBytes: document.file_size_bytes ?? 0, contentType: "application/pdf" }));
