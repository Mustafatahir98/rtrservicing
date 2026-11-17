"use client";
import { handleDialogKeyDown } from "./payment-ui";
import { MobileStepIndicator } from "./portal-mobile-controls";
import { useQuery } from "@tanstack/react-query";
import type { Autopay, AuthorizationTerms } from "@/api/generated/model";
import { previewAutopay } from "@/api/generated/auto-pay/auto-pay";
import { authorizationText } from "@/api/authorization";
import { button, cn, page } from "./portal-ui";
import { amountCard, amountGrid, amountNote, BankIcon, bankName, bankNote, bankOption, bankText, danger, dialog, dialogActions, dialogButton, dialogClose, dialogContent, dialogText, dialogTitle, errorText, formActions, formButton, greenBadge, panel, PaymentsHeading, PaymentStepper, SelectionLabel } from "./payment-ui";
import { autopayReviewSnapshot, usableAutopayPreview } from "@/lib/payment-rules";
import { usePortalRequest } from "./portal-request";


import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortalBackBar from "./portal-back-bar";
import type { PortalLoan } from "@/lib/portal-data";
import type { FundingAccount } from "@/lib/payment-types";
import { autoPaySchedule, frequencies, nextAllowedWeekday, nextRecurringDraft, ordinal } from "@/lib/autopay";
import type { AutoPayRecord, Frequency } from "@/lib/autopay";
import { bankAccountLabel, bankLast4, displayDate, money, portalHref } from "@/lib/portal-format";

const draftValue = "tw:text-[54px] tw:font-medium tw:tracking-[-1.5px] tw:text-[#007bb5] tw:max-desktop:text-[46px] tw:max-mobile:text-[26px] tw:max-phone:tracking-[-1px]";
const latePill = "tw:mt-4 tw:mb-6 tw:block tw:max-w-full tw:rounded-xl tw:bg-[#be2d00] tw:p-4 tw:text-[14px] tw:leading-[1.6] tw:text-white";
const monthButton = "tw:border-0 tw:bg-transparent tw:px-2.5 tw:py-0 tw:text-[24px] tw:leading-[1.2] tw:text-[#007bb5]";
const legendTones = { none: "tw:border-[#dfe8f2] tw:bg-[#f7fafc]", selected: "tw:border-[#007eb4] tw:bg-[#007eb4]", available: "tw:border-[#c1d9f1] tw:bg-[#eef6ff]", scheduled: "tw:border-[#149ce4] tw:bg-[#e7f6ff]" };
function LegendItem({ tone = "none", children }: { tone?: keyof typeof legendTones; children: ReactNode }) {
  return <span className="tw:flex tw:items-center tw:gap-[5px] tw:whitespace-nowrap"><i className={cn("tw:grid tw:size-3 tw:place-items-center tw:rounded-full tw:border tw:text-[9px] tw:text-white tw:not-italic tw:max-phone:size-[9px]", legendTones[tone])} aria-hidden="true">{tone === "selected" ? "✓" : null}</i>{children}</span>;
}

export default function AutoPayWizard({ loan, banks, active, today, customerId, apiOptions, apiTerms }: { loan: PortalLoan; banks: FundingAccount[]; active: AutoPayRecord | null; today: string; customerId: string; apiOptions?: Autopay; apiTerms?: AuthorizationTerms }) {
  const portalRequest = usePortalRequest();
  const router = useRouter();
  const params = useSearchParams();
  const step = Math.max(1, Math.min(3, Number(params.get("step")) || 1));
  const requestedFrequency = params.get("frequency");
  const [frequency, setFrequency] = useState<Frequency>(requestedFrequency && Object.prototype.hasOwnProperty.call(frequencies, requestedFrequency) ? requestedFrequency as Frequency : active?.frequency ?? "monthly");
  const [day, setDay] = useState(active?.first_day ?? 1);
  const candidateDraft = active?.anchor_date && active.frequency === frequency && (frequency === "weekly" || frequency === "biweekly") ? nextRecurringDraft(active.anchor_date, today, frequency === "biweekly" ? 14 : 7) : today;
  const firstDraft = (frequency === "weekly" || frequency === "biweekly" ? nextAllowedWeekday(candidateDraft, apiOptions?.weekdayRules?.[frequency]) : candidateDraft) ?? today;
  const [anchor, setAnchor] = useState(firstDraft);
  const [month, setMonth] = useState(firstDraft.slice(0, 7));
  const checking = banks.filter(bank => bank.account_type === "checking");
  const [bankId, setBankId] = useState(checking.find(bank => bank.id === active?.funding_account_id)?.id ?? checking[0]?.id ?? "");
  const [authorizedKey, setAuthorizedKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [acceptedCopy, setAcceptedCopy] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => stepHeading.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [step]);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const monthly = frequency === "monthly" || frequency === "semi_monthly";
  const summary = autoPaySchedule(frequency, day, anchor, today);
  const firstDraftDate = monthly ? autoPaySchedule("monthly", day, anchor, today).nextDate : anchor;
  const preview = useQuery({ queryKey: ["autopay-preview", loan.rtr_loan_id, frequency, firstDraftDate, day], queryFn: ({ signal }) => previewAutopay(loan.rtr_loan_id, { frequency: frequency.toUpperCase() as "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "SEMI_MONTHLY", firstDraftDate, secondDayOfMonth: frequency === "semi_monthly" ? day + 15 : null }, { signal }), enabled: Boolean(apiOptions?.allowedFrequencies.includes(frequency.toUpperCase() as Autopay["allowedFrequencies"][number])) && (monthly || Boolean(apiOptions?.weekdayRules?.[frequency as "weekly" | "biweekly"]?.length)) && step >= 2 });
  const selectedBank = checking.find(bank => bank.id === bankId);
  const monthDate = new Date(month + "-01T00:00:00Z");
  const daysInMonth = monthly ? 31 : new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const maxDay = Math.min(apiOptions?.allowedDays?.to ?? 0, frequency === "semi_monthly" ? 28 - 15 : 31);
  const schedulePreview = usableAutopayPreview(preview.data) ? preview.data : undefined;
  // ACH authorization applies only to the exact schedule shown; any change clears it.
  const termsAvailable = Boolean(apiTerms?.type === "RECURRING" && apiTerms.version.trim() && apiTerms.text.trim() && apiTerms.revocationText.trim());
  const reviewReady = termsAvailable && Boolean(apiOptions && schedulePreview && !preview.isFetching && !preview.isError && selectedBank && bankLast4(selectedBank.account_last4));
  const renderedTerms = apiTerms ? authorizationText(apiTerms, { amount: schedulePreview ? money(schedulePreview.amountPerDraft) : "Unavailable", date: firstDraftDate, schedule: summary.description, last4: bankLast4(selectedBank?.account_last4) }) : "";
  const authKey = JSON.stringify([loan.rtr_loan_id, frequency, day, anchor, firstDraftDate, bankId, apiTerms, preview.data]);
  const authorized = authorizedKey === authKey;
  const setAuthorized = (value: boolean) => setAuthorizedKey(value ? authKey : null);
  const reviewCopy = [`AutoPay authorization — preview copy`, `Loan: ${loan.account_number}`, `Terms version: ${apiTerms?.version ?? ""}`, `Frequency: ${frequencies[frequency].label}`, `Schedule: ${summary.description}`, `First draft: ${firstDraftDate}`, `Per draft: ${schedulePreview ? money(schedulePreview.amountPerDraft) : "Unavailable"}`, `Bank: ${bankAccountLabel(selectedBank?.bank_name, selectedBank?.account_last4)}`, "", schedulePreview?.planDisclosure ?? "", `Rules version: ${schedulePreview?.rulesVersion ?? ""}`, "", renderedTerms, "", apiTerms?.revocationText ?? "", "", "Preview only. No payment or email is sent. This is not a production authorization record."].join("\n");
  function downloadCopy(content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "autopay-authorization.txt"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  useEffect(() => { if (confirmOff) dialogRef.current?.showModal(); else dialogRef.current?.close(); }, [confirmOff]);
  function navigate(next: number) { setError(""); window.history.pushState(null, "", portalHref("/dashboard/payments", loan.rtr_loan_id, { tab: "autopay", frequency, ...(next > 1 ? { step: String(next) } : {}) })); }
  function changeFrequency(value: Frequency) {
    setAuthorized(false); setFrequency(value);
    const nextAnchor = ((value === "weekly" || value === "biweekly") ? nextAllowedWeekday(anchor < today ? today : anchor, apiOptions?.weekdayRules?.[value]) : today) ?? today;
    setAnchor(nextAnchor); setMonth(nextAnchor.slice(0, 7));
    setDay(Math.max(apiOptions?.allowedDays?.from ?? 1, Math.min(day, apiOptions?.allowedDays?.to ?? 1, value === "semi_monthly" ? 28 - 15 : 31)));
    setError(""); setNotice("");
    window.history.replaceState(null, "", portalHref("/dashboard/payments", loan.rtr_loan_id, { tab: "autopay", frequency: value }));
  }
  function changeMonth(offset: number) { const date = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + offset, 1)); setMonth(date.toISOString().slice(0, 7)); }
  async function send(action: "activate" | "turn-off") {
    if (pending || (action === "activate" && (!authorized || !reviewReady))) return;
    setPending(true); setError(""); setNotice("");
    const details = { frequency, day: monthly ? day : null, anchorDate: monthly ? null : anchor, firstDraftDate, termsVersion: apiTerms?.version, fundingAccountId: bankId, expectedScheduleId: active?.id ?? null, reviewedPreview: schedulePreview ? autopayReviewSnapshot(schedulePreview) : null };
    if (action === "activate") {
      const fingerprint = JSON.stringify(details);
      if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const response = await portalRequest("/api/portal/autopay", { action, loanId: loan.rtr_loan_id, ...(action === "activate" ? { ...details, authorized, requestKey: request.current!.key } : { scheduleId: active?.id, confirm: true }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Could not update AutoPay."); return; }
      setConfirmOff(false); setAuthorized(false); request.current = null;
      if (action === "activate") setAcceptedCopy(reviewCopy);
      setNotice(action === "activate" ? "AutoPay is active in this preview. No bank drafts or emails will occur. Download your authorization copy below." : `AutoPay is off. Your payments are still due. Check any separately scheduled payments.${data.lastDraftDate ? ` A draft already in progress may still go out on ${displayDate(data.lastDraftDate, true)}.` : ""}${data.confirmationNumber ? ` Confirmation: ${data.confirmationNumber}.` : ""}`);
      navigate(1); router.refresh();
    } catch { setError("Could not reach the server. Please try again."); }
    finally { setPending(false); }
  }
  const existingDescription = active ? active.frequency === "monthly" ? `on the ${ordinal(active.first_day ?? 1)} of each month` : active.frequency === "semi_monthly" ? `on the ${ordinal(active.first_day ?? 1)} and ${ordinal(active.second_day ?? 16)} of each month` : `every ${active.frequency === "biweekly" ? "other " : ""}${new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date((active.anchor_date ?? active.next_draft_date) + "T00:00:00Z"))}` : "";
  return <main className={page}>
    <PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} />
    <PaymentsHeading loanId={loan.rtr_loan_id} autoPay intro="Review your recurring payment schedule and authorization before enrolling or making changes." />
    {step === 1 ? <section className="tw:mb-[34px] tw:flex tw:items-center tw:justify-between tw:gap-7 tw:rounded-2xl tw:border tw:border-[#d8dcdf] tw:bg-white tw:px-[68px] tw:py-[34px] tw:max-desktop:px-12 tw:max-desktop:py-[30px] tw:max-tablet:flex-wrap tw:max-tablet:gap-5 tw:max-tablet:px-7 tw:max-tablet:py-[26px] tw:max-mobile:mb-6 tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-mobile:gap-6 tw:max-mobile:p-8">
      <div>
        <span className="tw:text-[14px] tw:max-phone:text-[12px]">Enrollment Status</span>
        <div className="tw:mt-[3px] tw:mb-1.5 tw:flex tw:items-center tw:gap-8 tw:max-tablet:gap-5 tw:max-phone:gap-3"><h2 className="tw:text-[42px] tw:leading-[1.3] tw:font-medium tw:tracking-[-1.2px] tw:text-[#007ab4] tw:max-tablet:text-[34px] tw:max-mobile:text-[26px]">AutoPay is {active ? "Active" : "Inactive"}</h2>{active ? <span className={cn(greenBadge, "tw:min-w-[104px] tw:text-center tw:max-phone:min-w-[70px] tw:max-phone:text-[12px]")}>Enrolled</span> : null}</div>
        <p className="tw:text-[14px] tw:leading-[1.7] tw:text-[#4e6586] tw:max-tablet:text-[12px] tw:max-mobile:text-[13px] tw:max-mobile:leading-[1.6]">{active ? `${money(active.amount)} will be drafted ${existingDescription} from ${bankAccountLabel(active.bank_name, active.account_last4)}.` : "Choose a frequency and review the available draft schedule before enrolling."}</p>
      </div>
      {active ? <button className={cn(button.base, button.outline, button.element, "tw:min-w-[228px] tw:text-[18px] tw:leading-[1.5] tw:max-compact:text-[18px] tw:max-tablet:min-w-[180px] tw:max-tablet:text-[16px] tw:max-phone:min-w-0")} disabled={active.customer_id !== customerId || pending} onClick={() => { setError(""); setConfirmOff(true); }}>Turn off AutoPay</button> : <span className="tw:self-start tw:rounded-3xl tw:bg-[#bf2c00] tw:px-[18px] tw:py-1 tw:text-[12px] tw:whitespace-nowrap tw:text-white tw:max-phone:px-3.5 tw:max-phone:text-[12px]">Not Enrolled</span>}
    </section> : null}
    {notice ? <p className="tw:mb-6 tw:rounded-[10px] tw:border tw:border-[#b9d8c5] tw:bg-[#f0fff5] tw:px-[22px] tw:py-3.5 tw:text-[14px] tw:text-[#26793f] tw:max-phone:text-[12px]" role="status">{notice}</p> : null}
    {acceptedCopy ? <div className="tw:mb-6 tw:flex tw:flex-wrap tw:items-center tw:gap-4 tw:text-[14px]"><button type="button" className={cn(button.base, button.outline, button.element, "tw:max-w-full tw:whitespace-normal")} onClick={() => downloadCopy(acceptedCopy)}>Download saved authorization copy</button><p>This preview copy is available for this visit. No email was sent.</p></div> : null}
    <section className={panel}>
      <PaymentStepper label="AutoPay steps" className="tw:max-w-[640px] tw:max-tablet:max-w-[560px]" labelClassName="tw:max-w-[200px] tw:text-center tw:whitespace-normal" labels={["Payment Frequency", monthly ? "Draft Day" : "First Draft Date", frequency === "semi_monthly" || frequency === "biweekly" ? "Checking Account" : "Funding Checking Account"]} step={step} onStep={navigate} /><MobileStepIndicator step={step} label={step === 1 ? "Payment Frequency" : step === 2 ? "Deduction Date" : "Funding Checking Account"} icon={step === 1 ? "amount" : step === 2 ? "calendar" : "bank"} />
      <h2 ref={stepHeading} tabIndex={-1} className="tw:mb-[42px] tw:text-[26px] tw:font-medium tw:tracking-[-.8px] tw:max-tablet:mb-8 tw:max-tablet:text-[24px] tw:max-mobile:mb-6 tw:max-mobile:text-[20px] tw:max-mobile:leading-[1.4]">{step === 1 ? "Select Payment Frequency" : step === 2 ? monthly ? frequency === "semi_monthly" ? "Select First Draft Day" : "Select Draft Day" : "Select First Draft Date" : "Funding Checking Account"}</h2>
      {step === 1 ? <div className={amountGrid}>{(Object.keys(frequencies) as Frequency[]).filter(value => apiOptions?.allowedFrequencies.some(allowed => allowed.toLowerCase() === value)).map(value => { const config = frequencies[value]; const selected = frequency === value; return <button type="button" className={cn(amountCard(selected), "tw:min-h-[190px]")} aria-pressed={selected} onClick={() => changeFrequency(value)} key={value}>
        <span className="tw:text-[14px] tw:text-[#5e7596] tw:max-mobile:px-2 tw:max-mobile:text-[12px]">{config.note}</span>
        <strong className="tw:mx-2 tw:mt-2.5 tw:mb-5 tw:max-w-full tw:px-2 tw:text-[27px] tw:leading-tight tw:font-medium tw:tracking-[-.7px] tw:break-words tw:whitespace-normal tw:text-[#007bb6] tw:max-desktop:text-[24px] tw:max-mobile:text-[clamp(14px,5vw,20px)] tw:max-mobile:tracking-[-0.3px] tw:max-phone:mb-4">{config.label}</strong>
        <small className={cn(amountNote(selected), "tw:mt-auto tw:py-[22px] tw:text-[16px] tw:max-desktop:text-[14px]", selected && "tw:text-[#00649e]")}>{selected ? <><SelectionLabel selected /> · </> : null}Review draft amount next</small>
      </button>; })}</div> : null}
      {step === 2 ? <div className="tw:grid tw:grid-cols-[1fr_1.18fr] tw:items-stretch tw:gap-[18px] tw:max-desktop:grid-cols-[1fr_1.1fr] tw:max-tablet:grid-cols-[1fr] tw:max-tablet:gap-5 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-6">
        <section className="tw:rounded-[10px] tw:border tw:border-[#d8dcdf] tw:bg-white tw:px-[50px] tw:pt-[34px] tw:pb-7 tw:max-desktop:p-[30px] tw:max-tablet:px-11 tw:max-mobile:border-0 tw:max-mobile:p-0">
          <div className="tw:mb-7 tw:flex tw:items-center tw:justify-between tw:gap-[18px] tw:max-desktop:flex-wrap tw:max-desktop:gap-[5px] tw:max-tablet:flex-nowrap tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-2 tw:max-phone:mb-[22px]"><h3 className="tw:text-[16px] tw:font-normal tw:whitespace-nowrap tw:text-[#4e6586]">{monthly ? "Day of the Month" : "First Draft Date"}</h3><span className="tw:text-[12px] tw:whitespace-nowrap tw:text-[#4e6586]">Payment due on the {ordinal(loan.account_due_date ? Number(loan.account_due_date.slice(8, 10)) : 1)}</span></div>
          {!monthly ? <div className="tw:-mt-2.5 tw:mb-5 tw:flex tw:items-center tw:justify-between tw:gap-2.5"><button type="button" className={monthButton} aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => changeMonth(-1)}>‹</button><strong className="tw:text-[13px] tw:font-medium tw:text-[#536e8c] tw:max-phone:text-[11px]">{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate)}</strong><button type="button" className={monthButton} aria-label="Next month" onClick={() => changeMonth(1)}>›</button></div> : null}
          <p id="draft-day-help" className="tw:mb-3 tw:text-[14px] tw:text-[#4e6586]">Use Tab to reach available days, arrow keys to move, and Enter or Space to select. Unavailable days are crossed out.</p>
          <div role="group" aria-label={monthly ? "Draft day choices" : "First draft date choices"} aria-describedby="draft-day-help" onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
            const index = choices.indexOf(event.target as HTMLButtonElement);
            if (index < 0) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? choices.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + choices.length) % choices.length;
            choices[next]?.focus();
          }} className="tw:grid tw:grid-cols-[repeat(7,minmax(0,1fr))] tw:gap-x-[5px] tw:gap-y-[7px] tw:max-mobile:grid-cols-5 tw:max-mobile:gap-2">{Array.from({ length: daysInMonth }, (_, index) => index + 1).map(number => {
            const date = `${month}-${String(number).padStart(2, "0")}`;
            const weekday = new Date(date + "T00:00:00Z").getUTCDay();
            const available = Boolean(apiOptions) && (monthly ? number >= (apiOptions?.allowedDays?.from ?? 1) && number <= Math.min(maxDay, apiOptions?.allowedDays.to ?? maxDay) : date >= today && Boolean(apiOptions?.weekdayRules?.[frequency as "weekly" | "biweekly"]?.includes(weekday)));
            const selected = monthly ? day === number : anchor === date;
            const difference = Math.round((new Date(date + "T00:00:00Z").getTime() - new Date(anchor + "T00:00:00Z").getTime()) / 86400000);
            const recurring = frequency === "semi_monthly" ? number === day + 15 : !monthly && difference > 0 && difference % (frequency === "weekly" ? 7 : 14) === 0;
            return <button type="button" key={number} aria-label={`${monthly ? `Draft day ${number}` : `First draft ${displayDate(date, true)}`}${recurring ? ", scheduled draft" : ""}${!available ? ", unavailable" : ""}`} aria-pressed={selected} className={cn("tw:grid tw:h-11 tw:w-full tw:max-w-[50px] tw:place-items-center tw:justify-self-center tw:rounded-[28px] tw:border tw:p-0 tw:text-[16px] tw:disabled:cursor-default tw:disabled:opacity-100 tw:max-tablet:h-[46px] tw:max-mobile:h-10 tw:max-mobile:min-w-0 tw:max-mobile:rounded-full", selected ? "tw:border-[#007eb4] tw:bg-[#007eb4] tw:text-white tw:max-mobile:bg-[#007caf]" : recurring ? "tw:border-[#149ce4] tw:bg-[#e7f6ff] tw:text-[#00649e] tw:underline tw:max-mobile:border-[#007caf] tw:max-mobile:bg-[#e5f4fc]" : available ? "tw:border-transparent tw:bg-[#eff5fd] tw:text-[#19354d]" : "tw:border-transparent tw:bg-[#f8fafc] tw:text-[#52657e] tw:line-through")} disabled={!available} onClick={() => { setAuthorized(false); if (monthly) setDay(number); else setAnchor(date); }}><span aria-hidden="true">{selected ? "✓" : null}{number}</span></button>;
          })}</div>
          <div className="tw:mt-[50px] tw:flex tw:flex-wrap tw:items-center tw:gap-x-3.5 tw:gap-y-2.5 tw:text-[10px] tw:text-[#4e6586] tw:max-tablet:mt-[30px] tw:max-mobile:gap-3 tw:max-mobile:text-[12px] tw:max-phone:mt-7"><LegendItem tone="selected">Selected</LegendItem>{frequency === "semi_monthly" ? <><LegendItem>Not available</LegendItem><LegendItem tone="scheduled">Scheduled draft</LegendItem><LegendItem tone="available">Available first draft day</LegendItem></> : <><LegendItem tone="available">{monthly ? "Available draft day" : "Available first draft day"}</LegendItem><LegendItem>Not available</LegendItem>{!monthly ? <LegendItem tone="scheduled">Scheduled draft</LegendItem> : null}</>}</div>
        </section>
        <section className="tw:rounded-2xl tw:border-2 tw:border-[#0caaff] tw:bg-white tw:px-[62px] tw:py-[42px] tw:shadow-[0_14px_24px_#0078b018] tw:max-desktop:p-[34px] tw:max-tablet:px-10 tw:max-mobile:border-[#007caf] tw:max-mobile:p-6"><span className="tw:text-[16px] tw:text-[#4e6586] tw:max-phone:text-[13px]">Draft Schedule</span>
          <div className={cn("tw:mt-0.5 tw:mb-[22px] tw:flex tw:justify-between tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-y-4", frequency === "biweekly" ? "tw:flex-wrap tw:items-start tw:gap-x-4 tw:gap-y-2.5" : "tw:items-center tw:gap-4 tw:max-desktop:flex-wrap tw:max-desktop:gap-3 tw:max-mobile:gap-4")}>
            <h3 className="tw:text-[16px] tw:leading-[1.3] tw:font-normal">{monthly ? <><strong className={cn(draftValue, frequency === "semi_monthly" && "tw:text-[48px] tw:whitespace-nowrap tw:max-desktop:text-[48px]")}>{ordinal(day)}{frequency === "semi_monthly" ? ` & ${ordinal(day + 15)}` : ""}</strong><small className="tw:ml-3 tw:text-[16px] tw:text-[#19354d] tw:max-phone:ml-2">of each month</small></> : <><strong className={cn(draftValue, frequency === "biweekly" && "tw:text-[38px] tw:tracking-[-1.2px] tw:max-desktop:text-[38px] tw:max-phone:tracking-[-1.2px]")}>Every {frequency === "biweekly" ? "other " : ""}{summary.weekday}</strong><small className="tw:mt-1 tw:block tw:text-[14px] tw:text-[#19354d] tw:max-mobile:text-[16px]">Starting {displayDate(anchor)}</small></>}</h3>
            {frequency === "monthly" && day === Number(loan.account_due_date?.slice(8, 10) ?? 1) ? <span className={cn(greenBadge, "tw:text-[13px] tw:leading-[1.4] tw:max-phone:px-3 tw:max-phone:text-[12px]")}>On your due date</span> : null}
          </div>
          <dl className="tw:m-0 tw:border-y tw:border-[#c8cdd1] tw:pt-[30px] tw:pb-6 tw:text-[14px] tw:max-phone:pt-6">{([["Per draft", schedulePreview ? money(schedulePreview.amountPerDraft) : "Unavailable"], ["Estimated drafts/year", schedulePreview?.draftsPerYear ?? "Unavailable"], ["Estimated draft total/year", schedulePreview ? money(schedulePreview.totalPerYear) : "Unavailable"]] as const).map(([term, value]) => <div className="tw:mb-3.5 tw:flex tw:justify-between tw:gap-4 tw:last:mb-0" key={term}><dt className="tw:text-[#4e6586]">{term}</dt><dd className="tw:m-0 tw:text-[#1b3048]">{value}</dd></div>)}</dl>
          {schedulePreview ? <p className="tw:mt-5 tw:text-[14px] tw:leading-relaxed" role="note">{schedulePreview.planDisclosure}</p> : null}
          <p className="tw:mt-6 tw:text-[14px] tw:leading-[1.7] tw:text-[#4e6586] tw:max-mobile:leading-[1.6] tw:max-phone:mt-5">{schedulePreview?.explanation ?? (preview.isFetching ? "Loading schedule details..." : "Schedule details are unavailable. Try again or contact Customer Solutions before enrolling.")}</p>
        </section>
      </div> : null}
      {step === 3 ? <>
        <div className="tw:grid tw:gap-4">{checking.map((bank, index) => <button type="button" key={bank.id} className={bankOption(bankId === bank.id)} aria-pressed={bankId === bank.id} onClick={() => { setAuthorized(false); setBankId(bank.id); }}><BankIcon /><span className={cn(bankText, "tw:min-w-0")}><strong className={bankName}>{bankAccountLabel(bank.bank_name, bank.account_last4)}</strong><small className={bankNote}>Verified bank account · Primary Draft Account</small><SelectionLabel selected={bankId === bank.id} /></span>{index === 0 ? <span className="tw:ml-auto tw:rounded-[14px] tw:bg-[#006da5] tw:px-8 tw:py-[5px] tw:text-[14px] tw:text-white tw:max-tablet:px-[22px] tw:max-tablet:text-[12px] tw:max-phone:ml-[50px] tw:max-phone:px-[18px] tw:max-phone:py-1 tw:max-phone:text-[12px]">Primary</span> : null}</button>)}{!checking.length ? <p className={errorText}>No checking account is available. Contact Customer Solutions.</p> : null}</div>
        <section className="tw:mt-[62px] tw:border-t tw:border-t-[#c8cdd1] tw:pt-[60px] tw:max-tablet:mt-[38px] tw:max-tablet:pt-[38px] tw:max-mobile:mt-8 tw:max-phone:pt-[30px]" aria-labelledby="autopay-authorization-title">
          <h3 id="autopay-authorization-title" className="tw:rounded-t-[14px] tw:border-2 tw:border-b-0 tw:border-[#0caaff] tw:bg-[#e6f7ff] tw:px-[46px] tw:py-7 tw:text-[26px] tw:font-medium tw:tracking-[-.7px] tw:max-tablet:px-7 tw:max-tablet:py-6 tw:max-tablet:text-[23px] tw:max-mobile:p-4 tw:max-mobile:text-[16px]">ACH Electronic Authorization</h3>
          <div className="tw:rounded-b-[14px] tw:border-2 tw:border-t-0 tw:border-[#0caaff] tw:px-[46px] tw:pt-[30px] tw:pb-10 tw:shadow-[0_14px_24px_#0078b012] tw:max-tablet:p-7 tw:max-mobile:p-5">
            {reviewReady ? <>
              <dl className="tw:mb-6 tw:grid tw:grid-cols-2 tw:gap-4 tw:text-[14px] tw:max-phone:grid-cols-1">
                {[["Per draft", money(preview.data!.amountPerDraft)], ["Frequency", frequencies[frequency].label], ["Schedule", summary.description], ["First draft", displayDate(firstDraftDate, true)], ["Bank account", bankAccountLabel(selectedBank!.bank_name, selectedBank!.account_last4)]].map(([label, value]) => <div key={label}><dt className="tw:text-[#4e6586]">{label}</dt><dd className="tw:m-0 tw:mt-1 tw:break-words">{value}</dd></div>)}
              </dl>
              <p className="tw:mb-4 tw:text-[14px] tw:leading-relaxed">{schedulePreview!.planDisclosure}</p>
              <p className="tw:whitespace-pre-line tw:text-[16px] tw:leading-[1.8] tw:text-[#304b6d]">{renderedTerms}</p>
              <h4 className="tw:mt-6 tw:font-medium">How to cancel AutoPay</h4>
              <p className="tw:mt-2 tw:whitespace-pre-line tw:text-[16px] tw:leading-[1.7] tw:text-[#304b6d]">{apiTerms!.revocationText}</p>
              <p className="tw:mt-4 tw:text-[13px] tw:text-[#4e6586]">Terms version: {apiTerms!.version}. Download a copy now or after saving. This preview sends no emails.</p>
              <button type="button" className={cn(button.base, button.outline, button.element, "tw:mt-4 tw:max-w-full tw:whitespace-normal")} onClick={() => downloadCopy(reviewCopy)}>Download authorization copy</button>
            </> : <p className={errorText} role="status">The schedule or authorization terms are unavailable. You cannot enroll until the schedule and cancellation instructions are available. Please try again or contact Customer Solutions.</p>}
            <label className="tw:mt-[34px] tw:flex tw:cursor-pointer tw:items-start tw:gap-2.5 tw:text-[16px] tw:max-tablet:text-[14px] tw:max-mobile:gap-3 tw:max-mobile:text-[16px] tw:max-phone:mt-6"><input className="tw:m-0 tw:mt-[3px] tw:size-[19px] tw:shrink-0 tw:accent-[#007bb5] tw:max-phone:size-4" type="checkbox" disabled={!reviewReady || pending} checked={authorized && reviewReady} onChange={event => setAuthorized(event.target.checked)} /><span>I authorize recurring electronic {frequency === "monthly" ? "monthly" : frequency === "weekly" ? "weekly" : frequency === "semi_monthly" ? "semi-monthly" : "bi-weekly"} payments under these terms.</span></label>
          </div>
        </section>
      </> : null}
      {step >= 2 && schedulePreview ? schedulePreview.warnings.map(warning => <p key={warning.code} className={latePill} role="status">{warning.message}</p>) : null}
      {step === 1 && !apiOptions ? <p className={errorText} role="status">AutoPay options are unavailable. Contact Customer Solutions before enrolling.</p> : null}
      {apiOptions && preview.isError ? <p className={errorText} role="alert">Could not preview this schedule. Select another date or try again.</p> : null}
      {error && !confirmOff ? <p className={errorText} role="alert">{error}</p> : null}
      <div className={cn(formActions, step === 3 ? "tw:mt-[62px] tw:max-mobile:mt-8" : "tw:mt-16 tw:max-tablet:mt-10 tw:max-mobile:mt-8")}>{step > 1 ? <button type="button" className={cn(button.base, button.outline, button.element, formButton)} disabled={pending} onClick={() => navigate(step - 1)}>Back</button> : null}{step < 3 ? <button type="button" className={cn(button.base, button.primary, button.element, formButton)} disabled={!apiOptions || (step === 2 && (!schedulePreview || preview.isFetching || preview.isError))} onClick={() => navigate(step + 1)}>Next</button> : <button type="button" className={cn(button.base, button.primary, button.element, formButton)} disabled={!authorized || !reviewReady || pending} onClick={() => void send("activate")}>{pending ? "Activating…" : "Activate AutoPay"}</button>}</div>
    </section>
    <dialog onKeyDown={handleDialogKeyDown} ref={dialogRef} className={dialog} aria-labelledby="autopay-off-title" onCancel={event => { event.preventDefault(); if (!pending) setConfirmOff(false); }}><div className={dialogContent}><button className={dialogClose} aria-label="Close dialog" disabled={pending} onClick={() => setConfirmOff(false)}>×</button><h2 className={dialogTitle} id="autopay-off-title">Turn off AutoPay?</h2><p className={dialogText}>Turning off AutoPay does not remove your payment obligation. Separately scheduled one-time payments are not cancelled by this action. Review the cancellation instructions below before confirming.</p><p className={dialogText}>{termsAvailable ? apiTerms!.revocationText : "Cancellation instructions are unavailable. Contact Customer Solutions if you need help with an upcoming draft."}</p><div className={dialogActions}><button className={cn(dialogButton, button.outline, button.element)} disabled={pending} onClick={() => setConfirmOff(false)}>Keep AutoPay</button><button className={cn(dialogButton, danger, button.element)} disabled={pending} onClick={() => void send("turn-off")}>{pending ? "Turning off…" : "Yes, turn off AutoPay"}</button></div>{error ? <p className={errorText} role="alert">{error}</p> : null}</div></dialog>
  </main>;
}
