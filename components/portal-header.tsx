"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { portalHref } from "@/lib/portal-format";
import PortalLogo from "./portal-logo";
import PortalSessionControls from "./portal-session-controls";
import { button, cn, container } from "./portal-ui";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Payments History", href: "/dashboard/payment-history" },
  { label: "Documents", href: "/dashboard/documents" },
  { label: "Account", href: "/dashboard/account" },
];

// Desktop: logo, links and actions sit in one row (the menu wrapper is display: contents).
// At compact widths, navigation and actions share one dropdown.
export default function PortalHeader() {
  const pathname = usePathname();
  const loan = useSearchParams().get("loan") ?? "";
  const [open, setOpen] = useState(false);
  const href = (path: string) => loan ? portalHref(path, loan) : path;
  return <header className={cn(container, "tw:relative tw:z-10 tw:mt-[54px] tw:flex tw:min-h-[106px] tw:items-center tw:gap-8 tw:rounded-xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-[46px] tw:py-5 tw:shadow-[0_7px_18px_#1b355303] tw:compact:max-[1301px]:gap-[18px] tw:compact:max-[1301px]:px-7 tw:max-compact:mt-6 tw:max-compact:min-h-[88px] tw:max-compact:gap-5 tw:max-compact:px-6 tw:max-compact:py-[18px] tw:max-mobile:mt-[21px] tw:max-mobile:mb-7 tw:max-mobile:h-[74px] tw:max-mobile:min-h-[74px] tw:max-mobile:flex-wrap tw:max-mobile:justify-between tw:max-mobile:gap-0 tw:max-mobile:px-[22px] tw:max-mobile:py-0 tw:print:hidden")}>
    <Link href={href("/dashboard")} className="tw:min-w-0 tw:shrink tw:max-compact:flex-1" aria-label="RTR Servicing borrower dashboard"><PortalLogo /></Link>
    <button className="tw:hidden tw:max-compact:ml-auto tw:max-compact:flex tw:max-compact:size-11 tw:max-compact:shrink-0 tw:max-compact:flex-col tw:max-compact:items-center tw:max-compact:justify-center tw:max-compact:gap-[5px] tw:max-compact:rounded-lg tw:max-compact:border tw:max-compact:border-(--pp-line) tw:max-compact:bg-transparent tw:max-compact:p-0" aria-label="Toggle portal navigation" aria-expanded={open} aria-controls="borrower-header-menu" onClick={() => setOpen(!open)}>{[0, 1, 2].map(line => <span key={line} className="tw:max-compact:block tw:max-compact:h-0.5 tw:max-compact:w-[22px] tw:max-compact:bg-[#25445b]" />)}</button>
    <div id="borrower-header-menu" className={cn("tw:contents tw:max-compact:absolute tw:max-compact:inset-x-0 tw:max-compact:top-[calc(100%_+_8px)] tw:max-compact:z-50 tw:max-compact:flex-col tw:max-compact:gap-4 tw:max-compact:rounded-xl tw:max-compact:border tw:max-compact:border-(--pp-line) tw:max-compact:bg-white tw:max-compact:p-4 tw:max-compact:shadow-lg", open ? "tw:max-compact:flex" : "tw:max-compact:hidden")}>
      <nav className="tw:ml-auto tw:flex tw:items-center tw:justify-center tw:gap-2.5 tw:compact:max-[1301px]:gap-0 tw:max-compact:m-0 tw:max-compact:w-full tw:max-compact:flex-col tw:max-compact:items-stretch tw:max-compact:gap-1" aria-label="Borrower portal">{navigation.map(item => {
        const active = pathname === item.href;
        return <Link key={item.href} href={href(item.href)} className={cn("tw:rounded-xl tw:px-4 tw:py-3.5 tw:text-[16px] tw:whitespace-nowrap tw:[transition:background_.15s] tw:focus-visible:outline-3 tw:focus-visible:outline-offset-3 tw:focus-visible:outline-solid tw:focus-visible:outline-(--pp-blue) tw:compact:max-[1301px]:px-2.5 tw:compact:max-[1301px]:text-[14px] tw:compact:max-[1101px]:px-[5px] tw:max-compact:text-[14px] tw:max-mobile:min-h-12 tw:max-mobile:w-full tw:max-mobile:justify-start tw:max-mobile:py-3 tw:max-mobile:text-[16px]", active ? "tw:bg-(--pp-blue) tw:text-white" : "tw:hover:bg-[#eaf6fd]")} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>;
      })}</nav>
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:max-compact:m-0 tw:max-compact:w-full tw:max-compact:flex-col tw:max-compact:items-stretch tw:max-compact:gap-3 tw:max-compact:*:w-full">
        <Link className={cn(button.base, button.primary, "tw:min-w-[236px] tw:compact:max-[1301px]:min-w-auto tw:compact:max-[1301px]:px-[22px] tw:compact:max-[1301px]:text-[16px] tw:max-compact:min-w-0 tw:max-compact:px-5 tw:max-compact:text-[15px]")} href={href("/dashboard/payments")} onClick={() => setOpen(false)}>Make a Payment</Link>
        <PortalSessionControls />
      </div>
    </div>
  </header>;
}
