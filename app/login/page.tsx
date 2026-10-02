"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/control-room";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page auth-page">
      <section className="container auth-card">
        <div className="eyebrow">ZEDEK SPORTS SCORE</div>
        <h1>Control Room Login</h1>
        <p>Sign in with an authorised ZEDEK account.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        {message && <div className="error-box">{message}</div>}
        <a className="back-link" href="/">← Back to public site</a>
      </section>
    </main>
  );
}
