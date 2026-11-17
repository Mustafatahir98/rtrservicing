import Image from "next/image";
import Link from "next/link";
import { cn } from "./portal-ui";
import { publicSiteInfo, collectionNoticeApproval } from "@/lib/public-site-info";

const footerList = "tw:m-0 tw:grid tw:list-none tw:gap-[22px] tw:p-0";
const footerHeading = "tw:m-0 tw:mb-[30px] tw:text-base tw:font-semibold tw:uppercase";
const footerIcon = "tw:flex tw:items-start tw:gap-2 tw:text-site-green tw:[&_svg]:mt-px tw:[&_svg]:size-[17px] tw:[&_svg]:shrink-0 tw:[&_svg]:fill-none tw:[&_svg]:stroke-white tw:[&_svg]:stroke-[1.7] tw:[&_svg]:[stroke-linecap:round] tw:[&_svg]:[stroke-linejoin:round]";

export const phone = publicSiteInfo.phone;

const footerColumns = [
  {
    title: "Platform Navigation",
    links: [
      { label: "Home", href: "/" },
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
      { label: "Transfer Grace Period Guide", href: "/legal/transfer-notices" },
      { label: "Errors & Information Requests", href: "/legal/error-information-requests" },
    ],
  },
] as const;

function InfoIcon({ type }: { type: "shield" | "mail" | "pin" }) {
  if (type === "shield") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (type === "mail") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
}

/* logo.png only has 176×31 real pixels, so the oversized footer wordmark is drawn as vector to stay sharp. */
function Wordmark() {
  return (
    // Baseline at y=166 leaves headroom for the tallest glyphs (the i-dots rise 154 units above the baseline).
    <svg className="tw:-mb-[5.5%] tw:block tw:h-auto tw:w-full tw:font-inherit tw:opacity-50" viewBox="0 0 1270 206" aria-hidden="true">
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
    <footer className="tw:overflow-hidden tw:bg-site-ink tw:pt-[90px] tw:text-[15px] tw:text-white tw:[&_a]:transition-colors tw:[&_a:hover]:text-site-green tw:max-site-tablet:pt-16">
      <div className="tw:mx-auto tw:w-[min(1210px,calc(100%_-_128px))] tw:max-site-tablet:w-[calc(100%_-_64px)] tw:max-site-mobile:w-[calc(100%_-_40px)]">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-6 tw:max-site-mobile:flex-col">
          <div>
            <span className="tw:block tw:w-44 tw:shrink-0"><Image className="tw:block tw:h-auto tw:w-full" src="/brand-logo.svg" alt="RTR Servicing" width={176} height={31} unoptimized /></span>
          </div>
        </div>

        <div className="tw:mt-[74px] tw:grid tw:grid-cols-[1.55fr_1fr_1fr_1fr] tw:gap-10 tw:[&>div]:min-w-0 tw:max-site-tablet:mt-12 tw:max-site-tablet:grid-cols-3 tw:max-site-tablet:gap-x-7 tw:max-site-mobile:grid-cols-2 tw:max-site-mobile:gap-x-5 tw:max-site-mobile:gap-y-8">
          <div className="tw:max-site-tablet:col-span-full">
            <p className="tw:m-0 tw:max-w-[350px] tw:leading-[1.65]">RTR Servicing manages monthly payments, property taxes, hazard insurance escrows, and comprehensive customer support for residential mortgages and installment notes.</p>
            <ul className="tw:m-0 tw:mt-11 tw:grid tw:list-none tw:gap-[22px] tw:p-0 tw:text-sm tw:max-site-tablet:mt-6">
              <li className={footerIcon}><InfoIcon type="shield" /><a href={publicSiteInfo.officialContact}>Real Time Resolutions, Inc. | NMLS ID {publicSiteInfo.nmlsId}</a></li>
              <li><Link href="/legal/licenses-state-notices">Licensing &amp; State Notices</Link></li>
            </ul>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className={footerHeading}>{column.title}</h2>
              <ul className={footerList}>
                {column.links.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}
              </ul>
            </div>
          ))}

          <div className="tw:max-site-mobile:col-span-full">
            <h2 className={footerHeading}>Borrower Support</h2>
            <ul className={footerList}>
              <li><a href={phone.href}>{phone.label}</a></li>
              <li>{publicSiteInfo.hours.map(line => <span className="tw:block" key={line}>{line}</span>)}</li>
              <li className={cn(footerIcon, "tw:[overflow-wrap:anywhere]")}><InfoIcon type="mail" /><Link href="/contact#message">Send an online message</Link></li>
              <li className={footerIcon}><InfoIcon type="pin" /><span>Correspondence &amp; payments{publicSiteInfo.correspondence.map(line => <span className="tw:block" key={line}>{line}</span>)}</span></li>
            </ul>
          </div>
        </div>

        <div className="tw:flex tw:flex-wrap tw:justify-center tw:gap-x-11 tw:gap-y-3 tw:border-0 tw:border-b tw:border-solid tw:border-white/22 tw:pt-14 tw:pb-[50px] tw:text-sm tw:max-site-mobile:gap-x-6 tw:max-site-mobile:gap-y-2.5 tw:max-site-mobile:pt-10 tw:max-site-mobile:pb-8">
          <Link href="/legal/transfer-notices">Transfer Notices</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/privacy-notice-affiliate">Affiliate Privacy Notice</Link>
          <Link href="/privacy-notice-non-affiliate">Non-Affiliate Privacy Notice</Link>
          <Link href="/terms-of-use">Terms of Use</Link>
          <Link href="/sms-terms">SMS Terms</Link>
          <Link href="/legal/licenses-state-notices">Licenses &amp; State Notices</Link>
          <Link href="/legal/collection-notices">Collection Notices</Link>
        </div>
        {collectionNoticeApproval.scope === "ALL_PUBLIC_VISITORS" && collectionNoticeApproval.approvedText ? <p className="tw:mt-6 tw:text-sm tw:leading-relaxed">{collectionNoticeApproval.approvedText}</p> : null}
        <p className="tw:m-0 tw:pt-[46px] tw:pb-[60px] tw:text-center tw:text-sm tw:max-site-mobile:pt-7 tw:max-site-mobile:pb-10">© 2026 RTR Servicing. All rights reserved.</p>
        <Wordmark />
      </div>
    </footer>
  );
}
