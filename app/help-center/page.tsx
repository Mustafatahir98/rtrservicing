import { cn } from "@/components/portal-ui";
import type { Metadata } from "next";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import HelpCenter from "@/components/help-center";
import ResponsivePhoto from "@/components/responsive-photo";
import SiteFooter, { phone } from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { publicSiteInfo } from "@/lib/public-site-info";
import { sitePage, siteShell, siteButton, sectionSpacing } from "@/components/site-ui";

export const metadata: Metadata = {
  title: "Help Center & FAQs | RTR Servicing",
  description: "Answers about account transfers, payments and AutoPay, Form 1098 and statements, and hardship assistance.",
};

export default function HelpCenterPage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <HelpCenter />
        <section id="hardship-assistance" className={`${siteShell} tw:mb-12 tw:scroll-mt-28 tw:rounded-2xl tw:border tw:border-site-line tw:bg-white tw:p-8 tw:max-site-mobile:p-5`} aria-labelledby="hardship-title">
          <h2 id="hardship-title" className="tw:text-[30px] tw:font-medium tw:max-site-mobile:text-[24px]">Payment hardship assistance</h2>
          <p className="tw:mt-4 tw:max-w-[850px] tw:text-base tw:leading-relaxed">If you are having trouble making payments, contact Customer Solutions to discuss your account. Available assistance depends on your loan and circumstances; this page does not promise eligibility, approval or a particular payment arrangement.</p>
          <div className="tw:mt-5 tw:max-w-[440px] tw:rounded-xl tw:bg-[#f1f7fb] tw:px-5 tw:py-4">
            <p className="tw:font-medium">Customer Solutions hours</p>
            <dl className="tw:mt-3 tw:grid tw:gap-2 tw:text-base">
              {publicSiteInfo.hours.map(line => {
                const [days, time] = line.split(": ");
                return <div key={line} className="tw:flex tw:flex-wrap tw:justify-between tw:gap-x-5"><dt className="tw:text-site-muted">{days}</dt><dd className="tw:m-0 tw:font-medium">{time}</dd></div>;
              })}
            </dl>
            <p className="tw:mt-3 tw:text-sm tw:text-site-muted">{publicSiteInfo.hoursNote}</p>
          </div>
          <div className="tw:mt-6 tw:flex tw:flex-wrap tw:gap-4"><a className={siteButton("blue")} href={phone.href}>Call {phone.label}</a><Link className={siteButton("outline")} href="/contact#message">Ask about assistance</Link></div>
        </section>

        <section className={cn(sectionSpacing, ` tw:bg-[#f7f7f7] tw:bg-[url('/home/sketch-city.png')] tw:bg-size-[1440px_auto] tw:bg-bottom tw:bg-no-repeat tw:max-site-tablet:bg-none`)} aria-labelledby="hc-cta-title">
          <div className={cn(siteShell, ` tw:grid tw:max-w-[1168px] tw:grid-cols-[minmax(0,1fr)_303px] tw:items-center tw:gap-10 tw:rounded-t-[18px] tw:border-0 tw:border-b-2 tw:border-solid tw:border-site-blue tw:bg-[#e7f4fd] tw:p-7 tw:pl-[50px] tw:max-site-tablet:max-w-[680px] tw:max-site-tablet:grid-cols-1 tw:max-site-tablet:gap-7 tw:max-site-tablet:p-6 tw:max-site-tablet:pb-8 tw:max-site-mobile:gap-6 tw:max-site-mobile:rounded-t-[14px] tw:max-site-mobile:p-4 tw:max-site-mobile:pb-7`)}>
            <div className="tw:min-w-0">
              <h2 id="hc-cta-title" className="tw:m-0 tw:max-w-[640px] tw:text-[50px] tw:leading-[1.15] tw:font-medium tw:tracking-[-.02em] tw:max-site-tablet:text-[40px] tw:max-site-mobile:text-[clamp(28px,8.7vw,34px)]">Need personalized <span className="tw:text-site-green-ink">account assistance?</span></h2>
              <p className="tw:m-0 tw:mt-5 tw:max-w-[560px] tw:text-lg tw:leading-[1.6] tw:max-site-tablet:mt-3.5 tw:max-site-mobile:mt-2.5 tw:max-site-mobile:text-base">Customer Solutions hours: {publicSiteInfo.hoursShort}. {publicSiteInfo.hoursNote}</p>
              <div className="tw:mt-8 tw:flex tw:flex-wrap tw:gap-3 tw:max-site-mobile:mt-6 tw:max-site-mobile:flex-col">
                <Link className={siteButton("dark", "tw:min-h-[60px] tw:min-w-[247px] tw:text-lg tw:max-site-tablet:min-w-0 tw:max-site-tablet:flex-[1_1_200px] tw:max-site-mobile:min-h-[54px] tw:max-site-mobile:flex-none tw:max-site-mobile:text-base")} href="/contact#message">Send a Message</Link>
                <a className={siteButton("blue", "tw:min-h-[60px] tw:min-w-[247px] tw:text-lg tw:max-site-tablet:min-w-0 tw:max-site-tablet:flex-[1_1_200px] tw:max-site-mobile:min-h-[54px] tw:max-site-mobile:flex-none tw:max-site-mobile:text-base")} href={phone.href}>Call {phone.label}</a>
              </div>
            </div>
            <ResponsivePhoto
              className="tw:block tw:max-site-tablet:-order-1 tw:[&_img]:block tw:[&_img]:h-auto tw:[&_img]:w-full tw:[&_img]:rounded-xl"
              alt="An RTR Servicing advisor greeting a customer at his desk"
              desktop={{ src: "/help-center/advisor-desktop.webp", width: 303, height: 332 }}
              tablet={{ src: "/help-center/advisor-tablet.webp", width: 632, height: 332 }}
              mobile={{ src: "/help-center/advisor-mobile.webp", width: 330, height: 332 }}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
