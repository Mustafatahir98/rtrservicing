"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PayoffQuote } from "@/lib/api/generated/model";
import { createDocumentLink, listPayoffQuotes, requestPayoffQuote } from "@/lib/api/generated/documents/documents";
import { borrowerMockMode } from "@/lib/mock-mode";
import { paymentToday, inputCents } from "@/lib/payment-types";
import { displayDate, money } from "@/lib/portal-format";
import { button, cn } from "./portal-ui";

function documentLinkExpired(expiresAt: string) {
  const expiry = Date.parse(expiresAt);
  return !Number.isFinite(expiry) || expiry <= Date.now();
}

export default function PayoffQuotes({ loanId }: { loanId: string }) {
  const [quotes, setQuotes] = useState<PayoffQuote[]>([]);
  const [date, setDate] = useState(paymentToday);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    listPayoffQuotes(loanId, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setQuotes(result.items);
    }).catch(() => { if (!controller.signal.aborted) setError("Payoff quotes are unavailable. Try again or contact Customer Solutions."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loanId]);
  async function requestQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || date < paymentToday()) return;
    busy.current = true; setPending(true); setError("");
    try {
      const quote = await requestPayoffQuote(loanId, { payoffDate: date });
      setQuotes(items => [quote, ...items.filter(item => item.quoteId !== quote.quoteId)]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The quote request could not be confirmed. Refresh the quote list before trying again."); }
    finally { busy.current = false; setPending(false); }
  }
  async function openQuote(quote: PayoffQuote) {
    if (busy.current || !quote.documentId || quote.status !== "READY" || quote.goodThroughDate < paymentToday()) return;
    const preview = window.open("about:blank", "_blank");
    if (!preview) { setError("Allow pop-ups to preview your payoff quote."); return; }
    preview.opener = null;
    busy.current = true; setPending(true); setError("");
    try {
      const link = await createDocumentLink(loanId, quote.documentId);
      if (documentLinkExpired(link.expiresAt)) throw new Error("This document link has expired. Open the quote again.");
      const response = await fetch(link.url);
      if (!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf")) throw new Error("The payoff PDF is unavailable. Please try again.");
      const url = URL.createObjectURL(await response.blob());
      if (preview.closed) URL.revokeObjectURL(url);
      else { preview.location.replace(url); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    } catch (failure) { preview.close(); setError(failure instanceof Error ? failure.message : "Could not open the payoff quote."); }
    finally { busy.current = false; setPending(false); }
  }
  const action = cn(button.base, button.outline, button.element, "tw:min-h-[58px] tw:max-w-full tw:px-6 tw:whitespace-normal tw:max-mobile:w-full tw:max-mobile:[&&]:min-h-[50px] tw:max-mobile:[&&]:px-4 tw:max-mobile:[&&]:py-2.5 tw:max-mobile:[&&]:text-[16px]");
  return <section className="tw:w-full tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:p-8 tw:max-mobile:p-5" aria-labelledby="payoff-quotes-title">
    <h2 id="payoff-quotes-title" className="tw:m-0 tw:text-[20px] tw:font-medium">Payoff Demand Quotes</h2>
    <p className="tw:mt-4 tw:mb-0 tw:text-[16px] tw:leading-relaxed">Request a payoff quote for the amount and exact good-through date. Your loan balance is not a payoff quote.</p>
    {borrowerMockMode ? <p className="tw:mt-4 tw:mb-0 tw:rounded-lg tw:bg-[#f2f7fa] tw:px-4 tw:py-3 tw:text-[14px] tw:leading-relaxed" role="note">Preview quote. Amounts are examples, not official payoff instructions, and cannot be used to settle a loan.</p> : null}
    <form onSubmit={event => void requestQuote(event)} className="tw:mt-7 tw:grid tw:grid-cols-[minmax(200px,260px)_minmax(0,1fr)] tw:items-end tw:gap-4 tw:max-[760px]:grid-cols-1">
      <label className="tw:flex tw:min-w-0 tw:flex-col tw:gap-2 tw:text-[14px] tw:leading-[1.4]">
        <span>Requested payoff date</span>
        <span className="tw:relative tw:flex tw:h-[58px] tw:w-full tw:min-w-0 tw:max-w-full tw:items-center tw:justify-between tw:gap-3 tw:overflow-hidden tw:rounded-lg tw:border tw:border-[#6b7c8e] tw:bg-white tw:px-4 tw:text-[16px] tw:has-[input:focus-visible]:outline-3 tw:has-[input:focus-visible]:outline-offset-3 tw:has-[input:focus-visible]:outline-[#00649e] tw:has-[input:disabled]:opacity-60 tw:max-mobile:h-[52px]">
          <span aria-hidden="true" className="tw:min-w-0 tw:truncate" data-payoff-date-display>{date ? displayDate(date, true) : "Choose a date"}</span>
          <svg aria-hidden="true" className="tw:size-5 tw:shrink-0 tw:fill-none tw:stroke-current tw:stroke-[1.7]" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4m8-4v4" /></svg>
          <input className="tw:absolute tw:inset-0 tw:h-full tw:w-full tw:min-w-0 tw:max-w-full tw:cursor-pointer tw:opacity-0" type="date" name="payoffDate" required min={paymentToday()} value={date} disabled={pending || loading} onChange={event => setDate(event.target.value)} />
        </span>
      </label>
      <div className="tw:flex tw:flex-wrap tw:items-end tw:gap-3 tw:max-[760px]:grid tw:max-[760px]:grid-cols-2 tw:max-mobile:grid-cols-1">
        <button className={action} disabled={pending || loading} type="submit">{pending ? "Please wait…" : "Request quote"}</button>
        <button className={action} disabled={pending || loading} type="button" onClick={() => { setLoading(true); setError(""); listPayoffQuotes(loanId).then(result => setQuotes(result.items)).catch(() => setError("Could not refresh quotes. Please try again.")).finally(() => setLoading(false)); }}>Refresh quotes</button>
      </div>
    </form>
    {error ? <p role="alert" className="tw:mt-5 tw:mb-0 tw:text-[#a52a20]">{error}</p> : null}
    {loading ? <p role="status" className="tw:mt-6 tw:mb-0">Loading payoff quotes…</p> : !quotes.length ? <p role="status" className="tw:mt-6 tw:mb-0 tw:text-(--pp-muted)">No payoff quotes have been requested for this loan.</p> : <ul className="tw:mt-6 tw:mb-0 tw:grid tw:list-none tw:gap-4 tw:p-0">{quotes.map(quote => {
      const expired = quote.status === "EXPIRED" || quote.goodThroughDate < paymentToday();
      const ready = !expired && quote.status === "READY" && (inputCents(quote.totalPayoffAmount) ?? 0) > 0 && Boolean(quote.documentId);
      return <li key={quote.quoteId} className="tw:min-w-0 tw:rounded-xl tw:border tw:border-(--pp-line) tw:p-5 tw:max-mobile:p-4">
        <h3 className="tw:text-[18px] tw:font-medium tw:max-mobile:text-[16px]">Payoff quote</h3>
        <p className="tw:mt-1 tw:wrap-anywhere tw:text-[12px] tw:leading-relaxed tw:text-(--pp-muted)">Reference: {quote.quoteId}</p>
        <dl className="tw:my-5 tw:grid tw:gap-4">{[["Status", expired ? "Expired — request a new quote" : ready ? "Ready" : "Awaiting quote details"], ["Good through", displayDate(quote.goodThroughDate, true)], ...(ready ? [[borrowerMockMode ? "Preview payoff amount" : "Payoff amount", money(quote.totalPayoffAmount)]] : [])].map(([label, value]) => <div key={label} className="tw:grid tw:min-w-0 tw:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw:gap-4 tw:max-mobile:grid-cols-1 tw:max-mobile:gap-1"><dt className="tw:text-[13px] tw:text-(--pp-muted)">{label}</dt><dd className="tw:m-0 tw:min-w-0 tw:break-words tw:text-[15px] tw:font-medium tw:max-mobile:text-[16px]">{value}</dd></div>)}</dl>
        {ready ? <button type="button" className={cn(action, "tw:w-full")} disabled={pending} onClick={() => void openQuote(quote)}>Preview payoff PDF</button> : null}
      </li>;
    })}</ul>}
    <Link className="tw:mt-7 tw:inline-block tw:underline" href="/contact#message">Contact Customer Solutions</Link>
  </section>;
}
