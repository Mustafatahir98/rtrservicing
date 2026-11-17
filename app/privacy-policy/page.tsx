import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { googleSansFlex } from "@/app/fonts";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { sitePage } from "@/components/site-ui";
import content from "./content.json";
import styles from "./privacy-policy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | RTR Servicing",
  description: "Learn how RTR Servicing collects, uses, shares, and safeguards your personal information.",
  alternates: { canonical: "/privacy-policy" },
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
  const references = /Non-Affiliate Privacy Notice|Affiliate Privacy Notice|\(877\) 469-7325/g;
  const parts = text.split(references);
  const matches = [...text.matchAll(references)];

  return parts.map((part, index) => {
    const match = matches[index]?.[0];
    let reference;
    if (match === "Non-Affiliate Privacy Notice") {
      reference = <Link href="/privacy-notice-non-affiliate">{match}</Link>;
    } else if (match === "Affiliate Privacy Notice") {
      reference = <Link href="/privacy-notice-affiliate">{match}</Link>;
    } else if (match === "(877) 469-7325") {
      reference = <a href="tel:+18774697325">{match}</a>;
    }
    return <Fragment key={index}>{part}{reference}</Fragment>;
  });
}

export default function PrivacyPolicyPage() {
  return (
    <div className={`${sitePage} ${googleSansFlex.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Privacy Policy</span>
          </nav>

          <header className={styles.hero} aria-labelledby="privacy-title">
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><span aria-hidden="true" />Legal &amp; policies</span>
              <h1 id="privacy-title">Privacy <span>Policy</span></h1>
              <p>How we collect, use, and protect your personal information.</p>
              <div className={styles.updated}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4.5" width="14" height="13" rx="2" /><path d="M6 2.5v4m8-4v4M3 9h14m-10 4h2m2 0h2" /></svg>
                <span>Last updated: <time dateTime="2026-11">November 2026</time></span>
              </div>
            </div>
            <div className={styles.heroPhoto} aria-hidden="true">
              <Image
                src="/legal/privacy-policy-laptop-workspace.webp"
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
                <p>Contact us about this Privacy Policy.</p>
                <a href="mailto:support@rtrservicing.com">Email our team <span aria-hidden="true">↗</span></a>
                <a href="tel:+18774697325">(877) 469-7325</a>
              </div>
            </aside>

            <article className={styles.document} aria-label="Privacy Policy">
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
                  {section.link ? <p className={styles.policyLink}><a href={section.link.href}>{section.link.label}</a></p> : null}
                </section>
              ))}
              <div className={styles.documentEnd}>
                <span>End of Privacy Policy</span>
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
