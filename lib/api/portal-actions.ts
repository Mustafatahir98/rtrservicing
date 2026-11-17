import { createPayment, cancelScheduledPayment, reschedulePayment, getPaymentOptions, getAuthorizationTerms } from "./generated/payments/payments";
import { cancelAutopay, previewAutopay, setAutopay } from "./generated/auto-pay/auto-pay";
import { confirmEmailChange, getMyProfile, startEmailChange, updateMailingAddress, updatePhone } from "./generated/profile/profile";
import type { CreatePaymentInput, SetAutopayInput } from "./generated/model";
import { cancellationReceipts } from "./borrower-view";
import { ApiError } from "./http";
import { centsAmount, inputCents } from "@/lib/payment-types";
import { autopayReviewSnapshot, paymentAmountError, usableAutopayPreview } from "@/lib/payment-rules";

const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

// Adapt the existing form commands to generated operations. These command URLs are never fetched.
export async function executePortalAction(command: string, value: unknown): Promise<Response> {
  const body = record(value), loanId = text(body.loanId);
  try {
    if (command === "/api/portal/payments") {
      if (body.action === "change-date") { await reschedulePayment(loanId, text(body.paymentId), { draftDate: text(body.processDate) }); return response({ ok: true }); }
      if (body.action === "cancel") {
        if (body.confirm !== true) return response({ error: "Confirm cancellation." }, 422);
        const result = await cancelScheduledPayment(loanId, text(body.paymentId));
        cancellationReceipts.set(`${loanId}:${result.paymentId}`, { id: result.paymentId, amount: text(body.amount), process_date: text(body.originalDate), bank_name: text(body.bankName), account_last4: text(body.last4), cancelled_at: result.cancelledAt, cancellation_confirmation_number: result.cancellationNumber, still_due: result.stillDue });
        return response({ ok: true, redirectTo: `/dashboard/payment-cancelled?${new URLSearchParams({ loan: loanId, payment: result.paymentId })}` });
      }
      const options = await getPaymentOptions(loanId), terms = await getAuthorizationTerms(loanId, { type: "ONE_TIME" });
      if (body.termsVersion !== terms.version) return response({ error: "Authorization wording changed. Refresh and review it before submitting." }, 409);
      const kind = { regular: "REGULAR", due: "TOTAL_DUE", payoff: "PAYOFF", custom: "CUSTOM" }[text(body.amountType)] as CreatePaymentInput["amountType"] | undefined;
      if (!kind) return response({ error: "Select a payment amount." }, 422);
      const option = options.amountOptions.find(option => option.type === kind), amount = kind === "CUSTOM" ? text(body.customAmount) : option?.amount;
      if (!amount || inputCents(amount) === null || body.authorized !== true) return response({ error: "Review the payment amount and authorization." }, 422);
      if (terms.type !== "ONE_TIME" || !terms.text?.trim() || !terms.revocationText?.trim() || inputCents(options.paymentFee) === null) return response({ error: "Payment authorization or fee details are unavailable. Refresh before submitting." }, 409);
      if (inputCents(body.reviewedAmount) !== inputCents(amount) || body.reviewedFee !== options.paymentFee || body.reviewedTerms !== terms.text || body.reviewedRevocation !== terms.revocationText) return response({ error: "Payment details changed. Refresh and review the amount, fee and authorization again before submitting." }, 409);
      const extra = inputCents(body.extraPrincipal);
      const amountError = paymentAmountError(options, inputCents(amount), extra, kind === "CUSTOM");
      if (amountError) return response({ error: amountError }, 422);
      const result = await createPayment(loanId, { amountType: kind, amount: centsAmount(inputCents(amount)!), additionalPrincipal: centsAmount(extra!), draftDate: text(body.processDate), bankAccountId: text(body.fundingAccountId), payoffQuoteId: option?.payoffQuoteId ?? null, authorization: { accepted: true, termsVersion: terms.version } }, { headers: { "Idempotency-Key": text(body.idempotencyKey) } });
      return response({ ok: true, id: result.paymentId, confirmation_number: result.confirmationNumber, status: result.status.toLowerCase() });
    }
    if (command === "/api/portal/autopay") {
      if (body.action === "turn-off") { if (body.confirm !== true) return response({ error: "Confirm cancellation." }, 422); const result = await cancelAutopay(loanId); return response({ ok: true, lastDraftDate: result.lastDraftDate, confirmationNumber: result.confirmationNumber }); }
      const frequency = text(body.frequency).toUpperCase() as SetAutopayInput["schedule"]["frequency"];
      if (!["MONTHLY", "WEEKLY", "SEMI_MONTHLY", "BIWEEKLY"].includes(frequency) || body.authorized !== true) return response({ error: "Review the schedule and authorization." }, 422);
      const firstDraftDate = text(body.firstDraftDate) || text(body.anchorDate);
      const terms = await getAuthorizationTerms(loanId, { type: "RECURRING" });
      if (body.termsVersion !== terms.version) return response({ error: "Authorization wording changed. Refresh and review it before submitting." }, 409);
      const schedule = { frequency, firstDraftDate, secondDayOfMonth: frequency === "SEMI_MONTHLY" ? Number(body.day) + 15 : null };
      const preview = await previewAutopay(loanId, schedule);
      if (!usableAutopayPreview(preview) || body.reviewedPreview !== autopayReviewSnapshot(preview)) return response({ error: "AutoPay rules or amounts changed. Review the schedule and authorization again before activating." }, 409);
      await setAutopay(loanId, { schedule, bankAccountId: text(body.fundingAccountId), expectedRulesVersion: preview.rulesVersion, expectedAmountPerDraft: preview.amountPerDraft, expectedTotalPerYear: preview.totalPerYear, authorization: { accepted: true, termsVersion: terms.version } }, { headers: { "Idempotency-Key": text(body.requestKey) } });
      return response({ ok: true });
    }
    if (command === "/api/portal/profile/email-confirm") { await confirmEmailChange({ emailChangeId: text(body.emailChangeId), code: text(body.code) }); return response({ ok: true }); }
    if (command === "/api/portal/profile") {
      const profile = record(body.profile), current = await getMyProfile();
      if (profile.customer_id !== current.personId) return response({ error: "You can only change your own profile." }, 403);
      if (`${text(profile.first_name)} ${text(profile.last_name)}`.trim() !== current.fullName.trim()) return response({ error: "Contact RTR to change your name." }, 422);
      let pending = false;
      const nextAddress = { line1: text(profile.mail_address_line1), line2: text(profile.mail_address_line2) || null, city: text(profile.mail_city), state: text(profile.mail_state), postalCode: text(profile.mail_zip) };
      if (JSON.stringify(nextAddress) !== JSON.stringify(current.mailingAddress)) { const result = await updateMailingAddress(nextAddress); pending ||= "changeRequestId" in result; }
      const digits = text(profile.primary_phone).replace(/\D/g, ""), number = `+${digits.length === 10 ? "1" : ""}${digits}`;
      const phoneType = profile.primary_phone_type === "Cell" ? "MOBILE" : "HOME";
      if (number !== current.phones[0]?.number || phoneType !== current.phones[0]?.type) { const result = await updatePhone({ number, type: phoneType }); pending ||= "changeRequestId" in result; }
      let emailChangeId: string | undefined;
      if (profile.contact_email !== current.email) emailChangeId = (await startEmailChange({ newEmail: text(profile.contact_email) })).emailChangeId;
      const now = new Date().toISOString();
      return response({ ok: true, updated_at: now, pending, emailChangeId });
    }
    return response({ error: "This operation has no portal API mapping.", code: "CONTRACT_OPERATION_MISSING" }, 501);
  } catch (error) {
    if (error instanceof ApiError) return response({ ...error.problem, error: error.message }, error.status);
    if (error instanceof Error && error.name === "AbortError") return response({ error: "The request was interrupted. Check the result before retrying a payment." }, 408);
    return response({ error: "Could not reach the service. Check the existing result before retrying a payment." }, 503);
  }
}
