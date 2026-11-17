"use client";
import { button, cn } from "./portal-ui";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { PortalLoan } from "@/lib/portal-data";
import { displayDate, money, portalHref } from "@/lib/portal-format";

const card = "tw:rounded-2xl tw:bg-white tw:px-12 tw:py-[38px] tw:max-compact:p-8 tw:max-mobile:mb-6";
const cardTitle = "tw:mb-[5px] tw:text-[16px] tw:font-medium tw:text-[#006aa6] tw:max-mobile:mb-4 tw:max-mobile:text-[20px]";
const summaryColumns = "tw:grid tw:grid-cols-[.9fr_1.1fr] tw:max-compact:grid-cols-[1fr_1.2fr] tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4";
const summaryPrimary = "tw:border-r tw:border-r-[#c7cccf] tw:pr-[38px] tw:pl-[34px] tw:max-compact:pr-6 tw:max-compact:pl-0 tw:max-mobile:w-full tw:max-mobile:border-r-0 tw:max-mobile:p-0";
const summarySecondary = "tw:flex tw:flex-col tw:justify-center tw:pl-22 tw:max-compact:pl-8 tw:max-mobile:mt-6 tw:max-mobile:w-full tw:max-mobile:border-t tw:max-mobile:border-t-[#c1c5c8] tw:max-mobile:pt-4 tw:max-mobile:pl-0";
const amount = "tw:mb-2 tw:block tw:text-[52px] tw:leading-[1.15] tw:font-medium tw:tracking-[-2px] tw:text-[#006da8] tw:max-compact:text-[42px] tw:max-mobile:text-[clamp(32px,11.8vw,48px)] tw:max-mobile:leading-[1.1] tw:max-mobile:tracking-[-1.5px] tw:max-mobile:break-words";
const disclosure = "tw:mt-4 tw:items-center tw:gap-[3px] tw:border-none tw:bg-transparent tw:p-0 tw:text-[12px] tw:max-mobile:mt-6 tw:max-mobile:text-[14px]";
const breakdown = "tw:mt-6 tw:mb-[6px] tw:rounded-2xl tw:bg-[#e6f7ff] tw:px-[38px] tw:py-6 tw:text-[14px] tw:text-[#3b4e63] tw:max-mobile:rounded-[12px] tw:max-mobile:p-5 tw:max-mobile:text-[16px]";
const breakdownRow = "tw:flex tw:justify-between tw:gap-4 tw:py-[5px] tw:max-mobile:gap-3";
const breakdownValue = "tw:m-0";
const paymentAction = "tw:px-[22px] tw:max-compact:px-3.5 tw:max-compact:text-[16px] tw:max-mobile:w-full";
const balanceValue = "tw:text-[21px] tw:font-medium tw:text-(--pp-blue) tw:max-mobile:text-[20px]";

function Chevron({ open = false, className }: { open?: boolean; className: string }) {
  return <svg className={`tw:fill-none tw:stroke-current tw:stroke-[1.5] ${open ? "tw:rotate-180" : ""} ${className}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>;
}

function DisclosureButton({ open, controls, onToggle, mobile, children }: { open: boolean; controls: string; onToggle: () => void; mobile: boolean; children: ReactNode }) {
  // Rendered twice per card: inside the summary column on desktop, below the card on mobile.
  return (
    <button className={`${disclosure} ${mobile ? "tw:hidden tw:max-mobile:flex" : "tw:flex tw:max-mobile:hidden"}`} aria-expanded={open} aria-controls={controls} onClick={onToggle}>
      {children} <Chevron open={open} className="tw:size-[13px]" />
    </button>
  );
}

export default function DashboardOverview({ name, loan, loans, lastPayment, support }: { support?: ReactNode; name: string; loan: PortalLoan; loans: PortalLoan[]; lastPayment: { amount: string; paid_date: string } | null }) {
  const router = useRouter();
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const propertyCityLine = [loan.property_city, [loan.property_state, loan.property_zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const breakdownLabel = `${breakdownOpen ? "Hide" : "View"} payment breakdown`;
  return (
    <main className="tw:mx-auto tw:mt-21 tw:mb-17.5 tw:w-[min(960px,calc(100%_-_96px))] tw:max-compact:mt-16 tw:max-compact:w-[calc(100%_-_96px)] tw:max-mobile:mt-2 tw:max-mobile:mb-10 tw:max-mobile:w-[calc(100%_-_32px)] tw:max-mobile:pb-6">
      <div className="tw:mb-15 tw:flex tw:items-center tw:justify-between tw:gap-8 tw:max-compact:mb-10.5 tw:max-compact:gap-5 tw:max-mobile:mb-7.5 tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-mobile:gap-4">
        <div className="tw:min-w-0 tw:max-mobile:w-full">
          <h1 className="tw:mb-1.5 tw:text-[26px] tw:leading-[1.3] tw:font-semibold tw:tracking-[-.8px] tw:max-mobile:leading-[1.2] tw:max-mobile:tracking-[-0.7px]">Welcome back, {name}.</h1>
          <div className="tw:mt-3 tw:max-mobile:mt-5 tw:max-mobile:rounded-2xl tw:max-mobile:border tw:max-mobile:border-[#d8e3ec] tw:max-mobile:bg-white tw:max-mobile:p-4">
            <p className="tw:text-[11px] tw:font-semibold tw:tracking-[.08em] tw:text-(--pp-muted) tw:uppercase">Current loan</p>
            <p className="tw:mt-1 tw:text-[17px] tw:font-medium tw:text-[#006da5] tw:max-mobile:text-[16px]">{loan.asset_class}{loan.loan_position ? ` (${loan.loan_position})` : ""}</p>
            {loan.property_address_line1 || propertyCityLine ? <address className="tw:mt-2 tw:not-italic tw:text-[14px] tw:leading-[1.5] tw:text-(--pp-muted)">
              {loan.property_address_line1 ? <span className="tw:block">{loan.property_address_line1}</span> : null}
              {propertyCityLine ? <span className="tw:block">{propertyCityLine}</span> : null}
            </address> : <p className="tw:mt-2 tw:text-[14px] tw:text-(--pp-muted)">Account #{loan.account_number}</p>}
          </div>
        </div>
        <label className="tw:relative tw:flex tw:shrink-0 tw:items-center tw:gap-2.5 tw:rounded-[30px] tw:border tw:border-[#c1c5c8] tw:bg-white tw:px-4.5 tw:py-[9px] tw:text-[16px] tw:focus-within:ring-2 tw:focus-within:ring-[#006da5] tw:max-compact:px-3 tw:max-compact:text-[14px] tw:max-mobile:h-11 tw:max-mobile:self-start">
          <span>Switch loan</span>
          <span className="tw:grid tw:h-[25px] tw:w-6 tw:place-items-center tw:rounded-[6px] tw:bg-[#edf6fc]">{loans.length}</span>
          <Chevron className="tw:size-4" />
          <select className="tw:absolute tw:inset-0 tw:w-full tw:cursor-pointer tw:opacity-0" aria-label="Switch loan" value={loan.rtr_loan_id} onChange={event => router.push(portalHref("/dashboard", event.target.value))}>
            {loans.map(item => <option key={item.rtr_loan_id} value={item.rtr_loan_id}>{item.asset_class} · {item.account_number}</option>)}
          </select>
        </label>
      </div>

      {support}
      <section className={`${card} tw:border-2 tw:border-[#0caaff]`} aria-label="Next payment">
        <div className={summaryColumns}>
          <div className={summaryPrimary}>
            <h2 className={cardTitle}>Next Payment</h2>
            <strong className={amount}>{money(loan.account_payment_amount)}</strong>
            <p>Due {displayDate(loan.account_due_date, true)}</p>
            <DisclosureButton open={breakdownOpen} controls="payment-breakdown" onToggle={() => setBreakdownOpen(!breakdownOpen)} mobile={false}>{breakdownLabel}</DisclosureButton>
          </div>
          <div className={summarySecondary}>
            <div className="tw:mb-4 tw:flex tw:items-start tw:justify-between tw:gap-4 tw:max-compact:flex-wrap tw:max-compact:gap-1 tw:max-mobile:flex-col tw:max-mobile:flex-nowrap tw:max-mobile:gap-3">
              <span className="tw:flex tw:items-center tw:gap-2.5 tw:whitespace-nowrap tw:text-[20px] tw:text-[#237a36] tw:max-compact:text-[17px] tw:max-mobile:text-[20px]">
                <span className="tw:grid tw:size-[27px] tw:place-items-center tw:rounded-full tw:bg-[#237a36] tw:text-[17px] tw:text-white tw:max-mobile:size-[22px] tw:max-mobile:text-[14px]">✓</span>Last payment
              </span>
              <div className="tw:text-right tw:max-compact:text-left tw:max-mobile:text-right">
                <strong className="tw:text-[21px] tw:font-medium tw:text-(--pp-blue) tw:max-mobile:text-[20px]">{money(lastPayment?.amount)}</strong>
                <small className="tw:block tw:whitespace-nowrap tw:text-[12px] tw:text-(--pp-muted) tw:max-mobile:mt-0.5">{lastPayment ? `Paid ${displayDate(lastPayment.paid_date, true)}` : "No posted payments yet"}</small>
              </div>
            </div>
            <div className="tw:grid tw:grid-cols-[auto_1fr] tw:gap-2.5 tw:max-mobile:mt-6 tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4">
              <Link className={cn(button.base, button.primary, paymentAction)} href={portalHref("/dashboard/payments", loan.rtr_loan_id)}>Pay now</Link>
              <Link className={cn(button.base, button.outline, paymentAction)} href={portalHref("/dashboard/payments", loan.rtr_loan_id, { tab: "autopay" })}>Set up AutoPay</Link>
            </div>
          </div>
        </div>
        <DisclosureButton open={breakdownOpen} controls="payment-breakdown" onToggle={() => setBreakdownOpen(!breakdownOpen)} mobile>{breakdownLabel}</DisclosureButton>
        {breakdownOpen ? (
          <dl id="payment-breakdown" className={breakdown}>
            <div className={breakdownRow}><dt>Principal</dt><dd className={breakdownValue}>{money(loan.current_payment_principal)}</dd></div>
            <div className={breakdownRow}><dt>Interest</dt><dd className={breakdownValue}>{money(loan.current_payment_interest)}</dd></div>
            <div className={breakdownRow}><dt>Escrow</dt><dd className={breakdownValue}>{money(loan.current_payment_escrow)}</dd></div>
            <div className={`${breakdownRow} tw:mt-2`}><dt>Total</dt><dd className={`${breakdownValue} tw:text-[16px] tw:text-[#006da5]`}>{money(loan.account_payment_amount)}</dd></div>
          </dl>
        ) : null}
      </section>

      <section className={`${card} tw:mt-6 tw:border tw:border-(--pp-line) tw:max-mobile:mt-5`} aria-label="Loan balance">
        <div className={summaryColumns}>
          <div className={summaryPrimary}>
            <h2 className={cardTitle}>Loan Balance</h2>
            <strong className={amount}>{money(loan.current_balance)}</strong>
            <p>Remaining principal</p>
            <DisclosureButton open={termsOpen} controls="loan-terms" onToggle={() => setTermsOpen(!termsOpen)} mobile={false}>{termsOpen ? "Hide loan terms" : "View loan terms"}</DisclosureButton>
          </div>
          <div className={summarySecondary}>
            <div className="tw:mb-6 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-2.5">
              <span>Original Balance:</span>
              <strong className={balanceValue}>{money(loan.original_balance)}</strong>
            </div>
            <Link className={cn(button.base, button.outline, "tw:w-full")} href={portalHref("/dashboard/documents", loan.rtr_loan_id, { tab: "payoff" })}>Payoff Statement</Link>
          </div>
        </div>
        <DisclosureButton open={termsOpen} controls="loan-terms" onToggle={() => setTermsOpen(!termsOpen)} mobile>{termsOpen ? "Hide loan terms" : "View loan terms"}</DisclosureButton>
        {termsOpen ? (
          <dl id="loan-terms" className={breakdown}>
            <div className={breakdownRow}><dt>Interest rate</dt><dd className={breakdownValue}>{loan.annual_interest_rate ? `${Number(loan.annual_interest_rate)}%` : "—"}</dd></div>
            <div className={breakdownRow}><dt>Origination date</dt><dd className={breakdownValue}>{displayDate(loan.origination_date)}</dd></div>
            <div className={breakdownRow}><dt>Maturity date</dt><dd className={breakdownValue}>{displayDate(loan.maturity_date)}</dd></div>
          </dl>
        ) : null}
      </section>
    </main>
  );
}
