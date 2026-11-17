export function money(value: string | number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
}
export function displayDate(value: string | Date | null | undefined, long = false) {
  return value ? new Intl.DateTimeFormat("en-US", { month: long ? "long" : "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "—";
}
export function portalHref(path: string, loanId: string, params: Record<string, string> = {}) {
  return `${path}?${new URLSearchParams({ loan: loanId, ...params })}`;
}

export function bankLast4(value: string | null | undefined): string {
  return typeof value === "string" && /^\d{4}$/.test(value) ? value : "";
}

export function bankDisplayName(value: string | null | undefined): string {
  // A display label must not become a channel for an account/routing number.
  return value?.trim() && !/\d(?:[\s-]*\d){4,}/.test(value) ? value.trim() : "Bank account";
}

export function bankAccountLabel(name: string | null | undefined, last4: string | null | undefined): string {
  const suffix = bankLast4(last4);
  return `${bankDisplayName(name)} (${suffix ? `••••${suffix}` : "account details unavailable"})`;
}

export function paymentActorLabel(value: string | null | undefined, viewerName?: string): string {
  if (!value) return "Source unavailable";
  const normalized = value.trim().toLowerCase();
  const ownName = viewerName?.trim();
  if (normalized === "you" || ownName && normalized === ownName.toLowerCase()) return ownName || "You";
  if (normalized === "co-borrower") return "Co-borrower";
  if (normalized.includes("autopay")) return "AutoPay";
  if (/\b(agent|staff|phone)\b/.test(normalized)) return "RTR agent";
  return "Source unavailable";
}
