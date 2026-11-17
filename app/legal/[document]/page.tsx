import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { googleSansFlex } from "@/app/fonts";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { sitePage, siteShell, siteButton } from "@/components/site-ui";
import { publicLegalPages, publicSiteInfo } from "@/lib/public-site-info";

function legalPage(value: string) {
  return Object.prototype.hasOwnProperty.call(publicLegalPages, value) ? publicLegalPages[value as keyof typeof publicLegalPages] : null;
}
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(publicLegalPages).map(document => ({ document })); }
export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> {
  const page = legalPage((await params).document);
  return { title: `${page?.title ?? "Not found"} | RTR Servicing`, robots: { index: false, follow: true } };
}
export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  if (document === "terms") redirect("/terms-of-use");
  if (document === "privacy") redirect("/privacy-policy");
  const page = legalPage(document);
  if (!page) notFound();
  return <div className={`${sitePage} ${googleSansFlex.variable}`}><SiteHeader /><main id="main-content" tabIndex={-1} className={`${siteShell} tw:py-16 tw:max-site-mobile:py-8`}>
    <Link href="/" className="tw:text-site-blue tw:underline">Back to home</Link>
    <h1 className="tw:mt-6 tw:text-[40px] tw:font-medium tw:leading-tight tw:max-site-mobile:text-[30px]">{page.title}</h1>
    <section className="tw:mt-6 tw:max-w-[850px] tw:rounded-2xl tw:border tw:border-site-line tw:bg-white tw:p-8 tw:max-site-mobile:p-5">
      <p className="tw:text-[17px] tw:leading-relaxed">{page.description}</p>
      <p className="tw:mt-5 tw:rounded-xl tw:bg-site-blue-soft tw:p-4 tw:text-[15px] tw:leading-relaxed">Portal-specific legal publication and applicability are pending RTR approval. The reference below is an existing external source; it is not a newly approved portal policy.</p>
      <a href={page.reference} className="tw:mt-6 tw:inline-block tw:text-site-blue tw:underline">{page.referenceLabel} (external website)</a>
      <div className="tw:mt-8 tw:flex tw:flex-wrap tw:gap-4"><Link className={siteButton("blue")} href="/contact">Contact Customer Solutions</Link><a className={siteButton("outline")} href={publicSiteInfo.phone.href}>Call {publicSiteInfo.phone.label}</a></div>
    </section>
  </main><SiteFooter /></div>;
}
