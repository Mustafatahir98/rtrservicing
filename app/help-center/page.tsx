import type { Metadata } from "next";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import HelpCenter from "@/components/help-center";
import ResponsivePhoto from "@/components/responsive-photo";
import SiteFooter, { phone } from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "../site.css";
import "./help-center.css";

export const metadata: Metadata = {
  title: "Help Center & FAQs | RTR Servicing",
  description: "Answers about account transfers, payments and AutoPay, Form 1098 and statements, and hardship assistance.",
};

export default function HelpCenterPage() {
  return (
    <div className={`hm ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main>
        <HelpCenter />

        <section className="hc-cta-section" aria-labelledby="hc-cta-title">
          <div className="hc-cta hm-shell">
            <div className="hc-cta-copy">
              <h2 id="hc-cta-title">Need personalized <span>account assistance?</span></h2>
              <p>Our Dallas team is available Monday through Thursday 7am–9pm, and Friday 7am–7pm CT.</p>
              <div className="hc-cta-buttons">
                <Link className="hm-btn hm-btn-outline-dark" href="/contact#message">Send a Message</Link>
                <a className="hm-btn hm-btn-blue" href={phone.href}>Call {phone.label}</a>
              </div>
            </div>
            <ResponsivePhoto
              className="hc-cta-photo"
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
