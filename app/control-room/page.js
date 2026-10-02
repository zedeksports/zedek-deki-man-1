"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

const modules = [
  ["Competitions", "Manage competitions, formats and seasons."],
  ["Teams & Players", "Manage clubs, squads and player records."],
  ["Coaches", "Manage coaches, assignments and history."],
  ["Fixtures", "Create, reschedule and verify fixtures."],
  ["Match Control", "Operate live matches, score and events."],
  ["Lineups", "Starting XI, substitutes, captain and formation."],
  ["Reports & Verification", "Reports, corrections and official results."],
  ["Statistics Hub", "Official team, player and competition intelligence."]
];

export default function ControlRoomPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    async function load() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.session?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.session.user);

      const result = await supabase
        .from("profiles")
        .select("role,is_active,full_name")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (!active) return;

      if (result.error) {
        setMessage(result.error.message);
      } else {
        setProfile(result.data);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <main className="auth-page"><div className="panel">Loading ZEDEK Sports Control Room...</div></main>;
  }

  if (!user || !profile) {
    return (
      <main className="auth-page">
        <div className="panel">
          <h1>Access unavailable</h1>
          <p>{message || "Your administrator profile could not be loaded."}</p>
          <button className="button" onClick={signOut}>Sign out</button>
        </div>
      </main>
    );
  }

  if (!profile.is_active || !["super_admin", "zedek_admin"].includes(profile.role)) {
    return (
      <main className="auth-page">
        <div className="panel">
          <h1>Access restricted</h1>
          <p>This account is authenticated but is not an active ZEDEK Sports administrator.</p>
          <button className="button" onClick={signOut}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="container nav">
          <a className="brand" href="/">ZEDEK <span>SPORTS</span></a>
          <nav className="nav-links">
            <a href="/">Public Site</a>
            <button className="button" onClick={signOut}>Sign out</button>
          </nav>
        </div>
      </header>

      <section className="container page-header">
        <div className="eyebrow">Football Operations</div>
        <h1>Control Room</h1>
        <p>
          {profile.full_name || user.email} · {profile.role}
        </p>
        {message && <div className="error-box">{message}</div>}
      </section>

      <section className="container module-grid">
        {modules.map(([title, description]) => (
          <article className="module" key={title}>
            <strong>{title}</strong>
            <small>{description}</small>
          </article>
        ))}
      </section>
    </main>
  );
}
