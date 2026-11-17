"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "./portal-ui";
import { siteButton, siteShell } from "./site-ui";

const links = [
  { label: "Home", href: "/" },
  { label: "Help Center", href: "/help-center" },
  { label: "Contact us", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  function authLink(mode: "register" | "sign-in", className: string) {
    const label = mode === "register" ? "Register" : "Sign in";
    // Native same-page fragments dispatch hashchange; cross-page links mount the form.
    return pathname === "/"
      ? <a href={`#${mode}`} className={className} onClick={() => setOpen(false)}>{label}</a>
      : <Link href={`/#${mode}`} className={className} onClick={() => setOpen(false)}>{label}</Link>;
  }


  return (
    <header className="tw:sticky tw:top-0 tw:z-30 tw:bg-white">
      <div className={cn(siteShell, "tw:relative tw:flex tw:h-24 tw:items-center tw:justify-between tw:gap-6 tw:max-site-tablet:h-20 tw:max-site-mobile:h-[68px] tw:max-site-mobile:gap-2")}>
        <Link href="/" className="tw:block tw:w-44 tw:min-w-0 tw:shrink tw:max-site-mobile:w-[min(44vw,176px)]" aria-label="RTR Servicing home">
          <Image className="tw:block tw:h-auto tw:w-full" src="/brand-logo.svg" alt="RTR Servicing" width={176} height={31} priority unoptimized />
        </Link>

        <nav className={cn("tw:flex tw:items-center tw:gap-1 tw:max-site-tablet:hidden", open && "tw:max-site-tablet:absolute tw:max-site-tablet:top-full tw:max-site-tablet:-right-8 tw:max-site-tablet:-left-8 tw:max-site-tablet:grid tw:max-site-tablet:border-0 tw:max-site-tablet:border-b tw:max-site-tablet:border-solid tw:max-site-tablet:border-site-line tw:max-site-tablet:bg-white tw:max-site-tablet:px-8 tw:max-site-tablet:pt-3 tw:max-site-tablet:pb-[18px] tw:max-site-tablet:shadow-[0_16px_30px_#000e1614] tw:max-site-mobile:-right-5 tw:max-site-mobile:-left-5 tw:max-site-mobile:px-5")} aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.label} href={link.href} className={cn("tw:rounded-lg tw:px-4 tw:py-2.5 tw:text-[15px] tw:text-site-ink tw:transition-colors tw:hover:bg-[#edf0f2] tw:max-site-tablet:px-3.5 tw:max-site-tablet:py-3", active && "tw:bg-site-blue tw:px-7 tw:text-white tw:hover:bg-site-blue-dark")} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            );
          })}
          <div className="tw:hidden tw:max-site-mobile:mt-2 tw:max-site-mobile:grid tw:max-site-mobile:grid-cols-2 tw:max-site-mobile:gap-2.5">
            {authLink("register", siteButton("outline", "tw:border-[#9aa8b0]"))}
            {authLink("sign-in", siteButton())}
          </div>
        </nav>

        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="hm-header-actions tw:flex tw:gap-2.5 tw:max-site-mobile:hidden">
            {authLink("register", siteButton("outline", "tw:min-h-[58px] tw:min-w-[150px] tw:text-[17px] tw:max-site-tablet:min-h-12 tw:max-site-tablet:min-w-[120px] tw:max-site-tablet:text-base"))}
            {authLink("sign-in", siteButton("blue", "tw:min-h-[58px] tw:min-w-[150px] tw:text-[17px] tw:max-site-tablet:min-h-12 tw:max-site-tablet:min-w-[120px] tw:max-site-tablet:text-base"))}
          </div>
          <button className="tw:hidden tw:size-11 tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-[5px] tw:rounded-lg tw:border tw:border-solid tw:border-site-line tw:bg-white tw:p-0 tw:max-site-tablet:flex" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {[0, 1, 2].map(index => <span key={index} className={cn("tw:block tw:h-0.5 tw:w-5 tw:rounded-sm tw:bg-site-ink tw:transition", open && (index === 0 ? "tw:translate-y-[7px] tw:rotate-45" : index === 1 ? "tw:opacity-0" : "tw:-translate-y-[7px] tw:-rotate-45"))} />)}
          </button>
        </div>
      </div>
    </header>
  );
}
