import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { googleSansFlex } from "@/app/fonts";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { sitePage } from "@/components/site-ui";
import content from "./content.json";
import styles from "./sms-terms.module.css";

export const metadata: Metadata = {
  title: "SMS Terms of Service | RTR Servicing",
  description: "Read the terms for optional RTR Servicing SMS alerts, including opt-in, opt-out, support, and message rates.",
  alternates: { canonical: "/sms-terms" },
};

function ContentsLinks() {
  return (
    <ol>
      {content.sections.map((section, index) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

// Convert only known references into links; the supplied legal wording stays intact.
function LinkedText({ text }: { text: string }) {
  const references = /\[support@rtrservicing\.com\]\(mailto:support@rtrservicing\.com\)|\(877\) 469-7325|Privacy Policy|“STOP”|“HELP”/g;
  const parts = text.split(references);
  const matches = [...text.matchAll(references)];

  return parts.map((part, index) => {
    const match = matches[index]?.[0];
    let reference;
    if (match?.startsWith("[support@")) {
      reference = <a href="mailto:support@rtrservicing.com">support@rtrservicing.com</a>;
    } else if (match === "Privacy Policy") {
      reference = <Link href="/privacy-policy">{match}</Link>;
    } else if (match === "“STOP”" || match === "“HELP”") {
      reference = <strong>{match}</strong>;
    } else if (match === "(877) 469-7325") {
      reference = <a href="tel:+18774697325">{match}</a>;
    }
    return <Fragment key={index}>{part}{reference}</Fragment>;
  });
}

export default function SmsTermsPage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">SMS Terms of Service</span>
          </nav>

          <header className={styles.hero} aria-labelledby="sms-title">
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><span aria-hidden="true" />Legal &amp; policies</span>
              <h1 id="sms-title">SMS Terms of <span>Service</span></h1>
              <p>Stay informed. Stay in control of your SMS alerts.</p>
              <div className={styles.updated}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="2" /><path d="M6 2.5v4m8-4v4M3 9h14m-10 4h2m2 0h2" /></svg>
                <span>Updated: <time dateTime="2026-11">November 2026</time></span>
              </div>
            </div>
            <div className={styles.heroPhoto} aria-hidden="true">
              <Image
                src="/legal/sms-terms-smartphone-messaging.webp"
                alt=""
                fill
                sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc(100vw - 64px), (max-width: 1440px) calc(100vw - 128px), 1312px"
                quality={90}
                preload
              />
            </div>
          </header>

          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <nav className={styles.contents} aria-label="On this page">
                <div className={styles.desktopContents}>
                  <h2>On this page</h2>
                  <ContentsLinks />
                </div>
                <details className={styles.mobileContents}>
                  <summary>On this page <span>{content.sections.length} sections</span></summary>
                  <ContentsLinks />
                </details>
              </nav>
              <div className={styles.help}>
                <span className={styles.helpIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M4 11a8 8 0 0 1 16 0v6a3 3 0 0 1-3 3h-3M4 11h3v6H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Zm16 0h-3v6h3a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z" /></svg>
                </span>
                <h2>Have a question?</h2>
                <p>Contact us about SMS Alerts.</p>
                <a href="mailto:support@rtrservicing.com">Email our team <span aria-hidden="true">↗</span></a>
                <a href="tel:+18774697325">(877) 469-7325</a>
              </div>
            </aside>

            <article className={styles.document} aria-label="SMS Terms of Service">
              <div className={styles.documentIntro}>
                <span className={styles.documentLabel}>RTR Servicing</span>
                <p>{content.introduction}</p>
              </div>
              {content.sections.map((section, index) => (
                <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-heading`}>
                  <h2 id={`${section.id}-heading`}>
                    <span className={styles.sectionNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}><LinkedText text={paragraph} /></p>
                  ))}
                </section>
              ))}
              <div className={styles.documentEnd}>
                <span>End of SMS Terms of Service</span>
                <a href="#main-content">Back to top <span aria-hidden="true">↑</span></a>
              </div>
            </article>
          </div>
        </div>
      </main>
      <div className={styles.siteFooter}><SiteFooter /></div>
    </div>
  );
}
