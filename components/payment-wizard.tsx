"use client";
import { handleDialogKeyDown } from "./payment-ui";
import { MobileStepIndicator } from "./portal-mobile-controls";
import type { PaymentOptions, AuthorizationTerms } from "@/lib/api/generated/model";
import { authorizationText } from "@/lib/api/authorization";
import { button, cn, page } from "./portal-ui";
import { amountCard, amountGrid, amountNote, BankIcon, bankName, bankNote, bankOption, bankText, danger, dialog, dialogActions, dialogButton, dialogClose, dialogContent, dialogText, dialogTitle, errorText, formActions, formButton, greenBadge, panel, PaymentsHeading, PaymentStepper, SelectionLabel } from "./payment-ui";
import { usePortalRequest } from "./portal-request";


import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortalBackBar from "./portal-back-bar";
import type { PortalLoan } from "@/lib/portal-data";
import { bankAccountLabel, bankLast4, displayDate, money, portalHref } from "@/lib/portal-format";
import { centsAmount, inputCents } from "@/lib/payment-types";
import { paymentAmountError } from "@/lib/payment-rules";
import { borrowerMockMode } from "@/lib/mock-mode";
import type { FundingAccount, ScheduledPayment } from "@/lib/payment-types";

const field = "tw:flex tw:flex-col tw:gap-6 tw:max-mobile:w-full tw:max-phone:gap-4";
const fieldLabel = "tw:flex tw:items-center tw:justify-between tw:gap-3.5 tw:text-[16px] tw:max-tablet:text-[14px] tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5] tw:max-phone:flex-wrap tw:max-phone:gap-x-2.5 tw:max-phone:gap-y-1";
const fieldInput = "tw:h-[61px] tw:w-full tw:rounded-[10px] tw:border tw:border-[#6b7c8e] tw:bg-white tw:px-6 tw:py-4 tw:text-[16px] tw:text-[#4e6586] tw:outline-none tw:scheme-light tw:placeholder:text-[#889cba] tw:focus:border-[#0a98e0] tw:focus:shadow-[0_0_0_2px_#078ac415] tw:max-mobile:h-[60px] tw:max-mobile:min-w-0 tw:max-phone:px-4 tw:max-phone:py-3.5";
const scheduledButton = cn(button.base, button.element, "tw:min-h-[50px] tw:px-6 tw:max-compact:min-h-[50px] tw:max-compact:px-6 tw:max-phone:flex-1");
const scheduledNote = "tw:mt-[5px] tw:text-[12px] tw:text-[#4e6586] tw:max-mobile:text-[14px] tw:max-mobile:leading-[1.5]";
const demoNote = "tw:py-3 tw:text-[13px] tw:leading-[1.7] tw:text-[#55758b] tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5]";
type Modal = { type: "review" | "cancel" | "date" | "success"; payment?: ScheduledPayment } | null;

export default function PaymentWizard({ loan, banks, scheduled, today, apiOptions, apiTerms }: { loan: PortalLoan; banks: FundingAccount[]; scheduled: ScheduledPayment[]; today: string; apiOptions?: PaymentOptions; apiTerms?: AuthorizationTerms }) {
  const portalRequest = usePortalRequest();
  const router = useRouter();
  const params = useSearchParams();
  const autoPay = params.get("tab") === "autopay";
  const step = Math.max(1, Math.min(3, Number(params.get("step")) || 1));
  const [amountType, setAmountType] = useState("regular");
  const [customAmount, setCustomAmount] = useState("");
  const [extraPrincipal, setExtraPrincipal] = useState("");
  const dateRules = apiOptions?.dateOptions;
  const dateLimits = { min: dateRules?.earliestDate ?? "", max: dateRules?.latestDate ?? "" };
  const dueDate = dateRules?.dueDate ?? loan.account_due_date ?? "";
  const lateFeeNote = borrowerMockMode
    ? "Late-fee timing and amount are not verified for this preview loan. Check the loan terms."
    : apiOptions?.lateFee?.appliesAfter
      ? `A late fee may apply after ${displayDate(apiOptions.lateFee.appliesAfter)}.`
      : "Late-fee date unavailable. Check your loan terms or contact Customer Solutions.";
  function availableDate(date: string) {
    if (!dateRules || !date || date < today || date < dateLimits.min || date > dateLimits.max || dateRules.blockedDates.includes(date)) return false;
    return date !== today || Boolean(apiOptions?.sameDayCutoff && Date.now() < Date.parse(apiOptions.sameDayCutoff));
  }
  const [dateType, setDateType] = useState(() => availableDate(today) ? "today" : availableDate(dueDate) ? "due" : "custom");
  const [customDate, setCustomDate] = useState(dateLimits.min);
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [modal, setModal] = useState<Modal>(null);
  const [authorizedKey, setAuthorizedKey] = useState<string | null>(null);
  const [changedDate, setChangedDate] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState({ confirmation: "", status: "" });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const returnToEdit = useRef(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => stepHeading.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [step]);
  const form = useRef<HTMLFormElement>(null);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const amounts: Record<string, string | null> = apiOptions ? { regular: apiOptions.amountOptions.find(option => option.type === "REGULAR")?.amount ?? null, due: apiOptions.amountOptions.find(option => option.type === "TOTAL_DUE")?.amount ?? null } : { regular: loan.account_payment_amount, due: loan.account_total_due };
  const baseCents = amountType === "custom" ? inputCents(customAmount) : inputCents(amounts[amountType] ?? "0.00");
  const extraCents = inputCents(extraPrincipal || "0");
  const total = (baseCents ?? 0) + (extraCents ?? 0);
  const processDate = dateType === "today" ? today : dateType === "due" ? dueDate : customDate;
  const bank = banks.find(item => item.id === bankId);
  useEffect(() => { if (modal && !dialogRef.current?.open) dialogRef.current?.showModal(); else if (!modal) dialogRef.current?.close(); }, [modal]);
  useEffect(() => {
    if (modal || !returnToEdit.current) return;
    returnToEdit.current = false;
    const frame = requestAnimationFrame(() => {
      const heading = stepHeading.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      window.scrollTo(0, Math.max(0, window.scrollY + heading.getBoundingClientRect().top - 24));
    });
    return () => cancelAnimationFrame(frame);
  }, [modal, step]);
  // ACH authorization applies only to the exact payment shown; any change clears it.
  const termsAvailable = Boolean(apiTerms?.type === "ONE_TIME" && apiTerms.version?.trim() && apiTerms.text?.trim() && apiTerms.revocationText?.trim());
  const feeCents = inputCents(apiOptions?.paymentFee);
  const amountError = paymentAmountError(apiOptions, baseCents, extraCents, amountType === "custom");
  const reviewReady = !amountError && termsAvailable && feeCents !== null && Boolean(bank && bankLast4(bank.account_last4) && dateRules);
  const authKey = JSON.stringify([loan.rtr_loan_id, amountType, baseCents, extraCents, processDate, bank, apiOptions?.paymentFee, apiTerms]);
  const authorized = authorizedKey === authKey;
  const setAuthorized = (value: boolean) => setAuthorizedKey(value ? authKey : null);
  function navigate(nextStep: number) {
    setError("");
    // These steps share one payment draft. A server navigation can remount the
    // wizard and silently replace the reviewed amount with the regular payment.
    window.history.pushState(null, "", portalHref("/dashboard/payments", loan.rtr_loan_id, nextStep > 1 ? { step: String(nextStep) } : {}));
  }
  function validAmount() {
    if (amountError) { setError(amountError); return false; }
    return true;
  }
  function validDate(date = processDate) {
    if (!dateRules) { setError("Payment dates are unavailable. Contact Customer Solutions before scheduling a draft."); return false; }
    if (!availableDate(date)) { setError("Select an available draft date before the cutoff."); return false; }
    return true;
  }
  function next() {
    if (!form.current?.reportValidity()) return;
    if (!validAmount()) { if (step !== 1) navigate(1); return; }
    if (step > 1 && !validDate()) return;
    if (step < 3) navigate(step + 1); else review();
  }
  function review() {
    if (!validAmount() || !validDate()) return;
    if (!bank) { setError("Select an available bank account."); return; }
    setAuthorized(false); setError(""); setModal({ type: "review" });
  }
  function editReview() {
    returnToEdit.current = true;
    setAuthorized(false);
    navigate(1);
    setModal(null);
  }
  async function send(action: "create" | "change-date" | "cancel") {
    if (pending) return;
    if (action === "create" && (!authorized || !reviewReady || !validAmount() || !validDate())) return;
    if (action === "change-date" && !validDate(changedDate)) return;
    setPending(true); setError("");
    const payload = { amountType, customAmount, extraPrincipal: extraPrincipal || "0", processDate, fundingAccountId: bankId, termsVersion: apiTerms?.version, reviewedAmount: centsAmount(baseCents ?? 0), reviewedFee: apiOptions?.paymentFee, reviewedTerms: apiTerms?.text, reviewedRevocation: apiTerms?.revocationText };
    if (action === "create") {
      const fingerprint = JSON.stringify(payload);
      if (idempotency.current?.fingerprint !== fingerprint) idempotency.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const response = await portalRequest("/api/portal/payments", { action, loanId: loan.rtr_loan_id, ...(action === "create" ? { ...payload, authorized, idempotencyKey: idempotency.current!.key } : { paymentId: modal?.payment?.id, amount: modal?.payment?.amount, originalDate: modal?.payment?.process_date, bankName: modal?.payment?.bank_name, last4: modal?.payment?.account_last4, confirm: action === "cancel", processDate: changedDate }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Could not update this payment."); return; }
      if (data.redirectTo) { router.push(data.redirectTo); setModal(null); return; }
      if (action === "create") { setResult({ confirmation: data.confirmation_number, status: data.status }); setModal({ type: "success" }); idempotency.current = null; }
      else setModal(null);
      router.refresh();
    } catch { setError("The outcome could not be confirmed. Check your payment history before trying again; the same attempt key will be reused for unchanged details."); }
    finally { setPending(false); }
  }
  function showModal(type: "cancel" | "date", payment: ScheduledPayment) { setError(""); setChangedDate(payment.process_date); setModal({ type, payment }); }
  return <main className={page}>
    <PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} />
    <PaymentsHeading loanId={loan.rtr_loan_id} autoPay={autoPay} intro="Make a payment now or schedule one on an available date." />
    {autoPay ? <section className="tw:flex tw:min-h-[230px] tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-6 tw:py-12 tw:text-center tw:max-mobile:min-h-[210px] tw:max-mobile:p-8"><h2 className="tw:text-[20px] tw:font-medium">AutoPay Schedule</h2><p className="tw:text-[16px] tw:text-(--pp-muted)">AutoPay setup will be available soon. Contact Customer Solutions for assistance.</p><Link className={cn(button.base, button.primary, "tw:mt-[18px]")} href="/contact">Contact Customer Solutions</Link></section> : <section className={panel}>
      <PaymentStepper label="Payment steps" labels={["Payment Amount", "Process Date", "Bank Account"]} step={step} onStep={navigate} /><MobileStepIndicator step={step} label={step === 1 ? "Payment Amount" : step === 2 ? "Process Date" : "Bank Account"} icon={step === 1 ? "amount" : step === 2 ? "calendar" : "bank"} />
      <form ref={form} onSubmit={event => { event.preventDefault(); next(); }}>
        <div className="tw:mb-[42px] tw:flex tw:items-center tw:justify-between tw:gap-4 tw:max-mobile:mb-6 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:gap-3"><h2 ref={stepHeading} tabIndex={-1} className="tw:text-[26px] tw:font-medium tw:tracking-[-.8px] tw:max-tablet:text-[24px] tw:max-mobile:text-[20px] tw:max-mobile:leading-[1.3]">{step === 1 ? "Select Payment Amount" : step === 2 ? "Choose Process Date" : "Bank Account"}</h2>{step === 3 ? <span className="tw:text-[14px] tw:text-[#237a36] tw:max-phone:pt-[7px] tw:max-phone:text-[10px] tw:max-phone:whitespace-nowrap">{apiOptions?.paymentFee != null ? `Payment fee: ${money(apiOptions.paymentFee)}` : "Payment fee unavailable"}</span> : null}</div>
        {step === 1 ? <>
          <p className={demoNote}>{apiOptions?.maximumTotalAmount ? `Maximum payment plus additional principal: ${money(apiOptions.maximumTotalAmount)}. This limit is not a payoff quote.` : "Payment limits are unavailable. Contact Customer Solutions before submitting."}</p>
          <div className={cn(amountGrid, "tw:grid-cols-[repeat(3,minmax(0,1fr))]")}>{[["regular", "Regular Payment", `Due: ${displayDate(loan.account_due_date, true)}`], ["due", "Total Amount Due", ""], ["custom", "Other Amount", "Specify exact dollar amount"]].map(([value, label, description]) => <button type="button" key={value} className={cn(amountCard(amountType === value), value === "custom" && "tw:max-tablet:col-span-full")} disabled={value !== "custom" && !amounts[value]} aria-pressed={amountType === value} onClick={() => { setAuthorized(false); setAmountType(value); setError(""); }}>
            <span className="tw:text-[11px] tw:font-semibold tw:tracking-[1.2px] tw:text-[#5e7596] tw:uppercase tw:max-mobile:px-2 tw:max-mobile:text-[12px] tw:max-mobile:tracking-normal tw:max-mobile:normal-case">{label}</span>
            <strong className="tw:mx-1 tw:mt-2.5 tw:mb-3 tw:text-[42px] tw:font-medium tw:tracking-[-1.4px] tw:whitespace-nowrap tw:text-[#007bb6] tw:max-desktop:text-[32px] tw:max-tablet:text-[36px] tw:max-mobile:px-0 tw:max-mobile:text-[clamp(14px,5vw,20px)] tw:max-mobile:tracking-[-0.3px] tw:max-phone:mx-[3px] tw:max-phone:mb-2.5">{value === "custom" ? "Custom" : money(amounts[value])}</strong>
            <small className={amountNote(amountType === value)}>{amountType === value ? <><SelectionLabel selected />{description ? " · " : null}</> : null}{description || " "}</small>
          </button>)}</div>
          <aside className="tw:mt-6 tw:flex tw:items-center tw:justify-between tw:gap-5 tw:rounded-xl tw:border tw:border-[#d8e5ed] tw:bg-[#f4f9fc] tw:p-5 tw:max-mobile:flex-col tw:max-mobile:items-stretch" aria-label="Payoff quote information">
            <p className="tw:m-0 tw:max-w-[620px] tw:text-[16px] tw:leading-[1.6] tw:text-[#304b6d]">Paying off your loan? Request an official payoff quote for the amount and exact good-through date. Your loan balance is not a payoff quote.</p>
            <Link className={cn(button.base, button.outline, "tw:shrink-0 tw:px-5 tw:text-[16px] tw:max-mobile:w-full")} href={portalHref("/dashboard/documents", loan.rtr_loan_id, { tab: "payoff" })}>Request Payoff Quote</Link>
          </aside>
          <div className={cn("tw:mt-[60px] tw:max-tablet:mt-9 tw:max-mobile:mt-7 tw:max-mobile:grid tw:max-mobile:grid-cols-1 tw:max-mobile:gap-5", amountType === "custom" && "tw:grid tw:grid-cols-[1fr_1fr] tw:gap-4")}>{amountType === "custom" ? <label className={field}><span className={fieldLabel}>Custom amount ($):</span><input className={fieldInput} name="customAmount" type="number" min={apiOptions?.customAmountLimits.min ?? "0.01"} max={apiOptions?.customAmountLimits.max ?? "0"} step="0.01" required value={customAmount} onChange={event => { setAuthorized(false); setCustomAmount(event.target.value); }} placeholder="0.00" /></label> : null}<label className={field}><span className={fieldLabel}>Additional Principal Reduction ($): <small className="tw:text-[14px] tw:font-normal tw:whitespace-nowrap tw:text-[#00845e] tw:max-tablet:text-[11px] tw:max-mobile:mt-1 tw:max-mobile:block tw:max-mobile:text-[12px]">{"Subject to your loan rules"}</small></span><input className={fieldInput} name="extraPrincipal" disabled={apiOptions ? !apiOptions.additionalPrincipalAllowed : false} type="number" min="0" max="9999999999.99" step="0.01" value={extraPrincipal} onChange={event => { setAuthorized(false); setExtraPrincipal(event.target.value); }} placeholder="0.00" /></label></div>
        </> : null}
        {step === 2 ? <>
          {!dateRules ? <p className={errorText} role="status">Payment dates are unavailable. <Link href="/contact">Contact Customer Solutions</Link> before scheduling a draft.</p> : null}
          <div className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-x-3.5 tw:gap-y-6 tw:max-tablet:grid-cols-[1fr] tw:max-tablet:gap-4 tw:max-mobile:grid-cols-1">{[["today", "Process Today", "Subject to the available draft date and cutoff"], ["due", "Schedule on Due Date", dueDate ? `Drafted on ${displayDate(dueDate, true)}` : "Due date unavailable"], ["custom", "Choose an Available Date", dateRules ? `Available range: ${displayDate(dateLimits.min, true)} to ${displayDate(dateLimits.max, true)}. Unavailable dates cannot be selected.` : "Payment dates are unavailable. Contact Customer Solutions."]].map(([value, title, description]) => {
            const selected = dateType === value;
            return <label key={value} className={cn("tw:relative tw:flex tw:min-h-[104px] tw:cursor-pointer tw:items-center tw:gap-6 tw:rounded-2xl tw:bg-white tw:has-[input:focus-visible]:outline-3 tw:has-[input:focus-visible]:outline-offset-3 tw:has-[input:focus-visible]:outline-solid tw:has-[input:focus-visible]:outline-[#71caff] tw:has-[input:disabled]:cursor-not-allowed tw:has-[input:disabled]:opacity-50 tw:max-desktop:gap-[18px] tw:max-mobile:min-h-[110px] tw:max-mobile:flex-wrap tw:max-mobile:gap-3 tw:max-mobile:p-5", selected ? "tw:border-2 tw:border-[#0caaff] tw:px-[63px] tw:py-[25px] tw:shadow-[0_10px_24px_#0078b00b] tw:max-desktop:px-[29px] tw:max-desktop:py-[23px] tw:max-tablet:px-[23px]" : "tw:border tw:border-[#d8dcdf] tw:px-16 tw:py-[26px] tw:max-desktop:px-[30px] tw:max-desktop:py-6 tw:max-tablet:px-6", value === "custom" && "tw:col-span-full tw:items-start tw:max-tablet:col-auto")}>
              <input className="tw:absolute tw:left-[60px] tw:size-6 tw:opacity-0" type="radio" name="dateType" value={value} checked={selected} onChange={() => { setAuthorized(false); setDateType(value); setError(""); }} disabled={value === "custom" ? !dateRules || dateLimits.min > dateLimits.max : !availableDate(value === "due" ? dueDate : today)} />
              <span className={cn("tw:size-[21px] tw:flex-[0_0_21px] tw:rounded-full tw:border-4 tw:max-phone:size-[18px] tw:max-phone:basis-[18px]", value === "custom" && "tw:mt-1", selected ? "tw:border-[#c6ecff] tw:bg-[#08a5fd] tw:shadow-[0_0_0_3px_#e3f5ff]" : "tw:border-[#c0c5ca] tw:bg-white tw:max-phone:border-3")} />
              <span className="tw:min-w-0 tw:flex-1"><strong className="tw:block tw:text-[20px] tw:font-medium tw:tracking-[-.4px] tw:max-desktop:text-[18px] tw:max-tablet:text-[17px] tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.4] tw:max-phone:tracking-[-.2px]">{title}</strong><small className="tw:mt-[3px] tw:block tw:text-[16px] tw:text-[#4e6586] tw:max-desktop:text-[14px] tw:max-tablet:text-[13px] tw:max-mobile:mt-2 tw:max-mobile:leading-[1.4]">{description}</small>{value === "custom" ? <span className="tw:mt-4 tw:block tw:rounded-xl tw:bg-[#edf3f8] tw:px-3 tw:py-2.5 tw:text-[13px] tw:leading-[1.5] tw:text-[#304b6d]">{lateFeeNote}</span> : null}</span>
            </label>;
          })}</div>
          {dateType === "custom" ? <label className={cn(field, "tw:mt-[60px] tw:max-tablet:mt-9")}><span className={fieldLabel}>Draft date ({displayDate(dateLimits.min)}–{displayDate(dateLimits.max)}):</span><input className={fieldInput} name="processDate" type="date" min={dateLimits.min || undefined} max={dateLimits.max || undefined} value={customDate} onChange={event => { setAuthorized(false); setCustomDate(event.target.value); }} required /></label> : null}
        </> : null}
        {step === 3 ? <>
          <div className="tw:grid tw:gap-4">{banks.map(item => <button type="button" key={item.id} className={bankOption(bankId === item.id)} aria-pressed={bankId === item.id} onClick={() => { setAuthorized(false); setBankId(item.id); }}><BankIcon /><span className={bankText}><strong className={bankName}>{bankAccountLabel(item.bank_name, item.account_last4)}</strong><small className={bankNote}>Verified bank account · Primary Draft Account</small><SelectionLabel selected={bankId === item.id} /></span></button>)}{!banks.length ? <p className={errorText}>No bank account is available for this borrower. Contact Customer Solutions.</p> : null}</div>
          <div className="tw:mt-[62px] tw:mb-11 tw:flex tw:items-center tw:justify-between tw:gap-6 tw:border-t tw:border-t-[#cbd0d4] tw:pt-[62px] tw:max-tablet:mt-[38px] tw:max-tablet:pt-[38px] tw:max-mobile:mt-8 tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-mobile:pt-8 tw:max-mobile:text-left tw:max-phone:mb-[30px] tw:max-phone:flex-wrap">
            <div><span className="tw:text-[14px] tw:text-[#395574] tw:max-phone:text-[11px]">Total Amount to Process:</span><strong className="tw:block tw:text-[40px] tw:leading-[1.25] tw:font-medium tw:tracking-[-1.4px] tw:text-[#007bb6]">{money(total / 100)}</strong><small className="tw:mt-1.5 tw:block tw:text-[14px] tw:text-[#4e6586]">Draft Date: {displayDate(processDate, true)}</small></div>
          </div>
          <section className="tw:overflow-hidden tw:rounded-[14px] tw:border-2 tw:border-[#0caaff] tw:shadow-[0_12px_22px_#0078b010] tw:max-mobile:mt-8 tw:max-mobile:rounded-2xl">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:bg-[#e6f7ff] tw:px-[42px] tw:py-[30px] tw:max-desktop:p-6 tw:max-mobile:flex-col tw:max-mobile:items-start tw:max-mobile:p-5"><div><span className="tw:text-[14px] tw:text-[#4e6586] tw:max-tablet:text-[12px] tw:max-phone:text-[10px]">Pending Processing Queue</span><h3 className="tw:mt-[3px] tw:text-[20px] tw:font-medium tw:max-tablet:text-[18px] tw:max-mobile:text-[20px] tw:max-mobile:leading-[1.3]">Scheduled Upcoming Payments</h3></div><span className={greenBadge}>{scheduled.length} Active {scheduled.length === 1 ? "Draft" : "Drafts"}</span></div>
            <div className="tw:grid tw:gap-3.5 tw:px-[42px] tw:py-[30px] tw:max-desktop:p-6 tw:max-mobile:p-5">{scheduled.map(payment => <article className="tw:flex tw:items-center tw:justify-between tw:gap-5 tw:rounded-xl tw:border tw:border-[#e9edf0] tw:bg-[#f7f9fb] tw:p-3.5 tw:max-desktop:flex-wrap tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-phone:p-3" key={payment.id}>
              <div><strong className="tw:text-[14px] tw:font-medium tw:max-mobile:text-[18px]">{money(payment.amount)} Scheduled ACH Draft</strong><p className={scheduledNote}>Draft Date: {displayDate(payment.process_date, true)} via {bankAccountLabel(payment.bank_name, payment.account_last4)}</p></div>
              <div className="tw:flex tw:gap-2 tw:max-desktop:ml-auto tw:max-mobile:w-full tw:max-mobile:flex-col tw:max-mobile:gap-3"><button type="button" className={cn(scheduledButton, button.outline)} onClick={() => showModal("date", payment)}>Change Date</button><button type="button" className={cn(scheduledButton, danger)} onClick={() => showModal("cancel", payment)}>Cancel Payment</button></div>
            </article>)}{!scheduled.length ? <p className={scheduledNote}>No scheduled payments.</p> : null}</div>
          </section>
        </> : null}
        {error && !modal ? <p className={errorText} role="alert">{error}</p> : null}
        <div className={cn(formActions, ((step === 2 && dateType !== "custom") || step === 3) && "tw:mt-[62px] tw:max-mobile:mt-8")}>{step > 1 ? <button type="button" className={cn(button.base, button.outline, button.element, formButton)} onClick={() => navigate(step - 1)}>Back</button> : null}<button type="submit" className={cn(button.base, button.primary, button.element, formButton)} disabled={(step === 3 && !bank) || (step === 2 && !dateRules)}>{step === 3 ? "Review & Authorize" : "Next"}</button></div>
      </form>
    </section>}
    <dialog onKeyDown={handleDialogKeyDown} ref={dialogRef} className={dialog} aria-labelledby="payment-dialog-title" onCancel={event => { event.preventDefault(); if (!pending) setModal(null); }} onClick={event => { if (event.target === event.currentTarget && !pending) setModal(null); }}><div className={dialogContent}><button className={dialogClose} aria-label="Close dialog" disabled={pending} onClick={() => setModal(null)}>×</button>
      <h2 className={cn(dialogTitle, modal?.type === "review" && "tw:max-mobile:mb-4 tw:max-mobile:whitespace-nowrap tw:max-mobile:text-[clamp(16px,5.1vw,20px)] tw:max-mobile:tracking-[-.6px] tw:max-phone:text-[clamp(16px,5.1vw,20px)]")} id="payment-dialog-title">{modal?.type === "review" ? "Review & Authorize Payment" : modal?.type === "cancel" ? "Cancel payment?" : modal?.type === "date" ? "Change draft date" : "Preview payment confirmed"}</h2>
      {modal?.type === "review" ? <>
        <dl className="tw:m-0 tw:rounded-xl tw:bg-[#eef9ff] tw:p-[18px] tw:max-mobile:p-4 tw:max-phone:p-3.5">{([["Total payment", money(total / 100)], ["Additional principal", money((extraCents ?? 0) / 100)], ["Payment fee", feeCents !== null ? money(feeCents / 100) : "Unavailable"], ["Draft date", displayDate(processDate, true)], ["Bank account", <>{bankAccountLabel(bank?.bank_name, bank?.account_last4)}</>]] as const).map(([term, value]) => <div className="tw:flex tw:items-center tw:justify-between tw:gap-5 tw:py-2 tw:text-[15px] tw:max-mobile:py-1.5 tw:max-phone:gap-3.5 tw:max-phone:text-[12px]" key={term}><dt className="tw:text-[#4e6586]">{term}</dt><dd className="tw:m-0 tw:text-right tw:font-medium">{value}</dd></div>)}</dl>
        <p className={demoNote}>Preview payment. No funds will be withdrawn.</p>
        <label className="tw:my-3.5 tw:flex tw:items-start tw:gap-3 tw:text-[14px] tw:leading-[1.6] tw:max-phone:text-[12px]"><input className="tw:mt-1 tw:size-[18px] tw:shrink-0 tw:accent-[#007ab5]" type="checkbox" disabled={!reviewReady || pending} checked={authorized && reviewReady} onChange={event => setAuthorized(event.target.checked)} /><span>{termsAvailable ? authorizationText(apiTerms!, { amount: money(total / 100), date: processDate, schedule: "one time", last4: bankLast4(bank?.account_last4) }) : "Authorization terms are unavailable. Contact Customer Solutions before making a payment."}</span></label>
        {termsAvailable ? <><p className={dialogText}>{apiTerms!.revocationText}</p><p className={demoNote}>Terms version: {apiTerms!.version}</p></> : null}{!reviewReady ? <p className={errorText} role="status">Payment authorization, fee or account details are unavailable. Confirmation is disabled. Refresh and review the details or contact Customer Solutions.</p> : null}
        <div className={cn(dialogActions, "tw:sticky tw:bottom-0 tw:z-10 tw:bg-white tw:pt-3 tw:pb-1 tw:max-mobile:flex-row tw:max-mobile:gap-2 tw:max-mobile:shadow-[0_-8px_16px_#ffffff]")}><button className={cn(dialogButton, button.outline, button.element, "tw:max-mobile:min-w-0 tw:max-mobile:w-auto tw:max-mobile:flex-1 tw:max-mobile:px-2 tw:max-mobile:text-[14px]")} disabled={pending} onClick={editReview}>Edit details</button><button className={cn(dialogButton, button.primary, button.element, "tw:max-mobile:min-w-0 tw:max-mobile:w-auto tw:max-mobile:flex-1 tw:max-mobile:px-2 tw:max-mobile:text-[14px]")} disabled={!authorized || !reviewReady || pending} onClick={() => void send("create")}>{pending ? "Submitting…" : "Confirm Payment"}</button></div>
      </> : null}
      {modal?.type === "cancel" ? <><p className={dialogText}>Cancel the scheduled {money(modal.payment?.amount)} draft for {displayDate(modal.payment?.process_date, true)}? Your amount due will remain unchanged.</p><div className={dialogActions}><button className={cn(dialogButton, button.outline, button.element)} disabled={pending} onClick={() => setModal(null)}>Keep payment</button><button className={cn(dialogButton, danger, button.element)} disabled={pending} onClick={() => void send("cancel")}>{pending ? "Cancelling…" : "Yes, cancel payment"}</button></div></> : null}
      {modal?.type === "date" ? <form onSubmit={event => { event.preventDefault(); void send("change-date"); }}><label className={field}><span className={fieldLabel}>New draft date</span><input className={fieldInput} name="changedDate" type="date" min={dateLimits.min || undefined} max={dateLimits.max || undefined} required value={changedDate} onChange={event => setChangedDate(event.target.value)} /></label><div className={dialogActions}><button type="button" className={cn(dialogButton, button.outline, button.element)} disabled={pending} onClick={() => setModal(null)}>Keep date</button><button className={cn(dialogButton, button.primary, button.element)} disabled={pending}>{pending ? "Saving…" : "Save new date"}</button></div></form> : null}
      {modal?.type === "success" ? <><p className={dialogText}>Your preview payment is {result.status === "scheduled" ? "scheduled" : result.status === "processing" ? "processing" : "awaiting status confirmation"}.</p><strong className="tw:block tw:rounded-[10px] tw:border tw:border-[#b8dce9] tw:bg-[#edfaff] tw:p-[18px] tw:text-[18px] tw:wrap-anywhere">{result.confirmation}</strong><p className={demoNote}>Preview record. No payment was sent.</p><div className={dialogActions}><button className={cn(dialogButton, button.primary, button.element)} onClick={() => setModal(null)}>Done</button><Link className={cn(dialogButton, button.outline)} href={portalHref("/dashboard/payment-history", loan.rtr_loan_id)}>Payment History</Link></div></> : null}
      {error && modal ? <p className={errorText} role="alert">{error}</p> : null}
    </div></dialog>
  </main>;
}
