"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Counts = {
  competitions: number;
  seasons: number;
  teams: number;
  players: number;
  matches: number;
};

export default function ControlRoomDashboard() {
  const [counts, setCounts] = useState<Counts>({ competitions: 0, seasons: 0, teams: 0, players: 0, matches: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Connecting to ZEDEK data...");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const results = await Promise.all([
          supabase.from("competitions").select("id", { count: "exact", head: true }),
          supabase.from("seasons").select("id", { count: "exact", head: true }),
          supabase.from("teams").select("id", { count: "exact", head: true }),
          supabase.from("players").select("id", { count: "exact", head: true }),
          supabase.from("matches").select("id", { count: "exact", head: true })
        ]);
        const failed = results.find((result) => result.error);
        if (failed?.error) throw new Error(failed.error.message);
        if (!active) return;
        setCounts({
          competitions: results[0].count ?? 0,
          seasons: results[1].count ?? 0,
          teams: results[2].count ?? 0,
          players: results[3].count ?? 0,
          matches: results[4].count ?? 0
        });
        setMessage("Connected to ZEDEK SPORTS SCORE database.");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to connect to Supabase.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const cards = [
    ["Competitions", counts.competitions, "/control-room/competitions"],
    ["Seasons", counts.seasons, "/control-room/seasons"],
    ["Teams", counts.teams, "/control-room/teams"],
    ["Players", counts.players, "/control-room/players"],
    ["Matches", counts.matches, "/control-room/matches"]
  ];

  return (
    <>
      <div className="status-card">
        <strong>{loading ? "Connecting..." : "Data status"}</strong>
        <span>{message}</span>
      </div>
      <div className="module-grid">
        {cards.map(([label, count, href]) => (
          <a className="module" href={String(href)} key={label}>
            <strong>{label}</strong>
            <small>{count} records</small>
          </a>
        ))}
      </div>
    </>
  );
}
