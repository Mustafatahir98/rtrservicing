"use client";
import { handleDialogKeyDown } from "./payment-ui";
import Link from "next/link";
import { button, cn, pageHeading, pageIntro, pageTitle, segment, segmented, textButton } from "./portal-ui";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { PortalPayment } from "@/lib/portal-data";
import { bankAccountLabel, paymentActorLabel, displayDate, money, portalHref } from "@/lib/portal-format";
import { matchesPaymentSearch } from "@/lib/payment-search";

const statusColor: Record<string, string> = {
  posted: "tw:bg-[#237a36]",
  processing: "tw:bg-[#006da5]",
  failed: "tw:bg-[#b44343]",
  returned: "tw:bg-[#b44343]",
};
const tableHead = "tw:bg-[#f3f3f3] tw:px-2 tw:py-4 tw:text-[11px] tw:font-medium tw:first:rounded-l-[10px] tw:last:rounded-r-[10px]";
const tableCell = "tw:h-[66px] tw:px-[9px] tw:py-5 tw:first:relative tw:first:rounded-l-[10px] tw:last:rounded-r-[10px]";
const mutedCell = "tw:text-[11px] tw:text-(--pp-muted)";
// Dashed timeline segment from each row's dot to the next row's dot.
const timelineSegment = "tw:before:absolute tw:before:top-1/2 tw:before:left-[-22px] tw:before:h-[calc(100%_+_14px)] tw:before:[border-left:1px_dashed_#bfc4c8]";
const receiptBox = "tw:mb-3.5 tw:rounded-2xl tw:bg-[#f8f8f8] tw:px-[18px] tw:py-5 tw:text-[13px] tw:last:mb-0 tw:max-compact:text-[14px] tw:max-mobile:px-3 tw:max-mobile:py-4 tw:max-mobile:text-[12px]";
const receiptBoxTitle = "tw:border-b tw:border-b-[#cfd2d5] tw:pb-3.5 tw:text-[13px] tw:font-medium";
const receiptList = "tw:mt-4 tw:mb-0";
const receiptRow = "tw:flex tw:items-center tw:justify-between tw:gap-3.5 tw:py-[5px] tw:max-mobile:gap-3";
const receiptLabel = "tw:shrink-0 tw:text-[#62738d]";
const receiptValue = "tw:m-0 tw:text-right tw:font-medium tw:wrap-anywhere";
const receiptTotalRow = "tw:mt-[18px] tw:border-t tw:border-t-[#cfd2d5] tw:pt-6";
const receiptTotalLabel = "tw:shrink-0 tw:font-semibold tw:text-[#182131]";

function Status({ value, className }: { value: string; className?: string }) {
  return <span className={cn("tw:inline-block tw:rounded-[18px] tw:bg-[#52657e] tw:px-[13px] tw:py-[3px] tw:text-[14px] tw:leading-[1.4] tw:font-semibold tw:text-white", statusColor[value], className)}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>;
}
const csvCell = (value: string) => `"${(/^[\s]*[=+\-@]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;

export function PaymentHistoryHeading({ loanId, intro }: { loanId: string; intro: string }) {
  return <div className={pageHeading}>
    <div><h1 className={pageTitle}>Payment History</h1><p className={pageIntro}>{intro}</p></div>
    <Link className={cn(button.base, button.primary, "tw:min-w-[236px] tw:max-compact:min-w-0 tw:max-compact:text-[16px] tw:max-mobile:mt-6 tw:max-mobile:w-full")} href={portalHref("/dashboard/payments", loanId)}>Make a Payment</Link>
  </div>;
}

export default function PaymentHistory({ payments, loanId, viewerName, loadPayment, exportPaymentCsv }: { payments: PortalPayment[]; loanId: string; viewerName: string; loadPayment?: (id: string) => Promise<PortalPayment>; exportPaymentCsv?: (status: string, query: string) => Promise<string> }) {
  const params = useSearchParams();
  const router = useRouter();
  const active = ["posted", "processing"].includes(params.get("status") ?? "") ? params.get("status")! : "all";
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [selectedId, setSelectedId] = useState<string>();
  const receiptDialog = useRef<HTMLDialogElement>(null);
  const receiptTrigger = useRef<HTMLElement | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const syncFromHistory = () => setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);
  function changeQuery(value: string) {
    setQuery(value);
    window.history.replaceState(null, "", portalHref("/dashboard/payment-history", loanId, { ...(active === "all" ? {} : { status: active }), ...(value ? { q: value } : {}) }));
  }
  const visible = useMemo(() => payments.filter(payment => {
    return (active === "all" || payment.status === active) && matchesPaymentSearch(payment.confirmation_number, payment.process_date, query, { amount: payment.amount, initiator: payment.initiated_by, viewerName });
  }), [payments, active, query, viewerName]);
  const [receipt, setReceipt] = useState<PortalPayment>();
  const [receiptError, setReceiptError] = useState("");
  const [receiptPending, setReceiptPending] = useState(false);
  const selected = selectedId ? receipt?.id === selectedId ? receipt : payments.find(payment => payment.id === selectedId) : undefined;
  async function openReceipt(id: string) {
    receiptTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setReceiptError(""); setReceiptPending(true);
    try { if (loadPayment) setReceipt(await loadPayment(id)); setSelectedId(id); }
    catch (error) { setReceiptError(error instanceof Error ? error.message : "Could not load the receipt."); }
    finally { setReceiptPending(false); }
  }
  useEffect(() => {
    const dialog = receiptDialog.current;
    if (!selectedId || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedId]);
  async function exportCsv() {
    try {
    const rows = [["Payment Date", "Amount", "Status", "Confirmation number", "Initiated by"], ...visible.map(payment => [payment.process_date, payment.amount, payment.status, payment.confirmation_number, paymentActorLabel(payment.initiated_by, viewerName)])];
    const url = URL.createObjectURL(new Blob([exportPaymentCsv ? await exportPaymentCsv(active, query) : rows.map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `payment-history-${loanId}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${visible.length} ${visible.length === 1 ? "payment" : "payments"}.`);
    } catch (error) { setReceiptError(error instanceof Error ? error.message : "Could not export payments."); }
  }
  return <>
    <div className="tw:mb-2.5 tw:flex tw:items-center tw:justify-between tw:gap-5 tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:px-4 tw:py-[18px] tw:max-compact:flex-wrap tw:max-mobile:mb-6 tw:max-mobile:min-w-0 tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-mobile:gap-4 tw:max-mobile:p-4 tw:print:hidden">
      <label className="tw:flex tw:min-h-[60px] tw:w-[380px] tw:max-w-full tw:items-center tw:gap-[7px] tw:rounded-xl tw:border tw:border-[#7a91b1] tw:px-[22px] tw:py-3 tw:max-compact:w-[340px] tw:max-mobile:h-[52px] tw:max-mobile:min-h-[52px] tw:max-mobile:w-full tw:max-mobile:min-w-0 tw:max-mobile:gap-2.5 tw:max-mobile:px-3.5 tw:max-mobile:py-0">
        <svg className="tw:size-5 tw:shrink-0 tw:fill-none tw:stroke-[#7a91b1] tw:stroke-[1.2]" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5.5" /><path d="m12 12 5 5" /></svg>
        <input className="tw:w-full tw:min-w-0 tw:border-none tw:bg-transparent tw:text-[14px] tw:text-(--pp-ink) tw:placeholder:text-[#4e6586] tw:max-mobile:h-12 tw:max-mobile:p-0 tw:max-mobile:text-[16px]" type="search" placeholder="Search payments" aria-describedby="payment-search-help" aria-label="Search payment history" maxLength={40} value={query} onChange={event => changeQuery(event.target.value)} />
      </label>
            <div className="tw:flex tw:items-center tw:gap-2.5 tw:max-compact:ml-auto tw:max-mobile:m-0 tw:max-mobile:w-full tw:max-mobile:flex-col tw:max-mobile:items-stretch tw:max-mobile:gap-3">
        <div className={cn(segmented, "tw:max-mobile:w-full tw:max-mobile:min-w-0 tw:max-mobile:rounded-[10px] tw:max-mobile:p-1")} role="group" aria-label="Filter payments">{["all", "posted", "processing"].map(status => <button key={status} aria-pressed={active === status} className={cn(segment(active === status), "tw:max-mobile:min-h-11 tw:max-mobile:min-w-0 tw:max-mobile:rounded-lg tw:max-mobile:px-2 tw:max-mobile:py-2.5 tw:max-mobile:text-[14px] tw:max-mobile:whitespace-nowrap")} onClick={() => router.push(portalHref("/dashboard/payment-history", loanId, { ...(status === "all" ? {} : { status }), ...(query.trim() ? { q: query.trim() } : {}) }), { scroll: false })}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>)}</div>
        <button className={cn(button.base, button.outline, button.element, "tw:max-compact:px-[30px] tw:max-mobile:min-h-12 tw:max-mobile:w-full tw:max-mobile:px-4 tw:max-mobile:py-2.5 tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.4] tw:max-mobile:whitespace-nowrap")} onClick={exportCsv}>Export CSV</button>
      </div>
    </div>
    <p id="payment-search-help" className="tw:mb-4 tw:text-[14px] tw:text-(--pp-muted)">Search by confirmation number, date, amount or the payer shown in the list.</p>
    <p className="tw:sr-only" role="status">{notice || `${visible.length} payments found.`}</p>
    {receiptError ? <p role="alert">{receiptError}</p> : null}
    {receiptPending ? <p role="status">Loading receipt…</p> : null}
    {visible.length ? (
      <div className="tw:grid tw:grid-cols-[minmax(0,1fr)] tw:gap-2.5 tw:max-compact:grid-cols-[1fr] tw:max-compact:gap-4 tw:max-mobile:block tw:print:block">
        <section className="tw:min-h-[850px] tw:min-w-0 tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:py-8 tw:pr-[22px] tw:pl-[42px] tw:max-compact:min-h-0 tw:max-mobile:border-0 tw:max-mobile:bg-transparent tw:max-mobile:p-0 tw:print:hidden" aria-label="Payments">
          <div className="tw:hidden tw:max-mobile:flex tw:max-mobile:flex-col tw:max-mobile:gap-4">
            {visible.map(payment => (
              <article className="tw:min-w-0 tw:rounded-2xl tw:border tw:border-[#d8dcdf] tw:bg-white tw:p-5" key={payment.id}>
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                  <div>
                    <p className="tw:m-0 tw:text-[14px] tw:text-[#64778a]">{displayDate(payment.process_date)}</p>
                    <h2 className="tw:mt-2 tw:mb-0 tw:text-[28px] tw:leading-[1.2] tw:tracking-[-0.5px] tw:text-[#006da5]">{money(payment.amount)}</h2>
                  </div>
                  <Status value={payment.status} className="tw:shrink-0 tw:px-2.5 tw:py-1.5 tw:text-[12px] tw:leading-[1.4]" />
                </div>
                <dl className="tw:my-5 tw:grid tw:gap-4 tw:border-t tw:border-t-[#e8ecef] tw:pt-5">
                  <div className="tw:flex tw:flex-col tw:gap-1"><dt className="tw:text-[12px] tw:text-[#64778a]">Confirmation number</dt><dd className="tw:m-0 tw:text-[14px] tw:break-words tw:text-[#233e50]">{payment.confirmation_number}</dd></div>
                  <div className="tw:flex tw:flex-col tw:gap-1"><dt className="tw:text-[12px] tw:text-[#64778a]">Initiated by</dt><dd className="tw:m-0 tw:text-[14px] tw:break-words tw:text-[#233e50]">{paymentActorLabel(payment.initiated_by, viewerName)}</dd></div>
                </dl>
                <button className={cn(button.base, button.outline, button.element, "tw:flex tw:w-full tw:justify-between tw:max-mobile:min-h-12 tw:max-mobile:px-4 tw:max-mobile:py-2.5 tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.4]")} aria-label={`View receipt ${payment.confirmation_number}`} aria-haspopup="dialog" disabled={receiptPending} onClick={() => void openReceipt(payment.id)}>View Receipt<span aria-hidden="true"> →</span></button>
              </article>
            ))}
          </div>
          <div className="tw:-ml-10 tw:overflow-x-auto tw:pl-10 tw:max-mobile:hidden">
            <table className="tw:w-full tw:border-separate tw:border-spacing-x-0 tw:border-spacing-y-3.5 tw:text-center tw:text-[13px] tw:whitespace-nowrap">
              <thead>
                <tr><th className={tableHead}>Payment Date</th><th className={tableHead}>Amount</th><th className={tableHead}>Status</th><th className={tableHead}>Confirmation number</th><th className={tableHead}>Initiated by</th><th className={tableHead}>Action</th></tr>
              </thead>
              <tbody>
                {visible.map((payment, index) => {
                  const isSelected = selectedId === payment.id;
                  const cell = cn(tableCell, isSelected ? "tw:bg-[#eaf4ff]" : "tw:bg-[#f7f8f9]");
                  return (
                    <tr key={payment.id} className="tw:cursor-default">
                      <td className={cn(cell, index < visible.length - 1 && timelineSegment)}>
                        <span className={cn("tw:absolute tw:top-[calc(50%_-_5px)] tw:left-[-27px] tw:size-2.5 tw:rounded-full", isSelected ? "tw:bg-[#0aa9ff] tw:shadow-[0_0_0_5px_#d8f2ff]" : "tw:bg-[#bfc4c8]")} />{displayDate(payment.process_date)}
                      </td>
                      <td className={cn(cell, "tw:font-medium tw:text-[#00649e]")}>{money(payment.amount)}</td>
                      <td className={cell}><Status value={payment.status} /></td>
                      <td className={cn(cell, mutedCell)}>{payment.confirmation_number}</td>
                      <td className={cn(cell, mutedCell)}>{paymentActorLabel(payment.initiated_by, viewerName)}</td>
                      <td className={cell}>
                        <button className="tw:rounded-[4px] tw:border-none tw:bg-[#0075ad] tw:px-2.5 tw:py-1 tw:text-[10px] tw:text-white" aria-label={`View receipt ${payment.confirmation_number}`} aria-haspopup="dialog" disabled={receiptPending} onClick={() => void openReceipt(payment.id)}>View Receipt</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ) : (
      <section className="tw:mt-10 tw:max-mobile:mt-5 tw:max-mobile:p-6">
        <div className="tw:mb-4 tw:grid tw:grid-cols-[repeat(6,1fr)] tw:gap-3 tw:rounded-[15px] tw:border tw:border-(--pp-line) tw:bg-white tw:p-3.5 tw:text-center tw:text-[14px] tw:max-mobile:hidden">
          <span>Payment Date</span><span>Amount</span><span>Status</span><span>Confirmation #</span><span>Initiated by</span><span>Actions</span>
        </div>
        <div className="tw:flex tw:min-h-[174px] tw:flex-col tw:items-center tw:justify-center tw:gap-2.5 tw:rounded-2xl tw:border-2 tw:border-[#0caaff] tw:bg-white tw:text-[14px] tw:text-[#8193af] tw:max-mobile:min-h-[160px] tw:max-mobile:p-0 tw:max-mobile:text-center tw:max-mobile:text-[12px]">
          <p className="tw:max-mobile:text-[16px] tw:max-mobile:leading-[1.5]">No payments match your search or filter.</p>
          {query ? <button className={textButton} onClick={() => changeQuery("")}>Clear search</button> : null}
        </div>
      </section>
    )}
    {selected ? (
      <dialog onKeyDown={handleDialogKeyDown} ref={receiptDialog} className="tw:fixed tw:inset-y-0 tw:right-0 tw:left-auto tw:m-0 tw:h-dvh tw:max-h-full tw:w-[min(560px,100%)] tw:max-w-full tw:overflow-y-auto tw:border-0 tw:border-l tw:border-l-(--pp-line) tw:bg-[#f7f9fa] tw:p-5 tw:text-(--pp-ink) tw:shadow-[-12px_0_48px_#102a4326] tw:open:animate-[pp-receipt-slide-in_240ms_ease-out] tw:backdrop:bg-[#102a4366] tw:max-mobile:p-3 tw:motion-reduce:open:animate-none tw:print:open:static tw:print:open:h-auto tw:print:open:max-h-none tw:print:open:w-full tw:print:open:max-w-none tw:print:open:overflow-visible tw:print:open:border-0 tw:print:open:p-0 tw:print:open:shadow-none tw:print:open:animate-none tw:print:backdrop:bg-transparent" aria-labelledby="payment-receipt-title" onClose={() => { setSelectedId(undefined); requestAnimationFrame(() => { const trigger = receiptTrigger.current; if (trigger?.isConnected && trigger.checkVisibility()) trigger.focus(); }); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close(); } }}>
        <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:print:hidden">
          <h2 className="tw:m-0 tw:text-[20px] tw:font-medium" id="payment-receipt-title">Payment receipt</h2>
          <button type="button" className="tw:grid tw:size-11 tw:place-items-center tw:rounded-[10px] tw:border tw:border-(--pp-line) tw:bg-white tw:text-inherit" aria-label="Close receipt" onClick={() => receiptDialog.current?.close()} autoFocus><span aria-hidden="true">×</span></button>
        </div>
        <div className="tw:rounded-2xl tw:border-2 tw:border-[#0caaff] tw:bg-white tw:px-2.5 tw:pt-[22px] tw:pb-2.5 tw:max-compact:max-w-none tw:print:w-full tw:print:border-[#aaa]">
          <div className="tw:flex tw:justify-between tw:gap-[18px] tw:px-4 tw:pt-3 tw:pb-[26px] tw:max-mobile:gap-2.5 tw:max-mobile:px-2.5">
            <div>
              <div className="tw:mb-3 tw:flex tw:items-center tw:gap-4 tw:max-mobile:gap-2">
                <strong className="tw:text-[18px] tw:font-medium tw:max-mobile:text-[16px]">{displayDate(selected.process_date)}</strong>
                <Status value={selected.status} />
              </div>
              <small className="tw:block tw:text-[11px] tw:text-(--pp-muted) tw:max-mobile:text-[10px]">{selected.confirmation_number}</small>
            </div>
            <div className="tw:text-right">
              <strong className="tw:mb-[7px] tw:block tw:text-[26px] tw:font-medium tw:text-[#0076b9] tw:max-mobile:text-[22px]">{money(selected.amount)}</strong>
              <small className="tw:block tw:text-[11px] tw:text-(--pp-muted) tw:max-mobile:text-[10px]">{paymentActorLabel(selected.initiated_by, viewerName)}</small>
            </div>
          </div>
          <section className={receiptBox}>
            <h2 className={receiptBoxTitle}>Payment Allocation</h2>
            {selected.allocation_pending ? <p>Allocation will be available after the payment posts.</p> : (
              <dl className={receiptList}>
                {[["Principal", selected.principal_amount], ["Interest", selected.interest_amount], ["Escrow (taxes & insurance)", selected.escrow_amount], ["Fees", selected.fees_amount], ["Additional principal", selected.additional_principal_amount]].map(([label, value]) => <div className={receiptRow} key={label}><dt className={receiptLabel}>{label}</dt><dd className={receiptValue}>{money(value)}</dd></div>)}
                <div className={cn(receiptRow, receiptTotalRow)}><dt className={receiptTotalLabel}>Total applied</dt><dd className={receiptValue}>{money(selected.amount)}</dd></div>
              </dl>
            )}
            {selected.return_reason ? <p role="status">Returned payment: {selected.return_reason}</p> : null}
          </section>
          <section className={receiptBox}>
            <h2 className={receiptBoxTitle}>Transaction Details</h2>
            <dl className={receiptList}>
              <div className={receiptRow}><dt className={receiptLabel}>Confirmation #</dt><dd className={receiptValue}>{selected.confirmation_number}</dd></div>
              <div className={receiptRow}><dt className={receiptLabel}>Posted date</dt><dd className={receiptValue}>{selected.posted_at ? displayDate(selected.posted_at) : "Pending"}</dd></div>
              <div className={receiptRow}><dt className={receiptLabel}>Applied to</dt><dd className={receiptValue}><span className="tw:inline-block tw:rounded-[20px] tw:bg-[#d9eeff] tw:px-3.5 tw:py-0.5 tw:text-[11px] tw:text-[#006ca9] tw:max-mobile:px-2 tw:max-mobile:text-[10px]">{selected.applied_to ?? "Account payment"}</span></dd></div>
              <div className={receiptRow}><dt className={receiptLabel}>Initiated by</dt><dd className={receiptValue}>{paymentActorLabel(selected.initiated_by, viewerName)}</dd></div>
              <div className={cn(receiptRow, receiptTotalRow)}><dt className={receiptTotalLabel}>Paid from</dt><dd className={receiptValue}>{bankAccountLabel(selected.bank_name, selected.account_last4)}</dd></div>
            </dl>
            <button className={cn(button.base, button.outline, "tw:mt-4 tw:w-full tw:text-[18px] tw:leading-[1.5] tw:font-normal tw:max-compact:text-[18px] tw:print:hidden")} onClick={() => window.print()}>Print Receipt</button>
          </section>
        </div>
      </dialog>
    ) : null}
  </>;
}
