"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { label: "Home", href: "/" },
  { label: "Help Center", href: "/help-center" },
  { label: "Contact us", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="hm-header">
      <div className="hm-shell hm-header-inner">
        <Link href="/" className="hm-logo" aria-label="RTR Servicing home">
          <Image src="/logo.png" alt="RTR Servicing" width={788} height={31} priority unoptimized />
        </Link>

        <nav className={`hm-nav ${open ? "is-open" : ""}`} aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.label} href={link.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            );
          })}
          <div className="hm-nav-actions">
            <Link className="hm-btn hm-btn-outline" href="/#sign-in" onClick={() => setOpen(false)}>Register</Link>
            <Link className="hm-btn hm-btn-blue" href="/#sign-in" onClick={() => setOpen(false)}>Sign in</Link>
          </div>
        </nav>

        <div className="hm-header-end">
          <div className="hm-header-actions">
            <Link className="hm-btn hm-btn-outline" href="/#sign-in">Register</Link>
            <Link className="hm-btn hm-btn-blue" href="/#sign-in">Sign in</Link>
          </div>
          <button className="hm-menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
