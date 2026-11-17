import { centsAmount, inputCents } from "./payment-types";
export const frequencies = {
  monthly: { label: "Monthly", note: "Once a month", divisor: 1, drafts: 12 },
  weekly: { label: "Weekly", note: "Every week", divisor: 4, drafts: 52 },
  semi_monthly: { label: "Semi-Monthly", note: "Twice a Month", divisor: 2, drafts: 24 },
  biweekly: { label: "Bi-Weekly", note: "Every two weeks", divisor: 2, drafts: 26 },
} as const;
export type Frequency = keyof typeof frequencies;
export type AutoPayRecord = { id: string; customer_id: string; funding_account_id: string; frequency: Frequency; first_day: number | null; second_day: number | null; anchor_date: string | null; amount: string; next_draft_date: string; bank_name: string; account_last4: string };
export function ordinal(day: number) { return `${day}${day % 100 >= 11 && day % 100 <= 13 ? "th" : day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th"}`; }
export function nextBusinessDay(today: string) {
  const date = new Date(today + "T00:00:00Z");
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
// Match the draft weekdays offered by the current calendar and demo API.
export function nextAvailableDraft(today: string, frequency: Frequency) {
  const date = new Date(nextBusinessDay(today) + "T00:00:00Z");
  if (frequency === "biweekly") date.setUTCDate(date.getUTCDate() + (5 - date.getUTCDay() + 7) % 7);
  return date.toISOString().slice(0, 10);
}
export function nextRecurringDraft(anchor: string, today: string, interval: number) {
  const start = new Date(anchor + "T00:00:00Z");
  const elapsed = Math.max(0, (new Date(today + "T00:00:00Z").getTime() - start.getTime()) / 86400000);
  start.setUTCDate(start.getUTCDate() + Math.ceil(elapsed / interval) * interval);
  return start.toISOString().slice(0, 10);
}
export function nextAllowedWeekday(today: string, weekdays: readonly number[] | undefined): string | null {
  const date = new Date(today + "T00:00:00Z");
  for (let offset = 0; offset < 7; offset++, date.setUTCDate(date.getUTCDate() + 1)) {
    if (weekdays?.includes(date.getUTCDay())) return date.toISOString().slice(0, 10);
  }
  return null;
}
// Calendar descriptions contain no payment-amount calculations.
export function autoPaySchedule(frequency: Frequency, day: number, anchor: string, today: string) {
  let nextDate = anchor;
  if (frequency === "monthly" || frequency === "semi_monthly") {
    const current = new Date(today + "T00:00:00Z");
    const candidates: string[] = [];
    for (let month = 0; month < 3; month++) for (const candidateDay of frequency === "monthly" ? [day] : [day, day + 15]) {
      const lastDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + month + 1, 0)).getUTCDate();
      const candidate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + month, Math.min(candidateDay, lastDay))).toISOString().slice(0, 10);
      if (candidate >= today) candidates.push(candidate);
    }
    nextDate = candidates.sort()[0];
  }
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(anchor + "T00:00:00Z"));
  const description = frequency === "monthly" ? `on the ${ordinal(day)} of each month` : frequency === "semi_monthly" ? `on the ${ordinal(day)} and ${ordinal(day + 15)} of each month` : `every ${frequency === "biweekly" ? "other " : ""}${weekday}`;
  return { nextDate, weekday, description };
}
// Synthetic/local server calculator. The frontend uses API amounts instead.
export function autoPaySummary(frequency: Frequency, day: number, anchor: string, monthlyAmount: string, today: string) {
  const config = frequencies[frequency];
  const baseCents = inputCents(monthlyAmount) ?? 0;
  const perDraft = Math.round(baseCents / config.divisor);
  return { ...autoPaySchedule(frequency, day, anchor, today), perDraft, amount: centsAmount(perDraft), annual: centsAmount(perDraft * config.drafts), drafts: config.drafts };
}
