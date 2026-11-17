import { cn } from "@/components/portal-ui";
import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import HomeSignIn from "@/components/home-sign-in";
import SiteFooter, { phone } from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { publicSiteInfo } from "@/lib/public-site-info";
import { sitePage, siteShell, siteBadge, siteButton, sectionSpacing } from "@/components/site-ui";

export const metadata: Metadata = {
  title: "RTR Servicing | Your Account. Less Worry. More Clarity.",
  description: "Make a payment, set up AutoPay, view statements and get payment assistance with RTR Servicing.",
};

/* Phones (≤480px) get the purpose-made mobile artwork; everything else gets the desktop file. */
const mobileMedia = "(max-width: 480px)";

function HeroPicture() {
  const common = { alt: "A modern two-story home at sunset", fill: true, sizes: "100vw", quality: 90 } as const;
  const { props: { srcSet: desktop, ...rest } } = getImageProps({ ...common, src: "/home/hero-house-full.jpg" });
  const { props: { srcSet: mobile } } = getImageProps({ ...common, src: "/home/hero-house-mobile.jpg" });
  return (
    <picture>
      <source media={mobileMedia} srcSet={mobile} />
      <img {...rest} alt={common.alt} srcSet={desktop} className="tw:object-cover tw:object-bottom" loading="eager" fetchPriority="high" />
    </picture>
  );
}

function SupportPicture({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  return (
    <picture className="tw:block tw:w-full tw:max-site-phone:w-auto">
      <source media={mobileMedia} srcSet={mobile} width={319} height={253} />
      <img className="tw:block tw:h-auto tw:w-full tw:max-w-[521px] tw:max-site-phone:max-w-[319px]" src={desktop} alt={alt} width={521} height={251} loading="lazy" decoding="async" />
    </picture>
  );
}

const actions = [
  { title: "Make a Payment", copy: "Make a payment online.", icon: "payment", tone: "green" },
  { title: "Set Up AutoPay", copy: "Pick your draft date.", icon: "autopay", tone: "blue" },
  { title: "View Statements", copy: "Statements and tax forms.", icon: "statements", tone: "green" },
  { title: "Payment Assistance", copy: "Options if you need help.", icon: "assistance", tone: "blue" },
] as const;

function ActionIcon({ type }: { type: (typeof actions)[number]["icon"] }) {
  if (type === "payment") return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 14a17 17 0 1 1-4-4" strokeDasharray="3 4" /><circle cx="24" cy="24" r="12" /><path d="M27.5 19.5c-.7-1-2-1.5-3.5-1.5-2 0-3.4 1-3.4 2.6 0 3.6 7 1.9 7 5.6 0 1.7-1.5 2.8-3.6 2.8-1.6 0-3-.6-3.7-1.6M24 16v2m0 12v2" /></svg>;
  if (type === "autopay") return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M27 38H9a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3h28a3 3 0 0 1 3 3v12M6 18h34M15 6v7m16-7v7" /><path d="M12 24h4m4 0h4m4 0h4m-20 6h4m4 0h4" /><circle cx="36" cy="36" r="7" /><path d="M36 32.5V36l2.5 1.5" /></svg>;
  if (type === "statements") return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="7" width="38" height="27" rx="3" /><path d="M18 41h12m-6-7v7M11 15h11m-11 6h11m-11 6h8" /><path d="M35 14.5c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.4.7-2.4 1.8 0 2.6 5 1.4 5 4 0 1.2-1 2-2.6 2-1.1 0-2.1-.5-2.6-1.2m2.6-8v1.4m0 7.8v1.4" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 26v-4a14 14 0 0 1 28 0v4" /><rect x="7" y="25" width="7" height="11" rx="3" /><rect x="34" y="25" width="7" height="11" rx="3" /><path d="M37.5 36c0 4-3 6-8 6h-3" /><rect x="21" y="39.5" width="6" height="5" rx="2" /></svg>;
}

export default function HomePage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="tw:relative tw:w-full tw:overflow-hidden tw:rounded-b-3xl tw:bg-[#e7f5e7] tw:pb-12 tw:min-h-[clamp(780px,72.3vw,1100px)] tw:max-site-tablet:flex tw:max-site-tablet:min-h-0 tw:max-site-tablet:flex-col tw:max-site-tablet:pb-0 tw:max-site-mobile:block tw:max-site-mobile:rounded-b-[14px] tw:max-site-mobile:pb-6" aria-labelledby="hm-hero-title">
          <div className="tw:absolute tw:inset-0 tw:overflow-hidden tw:max-site-tablet:relative tw:max-site-tablet:inset-auto tw:max-site-tablet:order-2 tw:max-site-tablet:-mt-10 tw:max-site-tablet:aspect-[1396/740] tw:max-site-stack:mt-0 tw:max-site-mobile:absolute tw:max-site-mobile:inset-0 tw:max-site-mobile:aspect-auto">
            <HeroPicture />
          </div>
          <div className={cn(siteShell, ` tw:relative tw:z-1 tw:grid tw:grid-cols-[minmax(0,1fr)_458px] tw:items-start tw:gap-12 tw:pt-[126px] tw:max-site-laptop:grid-cols-[minmax(0,1fr)_420px] tw:max-site-laptop:pt-24 tw:max-site-tablet:order-1 tw:max-site-tablet:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] tw:max-site-tablet:gap-7 tw:max-site-tablet:pt-12 tw:max-site-stack:grid-cols-1 tw:max-site-stack:gap-8 tw:max-site-mobile:w-[calc(100%_-_16px)] tw:max-site-mobile:gap-3 tw:max-site-mobile:pt-[clamp(36px,13vw,48px)]`)}>
            <div className="tw:min-w-0 tw:max-site-mobile:px-[clamp(12px,4.3vw,20px)] tw:max-site-mobile:text-center">
              <span className={cn(siteBadge, ` tw:mb-[22px] tw:uppercase tw:max-site-mobile:mb-1.5 tw:max-site-mobile:rounded-[5px] tw:max-site-mobile:px-[18px] tw:max-site-mobile:text-[clamp(9px,2.7vw,11px)] tw:max-site-mobile:font-medium tw:max-site-mobile:tracking-normal`)}>Loan Servicing &amp; Account Support</span>
              <h1 id="hm-hero-title" className="tw:m-0 tw:mb-4 tw:text-[84px] tw:leading-[1.04] tw:font-medium tw:tracking-[-.02em] tw:max-site-laptop:text-[72px] tw:max-site-tablet:text-[64px] tw:max-site-mobile:mb-[9px] tw:max-site-mobile:text-[clamp(32px,11.8vw,46px)] tw:max-site-mobile:leading-[1.14]">Your Account.<br />Less Worry<br /><span className="tw:text-site-green-ink">More Clarity.</span></h1>
              <div className="tw:flex tw:flex-wrap tw:gap-4 tw:max-site-mobile:gap-2">
                <a className={siteButton("dark", "tw:min-h-[58px] tw:min-w-[248px] tw:text-lg tw:max-site-tablet:min-h-[52px] tw:max-site-tablet:min-w-0 tw:max-site-tablet:flex-[1_1_200px] tw:max-site-tablet:text-base tw:max-site-mobile:min-h-[clamp(42px,15.1vw,56px)] tw:max-site-mobile:flex-[1_1_100%] tw:max-site-mobile:text-[clamp(15px,5.4vw,18px)]")} href="#sign-in">Make a Payment</a>
                <a className={siteButton("blue", "tw:min-h-[58px] tw:min-w-[248px] tw:text-lg tw:max-site-tablet:min-h-[52px] tw:max-site-tablet:min-w-0 tw:max-site-tablet:flex-[1_1_200px] tw:max-site-tablet:text-base tw:max-site-mobile:min-h-[clamp(42px,15.1vw,56px)] tw:max-site-mobile:flex-[1_1_100%] tw:max-site-mobile:bg-site-blue-dark tw:max-site-mobile:shadow-[0_8px_18px_#004f7d33] tw:max-site-mobile:text-[clamp(15px,5.4vw,18px)]")} href="#register">New Here? Register</a>
              </div>
            </div>
            <HomeSignIn phone={phone.label} />
          </div>
        </section>

        <section className={cn(sectionSpacing, ` tw:bg-[linear-gradient(to_bottom,transparent_65%,white_100%),url('/home/sketch-building.png')] tw:bg-size-[auto,contain] tw:bg-position-[center,center_bottom] tw:bg-no-repeat tw:max-site-mobile:bg-[url('/home/building.jpeg')] tw:max-site-mobile:bg-size-[auto_1050px] tw:max-site-mobile:bg-position-[left_70px] tw:max-site-mobile:py-10`)} aria-labelledby="hm-actions-title">
          <div className={cn(siteShell, ` tw:max-site-mobile:w-[calc(100%_-_64px)] tw:max-site-mobile:max-w-[420px]`)}>
            <h2 id="hm-actions-title" className="tw:m-0 tw:mb-12 tw:text-center tw:text-[54px] tw:leading-[1.3] tw:font-medium tw:tracking-[-.02em] tw:max-site-laptop:text-[48px] tw:max-site-tablet:mb-7 tw:max-site-tablet:text-[42px] tw:max-site-mobile:-mx-3 tw:max-site-mobile:mb-11 tw:max-site-mobile:w-[calc(100%_+_24px)] tw:max-site-mobile:text-[clamp(20px,10.5vw,40px)] tw:max-site-mobile:leading-[1.2]">What would you <br className="tw:hidden tw:max-site-mobile:block" /><span className="tw:text-site-green-ink">like</span><br className="tw:max-site-mobile:hidden" /> <span className="tw:text-site-green-ink">to do?</span></h2>
            <div className="tw:grid tw:grid-cols-[repeat(4,1fr)] tw:gap-4 tw:max-site-tablet:grid-cols-2 tw:max-site-tablet:gap-5 tw:max-site-mobile:grid-cols-1 tw:max-site-mobile:gap-4">
              {actions.map((action) => (
                <article className={`tw:flex tw:flex-col tw:items-center tw:rounded-t-[10px] tw:border-0 tw:border-b-[3px] tw:border-solid tw:px-[34px] tw:pt-[39px] tw:pb-8 tw:text-center tw:transition tw:hover:-translate-y-1 tw:hover:shadow-[0_18px_40px_#000e1614] tw:max-site-laptop:px-5 tw:max-site-mobile:min-h-[clamp(174px,91.5vw,350px)] tw:max-site-mobile:rounded-t-2xl tw:max-site-mobile:border-b-2 tw:max-site-mobile:px-[clamp(16px,8vw,32px)] tw:max-site-mobile:pt-[clamp(20px,10.3vw,40px)] ${action.tone === "green" ? "tw:border-site-green tw:bg-site-green-soft tw:max-site-mobile:bg-[#e3ffe3] tw:[&_svg]:stroke-site-green" : "tw:border-site-blue tw:bg-site-blue-soft tw:max-site-mobile:bg-[#e5f5ff] tw:[&_svg]:stroke-site-blue"}`} key={action.title}>
                  <span className="tw:mb-7 tw:block tw:w-full tw:border-0 tw:border-b tw:border-solid tw:border-black/12 tw:pb-10 tw:[&_svg]:mx-auto tw:[&_svg]:block tw:[&_svg]:size-12 tw:[&_svg]:fill-none tw:[&_svg]:stroke-2 tw:[&_svg]:[stroke-linecap:round] tw:[&_svg]:[stroke-linejoin:round] tw:max-site-mobile:mb-6 tw:max-site-mobile:[&_svg]:size-[clamp(28px,14vw,52px)]"><ActionIcon type={action.icon} /></span>
                  <h3 className="tw:m-0 tw:text-2xl tw:leading-[1.3] tw:font-medium tw:max-site-mobile:text-[clamp(13px,6.5vw,24px)] tw:max-site-mobile:tracking-[-.03em]">{action.title}</h3>
                  <p className="tw:m-0 tw:mt-3 tw:mb-6 tw:text-[17px] tw:max-site-mobile:mt-[18px] tw:max-site-mobile:mb-5 tw:max-site-mobile:text-[clamp(10px,5.2vw,18px)] tw:max-site-mobile:tracking-[-.025em]">{action.copy}</p>
                  <a className={siteButton("blue", "tw:mt-auto tw:min-h-[58px] tw:min-w-[210px] tw:text-[17px] tw:max-site-laptop:w-full tw:max-site-laptop:min-w-0 tw:max-site-mobile:w-[min(100%,210px)] tw:max-site-mobile:min-h-[clamp(30px,15.8vw,58px)] tw:max-site-mobile:rounded-xl tw:max-site-mobile:text-[clamp(11px,5.3vw,20px)]")} href="#sign-in">Get started</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="help" className={cn(sectionSpacing, ` tw:bg-[#f7f7f7] tw:bg-[url('/home/sketch-city.png')] tw:bg-size-[1440px_auto] tw:bg-bottom tw:bg-no-repeat tw:px-16 tw:max-site-tablet:px-8 tw:max-site-mobile:px-5 tw:max-site-phone:bg-[url('/home/sketch-city-mobile.png')] tw:max-site-phone:bg-size-[390px_auto]`)} aria-label="Customer support">
          <div className="tw:grid tw:grid-cols-[repeat(2,minmax(0,567px))] tw:justify-center tw:gap-6 tw:max-site-tablet:grid-cols-[minmax(0,567px)] tw:max-site-tablet:gap-5 tw:max-site-mobile:gap-4">
            <article className="tw:flex tw:min-w-0 tw:flex-col tw:rounded-[14px] tw:bg-site-blue tw:px-[23px] tw:pt-[23px] tw:pb-11 tw:text-white tw:max-site-mobile:p-3 tw:max-site-mobile:pb-7 tw:max-site-phone:p-4 tw:max-site-phone:pb-7">
              <div className="tw:overflow-hidden tw:rounded-xl tw:max-site-phone:flex tw:max-site-phone:justify-center tw:max-site-phone:rounded-none"><SupportPicture desktop="/home/talk-person.png" mobile="/home/talk-person-mobile.png" alt="A couple speaking with an RTR Servicing representative" /></div>
              <div className="tw:mx-[13px] tw:mt-10 tw:flex tw:items-start tw:justify-between tw:gap-4 tw:max-site-mobile:mx-2 tw:max-site-mobile:mt-6 tw:max-site-mobile:flex-col tw:max-site-mobile:gap-3">
                <span className="tw:shrink-0 tw:rounded-md tw:bg-white tw:px-[18px] tw:py-2 tw:text-[13px] tw:whitespace-nowrap tw:text-site-ink">Live Customer Care</span>
                <span className="tw:text-right tw:text-[15px] tw:leading-[1.6] tw:max-site-mobile:text-left">{publicSiteInfo.hoursShort}</span>
              </div>
              <h2 className="tw:mx-[13px] tw:mt-4 tw:mb-0 tw:text-[50px] tw:leading-[1.12] tw:font-medium tw:tracking-[-.02em] tw:max-site-mobile:mx-2 tw:max-site-mobile:text-4xl">Talk to a real<br />person.</h2>
              <div className="tw:mx-[13px] tw:mt-auto tw:flex tw:gap-3 tw:pt-[30px] tw:max-site-mobile:mx-2 tw:max-site-mobile:flex-col">
                <a className={siteButton("white", "tw:min-h-[58px] tw:min-w-0 tw:flex-1 tw:text-lg tw:max-site-mobile:min-h-[52px] tw:max-site-mobile:text-base")} href={phone.href}>Call {phone.label}</a>
                <Link className={siteButton("white", "tw:min-h-[58px] tw:min-w-0 tw:flex-1 tw:text-lg tw:max-site-mobile:min-h-[52px] tw:max-site-mobile:text-base")} href="/contact#message">Message us</Link>
              </div>
            </article>

            <article className="tw:flex tw:min-w-0 tw:flex-col tw:rounded-[14px] tw:bg-site-green-ink tw:px-[23px] tw:pt-[23px] tw:pb-11 tw:text-white tw:max-site-mobile:p-3 tw:max-site-mobile:pb-7 tw:max-site-phone:p-4 tw:max-site-phone:pb-7">
              <div className="tw:overflow-hidden tw:rounded-xl tw:max-site-phone:flex tw:max-site-phone:justify-center tw:max-site-phone:rounded-none"><SupportPicture desktop="/home/paying.jpeg" mobile="/home/paying.jpeg" alt="Making a payment alongside property paperwork and house keys" /></div>
              <h2 className="tw:mx-[13px] tw:mt-9 tw:mb-0 tw:text-[50px] tw:leading-[1.12] tw:font-medium tw:tracking-[-.02em] tw:max-site-mobile:mx-2 tw:max-site-mobile:mt-6 tw:max-site-mobile:text-4xl">Having trouble<br />paying?</h2>
              <p className="tw:mx-[13px] tw:mt-[18px] tw:mb-0 tw:text-lg tw:max-site-mobile:mx-2">Talk with Customer Solutions about options that may be available for your account.</p>
              <div className="tw:mx-[13px] tw:mt-auto tw:flex tw:gap-3 tw:pt-[30px] tw:max-site-mobile:mx-2 tw:max-site-mobile:flex-col">
                <a className={siteButton("white", "tw:min-h-[58px] tw:basis-[246px] tw:text-lg tw:max-site-mobile:min-h-[52px] tw:max-site-mobile:basis-auto tw:max-site-mobile:text-base")} href="/help-center#hardship-assistance">See Your Options</a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
