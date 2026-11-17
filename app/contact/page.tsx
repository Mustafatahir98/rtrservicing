import { cn } from "@/components/portal-ui";
import type { Metadata } from "next";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import ContactForms from "@/components/contact-forms";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { publicSiteInfo } from "@/lib/public-site-info";
import { sitePage, siteShell, siteBadge, sectionSpacing } from "@/components/site-ui";

const channelCard = "tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-6 tw:rounded-[14px] tw:border tw:border-solid tw:border-[#d5dde2] tw:bg-white tw:px-7 tw:py-10 tw:text-center tw:max-site-tablet:flex-row tw:max-site-tablet:justify-start tw:max-site-tablet:gap-7 tw:max-site-tablet:px-10 tw:max-site-tablet:py-8 tw:max-site-tablet:text-left tw:max-site-mobile:flex-col tw:max-site-mobile:items-center tw:max-site-mobile:gap-4 tw:max-site-mobile:px-6 tw:max-site-mobile:py-[42px] tw:max-site-mobile:text-center";
const channelIcon = "tw:grid tw:size-[63px] tw:shrink-0 tw:place-items-center tw:rounded-xl tw:bg-[#d9eefb] tw:[&_svg]:size-7 tw:[&_svg]:fill-site-blue tw:[&_svg]:stroke-[#d9eefb] tw:[&_svg]:stroke-[1.6] tw:[&_svg]:[stroke-linejoin:round] tw:max-site-mobile:size-[76px] tw:max-site-mobile:rounded-2xl tw:max-site-mobile:bg-[#cfedff] tw:max-site-mobile:[&_svg]:size-[38px]";
const channelTitle = "tw:m-0 tw:text-2xl tw:leading-[1.4] tw:font-semibold tw:text-site-blue tw:max-site-mobile:mx-auto tw:max-site-mobile:max-w-[240px] tw:max-site-mobile:text-[26px] tw:max-site-mobile:leading-[1.3] tw:max-site-mobile:font-medium";
const channelAddress = "tw:mt-3 tw:text-[17px] tw:leading-[1.85] tw:not-italic tw:max-site-mobile:mt-3.5 tw:max-site-mobile:text-xl tw:max-site-mobile:leading-[1.6]";

export const metadata: Metadata = {
  title: "Contact Customer Solutions | RTR Servicing",
  description: "Schedule a callback, call our toll-free line, or send an online message to RTR Servicing's customer solutions team.",
};

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

function CalendarClockIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40H10a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4h26a4 4 0 0 1 4 4v8M6 19h34M15 5v9m16-9v9" /><circle cx="35" cy="35" r="9" /><path d="M35 30.5V35l3 2" /></svg>;
}

export default function ContactPage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>

        <section className={cn(siteShell, ` tw:mt-8 tw:rounded-3xl tw:bg-[#e7f5e7] tw:bg-[url('/contact/hero-bg-desktop.webp')] tw:bg-cover tw:bg-top tw:bg-no-repeat tw:px-[63px] tw:py-[60px] tw:max-site-laptop:pr-8 tw:max-site-laptop:pb-12 tw:max-site-laptop:pl-10 tw:max-site-tablet:bg-[url('/contact/hero-bg-tablet.webp')] tw:max-site-tablet:px-8 tw:max-site-tablet:pt-16 tw:max-site-tablet:pb-10 tw:max-site-mobile:mt-2 tw:max-site-mobile:w-[calc(100%_-_30px)] tw:max-site-mobile:rounded-[14px] tw:max-site-mobile:px-[13px] tw:max-site-mobile:pt-[26px] tw:max-site-mobile:pb-6 tw:max-site-phone:bg-[url('/contact/hero-bg-mobile.webp')]`)} aria-labelledby="ct-title">
          <div className="tw:grid tw:grid-cols-[minmax(0,1fr)_601px] tw:grid-rows-[auto_1fr] tw:items-start tw:gap-x-12 tw:max-site-laptop:grid-cols-[minmax(0,1fr)_540px] tw:max-site-laptop:gap-10 tw:max-site-tablet:grid-cols-1 tw:max-site-tablet:grid-rows-none tw:max-site-mobile:gap-[18px]">
            <div className="tw:min-w-0 tw:max-site-tablet:px-10 tw:max-site-tablet:text-center tw:max-site-mobile:px-0">
              <span className={cn(siteBadge, ` tw:max-site-mobile:max-w-full tw:max-site-mobile:px-3.5 tw:max-site-mobile:py-[9px] tw:max-site-mobile:text-[clamp(10px,3.2vw,12px)] tw:max-site-mobile:tracking-normal`)}>Customer Solutions &amp; Support • RTR Servicing</span>
              <h1 id="ct-title" className="tw:m-0 tw:mt-4 tw:text-[clamp(36px,3.75vw,54px)] tw:leading-[1.15] tw:font-medium tw:tracking-[-.02em] tw:max-site-tablet:mt-5 tw:max-site-tablet:text-[42px] tw:max-site-tablet:leading-[1.2] tw:max-site-mobile:mt-4 tw:max-site-mobile:text-[clamp(32px,11.1vw,42px)] tw:max-site-mobile:leading-[1.16]">Contact RTR <span className="tw:block tw:text-site-green-ink tw:max-site-tablet:inline tw:max-site-mobile:mx-auto tw:max-site-mobile:block tw:max-site-mobile:max-w-[260px]">Customer Solutions</span></h1>
              <p className="tw:m-0 tw:mt-6 tw:max-w-[513px] tw:text-lg tw:leading-[1.65] tw:max-site-tablet:mx-auto tw:max-site-tablet:mt-3.5 tw:max-site-tablet:max-w-[540px] tw:max-site-mobile:text-base tw:max-site-mobile:leading-[1.75]">RTR Servicing clients can access their account at the top of the page.</p>
              <Link href="/#sign-in" className="tw:mt-4 tw:inline-block tw:text-site-blue tw:underline tw:underline-offset-4">Access your account</Link>
            </div>
            <ContactForms />
            <div className="tw:col-start-1 tw:row-start-2 tw:mt-8 tw:grid tw:w-full tw:max-w-[513px] tw:gap-6 tw:max-site-tablet:row-start-auto tw:max-site-tablet:mx-auto tw:max-site-tablet:mt-0 tw:max-site-tablet:max-w-[640px] tw:max-site-tablet:gap-5 tw:max-site-mobile:gap-4">
              <a className="tw:flex tw:min-h-[183px] tw:flex-col tw:justify-center tw:gap-1.5 tw:rounded-[14px] tw:border tw:border-solid tw:border-site-blue tw:bg-site-blue tw:py-7 tw:pr-8 tw:pl-12 tw:text-white tw:transition-colors tw:hover:bg-site-blue-dark tw:max-site-laptop:pl-8 tw:max-site-tablet:min-h-0 tw:max-site-tablet:px-10 tw:max-site-tablet:py-8 tw:max-site-mobile:px-5 tw:max-site-mobile:py-7" href={publicSiteInfo.phone.href}>
                <span className="tw:text-[17px] tw:max-site-mobile:text-[15px]">Call your support team</span>
                <strong className="tw:text-[clamp(26px,2.8vw,38px)] tw:leading-[1.2] tw:font-medium tw:tracking-[-.01em] tw:max-site-mobile:text-[clamp(24px,7.5vw,34px)]">{publicSiteInfo.phone.label}</strong>
              </a>
              <article className="tw:flex tw:items-start tw:gap-5 tw:rounded-[14px] tw:border tw:border-solid tw:border-transparent tw:bg-white tw:py-9 tw:pr-8 tw:pl-[87px] tw:shadow-[0_16px_40px_#000e1614] tw:max-site-laptop:pl-12 tw:max-site-tablet:items-center tw:max-site-tablet:px-10 tw:max-site-tablet:py-8 tw:max-site-mobile:items-start tw:max-site-mobile:gap-4 tw:max-site-mobile:px-5 tw:max-site-mobile:py-6">
                <span className="tw:shrink-0 tw:[&_svg]:size-[54px] tw:[&_svg]:fill-none tw:[&_svg]:stroke-site-blue tw:[&_svg]:stroke-[2.4] tw:[&_svg]:[stroke-linecap:round] tw:[&_svg]:[stroke-linejoin:round]"><CalendarClockIcon /></span>
                <div>
                  <h2 className="tw:m-0 tw:text-2xl tw:leading-[1.3] tw:font-semibold tw:text-site-blue tw:max-site-mobile:text-[21px]">Hours of Operation:</h2>
                  {publicSiteInfo.hours.map(line => <p className="tw:m-0 tw:mt-1.5 tw:text-[17px] tw:max-site-mobile:text-base" key={line}>{line}</p>)}
                </div>
              </article>
            </div>
          </div>
        </section>


        <section className={cn(siteShell, ` ${sectionSpacing} tw:text-center tw:max-site-mobile:w-[calc(100%_-_30px)] tw:max-site-mobile:py-10`)} aria-labelledby="ct-channels-title">
          <span className={cn(siteBadge, ` tw:max-site-mobile:hidden`)}>Direct Assistance</span>
          <h2 id="ct-channels-title" className="tw:m-0 tw:mt-[18px] tw:text-[44px] tw:leading-[1.2] tw:font-medium tw:tracking-[-.02em] tw:max-site-tablet:text-4xl tw:max-site-mobile:mt-0 tw:max-site-mobile:text-[clamp(24px,10.8vw,42px)] tw:max-site-mobile:tracking-[-.04em]">Support Channels</h2>
          <p className="tw:mx-auto tw:mt-5 tw:mb-0 tw:max-w-[640px] tw:text-lg tw:leading-[1.6] tw:max-site-tablet:mt-3.5 tw:max-site-mobile:mt-[18px] tw:max-site-mobile:text-[clamp(13px,4.3vw,17px)] tw:max-site-mobile:leading-[1.7]">Our customer care team assists borrowers with payments, account transfers, and account verification.</p>

          <div className="tw:mt-10 tw:grid tw:grid-cols-2 tw:gap-6 tw:text-left tw:max-site-tablet:mt-7 tw:max-site-tablet:grid-cols-1 tw:max-site-tablet:gap-5 tw:max-site-mobile:mt-[18px] tw:max-site-mobile:gap-4">
            <article className={channelCard}>
              <span className={channelIcon}><MailIcon /></span>
              <div>
                <h3 className={channelTitle}>Correspondence &amp; Payments</h3>
                <p className="tw:mt-3 tw:mb-0 tw:text-base">Send any correspondence or payments to:</p>
                <address className={channelAddress}>{publicSiteInfo.correspondence.map(line => <span className="tw:block" key={line}>{line}</span>)}</address>
              </div>
            </article>

            <article className={channelCard}>
              <span className={channelIcon}><MailIcon /></span>
              <div>
                <h3 className={channelTitle}>Email Support</h3>
                <p className="tw:mt-3 tw:mb-0 tw:text-base">Contact us via email:</p>
                <a className="tw:mt-2 tw:inline-block tw:break-all tw:text-[17px] tw:text-site-blue tw:underline tw:underline-offset-4" href={publicSiteInfo.email.href}>{publicSiteInfo.email.label}</a>
                <p className="tw:mt-5 tw:mb-0"><a className="tw:text-base tw:text-site-blue tw:underline tw:underline-offset-4" href={publicSiteInfo.complaints.href}>{publicSiteInfo.complaints.label}</a></p>
              </div>
            </article>

            <article className="tw:col-span-full tw:rounded-[14px] tw:border tw:border-solid tw:border-transparent tw:bg-[#eef6fd] tw:py-[30px] tw:pr-10 tw:pl-[130px] tw:max-site-laptop:pl-14 tw:max-site-tablet:p-8 tw:max-site-mobile:px-5 tw:max-site-mobile:py-6">
              <h3 className="tw:m-0 tw:text-2xl tw:leading-[1.3] tw:font-semibold tw:text-site-blue tw:max-site-mobile:text-[21px]">Written Requests &amp; Notices of Error</h3>
              <p className="tw:m-0 tw:mt-1.5 tw:text-sm tw:leading-[1.6]">For a formal notice of error or information request, confirm the designated address in your servicing correspondence or RTR&apos;s published contact instructions. Do not assume a general correspondence or payment address is the designated notice address.</p>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
