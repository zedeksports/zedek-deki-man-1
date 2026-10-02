"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Season = { id: string; name: string; year: number; competition_id: string };
type Competition = { id: string; name: string };
type Team = { id: string; name: string };
type Stage = { id: string; season_id: string; name: string; stage_type: string; display_order: number };
type Group = { id: string; stage_id: string; name: string };
type Match = {
  id: string; season_id: string; stage_id: string; group_id: string | null;
  home_team_id: string; away_team_id: string; home_score: number; away_score: number;
  status: string; scheduled_at: string;
};
type Event = { match_id: string; team_id: string; player_id: string | null; event_type: string; minute: number };
type Player = { id: string; full_name: string; team_id: string };
type MatchStat = {
  match_id: string;
  home_possession: number | null; away_possession: number | null;
  home_shots: number | null; away_shots: number | null;
  home_shots_on_target: number | null; away_shots_on_target: number | null;
  home_corners: number | null; away_corners: number | null;
  home_fouls: number | null; away_fouls: number | null;
  home_offsides: number | null; away_offsides: number | null;
  home_saves: number | null; away_saves: number | null;
  home_passes: number | null; away_passes: number | null;
  home_pass_accuracy: number | null; away_pass_accuracy: number | null;
  home_crosses: number | null; away_crosses: number | null;
  home_free_kicks: number | null; away_free_kicks: number | null;
  home_goal_kicks: number | null; away_goal_kicks: number | null;
  home_throw_ins: number | null; away_throw_ins: number | null;
  home_xg: number | null; away_xg: number | null;
};

export default function StatisticsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredTeamIds, setRegisteredTeamIds] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [stageId, setStageId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [h2hTeamA, setH2hTeamA] = useState("");
  const [h2hTeamB, setH2hTeamB] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSeason(id: string) {
    setError("");
    const [matchRes, eventRes, registrationRes, stageRes, groupRes, stageTeamRes, statRes] = await Promise.all([
      supabase.from("matches").select("id,season_id,stage_id,group_id,home_team_id,away_team_id,home_score,away_score,status,scheduled_at").eq("season_id", id).in("status", ["finished", "verified"]).order("scheduled_at", { ascending: false }),
      supabase.from("match_events").select("match_id,team_id,player_id,event_type,minute").in("event_type", ["goal", "own_goal", "yellow_card", "red_card"]),
      supabase.from("season_teams").select("team_id").eq("season_id", id),
      supabase.from("stages").select("id,season_id,name,stage_type,display_order").eq("season_id", id).eq("is_active", true).order("display_order"),
      supabase.from("groups").select("id,stage_id,name").order("name"),
      supabase.from("stage_teams").select("stage_id,team_id"),
      supabase.from("match_statistics").select("*"),
    ]);
    if (matchRes.error || eventRes.error || registrationRes.error || stageRes.error || groupRes.error || stageTeamRes.error || statRes.error) {
      setError(matchRes.error?.message || eventRes.error?.message || registrationRes.error?.message || stageRes.error?.message || groupRes.error?.message || stageTeamRes.error?.message || statRes.error?.message || "Unable to load statistics.");
      setLoading(false);
      return;
    }
    const loadedMatches = matchRes.data || [];
    const ids = new Set(loadedMatches.map(m => m.id));
    setMatches(loadedMatches);
    setEvents((eventRes.data || []).filter(e => ids.has(e.match_id)));
    setStages(stageRes.data || []);
    const stageIds = new Set((stageRes.data || []).map(s => s.id));
    setGroups((groupRes.data || []).filter(g => stageIds.has(g.stage_id)));
    setRegisteredTeamIds((stageTeamRes.data || []).filter(x => stageIds.has(x.stage_id)).map(x => x.team_id));
    setMatchStats((statRes.data || []).filter(s => ids.has(s.match_id)));
    setStageId(current => current && stageIds.has(current) ? current : (stageRes.data?.[0]?.id || ""));
    setGroupId("");
    setSelectedMatchId(current => current && ids.has(current) ? current : (loadedMatches[0]?.id || ""));
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
      const loadedSeasons = seasonRes.data || [];
      setSeasons(loadedSeasons);
      setCompetitions(compRes.data || []);
      setTeams(teamRes.data || []);
      setPlayers(playerRes.data || []);
      const initial = loadedSeasons[0]?.id || "";
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
  const visibleGroups = useMemo(() => groups.filter(g => g.stage_id === stageId), [groups, stageId]);
  const seasonTeams = useMemo(() => teams.filter(t => registeredTeamIds.includes(t.id)), [teams, registeredTeamIds]);
  const filteredMatches = useMemo(() => matches.filter(m => m.stage_id === stageId && (!groupId || m.group_id === groupId)), [matches, stageId, groupId]);

  const standings = useMemo(() => {
    const rows = new Map<string, { teamId: string; played: number; wins: number; draws: number; losses: number; gf: number; ga: number; points: number }>();
    const teamIds = new Set<string>();
    if (stageId) {
      filteredMatches.forEach(m => { teamIds.add(m.home_team_id); teamIds.add(m.away_team_id); });
      if (!groupId) registeredTeamIds.forEach(id => teamIds.add(id));
    }
    teamIds.forEach(id => rows.set(id, { teamId: id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }));
    filteredMatches.forEach(m => {
      if (!rows.has(m.home_team_id)) rows.set(m.home_team_id, { teamId: m.home_team_id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 });
      if (!rows.has(m.away_team_id)) rows.set(m.away_team_id, { teamId: m.away_team_id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 });
      const h = rows.get(m.home_team_id)!; const a = rows.get(m.away_team_id)!;
      h.played++; a.played++; h.gf += m.home_score || 0; h.ga += m.away_score || 0; a.gf += m.away_score || 0; a.ga += m.home_score || 0;
      if (m.home_score > m.away_score) { h.wins++; h.points += 3; a.losses++; }
      else if (m.home_score < m.away_score) { a.wins++; a.points += 3; h.losses++; }
      else { h.draws++; a.draws++; h.points++; a.points++; }
    });
    return [...rows.values()].sort((a,b) => b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || (teamMap.get(a.teamId)||"").localeCompare(teamMap.get(b.teamId)||""));
  }, [filteredMatches, registeredTeamIds, stageId, groupId, teamMap]);

  const teamSummary = useMemo(() => {
    if (!teamId) return null;
    const row = standings.find(x => x.teamId === teamId);
    return row || { teamId, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
  }, [standings, teamId]);

  const teamForm = useMemo(() => {
    if (!teamId) return [];
    return matches.filter(m => (m.home_team_id === teamId || m.away_team_id === teamId) && m.stage_id === stageId && (!groupId || m.group_id === groupId))
      .sort((a,b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()).slice(0, 5)
      .map(m => {
        const home = m.home_team_id === teamId;
        const gf = home ? m.home_score : m.away_score; const ga = home ? m.away_score : m.home_score;
        return { ...m, opponent: teamMap.get(home ? m.away_team_id : m.home_team_id) || "Unknown team", result: gf > ga ? "W" : gf < ga ? "L" : "D", score: home ? `${m.home_score}-${m.away_score}` : `${m.away_score}-${m.home_score}` };
      });
  }, [matches, teamId, stageId, groupId, teamMap]);

  const playerStats = useMemo(() => {
    const stats = new Map<string, { goals: number; yellow: number; red: number }>();
    players.filter(p => !teamId || p.team_id === teamId).forEach(p => stats.set(p.id, { goals: 0, yellow: 0, red: 0 }));
    events.filter(e => filteredMatches.some(m => m.id === e.match_id)).forEach(e => {
      if (!e.player_id || !stats.has(e.player_id)) return;
      const s = stats.get(e.player_id)!;
      if (e.event_type === "goal") s.goals++;
      if (e.event_type === "yellow_card") s.yellow++;
      if (e.event_type === "red_card") s.red++;
    });
    return [...stats.entries()].map(([id, s]) => ({ player: playerMap.get(id)!, ...s })).filter(x => x.goals || x.yellow || x.red)
      .sort((a,b) => b.goals-a.goals || b.yellow-a.yellow || a.player.full_name.localeCompare(b.player.full_name)).slice(0, 20);
  }, [events, filteredMatches, players, playerMap, teamId]);

  const scorers = useMemo(() => {
    const counts = new Map<string, number>();
    events.filter(e => filteredMatches.some(m => m.id === e.match_id)).forEach(e => { if (e.event_type === "goal" && e.player_id) counts.set(e.player_id, (counts.get(e.player_id) || 0) + 1); });
    return [...counts.entries()].map(([playerId, goals]) => ({ player: playerMap.get(playerId), goals })).filter(x => x.player).sort((a,b) => b.goals-a.goals || a.player!.full_name.localeCompare(b.player!.full_name)).slice(0, 10);
  }, [events, filteredMatches, playerMap]);

  const h2hMatches = useMemo(() => {
    if (!h2hTeamA || !h2hTeamB || h2hTeamA === h2hTeamB) return [];
    return matches.filter(m => (m.home_team_id === h2hTeamA && m.away_team_id === h2hTeamB) || (m.home_team_id === h2hTeamB && m.away_team_id === h2hTeamA))
      .sort((a,b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  }, [matches, h2hTeamA, h2hTeamB]);

  const h2hSummary = useMemo(() => {
    const out = { played: 0, aWins: 0, draws: 0, bWins: 0, aGoals: 0, bGoals: 0 };
    h2hMatches.forEach(m => {
      out.played++;
      const aHome = m.home_team_id === h2hTeamA;
      const aGoals = aHome ? m.home_score : m.away_score; const bGoals = aHome ? m.away_score : m.home_score;
      out.aGoals += aGoals; out.bGoals += bGoals;
      if (aGoals > bGoals) out.aWins++; else if (aGoals < bGoals) out.bWins++; else out.draws++;
    });
    return out;
  }, [h2hMatches, h2hTeamA]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);
  const selectedStat = matchStats.find(s => s.match_id === selectedMatchId);

  async function changeSeason(id: string) {
    setSeasonId(id); setTeamId(""); setH2hTeamA(""); setH2hTeamB("");
    setLoading(true); await loadSeason(id);
  }

  return (
    <main className="page">
      <header className="site-header"><div className="container nav"><a className="brand" href="/">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/matches">Matches</a><a href="/teams">Teams</a><a href="/competitions">Competitions</a><a href="/statistics">Statistics</a><a href="/news">News</a></nav></div></header>
      <section className="container page-header">
        <div className="eyebrow">Football intelligence</div><h1>Statistics Hub</h1>
        <p>Official statistics are calculated from finished and verified matches only.</p>
        <div className="stats-toolbar">
          <label>Season<select value={seasonId} onChange={e => void changeSeason(e.target.value)}><option value="">Select season</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name} · {s.year} · {competitionMap.get(s.competition_id) || "Competition"}</option>)}</select></label>
          {season && <span className="stats-source">Official data · {season.name}</span>}
          {stages.length > 0 && <label>Stage<select value={stageId} onChange={e => { setStageId(e.target.value); setGroupId(""); }}><option value="">Select stage</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name} · {s.stage_type}</option>)}</select></label>}
          {visibleGroups.length > 0 && <label>Group<select value={groupId} onChange={e => setGroupId(e.target.value)}><option value="">All groups</option>{visibleGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
          {seasonTeams.length > 0 && <label>Team<select value={teamId} onChange={e => setTeamId(e.target.value)}><option value="">Select team</option>{seasonTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
        </div>
      </section>
      <section className="container section">
        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="panel">Loading official statistics…</div> : !seasonId ? <div className="panel"><h2>No active season yet</h2><p>Create and activate a season in the Control Room to begin calculating official statistics.</p></div> : !stageId ? <div className="panel"><h2>No active stage yet</h2><p>Create and activate a stage for this season to calculate stage-aware standings.</p></div> : (
          <>
            <div className="stats-grid">
              <section className="panel"><div className="section-heading"><h2>Standings</h2><span>{standings.length} teams</span></div>
                {standings.length ? <div className="table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>{standings.map((r,i)=><tr key={r.teamId}><td>{i+1}</td><td><strong>{teamMap.get(r.teamId) || "Unknown team"}</strong></td><td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td><td>{r.gf-r.ga > 0 ? "+" : ""}{r.gf-r.ga}</td><td><strong>{r.points}</strong></td></tr>)}</tbody></table></div> : <p className="muted">No finished or verified matches for this stage.</p>}
              </section>
              <section className="panel"><div className="section-heading"><h2>Top Scorers</h2><span>Goals</span></div>
                {scorers.length ? <div className="rank-list">{scorers.map((x,i)=><div className="rank-row" key={x.player!.id}><span className="rank">{i+1}</span><div><strong>{x.player!.full_name}</strong><small>{teamMap.get(x.player!.team_id) || "Team"}</small></div><b>{x.goals}</b></div>)}</div> : <p className="muted">Goal events will appear here after official matches are recorded.</p>}
              </section>
            </div>

            {teamId && <div className="stats-grid">
              <section className="panel"><div className="section-heading"><h2>Team Statistics</h2><span>{teamMap.get(teamId)}</span></div>
                {teamSummary && <div className="team-summary">{[["P",teamSummary.played],["W",teamSummary.wins],["D",teamSummary.draws],["L",teamSummary.losses],["GF",teamSummary.gf],["GA",teamSummary.ga],["GD",teamSummary.gf-teamSummary.ga > 0 ? "+"+(teamSummary.gf-teamSummary.ga) : teamSummary.gf-teamSummary.ga],["Pts",teamSummary.points]].map(([k,v]) => <div key={String(k)}><b>{v}</b><small>{k}</small></div>)}</div>}
              </section>
              <section className="panel"><div className="section-heading"><h2>Form Guide</h2><span>Last 5</span></div>
                {teamForm.length ? <div className="form-list">{teamForm.map(m => <div className="form-row" key={m.id}><span className={"form-badge form-"+m.result.toLowerCase()}>{m.result}</span><div><strong>{m.opponent}</strong><small>{m.score}</small></div></div>)}</div> : <p className="muted">No official matches yet.</p>}
              </section>
            </div>}

            <section className="panel"><div className="section-heading"><h2>Player Statistics</h2><span>{teamId ? teamMap.get(teamId) : "All teams"}</span></div>
              {playerStats.length ? <div className="table-wrap"><table><thead><tr><th>Player</th><th>Team</th><th>Goals</th><th>Yellow</th><th>Red</th></tr></thead><tbody>{playerStats.map(x => <tr key={x.player.id}><td><strong>{x.player.full_name}</strong></td><td>{teamMap.get(x.player.team_id) || "Team"}</td><td>{x.goals}</td><td>{x.yellow}</td><td>{x.red}</td></tr>)}</tbody></table></div> : <p className="muted">Player event statistics will appear here after official matches are recorded.</p>}
            </section>

            <section className="panel"><div className="section-heading"><h2>Head-to-Head</h2><span>Historical official meetings</span></div>
              <div className="stats-toolbar"><label>Team A<select value={h2hTeamA} onChange={e => setH2hTeamA(e.target.value)}><option value="">Select team</option>{seasonTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Team B<select value={h2hTeamB} onChange={e => setH2hTeamB(e.target.value)}><option value="">Select team</option>{seasonTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
              {h2hTeamA && h2hTeamB && h2hTeamA !== h2hTeamB ? <><div className="team-summary">{[["Played",h2hSummary.played],[teamMap.get(h2hTeamA)||"Team A",h2hSummary.aWins],["Draws",h2hSummary.draws],[teamMap.get(h2hTeamB)||"Team B",h2hSummary.bWins],["Goals A",h2hSummary.aGoals],["Goals B",h2hSummary.bGoals]].map(([k,v])=><div key={String(k)}><b>{v}</b><small>{k}</small></div>)}</div>{h2hMatches.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Match</th><th>Score</th></tr></thead><tbody>{h2hMatches.map(m=><tr key={m.id}><td>{new Date(m.scheduled_at).toLocaleDateString()}</td><td>{teamMap.get(m.home_team_id)} vs {teamMap.get(m.away_team_id)}</td><td><strong>{m.home_score}-{m.away_score}</strong></td></tr>)}</tbody></table></div> : <p className="muted">No official meetings recorded in this season.</p>}</> : <p className="muted">Select two different teams.</p>}
            </section>

            <section className="panel"><div className="section-heading"><h2>Advanced Match Statistics</h2><span>{selectedMatch ? teamMap.get(selectedMatch.home_team_id)+" vs "+teamMap.get(selectedMatch.away_team_id) : "Official match"}</span></div>
              <label>Match<select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}><option value="">Select match</option>{filteredMatches.map(m => <option key={m.id} value={m.id}>{new Date(m.scheduled_at).toLocaleDateString()} · {teamMap.get(m.home_team_id)} {m.home_score}-{m.away_score} {teamMap.get(m.away_team_id)}</option>)}</select></label>
              {selectedMatch && selectedStat ? <div className="table-wrap"><table><thead><tr><th>Metric</th><th>{teamMap.get(selectedMatch.home_team_id)}</th><th>{teamMap.get(selectedMatch.away_team_id)}</th></tr></thead><tbody>{[
                ["Possession %",selectedStat.home_possession,selectedStat.away_possession],["Shots",selectedStat.home_shots,selectedStat.away_shots],["Shots on target",selectedStat.home_shots_on_target,selectedStat.away_shots_on_target],["Corners",selectedStat.home_corners,selectedStat.away_corners],["Fouls",selectedStat.home_fouls,selectedStat.away_fouls],["Offsides",selectedStat.home_offsides,selectedStat.away_offsides],["Saves",selectedStat.home_saves,selectedStat.away_saves],["Passes",selectedStat.home_passes,selectedStat.away_passes],["Pass accuracy %",selectedStat.home_pass_accuracy,selectedStat.away_pass_accuracy],["Crosses",selectedStat.home_crosses,selectedStat.away_crosses],["Free kicks",selectedStat.home_free_kicks,selectedStat.away_free_kicks],["Goal kicks",selectedStat.home_goal_kicks,selectedStat.away_goal_kicks],["Throw-ins",selectedStat.home_throw_ins,selectedStat.away_throw_ins],["xG",selectedStat.home_xg,selectedStat.away_xg]
              ].map(([label,home,away])=><tr key={String(label)}><td>{label}</td><td>{home ?? "—"}</td><td>{away ?? "—"}</td></tr>)}</tbody></table></div> : <p className="muted">{selectedMatch ? "No recorded advanced statistics for this match." : "Select an official match to view advanced statistics."}</p>}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
