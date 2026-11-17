import type { PortalLoan, PortalPayment } from "@/lib/portal-data";
import type { BorrowerProfile, PortalDocument, CancelledPayment } from "@/lib/borrower-types";
import type { FundingAccount, ScheduledPayment } from "@/lib/payment-types";
import type { AutoPayRecord } from "@/lib/autopay";
import type { DemoAccountScenario } from "@/lib/borrower-support";
import { publicSiteInfo } from "@/lib/public-site-info";
import { paymentToday } from "@/lib/payment-types";
import { demoLogin } from "@/lib/demo-login";

export { demoLogin } from "@/lib/demo-login";
export type MockLoanData = {
  demoScenario?: DemoAccountScenario;
  loan: PortalLoan;
  profiles: BorrowerProfile[];
  payments: PortalPayment[];
  banks: FundingAccount[];
  scheduled: ScheduledPayment[];
  autopay: AutoPayRecord | null;
  documents: PortalDocument[];
  cancelled: CancelledPayment[];
};
export type MockPortalData = MockLoanData & {
  loans: PortalLoan[];
  user: { first_name: string; customer_id: string };
  today: string;
};

// Synthetic UI fixtures, using the FRD/API examples' monetary string convention.
// They are deliberately unrelated to the local database or real borrower records.
export function createMockLoans(): MockLoanData[] {
  const today = paymentToday();
  const current = new Date(`${today}T00:00:00Z`);
  // Keep the demo's next installment on an upcoming first of the month.
  const due = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + (current.getUTCDate() > 1 ? 1 : 0), 1)).toISOString().slice(0, 10);
  const previous = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const loan: PortalLoan = {
    rtr_loan_id: "100849201", account_number: "RTR-100849", asset_class: "Mortgage", loan_position: "First Lien",
    property_address_line1: "742 Example Lane", property_city: "Beverly Hills", property_state: "CA", property_zip: "90210",
    account_payment_amount: "2450.00", account_total_due: "2450.00", account_due_date: due,
    current_balance: "348250.42", original_balance: "380000.00", annual_interest_rate: "5.875",
    origination_date: "2022-10-01", maturity_date: "2052-10-01", servicing_phone: publicSiteInfo.phone.label,
    current_payment_principal: "545.20", current_payment_interest: "1704.80", current_payment_escrow: "200.00",
    account_payoff: "349100.00", servicing_status: "current",
  };
  const profiles: BorrowerProfile[] = ["primary", "co_borrower"].map((role, index) => ({
    customer_id: index ? "mock-co-borrower" : "mock-borrower", borrower_role: role as BorrowerProfile["borrower_role"],
    first_name: index ? "Ahsan" : "Mustafa", last_name: index ? "Khan" : "Tahir", has_date_of_birth: true,
    mail_address_line1: "742 Example Lane", mail_address_line2: "", mail_city: "Beverly Hills", mail_state: "CA", mail_zip: "90210",
    primary_phone: "(555) 010-0100", primary_phone_type: "Cell", contact_email: index ? "co.borrower@example.com" : demoLogin.email,
    email_consent: true, estatement_consent: false, sms_consent: false, prerecorded_consent: false,
    consent_updated_at: null, updated_at: `${today}T12:00:00Z`,
  }));
  const banks: FundingAccount[] = [{ id: "00000000-0000-4000-8000-000000000001", bank_name: "Community Bank", account_type: "checking", account_last4: "6789" }];
  const payments: PortalPayment[] = ["posted", "processing"].map((status, index) => ({
    id: `mock-payment-${index}`, confirmation_number: `MOCK-PAY-${index + 1}`, amount: "2450.00", process_date: index ? today : previous, status,
    principal_amount: "545.20", interest_amount: "1704.80", escrow_amount: "200.00", fees_amount: "0.00", additional_principal_amount: "0.00",
    posted_at: index ? null : `${previous}T12:00:00Z`, initiated_by: "Mustafa Tahir", bank_name: banks[0].bank_name, account_last4: banks[0].account_last4, applied_to: due,
  }));
  const documents: PortalDocument[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - index, 1)).toISOString().slice(0, 10);
    return { id: `mock-statement-${index}`, document_type: "statement", title: `Monthly statement ${date}`, document_date: date, file_size_bytes: 1024, tax_year: null };
  });
  documents.push({ id: "mock-tax", document_type: "form_1098", title: "Form 1098", document_date: `${current.getUTCFullYear()}-01-31`, file_size_bytes: 1024, tax_year: current.getUTCFullYear() - 1 });
  const first: MockLoanData = { loan, profiles, payments, banks, documents, autopay: null, cancelled: [], scheduled: [] };
  const second = structuredClone(first);
  second.loan = {
    ...loan, rtr_loan_id: "100849202", account_number: "RTR-100850", asset_class: "Home Equity Loan", loan_position: "Second Lien",
    account_payment_amount: "725.00", account_total_due: "725.00", current_balance: "48200.00", original_balance: "60000.00",
    annual_interest_rate: "7.25", current_payment_principal: "333.79", current_payment_interest: "291.21", current_payment_escrow: "100.00",
    account_payoff: "48320.00", origination_date: "2023-06-01", maturity_date: "2033-06-01",
  };
  second.profiles = second.profiles.filter(profile => profile.borrower_role === "primary");
  second.payments = second.payments.map(payment => ({
    ...payment, amount: "725.00", principal_amount: "333.79", interest_amount: "291.21", escrow_amount: "100.00",
  }));
  return [first, second];
}
