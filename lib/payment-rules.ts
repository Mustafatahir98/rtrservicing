import type { AutopayPreview, PaymentOptions } from "@/api/generated/model";
import { inputCents } from "./payment-types";

export function paymentAmountError(options: PaymentOptions | undefined, base: number | null, extra: number | null, custom: boolean): string | null {
  const maximum = inputCents(options?.maximumTotalAmount);
  if (maximum === null || maximum <= 0) return "Payment limits are unavailable. Contact Customer Solutions before submitting.";
  if (base === null || base <= 0 || extra === null || extra < 0) return "Enter a valid payment amount and additional principal.";
  if (custom) {
    const min = inputCents(options?.customAmountLimits?.min), max = inputCents(options?.customAmountLimits?.max);
    if (min === null || max === null || min > max || base < min || base > max) return "The custom amount is outside the available limits.";
  }
  if (extra > 0 && options?.additionalPrincipalAllowed !== true) return "Additional principal is unavailable for this loan.";
  if (base + extra > maximum) return "The payment plus additional principal exceeds the combined payment limit. Reduce the amount or contact Customer Solutions.";
  return null;
}

export function autopayReviewSnapshot(value: AutopayPreview) {
  return JSON.stringify([value.amountPerDraft, value.draftsPerYear, value.totalPerYear, value.upcomingDrafts, value.explanation, value.warnings, value.planDisclosure, value.rulesVersion]);
}

export function usableAutopayPreview(value: AutopayPreview | undefined): value is AutopayPreview {
  return Boolean(value && (inputCents(value.amountPerDraft) ?? 0) > 0 && (inputCents(value.totalPerYear) ?? 0) > 0 && Number.isSafeInteger(value.draftsPerYear) && value.draftsPerYear > 0 && value.upcomingDrafts?.length && value.explanation?.trim() && value.planDisclosure?.trim() && value.rulesVersion?.trim() && Array.isArray(value.warnings));
}
