'use client';

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

function dateLabel(value) {
  if (!value) return "Date TBC";
  return new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function HomeLiveData() {
  const [state, setState] = useState({ upcoming: [], results: [], teams: 0, competitions: 0, loading: true, error: "" });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    async function load() {
      try {
        const [matches, verifications, teams, competitions] = await Promise.all([
          supabase.from("matches").select("id,scheduled_at,status,home_score,away_score,home_team:teams!matches_home_team_id_fkey(id,name,short_name,logo_url),away_team:teams!matches_away_team_id_fkey(id,name,short_name,logo_url),season:seasons(id,name,competition:competitions(id,name))").order("scheduled_at", { ascending: true }).limit(24),
          supabase.from("match_verifications").select("match_id").eq("official_result", true),
          supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("competitions").select("id", { count: "exact", head: true }).eq("is_active", true)
        ]);
        if (matches.error) throw matches.error;
        if (verifications.error) throw verifications.error;
        const official = new Set((verifications.data || []).map(x => x.match_id));
        const now = Date.now();
        const all = matches.data || [];
        setState({
          upcoming: all.filter(x => new Date(x.scheduled_at).getTime() >= now && !["finished", "verified"].includes(x.status)).slice(0, 4),
          results: all.filter(x => official.has(x.id) && ["finished", "verified"].includes(x.status)).sort((a,b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).slice(0, 4),
          teams: teams.count || 0,
          competitions: competitions.count || 0,
          loading: false,
          error: ""
        });
      } catch (error) {
        setState(x => ({ ...x, loading: false, error: error.message || "Football data could not be loaded." }));
      }
    }
    load();
  }, []);

  return <section className="container section">
    <div className="section-heading">
      <div><span className="section-kicker">What's happening</span><h2>Football, at a glance.</h2></div>
      <a href="/matches" className="quiet-link">View all →</a>
    </div>
    {state.error ? <div className="data-note">{state.error}</div> : null}
    <div className="home-dashboard">
      <div className="dashboard-card">
        <div className="card-heading"><div><span className="section-kicker">Next up</span><h3>Upcoming matches</h3></div><span className="count-pill">{state.upcoming.length}</span></div>
        {state.loading ? <div className="empty-state">Loading fixtures…</div> : state.upcoming.length ? state.upcoming.map(m => <a className="match-row" href={"/matches/" + m.id} key={m.id}><div><small>{m.season?.competition?.name || "Competition TBC"} • {dateLabel(m.scheduled_at)}</small><strong>{m.home_team?.short_name || m.home_team?.name || "Home team"}</strong><br/><strong>{m.away_team?.short_name || m.away_team?.name || "Away team"}</strong></div><span className="row-arrow">→</span></a>) : <div className="empty-state"><strong>No official fixtures published yet.</strong><span>Published fixtures will appear here.</span></div>}
      </div>
      <div className="dashboard-card">
        <div className="card-heading"><div><span className="section-kicker">Official</span><h3>Recent results</h3></div><span className="count-pill">{state.results.length}</span></div>
        {state.loading ? <div className="empty-state">Loading results…</div> : state.results.length ? state.results.map(m => <a className="result-row" href={"/matches/" + m.id} key={m.id}><div><small>{m.season?.competition?.name || "Competition"} • {dateLabel(m.scheduled_at)}</small><strong>{m.home_team?.short_name || m.home_team?.name || "Home team"} {m.home_score} — {m.away_score} {m.away_team?.short_name || m.away_team?.name || "Away team"}</strong></div><span className="verified-badge">✓</span></a>) : <div className="empty-state"><strong>No verified results yet.</strong><span>Zedek Sports will never present an unverified result as official.</span></div>}
      </div>
    </div>
    <div className="stats-strip home-stats"><div><b>{state.teams}</b><span>Active teams</span></div><div><b>{state.competitions}</b><span>Competitions</span></div><div><b>Oti</b><span>Football focus</span></div><div><b>✓</b><span>Verified results</span></div></div>
  </section>;
}
