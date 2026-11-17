"use client";

import { cn } from "./portal-ui";
import { authCard, authHeading, authForm, authField, authInput, authAction, authMessage, siteButton } from "./site-ui";

import { useEffect, useState } from "react";
import HomeRegister from "./home-register";
import { useRouter } from "next/navigation";
import { borrowerMockMode } from "@/lib/mock-mode";
import { waitForMockWorker } from "@/lib/mock-worker-ready";

export default function HomeSignIn({ phone }: { phone: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pending, setPending] = useState(false);
  const [registering,setRegistering]=useState(false);
  const [registeredEmail,setRegisteredEmail]=useState("");
  const [recovering, setRecovering] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void waitForMockWorker().then(() => { if (active) setReady(true); }).catch(() => {
      if (active) { setReady(true); setMessage("The sign-in service is still starting. Please try again."); }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const legacyReturn = url.searchParams.get("session") === "expired" ? "expired" : url.searchParams.has("signedOut") ? "signed-out" : null;
    const returnReason = sessionStorage.getItem("rtr-auth-return") ?? legacyReturn;
    if (!returnReason) return;
    sessionStorage.removeItem("rtr-auth-return");
    if (legacyReturn) window.history.replaceState(window.history.state, "", "/");
    const frame = requestAnimationFrame(() => {
      if (returnReason === "expired") setMessage("Your session expired. Sign in again.");
      document.getElementById("sign-in")?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(()=>{
    const sync=()=>{const registration=window.location.hash==='#register';setRegistering(registration);if(registration){setVerifying(false);setMessage('');}};
    sync();window.addEventListener('hashchange',sync);
    return()=>window.removeEventListener('hashchange',sync);
  },[]);
  useEffect(()=>{
    const target=registering?'register':'sign-in';
    if(window.location.hash!==`#${target}`)return;
    const frame=requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[registering]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!borrowerMockMode) { setMessage("The sign-in service is not connected. Contact Customer Solutions for account access."); return; }
    const values = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      await waitForMockWorker();
      const response = await fetch(verifying ? "/api/auth/verify" : "/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifying ? { code: values.get("code") } : { email: values.get("email"), password: values.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Sign-in failed. Please try again."); return; }
      if (data.requiresVerification) { setVerifying(true); return; }
      if (data.redirectTo === "/dashboard") router.push("/dashboard");
    } catch { setMessage(`We couldn't reach the server. Please try again, or call ${phone}.`); }
    finally { setPending(false); }
  }

  if(registering)return <HomeRegister phone={phone} onComplete={email=>{setRegisteredEmail(email);setRegistering(false);setVerifying(false);setMessage('Your account has been created. Sign in with your email and password.');window.location.hash='sign-in';}}/>;

  if (recovering) return <div id="sign-in" className={authCard}><h2 className={authHeading}>Account recovery</h2><p className="tw:text-[16px] tw:leading-relaxed">{borrowerMockMode ? "Password-reset emails and authenticator recovery are not connected in this preview. Your password has not changed." : "Use the approved RTR account-recovery process. Contact Customer Solutions if you cannot access your email or authenticator."}</p><a className={cn("tw:my-5 tw:block tw:text-site-blue tw:underline")} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>Contact Customer Solutions: {phone}</a><button type="button" className={siteButton("outline", authAction)} onClick={() => setRecovering(false)}>Back to sign in</button></div>;

  return (
    <div id="sign-in" className={authCard}>
      <h2 className={authHeading}>{verifying ? "Verify your sign-in" : "Sign in to your Account"}</h2>

      <form className={authForm} method="post" onSubmit={handleSubmit}>
        {verifying ? <>
          <p className="tw:m-0">Enter your six-digit verification code.</p>
          {borrowerMockMode ? <p className="tw:text-[14px] tw:leading-relaxed">Use the verification code provided by your project team. No email is sent from this preview.</p> : null}
          <label className={authField}>
            <span>Verification code</span>
            <input className={authInput} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus />
          </label>
          <button className={siteButton("blue", cn(authAction, "tw:mt-2.5 tw:max-site-mobile:mt-1.5"))} type="submit" disabled={!ready || pending}>{pending ? "Verifying…" : "Verify and sign in"}</button>
          <button className={siteButton("outline", cn(authAction, "tw:max-site-mobile:-mt-1.5"))} type="button" disabled={pending} onClick={() => { setVerifying(false); setMessage(""); }}>Back to sign in</button>
        </> : <>
        <label className={authField}>
          <span>Email</span>
          <input className={authInput} type="email" name="email" placeholder="Enter Email" autoComplete="username" maxLength={254} defaultValue={registeredEmail} required />
        </label>

        <div className={authField}>
          <span className="tw:flex tw:items-baseline tw:justify-between"><label htmlFor="borrower-sign-in-password">Password</label> <button type="button" className="tw:border-0 tw:bg-transparent tw:p-0 tw:text-xs tw:font-semibold tw:text-site-blue tw:underline" onClick={() => setRecovering(true)}>Forgot password?</button></span>
          <span className="tw:relative tw:block">
            <input className={cn(authInput, "tw:pr-[52px]")} type={showPassword ? "text" : "password"} id="borrower-sign-in-password" name="password" placeholder="••••••••••" autoComplete="current-password" maxLength={256} required />
            <button className="tw:absolute tw:top-1/2 tw:right-2 tw:grid tw:size-[38px] tw:-translate-y-1/2 tw:cursor-pointer tw:place-items-center tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:text-site-blue" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
              <svg className="tw:size-5 tw:fill-none tw:stroke-current tw:stroke-[1.8] tw:[stroke-linecap:round]" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword ? null : <path d="M4 4l16 16" />}
              </svg>
            </button>
          </span>
        </div>

        <button className={siteButton("blue", cn(authAction, "tw:mt-2.5 tw:max-site-mobile:mt-1.5"))} type="submit" disabled={!ready || pending}>{pending ? "Signing in…" : "Sign in to your Account"}</button>
        <a className={siteButton("outline", cn(authAction, "tw:max-site-mobile:-mt-1.5"))} href="#register">Register Now</a>
        </>}
        {message ? <p className={authMessage} role="status">{message}</p> : null}
      </form>
    </div>
  );
}
