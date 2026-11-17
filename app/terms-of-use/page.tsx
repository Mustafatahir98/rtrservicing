import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { googleSansFlex } from "@/app/fonts";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { sitePage } from "@/components/site-ui";
import content from "./content.json";
import styles from "./terms-of-use.module.css";

export const metadata: Metadata = {
  title: "Terms of Use | RTR Servicing",
  description: "Read the terms governing use of the RTR Servicing website, including electronic communications, privacy, and accessibility.",
  alternates: { canonical: "/terms-of-use" },
};

const paragraphHeadings = [
  "Electronic Communications.",
  "Scope of Consent.",
  "Telephone Consumer Protection Act (TCPA) Consent.",
  "Hardware and Software Requirements.",
  "Mobile Technology.",
  "Withdrawing Consent.",
];

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
  const references = /\[support@rtrservicing\.com\]\(mailto:support@rtrservicing\.com\)|\(877\) 469-7325|\(844\) 581-7776|SMS Terms|RTR Servicing Privacy Policy/g;
  const parts = text.split(references);
  const matches = [...text.matchAll(references)];

  return parts.map((part, index) => {
    const match = matches[index]?.[0];
    let reference;
    if (match?.startsWith("[support@")) {
      reference = <a href="mailto:support@rtrservicing.com">support@rtrservicing.com</a>;
    } else if (match === "(877) 469-7325") {
      reference = <a href="tel:+18774697325">{match}</a>;
    } else if (match === "(844) 581-7776") {
      reference = <a href="tel:+18445817776">{match}</a>;
    } else if (match === "SMS Terms") {
      reference = <Link href="/sms-terms">{match}</Link>;
    } else if (match === "RTR Servicing Privacy Policy") {
      reference = <Link href="/privacy-policy">{match}</Link>;
    }
    return <Fragment key={index}>{part}{reference}</Fragment>;
  });
}

export default function TermsOfUsePage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Terms of Use</span>
          </nav>

          <header className={styles.hero} aria-labelledby="terms-title">
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><span aria-hidden="true" />Legal &amp; policies</span>
              <h1 id="terms-title">Terms of <span>Use</span></h1>
              <p>The terms that govern your use of the RTR Servicing website.</p>
              <div className={styles.updated}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="2" /><path d="M6 2.5v4m8-4v4M3 9h14m-10 4h2m2 0h2" /></svg>
                <span>Last updated: <time dateTime="2026-11">November 2026</time></span>
              </div>
            </div>
            <div className={styles.heroPhoto} aria-hidden="true">
              <Image
                src="/legal/terms-of-use-contract-signing.webp"
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
                <p>Contact us about these Terms of Use.</p>
                <a href="mailto:support@rtrservicing.com">Email our team <span aria-hidden="true">↗</span></a>
                <a href="tel:+18774697325">(877) 469-7325</a>
              </div>
            </aside>

            <article className={styles.document} aria-label="Terms of Use">
              <div className={styles.documentIntro}>
                <span className={styles.documentLabel}>RTR Servicing</span>
                <p>Please read these terms carefully before using our website.</p>
              </div>
              {content.sections.map((section, index) => (
                <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-heading`}>
                  <h2 id={`${section.id}-heading`}>
                    <span className={styles.sectionNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => {
                    const heading = paragraphHeadings.find(prefix => paragraph.startsWith(prefix));
                    return (
                      <p key={paragraphIndex} lang={paragraph.startsWith("Aviso:") ? "es" : undefined}>
                        {heading ? <><strong>{heading}</strong>{" "}<LinkedText text={paragraph.slice(heading.length).trimStart()} /></> : <LinkedText text={paragraph} />}
                      </p>
                    );
                  })}
                </section>
              ))}
              <div className={styles.documentEnd}>
                <span>End of Terms of Use</span>
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
