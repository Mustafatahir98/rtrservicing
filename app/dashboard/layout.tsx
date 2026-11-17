import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { googleSansFlex } from "@/app/fonts";
import PortalHeader from "@/components/portal-header";
import PortalLogo from "@/components/portal-logo";
import PortalMobileNavigation from "@/components/portal-mobile-controls";
import "./dashboard.css";
export const metadata: Metadata = { title: "Borrower Portal | RTR Servicing", robots: { index: false, follow: false }, formatDetection: { address: false } };
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`portal ${googleSansFlex.variable} tw:font-[family-name:var(--font-google-sans-flex),"Google_Sans_Flex",Arial,Helvetica,sans-serif] tw:overflow-x-clip tw:[--pp-blue:#006da5] tw:[--pp-ink:#08121b] tw:[--pp-muted:#4e6586] tw:[--pp-line:#d8dcdf] tw:font-site tw:flex tw:min-h-dvh tw:flex-col tw:bg-[#f7f9fa] tw:text-[16px] tw:leading-[1.5] tw:text-(--pp-ink) tw:touch-pan-x tw:touch-pan-y tw:touch-pinch-zoom`}><Suspense><PortalHeader /></Suspense><div id="main-content" tabIndex={-1} /><div className="portal-main tw:flex-1 tw:max-mobile:pb-[calc(160px_+_env(safe-area-inset-bottom))] tw:print:visible"><Suspense fallback={<div role="status" className="tw:flex tw:min-h-[45dvh] tw:items-center tw:justify-center">Loading borrower portal…</div>}>{children}</Suspense></div><footer className="tw:mt-auto tw:flex tw:min-h-[104px] tw:items-center tw:justify-center tw:border-t tw:border-t-[#cdd1d5] tw:bg-white tw:p-5 tw:max-mobile:hidden tw:print:hidden"><Link href="/dashboard" aria-label="RTR Servicing borrower dashboard"><PortalLogo className="tw:scale-[.92]" /></Link></footer><Suspense><PortalMobileNavigation /></Suspense></div>;
}
