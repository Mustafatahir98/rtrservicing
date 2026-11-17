"use client";

import { cn } from "./portal-ui";
import { contactField, contactInput, contactSelect, siteButton } from "./site-ui";

import { submitContractCallback, submitContractContact } from "@/api/public-contact";
import { callbackConsent } from "@/lib/consent";
import { accountNumberPattern, accountNumberValidationMessage, containsSensitiveNumber, namePattern, nameValidationMessage, phonePattern, sensitiveMessageError } from "@/lib/form-validation";
import { publicSecurityMessage, publicSiteInfo } from "@/lib/public-site-info";
import { FormEvent, useEffect, useId, useState } from "react";

const timeZones = ["Eastern Time (ET)", "Central Time (CT)", "Mountain Time (MT)", "Pacific Time (PT)", "Alaska Time (AKT)", "Hawaii Time (HT)"];
const windows = [
  { value: "Next Available Specialist", title: "Next Available Specialist", note: "During business hours" },
  { value: "Morning Window (8:30 AM – 12:00 PM Central)", title: "Morning Window", note: "8:30 AM – 12:00 PM Central" },
  { value: "Afternoon Window (12:00 PM – 5:30 PM Central)", title: "Afternoon Window", note: "12:00 PM – 5:30 PM Central" },
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
    if (status === "sending" || !form.reportValidity()) return;
    if (endpoint === "/api/contact" && containsSensitiveNumber(new FormData(form).get("message"))) {
      setError(sensitiveMessageError);
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const response = endpoint === "/api/contact" ? await submitContractContact(new FormData(form)) : await submitContractCallback(new FormData(form));
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
  return <input className="tw:sr-only tw:opacity-0" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />;
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue: string }) {
  return (
    <label className={contactField}>
      <span>{label} *</span>
      <span className={contactSelect}>
        <select className={cn(contactInput, "tw:cursor-pointer tw:appearance-none tw:pr-12 tw:max-site-mobile:pr-11")} name={name} defaultValue={defaultValue} required>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </span>
    </label>
  );
}

function StatusMessage({ status, error, sent }: { status: Status; error: string; sent: string }) {
  return (
    <p className={cn("tw:m-0 tw:-mt-2.5 tw:rounded-lg tw:px-3.5 tw:py-3 tw:text-sm tw:leading-[1.5] tw:empty:hidden", status === "sent" && "tw:bg-site-green-soft tw:text-[#1f6b1e]", status === "error" && "tw:bg-[#fdecea] tw:text-[#8a2a1b]")} role="status" aria-live="polite">
      {status === "sent" ? sent : status === "error" ? `${error} Please try again or call ${publicSiteInfo.phone.label}.` : ""}
    </p>
  );
}

function CallbackForm() {
  const { status, error, submit } = useSubmit("/api/callback");
  return (
    <form className="tw:mt-[30px] tw:grid tw:gap-[26px] tw:max-site-mobile:mt-6 tw:max-site-mobile:gap-5" onSubmit={submit}>
      <Honeypot />
      <label className={contactField}>
        <span>Full Legal Name *</span>
        <input className={contactInput} name="fullName" placeholder="Enter Name" autoComplete="name" maxLength={100} pattern={namePattern} title={nameValidationMessage} required />
      </label>
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:max-site-mobile:grid-cols-1 tw:max-site-mobile:gap-6">
        <label className={contactField}>
          <span>Phone Number *</span>
          <input className={contactInput} name="phone" type="tel" placeholder="(555) 123-4567" autoComplete="tel" inputMode="tel" pattern={phonePattern} maxLength={25} title="Enter a phone number with at least 10 digits" required />
        </label>
        <label className={contactField}>
          <span>Account Number (Optional)</span>
          <input className={contactInput} name="accountNumber" placeholder="e.g. RTR-100849" inputMode="text" pattern={accountNumberPattern} title={accountNumberValidationMessage} maxLength={30} autoComplete="off" />
        </label>
      </div>
      <SelectField label="Time Zone" name="timeZone" options={timeZones} defaultValue="Central Time (CT)" />
      <fieldset className="tw:m-0 tw:min-w-0 tw:border-0 tw:p-0">
        <legend className="tw:mb-3 tw:p-0 tw:text-[15px] tw:font-medium tw:max-site-mobile:mb-[18px] tw:max-site-mobile:text-base tw:max-site-mobile:font-normal">Preferred Callback Window *</legend>
        <div className="tw:grid tw:grid-cols-2 tw:gap-x-3.5 tw:gap-y-2.5 tw:max-site-mobile:grid-cols-1 tw:max-site-mobile:gap-[5px]">
          {windows.map((slot, index) => (
            <label key={slot.value} className="tw:flex tw:min-h-[75px] tw:cursor-pointer tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:border-solid tw:border-[#b8c4cb] tw:bg-white tw:px-4 tw:py-3.5 tw:transition-colors tw:hover:border-site-blue tw:has-checked:border-site-blue tw:has-checked:bg-[#e7f4fd] tw:has-focus-visible:outline-3 tw:has-focus-visible:outline-[#7cc4ef] tw:has-focus-visible:outline-offset-2 tw:max-site-mobile:min-h-[76px] tw:max-site-mobile:rounded-md tw:max-site-mobile:px-[18px] tw:max-site-mobile:py-[17px] tw:max-site-mobile:has-checked:border-[#0073c9] tw:max-site-mobile:has-checked:bg-[#eef7fc]">
              <input className="tw:m-0 tw:mt-[3px] tw:size-[15px] tw:shrink-0 tw:accent-site-blue tw:max-site-mobile:mt-0.5 tw:max-site-mobile:size-[13px] tw:max-site-mobile:accent-[#1685fa]" type="radio" name="callbackWindow" value={slot.value} defaultChecked={index === 0} required />
              <span className="tw:grid tw:gap-[3px] tw:max-site-mobile:gap-1">
                <strong className="tw:text-[15px] tw:font-semibold tw:max-site-mobile:font-normal">{slot.title}</strong>
                <small className="tw:text-xs tw:text-site-muted tw:max-site-mobile:text-[#465467]">{slot.note}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField label="Reason for Call" name="reason" options={reasons} defaultValue={reasons[0]} />
      <p className="tw:m-0 tw:text-[13px] tw:leading-[1.6] tw:text-site-muted tw:max-site-mobile:px-2 tw:max-site-mobile:text-center tw:max-site-mobile:text-xs tw:max-site-mobile:leading-[1.5]">{callbackConsent.text}</p>
      <button className={siteButton("blue", "tw:min-h-[58px] tw:w-full tw:text-lg tw:max-site-mobile:rounded-xl tw:max-site-mobile:text-base tw:max-site-mobile:font-normal")} type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Request a Callback"}</button>
      <input type="hidden" name="callbackConsentVersion" value={callbackConsent.version} />
      <StatusMessage status={status} error={error} sent="Thank you — your callback request has been received. Your preferred time is requested, subject to availability." />
    </form>
  );
}

function MessageForm() {
  const { status, error, submit } = useSubmit("/api/contact");
  return (
    <form className="tw:mt-[30px] tw:grid tw:gap-[26px] tw:max-site-mobile:mt-6 tw:max-site-mobile:gap-5" onSubmit={submit}>
      <Honeypot />
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:max-site-mobile:grid-cols-1 tw:max-site-mobile:gap-6">
        <label className={contactField}>
          <span>First Name *</span>
          <input className={contactInput} name="firstName" autoComplete="given-name" maxLength={50} pattern={namePattern} title={nameValidationMessage} required />
        </label>
        <label className={contactField}>
          <span>Last Name *</span>
          <input className={contactInput} name="lastName" autoComplete="family-name" maxLength={50} pattern={namePattern} title={nameValidationMessage} required />
        </label>
      </div>
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:max-site-mobile:grid-cols-1 tw:max-site-mobile:gap-6">
        <label className={contactField}>
          <span>Email Address *</span>
          <input className={contactInput} name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
        <label className={contactField}>
          <span>Phone Number *</span>
          <input className={contactInput} name="phone" type="tel" placeholder="(555) 123-4567" autoComplete="tel" inputMode="tel" pattern={phonePattern} maxLength={25} title="Enter a phone number with at least 10 digits" required />
        </label>
      </div>
      <label className={contactField}>
        <span>Account Number (Optional)</span>
        <input className={contactInput} name="accountNumber" placeholder="e.g. RTR-100849" inputMode="text" pattern={accountNumberPattern} title={accountNumberValidationMessage} maxLength={30} autoComplete="off" />
      </label>
      <label className={contactField}>
        <span>Message *</span>
        <textarea className={cn(contactInput, "tw:h-auto tw:min-h-[140px] tw:resize-y tw:py-3.5 tw:max-site-mobile:h-auto")} name="message" rows={6} maxLength={2000} onChange={event => event.currentTarget.setCustomValidity(event.currentTarget.value.trim() ? "" : "Enter a message, not just spaces.")} required />
      </label>
      <p className="tw:m-0 tw:text-[13px] tw:leading-[1.6] tw:text-site-muted tw:max-site-mobile:px-2 tw:max-site-mobile:text-center tw:max-site-mobile:text-xs tw:max-site-mobile:leading-[1.5]">Please don&apos;t include your full Social Security number, card number or bank details in this message.</p>
      <button className={siteButton("blue", "tw:min-h-[58px] tw:w-full tw:text-lg tw:max-site-mobile:rounded-xl tw:max-site-mobile:text-base tw:max-site-mobile:font-normal")} type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send Message"}</button>
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
    <div id="message" className="tw:col-start-2 tw:row-span-2 tw:row-start-1 tw:min-w-0 tw:scroll-mt-[110px] tw:max-site-tablet:col-start-1 tw:max-site-tablet:row-span-1 tw:max-site-tablet:row-start-2 tw:max-site-tablet:mx-auto tw:max-site-tablet:w-full tw:max-site-tablet:max-w-[640px]">
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:max-site-mobile:grid-cols-[.77fr_1fr] tw:max-site-mobile:gap-3" role="tablist" aria-label="How would you like to contact us?" onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next: Tab = event.key === "Home" ? "call" : event.key === "End" ? "message" : tab === "call" ? "message" : "call";
        setTab(next);
        event.currentTarget.querySelector<HTMLButtonElement>(`[id="${id}-${next}"]`)?.focus();
      }}>
        <button type="button" role="tab" tabIndex={tab === "call" ? 0 : -1} id={`${id}-call`} aria-controls={`${id}-call-panel`} aria-selected={tab === "call"} className={cn("tw:min-h-[58px] tw:cursor-pointer tw:rounded-md tw:border tw:border-solid tw:border-[#e3e9ec] tw:bg-white tw:px-4 tw:py-2.5 tw:text-lg tw:text-site-ink tw:transition-colors tw:hover:border-site-blue tw:max-site-mobile:min-h-[52px] tw:max-site-mobile:p-2 tw:max-site-mobile:text-[clamp(12px,3.7vw,14px)] tw:max-site-mobile:text-[#465467]", tab === "call" && "tw:border-site-blue tw:bg-site-blue tw:text-white tw:max-site-mobile:font-semibold tw:max-site-mobile:text-white")} onClick={() => setTab("call")}>Request a Call</button>
        <button type="button" role="tab" tabIndex={tab === "message" ? 0 : -1} id={`${id}-message`} aria-controls={`${id}-message-panel`} aria-selected={tab === "message"} className={cn("tw:min-h-[58px] tw:cursor-pointer tw:rounded-md tw:border tw:border-solid tw:border-[#e3e9ec] tw:bg-white tw:px-4 tw:py-2.5 tw:text-lg tw:text-site-ink tw:transition-colors tw:hover:border-site-blue tw:max-site-mobile:min-h-[52px] tw:max-site-mobile:p-2 tw:max-site-mobile:text-[clamp(12px,3.7vw,14px)] tw:max-site-mobile:text-[#465467]", tab === "message" && "tw:border-site-blue tw:bg-site-blue tw:text-white tw:max-site-mobile:font-semibold tw:max-site-mobile:text-white")} onClick={() => setTab("message")}>Send Online Message</button>
      </div>

      <div className="tw:mt-4 tw:rounded-[14px] tw:bg-white tw:px-11 tw:pt-[34px] tw:pb-10 tw:shadow-[0_24px_60px_#000e161a] tw:max-site-laptop:px-8 tw:max-site-laptop:pt-[30px] tw:max-site-laptop:pb-[34px] tw:max-site-mobile:mt-3 tw:max-site-mobile:px-5 tw:max-site-mobile:pt-8 tw:max-site-mobile:pb-7">
        <aside className="tw:mb-6 tw:rounded-xl tw:border tw:border-site-line tw:bg-site-blue-soft tw:p-4" aria-label="Personal information security"><h2 className="tw:m-0 tw:text-base tw:font-medium">Protect your personal information</h2><p className="tw:mt-2 tw:text-[14px] tw:leading-relaxed">{publicSecurityMessage}</p></aside>
        <div id={`${id}-call-panel`} role="tabpanel" aria-labelledby={`${id}-call`} hidden={tab !== "call"}>
          <h2 className="tw:m-0 tw:text-[26px] tw:leading-[1.3] tw:font-medium tw:text-site-blue tw:max-site-mobile:text-center tw:max-site-mobile:leading-[1.2] tw:max-site-mobile:font-semibold">Schedule a Phone Consultation</h2>
          <p className="tw:m-0 tw:mt-1.5 tw:text-sm tw:leading-[1.55] tw:max-site-mobile:mt-2 tw:max-site-mobile:border-0 tw:max-site-mobile:border-b tw:max-site-mobile:border-solid tw:max-site-mobile:border-[#e1e5e8] tw:max-site-mobile:px-0.5 tw:max-site-mobile:pb-[22px] tw:max-site-mobile:text-center tw:max-site-mobile:text-[15px] tw:max-site-mobile:leading-[1.6]">Available for borrowers and authorized representatives. Enter your information and our team will contact you.</p>
          <CallbackForm />
        </div>
        <div id={`${id}-message-panel`} role="tabpanel" aria-labelledby={`${id}-message`} hidden={tab !== "message"}>
          <h2 className="tw:m-0 tw:text-[26px] tw:leading-[1.3] tw:font-medium tw:text-site-blue tw:max-site-mobile:text-center tw:max-site-mobile:leading-[1.2] tw:max-site-mobile:font-semibold">Send Us a Message</h2>
          <p className="tw:m-0 tw:mt-1.5 tw:text-sm tw:leading-[1.55] tw:max-site-mobile:mt-2 tw:max-site-mobile:border-0 tw:max-site-mobile:border-b tw:max-site-mobile:border-solid tw:max-site-mobile:border-[#e1e5e8] tw:max-site-mobile:px-0.5 tw:max-site-mobile:pb-[22px] tw:max-site-mobile:text-center tw:max-site-mobile:text-[15px] tw:max-site-mobile:leading-[1.6]">Have a question about your account? Send us a message and a Customer Solutions specialist will respond as soon as possible.</p>
          <MessageForm />
        </div>
      </div>
    </div>
  );
}
