"use client";
import { handleDialogKeyDown } from "./payment-ui";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommunicationPreferences, listMyConsentHistory, updateCommunicationPreferences } from "@/api/generated/preferences/preferences";
import type { CommunicationPreferences, ConsentRecord } from "@/api/generated/model";
import { requestDemoConsent } from "@/api/demo-consent";
import { borrowerMockMode } from "@/lib/mock-mode";
import type { ConsentDemoState, ConsentEvidence } from "@/lib/consent";
import { button, cn } from "./portal-ui";
import { dialog, dialogActions, dialogButton, dialogClose, dialogContent, dialogText, dialogTitle } from "./payment-ui";

type State = { preferences: CommunicationPreferences; disclosure: ConsentDemoState["disclosure"] | null; history: (ConsentRecord | ConsentEvidence)[] };
const action = cn(button.base, button.outline, button.element, "tw:max-w-full tw:whitespace-normal tw:text-[16px]");

export default function ConsentPreferences({ loanId, onReview }: { loanId: string; initial?: CommunicationPreferences; onReview: () => void }) {
  const client = useQueryClient();
  const path = `/api/mock/loans/${encodeURIComponent(loanId)}/consent`;
  const queryKey = ["consent-preferences", loanId];
  const query = useQuery<State>({ queryKey, queryFn: async () => {
    if (borrowerMockMode) return requestDemoConsent<ConsentDemoState>(`${path}/state`);
    const [preferences, history] = await Promise.all([getCommunicationPreferences({ loanId }), listMyConsentHistory({ loanId, limit: 100 })]);
    return { preferences, disclosure: null, history: history.items };
  } });
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState(false);
  const [acceptedKey, setAcceptedKey] = useState("");
  const [accessedVersion, setAccessedVersion] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [esignKey, setEsignKey] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDialogElement>(null);
  const data = query.data;
  const changes = data?.preferences.choices.filter(choice => draft[choice.channel] !== undefined && draft[choice.channel] !== choice.enabled).map(choice => ({ ...choice, enabled: draft[choice.channel] })) ?? [];
  const fingerprint = JSON.stringify(changes);
  const disclosureKey = JSON.stringify(data?.disclosure);
  const enrolling = changes.some(choice => choice.channel === "ESTATEMENTS" && choice.enabled);
  const withdrawing = changes.some(choice => choice.channel === "ESTATEMENTS" && !choice.enabled);
  const validWording = changes.length > 0 && changes.every(choice => choice.editable && choice.consentText.trim() && choice.consentTextVersion.trim());
  const ready = validWording && acceptedKey === fingerprint && (!enrolling || Boolean(data?.disclosure && accessedVersion === data.disclosure.version && accessKey === disclosureKey && esignKey === disclosureKey));
  useEffect(() => { if (review) ref.current?.showModal(); else ref.current?.close(); }, [review]);
  async function sample() {
    if (!data?.disclosure || pending) return;
    setPending(true); setMessage("");
    try {
      const pdf = await requestDemoConsent<string>(`${path}/sample`);
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const link = document.createElement("a"); link.href = url; link.download = "esign-access-check.pdf"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAccessedVersion(data.disclosure.version); setAccessKey(""); setEsignKey("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not download the sample PDF."); }
    finally { setPending(false); }
  }
  async function save() {
    if (!ready || pending || !data) return;
    setPending(true); setMessage("");
    try {
      const choices = changes.map(({ channel, enabled, consentTextVersion, consentText }) => ({ channel, enabled, consentTextVersion, consentText }));
      let next: State;
      if (borrowerMockMode) next = await requestDemoConsent<ConsentDemoState>(`${path}/state`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choices, ...(enrolling ? { disclosure: { version: data.disclosure!.version, text: data.disclosure!.text, accepted: true, documentAccessConfirmed: true } } : {}) }) });
      else {
        if (enrolling) throw new Error("Paper-free enrollment needs the approved disclosure and backend acceptance contract. Contact Customer Solutions.");
        const current = await getCommunicationPreferences({ loanId });
        if (choices.some(choice => !current.choices.some(value => value.channel === choice.channel && value.editable && value.consentTextVersion === choice.consentTextVersion && value.consentText === choice.consentText))) throw new Error("Consent wording changed. Refresh and review your choices again.");
        const preferences = await updateCommunicationPreferences({ loanId, choices: choices.map(({ channel, enabled, consentTextVersion }) => ({ channel, enabled, consentTextVersion })) });
        const history = await listMyConsentHistory({ loanId, limit: 100 });
        next = { preferences, disclosure: null, history: history.items };
      }
      client.setQueryData(queryKey, next); setDraft({}); setReview(false); setAcceptedKey(""); setAccessKey(""); setEsignKey(""); setAccessedVersion("");
      setMessage(withdrawing ? "Paper-free enrollment withdrawn. Other communication choices and payments are unchanged." : "Your communication choices have been saved.");
      await client.invalidateQueries({ queryKey: ["borrower-mock"] });
    } catch (error) { setAcceptedKey(""); setMessage(error instanceof Error ? error.message : "Could not save communication choices."); }
    finally { setPending(false); }
  }
  if (query.isPending) return <p role="status">Loading communication preferences...</p>;
  if (query.isError || !data) return <div role="alert"><p>Communication preferences are unavailable. No choices have been changed.</p><button type="button" className={action} onClick={() => void query.refetch()}>Try again</button></div>;
  const last = data.history[0];
  return <div className="tw:min-w-0 tw:text-[16px] tw:leading-relaxed">
    <p className="tw:mb-4 tw:text-[14px] tw:text-[#4e6586]">Save communication permissions with Review communication changes below. The profile Save button updates personal details only.</p>
    {borrowerMockMode ? <p className="tw:mb-5 tw:rounded-xl tw:bg-[#edf6fb] tw:p-4 tw:text-[14px]">Preview consent wording and records only. RTR approval and durable backend records are required for production.</p> : null}
    {data.preferences.restrictions.map((restriction, index) => <p key={index} className="tw:mb-3 tw:rounded-xl tw:bg-[#fff3e9] tw:p-4">{restriction.message}</p>)}
    {data.preferences.choices.map(choice => <div key={choice.channel} className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:border-b tw:border-[#d8dcdf] tw:py-5">
      <div className="tw:min-w-0"><label htmlFor={`consent-${loanId}-${choice.channel}`} className="tw:block tw:font-medium">{choice.label}</label><p className="tw:mt-2 tw:text-[14px] tw:text-[#4e6586]">{choice.consentText || "Consent wording unavailable. This choice cannot be changed."}</p><p className="tw:mt-2 tw:break-words tw:text-[12px] tw:text-[#4e6586]">Version: {choice.consentTextVersion || "Unavailable"}</p></div>
      <input id={`consent-${loanId}-${choice.channel}`} className="tw:mt-1 tw:size-6 tw:shrink-0 tw:accent-[#007bb5]" type="checkbox" role="switch" checked={draft[choice.channel] ?? choice.enabled} disabled={pending || !choice.editable || !choice.consentText.trim() || !choice.consentTextVersion.trim()} onChange={event => { setDraft(previous => ({ ...previous, [choice.channel]: event.target.checked })); setAcceptedKey(""); setAccessKey(""); setEsignKey(""); setMessage(""); }} />
    </div>)}
    <p className="tw:mt-5 tw:rounded-xl tw:bg-[#edf6fb] tw:p-4 tw:text-[14px]">Last consent change: {last ? `${new Date(last.recordedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT · ${last.source === "PORTAL" ? "You (portal)" : `${last.source} — operator identity unavailable`}` : data.preferences.lastChangedAt ? `${new Date(data.preferences.lastChangedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT · Actor not available` : "Not recorded. Actor not available."}</p>
    <button type="button" className={cn(action, "tw:mt-5")} disabled={!validWording || pending} onClick={() => { onReview(); setAcceptedKey(""); setMessage(""); setReview(true); }}>Review communication changes</button>
    {!changes.length ? <p className="tw:mt-2 tw:text-[13px] tw:text-[#4e6586]">Change an available communication choice above to enable review.</p> : null}
    {message ? <p className="tw:mt-4 tw:break-words" role="status">{message}</p> : null}
    {data.history.length ? <details className="tw:mt-6"><summary className="tw:cursor-pointer tw:font-medium">Your consent history</summary><ol className="tw:mt-4 tw:grid tw:gap-4">{data.history.map(record => <li key={record.consentId} className="tw:rounded-xl tw:border tw:border-[#d8dcdf] tw:p-4 tw:break-words"><p>{record.channel}: {record.enabled ? "Enabled" : "Disabled"}</p><p className="tw:text-[14px]">{record.recordedAt} · {record.source} · Version {record.consentTextVersion}</p>{"consentText" in record ? <p className="tw:mt-2 tw:text-[14px]">{record.consentText}</p> : null}{"disclosureVersion" in record && record.disclosureVersion ? <p className="tw:mt-2 tw:text-[14px]">E-SIGN version: {record.disclosureVersion} · Document access confirmed</p> : null}</li>)}</ol></details> : null}
    <dialog onKeyDown={handleDialogKeyDown} ref={ref} className={dialog} aria-labelledby={`consent-review-${loanId}`} onCancel={event => { event.preventDefault(); if (!pending) setReview(false); }}><div className={dialogContent}>
      <button type="button" className={dialogClose} aria-label="Close consent review" disabled={pending} onClick={() => setReview(false)}>×</button>
      <h2 id={`consent-review-${loanId}`} className={dialogTitle}>Review communication changes</h2>
      {changes.map(choice => <section key={choice.channel} className="tw:mb-4 tw:rounded-xl tw:bg-[#edf6fb] tw:p-4 tw:break-words"><h3 className="tw:font-medium">{choice.label}: {choice.enabled ? "Enable" : "Disable"}</h3><p className={dialogText}>{choice.consentText}</p><p className="tw:text-[13px]">Version: {choice.consentTextVersion}</p></section>)}
      {withdrawing ? <p className={dialogText}>You are withdrawing paper-free statement delivery for this loan. Payments and other communication permissions are separate. Contact Customer Solutions for paper-copy requests and production delivery arrangements.</p> : null}
      {enrolling ? data.disclosure ? <section className="tw:mt-5 tw:border-t tw:border-[#d8dcdf] tw:pt-5"><h3 className="tw:font-medium">{data.disclosure.title}</h3><p className="tw:mt-3 tw:whitespace-pre-line tw:text-[15px] tw:leading-relaxed">{data.disclosure.text}</p><p className="tw:my-4 tw:break-words tw:text-[13px]">Disclosure version: {data.disclosure.version}</p><button type="button" className={action} disabled={pending} onClick={() => void sample()}>Download sample PDF</button><label className="tw:my-5 tw:flex tw:items-start tw:gap-3"><input className="tw:mt-1 tw:size-5 tw:shrink-0" type="checkbox" checked={accessKey === disclosureKey} disabled={accessedVersion !== data.disclosure.version || pending} onChange={event => setAccessKey(event.target.checked ? disclosureKey : "")} /><span>I opened the sample PDF and can access and retain electronic documents.</span></label><label className="tw:my-5 tw:flex tw:items-start tw:gap-3"><input className="tw:mt-1 tw:size-5 tw:shrink-0" type="checkbox" checked={esignKey === disclosureKey} disabled={pending} onChange={event => setEsignKey(event.target.checked ? disclosureKey : "")} /><span>I accept this E-SIGN disclosure and choose paper-free statements for this loan.</span></label></section> : <p className={dialogText}>Paper-free enrollment is unavailable until the approved disclosure and acceptance API are connected. Contact Customer Solutions.</p> : null}
      <label className="tw:my-5 tw:flex tw:items-start tw:gap-3"><input className="tw:mt-1 tw:size-5 tw:shrink-0" type="checkbox" checked={acceptedKey === fingerprint && Boolean(changes.length)} disabled={!validWording || pending} onChange={event => setAcceptedKey(event.target.checked ? fingerprint : "")} /><span>I confirm the exact communication choices and wording shown above.</span></label>
      {message ? <p role="alert" className="tw:my-4 tw:break-words">{message}</p> : null}
      <div className={dialogActions}><button type="button" className={cn(dialogButton, button.outline, button.element)} disabled={pending} onClick={() => setReview(false)}>Edit choices</button><button type="button" className={cn(dialogButton, button.primary, button.element)} disabled={!ready || pending} onClick={() => void save()}>{pending ? "Saving..." : withdrawing ? "Confirm withdrawal" : "Save communication choices"}</button></div>
    </div></dialog>
  </div>;
}
