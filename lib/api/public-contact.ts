import { createCallbackRequest, createContactMessage } from "./generated/public/public";
import { ApiError } from "./http";
import { callbackConsent } from "@/lib/consent";
import { accountNumberValidationMessage, containsSensitiveNumber, nameValidationMessage, sensitiveMessageError, validName, validOptionalAccountNumber, validPhone, validText } from "@/lib/form-validation";

export async function submitContractCallback(form: FormData): Promise<Response> {
  const field = (name: string) => String(form.get(name) ?? "").trim();
  if (field("company")) return Response.json({ ok: true });
  if (!validName(field("fullName"))) return Response.json({ error: nameValidationMessage }, { status: 400 });
  if (!validPhone(field("phone"))) return Response.json({ error: "Enter a phone number with 10 to 15 digits." }, { status: 400 });
  if (!validOptionalAccountNumber(field("accountNumber"))) return Response.json({ error: accountNumberValidationMessage }, { status: 400 });
  if (field("callbackConsentVersion") !== callbackConsent.version) return Response.json({ error: "Review the current callback-only permission." }, { status: 409 });
  const zones: Record<string, string> = { "Eastern Time (ET)": "America/New_York", "Central Time (CT)": "America/Chicago", "Mountain Time (MT)": "America/Denver", "Pacific Time (PT)": "America/Los_Angeles", "Alaska Time (AKT)": "America/Anchorage", "Hawaii Time (HT)": "Pacific/Honolulu" };
  const digits = field("phone").replace(/\D/g, "");
  const window = field("callbackWindow");
  const preferredWindow = window.startsWith("Morning") ? "MORNING" : window.startsWith("Afternoon") ? "AFTERNOON" : window.startsWith("Evening") ? "EVENING" : "NEXT_AVAILABLE";
  const reason = { "Payment or AutoPay Question": "PAYMENT_AUTOPAY", "Account Transfer": "ACCOUNT_TRANSFER", "Statements or Form 1098": "STATEMENTS_TAX", "Payment Assistance or Hardship": "PAYMENT_ASSISTANCE" }[field("reason")] as "PAYMENT_AUTOPAY" | "ACCOUNT_TRANSFER" | "STATEMENTS_TAX" | "PAYMENT_ASSISTANCE" | undefined;
  try {
    const result = await createCallbackRequest({ fullName: field("fullName"), phone: `+${digits.length === 10 ? "1" : ""}${digits}`, accountNumber: field("accountNumber") || null, timeZone: zones[field("timeZone")] ?? "", preferredWindow, reason: reason ?? "OTHER", consentTextVersion: callbackConsent.version });
    return Response.json({ ok: true, ...result });
  } catch (error) { return error instanceof ApiError ? Response.json({ error: error.message }, { status: error.status }) : Response.json({ error: "Could not submit your callback request. Please try again." }, { status: 503 }); }
}

export async function submitContractContact(form: FormData): Promise<Response> {
  const field = (name: string) => String(form.get(name) ?? "").trim();
  // Retain the existing honeypot without sending its contents to the portal API.
  if (field("company")) return Response.json({ ok: true });
  if (field("fullName") ? !validName(field("fullName")) : !validName(field("firstName"), 50) || !validName(field("lastName"), 50)) return Response.json({ error: nameValidationMessage }, { status: 400 });
  if (!validText(field("message"), 2000) || !validPhone(field("phone")) || field("email").length > 254 || !/^\S+@\S+\.\S+$/.test(field("email"))) return Response.json({ error: "Check your email, phone number and message." }, { status: 400 });
  if (containsSensitiveNumber(field("message"))) return Response.json({ error: sensitiveMessageError }, { status: 400 });
  if (!validOptionalAccountNumber(field("accountNumber"))) return Response.json({ error: accountNumberValidationMessage }, { status: 400 });
  const reason = { "Payment or AutoPay Question": "PAYMENT_AUTOPAY", "Account Transfer": "ACCOUNT_TRANSFER", "Statements or Form 1098": "STATEMENTS_TAX", "Payment Assistance or Hardship": "PAYMENT_ASSISTANCE" }[field("reason")] as "PAYMENT_AUTOPAY" | "ACCOUNT_TRANSFER" | "STATEMENTS_TAX" | "PAYMENT_ASSISTANCE" | undefined;
  try {
    const result = await createContactMessage({ fullName: field("fullName") || `${field("firstName")} ${field("lastName")}`.trim(), email: field("email"), phone: field("phone") || null, accountNumber: field("accountNumber") || null, reason: reason ?? "OTHER", message: field("message") });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return error instanceof ApiError ? Response.json({ ...error.problem, error: error.message }, { status: error.status }) : Response.json({ error: "Could not send the message. Please try again." }, { status: 503 });
  }
}
