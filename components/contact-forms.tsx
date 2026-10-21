"use client";

import { FormEvent, useEffect, useId, useState } from "react";

const timeZones = ["Eastern Time (ET)", "Central Time (CT)", "Mountain Time (MT)", "Pacific Time (PT)", "Alaska Time (AKT)", "Hawaii Time (HT)"];
const windows = [
  { value: "Next Available Specialist", title: "Next Available Specialist", note: "During business hours" },
  { value: "Morning Window (8:00 AM – 12:00 PM Central)", title: "Morning Window", note: "8:00 AM – 12:00 PM Central" },
  { value: "Afternoon Window (12:00 PM – 4:00 PM Central)", title: "Afternoon Window", note: "12:00 PM – 4:00 PM Central" },
  { value: "Evening Window (4:00 PM – 7:00 PM Central)", title: "Evening Window", note: "4:00 PM – 7:00 PM Central" },
];
const reasons = ["Payment or AutoPay Question", "Account Transfer", "Statements or Form 1098", "Payment Assistance or Hardship", "Escrow, Taxes or Insurance", "Other"];

type Tab = "call" | "message";
type Status = "idle" | "sending" | "sent" | "error";

function useSubmit(endpoint: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", body: new FormData(form) });
      if (response.ok) {
        form.reset();
        setStatus("sent");
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Something went wrong.");
    } catch {
      setError("We couldn't reach the server.");
    }
    setStatus("error");
  }

  return { status, error, submit };
}

/* Hidden from people and assistive tech; bots that fill every field get silently dropped by the API. */
function Honeypot() {
  return <input className="ct-honeypot" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />;
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue: string }) {
  return (
    <label className="ct-field">
      <span>{label} *</span>
      <span className="ct-select">
        <select name={name} defaultValue={defaultValue} required>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </span>
    </label>
  );
}

function StatusMessage({ status, error, sent }: { status: Status; error: string; sent: string }) {
  return (
    <p className={`ct-status is-${status}`} role="status" aria-live="polite">
      {status === "sent" ? sent : status === "error" ? `${error} Please try again or call 877-252-3761.` : ""}
    </p>
  );
}

function CallbackForm() {
  const { status, error, submit } = useSubmit("/api/callback");
  return (
    <form className="ct-form" onSubmit={submit}>
      <Honeypot />
      <label className="ct-field">
        <span>Full Legal Name *</span>
        <input name="fullName" placeholder="Enter Name" autoComplete="name" required />
      </label>
      <div className="ct-row">
        <label className="ct-field">
          <span>Phone Number *</span>
          <input name="phone" type="tel" placeholder="Enter Name" autoComplete="tel" inputMode="tel" pattern="[0-9()+\-.\s]{10,}" title="Enter a phone number with at least 10 digits" required />
        </label>
        <label className="ct-field">
          <span>Account Number (Optional)</span>
          <input name="accountNumber" placeholder="Enter Account Number" inputMode="numeric" autoComplete="off" />
        </label>
      </div>
      <SelectField label="Time Zone" name="timeZone" options={timeZones} defaultValue="Central Time (CT)" />
      <fieldset className="ct-windows">
        <legend>Preferred Callback Window *</legend>
        <div className="ct-window-grid">
          {windows.map((slot, index) => (
            <label key={slot.value} className="ct-window">
              <input type="radio" name="callbackWindow" value={slot.value} defaultChecked={index === 0} required />
              <span className="ct-window-text">
                <strong>{slot.title}</strong>
                <small>{slot.note}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField label="Reason for Call" name="reason" options={reasons} defaultValue={reasons[0]} />
      <p className="ct-disclaimer">By submitting this request, you authorize RTR Servicing to contact you at the telephone number provided regarding your servicing inquiries.</p>
      <button className="hm-btn hm-btn-blue hm-btn-block ct-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Sign in to your Account"}</button>
      <StatusMessage status={status} error={error} sent="Thank you — your callback request has been received. A specialist will call you in the window you selected." />
    </form>
  );
}

function MessageForm() {
  const { status, error, submit } = useSubmit("/api/contact");
  return (
    <form className="ct-form" onSubmit={submit}>
      <Honeypot />
      <div className="ct-row">
        <label className="ct-field">
          <span>First Name *</span>
          <input name="firstName" autoComplete="given-name" required />
        </label>
        <label className="ct-field">
          <span>Last Name *</span>
          <input name="lastName" autoComplete="family-name" required />
        </label>
      </div>
      <div className="ct-row">
        <label className="ct-field">
          <span>Email Address *</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="ct-field">
          <span>Phone Number *</span>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9()+\-.\s]{10,}" title="Enter a phone number with at least 10 digits" required />
        </label>
      </div>
      <label className="ct-field">
        <span>Account Number (Optional)</span>
        <input name="accountNumber" inputMode="numeric" autoComplete="off" />
      </label>
      <label className="ct-field">
        <span>Message *</span>
        <textarea name="message" rows={6} required />
      </label>
      <p className="ct-disclaimer">Please don&apos;t include your full Social Security number or bank details in this message.</p>
      <button className="hm-btn hm-btn-blue hm-btn-block ct-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send Message"}</button>
      <StatusMessage status={status} error={error} sent="Thank you — your message has been sent. Our team will reply as soon as possible." />
    </form>
  );
}

export default function ContactForms() {
  const id = useId();
  const [tab, setTab] = useState<Tab>("call");

  // /contact#message (used by "Message us" links elsewhere) opens the online message tab.
  useEffect(() => {
    const sync = () => { if (window.location.hash === "#message") setTab("message"); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div id="message" className="ct-panel">
      <div className="ct-tabs" role="tablist" aria-label="How would you like to contact us?">
        <button type="button" role="tab" id={`${id}-call`} aria-controls={`${id}-call-panel`} aria-selected={tab === "call"} className={tab === "call" ? "is-active" : undefined} onClick={() => setTab("call")}>Request a Call</button>
        <button type="button" role="tab" id={`${id}-message`} aria-controls={`${id}-message-panel`} aria-selected={tab === "message"} className={tab === "message" ? "is-active" : undefined} onClick={() => setTab("message")}>Send Online Message</button>
      </div>

      <div className="ct-card">
        <div id={`${id}-call-panel`} role="tabpanel" aria-labelledby={`${id}-call`} hidden={tab !== "call"}>
          <h2>Schedule a Phone Consultation</h2>
          <p className="ct-card-sub">Available for borrowers and authorized representatives. Enter your information and our team will contact you.</p>
          <CallbackForm />
        </div>
        <div id={`${id}-message-panel`} role="tabpanel" aria-labelledby={`${id}-message`} hidden={tab !== "message"}>
          <h2>Send Us a Message</h2>
          <p className="ct-card-sub">Have a question about your account? Send us a message and a Customer Solutions specialist will respond as soon as possible.</p>
          <MessageForm />
        </div>
      </div>
    </div>
  );
}
