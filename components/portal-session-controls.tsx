"use client";
import { button, cn } from "./portal-ui";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getMe } from "@/lib/api/generated/me/me";
import { setPortalTokenProvider, ApiError } from "@/lib/api/http";
import { borrowerMockMode } from "@/lib/mock-mode";
import { waitForMockWorker } from "@/lib/mock-worker-ready";
import { returnToSignIn } from "@/lib/portal-auth-return";

const warningAfter = 13 * 60_000;
const expiresAfter = 15 * 60_000;

  function hide() {
    const main = document.querySelector<HTMLElement>(".portal-main");
    if (main) main.style.setProperty("visibility", "hidden", "important");
  }
  function expire() {
    hide();
    returnToSignIn("expired");
  }

export default function PortalSessionControls() {
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);
  const resume = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let lastActivity = Date.now(), lastRefresh = 0, refreshing = false, warned = false, active = true, present = true;
    async function validate(explicit = false) {
      if (!present) return;
      if (Date.now() - lastActivity >= expiresAfter) { expire(); return; }
      if (refreshing) return;
      refreshing = true;
      try {
        await waitForMockWorker();
        const response = borrowerMockMode ? await fetch("/api/auth/session", { method: "POST", cache: "no-store", signal: AbortSignal.timeout(10_000) }) : await getMe({ signal: AbortSignal.timeout(10_000) }).then(() => new Response(null, { status: 204 }));
        if (!active || !present) return;
        if (response.status === 401) { expire(); return; }
        if (!response.ok) throw new Error("Session verification failed.");
        lastRefresh = Date.now();
        if (explicit) { lastActivity = Date.now(); warned = false; setWarning(false); }
        setVerified(true); setError("");
        const main = document.querySelector<HTMLElement>(".portal-main");
        if (main) main.style.removeProperty("visibility");
      } catch (failure) {
        if (failure instanceof ApiError && failure.status === 401) { expire(); return; }
        if (active && present) { hide(); setVerified(false); setError("Could not verify your session. Check your connection and try again."); }
      } finally { refreshing = false; }
    }
    const activity = () => {
      if (!present) return;
      if (Date.now() - lastActivity >= expiresAfter) { expire(); return; }
      if (warned) return;
      lastActivity = Date.now();
      if (Date.now() - lastRefresh >= 60_000) void validate();
    };
    const hideOnLeave = () => { present = false; hide(); setVerified(false); };
    const validateOnReturn = () => { present = true; hide(); setVerified(false); void validate(); };
    resume.current = async () => { setPending(true); try { await validate(true); } finally { if (active) setPending(false); } };
    void validate();
    window.addEventListener("pagehide", hideOnLeave);
    window.addEventListener("pageshow", validateOnReturn);
    window.addEventListener("popstate", validateOnReturn);
    const visibility = () => { if (document.visibilityState === "visible") validateOnReturn(); };
    document.addEventListener("visibilitychange", visibility);
    const timer = window.setInterval(() => {
      if (!present) return;
      const idle = Date.now() - lastActivity;
      if (idle >= expiresAfter) expire();
      else if (idle >= warningAfter && !warned) { warned = true; setWarning(true); }
    }, 1000);
    for (const event of ["pointerdown", "keydown", "scroll"]) window.addEventListener(event, activity, { passive: true });
    return () => {
      active = false; window.clearInterval(timer);
      window.removeEventListener("pagehide", hideOnLeave); window.removeEventListener("pageshow", validateOnReturn); window.removeEventListener("popstate", validateOnReturn);
      document.removeEventListener("visibilitychange", visibility);
      for (const event of ["pointerdown", "keydown", "scroll"]) window.removeEventListener(event, activity);
    };
  }, []);
  async function signOut() {
    setPending(true); setError(""); hide(); setVerified(false);
    try {
      await waitForMockWorker();
      const response = borrowerMockMode ? await fetch("/api/auth/sign-out", { method: "POST", signal: AbortSignal.timeout(10_000) }) : new Response(null, { status: 204 });
      if (!borrowerMockMode) setPortalTokenProvider(async () => null);
      if (!response.ok && response.status !== 401) throw new Error("Sign-out failed.");
      returnToSignIn("signed-out");
    } catch { setError("Could not complete sign-out. Your account view is hidden. Retry Log out."); }
    finally { setPending(false); }
  }
  return <div>
    {!verified ? <style>{".portal-main { visibility: hidden !important; }"}</style> : null}
    <button className={cn(button.base, button.outline, button.element, "tw:min-w-[150px] tw:max-compact:min-w-[100px] tw:max-mobile:w-full")} onClick={() => void signOut()} disabled={pending}>{pending ? "Please wait..." : "Log out"}</button>
    {error ? <div role="alert" className="tw:mt-3 tw:max-w-[300px] tw:text-[14px]"><p>{error}</p><button type="button" className="tw:mt-2 tw:underline" disabled={pending} onClick={() => void resume.current()}>Retry session check</button></div> : null}
    {warning ? createPortal(<div className="tw:fixed tw:right-5 tw:bottom-5 tw:z-50 tw:w-[min(400px,calc(100%_-_40px))] tw:rounded-2xl tw:border tw:border-(--pp-line) tw:bg-white tw:p-6 tw:shadow-lg tw:max-mobile:right-4 tw:max-mobile:bottom-[110px] tw:max-mobile:left-4 tw:max-mobile:w-auto tw:print:hidden" role="alert"><p>Still there? Your session expires after 15 minutes of inactivity.</p><button type="button" className={cn(button.base, button.primary, button.element, "tw:mt-4")} disabled={pending} onClick={() => void resume.current()}>{pending ? "Checking..." : "Stay signed in"}</button></div>, document.querySelector(".portal") ?? document.body) : null}
  </div>;
}
