"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/control-room";
      }
    });
  }, []);

  async function signIn() {
    setMessage("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/control-room";
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand big">⚽ ZEDEK <span>SPORTS</span></div>
        <p>Football Control Room</p>

        <div className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </label>

          <button className="button primary" onClick={signIn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        {message && <div className="error-box">{message}</div>}

        <p><a className="back-link" href="/">← Back to ZEDEK SPORTS</a></p>
      </div>
    </main>
  );
}
