"use client";

import { cn } from "./portal-ui";
import { authCard, authHeading, authForm, authField, authInput, authAction, authMessage, siteButton } from "./site-ui";

import { nonBlankPattern } from "@/lib/form-validation";
import { demoRegistration } from "@/lib/demo-login";
import { borrowerMockMode } from "@/lib/mock-mode";
import { ApiError } from "@/lib/api/http";
import { getLegalDocument } from "@/lib/api/generated/public/public";
import { verifyLoanForRegistration, sendRegistrationCode, verifyRegistrationCode, completeRegistration } from "@/lib/api/generated/registration/registration";
import { useState } from "react";

export default function HomeRegister({phone,onComplete}:{phone:string;onComplete:(email:string)=>void}) {
  const [accountNumber,setAccountNumber]=useState("");
  const [registrationId,setRegistrationId]=useState("");
  const [disclosures,setDisclosures]=useState<{termsVersion:string;esignVersion:string;terms:string;esign:string}>();
  const [step,setStep]=useState<"identity"|"verify"|"password">("identity");
  const [pending,setPending]=useState(false),[message,setMessage]=useState("");
  const [email,setEmail]=useState(""),[ssn,setSsn]=useState(""),[zip,setZip]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage("");
    const values=new FormData(event.currentTarget);
    if(borrowerMockMode && step==='identity' && email!==demoRegistration.email){setMessage("These details could not be verified in this preview. Contact your project team for access.");return;}
    if(step==='password'&&values.get('password')!==values.get('confirmPassword')){setMessage('Passwords do not match. Please enter them again.');return;}
    setPending(true);
    try {
      {
        if (step === "identity") { const result = await verifyLoanForRegistration({ accountNumber, ssnLast4: ssn, zipCode: zip }); const contact = result.contactOptions.find(option => option.channel === "EMAIL"); if (!contact) { setMessage("Please call RTR to verify your contact details."); return; } await sendRegistrationCode(result.registrationId, { contactOptionId: contact.contactOptionId }); setRegistrationId(result.registrationId); setSsn(""); setZip(""); setStep("verify"); }
        else if (step === "verify") { await verifyRegistrationCode(registrationId, { code: String(values.get("registrationCode") ?? "") }); const [terms, esign] = await Promise.all([getLegalDocument("TERMS_OF_USE"), getLegalDocument("ESIGN_DISCLOSURE")]); setDisclosures({ termsVersion: terms.version, esignVersion: esign.version, terms: terms.bodyMarkdown, esign: esign.bodyMarkdown }); setStep("password"); }
        else { if (!disclosures || values.get("acceptDisclosures") !== "on") { setMessage("Accept the displayed Terms and E-SIGN disclosure."); return; } const result = await completeRegistration(registrationId, { email, password: String(values.get("password") ?? ""), acceptedTermsVersion: disclosures.termsVersion, acceptedEsignVersion: disclosures.esignVersion }); onComplete(result.username); }
        return;
      }

    } catch (error) {setMessage(error instanceof ApiError ? error.message : `We couldn't reach the server. Try again, or call ${phone}.`);}
    finally {setPending(false);}
  }
  return <div id="register" className={cn("hm-register", authCard)}>
    <div className="tw:mb-[22px] tw:flex tw:gap-1.5 tw:rounded-[9px] tw:border tw:border-solid tw:border-[#d8e3e9] tw:bg-[#f6f9fb] tw:p-1 tw:text-[13px]" aria-label="Account access"><a className="tw:flex-1 tw:rounded-md tw:p-[9px] tw:text-center" href="#sign-in">Sign in</a><span className="tw:flex-1 tw:rounded-md tw:bg-site-blue tw:p-[9px] tw:text-center tw:font-semibold tw:text-white" aria-current="page">Register</span></div>
    <h2 className={authHeading}>{step==='identity'?'Create your account':step==='verify'?'Verify your email':'Set your password'}</h2>
    <form className={authForm} key={step} onSubmit={submit}>
      {step==='identity'?<>
        {<label className={authField}><span>Loan account number</span><input className={authInput} name="accountNumber" value={accountNumber} onChange={event=>setAccountNumber(event.target.value)} maxLength={20} pattern={nonBlankPattern} placeholder="Enter your loan account number" required /></label>}
        <label className={authField}><span>SSN (last four digits)</span><input className={authInput} name="ssnLast4" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" minLength={4} maxLength={4} value={ssn} onChange={event=>setSsn(event.target.value.replace(/\D/g,''))} placeholder="Last 4 digits only" required/><small className="tw:text-[11px] tw:leading-[1.5] tw:text-[#708493]">Enter only the last four digits, never your full SSN.</small></label>
        <label className={authField}><span>ZIP code</span><input className={authInput} name="zipCode" type="text" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" minLength={5} maxLength={5} value={zip} onChange={event=>setZip(event.target.value.replace(/\D/g,''))} placeholder="5-digit ZIP code" required/></label>
        <label className={authField}><span>Email</span><input className={authInput} name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} placeholder="Enter your email address" required/></label>
      </>:step==='verify'?<label className={authField}><span>Registration code</span><input className={authInput} name="registrationCode" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="6-digit code" required autoFocus/></label>:<>
        <label className={authField}><span>Password</span><input className={authInput} name="password" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} placeholder="At least 12 characters" required autoFocus/></label>
        <label className={authField}><span>Confirm password</span><input className={authInput} name="confirmPassword" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} placeholder="Re-enter your password" required/></label>
        {disclosures ? <><details><summary>Terms of Use</summary><p>{disclosures.terms}</p></details><details><summary>E-SIGN disclosure</summary><p>{disclosures.esign}</p></details><label><input className="tw:accent-site-blue" type="checkbox" name="acceptDisclosures" required />I accept the displayed Terms of Use and E-SIGN disclosure.</label></> : null}
        <label className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-[#536a79]"><input className="tw:accent-site-blue" type="checkbox" checked={showPassword} onChange={event=>setShowPassword(event.target.checked)}/>Show passwords</label>
      </>}
      {message&&<p className={authMessage} role="alert">{message}</p>}
      <button className={siteButton("blue", cn(authAction, "tw:mt-2.5 tw:max-site-mobile:mt-1.5"))} type="submit" disabled={pending}>{pending?'Please wait…':step==='identity'?'Verify my details':step==='verify'?'Verify registration code':'Create account'}</button>
      {step!=='identity'&&<button className={siteButton("outline", cn(authAction, "tw:max-site-mobile:-mt-1.5"))} type="button" disabled={pending} onClick={()=>{setStep('identity');setMessage('');}}>Start again</button>}
      <a className="tw:text-center tw:text-xs tw:text-site-blue" href="#sign-in">Already registered? Sign in</a>
    </form>
  </div>;
}
