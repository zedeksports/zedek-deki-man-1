
"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Season = { id: string; name: string; year: number; competition_id: string };
type Competition = { id: string; name: string };
type Team = { id: string; name: string };
type Match = { id: string; season_id: string; home_team_id: string; away_team_id: string; home_score: number; away_score: number; status: string };
type Event = { match_id: string; team_id: string; player_id: string | null; event_type: string; minute: number };
type Player = { id: string; full_name: string; team_id: string };

export default function StatisticsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredTeamIds, setRegisteredTeamIds] = useState<string[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSeason(id: string) {
    const [matchRes, eventRes, registrationRes] = await Promise.all([
      supabase.from("matches").select("id,season_id,home_team_id,away_team_id,home_score,away_score,status").eq("season_id", id).in("status", ["finished", "verified"]),
      supabase.from("match_events").select("match_id,team_id,player_id,event_type,minute").in("event_type", ["goal", "own_goal"]),
      supabase.from("season_teams").select("team_id").eq("season_id", id),
    ]);
    if (matchRes.error || eventRes.error || registrationRes.error) {
      setError(matchRes.error?.message || eventRes.error?.message || registrationRes.error?.message || "Unable to load statistics.");
    } else {
      setMatches(matchRes.data || []);
      const ids = new Set((matchRes.data || []).map(m => m.id));
      setEvents((eventRes.data || []).filter(e => ids.has(e.match_id)));
      setRegisteredTeamIds((registrationRes.data || []).map(x => x.team_id));
    }
    setLoading(false);
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const [seasonRes, compRes, teamRes, playerRes] = await Promise.all([
        supabase.from("seasons").select("id,name,year,competition_id").eq("is_active", true).order("year", { ascending: false }),
        supabase.from("competitions").select("id,name").eq("is_active", true).order("name"),
        supabase.from("teams").select("id,name").eq("is_active", true).order("name"),
        supabase.from("players").select("id,full_name,team_id").eq("is_active", true).order("full_name"),
      ]);
      if (!alive) return;
      if (seasonRes.error || compRes.error || teamRes.error || playerRes.error) {
        setError(seasonRes.error?.message || compRes.error?.message || teamRes.error?.message || playerRes.error?.message || "Unable to load statistics.");
        setLoading(false);
        return;
      }
      setSeasons(seasonRes.data || []);
      setCompetitions(compRes.data || []);
      setTeams(teamRes.data || []);
      setPlayers(playerRes.data || []);
      const initial = seasonRes.data?.[0]?.id || "";
      setSeasonId(initial);
      if (initial) await loadSeason(initial); else setLoading(false);
    }
    void load();
    return () => { alive = false; };
  }, [supabase]);

  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
  const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
  const competitionMap = useMemo(() => new Map(competitions.map(c => [c.id, c.name])), [competitions]);
  const season = seasons.find(s => s.id === seasonId);
  const seasonTeams = useMemo(() => teams.filter(t => registeredTeamIds.includes(t.id)), [teams, registeredTeamIds]);

  const standings = useMemo(() => {
    const rows = new Map<string, { teamId: string; played: number; wins: number; draws: number; losses: number; gf: number; ga: number; points: number }>();
    registeredTeamIds.forEach(id => rows.set(id, { teamId: id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }));
    matches.forEach(m => {
      for (const id of [m.home_team_id, m.away_team_id]) if (!rows.has(id)) rows.set(id, { teamId: id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 });
      const h = rows.get(m.home_team_id)!; const a = rows.get(m.away_team_id)!;
      h.played++; a.played++; h.gf += m.home_score || 0; h.ga += m.away_score || 0; a.gf += m.away_score || 0; a.ga += m.home_score || 0;
      if (m.home_score > m.away_score) { h.wins++; h.points += 3; a.losses++; }
      else if (m.home_score < m.away_score) { a.wins++; a.points += 3; h.losses++; }
      else { h.draws++; a.draws++; h.points++; a.points++; }
    });
    return [...rows.values()].sort((a,b) => b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || (teamMap.get(a.teamId)||"").localeCompare(teamMap.get(b.teamId)||""));
  }, [matches, teamMap, registeredTeamIds]);

  const teamForm = useMemo(() => {
    if (!teamId) return [];
    return matches
      .filter(m => m.home_team_id === teamId || m.away_team_id === teamId)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(-5)
      .reverse()
      .map(m => {
        const home = m.home_team_id === teamId;
        const gf = home ? m.home_score : m.away_score;
        const ga = home ? m.away_score : m.home_score;
        return { ...m, opponent: teamMap.get(home ? m.away_team_id : m.home_team_id) || "Unknown team", result: gf > ga ? "W" : gf < ga ? "L" : "D", score: home ? `${m.home_score}-${m.away_score}` : `${m.away_score}-${m.home_score}` };
      });
  }, [matches, teamId, teamMap]);

  const teamSummary = useMemo(() => {
    if (!teamId) return null;
    const row = standings.find(x => x.teamId === teamId);
    if (!row) return { played: 0, gf: 0, ga: 0, points: 0, gd: 0 };
    return { played: row.played, gf: row.gf, ga: row.ga, points: row.points, gd: row.gf - row.ga };
  }, [standings, teamId]);

  const scorers = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => { if (e.event_type === "goal" && e.player_id) counts.set(e.player_id, (counts.get(e.player_id) || 0) + 1); });
    return [...counts.entries()].map(([playerId, goals]) => ({ player: playerMap.get(playerId), goals })).filter(x => x.player).sort((a,b) => b.goals-a.goals || a.player!.full_name.localeCompare(b.player!.full_name)).slice(0, 10);
  }, [events, playerMap]);

  async function changeSeason(id: string) {
    setSeasonId(id);
    setLoading(true);
    setError("");
    await loadSeason(id);
  }

  return (
    <main className="page">
      <header className="site-header"><div className="container nav"><a className="brand" href="/">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/matches">Matches</a><a href="/teams">Teams</a><a href="/competitions">Competitions</a><a href="/statistics">Statistics</a><a href="/news">News</a></nav></div></header>
      <section className="container page-header">
        <div className="eyebrow">Football intelligence</div>
        <h1>Statistics Hub</h1>
        <p>Official standings and player statistics are calculated from finished and verified match records only.</p>
        <div className="stats-toolbar">
          <label>Season<select value={seasonId} onChange={e => void changeSeason(e.target.value)} disabled={!seasons.length}><option value="">Select season</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name} · {s.year} · {competitionMap.get(s.competition_id) || "Competition"}</option>)}</select></label>
          {season && <span className="stats-source">Official data · {season.name}</span>\n          {seasonTeams.length > 0 && <label>Team<select value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Select team</option>{seasonTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}}
        </div>
      </section>
      <section className="container section">
        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="panel">Loading official statistics…</div> : !seasonId ? <div className="panel"><h2>No active season yet</h2><p>Create and activate a season in the Control Room to begin calculating official statistics.</p></div> : (
          <div className="stats-grid">
            <section className="panel"><div className="section-heading"><h2>Standings</h2><span>{standings.length} teams</span></div>
              {standings.length ? <div className="table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>{standings.map((r,i)=><tr key={r.teamId}><td>{i+1}</td><td><strong>{teamMap.get(r.teamId) || "Unknown team"}</strong></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf-r.ga > 0 ? "+" : ""}{r.gf-r.ga}</td><td><strong>{r.points}</strong></td></tr>)}</tbody></table></div> : <p className="muted">No finished or verified matches for this season yet.</p>}
            </section>
            <section className="panel"><div className="section-heading"><h2>Top Scorers</h2><span>Goals</span></div>
              {scorers.length ? <div className="rank-list">{scorers.map((x,i)=><div className="rank-row" key={x.player!.id}><span className="rank">{i+1}</span><div><strong>{x.player!.full_name}</strong><small>{teamMap.get(x.player!.team_id) || "Team"}</small></div><b>{x.goals}</b></div>)}</div> : <p className="muted">Goal events will appear here after official matches are recorded.</p>}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
