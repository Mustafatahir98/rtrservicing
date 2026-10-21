import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import HomeSignIn from "@/components/home-sign-in";
import SiteFooter, { phone } from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "./site.css";
import "./home/home.css";

export const metadata: Metadata = {
  title: "RTR Servicing | Your Loan. Less Worry. More Clarity.",
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
      <img {...rest} alt={common.alt} srcSet={desktop} className="hm-hero-image" loading="eager" fetchPriority="high" />
    </picture>
  );
}

function SupportPicture({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  return (
    <picture>
      <source media={mobileMedia} srcSet={mobile} width={319} height={253} />
      <img src={desktop} alt={alt} width={521} height={251} loading="lazy" decoding="async" />
    </picture>
  );
}

const actions = [
  { title: "Make a Payment", copy: "Pay online with no fee.", icon: "payment", tone: "green" },
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
    <div className={`hm ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main>
        <section className="hm-hero" aria-labelledby="hm-hero-title">
          <div className="hm-hero-media">
            <HeroPicture />
          </div>
          <div className="hm-hero-grid">
            <div className="hm-hero-copy">
              <span className="hm-badge">Loan Servicing Made Simple</span>
              <h1 id="hm-hero-title">Your Loan.<br />Less Worry<br /><span>More Clarity.</span></h1>
              <p>Manage Your Loan Servicing In One Place</p>
              <div className="hm-hero-buttons">
                <a className="hm-btn hm-btn-outline-dark" href="#sign-in">Make a Payment</a>
                <a className="hm-btn hm-btn-blue" href="#sign-in">New Here? Register</a>
              </div>
            </div>
            <HomeSignIn phone={phone.label} />
          </div>
        </section>

        <section className="hm-actions" aria-labelledby="hm-actions-title">
          <div className="hm-shell">
            <h2 id="hm-actions-title" className="hm-section-title">What would you <span>like</span><br /><span>to do?</span></h2>
            <div className="hm-action-grid">
              {actions.map((action) => (
                <article className={`hm-action-card is-${action.tone}`} key={action.title}>
                  <span className="hm-action-icon"><ActionIcon type={action.icon} /></span>
                  <h3>{action.title}</h3>
                  <p>{action.copy}</p>
                  <a className="hm-btn hm-btn-blue" href="#sign-in">Get started</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="help" className="hm-support" aria-label="Customer support">
          <div className="hm-support-grid">
            <article className="hm-support-card is-blue">
              <div className="hm-support-media"><SupportPicture desktop="/home/talk-person.png" mobile="/home/talk-person-mobile.png" alt="A couple speaking with an RTR Servicing representative" /></div>
              <div className="hm-support-meta">
                <span className="hm-pill">Live Customer Care</span>
                <span className="hm-hours">Mon–Thu 7am–9pm, Fri <br />7am–7pm CT</span>
              </div>
              <h2>Talk to a real<br />person.</h2>
              <div className="hm-support-buttons">
                <a className="hm-btn hm-btn-white" href={phone.href}>Call {phone.label}</a>
                <Link className="hm-btn hm-btn-white" href="/contact#message">Message us</Link>
              </div>
            </article>

            <article className="hm-support-card is-green">
              <div className="hm-support-media"><SupportPicture desktop="/home/trouble-paying.png" mobile="/home/trouble-paying-mobile.png" alt="Reviewing a payment and floor plan paperwork" /></div>
              <h2>Having trouble<br />paying?</h2>
              <p>We&apos;ll work with you on your options.</p>
              <div className="hm-support-buttons">
                <a className="hm-btn hm-btn-white" href="#sign-in">See Your Options</a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
