import type { Metadata } from "next";
import { googleSansFlex } from "@/app/fonts";
import ContactForms from "@/components/contact-forms";
import SiteFooter, { phone } from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "../site.css";
import "./contact.css";

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
    <div className={`hm hm-contact ${googleSansFlex.variable}`}>
      <SiteHeader />

      <main>
        <section className="ct-hero hm-shell" aria-labelledby="ct-title">
          <div className="ct-hero-grid">
            <div className="ct-hero-copy">
              <span className="hm-badge">Customer Solutions &amp; Support • RTR Servicing</span>
              <h1 id="ct-title">Contact RTR <span>Customer Solutions</span></h1>
              <p>Speak directly with our team. Schedule a callback, call our toll-free customer line, or send an inquiry below.</p>
            </div>
            <ContactForms />
            <div className="ct-hero-cards">
              <a className="ct-box ct-phone" href={phone.href}>
                <span className="ct-phone-label">Call Us Toll-Free</span>
                <strong>{phone.label}</strong>
                <span>HOA-Related Inquiries: 833-636-2981</span>
              </a>
              <article className="ct-box ct-hours">
                <span className="ct-hours-icon"><CalendarClockIcon /></span>
                <div>
                  <h3>Hours of Operation:</h3>
                  <p>Monday – Thursday: 7:00 a.m. – 9:00 p.m. CT</p>
                  <p>Friday: 7:00 a.m. – 7:00 p.m. CT</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="ct-channels hm-shell" aria-labelledby="ct-channels-title">
          <span className="hm-badge">Direct Assistance</span>
          <h2 id="ct-channels-title">Support Channels</h2>
          <p className="ct-channels-intro">Our customer care team assists borrowers with payments, account transfers, and account verification.</p>

          <div className="ct-grid">
            <article className="ct-box ct-mail">
              <span className="ct-mail-icon"><MailIcon /></span>
              <div>
                <h3>General Correspondence &amp; Payments</h3>
                <address>RTR Servicing<br />P.O. Box 36655<br />Dallas, TX 75235-1655</address>
              </div>
            </article>

            <article className="ct-box ct-mail ct-hq-address">
              <span className="ct-mail-icon"><MailIcon /></span>
              <div>
                <h3>Corporate Headquarters</h3>
                <address>RTR Servicing<br />1349 Empire Central Drive<br />Suite 1300<br />Dallas, TX 75247</address>
              </div>
            </article>

            <article className="ct-box ct-written">
              <h3>Written Requests &amp; Notices of Error</h3>
              <p>Notices of Error, Requests for Information, or Qualified Written Requests must be sent in writing to: P.O. Box 36655, Dallas, TX 75235-1655.</p>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
