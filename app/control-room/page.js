"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

const TABS = [
  ["overview", "Overview"],
  ["competitions", "Competitions"],
  ["seasons", "Seasons"],
  ["teams", "Teams"],
  ["fixtures", "Fixtures"],
  ["live", "Match Control"],
  ["players", "Players"],
  ["reports", "Reports"]
];

const emptyCompetition = { name: "", code: "", location: "", format: "league", description: "" };
const emptySeason = { competition_id: "", name: "", year: "", start_date: "", end_date: "", is_active: false };
const emptyTeam = { name: "", short_name: "", area: "", home_venue: "", founded_year: "" };
const emptyPlayer = { team_id: "", full_name: "", shirt_number: "", position: "", date_of_birth: "" };
const emptyFixture = { season_id: "", stage_id: "", group_id: "", home_team_id: "", away_team_id: "", scheduled_at: "", venue: "", round_name: "" };

function msgError(error) {
  return error?.message || "Something went wrong.";
}

export default function ControlRoomPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const [competitions, setCompetitions] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [stages, setStages] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [reports, setReports] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);

  const [competitionForm, setCompetitionForm] = useState(emptyCompetition);
  const [seasonForm, setSeasonForm] = useState(emptySeason);
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const [fixtureForm, setFixtureForm] = useState(emptyFixture);
  const [saving, setSaving] = useState(false);

  function clearNotice() {
    setMessage("");
    setSuccess("");
  }

  async function loadData() {
    clearNotice();
    const results = await Promise.all([
      supabase.from("competitions").select("*").order("name"),
      supabase.from("seasons").select("*, competitions(name)").order("created_at", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
      supabase.from("players").select("*, teams(name)").order("full_name"),
      supabase.from("stages").select("*, seasons(name)").order("stage_order"),
      supabase.from("matches").select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), seasons(name), stages(name)").order("scheduled_at", { ascending: true }),
      supabase.from("match_reports").select("*, matches(id, scheduled_at)").order("created_at", { ascending: false })
    ]);

    const errors = results.filter((r) => r.error);
    if (errors.length) {
      setMessage(errors.map((r) => r.error.message).join(" | "));
      return;
    }

    setCompetitions(results[0].data || []);
    setSeasons(results[1].data || []);
    setTeams(results[2].data || []);
    setPlayers(results[3].data || []);
    setStages(results[4].data || []);
    setFixtures(results[5].data || []);
    setReports(results[6].data || []);
    setLiveMatches((results[5].data || []).filter((m) => ["live", "halftime", "suspended"].includes(m.status)));
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.session.user);

      const profileResult = await supabase
        .from("profiles")
        .select("role,is_active,full_name")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileResult.error) {
        setMessage(profileResult.error.message);
      } else if (!profileResult.data || !profileResult.data.is_active || !["super_admin", "zedek_admin"].includes(profileResult.data.role)) {
        setProfile(profileResult.data);
      } else {
        setProfile(profileResult.data);
        await loadData();
      }

      setLoading(false);
    }

    boot();
    return () => { active = false; };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function saveCompetition(event) {
    event.preventDefault();
    clearNotice();
    setSaving(true);
    const { error } = await supabase.from("competitions").insert({
      name: competitionForm.name.trim(),
      code: competitionForm.code.trim() || null,
      location: competitionForm.location.trim() || null,
      format: competitionForm.format,
      description: competitionForm.description.trim() || null
    });
    setSaving(false);
    if (error) return setMessage(msgError(error));
    setCompetitionForm(emptyCompetition);
    setSuccess("Competition created.");
    await loadData();
  }

  async function saveSeason(event) {
    event.preventDefault();
    clearNotice();
    setSaving(true);
    const { error } = await supabase.from("seasons").insert({
      competition_id: seasonForm.competition_id,
      name: seasonForm.name.trim(),
      year: seasonForm.year ? Number(seasonForm.year) : null,
      start_date: seasonForm.start_date || null,
      end_date: seasonForm.end_date || null,
      is_active: seasonForm.is_active
    });
    setSaving(false);
    if (error) return setMessage(msgError(error));
    setSeasonForm(emptySeason);
    setSuccess("Season created.");
    await loadData();
  }

  async function saveTeam(event) {
    event.preventDefault();
    clearNotice();
    setSaving(true);
    const { error } = await supabase.from("teams").insert({
      name: teamForm.name.trim(),
      short_name: teamForm.short_name.trim() || null,
      area: teamForm.area.trim() || null,
      home_venue: teamForm.home_venue.trim() || null,
      founded_year: teamForm.founded_year ? Number(teamForm.founded_year) : null
    });
    setSaving(false);
    if (error) return setMessage(msgError(error));
    setTeamForm(emptyTeam);
    setSuccess("Team created.");
    await loadData();
  }

  async function savePlayer(event) {
    event.preventDefault();
    clearNotice();
    setSaving(true);
    const { error } = await supabase.from("players").insert({
      team_id: playerForm.team_id,
      full_name: playerForm.full_name.trim(),
      shirt_number: playerForm.shirt_number ? Number(playerForm.shirt_number) : null,
      position: playerForm.position.trim() || null,
      date_of_birth: playerForm.date_of_birth || null
    });
    setSaving(false);
    if (error) return setMessage(msgError(error));
    setPlayerForm(emptyPlayer);
    setSuccess("Player created.");
    await loadData();
  }

  async function saveFixture(event) {
    event.preventDefault();
    clearNotice();

    if (!fixtureForm.home_team_id || !fixtureForm.away_team_id || fixtureForm.home_team_id === fixtureForm.away_team_id) {
      setMessage("Select two different teams.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("matches").insert({
      season_id: fixtureForm.season_id,
      stage_id: fixtureForm.stage_id,
      group_id: fixtureForm.group_id || null,
      home_team_id: fixtureForm.home_team_id,
      away_team_id: fixtureForm.away_team_id,
      scheduled_at: fixtureForm.scheduled_at || null,
      venue: fixtureForm.venue.trim() || null,
      round_name: fixtureForm.round_name.trim() || null
    });
    setSaving(false);
    if (error) return setMessage(msgError(error));
    setFixtureForm(emptyFixture);
    setSuccess("Fixture created.");
    await loadData();
  }

  async function changeMatchStatus(match, status) {
    clearNotice();
    const { error } = await supabase.from("matches").update({ status }).eq("id", match.id);
    if (error) return setMessage(msgError(error));
    setSuccess(`Match moved to ${status}.`);
    await loadData();
  }

  async function deleteUnreferenced(table, id, label) {
    clearNotice();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage(msgError(error));
    setSuccess(`${label} deleted.`);
    await loadData();
  }

  if (loading) {
    return <main className="auth-page"><div className="panel">Loading ZEDEK Sports Control Room...</div></main>;
  }

  if (!user || !profile) {
    return <main className="auth-page"><div className="panel"><h1>Access unavailable</h1><p>{message || "Administrator profile could not be loaded."}</p><button className="button" onClick={signOut}>Sign out</button></div></main>;
  }

  if (!profile.is_active || !["super_admin", "zedek_admin"].includes(profile.role)) {
    return <main className="auth-page"><div className="panel"><h1>Access restricted</h1><p>This account is not an active ZEDEK Sports administrator.</p><button className="button" onClick={signOut}>Sign out</button></div></main>;
  }

  const upcoming = fixtures.filter((m) => m.status === "scheduled").length;
  const finished = fixtures.filter((m) => ["finished", "verified"].includes(m.status)).length;

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
        <div className="eyebrow">Phase 2 · Football Operations</div>
        <h1>Control Room</h1>
        <p>{profile.full_name || user.email} · {profile.role}</p>
      </section>

      <section className="container">
        {message && <div className="error-box" style={{ marginBottom: 12 }}>{message}</div>}
        {success && <div className="success-box" style={{ marginBottom: 12 }}>{success}</div>}

        <div className="nav-links" style={{ justifyContent: "flex-start", overflowX: "auto", flexWrap: "nowrap", paddingBottom: 16 }}>
          {TABS.map(([key, label]) => (
            <button key={key} className={`button ${tab === key ? "primary" : ""}`} onClick={() => { clearNotice(); setTab(key); }}>{label}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="section">
            <div className="grid">
              {[
                ["Competitions", competitions.length, "Competition registry"],
                ["Seasons", seasons.length, "Season registry"],
                ["Teams", teams.length, "Local club registry"],
                ["Players", players.length, "Squad records"],
                ["Fixtures", fixtures.length, "Match schedule"],
                ["Live", liveMatches.length, "Matches currently in control"],
              ].map(([title, value, detail]) => <div className="card" key={title}><h2>{value}</h2><p><strong>{title}</strong><br />{detail}</p></div>)}
            </div>
            <div className="panel" style={{ marginTop: 16 }}>
              <h2>Phase 2 operating chain</h2>
              <p className="muted">Competition → Season → Stage → Group → Team → Player → Match → Lineup → Live Match → Report → Verification.</p>
              <div className="button-row">
                <button className="button primary" onClick={() => setTab("competitions")}>Start with Competitions</button>
                <button className="button" onClick={() => setTab("fixtures")}>Open Fixtures</button>
                <button className="button" onClick={() => setTab("live")}>Open Match Control</button>
              </div>
              <p className="muted" style={{ marginTop: 12 }}>Scheduled: {upcoming} · Finished/verified: {finished} · Reports: {reports.length}</p>
            </div>
          </div>
        )}

        {tab === "competitions" && (
          <div className="section">
            <div className="stats-grid">
              <form className="panel form-stack" onSubmit={saveCompetition}>
                <h2>Create competition</h2>
                <label>Name<input required value={competitionForm.name} onChange={e => setCompetitionForm({ ...competitionForm, name: e.target.value })} /></label>
                <label>Code<input value={competitionForm.code} onChange={e => setCompetitionForm({ ...competitionForm, code: e.target.value })} placeholder="DCC" /></label>
                <label>Location<input value={competitionForm.location} onChange={e => setCompetitionForm({ ...competitionForm, location: e.target.value })} placeholder="Damanko" /></label>
                <label>Format<select value={competitionForm.format} onChange={e => setCompetitionForm({ ...competitionForm, format: e.target.value })}><option value="league">League</option><option value="group">Group</option><option value="h2h">H2H</option><option value="knockout">Knockout</option><option value="two_leg">Two-leg</option></select></label>
                <label>Description<textarea rows="3" value={competitionForm.description} onChange={e => setCompetitionForm({ ...competitionForm, description: e.target.value })} /></label>
                <button className="button primary" disabled={saving}>{saving ? "Saving..." : "Create competition"}</button>
              </form>
              <div className="panel"><h2>Registered competitions</h2><div className="rank-list">{competitions.length === 0 ? <p className="muted">No competitions yet.</p> : competitions.map(c => <div className="rank-row" key={c.id}><span className="rank">•</span><div><b>{c.name}</b><small>{c.code || "No code"} · {c.location || "No location"} · {c.format}</small></div><button className="button danger" onClick={() => deleteUnreferenced("competitions", c.id, "Competition")}>Delete</button></div>)}</div></div>
            </div>
          </div>
        )}

        {tab === "seasons" && (
          <div className="section">
            <div className="stats-grid">
              <form className="panel form-stack" onSubmit={saveSeason}>
                <h2>Create season</h2>
                <label>Competition<select required value={seasonForm.competition_id} onChange={e => setSeasonForm({ ...seasonForm, competition_id: e.target.value })}><option value="">Select competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label>Season name<input required value={seasonForm.name} onChange={e => setSeasonForm({ ...seasonForm, name: e.target.value })} placeholder="2026 Season" /></label>
                <label>Year<input type="number" value={seasonForm.year} onChange={e => setSeasonForm({ ...seasonForm, year: e.target.value })} /></label>
                <label>Start date<input type="date" value={seasonForm.start_date} onChange={e => setSeasonForm({ ...seasonForm, start_date: e.target.value })} /></label>
                <label>End date<input type="date" value={seasonForm.end_date} onChange={e => setSeasonForm({ ...seasonForm, end_date: e.target.value })} /></label>
                <label><input type="checkbox" checked={seasonForm.is_active} onChange={e => setSeasonForm({ ...seasonForm, is_active: e.target.checked })} /> Active season</label>
                <button className="button primary" disabled={saving}>{saving ? "Saving..." : "Create season"}</button>
              </form>
              <div className="panel"><h2>Registered seasons</h2><div className="rank-list">{seasons.length === 0 ? <p className="muted">No seasons yet.</p> : seasons.map(s => <div className="rank-row" key={s.id}><span className="rank">{s.year || "—"}</span><div><b>{s.name}</b><small>{s.competitions?.name || "Competition"} · {s.is_active ? "Active" : "Inactive"}</small></div><button className="button danger" onClick={() => deleteUnreferenced("seasons", s.id, "Season")}>Delete</button></div>)}</div></div>
            </div>
          </div>
        )}

        {tab === "teams" && (
          <div className="section">
            <div className="stats-grid">
              <form className="panel form-stack" onSubmit={saveTeam}>
                <h2>Register team</h2>
                <label>Team name<input required value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} /></label>
                <label>Short name<input value={teamForm.short_name} onChange={e => setTeamForm({ ...teamForm, short_name: e.target.value })} /></label>
                <label>Area<input value={teamForm.area} onChange={e => setTeamForm({ ...teamForm, area: e.target.value })} placeholder="Damanko" /></label>
                <label>Home venue<input value={teamForm.home_venue} onChange={e => setTeamForm({ ...teamForm, home_venue: e.target.value })} /></label>
                <label>Founded year<input type="number" value={teamForm.founded_year} onChange={e => setTeamForm({ ...teamForm, founded_year: e.target.value })} /></label>
                <button className="button primary" disabled={saving}>{saving ? "Saving..." : "Register team"}</button>
              </form>
              <div className="panel"><h2>Teams</h2><div className="rank-list">{teams.length === 0 ? <p className="muted">No teams yet.</p> : teams.map(t => <div className="rank-row" key={t.id}><span className="rank">•</span><div><b>{t.name}</b><small>{t.short_name || "—"} · {t.area || "Oti"} · {players.filter(p => p.team_id === t.id).length} players</small></div><button className="button danger" onClick={() => deleteUnreferenced("teams", t.id, "Team")}>Delete</button></div>)}</div></div>
            </div>
          </div>
        )}

        {tab === "players" && (
          <div className="section">
            <div className="stats-grid">
              <form className="panel form-stack" onSubmit={savePlayer}>
                <h2>Register player</h2>
                <label>Team<select required value={playerForm.team_id} onChange={e => setPlayerForm({ ...playerForm, team_id: e.target.value })}><option value="">Select team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                <label>Full name<input required value={playerForm.full_name} onChange={e => setPlayerForm({ ...playerForm, full_name: e.target.value })} /></label>
                <label>Shirt number<input type="number" value={playerForm.shirt_number} onChange={e => setPlayerForm({ ...playerForm, shirt_number: e.target.value })} /></label>
                <label>Position<input value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value })} placeholder="Defender" /></label>
                <label>Date of birth<input type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({ ...playerForm, date_of_birth: e.target.value })} /></label>
                <button className="button primary" disabled={saving}>{saving ? "Saving..." : "Register player"}</button>
              </form>
              <div className="panel"><h2>Player registry</h2><div className="rank-list">{players.length === 0 ? <p className="muted">No players yet.</p> : players.map(p => <div className="rank-row" key={p.id}><span className="rank">{p.shirt_number || "•"}</span><div><b>{p.full_name}</b><small>{p.teams?.name || "No team"} · {p.position || "Position not set"}</small></div><button className="button danger" onClick={() => deleteUnreferenced("players", p.id, "Player")}>Delete</button></div>)}</div></div>
            </div>
          </div>
        )}

        {tab === "fixtures" && (
          <div className="section">
            <div className="stats-grid">
              <form className="panel form-stack" onSubmit={saveFixture}>
                <h2>Create fixture</h2>
                <label>Season<select required value={fixtureForm.season_id} onChange={e => setFixtureForm({ ...fixtureForm, season_id: e.target.value })}><option value="">Select season</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name} · {s.competitions?.name}</option>)}</select></label>
                <label>Stage<select required value={fixtureForm.stage_id} onChange={e => setFixtureForm({ ...fixtureForm, stage_id: e.target.value })}><option value="">Select stage</option>{stages.filter(st => !fixtureForm.season_id || st.season_id === fixtureForm.season_id).map(st => <option key={st.id} value={st.id}>{st.name}</option>)}</select></label>
                <label>Home team<select required value={fixtureForm.home_team_id} onChange={e => setFixtureForm({ ...fixtureForm, home_team_id: e.target.value })}><option value="">Select home team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                <label>Away team<select required value={fixtureForm.away_team_id} onChange={e => setFixtureForm({ ...fixtureForm, away_team_id: e.target.value })}><option value="">Select away team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                <label>Date & time<input type="datetime-local" value={fixtureForm.scheduled_at} onChange={e => setFixtureForm({ ...fixtureForm, scheduled_at: e.target.value })} /></label>
                <label>Venue<input value={fixtureForm.venue} onChange={e => setFixtureForm({ ...fixtureForm, venue: e.target.value })} /></label>
                <label>Round<input value={fixtureForm.round_name} onChange={e => setFixtureForm({ ...fixtureForm, round_name: e.target.value })} placeholder="Matchday 1" /></label>
                <button className="button primary" disabled={saving}>{saving ? "Saving..." : "Create fixture"}</button>
              </form>
              <div className="panel"><h2>Fixture list</h2><div className="rank-list">{fixtures.length === 0 ? <p className="muted">No fixtures yet. Create a stage first, then add the match.</p> : fixtures.map(m => <div className="rank-row" key={m.id}><span className="rank">{m.home_score}-{m.away_score}</span><div><b>{m.home_team?.name || "Home"} vs {m.away_team?.name || "Away"}</b><small>{m.seasons?.name || "Season"} · {m.stages?.name || "Stage"} · {m.status}</small></div><button className="button" onClick={() => setTab("live")}>Control</button></div>)}</div></div>
            </div>
          </div>
        )}

        {tab === "live" && (
          <div className="section">
            <div className="panel">
              <div className="section-heading"><div><h2>Match Control</h2><span>Operational status controls are connected to the matches table.</span></div><button className="button" onClick={loadData}>Refresh</button></div>
              <div className="rank-list">
                {fixtures.length === 0 ? <p className="muted">No fixtures exist yet.</p> : fixtures.map(m => (
                  <div className="card" key={m.id} style={{ marginBottom: 10 }}>
                    <div className="section-heading">
                      <div><h2>{m.home_team?.name || "Home"} {m.home_score} — {m.away_score} {m.away_team?.name || "Away"}</h2><span>{m.status} · {m.venue || "Venue TBC"}</span></div>
                    </div>
                    <div className="button-row">
                      {["scheduled", "live", "halftime", "finished", "suspended", "cancelled"].map(status => <button key={status} className={`button ${m.status === status ? "primary" : ""}`} onClick={() => changeMatchStatus(m, status)}>{status}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="section">
            <div className="panel">
              <h2>Reports & Verification</h2>
              <p className="muted">Report records are preserved here while the dedicated review workflow is rebuilt.</p>
              {reports.length === 0 ? <p className="muted">No match reports yet.</p> : <div className="rank-list">{reports.map(r => <div className="rank-row" key={r.id}><span className="rank">•</span><div><b>Match report · {r.status}</b><small>{r.summary || "No summary"} · {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "Not submitted"}</small></div></div>)}</div>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
