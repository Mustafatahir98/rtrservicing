import Image from "next/image";
import ContactForm from "@/components/contact-form";
import FaqList from "@/components/faq-list";
import ServicingModal from "@/components/servicing-modal";

const steps = [
  { title: "We contact you", copy: "We'll let you know about your account and next steps.", icon: "mail" },
  { title: "You manage online", copy: "Access your account, make payments and view details.", icon: "screen" },
  { title: "We're here to help", copy: "Our team is available if you have questions.", icon: "people" },
] as const;

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <Image src="/logo.png" alt="RTR Servicing" width={788} height={31} priority />
    </span>
  );
}

function StepIcon({ type }: { type: (typeof steps)[number]["icon"] }) {
  if (type === "mail") return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="12" width="34" height="25" rx="3"/><path d="m9 15 15 12 15-12"/></svg>;
  if (type === "screen") return <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="9" width="36" height="27" rx="2"/><path d="M17 42h14M24 36v6"/></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="6"/><circle cx="10" cy="19" r="5"/><circle cx="38" cy="19" r="5"/><path d="M15 37v-4c0-6 4-10 9-10s9 4 9 10v4M3 35v-3c0-5 3-8 7-8 2 0 4 1 5 3M45 35v-3c0-5-3-8-7-8-2 0-4 1-5 3"/></svg>;
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="header-inner"><Logo /><a className="outline-button" href="#contact">Contact Us</a></div>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <Image className="hero-image" src="/hero-image.png" alt="A couple reviewing their loan documents together" fill priority sizes="(max-width: 768px) 100vw, 1200px" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="eyebrow"><span>✓</span> Trusted servicing for consumer and mortgage accounts.</p>
          <h1 id="hero-title">Manage Your Loan<br />Servicing In One Place</h1>
          <p>Secure simple tools to manage your payments,<br className="desktop-break" /> statements and account details.</p>
        </div>
        <a className="white-button hero-button" href="#contact">Contact Us <span>→</span></a>
      </section>

      <section className="intro shell narrow-section">
        <h2>RTR Servicing provides reliable, customer-focused<br className="wide-break" /> loan servicing solutions designed to support borrowers<br className="wide-break" /> throughout every stage of the loan lifecycle.</h2>
        <p>Backed by decades of industry experience, we combine responsive service,<br className="wide-break" /> flexible payment solutions, and a strong commitment to compliance to help<br className="wide-break" /> customers manage their financial obligations with confidence.</p>
      </section>

      <section className="why shell">
        <div className="why-copy">
          <h2>Why RTR Servicing Is<br />Contacting You?</h2>
          <div>
            <p>You may be receiving this communication because your account is now serviced by RTR Servicing. We&apos;re here to support you and make managing your account easy and secure.</p>
            <ServicingModal />
          </div>
        </div>
        <div className="pattern-panel">
          <Image className="servicing-pattern" src="/servicing.png" alt="" fill sizes="(max-width: 900px) 100vw, 666px" />
          <span className="rtr-mark">rtr<span>›</span></span>
        </div>
      </section>

      <section id="how" className="how shell">
        <h2>How Servicing Works</h2>
        <div className="steps">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <div className="step-icon"><StepIcon type={step.icon} /></div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section shell">
        <h2>Frequently Asked Questions</h2>
        <FaqList />
        <p className="faq-contact">Couldn&apos;t find the answer? <a href="#contact">Contact us</a></p>
      </section>

      <section id="contact" className="contact-section shell">
        <div className="contact-card pattern-soft">
          <div className="contact-card-intro">
            <h2>Contact Us</h2>
            <p>Contact us today, and someone in our Customer Solutions Department will get back with you as soon as possible!</p>
          </div>
          <div className="contact-details">
            <p>Call Us Toll-Free</p>
            <a href="tel:8772523761">877-252-3761</a>
            <p>Customer Solutions Professionals are available to assist you during the following hours:</p>
            <p><strong>Monday – Thursday:</strong> 7:00 a.m. – 9:00 p.m.<br /><strong>Friday:</strong> 7:00 a.m. – 7:00 p.m.<br />All times Central</p>
          </div>
          <div className="contact-card-footer">
            <small>*Hours may vary depending on department. If you reach us after hours, please leave us a voicemail and we will return your call.</small>
            <span className="contact-mark"><Image src="/logo.png" alt="RTR" width={788} height={31} /></span>
          </div>
        </div>
        <ContactForm />
      </section>

      <footer className="footer shell pattern-footer">
        <div><Logo /><p>Secure simple tools to manage your<br />payments, statements and account details.</p></div>
        <div className="footer-bottom"><span>© 2026 RTR Servicing. All rights reserved.</span><span>NMLS ID: 2123790</span></div>
      </footer>
    </main>
  );
}
