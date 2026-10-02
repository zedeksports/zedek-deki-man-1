"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function getSupabase() {
  if (typeof window === "undefined") return null;
  return createSupabaseBrowserClient();
}

export default function LoginPage() {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(() => {
    const supabase=getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => {
      if (data.session) window.location.href="/";
    });
  },[]);

  function switchMode(next) {
    setMode(next);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  async function signIn() {
    setMessage(""); setLoading(true);
    const supabase=getSupabase();
    if (!supabase) { setMessage("Supabase configuration is unavailable."); setLoading(false); return; }
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    window.location.href="/";
  }

  async function signUp() {
    setMessage("");
    if (!email || !password) { setMessage("Enter your email and password."); return; }
    if (password.length < 6) { setMessage("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
    setLoading(true);
    const supabase=getSupabase();
    if (!supabase) { setMessage("Supabase configuration is unavailable."); setLoading(false); return; }
    const {data,error}=await supabase.auth.signUp({
      email,
      password,
      options:{emailRedirectTo:window.location.origin+"/login"}
    });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    if (data.session) {
      window.location.href="/";
      return;
    }
    setMessage("Account created. Check your email to confirm your account, then sign in.");
  }

  async function resetPassword() {
    setMessage("");
    if (!email) { setMessage("Enter your email address first."); return; }
    setLoading(true);
    const supabase=getSupabase();
    if (!supabase) { setMessage("Supabase configuration is unavailable."); setLoading(false); return; }
    const {error}=await supabase.auth.resetPasswordForEmail(email,{
      redirectTo:window.location.origin+"/reset-password"
    });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setMessage("Password reset instructions have been sent to your email.");
  }

  async function submit(e) {
    e.preventDefault();
    if (mode==="signin") return signIn();
    if (mode==="signup") return signUp();
    return resetPassword();
  }

  const isReset=mode==="reset";

  return <main className="auth-page"><div className="auth-card">
    <div className="brand">⚽ ZEDEK <span>SPORTS</span></div>
    <h1>{mode==="signin"?"Control Room":mode==="signup"?"Create account":"Reset password"}</h1>
    <p className="muted">
      {mode==="signin"?"Private football operations system.":mode==="signup"?"Create your ZEDEK SPORTS Control Room account.":"Enter your email and we’ll send you a password reset link."}
    </p>

    <form className="form-stack" onSubmit={submit}>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>

      {!isReset&&<label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"} required/></label>}

      {mode==="signup"&&<label>Confirm password<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" required/></label>}

      <button className="button primary" type="submit" disabled={loading}>
        {loading?"Please wait...":mode==="signin"?"Sign in":mode==="signup"?"Sign up":"Send reset link"}
      </button>
    </form>

    {message&&<div className={message.includes("sent")||message.includes("created")?"success-box":"error-box"}>{message}</div>}

    <div className="auth-links">
      {mode!=="signin"&&<button type="button" className="link-button" onClick={()=>switchMode("signin")}>Back to sign in</button>}
      {mode==="signin"&&<><button type="button" className="link-button" onClick={()=>switchMode("signup")}>Create an account</button><button type="button" className="link-button" onClick={()=>switchMode("reset")}>Forgot password?</button></>}
      {mode==="signup"&&<button type="button" className="link-button" onClick={()=>switchMode("reset")}>Forgot password?</button>}
    </div>
  </div></main>;
}
