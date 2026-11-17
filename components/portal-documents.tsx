"use client";

import Link from "next/link";
import PayoffQuotes from "./payoff-quotes";
import type { MouseEvent, ReactNode } from "react";
import { createDocumentLink } from "@/lib/api/generated/documents/documents";
import PortalBackBar from "@/components/portal-back-bar";
import { MobileSectionSelect } from "./portal-mobile-controls";
import { cn, page, pageHeading, pageIntro, pageTitle, segment, segmented, textButton } from "./portal-ui";
import { displayDate, portalHref } from "@/lib/portal-format";
import type { PortalLoan } from "@/lib/portal-data";
import type { PortalDocument } from "@/lib/borrower-types";

const tabs = [["statements", "Statements & Taxes"], ["insurance", "Evidence of Insurance"], ["payoff", "Payoff Demand Quotes"]];
const panel = "tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-10 tw:pt-[50px] tw:pb-10 tw:compact:max-[1301px]:px-7 tw:max-compact:p-8";
const card = "tw:rounded-[14px] tw:border tw:border-[#bfc3c7] tw:bg-white";
const meta = "tw:flex tw:items-center tw:gap-3 tw:max-[1301px]:gap-2 tw:max-compact:flex-wrap";
const cardTitle = "tw:mb-[3px] tw:text-[16px] tw:font-medium tw:whitespace-nowrap tw:max-[1301px]:text-[14px]";
const cardDetail = "tw:text-[12px] tw:text-[#4e6586] tw:max-compact:text-[11px]";
const pdf = "tw:inline-flex tw:w-full tw:min-h-[46px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-[11px] tw:border tw:border-[#758ab2] tw:bg-white tw:p-2.5 tw:text-[16px] tw:leading-[1.25] tw:font-medium tw:whitespace-nowrap tw:text-(--pp-ink) tw:[transition:background_.15s,border-color_.15s] tw:hover:bg-[#f0f8fc] tw:max-mobile:rounded-[10px] tw:max-mobile:text-center tw:max-mobile:leading-[1.4] tw:max-mobile:whitespace-normal";
const pdfHref = (id: string, action: "preview" | "download") => `/api/portal/documents/${id}?${action === "preview" ? "preview" : "download"}=1`;

async function openDocument(event: MouseEvent<HTMLAnchorElement>, document: PortalDocument, loanId: string, action: "preview" | "download") {
  event.preventDefault();
  // Open during the link activation; opening after the API request can be blocked.
  const preview = action === "preview" ? window.open("about:blank", "_blank") : null;
  if (action === "preview" && !preview) { window.alert("Allow pop-ups for this portal to preview the document."); return; }
  if (preview) preview.opener = null;
  try {
    const link = await createDocumentLink(loanId, document.id);
    const response = await fetch(link.url);
    if (!response.ok) throw new Error("The document link expired. Please open it again.");
    const url = URL.createObjectURL(await response.blob());
    if (preview) {
      if (preview.closed) { URL.revokeObjectURL(url); return; }
      preview.location.replace(url);
    } else {
      const download = window.document.createElement("a"); download.href = url; download.download = document.title + ".pdf"; download.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) { preview?.close(); window.alert(error instanceof Error ? error.message : "Could not open the document."); }
}

function FileIcon({ green = false }: { green?: boolean }) {
  return <span className={cn("tw:grid tw:h-10 tw:w-[38px] tw:flex-[0_0_38px] tw:place-items-center tw:rounded-[12px] tw:border tw:border-[#8196ba] tw:max-mobile:w-8 tw:max-mobile:basis-[30px] tw:max-mobile:rounded-[9px]", green ? "tw:text-[#20a770]" : "tw:text-[#007fbd]")}><svg className="tw:size-[23px] tw:fill-none tw:stroke-current tw:stroke-[1.2] tw:[stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v5h4M10 12h5m-5 4h5" /></svg></span>;
}

function PanelHeading({ id, label, title, badge }: { id: string; label: string; title: ReactNode; badge: string }) {
  return <div className="tw:mb-8 tw:flex tw:min-h-24 tw:items-center tw:justify-between tw:gap-[18px] tw:border-b tw:border-b-[#c6cbd0] tw:pb-8 tw:compact:max-[1301px]:flex-wrap tw:max-mobile:mb-6 tw:max-mobile:min-h-0 tw:max-mobile:flex-col tw:max-mobile:flex-wrap tw:max-mobile:items-start tw:max-mobile:gap-4 tw:max-mobile:pb-6">
    <div><p className="tw:mb-[7px] tw:text-[16px] tw:text-(--pp-muted) tw:max-mobile:text-[13px]">{label}</p><h2 className="tw:text-[20px] tw:leading-[1.5] tw:font-medium tw:max-mobile:leading-[1.3]" id={id}>{title}</h2></div>
    <span className="tw:rounded-[10px] tw:bg-(--pp-blue) tw:px-[18px] tw:py-1 tw:text-[16px] tw:leading-[1.5] tw:whitespace-nowrap tw:text-white tw:max-mobile:px-3 tw:max-mobile:text-[12px]">{badge}</span>
  </div>;
}

export default function PortalDocuments({ loan, documents, tab }: { loan: PortalLoan; documents: PortalDocument[]; tab: string }) {
  const statements = documents.filter(document => document.document_type === "statement").slice(0, 24);
  const taxes = documents.filter(document => document.document_type === "form_1098");
  return <main className={cn(page, tab !== "statements" && "tw:pb-[150px]")}>
    <PortalBackBar loanId={loan.rtr_loan_id} accountNumber={loan.account_number} />
    <div className={cn(pageHeading, "tw:max-compact:flex-col tw:max-compact:items-start tw:max-compact:gap-6")}>
      <div><h1 className={pageTitle}>Documents &amp; Statements</h1><p className={pageIntro}>Access your billing archive, submit required insurance policy<br className="tw:max-mobile:hidden" /> evidence, and request payoff information.</p></div>
      <nav className={cn(segmented, "tw:shrink-0 tw:max-mobile:hidden")} aria-label="Document categories">{tabs.map(([value, label]) => <Link key={value} className={cn(segment(tab === value), "tw:px-[26px] tw:py-4 tw:compact:max-[1301px]:px-4 tw:compact:max-[1301px]:text-[14px]")} aria-current={tab === value ? "page" : undefined} href={portalHref("/dashboard/documents", loan.rtr_loan_id, { tab: value })}>{label}</Link>)}</nav>
      <MobileSectionSelect label="Document category" value={tab} choices={tabs.map(([value, label]) => ({ value, label, href: portalHref("/dashboard/documents", loan.rtr_loan_id, { tab: value }) }))} />
    </div>
    {tab === "statements" ? <div className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-6 tw:max-compact:grid-cols-[1fr] tw:max-mobile:grid-cols-1">
      <section className={panel} aria-labelledby="documents-statements-title">
        <PanelHeading id="documents-statements-title" label="Electronic Archive" title="Monthly Billing Statements" badge={`${statements.length} ${statements.length === 1 ? "Statement" : "Statements"} Available`} />
        <div className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-x-5 tw:gap-y-6 tw:max-compact:grid-cols-[repeat(3,1fr)] tw:max-compact:gap-4 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-3">{statements.map(document => <article className={cn(card, "tw:px-3.5 tw:pt-5 tw:pb-4 tw:max-compact:px-3 tw:max-mobile:p-3")} key={document.id}>
          <div className={cn(meta, "tw:mb-5 tw:max-mobile:mb-3.5 tw:max-mobile:min-w-0 tw:max-mobile:flex-1 tw:max-mobile:gap-2.5")}><FileIcon /><div className="tw:max-mobile:min-w-0"><h3 className={cardTitle}>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(document.document_date))}</h3><p className={cardDetail}>{displayDate(document.document_date)}{document.file_size_bytes ? ` · ${Math.ceil(document.file_size_bytes / 1024)} KB` : ""}</p></div>
            <a className="tw:ml-auto tw:grid tw:size-9 tw:flex-[0_0_36px] tw:place-items-center tw:rounded-full tw:bg-(--pp-blue) tw:text-white tw:max-[1301px]:size-7 tw:max-[1301px]:basis-7" href={pdfHref(document.id, "preview")} onClick={event => void openDocument(event, document, loan.rtr_loan_id, "preview")} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${document.title}`}><svg className="tw:size-[19px] tw:fill-none tw:stroke-current tw:stroke-[1.2]" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2" /></svg></a>
          </div>
          <a className={cn(pdf, "tw:max-mobile:m-0 tw:max-mobile:h-11 tw:max-mobile:min-h-11 tw:max-mobile:w-full tw:max-mobile:p-2 tw:max-mobile:text-[14px] tw:max-mobile:leading-[1.4]")} href={pdfHref(document.id, "download")} onClick={event => void openDocument(event, document, loan.rtr_loan_id, "download")} download>PDF</a>
        </article>)}</div>
        {!statements.length ? <p className="tw:text-(--pp-muted)">No statements available for this loan.</p> : null}
      </section>
      <section className={panel} aria-labelledby="documents-tax-title">
        <PanelHeading id="documents-tax-title" label="IRS Tax Reporting" title={<>Form 1098 Mortgage Interest<br /> Statements</>} badge="Published Annually by Jan 31" />
        <div className="tw:grid tw:gap-7 tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4">{taxes.map(document => <article className={cn(card, "tw:px-[18px] tw:pt-5 tw:pb-[18px] tw:max-mobile:p-5")} key={document.id}>
          <div className={cn(meta, "tw:mb-[22px] tw:max-mobile:flex-nowrap")}><FileIcon green /><div><h3 className={cn(cardTitle, "tw:max-mobile:text-[16px]")}>Tax Year {document.tax_year ?? new Date(document.document_date).getUTCFullYear()}</h3><p className={cn(cardDetail, "tw:max-mobile:text-[12px]")}>IRS Form 1098 Mortgage Interest Statement</p></div></div>
          <a className={cn(pdf, "tw:mb-3")} href={pdfHref(document.id, "preview")} onClick={event => void openDocument(event, document, loan.rtr_loan_id, "preview")} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${document.title}`}>Preview PDF</a>
          <a className={cn(pdf, "tw:max-mobile:min-h-12 tw:max-mobile:px-5 tw:max-mobile:py-3.5")} href={pdfHref(document.id, "download")} onClick={event => void openDocument(event, document, loan.rtr_loan_id, "download")} download>PDF</a>
        </article>)}</div>
        {!taxes.length ? <p className="tw:text-(--pp-muted)">No tax statements available for this loan.</p> : null}
      </section>
    </div> : tab === "payoff" ? <PayoffQuotes key={loan.rtr_loan_id} loanId={loan.rtr_loan_id} /> : <section className="tw:flex tw:min-h-[230px] tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-6 tw:py-12 tw:text-center tw:max-mobile:min-h-[210px] tw:max-mobile:p-8">
      <h2 className="tw:text-[20px] tw:font-medium">{tab === "insurance" ? "Evidence of Insurance" : "Payoff Demand Quotes"}</h2>
      <p className="tw:max-w-[620px] tw:text-[16px] tw:leading-[1.6] tw:text-(--pp-muted)">{tab === "insurance" ? "Your insurance documents will appear here." : "Contact Customer Solutions to request an official payoff quote with the amount and exact good-through date. Your loan balance is not a payoff quote."}</p>
      {tab === "payoff" ? <Link className={cn(textButton, "tw:mt-[18px]")} href="/contact#message">Contact Customer Solutions</Link> : null}
    </section>}
  </main>;
}
