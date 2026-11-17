// Styles and pieces shared by the one-time payment and AutoPay wizards.
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { MobileSectionSelect } from "./portal-mobile-controls";
import { button, cn, pageHeading, pageIntro, pageTitle, segment, segmented } from "./portal-ui";
import { portalHref } from "@/lib/portal-format";

export const panel = "tw:rounded-2xl tw:border tw:border-[#d8dcdf] tw:bg-white tw:px-[68px] tw:py-[65px] tw:max-desktop:p-12 tw:max-tablet:px-7 tw:max-tablet:py-[38px] tw:max-mobile:p-8 tw:max-[300px]:p-4";
export const greenBadge = "tw:inline-block tw:rounded-[20px] tw:bg-[#237a36] tw:px-[18px] tw:py-[5px] tw:text-[14px] tw:leading-[1.4] tw:whitespace-nowrap tw:text-white tw:max-phone:px-2.5 tw:max-phone:py-1 tw:max-phone:text-[12px]";
export const errorText = "tw:mt-5 tw:text-[15px] tw:text-[#b13f29]";
export const danger = "tw:border-[#ed653e] tw:bg-white tw:text-[#df3e0d] tw:hover:bg-[#fff3ee]";
export const formActions = "tw:mt-8 tw:flex tw:justify-end tw:gap-2 tw:max-mobile:flex-col-reverse tw:max-mobile:gap-4";
export const formButton = "tw:min-w-[148px] tw:max-mobile:w-full tw:max-phone:min-w-[100px]";

/** Selectable amount/frequency card. */
export const amountGrid = "tw:grid tw:grid-cols-[repeat(4,minmax(0,1fr))] tw:gap-7 tw:max-desktop:gap-5 tw:max-tablet:grid-cols-[repeat(2,minmax(0,1fr))] tw:max-mobile:grid-cols-2 tw:max-mobile:gap-1.5 tw:max-[300px]:grid-cols-1";
export const amountCard = (selected: boolean) => cn("tw:flex tw:flex-col tw:items-center tw:overflow-hidden tw:rounded-2xl tw:px-0 tw:pb-0 tw:bg-white tw:text-center tw:max-mobile:min-h-40 tw:max-mobile:min-w-0 tw:max-mobile:rounded-[14px] tw:max-mobile:pt-5", selected ? "tw:border-2 tw:border-[#0caaff] tw:pt-[29px] tw:shadow-[0_12px_24px_#0078b012]" : "tw:border tw:border-[#d8dcdf] tw:pt-[30px]");
export const amountNote = (selected: boolean) => cn("tw:block tw:self-stretch tw:px-2 tw:py-5 tw:text-[14px] tw:text-[#4e6586] tw:max-desktop:text-[12px] tw:max-mobile:mt-auto tw:max-mobile:min-h-[60px] tw:max-mobile:w-full tw:max-mobile:content-center tw:max-mobile:p-[4px] tw:max-mobile:text-center tw:max-mobile:text-[12px] tw:max-mobile:leading-[1.3] tw:max-mobile:break-words", selected ? "tw:bg-[#e6f7ff] tw:max-mobile:bg-[#dff0f9]" : "tw:bg-[#f7f7f7] tw:max-mobile:bg-[#f1f4f6]");

/** Funding account option. */
export const bankOption = (selected: boolean) => cn("tw:flex tw:w-full tw:items-center tw:gap-[18px] tw:rounded-[13px] tw:bg-white tw:text-left tw:max-mobile:flex-wrap tw:max-mobile:gap-4 tw:max-mobile:p-5", selected ? "tw:border-2 tw:border-[#0caaff] tw:px-[41px] tw:py-[27px] tw:max-tablet:p-[21px]" : "tw:border tw:border-[#d8dcdf] tw:px-[42px] tw:py-7 tw:max-tablet:p-[22px]");
export const bankName = "tw:block tw:text-[24px] tw:font-medium tw:tracking-[-.5px] tw:max-tablet:text-[20px] tw:max-mobile:leading-[1.3] tw:max-phone:tracking-[-.3px]";
export const bankNote = "tw:mt-1 tw:block tw:text-[14px] tw:text-[#4e6586] tw:max-tablet:text-[12px] tw:max-mobile:mt-3 tw:max-mobile:text-[14px] tw:max-mobile:leading-[1.5]";
export const bankText = "tw:max-mobile:min-w-[140px] tw:max-mobile:flex-1";
export function SelectionLabel({ selected }: { selected: boolean }) {
  return selected ? <span className="tw:font-semibold" aria-hidden="true">✓ Selected</span> : null;
}
export function BankIcon() {
  return <span className="tw:grid tw:size-12 tw:flex-[0_0_48px] tw:place-items-center tw:rounded-[11px] tw:border tw:border-[#73a6c4] tw:bg-white tw:text-[#007cb8] tw:max-mobile:size-14 tw:max-mobile:shrink-0 tw:max-phone:basis-[38px]"><svg className="tw:size-[27px] tw:fill-none tw:stroke-current tw:stroke-[1.2] tw:[stroke-linejoin:round] tw:max-phone:size-[22px]" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8 9-5 9 5M4 9h16M5 10v9m5-9v9m4-9v9m5-9v9M3 21h18" /></svg></span>;
}

/** Desktop step indicator; mobile uses MobileStepIndicator. */
export function PaymentStepper({ labels, step, label, onStep, className, labelClassName }: { labels: string[]; step: number; label: string; onStep: (step: number) => void; className?: string; labelClassName?: string }) {
  return <nav className={cn("tw:mx-auto tw:mb-[62px] tw:grid tw:max-w-[460px] tw:grid-cols-[repeat(3,1fr)] tw:max-tablet:mb-12 tw:max-tablet:max-w-[420px] tw:max-mobile:hidden", className)} aria-label={label}>{labels.map((item, index) => {
    const complete = step >= index + 1;
    return <button key={item} type="button" disabled={index + 1 >= step} className={cn("tw:relative tw:flex tw:flex-col tw:items-center tw:gap-3 tw:border-0 tw:bg-transparent tw:px-[5px] tw:py-0 tw:disabled:cursor-default tw:disabled:opacity-100", complete ? "tw:text-[#0078b5]" : "tw:text-[#646464]", index < labels.length - 1 && "tw:after:absolute tw:after:top-3.5 tw:after:left-[calc(50%_+_24px)] tw:after:h-px tw:after:w-[calc(100%_-_48px)] tw:after:bg-[#c7c9cb]")} aria-current={step === index + 1 ? "step" : undefined} onClick={() => { if (index + 1 < step) onStep(index + 1); }}>
      <span className={cn("tw:grid tw:size-[29px] tw:place-items-center tw:rounded-full tw:border tw:text-[18px]", complete ? "tw:border-[#007db3] tw:bg-[#007db3] tw:text-white" : "tw:border-[#999] tw:bg-white")}>{index + 1}</span>
      <b className={cn("tw:text-[16px] tw:font-normal tw:whitespace-nowrap tw:max-tablet:text-[14px]", labelClassName)}>{item}</b>
      {step === index + 1 ? <small className="tw:text-[12px] tw:font-semibold">Current step</small> : index + 1 < step ? <small className="tw:text-[12px]">Completed</small> : null}
    </button>;
  })}</nav>;
}

/** Page heading with the One-Time / AutoPay switch. */
export function PaymentsHeading({ loanId, autoPay, intro }: { loanId: string; autoPay: boolean; intro: string }) {
  const tabs = [{ value: "one-time", label: "One-Time Payment", href: portalHref("/dashboard/payments", loanId) }, { value: "autopay", label: "AutoPay Schedule", href: portalHref("/dashboard/payments", loanId, { tab: "autopay" }) }];
  const current = autoPay ? "autopay" : "one-time";
  return <div className={cn(pageHeading, "tw:mb-16 tw:max-compact:mb-16 tw:max-desktop:flex-wrap tw:max-desktop:gap-6")}>
    <div><h1 className={pageTitle}>Make &amp; Schedule Payments</h1><p className={cn(pageIntro, "tw:max-compact:text-[16px] tw:max-tablet:text-[14px]")}>{intro}</p></div>
    <nav className={cn(segmented, "tw:shrink-0 tw:max-mobile:hidden")} aria-label="Payment type">{tabs.map(tab => <Link key={tab.value} className={cn(segment(tab.value === current), "tw:px-[30px] tw:py-[17px] tw:max-tablet:px-6 tw:max-tablet:py-3.5 tw:max-tablet:text-[14px]")} aria-current={tab.value === current ? "page" : undefined} href={tab.href}>{tab.label}</Link>)}</nav>
    <MobileSectionSelect label="Payment type" value={current} choices={tabs} />
  </div>;
}

/** Modal dialog shell; the parent controls showModal()/close(). */
export const dialog = "tw:w-[min(620px,calc(100%_-_32px))] tw:max-h-[calc(100dvh_-_40px)] tw:overflow-y-auto tw:overscroll-contain tw:rounded-[18px] tw:border tw:border-[#cbd6df] tw:p-0 tw:font-[family-name:var(--font-google-sans-flex),Arial,sans-serif] tw:text-[#08121b] tw:shadow-[0_20px_80px_#001c3440] tw:backdrop:bg-[#08253e70] tw:max-mobile:max-h-[calc(100dvh_-_32px)] tw:max-mobile:w-[calc(100%_-_32px)] tw:max-mobile:rounded-2xl";
export const dialogContent = "tw:relative tw:px-8 tw:pt-[38px] tw:pb-8 tw:max-mobile:px-6 tw:max-mobile:pt-5 tw:max-mobile:pb-6";
export const dialogClose = "tw:absolute tw:top-3 tw:right-4 tw:border-0 tw:bg-transparent tw:px-[9px] tw:py-[3px] tw:text-[28px] tw:text-[#49637b] tw:max-mobile:flex tw:max-mobile:size-10 tw:max-mobile:items-center tw:max-mobile:justify-center tw:max-mobile:p-0 tw:max-mobile:leading-none";
export const dialogTitle = "tw:mt-0 tw:mr-[26px] tw:mb-[26px] tw:text-[26px] tw:leading-[1.3] tw:font-medium tw:tracking-[-.6px] tw:max-phone:text-[23px]";
export const dialogText = "tw:leading-[1.7] tw:text-[#4e6586] tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5]";
export const dialogActions = "tw:mt-[26px] tw:flex tw:justify-end tw:gap-2.5 tw:max-mobile:flex-col tw:max-mobile:gap-3 tw:max-phone:flex-wrap";
/** Dialog action; add button.element for <button>s. */
export const dialogButton = cn(button.base, "tw:min-h-12 tw:px-5 tw:py-3 tw:text-[16px] tw:leading-[1.25] tw:max-compact:min-h-12 tw:max-compact:px-5 tw:max-compact:text-[16px] tw:max-mobile:w-full tw:max-phone:flex-1");

/** Keep Tab inside an open modal, including the browser-chrome boundary. */
export function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,summary,[tabindex]"))
    .filter(element => element.tabIndex >= 0 && !element.matches(":disabled") && element.checkVisibility());
  const first = controls[0], last = controls.at(-1);
  if (!first || !last) { event.preventDefault(); event.currentTarget.focus(); return; }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
