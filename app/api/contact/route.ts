import { NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    // Honeypot: real visitors never see or fill this field.
    if (String(form.get("company") ?? "").trim()) return NextResponse.json({ ok: true });

    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const accountNumber = String(form.get("accountNumber") ?? "").trim();

    if (!firstName || !lastName || !phone || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) {
      return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
    }

    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "RTR Servicing <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `Website enquiry from ${firstName} ${lastName}`,
      html: `<h2>New contact enquiry</h2><p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p>${accountNumber ? `<p><strong>Account number:</strong> ${escapeHtml(accountNumber)}</p>` : ""}<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });
    if (error) return NextResponse.json({ error: "Email could not be sent." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
