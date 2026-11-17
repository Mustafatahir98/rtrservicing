import { displayDate, paymentActorLabel } from "./portal-format";

const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const normalize = (value: string) => value.normalize("NFKC").trim().toLowerCase().replace(/[\s,./_-]+/g, "");

/** Shared by the visible history, mock list API and CSV export. */
export function matchesPaymentSearch(confirmation: string, date: string, query: string, details?: { amount: string; initiator: string | null; viewerName?: string }): boolean {
  if (!query.trim()) return true;
  const term = normalize(query);
  if (!term) return false;
  if (normalize(confirmation).includes(term)) return true;
  if (details) {
    // Search only the displayed name or role, never an undisplayed co-borrower name.
    if (normalize(paymentActorLabel(details.initiator, details.viewerName)).includes(term)) return true;
    const amountQuery = query.normalize("NFKC").trim();
    if (/^\$?[\d,\s]+(?:\.\d{0,2})?$/.test(amountQuery) && details.amount.includes(amountQuery.replace(/[$,\s]/g, ""))) return true;
  }
  const iso = date.slice(0, 10);
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) return normalize(date).includes(term);
  const [year, month, day] = iso.split("-");
  const numericDay = Number(day), numericMonth = Number(month);
  const short = shortMonth.format(parsed), long = longMonth.format(parsed);
  return [iso, displayDate(parsed), displayDate(parsed, true), `${numericDay} ${short} ${year}`, `${day} ${short} ${year}`, `${numericDay} ${long} ${year}`, `${short} ${year}`, `${long} ${year}`, `${month}/${day}/${year}`, `${numericMonth}/${numericDay}/${year}`]
    .some(value => normalize(value).includes(term));
}
