"use client";

import { useState } from "react";

export default function HomeSignIn({ phone }: { phone: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(`Online account access is coming soon. Please call ${phone} for help with your account.`);
  }

  return (
    <div id="sign-in" className="hm-signin">
      <h2>Sign in to your Account</h2>
      <p className="hm-signin-sub">Quick Verification using your SSN And Billing ZIP Code.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label className="hm-field">
          <span>Username or Email</span>
          <input type="text" name="username" placeholder="Enter Email" autoComplete="username" />
        </label>

        <label className="hm-field">
          <span className="hm-field-row">Password <a href="#sign-in">Forget Password</a></span>
          <span className="hm-password">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••••" autoComplete="current-password" />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword ? null : <path d="M4 4l16 16" />}
              </svg>
            </button>
          </span>
        </label>

        <button className="hm-btn hm-btn-blue hm-btn-block" type="submit">Sign in to your Account</button>
        <a className="hm-btn hm-btn-outline hm-btn-block" href="#sign-in">Register Now</a>
        {message ? <p className="hm-signin-message" role="status">{message}</p> : null}
      </form>
    </div>
  );
}
