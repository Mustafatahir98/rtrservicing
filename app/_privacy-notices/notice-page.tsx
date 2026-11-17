import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { googleSansFlex } from "@/app/fonts";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { sitePage } from "@/components/site-ui";
import styles from "./privacy-notices.module.css";

type RichNode = string | { tag: string; children: RichNode[]; href?: string };
type FactRow = { label: string; content: RichNode[] };
type SharingRow = { reason: RichNode[]; shares: string; limit: string };
type Section = { id: string; title: string } & (
  | { kind: "facts"; rows: FactRow[] }
  | { kind: "sharing"; columns: string[]; rows: SharingRow[] }
  | { kind: "paragraphs"; paragraphs: RichNode[][] }
);
export type NoticeData = { title: string; variant: string; pdf: string; sections: Section[] };

// The importer keeps only these content elements. Source HTML is never executed.
function RichText({ nodes }: { nodes: RichNode[] }) {
  return nodes.map((node, index) => {
    if (typeof node === "string") return <Fragment key={index}>{node}</Fragment>;
    const children = <RichText nodes={node.children} />;
    switch (node.tag) {
      case "p": return <p key={index}>{children}</p>;
      case "ul": return <ul key={index}>{children}</ul>;
      case "li": return <li key={index}>{children}</li>;
      case "strong": return <strong key={index}>{children}</strong>;
      case "br": return <br key={index} />;
      case "a": return <a key={index} href={node.href}>{children}</a>;
      default: return null;
    }
  });
}

export default function NoticePage({ notice }: { notice: NoticeData }) {
  const affiliate = notice.variant === "affiliate";
  const otherRoute = affiliate ? "/privacy-notice-non-affiliate" : "/privacy-notice-affiliate";
  const otherTitle = affiliate ? "Non-Affiliate Privacy Notice" : "Affiliate Privacy Notice";
  const contents = <ol>{notice.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}</ol>;

  return (
    <div className={`${sitePage} ${googleSansFlex.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/privacy-policy">Privacy Policy</Link><span aria-hidden="true">/</span><span aria-current="page">{notice.title}</span></nav>
          <header className={styles.hero} aria-labelledby="notice-title">
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}><span aria-hidden="true" />Legal &amp; policies</span>
              <h1 id="notice-title">{affiliate ? "Affiliate" : "Non-Affiliate"} <span>Privacy Notice</span></h1>
              <p>How your personal information is collected, protected, and shared.</p>
              <a className={styles.download} href={notice.pdf}>Printer-friendly version (PDF)<span aria-hidden="true">↓</span></a>
            </div>
            <div className={styles.heroPhoto} aria-hidden="true"><Image src="/legal/privacy-notices-document-review.webp" alt="" fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc(100vw - 64px), (max-width: 1440px) calc(100vw - 128px), 1312px" quality={90} preload /></div>
          </header>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <nav className={styles.contents} aria-label="On this page">
                <div className={styles.desktopContents}><h2>On this page</h2>{contents}</div>
                <details className={styles.mobileContents}><summary>On this page <span>{notice.sections.length} sections</span></summary>{contents}</details>
              </nav>
              <div className={styles.help}><h2>Privacy information</h2><Link href="/privacy-policy">Privacy Policy</Link><Link href={otherRoute}>{otherTitle}</Link><a href="tel:+18774697325">(877) 469-7325</a></div>
            </aside>
            <article className={`${styles.document} ${styles.notice}`} aria-label={notice.title}>
              {notice.sections.map((section, index) => (
                <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-heading`}>
                  <h2 id={`${section.id}-heading`}><span className={styles.sectionNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
                  {section.kind === "facts" ? <dl className={styles.facts}>{section.rows.map((row, rowIndex) => <div className={styles.fact} key={rowIndex}><dt>{row.label}</dt><dd><RichText nodes={row.content} /></dd></div>)}</dl> : null}
                  {section.kind === "sharing" ? <>
                    <p className={styles.tableHint} id="sharing-help">On smaller screens, scroll the table horizontally to read all columns.</p>
                    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Information sharing table" aria-describedby="sharing-help">
                      <table className={styles.sharing}>
                        <caption>{notice.title}: information sharing and your choices</caption>
                        <thead><tr>{section.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
                        <tbody>{section.rows.map((row, rowIndex) => <tr key={rowIndex}><th scope="row"><RichText nodes={row.reason} /></th><td>{row.shares}</td><td>{row.limit}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </> : null}
                  {section.kind === "paragraphs" ? section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}><RichText nodes={paragraph} /></p>) : null}
                </section>
              ))}
              <div className={styles.documentEnd}><a href={notice.pdf}>Download notice (PDF)</a><a href="#main-content">Back to top <span aria-hidden="true">↑</span></a></div>
            </article>
          </div>
        </div>
      </main>
      <div className={styles.siteFooter}><SiteFooter /></div>
    </div>
  );
}
