import { NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);

const timeZones = ["Eastern Time (ET)", "Central Time (CT)", "Mountain Time (MT)", "Pacific Time (PT)", "Alaska Time (AKT)", "Hawaii Time (HT)"];
const windows = ["Next Available Specialist", "Morning Window (8:00 AM – 12:00 PM Central)", "Afternoon Window (12:00 PM – 4:00 PM Central)", "Evening Window (4:00 PM – 7:00 PM Central)"];
const reasons = ["Payment or AutoPay Question", "Account Transfer", "Statements or Form 1098", "Payment Assistance or Hardship", "Escrow, Taxes or Insurance", "Other"];

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    // Honeypot: real visitors never see or fill this field.
    if (String(form.get("company") ?? "").trim()) return NextResponse.json({ ok: true });

    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const accountNumber = String(form.get("accountNumber") ?? "").trim();
    const timeZone = String(form.get("timeZone") ?? "");
    const callbackWindow = String(form.get("callbackWindow") ?? "");
    const reason = String(form.get("reason") ?? "");

    if (!fullName || phone.replace(/\D/g, "").length < 10 || !timeZones.includes(timeZone) || !windows.includes(callbackWindow) || !reasons.includes(reason)) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) {
      return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
    }

    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "RTR Servicing <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL,
      subject: `Callback request from ${fullName}`,
      html: `<h2>New callback request</h2><p><strong>Name:</strong> ${escapeHtml(fullName)}</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><p><strong>Account number:</strong> ${accountNumber ? escapeHtml(accountNumber) : "Not provided"}</p><p><strong>Time zone:</strong> ${escapeHtml(timeZone)}</p><p><strong>Preferred window:</strong> ${escapeHtml(callbackWindow)}</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`,
    });
    if (error) return NextResponse.json({ error: "Your request could not be sent." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
