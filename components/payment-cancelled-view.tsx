import Link from "next/link";
import type { ReactNode } from "react";
import PortalBackBar from "@/components/portal-back-bar";
import { button, cn, page } from "./portal-ui";
import { bankAccountLabel, displayDate, money, portalHref } from "@/lib/portal-format";
import type { PortalLoan } from "@/lib/portal-data";
import type { CancelledPayment } from "@/lib/borrower-types";
import { borrowerMockMode } from "@/lib/mock-mode";

const reminderCard = "tw:rounded-2xl tw:border tw:border-[#e6b69d] tw:bg-white";
const reminderAction = "tw:px-[18px] tw:compact:max-[1301px]:text-[16px] tw:max-compact:px-[18px]";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="tw:flex tw:items-start tw:justify-between tw:gap-5 tw:py-[7px] tw:max-mobile:gap-[15px]"><dt className="tw:text-(--pp-muted)">{label}</dt><dd className="tw:m-0 tw:text-right tw:font-medium tw:max-mobile:max-w-[55%] tw:max-mobile:wrap-anywhere">{children}</dd></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="tw:rounded-2xl tw:border tw:border-[#e6b69d] tw:px-2.5 tw:py-7 tw:text-center tw:max-mobile:rounded-xl tw:max-mobile:px-[5px] tw:max-mobile:py-[18px]"><span className="tw:block tw:text-[12px] tw:whitespace-nowrap tw:text-(--pp-muted) tw:max-mobile:text-[9px]">{label}</span><strong className="tw:text-[21px] tw:font-medium tw:whitespace-nowrap tw:text-[#0078b4] tw:max-mobile:text-[13px]">{value}</strong></div>;
}

export default function PaymentCancelledView({ loan, payment }: { loan: PortalLoan; payment: CancelledPayment }) {
  const dueDate = payment.still_due?.dueDate ?? loan.account_due_date;
  const due = dueDate ? new Date(dueDate) : null;
  const grace = payment.still_due?.lastDayBeforeLateFee;
  const dueMonth = due ? new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(due) : "scheduled";
  return <main className={page}>
    <PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} fullLabel />
    <div className="tw:mt-16 tw:grid tw:grid-cols-[1fr_1fr] tw:gap-5 tw:max-compact:mt-0 tw:max-compact:grid-cols-[1fr]">
      <section className="tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-[68px] tw:py-[52px] tw:compact:max-[1301px]:px-[38px] tw:max-compact:p-10 tw:max-mobile:px-[22px] tw:max-mobile:py-7">
        <h1 className="tw:mb-4 tw:text-[28px] tw:leading-[1.25] tw:font-medium tw:tracking-[-1px] tw:max-mobile:text-[26px] tw:max-mobile:leading-[1.2] tw:max-mobile:tracking-[-0.7px]">Payment Cancelled</h1>
        <p className="tw:text-[18px] tw:leading-[1.8] tw:text-(--pp-muted) tw:max-compact:text-[16px] tw:max-mobile:text-[14px]">Your scheduled ACH draft of {money(payment.amount)} for {displayDate(payment.process_date, true)} has been cancelled. No funds will be withdrawn from {bankAccountLabel(payment.bank_name, payment.account_last4)}.</p>
        <h2 className="tw:mt-9 tw:border-b tw:border-b-[#c5c9ce] tw:pb-3.5 tw:text-[22px] tw:font-medium tw:max-mobile:mt-7 tw:max-mobile:text-[20px]">Cancellation Details</h2>
        <dl className="tw:mt-[22px] tw:mb-0 tw:text-[14px] tw:max-mobile:text-[11px]">
          <Detail label="Cancelled payment">{money(payment.amount)} Scheduled ACH Draft</Detail>
          <Detail label="Original draft date">{displayDate(payment.process_date, true)}</Detail>
          <Detail label="Funding account">{bankAccountLabel(payment.bank_name, payment.account_last4)}</Detail>
          <Detail label="Cancellation confirmation #">{payment.cancellation_confirmation_number ?? "—"}</Detail>
          <Detail label="Cancelled on">{payment.cancelled_at ? `${displayDate(payment.cancelled_at)} · ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short" }).format(new Date(payment.cancelled_at))}` : "—"}</Detail>
        </dl>
      </section>
      <section className="tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-[#fff5ef] tw:px-11 tw:py-7 tw:shadow-[0_12px_32px_#8d4a2010] tw:compact:max-[1301px]:px-6 tw:max-compact:p-7 tw:max-mobile:px-3 tw:max-mobile:py-4">
        <div className={cn(reminderCard, "tw:mb-2.5 tw:flex tw:items-center tw:gap-4 tw:px-[30px] tw:py-5 tw:compact:max-[1301px]:px-[18px] tw:max-mobile:gap-3 tw:max-mobile:px-3.5 tw:max-mobile:py-4")}>
          <span className="tw:grid tw:size-[60px] tw:flex-[0_0_60px] tw:place-items-center tw:rounded-2xl tw:border tw:border-[#edbda4] tw:text-[#d95700] tw:shadow-[0_5px_20px_#aa774112] tw:max-mobile:h-12 tw:max-mobile:w-11 tw:max-mobile:basis-11"><svg className="tw:size-7 tw:fill-none tw:stroke-current tw:stroke-[1.3]" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 10h16M8 3v5m8-5v5" /></svg></span>
          <div><span className="tw:text-[12px] tw:text-[#a94a00]">Payment Reminder</span><h2 className="tw:text-[26px] tw:leading-[1.3] tw:font-medium tw:tracking-[-.8px] tw:max-mobile:text-[20px]">Your {dueMonth} payment is still due</h2></div>
        </div>
        <div className={cn(reminderCard, "tw:px-[30px] tw:pt-7 tw:pb-8 tw:max-mobile:px-3.5 tw:max-mobile:py-[18px]")}>
          <div className="tw:grid tw:grid-cols-[repeat(3,1fr)] tw:gap-3 tw:max-mobile:gap-[7px]">
            <Stat label="Amount due" value={money(payment.still_due?.amount ?? loan.account_total_due)} />
            <Stat label="Payment due date" value={displayDate(dueDate)} />
            <Stat label="Late-fee date" value={!borrowerMockMode && grace ? displayDate(grace) : "Not verified"} />
          </div>
          <p className="tw:my-[30px] tw:text-[18px] tw:leading-[1.8] tw:text-[#233958] tw:max-compact:text-[16px] tw:max-mobile:my-6 tw:max-mobile:text-[14px]">Cancelling this draft does not extend your payment due date. {borrowerMockMode ? <>This preview does not verify your loan&apos;s late-fee date. Contact Customer Solutions for the terms that apply to your loan.</> : grace ? <>The last day before a late fee may apply is <strong className="tw:text-[#101b2c]">{displayDate(grace, true)}</strong>.</> : <>Late-fee timing is not available here. Contact Customer Solutions for the terms that apply to your loan.</>} You can make a one-time payment or review your AutoPay options.</p>
          <div className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-2 tw:max-mobile:grid-cols-[1fr] tw:max-mobile:gap-2.5">
            <Link className={cn(button.base, button.primary, reminderAction)} href={portalHref("/dashboard/payments", loan.rtr_loan_id)}>Make a Payment Now</Link>
            <Link className={cn(button.base, button.outline, reminderAction)} href={portalHref("/dashboard/payments", loan.rtr_loan_id, { tab: "autopay" })}>Set Up AutoPay</Link>
          </div>
        </div>
      </section>
    </div>
    <p className="tw:mt-10 tw:text-center tw:text-[14px] tw:text-(--pp-muted) tw:max-mobile:mt-7 tw:max-mobile:text-[12px]">Cancelled by mistake? Schedule a new payment anytime, or call us at <a className="tw:text-(--pp-blue)" href={`tel:${loan.servicing_phone?.replace(/[^+\d]/g, "")}`}>{loan.servicing_phone}</a>.</p>
  </main>;
}
