"use client";
import { MobileSectionSelect, MobileStepIndicator } from "./portal-mobile-controls";
import type { CommunicationPreferences } from "@/lib/api/generated/model";
import { backBar, backIcon, backLink } from "./portal-back-bar";
import { button, cn, page, pageHeading, pageIntro, pageTitle, segment, segmented } from "./portal-ui";
import { usePortalRequest } from "./portal-request";
import ConsentPreferences from "./consent-preferences";
import { nonBlankPattern, phonePattern } from "@/lib/form-validation";


import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BorrowerProfile } from "@/lib/borrower-types";
import type { PortalLoan } from "@/lib/portal-data";
import { displayDate, money, portalHref } from "@/lib/portal-format";

const panel = "tw:rounded-2xl tw:border tw:border-[#d8dcdf] tw:bg-white";
const pill = "tw:inline-block tw:rounded-[20px] tw:bg-[#237a36] tw:px-4 tw:py-1 tw:text-[12px] tw:whitespace-nowrap tw:text-white tw:max-phone:px-2.5 tw:max-phone:py-[3px] tw:max-phone:text-[9px]";
const sectionHeading = "tw:mb-[26px] tw:flex tw:items-center tw:justify-between tw:gap-[18px] tw:max-mobile:mb-6 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-3 tw:max-phone:flex-wrap";
const sectionTitle = "tw:text-[24px] tw:font-medium tw:tracking-[-.8px] tw:max-mobile:text-[20px] tw:max-mobile:leading-[1.4]";
const fieldGroups = "tw:grid tw:gap-8 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-6";
const twoColumns = "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-4 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-6";
const threeColumns = "tw:grid tw:grid-cols-[repeat(3,minmax(0,1fr))] tw:gap-4 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-6";
const fieldLabel = "tw:flex tw:min-w-0 tw:flex-col tw:items-stretch tw:gap-[18px] tw:max-tablet:gap-3";
const fieldCaption = "tw:flex tw:justify-between tw:gap-2.5 tw:text-[16px] tw:max-tablet:text-[13px] tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5]";
const fieldNote = "tw:text-[16px] tw:font-normal tw:text-[#4e6586] tw:max-tablet:text-[13px] tw:max-mobile:text-[11px]";
const fieldInput = "tw:h-[61px] tw:w-full tw:rounded-[11px] tw:border tw:border-[#6b7c8e] tw:bg-white tw:px-6 tw:py-4 tw:text-[16px] tw:text-[#4e6586] tw:outline-none tw:placeholder:text-[#4e6586] tw:focus:border-[#0788c8] tw:focus:shadow-[0_0_0_2px_#088bc814] tw:max-tablet:h-[54px] tw:max-tablet:px-4 tw:max-tablet:py-3.5 tw:max-tablet:text-[16px] tw:max-mobile:h-[60px]";

function HelpCard({ inline = false }: { inline?: boolean }) {
  // tailwind-merge drops line-height when the font size changes, so leading comes after the sizes.
  const action = cn(inline ? "tw:min-w-0 tw:flex-1 tw:px-[22px] tw:text-[16px]" : "tw:min-w-[200px] tw:px-[22px] tw:text-[18px] tw:max-laptop:min-w-[150px] tw:max-laptop:text-[16px] tw:max-phone:min-w-0", "tw:leading-[1.25] tw:max-compact:text-[16px] tw:max-tablet:flex-1");
  return <section className={cn("tw:flex tw:gap-[30px] tw:rounded-2xl tw:border-2 tw:border-[#0caaff] tw:bg-white tw:py-8 tw:shadow-[0_15px_35px_#0078b00a] tw:max-mobile:gap-6 tw:max-mobile:p-8", inline ? "tw:flex-col tw:justify-between tw:px-7" : "tw:mt-[60px] tw:items-center tw:justify-between tw:px-[52px] tw:max-laptop:px-8 tw:max-tablet:mt-8 tw:max-tablet:flex-col tw:max-tablet:items-start tw:max-tablet:gap-6")}>
    <div className="tw:flex tw:items-start tw:gap-4 tw:max-mobile:flex-col tw:max-mobile:gap-5">
      <span className="tw:grid tw:size-[38px] tw:flex-[0_0_38px] tw:place-items-center tw:rounded-[10px] tw:bg-[#eff7ff] tw:text-[20px] tw:text-[#006da5] tw:max-phone:size-[30px] tw:max-phone:basis-[30px] tw:max-phone:text-[17px]">ⓘ</span>
      <div><h2 className="tw:mt-0.5 tw:mb-2.5 tw:text-[20px] tw:font-medium">Need Help with Your Account?</h2><p className={cn(inline ? "tw:text-[15px]" : "tw:text-[16px]", "tw:leading-[1.8] tw:text-[#344f70] tw:max-mobile:text-[14px] tw:max-mobile:leading-[1.6]")}>Have questions about your escrow reserve, 1098 tax statements,<br className={inline ? "tw:hidden" : "tw:max-mobile:hidden"} /> loan transfer grace periods, or need hardship assistance?</p></div>
    </div>
    <div className="tw:flex tw:shrink-0 tw:gap-[7px] tw:max-tablet:w-full tw:max-mobile:flex-col tw:max-mobile:gap-4">
      <Link className={cn(button.base, button.primary, action)} href="/contact">Contact Care</Link>
      <Link className={cn(button.base, button.outline, action)} href="/help-center">Help Center</Link>
    </div>
  </section>;
}

const identifierBadge = "tw:rounded-[7px] tw:border tw:px-4 tw:py-[5px] tw:text-[12px] tw:max-phone:px-2.5 tw:max-phone:py-1 tw:max-phone:text-[10px]";
// On mobile (<=600px) the overview panel dissolves and each block becomes its own card.
const mobileCard = "tw:max-mobile:mb-6 tw:max-mobile:rounded-2xl tw:max-mobile:border tw:max-mobile:border-[#d8dcdf] tw:max-mobile:bg-white tw:max-mobile:p-8";
const metricCard = "tw:rounded-2xl tw:border-2 tw:border-[#0caaff] tw:bg-[linear-gradient(#e9f8ff,white_75%)] tw:px-6 tw:pt-[22px] tw:pb-7 tw:max-mobile:rounded-[14px] tw:max-mobile:p-5";
const metricLabel = "tw:flex tw:items-center tw:justify-between tw:gap-2 tw:max-laptop:flex-wrap tw:max-tablet:flex-nowrap tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-3";
const metricTitle = "tw:whitespace-nowrap tw:text-[14px] tw:font-medium tw:text-[#0078b5] tw:max-mobile:text-[16px]";
const metricTag = "tw:whitespace-nowrap tw:rounded-[7px] tw:px-3 tw:py-1 tw:text-[10px] tw:text-white tw:max-mobile:text-[12px]";
const metricValue = "tw:mt-6 tw:mb-4 tw:block tw:text-[42px] tw:font-medium tw:tracking-[-1.4px] tw:text-[#0079b4] tw:max-laptop:text-[34px] tw:max-mobile:text-[40px] tw:max-mobile:leading-[1.2]";
const metricFooter = "tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-t-[#c9cdd0] tw:pt-6.5 tw:max-laptop:flex-wrap tw:max-tablet:flex-nowrap tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-3";
const metricFooterLabel = "tw:text-[13px] tw:text-[#4e6586] tw:max-mobile:text-[14px]";
const metricFooterValue = "tw:whitespace-nowrap tw:text-[18px] tw:font-medium tw:max-mobile:text-[20px]";
const dateItem = "tw:flex tw:items-center tw:justify-center tw:gap-3.5 tw:border-r tw:border-r-[#cfd4d8] tw:last:border-r-0 tw:max-tablet:justify-start tw:max-tablet:border-r-0 tw:max-tablet:border-b tw:max-tablet:border-b-[#cfd4d8] tw:max-tablet:py-3.5 tw:max-tablet:last:border-b-0";
const dateLabel = "tw:text-[12px] tw:text-[#4e6586] tw:max-mobile:text-[16px]";
const dateValue = "tw:block tw:text-[15px] tw:font-medium tw:text-[#0078b5] tw:max-mobile:text-[20px]";
const iconTile = "tw:grid tw:size-11 tw:shrink-0 tw:basis-11 tw:place-items-center tw:rounded-[11px] tw:text-[24px]";
const iconTone = {
  blue: "tw:bg-[#edf8ff] tw:text-[#0786be]",
  green: "tw:bg-[#e9fbf4] tw:text-[#087756]",
  grey: "tw:bg-[#f2f6fa] tw:text-[#4e6586]",
};
// Overriding font-size makes cn() drop the base leading, so it is restated.
const payoffAction = "tw:px-4.5 tw:text-[17px] tw:leading-[1.25] tw:max-compact:px-4.5";
const payoffNote = "tw:text-[15px] tw:text-[#4e6586]";

function LoanOverview({ loan }: { loan: PortalLoan }) {
  const paid = Math.max(0, Number(loan.original_balance ?? 0) - Number(loan.current_balance ?? 0));
  const percent = Number(loan.original_balance) ? paid / Number(loan.original_balance) * 100 : 0;
  const propertyCityLine = [loan.property_city, [loan.property_state, loan.property_zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return (
    <section className={`${panel} tw:px-15.5 tw:pt-10.5 tw:pb-17 tw:max-laptop:p-9 tw:max-mobile:contents`}>
      <div className={`tw:contents tw:max-mobile:block ${mobileCard}`}>
        <div className="tw:mb-16 tw:flex tw:items-center tw:justify-between tw:gap-5 tw:max-laptop:flex-wrap tw:max-laptop:gap-6 tw:max-tablet:mb-8 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-5">
          <div>
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:max-mobile:gap-2.5">
              <h2 className="tw:mr-3.5 tw:text-[26px] tw:font-medium tw:tracking-[-.8px] tw:max-mobile:text-[20px] tw:max-phone:w-full">
                {loan.asset_class}{loan.loan_position ? ` (${loan.loan_position})` : ""}
              </h2>
              <span className={pill}>Active</span>
              <span className={cn(pill, "tw:bg-[#007cae]")}>{loan.servicing_status === "past_due" ? "Past due" : loan.servicing_status === "assistance_required" ? "Needs assistance" : loan.servicing_status === "grace" ? "In grace" : "Current"}</span>
            </div>
            <p className="tw:mt-[7px] tw:text-[14px] tw:text-[#4e6586]">Loan Account #{loan.account_number}</p>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-2.5">
            <span className={`${identifierBadge} tw:border-[#007db5] tw:bg-[#007db5] tw:text-white`}>RTR #{loan.rtr_loan_id}</span>
            <span className={`${identifierBadge} tw:border-[#8397b9] tw:text-[#4e6586]`}>Orig. #{loan.account_number}</span>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-3 tw:gap-7 tw:max-laptop:gap-4 tw:max-tablet:grid-cols-1 tw:max-mobile:gap-6">
          <article className={metricCard}>
            <div className={metricLabel}>
              <h3 className={metricTitle}><span aria-hidden="true">◴</span> Total Amount Due</h3>
              <span className={`${metricTag} tw:bg-[#007db1]`}>Due {displayDate(loan.account_due_date)}</span>
            </div>
            <strong className={metricValue}>{money(loan.account_total_due)}</strong>
            <div className={metricFooter}>
              <span className={metricFooterLabel}>Regular installment</span>
              <b className={`${metricFooterValue} tw:text-[#0078b5]`}>{money(loan.account_payment_amount)}/mo</b>
            </div>
          </article>
          <article className={metricCard}>
            <div className={metricLabel}>
              <h3 className={metricTitle}><span aria-hidden="true">ⓢ</span> Principal Balance</h3>
              <span className={`${metricTag} tw:bg-[#007db1]`}>Orig. {money(loan.original_balance)}</span>
            </div>
            <strong className={metricValue}>{money(loan.current_balance)}</strong>
            <div className={metricFooter}>
              <span className={metricFooterLabel}>Principal paid down</span>
              <b className={`${metricFooterValue} tw:text-[#33a849]`}>{money(paid)} ({percent.toFixed(1)}%)</b>
            </div>
            <div className="tw:mt-4.5 tw:h-[5px] tw:overflow-hidden tw:rounded-[5px] tw:bg-[#e0e6ec]">
              <span className="tw:block tw:h-full tw:bg-[#237a36]" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
          </article>
          <article className={metricCard}>
            <div className={metricLabel}>
              <h3 className={metricTitle}><span aria-hidden="true">▤</span> Interest Rate</h3>
              <span className={`${metricTag} tw:min-w-[100px] tw:bg-[#237a36] tw:text-center`}>Fixed Rate</span>
            </div>
            <strong className={metricValue}>{loan.annual_interest_rate ? Number(loan.annual_interest_rate) : "—"}%</strong>
            <div className={metricFooter}>
              <span className={metricFooterLabel}>Maturity schedule</span>
              <b className={`${metricFooterValue} tw:text-[#0078b5]`}>{displayDate(loan.maturity_date)}</b>
            </div>
          </article>
        </div>
      </div>

      <div className={`tw:mt-6.5 tw:mb-10 tw:grid tw:grid-cols-3 tw:rounded-[14px] tw:border tw:border-[#cfd4d8] tw:py-3.5 tw:max-tablet:grid-cols-1 tw:max-tablet:px-4 tw:max-tablet:py-1 tw:max-mobile:gap-6 ${mobileCard}`}>
        <div className={dateItem}>
          <span aria-hidden="true" className={`${iconTile} ${iconTone.blue}`}>▣</span>
          <p className={dateLabel}>Next Due Date<strong className={dateValue}>{displayDate(loan.account_due_date)}</strong></p>
        </div>
        <div className={dateItem}>
          <span aria-hidden="true" className={`${iconTile} ${iconTone.green}`}>◷</span>
          <p className={dateLabel}>Maturity Date<strong className={dateValue}>{displayDate(loan.maturity_date)}</strong></p>
        </div>
        <div className={dateItem}>
          <span aria-hidden="true" className={`${iconTile} ${iconTone.grey}`}>♧</span>
          <p className={dateLabel}>Servicing Phone<a className={dateValue} href={`tel:${loan.servicing_phone?.replace(/[^+\d]/g, "")}`}>{loan.servicing_phone ?? "—"}</a></p>
        </div>
      </div>

      <section className="tw:rounded-2xl tw:border tw:border-[#cce6f3] tw:bg-[#e5f7ff] tw:p-5 tw:max-mobile:mb-6 tw:max-mobile:p-5" aria-labelledby="secured-property-title">
        <div className="tw:flex tw:items-center tw:gap-3">
          <span aria-hidden="true" className={`${iconTile} ${iconTone.blue}`}><svg className="tw:size-6 tw:fill-none tw:stroke-current tw:stroke-[1.6]" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v10H3z" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <h3 id="secured-property-title" className="tw:text-[16px] tw:font-medium tw:text-[#234969]">Property address</h3>
        </div>
        <div className="tw:mt-4 tw:rounded-xl tw:bg-white tw:px-5 tw:py-4 tw:max-mobile:px-4">
          {loan.property_address_line1 || propertyCityLine ? <address className="tw:not-italic tw:text-[16px] tw:leading-[1.5] tw:text-[#102433] tw:max-mobile:text-[16px]">
            {loan.property_address_line1 ? <span className="tw:block tw:font-medium tw:wrap-break-word">{loan.property_address_line1}</span> : null}
            {propertyCityLine ? <span className="tw:mt-1 tw:block tw:wrap-break-word">{propertyCityLine}</span> : null}
          </address> : <p className="tw:text-[15px] tw:text-[#4e6586]">No property collateral on this account.</p>}
        </div>
      </section>

      <div className="tw:mt-8 tw:grid tw:grid-cols-[1.35fr_1fr] tw:gap-7.5 tw:max-laptop:grid-cols-[1fr_1fr] tw:max-laptop:gap-5 tw:max-tablet:grid-cols-1 tw:max-mobile:contents">
        <section className={`tw:rounded-[14px] tw:border tw:border-[#c6ccd1] tw:px-9.5 tw:py-8 tw:max-laptop:p-7 ${mobileCard}`}>
          <h2 className="tw:text-[24px] tw:font-medium tw:tracking-[-.8px] tw:max-mobile:text-[20px]">Planning to pay off your loan?</h2>
          <p className={cn(payoffNote, "tw:mt-3 tw:leading-[1.6]")}>Request an official payoff quote for the amount and exact good-through date. Your loan balance is not a payoff quote.</p>
          <div className="tw:mt-6.5 tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[5px] tw:border-t tw:border-t-[#c7cdd2] tw:pt-7 tw:max-laptop:grid-cols-[1fr] tw:max-tablet:grid-cols-[1fr_1fr] tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4">
            <Link className={cn(button.base, button.primary, payoffAction)} href={portalHref("/dashboard/payments", loan.rtr_loan_id)}>Make a Payment</Link>
            <Link className={cn(button.base, button.outline, payoffAction)} href={portalHref("/dashboard/documents", loan.rtr_loan_id, { tab: "payoff" })}>Request Payoff Quote</Link>
          </div>
        </section>
        <HelpCard inline />
      </div>
    </section>
  );
}

export default function AccountDetails({ loan, loans, profiles, selfPersonId, apiPreferences }: { loan: PortalLoan; loans: PortalLoan[]; profiles: BorrowerProfile[]; selfPersonId?: string; apiPreferences?: CommunicationPreferences }) {
  const portalRequest = usePortalRequest();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "primary" || params.get("tab") === "co" ? params.get("tab")! : "overview";
  const readOnly = tab === "co";
  const [profileStep, setProfileStep] = useState(1);
  const profileForm = useRef<HTMLFormElement>(null);
  const previousProfileStep = useRef(profileStep);
  useEffect(() => {
    if (previousProfileStep.current !== profileStep && window.matchMedia("(max-width:600px)").matches) {
      profileForm.current?.querySelector<HTMLHeadingElement>(`[data-profile-step="${profileStep}"] h2`)?.focus();
    }
    previousProfileStep.current = profileStep;
  }, [profileStep]);
  const [drafts, setDrafts] = useState(profiles);
  const [saved, setSaved] = useState(profiles);
  const [pending, setPending] = useState(false);
  const [emailChangeId, setEmailChangeId] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const profile = drafts.find(item => item.borrower_role === (tab === "co" ? "co_borrower" : "primary"));
  const primary = drafts.find(item => item.borrower_role === "primary");
  const co = drafts.find(item => item.borrower_role === "co_borrower");
  const dirty = JSON.stringify(drafts) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const leave = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (anchor && new URL(anchor.href, window.location.origin).pathname !== window.location.pathname && !window.confirm("Discard your unsaved changes?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", leave, true); };
  }, [dirty]);
  function navigate(nextTab: string) { if (nextTab === tab || pending || (dirty && !window.confirm("Discard your unsaved changes?"))) return; setDrafts(saved); setProfileStep(1); setMessage(""); window.history.pushState(null, "", portalHref("/dashboard/account", loan.rtr_loan_id, { tab: nextTab })); }
  function nextProfileStep() {
    const invalid = profileForm.current?.querySelector<HTMLInputElement>(`[data-profile-step="${profileStep}"] input:invalid`);
    if (invalid) { invalid.reportValidity(); return; }
    setProfileStep(current => Math.min(4, current + 1));
  }
  function update(field: keyof BorrowerProfile, value: string | boolean) {
    if (!profile || readOnly) return;
    setDrafts(items => items.map(item => item.customer_id === profile.customer_id ? { ...item, [field]: value } : item)); setMessage("");
  }
  function copyPrimary() {
    if (readOnly || !profile || !primary || profile.customer_id === primary.customer_id) return;
    const fields = ["mail_address_line1", "mail_address_line2", "mail_city", "mail_state", "mail_zip"] as const;
    setDrafts(items => items.map(item => item.customer_id === profile.customer_id ? { ...item, ...Object.fromEntries(fields.map(field => [field, primary[field]])) } : item));
  }
  async function save() {
    if (!profile || readOnly) return;
    setPending(true); setMessage(""); setSuccess(false);
    try {
      const response = await portalRequest("/api/portal/profile", { loanId: loan.rtr_loan_id, profile });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Could not save preferences."); return; }
      if (data.emailChangeId) { setEmailChangeId(data.emailChangeId); setMessage("Other updates were submitted. Enter the verification code to confirm your new email."); return; }
      if (data.pending) { setMessage("Your change request is awaiting RTR review. Other accepted changes may already be applied."); return; }
      const newProfile = { ...profile, updated_at: data.updated_at, consent_updated_at: profile.consent_updated_at };
      setDrafts(items => items.map(item => item.customer_id === profile.customer_id ? newProfile : item));
      setSaved(items => items.map(item => item.customer_id === profile.customer_id ? newProfile : item));
      setSuccess(true); setMessage("Your changes have been saved.");
    } catch { setMessage("Could not reach the server. Please try again."); }
    finally { setPending(false); }
  }
  async function confirmEmail() {
    if (readOnly) return;
    setPending(true); setMessage("");
    try { const response = await portalRequest("/api/portal/profile/email-confirm", { emailChangeId, code: emailCode }); const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Could not confirm the email."); return; } setEmailChangeId(""); setEmailCode(""); setSaved(drafts); setSuccess(true); setMessage("Your email has been confirmed."); }
    catch { setMessage("Could not confirm the email. Please try again."); }
    finally { setPending(false); }
  }
  const field = (key: keyof BorrowerProfile, label: string, options: { maxLength?: number; type?: string; placeholder?: string; required?: boolean; pattern?: string } = {}) => <label className={fieldLabel}><span className={fieldCaption}>{label}</span><input className={fieldInput} name={key} value={String(profile?.[key] ?? "")} readOnly={readOnly || Boolean(selfPersonId && (key === "first_name" || key === "last_name"))} onChange={event => update(key, event.target.value)} maxLength={options.maxLength ?? 50} type={options.type ?? "text"} placeholder={options.placeholder} required={options.required ?? true} pattern={options.pattern ?? ((options.required ?? true) && (!options.type || options.type === "text") ? nonBlankPattern : undefined)} /></label>;
  // On mobile the form is a four-step wizard: only the current section is shown.
  const section = (step: number) => cn(step > 1 && "tw:mt-9 tw:border-t tw:border-t-[#d8dcdf] tw:pt-9", profileStep === step ? "tw:max-mobile:m-0 tw:max-mobile:border-0 tw:max-mobile:p-0" : "tw:max-mobile:hidden");
  const tabs = [["overview", "Loan Overview"], ["primary", `Primary Borrower${primary ? ` (${primary.first_name})` : ""}`], ["co", `Co-Borrower${co ? ` (${co.first_name})` : ""}`]];
  return <main className={page}>
    <div className={cn(backBar, "tw:max-tablet:items-start")}>
      <Link className={backLink} href={portalHref("/dashboard", loan.rtr_loan_id)}>{backIcon}Back</Link>
      <label className="tw:relative tw:flex tw:min-w-0 tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-[#d2ddec] tw:bg-white tw:px-4 tw:py-3 tw:text-[14px] tw:text-[#4e6586] tw:focus-within:ring-2 tw:focus-within:ring-[#006da5] tw:max-mobile:w-full tw:max-mobile:gap-3 tw:max-mobile:px-4 tw:max-mobile:py-3.5">
        <span className="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-[#2ab442]" aria-hidden="true" />
        <span className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-0.5">
          <span className="tw:whitespace-nowrap tw:max-mobile:text-[12px]">Active loan:</span>
          <span className="tw:font-medium tw:text-[#0076b5] tw:max-mobile:text-[15px]">{loan.asset_class}{loan.loan_position ? ` (${loan.loan_position})` : ""}</span>
          <span className="tw:whitespace-nowrap tw:max-mobile:text-[13px]">#{loan.account_number}</span>
        </span>
        <svg className="tw:ml-auto tw:size-4 tw:shrink-0 tw:fill-none tw:stroke-[#4e6586] tw:stroke-[1.8]" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <select className="tw:absolute tw:inset-0 tw:h-full tw:w-full tw:cursor-pointer tw:text-base tw:opacity-0" aria-label="Active loan" value={loan.rtr_loan_id} onChange={event => { if (!dirty || window.confirm("Discard your unsaved changes?")) router.push(portalHref("/dashboard/account", event.target.value, { tab })); }}>{loans.map(item => <option key={item.rtr_loan_id} value={item.rtr_loan_id}>{item.asset_class} #{item.account_number}</option>)}</select>
      </label>
    </div>
    <div className={cn(pageHeading, "tw:mb-16 tw:max-compact:mb-16 tw:max-laptop:flex-col tw:max-laptop:items-start tw:max-laptop:gap-[26px]")}>
      <div><h1 className={pageTitle}>Account &amp; Loan Details</h1><p className={cn(pageIntro, "tw:max-compact:text-[16px]")}>Manage loan parameters, borrower details, and communication permissions<br className="tw:max-mobile:hidden" /> for {loan.asset_class}{loan.loan_position ? ` (${loan.loan_position})` : ""} (#{loan.account_number}).</p></div>
      <nav className={cn(segmented, "tw:shrink-0 tw:max-mobile:hidden")} aria-label="Account sections">{tabs.map(([value, label]) => <button key={value} className={cn(segment(tab === value), "tw:px-[22px] tw:py-[17px]")} aria-pressed={tab === value} onClick={() => navigate(value)}>{label}</button>)}</nav>
      <MobileSectionSelect label="Account section" value={tab} onValueChange={navigate} choices={tabs.map(([value, label]) => ({ value, label }))} />
    </div>
    {tab === "overview" ? <LoanOverview loan={loan} /> : readOnly ? <section className={cn(panel, "tw:p-8 tw:sm:p-12")} data-testid="co-borrower-details"><h2 className={sectionTitle}>Co-Borrower</h2><p className="tw:mt-4 tw:text-[20px]">{co ? `${co.first_name} ${co.last_name}` : "No co-borrower on this loan"}</p><p className="tw:mt-3 tw:text-[16px] tw:leading-relaxed tw:text-[#4e6586]">Only the co-borrower name is available here. Personal details and communication choices are private to that person.</p></section> : profile ? <>
      <section className={cn(panel, "tw:px-16 tw:py-12 tw:max-laptop:px-12 tw:max-tablet:px-7 tw:max-tablet:py-9 tw:max-mobile:p-8")} data-testid={readOnly ? "co-borrower-details" : undefined}>
        <MobileStepIndicator total={4} step={profileStep} label={["Personal Identity", "Mailing Address", "Contact Details", "Comm & Reg Preferences"][profileStep - 1]} icon={profileStep === 1 ? "account" : profileStep === 2 ? "address" : profileStep === 3 ? "phone" : "preferences"} />
        <div className={cn("tw:mb-10 tw:flex tw:items-center tw:gap-4 tw:border-b tw:border-b-[#c9cdd0] tw:pb-7 tw:max-mobile:mb-8 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-5 tw:max-phone:pb-6", profileStep !== 1 && "tw:max-mobile:hidden")}>
          <span className="tw:grid tw:size-[62px] tw:shrink-0 tw:place-items-center tw:rounded-[13px] tw:bg-[#007caf] tw:text-[24px] tw:font-semibold tw:text-white tw:uppercase tw:max-phone:size-12 tw:max-phone:text-[19px]">{profile.first_name[0]}{profile.last_name[0]}</span>
          <div><div className="tw:flex tw:items-center tw:gap-2.5 tw:max-mobile:flex-wrap tw:max-mobile:gap-3"><h2 className="tw:text-[26px] tw:font-medium tw:tracking-[-.7px] tw:max-tablet:text-[23px] tw:max-mobile:text-[22px]">{profile.first_name} {profile.last_name}</h2><span className={pill}>{tab === "co" ? "Joint Signer" : "Primary Signer"}</span></div><p className="tw:mt-[3px] tw:text-[16px] tw:text-[#4e6586] tw:max-tablet:text-[13px] tw:max-mobile:text-[14px]">{tab === "co" ? "Authorized Co-Borrower Record" : "Primary Borrower Profile"} • Linked to Loan #{loan.account_number}</p></div>
        </div>
        <form aria-label={readOnly ? "Co-borrower details (read-only)" : "Borrower details"} ref={profileForm} onInvalidCapture={event => { if (!window.matchMedia("(max-width:600px)").matches) return; const input = event.target as HTMLInputElement; const invalidStep = Number(input.closest("[data-profile-step]")?.getAttribute("data-profile-step")); if (invalidStep && invalidStep !== profileStep) { event.preventDefault(); setProfileStep(invalidStep); requestAnimationFrame(() => input.reportValidity()); } }} onSubmit={event => { event.preventDefault(); void save(); }}>
          <section className={section(1)} data-profile-step={1} aria-labelledby="pa-identity-title">
            <div className={sectionHeading}><h2 tabIndex={-1} className={sectionTitle} id="pa-identity-title">Personal Identity</h2></div><p className="tw:mb-6 tw:text-[15px] tw:leading-relaxed tw:text-[#4e6586]">Your legal name and date of birth are locked. For a correction or name change, contact Customer Solutions through the approved verification process. Do not send identity documents or a full SSN through ordinary email or text.</p>
            <div className={threeColumns}>{field("first_name", "First Name")}{field("last_name", "Last Name")}<label className={fieldLabel}><span className={fieldCaption}>Date of Birth <small className={fieldNote}>Locked Security</small></span><span className="tw:relative tw:block"><input className={cn(fieldInput, "tw:cursor-default tw:pr-[45px] tw:max-tablet:pr-4")} value={profile.has_date_of_birth ? "•• / •• / ••••" : "Not provided"} readOnly aria-label="Date of Birth" /><svg className="tw:absolute tw:top-5 tw:right-[22px] tw:size-5 tw:fill-none tw:stroke-[#7e90a9] tw:stroke-1" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="13" rx="2" /><path d="M3 8h14M6 2v4m8-4v4" /></svg></span></label></div>
          </section>
          <section className={section(2)} data-profile-step={2} aria-labelledby="pa-address-title">
            <div className={sectionHeading}><h2 tabIndex={-1} className={sectionTitle} id="pa-address-title">Mailing Address</h2>{tab === "co" && !readOnly && !selfPersonId ? <button type="button" className="tw:rounded-[30px] tw:border-0 tw:bg-[#237a36] tw:px-[22px] tw:py-2 tw:text-[12px] tw:whitespace-nowrap tw:text-white tw:max-phone:px-3 tw:max-phone:py-1.5 tw:max-phone:text-[10px]" onClick={copyPrimary}>Same as Primary Address</button> : null}</div>
            <div className={fieldGroups}><div className={twoColumns}>{field("mail_address_line1", "Mailing Address Line 1")}{field("mail_address_line2", "Mailing Address Line 2", { placeholder: "Apt, Suite, Unit (Optional)", required: false })}</div><div className={threeColumns}>{field("mail_city", "Mailing City")}{field("mail_state", "Mailing State", { maxLength: 2, pattern: "[A-Za-z]{2}" })}{field("mail_zip", "Mailing ZIP Code", { maxLength: 10, pattern: "[0-9]{5}(-[0-9]{4})?" })}</div></div>
          </section>
          <section className={section(3)} data-profile-step={3} aria-labelledby="pa-contact-title">
            <div className={sectionHeading}><h2 tabIndex={-1} className={sectionTitle} id="pa-contact-title">Contact Details</h2></div>
            <div className={fieldGroups}><div className={twoColumns}>{field("primary_phone", "Primary Phone", { type: "tel", maxLength: 25, pattern: phonePattern, placeholder: "(555) 123-4567" })}{field("contact_email", "Email Address", { type: "email" })}</div><div className={fieldLabel}><span className={fieldCaption}>Phone Type</span><span className={cn(segmented, "tw:self-start tw:max-mobile:w-full")} role="group" aria-label="Phone type">{[["Land Line", "Landline"], ["Cell", "Cell / Mobile"]].map(([value, label]) => <button type="button" key={value} disabled={readOnly} aria-pressed={profile.primary_phone_type === value} className={cn(segment(profile.primary_phone_type === value), "tw:min-w-[120px] tw:px-[22px] tw:py-[17px] tw:max-mobile:min-h-[52px] tw:max-mobile:px-2.5 tw:max-mobile:py-[17px] tw:max-mobile:text-[16px] tw:max-phone:min-w-[110px] tw:max-phone:py-3.5")} onClick={() => update("primary_phone_type", value)}>{label}</button>)}</span></div></div>
          </section>
          <section className={section(4)} data-profile-step={4} aria-labelledby="pa-preferences-title">
            <div className={sectionHeading}><h2 tabIndex={-1} className={sectionTitle} id="pa-preferences-title">{tab === "co" ? "Co-Borrower Regulatory Preferences" : "Communication & Regulatory Preferences"}</h2>{tab === "primary" ? <span className="tw:text-[12px] tw:text-[#4e6586]">TCPA &amp; E-SIGN Regulated</span> : null}</div>
            <ConsentPreferences key={loan.rtr_loan_id} loanId={loan.rtr_loan_id} initial={apiPreferences} onReview={() => setProfileStep(4)} />
          </section>
          {message && !readOnly ? <p className={cn("tw:mt-6", success ? "tw:text-[#278137]" : "tw:text-[#ad3e27]")} role="status">{message}</p> : null}
          {!readOnly ? <div className={cn("tw:mt-[42px] tw:flex tw:justify-end tw:gap-2 tw:max-mobile:flex-col tw:max-mobile:gap-4 tw:max-phone:mt-[30px]", profileStep !== 4 && "tw:max-mobile:hidden")}><button className={cn(button.base, button.primary, button.element, "tw:min-w-[148px] tw:max-mobile:w-full tw:max-phone:min-w-[100px] tw:max-phone:max-w-full")} type="submit" disabled={pending}>{pending ? "Saving…" : `Save ${tab === "co" ? "Co-Borrower" : "Primary"} Changes`}</button></div> : null}
          <div className="tw:hidden tw:max-mobile:mt-8 tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4">{profileStep < 4 ? <button type="button" className={cn(button.base, button.primary, button.element)} onClick={nextProfileStep}>Next</button> : null}{profileStep > 1 ? <button type="button" className={cn(button.base, button.outline, button.element)} onClick={() => setProfileStep(current => current - 1)}>Back</button> : null}</div>
        </form>
      </section>
      {emailChangeId && !readOnly ? <section className={panel}><h2>Confirm new email</h2><p>Enter the verification code for the requested email change.</p><label className={fieldLabel}><span className={fieldCaption}>Verification code</span><input className={fieldInput} value={emailCode} onChange={event => setEmailCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label><button type="button" className={cn(button.base, button.primary, button.element)} disabled={pending || !/^[0-9]{6}$/.test(emailCode)} onClick={() => void confirmEmail()}>Confirm email</button></section> : null}
      <HelpCard />
    </> : <section className={cn(panel, "tw:p-[70px] tw:text-center tw:max-phone:px-6 tw:max-phone:py-10")}><h2 className="tw:text-[26px] tw:font-medium">No co-borrower on this loan</h2><p className="tw:mt-3 tw:text-[#4e6586]">This account currently has one borrower.</p></section>}
  </main>;
}
