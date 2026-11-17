"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "./portal-ui";
import { portalHref } from "@/lib/portal-format";

type IconName = "home" | "history" | "documents" | "account" | "amount" | "calendar" | "bank" | "address" | "phone" | "preferences";
const paths: Record<IconName, string> = {
  home: "M3 10 12 3l9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm5 5h8",
  history: "M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M7 7h4M7 11h3M20 15a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-5-3v3l2 1",
  documents: "M7 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm1 5h8m-8 4h8m-8 4h5",
  account: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2Z",
  amount: "M12 2v2m0 16v2m4-15c-1-1-2-2-4-2-5 0-5 6 0 7s5 7 0 7c-2 0-3-1-4-2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  calendar: "M4 5h16v16H4Zm0 5h16M8 2v6m8-6v6M8 14h2m4 0h2m-8 4h2",
  bank: "m2 7 10-5 10 5M3 9h18M5 11v8m5-8v8m4-8v8m5-8v8M2 22h20",
  address: "M3 5h18v14H3Zm0 1 9 7 9-7",
  phone: "M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C9 21 3 15 3 5a2 2 0 0 1 2-2Z",
  preferences: "M5 2v8m0 4v8m7-20v13m0 4v3m7-20v3m0 4v13M2 10h6v4H2Zm7 5h6v4H9Zm7-10h6v4h-6Z",
};

export function PortalMobileIcon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

type Choice = { value: string; label: string; href?: string };
export function MobileSectionSelect({ label, value, choices, onValueChange }: { label: string; value: string; choices: Choice[]; onValueChange?: (value: string) => void }) {
  const router = useRouter();
  return <label className="tw:hidden tw:max-mobile:relative tw:max-mobile:mt-6 tw:max-mobile:flex tw:max-mobile:w-full"><span className="tw:sr-only">{label}</span><select className="tw:h-[60px] tw:w-full tw:appearance-none tw:rounded-[10px] tw:border tw:border-[#6b7c8e] tw:bg-white tw:pr-12 tw:pl-5 tw:text-[20px] tw:text-[#303030]" value={value} onChange={event => {
    if (onValueChange) onValueChange(event.target.value);
    else { const choice = choices.find(item => item.value === event.target.value); if (choice?.href) router.push(choice.href, { scroll: false }); }
  }}>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select><svg className="tw:pointer-events-none tw:absolute tw:top-[22px] tw:right-5 tw:size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 7 6 6 6-6" /></svg></label>;
}

export function MobileStepIndicator({ step, total = 3, label, icon }: { step: number; total?: number; label: string; icon: IconName }) {
  const circumference = 2 * Math.PI * 32;
  return <div className="tw:hidden tw:max-mobile:mb-8 tw:max-mobile:flex tw:max-mobile:items-center tw:max-mobile:gap-6" role="group" aria-label={`Step ${step} of ${total}: ${label}`}><svg className="tw:size-[72px] tw:shrink-0" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="32" fill="none" stroke="#d1d1d1" strokeWidth="2" /><circle cx="36" cy="36" r="32" fill="none" stroke="#007caf" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - step / total)} transform="rotate(-90 36 36)" /><text x="36" y="36" textAnchor="middle" dominantBaseline="central" fill="#303030" fontSize="20" fontWeight="600">{step}/{total}</text></svg><span className="tw:flex tw:items-center tw:gap-2.5 tw:text-[16px] tw:leading-[1.4] tw:text-[#007caf]"><PortalMobileIcon className="tw:size-6 tw:shrink-0" name={icon} /><span>{label}</span></span></div>;
}

export default function PortalMobileNavigation() {
  const pathname = usePathname();
  const loan = useSearchParams().get("loan");
  const entries: { label: string; href: string; icon: IconName }[] = [
    { label: "Dashboard", href: "/dashboard", icon: "home" },
    { label: "Payment history", href: "/dashboard/payment-history", icon: "history" },
    { label: "Documents", href: "/dashboard/documents", icon: "documents" },
    { label: "Account", href: "/dashboard/account", icon: "account" },
  ];
  return <nav className="tw:hidden tw:max-mobile:fixed tw:max-mobile:bottom-[calc(26px_+_env(safe-area-inset-bottom))] tw:max-mobile:left-1/2 tw:max-mobile:z-40 tw:max-mobile:flex tw:max-mobile:h-[72px] tw:max-mobile:w-[296px] tw:max-mobile:max-w-[calc(100%_-_32px)] tw:max-mobile:-translate-x-1/2 tw:max-mobile:items-center tw:max-mobile:justify-around tw:max-mobile:rounded-full tw:max-mobile:bg-[#23272b] tw:max-mobile:px-3 tw:max-mobile:shadow-lg" aria-label="Mobile borrower navigation">{entries.map(entry => {
    const current = pathname === entry.href;
    return <Link key={entry.href} className={cn("tw:relative tw:flex tw:size-14 tw:items-center tw:justify-center tw:rounded-full", current ? "tw:text-white tw:before:absolute tw:before:top-0 tw:before:h-[3px] tw:before:w-5 tw:before:rounded-full tw:before:bg-white" : "tw:text-[#90959a]")} href={loan ? portalHref(entry.href, loan) : entry.href} aria-current={current ? "page" : undefined} aria-label={entry.label}><PortalMobileIcon className="tw:size-7" name={entry.icon} /></Link>;
  })}</nav>;
}
