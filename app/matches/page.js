'use client';

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function formatDate(value) {
  if (!value) return "Date TBC";
  return new Intl.DateTimeFormat("en-GH", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(value));
}

function Team({ team }) {
  return <div className="mc-team">
    <div className="mc-logo">{team?.logo_url ? <img src={team.logo_url} alt="" /> : <span>{(team?.short_name || team?.name || "?").slice(0,2).toUpperCase()}</span>}</div>
    <strong>{team?.short_name || team?.name || "Team TBC"}</strong>
  </div>;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [official, setOfficial] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0,10));
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    async function load() {
      const [m, v] = await Promise.all([
        supabase.from("matches").select("id,scheduled_at,status,home_score,away_score,home_team:teams!matches_home_team_id_fkey(id,name,short_name,logo_url),away_team:teams!matches_away_team_id_fkey(id,name,short_name,logo_url),season:seasons(id,name,competition:competitions(id,name))").order("scheduled_at", { ascending: true }).limit(100),
        supabase.from("match_verifications").select("match_id").eq("official_result", true)
      ]);
      if (m.error || v.error) {
        setError((m.error || v.error).message || "Matches could not be loaded.");
      } else {
        setMatches(m.data || []);
        setOfficial(new Set((v.data || []).map(x => x.match_id)));
      }
      setLoading(false);
    }
    load();
  }, []);

  const days = useMemo(() => { const out=[]; for(let i=0;i<8;i++){ const d=new Date(); d.setDate(d.getDate()+i); out.push({key:d.toISOString().slice(0,10), label:i===0?"Today":i===1?"Tomorrow":new Intl.DateTimeFormat("en-GH",{weekday:"short"}).format(d), date:new Intl.DateTimeFormat("en-GH",{day:"numeric",month:"short"}).format(d)}); } return out; }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return matches.filter(m => {
      const matchDate = new Date(m.scheduled_at).toISOString().slice(0,10);
      if (matchDate !== selectedDate) return false;
      const isOfficial = official.has(m.id);
      const isUpcoming = new Date(m.scheduled_at).getTime() >= now && !["finished","verified"].includes(m.status);
      const isLive = ["live","in_progress","halftime"].includes(m.status);
      if (filter === "upcoming") return isUpcoming;
      if (filter === "live") return isLive;
      if (filter === "results") return isOfficial && ["finished","verified"].includes(m.status);
      return isUpcoming || isLive || (isOfficial && ["finished","verified"].includes(m.status));
    }).sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [matches, official, filter]);

  return <main>
    <section className="container page-hero">
      <span className="section-kicker">Zedek Sports</span>
      <h1>Match Centre</h1>
      <p>Fixtures, live football and verified results from local football across Oti.</p>
    </section>

    <section className="container match-centre">
      <div className="mc-date-strip">{days.map(d => <button key={d.key} className={selectedDate === d.key ? "mc-day active" : "mc-day"} onClick={() => setSelectedDate(d.key)}><b>{d.label}</b><span>{d.date}</span></button>)}<label className="mc-calendar"><span>Calendar</span><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></label></div>

      <div className="mc-tabs">
        {[
          ["all","All football"],["upcoming","Upcoming"],["live","Live"],["results","Results"]
        ].map(([key,label]) => <button key={key} className={filter === key ? "mc-tab active" : "mc-tab"} onClick={() => setFilter(key)}>{label}</button>)}
      </div>

      {error ? <div className="data-note">{error}</div> : null}
      {loading ? <div className="empty-state">Loading football…</div> : null}
      {!loading && !error && !visible.length ? <div className="empty-state"><strong>No matches published here yet.</strong><span>Official fixtures and verified results will appear automatically when available.</span></div> : null}

      <div className="match-list">
        {visible.map(m => {
          const isOfficial = official.has(m.id);
          const isLive = ["live","in_progress","halftime"].includes(m.status);
          return <a className="mc-match" href={"/matches/" + m.id} key={m.id}>
            <div className="mc-meta">
              <span>{m.season?.competition?.name || "Competition TBC"}</span>
              <span className={isLive ? "live-dot" : ""}>{isLive ? "LIVE" : isOfficial ? "OFFICIAL" : formatDate(m.scheduled_at)}</span>
            </div>
            <div className="mc-teams"><Team team={m.home_team} /><div className="mc-score">{isOfficial || isLive ? <><b>{m.home_score ?? 0}</b><span>—</span><b>{m.away_score ?? 0}</b></> : <span>vs</span>}</div><Team team={m.away_team} /></div>
            <div className="mc-footer"><span>{formatDate(m.scheduled_at)}</span><span>View match →</span></div>
          </a>;
        })}
      </div>
    </section>
  </main>;
}
