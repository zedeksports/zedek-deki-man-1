"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function ControlRoomShell({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: profile, error } = await supabase
        .from("profiles").select("role,is_active").eq("id", user.id).maybeSingle();

      if (!active) return;
      if (error) { setMessage(error.message); setChecking(false); return; }

      const admin = profile?.is_active && (profile.role === "super_admin" || profile.role === "zedek_admin");
      if (!admin) {
        setMessage("This account is not authorised for the Control Room.");
        setChecking(false);
        return;
      }

      setAllowed(true);
      setChecking(false);
    }
    checkAccess();
    return () => { active = false; };
  }, []);

  if (checking) return <main className="page"><section className="container page-header"><h1>Checking access…</h1><p>Verifying your ZEDEK Control Room account.</p></section></main>;

  if (!allowed) return <main className="page"><section className="container auth-card"><div className="eyebrow">ACCESS DENIED</div><h1>Control Room</h1><p>{message}</p><a className="button" href="/">Return home</a></section></main>;

  return <>{children}</>;
}
