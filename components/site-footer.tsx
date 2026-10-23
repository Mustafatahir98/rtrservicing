import Image from "next/image";
import Link from "next/link";

export const phone = { label: "877-252-3761", href: "tel:+18772523761" };

const footerColumns = [
  {
    title: "Platform Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "How Servicing Works", href: "/help-center" },
      { label: "Account Types", href: "/help-center" },
      { label: "Help Center & FAQs", href: "/help-center" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Borrower Services",
    links: [
      { label: "Sign In to Account", href: "/#sign-in" },
      { label: "Make a Payment", href: "/#sign-in" },
      { label: "Set Up AutoPay", href: "/#sign-in" },
      { label: "Transfer Grace Period Guide", href: "/help-center" },
      { label: "Notices of Error (QWR)", href: "#" },
    ],
  },
] as const;

function InfoIcon({ type }: { type: "shield" | "lock" | "mail" | "pin" }) {
  if (type === "shield") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (type === "lock") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></svg>;
  if (type === "mail") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
}

/* logo.png only has 176×31 real pixels, so the oversized footer wordmark is drawn as vector to stay sharp. */
function Wordmark() {
  return (
    // Baseline at y=166 leaves headroom for the tallest glyphs (the i-dots rise 154 units above the baseline).
    <svg className="hm-watermark" viewBox="0 0 1270 206" aria-hidden="true">
      {/* Words use their natural widths (no textLength), so the letters are never stretched or squashed. */}
      <text x="-12" y="166" fill="#00649e" fontSize="200" fontWeight="700">rtr</text>
      <path d="M252 62h20l22 22-22 22h-20z" fill="#00649e" />
      <rect x="330" y="24" width="12" height="182" fill="#00649e" />
      <text x="376" y="166" fill="#3fa83d" fontSize="200" fontWeight="700">servicing</text>
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="hm-footer">
      <div className="hm-footer-shell">
        <div className="hm-footer-top">
          <div>
            <span className="hm-logo"><Image src="/logo.png" alt="RTR Servicing" width={788} height={31} unoptimized /></span>
            <p className="hm-tagline">ACCOUNT SERVICING MADE SIMPLE</p>
          </div>
        </div>

        <div className="hm-footer-grid">
          <div className="hm-footer-about">
            <p>RTR Servicing manages monthly payments, property taxes, hazard insurance escrows, and comprehensive customer support for residential mortgages and installment notes.</p>
            <ul className="hm-footer-badges">
              <li><InfoIcon type="shield" />NMLS #184920 · Equal Housing Opportunity</li>
              <li><InfoIcon type="lock" />SOC 2 Type II Certified Security</li>
            </ul>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
              </ul>
            </div>
          ))}

          <div>
            <h3>Borrower Support</h3>
            <ul>
              <li><a href={phone.href}>{phone.label}</a></li>
              <li>Mon–Thu 7am–8pm,<br />Fri 7am–7pm CT</li>
              <li className="hm-footer-green hm-footer-icon"><InfoIcon type="mail" /><a href="mailto:support@rtrservicing.com">support@rtrservicing.com</a></li>
              <li className="hm-footer-green hm-footer-icon"><InfoIcon type="pin" /><span>RTR Servicing<br />P.O. Box 36655<br />Dallas, TX 75235-1655</span></li>
            </ul>
          </div>
        </div>

        <div className="hm-footer-legal">
          <Link href="#">Transfer Notices</Link>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Service</Link>
        </div>
        <p className="hm-copyright">© 2026 RTR Servicing. All rights reserved.</p>
        <Wordmark />
      </div>
    </footer>
  );
}
