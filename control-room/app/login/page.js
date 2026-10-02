"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function getSupabase() {
  if (typeof window === "undefined") return null;
  return createSupabaseBrowserClient();
}

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(() => {
    const supabase=getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => {
      if (data.session) window.location.href="/";
    });
  },[]);

  async function signIn() {
    setMessage(""); setLoading(true);
    const supabase=getSupabase();
    if (!supabase) { setMessage("Supabase configuration is unavailable."); setLoading(false); return; }
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    window.location.href="/";
  }

  return <main className="auth-page"><div className="auth-card">
    <div className="brand">⚽ ZEDEK <span>SPORTS</span></div>
    <h1>Control Room</h1>
    <p className="muted">Private football operations system.</p>
    <div className="form-stack">
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>
      <button className="button primary" onClick={signIn} disabled={loading}>{loading?"Signing in...":"Sign in"}</button>
    </div>
    {message&&<div className="error-box">{message}</div>}
  </div></main>;
}