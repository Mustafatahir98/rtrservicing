"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const response = await fetch("/api/contact", { method: "POST", body: new FormData(form) });
    if (response.ok) { form.reset(); setStatus("sent"); } else setStatus("error");
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="field-row">
        <label>First Name*<input name="firstName" autoComplete="given-name" required /></label>
        <label>Last Name*<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <label>Phone number*<input name="phone" type="tel" autoComplete="tel" required /></label>
      <label>Company Email*<input name="email" type="email" autoComplete="email" required /></label>
      <label>Message*<textarea name="message" required /></label>
      <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send Message"}</button>
      <p className={`form-status ${status}`} aria-live="polite">{status === "sent" ? "Thanks — your message has been sent." : status === "error" ? "We couldn't send your message. Please try again." : ""}</p>
    </form>
  );
}
