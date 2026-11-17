import Link from "next/link";
import { portalHref } from "@/lib/portal-format";
import { button, cn } from "./portal-ui";

export const backLink = cn(button.base, button.outline, "tw:min-h-14 tw:px-[26px] tw:py-3 tw:max-compact:min-h-[52px] tw:max-compact:px-[22px] tw:max-mobile:min-h-11 tw:max-mobile:py-2.5 tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.4]");
export const backBar = "tw:mb-14 tw:flex tw:items-center tw:justify-between tw:gap-5 tw:max-compact:mb-[42px] tw:max-mobile:mb-7 tw:max-mobile:flex-wrap tw:max-mobile:gap-4 tw:print:hidden";
export const backIcon = <svg className="tw:size-4 tw:fill-none tw:stroke-current tw:stroke-[1.2]" viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3-5 5 5 5" /></svg>;

export default function PortalBackBar({ loanId, accountNumber, fullLabel = false }: { loanId: string; accountNumber: string; fullLabel?: boolean }) {
  return <div className={backBar}><Link className={backLink} href={portalHref("/dashboard", loanId)}>{backIcon}{fullLabel ? "Return to Dashboard" : "Back"}</Link><span className="tw:text-[14px] tw:text-[#314b6e] tw:max-mobile:text-right tw:max-mobile:text-[11px]">Loan #{accountNumber}</span></div>;
}
