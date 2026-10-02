"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function updatePassword(e) {
    e.preventDefault();
    setMessage("");
    if (password.length < 6) { setMessage("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
    setLoading(true);
    const supabase=createSupabaseBrowserClient();
    const {error}=await supabase.auth.updateUser({password});
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    setMessage("Password updated successfully. You can now sign in.");
    setTimeout(()=>{ window.location.href="/login"; },1200);
  }

  return <main className="auth-page"><div className="auth-card">
    <div className="brand">⚽ ZEDEK <span>SPORTS</span></div>
    <h1>Set new password</h1>
    <p className="muted">Choose a new password for your Control Room account.</p>
    <form className="form-stack" onSubmit={updatePassword}>
      <label>New password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required/></label>
      <label>Confirm password<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" required/></label>
      <button className="button primary" type="submit" disabled={loading}>{loading?"Updating...":"Update password"}</button>
    </form>
    {message&&<div className={message.includes("successfully")?"success-box":"error-box"}>{message}</div>}
    <div className="auth-links"><button type="button" className="link-button" onClick={()=>window.location.href="/login"}>Back to sign in</button></div>
  </div></main>;
}
