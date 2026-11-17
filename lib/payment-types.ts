export type FundingAccount = { id: string; bank_name: string; account_type: string; account_last4: string };
export type ScheduledPayment = { id: string; amount: string; process_date: string; bank_name: string; account_last4: string; confirmation_number: string };
export function paymentToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function paymentWindow(due: string | null, today: string) {
  const first = due ?? today.slice(0, 8) + "01";
  const min = first > today ? first : today, max = first.slice(0, 8) + "16";
  // An expired demo window has no available dates; do not invent new rules.
  return min <= max ? { min, max } : null;
}
export function inputCents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export const centsAmount = (cents: number) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
