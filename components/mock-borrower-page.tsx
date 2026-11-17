"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useGetMe } from "@/lib/api/generated/me/me";
import type { Me } from "@/lib/api/generated/model";
import { ApiError } from "@/lib/api/http";
import { loadPortalView, paymentView } from "@/lib/api/borrower-view";
import { getPayment, exportPayments } from "@/lib/api/generated/payments/payments";
import { useQuery } from "@tanstack/react-query";
import { page } from "./portal-ui";
import DashboardOverview from "./dashboard-overview";
import AccountDetails from "./account-details";
import PaymentWizard from "./payment-wizard";
import AutoPayWizard from "./autopay-wizard";
import PaymentHistory, { PaymentHistoryHeading } from "./payment-history";
import PortalBackBar from "./portal-back-bar";
import PortalLogo from "./portal-logo";
import PortalDocuments from "./portal-documents";
import PaymentCancelledView from "./payment-cancelled-view";
import PortalCollectionNotice from "./portal-collection-notice";
import { portalHref } from "@/lib/portal-format";
import { accountCollectionNoticeApproval, approvedCollectionNoticeForLoan } from "@/lib/collection-notice";

type View = "dashboard" | "account" | "payments" | "history" | "documents" | "cancelled";

export default function MockBorrowerPage({ view }: { view: View }) {
  const params = useSearchParams();
  const me = useGetMe<Me, ApiError>();
  // Adding the default loan ID to the URL must not replace the active form.
  const selected = params.get("loan") ?? me.data?.loans[0]?.loanId ?? "";
  const query = useQuery({ queryKey: ["borrower-mock", selected, view], queryFn: ({ signal }) => loadPortalView(selected, view, signal), enabled: me.isSuccess });
  const failure = me.error ?? query.error;
  if (failure) return <main className={page} role="alert"><h1>Unable to open this loan</h1><p>{failure.message}</p><button onClick={() => { void me.refetch(); void query.refetch(); }}>Try again</button><p><Link href="/dashboard">Return to dashboard</Link></p></main>;
  if (!query.isSuccess) return <main className={`${page} tw:flex tw:min-h-[45dvh] tw:items-center tw:justify-center tw:max-mobile:min-h-[55dvh]`} role="status"><span aria-hidden="true"><PortalLogo className="tw:scale-[1.2] tw:max-mobile:scale-110" /></span><span className="tw:sr-only">Loading borrower portal</span></main>;
  const data = query.data;
  const loan = data.loan;
  const collectionNotice = approvedCollectionNoticeForLoan(accountCollectionNoticeApproval, loan.rtr_loan_id);
  const withCollectionNotice = (content: ReactNode) => <>{collectionNotice ? <PortalCollectionNotice notice={collectionNotice} /> : null}{content}</>;
  if (view === "dashboard") {
    const last = data.payments.find(payment => payment.status === "posted");
    return withCollectionNotice(<DashboardOverview name={data.user.first_name} loan={loan} loans={data.loans} lastPayment={last ? { amount: last.amount, paid_date: last.process_date } : null} />);
  }
  if (view === "account") return withCollectionNotice(<AccountDetails key={loan.rtr_loan_id} loan={loan} loans={data.loans} profiles={data.profiles} selfPersonId={data.selfPersonId} apiPreferences={data.preferences} />);
  if (view === "payments") return withCollectionNotice(params.get("tab") === "autopay"
    ? <AutoPayWizard key={loan.rtr_loan_id} loan={loan} banks={data.banks} active={data.autopay} customerId={data.user.customer_id} today={data.today} apiOptions={data.autopayOptions} apiTerms={data.recurringTerms} />
    : <PaymentWizard key={loan.rtr_loan_id} loan={loan} banks={data.banks} scheduled={data.scheduled} today={data.today} apiOptions={data.options} apiTerms={data.terms} />);
  if (view === "documents") return withCollectionNotice(<PortalDocuments loan={loan} documents={data.documents} tab={params.get("tab") === "insurance" || params.get("tab") === "payoff" ? params.get("tab")! : "statements"} />);
  if (view === "cancelled") {
    const payment = params.get("payment") ? data.cancelled.find(item => item.id === params.get("payment")) : data.cancelled[0];
    return withCollectionNotice(payment ? <PaymentCancelledView loan={loan} payment={payment} /> : <main className={page}><PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} /><h1>Cancellation not found</h1><p>Preview changes reset when you reload the page.</p><Link href={portalHref("/dashboard/payments", loan.rtr_loan_id)}>Return to payments</Link></main>);
  }
  return withCollectionNotice(<main className={page}><PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} /><PaymentHistoryHeading loanId={loan.rtr_loan_id} intro="Search past payments, review allocation breakdowns, and print sample payment receipts." /><PaymentHistory key={loan.rtr_loan_id} payments={data.payments} loanId={loan.rtr_loan_id} viewerName={me.data?.displayName ?? ""} loadPayment={async id => paymentView(await getPayment(loan.rtr_loan_id, id), me.data?.displayName)} exportPaymentCsv={(status, q) => exportPayments(loan.rtr_loan_id, { status: status.toUpperCase() as "ALL" | "POSTED" | "PROCESSING", q })} /></main>);
}
