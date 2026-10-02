"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

const TABS=["overview","competitions","seasons","stages","fixtures","live","lineups","teams","players"];
const STAGE_TYPES=["league","group","knockout","quarter_final","semi_final","final"];

function getSupabase(){if(typeof window==="undefined")return null;return createSupabaseBrowserClient();}
function fmtDate(v){return v?new Date(v).toLocaleString():"—";}

export default function ControlRoomPage(){
  const [loading,setLoading]=useState(true),[user,setUser]=useState(null),[profile,setProfile]=useState(null);
  const [tab,setTab]=useState("overview"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [competitions,setCompetitions]=useState([]),[seasons,setSeasons]=useState([]),[teams,setTeams]=useState([]),[players,setPlayers]=useState([]),[stages,setStages]=useState([]),[matches,setMatches]=useState([]);
  const [competition,setCompetition]=useState({name:"",code:"",location:"",format:"league"});
  const [season,setSeason]=useState({competition_id:"",name:"",year:"",start_date:"",end_date:""});
  const [stage,setStage]=useState({season_id:"",name:"",stage_type:"league",stage_order:"1",is_active:true});
  const [fixture,setFixture]=useState({season_id:"",stage_id:"",home_team_id:"",away_team_id:"",scheduled_at:"",venue:"",round_name:"",leg:"1",notes:""});
  const [team,setTeam]=useState({name:"",short_name:"",area:"",home_venue:""});
  const [player,setPlayer]=useState({team_id:"",full_name:"",shirt_number:"",position:""});
  const [saving,setSaving]=useState(false), [reportMatch,setReportMatch]=useState(null), [report,setReport]=useState(null), [reports,setReports]=useState([]),[liveMatch,setLiveMatch]=useState(null),[events,setEvents]=useState([]),[matchStats,setMatchStats]=useState(null),[clock,setClock]=useState(0),[eventForm,setEventForm]=useState({type:"goal",team_id:"",player_id:"",minute:"",extra_minute:"",details:""}),[lineupMatch,setLineupMatch]=useState(null),[lineupTeam,setLineupTeam]=useState(""),[lineup,setLineup]=useState(null),[lineupPlayers,setLineupPlayers]=useState([]),[lineupLoading,setLineupLoading]=useState(false);

  useEffect(()=>{if(!liveMatch)return;const tick=()=>setClock(elapsed(liveMatch));tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[liveMatch]);

  async function refresh(){
    setError(""); const supabase=getSupabase(); if(!supabase)return;
    const [a,b,c,d,e,f]=await Promise.all([
      supabase.from("competitions").select("*").order("name"),
      supabase.from("seasons").select("*, competitions(name)").order("created_at",{ascending:false}),
      supabase.from("teams").select("*").order("name"),
      supabase.from("players").select("*, teams(name)").order("full_name"),
      supabase.from("stages").select("*, seasons(name, competitions(name))").order("season_id").order("stage_order"),
      supabase.from("matches").select("*, home:teams!matches_home_team_id_fkey(name), away:teams!matches_away_team_id_fkey(name), seasons(name), stages(name)").order("scheduled_at",{ascending:true})
    ]);
    const bad=[a,b,c,d,e,f].find(x=>x.error); if(bad){setError(bad.error.message);return;}
    setCompetitions(a.data||[]);setSeasons(b.data||[]);setTeams(c.data||[]);setPlayers(d.data||[]);
    setStages(e.data||[]);setMatches(f.data||[]);
  }

  useEffect(()=>{let mounted=true;
    async function boot(){
      const supabase=getSupabase(); if(!supabase)return;
      const session=await supabase.auth.getSession(); if(!mounted)return;
      if(session.error||!session.data.session){window.location.href="/login";return;}
      setUser(session.data.session.user);
      const p=await supabase.from("profiles").select("role,is_active,full_name").eq("id",session.data.session.user.id).maybeSingle();
      if(!mounted)return;
      if(p.error)setError(p.error.message); setProfile(p.data);
      if(p.data&&p.data.is_active&&["super_admin","zedek_admin"].includes(p.data.role))await refresh();
      setLoading(false);
    }
    if(p.data&&p.data.is_active&&["super_admin","zedek_admin"].includes(p.data.role))await loadReports();
    boot(); return()=>{mounted=false};
},[]);

  async function save(table,values,reset){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!supabase){setSaving(false);return;}
    const result=await supabase.from(table).insert(values);setSaving(false);
    if(result.error){setError(result.error.message);return;}
    reset();setNotice("Saved successfully.");await refresh();
  }
  async function loadLive(id){ const supabase=getSupabase(); if(!supabase)return; const [ev,st]=await Promise.all([supabase.from("match_events").select("*, teams(name), players(full_name,shirt_number)").eq("match_id",id).order("created_at",{ascending:false}),supabase.from("match_statistics").select("*").eq("match_id",id).maybeSingle()]); if(ev.error)setError(ev.error.message); else setEvents(ev.data||[]); if(st.error)setError(st.error.message); else setMatchStats(st.data||null); }\n  function elapsed(m){ if(!m)return 0; const now=Date.now(); const kickoff=m.kickoff_at?new Date(m.kickoff_at).getTime():0; if(!kickoff)return 0; const halftime=m.halftime_at?new Date(m.halftime_at).getTime():0; const secondHalf=m.second_half_at?new Date(m.second_half_at).getTime():0; const finished=m.finished_at?new Date(m.finished_at).getTime():0; if(m.status==="scheduled")return 0; if(m.status==="live"){ if(secondHalf){ const firstHalfEnd=halftime||secondHalf; const first=Math.max(0,firstHalfEnd-kickoff); const second=Math.max(0,now-secondHalf); return Math.floor((first+second)/1000); } return Math.floor(Math.max(0,now-kickoff)/1000); } if(m.status==="halftime"){ const end=halftime||now; return Math.floor(Math.max(0,end-kickoff)/1000); } if(m.status==="finished"){ if(secondHalf){ const firstHalfEnd=halftime||secondHalf; const first=Math.max(0,firstHalfEnd-kickoff); const second=Math.max(0,(finished||now)-secondHalf); return Math.floor((first+second)/1000); } return Math.floor(Math.max(0,(finished||now)-kickoff)/1000); } return 0; }\n  function displayClock(sec){const min=Math.floor(sec/60),s=sec%60;return String(min).padStart(2,"0")+":"+String(s).padStart(2,"0");}\n  async function clockAction(m,action){ const now=new Date().toISOString(); let values={}; if(action==="start")values={status:"live",kickoff_at:now,halftime_at:null,second_half_at:null,finished_at:null}; if(action==="halftime")values={status:"halftime",halftime_at:now}; if(action==="resume")values={status:"live",second_half_at:now}; if(action==="finish")values={status:"finished",finished_at:now}; await updateMatch(m.id,values); setLiveMatch({...m,...values}); }\n  async function addEvent(){ if(!liveMatch)return; const supabase=getSupabase(); setSaving(true); const minute=eventForm.minute?Number(eventForm.minute):Math.floor(clock/60); const result=await supabase.from("match_events").insert({match_id:liveMatch.id,team_id:eventForm.team_id||null,player_id:eventForm.player_id||null,event_type:eventForm.type,minute,extra_minute:eventForm.extra_minute?Number(eventForm.extra_minute):null,details:eventForm.details||null}); if(result.error){setError(result.error.message);setSaving(false);return;} if(eventForm.type==="goal"&&eventForm.team_id){const home=eventForm.team_id===liveMatch.home_team_id; const values=home?{home_score:(liveMatch.home_score||0)+1}:{away_score:(liveMatch.away_score||0)+1}; await updateMatch(liveMatch.id,values); setLiveMatch({...liveMatch,...values});} setEventForm({type:"goal",team_id:"",player_id:"",minute:"",extra_minute:"",details:""});setSaving(false);await loadLive(liveMatch.id); }\n  async function loadReports(){
    const supabase=getSupabase(); if(!supabase)return;
    const r=await supabase.from("match_reports").select("*,match:matches(id,home_score,away_score,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").order("created_at",{ascending:false});
    if(!r.error)setReports(r.data||[]);
  }
  async function saveReport(){
    if(!reportMatch)return;
    const supabase=getSupabase(); setSaving(true);setError("");setNotice("");
    const payload={match_id:reportMatch.id,summary:report?.summary||"",incidents:report?.incidents||"",submitted_at:new Date().toISOString(),status:"submitted"};
    const r=await supabase.from("match_reports").upsert(payload,{onConflict:"match_id"}).select("*,match:matches(id,home_score,away_score,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").single();
    setSaving(false); if(r.error){setError(r.error.message);return;} setReport(r.data);setNotice("Report submitted for verification.");await loadReports();
  }
  async function verifyReport(r){
    const supabase=getSupabase();setSaving(true);setError("");setNotice("");
    const {data:{user}}=await supabase.auth.getUser();
    const v=await supabase.from("match_verifications").upsert({match_id:r.match_id,verified_by:user?.id||null,verified_at:new Date().toISOString(),official_result:true,locked_at:new Date().toISOString()},{onConflict:"match_id"});
    if(v.error){setError(v.error.message);setSaving(false);return;}
    const m=await supabase.from("matches").update({status:"verified"}).eq("id",r.match_id);
    if(m.error){setError(m.error.message);setSaving(false);return;}
    await supabase.from("match_reports").update({status:"verified",updated_at:new Date().toISOString()}).eq("id",r.id);
    setSaving(false);setNotice("Official result verified and locked.");await loadReports();
  }
  async function rejectReport(r){
    const supabase=getSupabase();setSaving(true);setError("");setNotice("");
    const x=await supabase.from("match_reports").update({status:"rejected",updated_at:new Date().toISOString()}).eq("id",r.id);
    setSaving(false);if(x.error){setError(x.error.message);return;}setNotice("Report rejected and returned for correction.");await loadReports();
  }
  async function loadLineup(matchId,teamId){
    const supabase=getSupabase(); if(!supabase)return;
    setLineupLoading(true); setError("");
    const existing=await supabase.from("match_lineups").select("*").eq("match_id",matchId).eq("team_id",teamId).maybeSingle();
    if(existing.error){setError(existing.error.message);setLineupLoading(false);return;}
    setLineup(existing.data||null);
    if(existing.data){
      const rows=await supabase.from("match_lineup_players").select("*").eq("lineup_id",existing.data.id);
      if(rows.error)setError(rows.error.message); else setLineupPlayers(rows.data||[]);
    } else setLineupPlayers([]);
    setLineupLoading(false);
  }
  function toggleLineupPlayer(playerId,role){
    setLineupPlayers(prev=>{
      const found=prev.find(x=>x.player_id===playerId);
      if(found){return prev.filter(x=>x.player_id!==playerId);}
      const p=players.find(x=>x.id===playerId);
      return [...prev,{player_id:playerId,role,shirt_number:p?.shirt_number||null,position:p?.position||null}];
    });
  }
  async function saveLineup(){
    if(!lineupMatch||!lineupTeam)return;
    const selected=lineupPlayers;
    const starters=selected.filter(x=>x.role==="starter");
    if(starters.length!==11){setError("A starting lineup must contain exactly 11 players.");return;}
    const captain=selected.find(x=>x.player_id===lineup?.captain_player_id)?.player_id||lineup?.captain_player_id;
    if(!captain||!starters.some(x=>x.player_id===captain)){setError("Select a captain from the starting XI.");return;}
    const supabase=getSupabase(); setSaving(true);setError("");setNotice("");
    let lineupId=lineup?.id;
    if(lineupId){
      const r=await supabase.from("match_lineups").update({formation:lineup.formation||null,captain_player_id:captain,submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",lineupId);
      if(r.error){setError(r.error.message);setSaving(false);return;}
      await supabase.from("match_lineup_players").delete().eq("lineup_id",lineupId);
    } else {
      const r=await supabase.from("match_lineups").insert({match_id:lineupMatch.id,team_id:lineupTeam,formation:lineup?.formation||null,captain_player_id:captain,submitted_at:new Date().toISOString()}).select("*").single();
      if(r.error){setError(r.error.message);setSaving(false);return;}
      lineupId=r.data.id;
    }
    const rows=selected.map(x=>({lineup_id:lineupId,player_id:x.player_id,role:x.role,shirt_number:x.shirt_number||null,position:x.position||null}));
    const r2=await supabase.from("match_lineup_players").insert(rows);
    setSaving(false);
    if(r2.error){setError(r2.error.message);return;}
    setNotice("Lineup saved and submitted."); await loadLineup(lineupMatch.id,lineupTeam);
  }
  async function saveStats(){ if(!liveMatch)return; const supabase=getSupabase(); const keys=["home_possession","away_possession","home_shots","away_shots","home_shots_on_target","away_shots_on_target","home_corners","away_corners","home_fouls","away_fouls","home_offsides","away_offsides","home_saves","away_saves","home_passes","away_passes","home_pass_accuracy","away_pass_accuracy","home_crosses","away_crosses","home_free_kicks","away_free_kicks","home_goal_kicks","away_goal_kicks","home_throw_ins","away_throw_ins","home_xg","away_xg"]; const values={match_id:liveMatch.id}; keys.forEach(k=>values[k]=Number(matchStats?.[k]||0)); const r=await supabase.from("match_statistics").upsert(values,{onConflict:"match_id"}); if(r.error)setError(r.error.message);else setNotice("Match statistics saved."); await loadLive(liveMatch.id); }\n  async function updateMatch(id,values){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const result=await supabase.from("matches").update(values).eq("id",id);setSaving(false);
    if(result.error){setError(result.error.message);return;}setNotice("Fixture updated.");await refresh();
  }
  async function signOut(){const supabase=getSupabase();if(supabase)await supabase.auth.signOut();window.location.href="/login";}

  if(loading)return <main className="auth-page"><div className="panel">Loading ZEDEK Sports Control Room...</div></main>;
  if(!user||!profile)return <main className="auth-page"><div className="panel"><h1>Access unavailable</h1><p>{error||"Administrator profile unavailable."}</p><button className="button" onClick={signOut}>Sign out</button></div></main>;
  if(!profile.is_active||!["super_admin","zedek_admin"].includes(profile.role))return <main className="auth-page"><div className="panel"><h1>Access restricted</h1><p>This account is not an active ZEDEK Sports administrator.</p><button className="button" onClick={signOut}>Sign out</button></div></main>;

  return <main className="page">
    <header className="site-header"><div className="container nav"><div className="brand">ZEDEK <span>SPORTS</span> · CONTROL</div><button className="button" onClick={signOut}>Sign out</button></div></header>
    <section className="container page-header"><div className="eyebrow">Private · Football Operations</div><h1>Control Room</h1><p>{profile.full_name||user.email} · {profile.role}</p></section>
    <section className="container">
      {error&&<div className="error-box">{error}</div>}{notice&&<div className="success-box">{notice}</div>}
      <div className="nav-links" style={{margin:"16px 0",overflowX:"auto",flexWrap:"nowrap"}}>
        {TABS.map(item=><button key={item} className={"button "+(tab===item?"primary":"")} onClick={()=>setTab(item)}>{item.replace("_"," ").replace(/^./,x=>x.toUpperCase())}</button>)}
      </div>

      {tab==="overview"&&<div className="grid">
        <div className="card"><h2>{competitions.length}</h2><p>Competitions</p></div><div className="card"><h2>{seasons.length}</h2><p>Seasons</p></div>
        <div className="card"><h2>{stages.length}</h2><p>Stages</p></div><div className="card"><h2>{matches.length}</h2><p>Fixtures</p></div>
        <div className="card"><h2>{teams.length}</h2><p>Teams</p></div><div className="card"><h2>{players.length}</h2><p>Players</p></div>
        <div className="card"><h2>Phase 2</h2><p>Stages and fixture scheduling are now connected to the live Supabase football database.</p></div>
      </div>}

      {tab==="competitions"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("competitions",{name:competition.name.trim(),code:competition.code.trim()||null,location:competition.location.trim()||null,format:competition.format},()=>setCompetition({name:"",code:"",location:"",format:"league"}));}}>
          <h2>Competition registry</h2><label>Name<input required value={competition.name} onChange={e=>setCompetition({...competition,name:e.target.value})}/></label>
          <label>Code<input value={competition.code} onChange={e=>setCompetition({...competition,code:e.target.value})}/></label><label>Location<input value={competition.location} onChange={e=>setCompetition({...competition,location:e.target.value})}/></label>
          <label>Format<select value={competition.format} onChange={e=>setCompetition({...competition,format:e.target.value})}><option value="league">League</option><option value="group">Group</option><option value="h2h">H2H</option><option value="knockout">Knockout</option><option value="two_leg">Two-leg</option></select></label>
          <button className="button primary" disabled={saving}>Create competition</button>
        </form>
        <div className="panel"><h2>Registered</h2>{competitions.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.code||"No code"} · {x.location||"No location"} · {x.format}</span></div>)}{!competitions.length&&<p className="muted">No competitions yet.</p>}</div>
      </div>}

      {tab==="seasons"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("seasons",{competition_id:season.competition_id,name:season.name.trim(),year:season.year?Number(season.year):null,start_date:season.start_date||null,end_date:season.end_date||null},()=>setSeason({competition_id:"",name:"",year:"",start_date:"",end_date:""}));}}>
          <h2>Season registry</h2><label>Competition<select required value={season.competition_id} onChange={e=>setSeason({...season,competition_id:e.target.value})}><option value="">Select competition</option>{competitions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Name<input required value={season.name} onChange={e=>setSeason({...season,name:e.target.value})}/></label><label>Year<input type="number" value={season.year} onChange={e=>setSeason({...season,year:e.target.value})}/></label>
          <label>Start<input type="date" value={season.start_date} onChange={e=>setSeason({...season,start_date:e.target.value})}/></label><label>End<input type="date" value={season.end_date} onChange={e=>setSeason({...season,end_date:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>Create season</button>
        </form>
        <div className="panel"><h2>Registered</h2>{seasons.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.competitions?.name||"Competition"} · {x.year||"Year not set"}</span></div>)}{!seasons.length&&<p className="muted">No seasons yet.</p>}</div>
      </div>}

      {tab==="stages"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("stages",{season_id:stage.season_id,name:stage.name.trim(),stage_type:stage.stage_type,stage_order:Number(stage.stage_order)||1,is_active:stage.is_active},()=>setStage({season_id:"",name:"",stage_type:"league",stage_order:"1",is_active:true}));}}>
          <h2>Stage management</h2><label>Season<select required value={stage.season_id} onChange={e=>setStage({...stage,season_id:e.target.value})}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name} · {x.competitions?.name||""}</option>)}</select></label>
          <label>Stage name<input required placeholder="e.g. Main League" value={stage.name} onChange={e=>setStage({...stage,name:e.target.value})}/></label>
          <label>Stage type<select value={stage.stage_type} onChange={e=>setStage({...stage,stage_type:e.target.value})}>{STAGE_TYPES.map(x=><option key={x} value={x}>{x.replace("_"," ")}</option>)}</select></label>
          <label>Order<input type="number" min="1" value={stage.stage_order} onChange={e=>setStage({...stage,stage_order:e.target.value})}/></label>
          <label><input type="checkbox" checked={stage.is_active} onChange={e=>setStage({...stage,is_active:e.target.checked})}/> Active stage</label>
          <button className="button primary" disabled={saving}>Create stage</button>
        </form>
        <div className="panel"><h2>Stages</h2>{stages.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.seasons?.name||"Season"} · {x.stage_type} · order {x.stage_order} · {x.is_active?"ACTIVE":"inactive"}</span></div>)}{!stages.length&&<p className="muted">No stages yet.</p>}</div>
      </div>}

      {tab==="fixtures"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();if(fixture.home_team_id===fixture.away_team_id){setError("Home and away teams must be different.");return;}save("matches",{season_id:fixture.season_id,stage_id:fixture.stage_id,home_team_id:fixture.home_team_id,away_team_id:fixture.away_team_id,scheduled_at:fixture.scheduled_at?new Date(fixture.scheduled_at).toISOString():null,venue:fixture.venue.trim()||null,round_name:fixture.round_name.trim()||null,leg:fixture.leg?Number(fixture.leg):null,notes:fixture.notes.trim()||null},()=>setFixture({season_id:"",stage_id:"",home_team_id:"",away_team_id:"",scheduled_at:"",venue:"",round_name:"",leg:"1",notes:""}));}}>
          <h2>Fixture management</h2>
          <label>Season<select required value={fixture.season_id} onChange={e=>setFixture({...fixture,season_id:e.target.value,stage_id:""})}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Stage<select required value={fixture.stage_id} onChange={e=>setFixture({...fixture,stage_id:e.target.value})}><option value="">Select stage</option>{stages.filter(x=>x.season_id===fixture.season_id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Home team<select required value={fixture.home_team_id} onChange={e=>setFixture({...fixture,home_team_id:e.target.value})}><option value="">Select home team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Away team<select required value={fixture.away_team_id} onChange={e=>setFixture({...fixture,away_team_id:e.target.value})}><option value="">Select away team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Date & time<input type="datetime-local" required value={fixture.scheduled_at} onChange={e=>setFixture({...fixture,scheduled_at:e.target.value})}/></label>
          <label>Venue<input value={fixture.venue} onChange={e=>setFixture({...fixture,venue:e.target.value})}/></label>
          <label>Round<input placeholder="e.g. Matchday 1" value={fixture.round_name} onChange={e=>setFixture({...fixture,round_name:e.target.value})}/></label>
          <label>Leg<select value={fixture.leg} onChange={e=>setFixture({...fixture,leg:e.target.value})}><option value="1">1</option><option value="2">2</option></select></label>
          <label>Notes<textarea value={fixture.notes} onChange={e=>setFixture({...fixture,notes:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>Create fixture</button>
        </form>
        <div className="panel"><h2>Fixture list</h2>{matches.map(x=><div className="status-card" key={x.id}>
          <b>{x.home?.name||"Home"} vs {x.away?.name||"Away"}</b><span>{x.seasons?.name||"Season"} · {x.stages?.name||"Stage"} · {fmtDate(x.scheduled_at)} · {x.venue||"Venue TBC"}</span>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}><button className="button" onClick={()=>updateMatch(x.id,{status:"scheduled"})}>Scheduled</button><button className="button" onClick={()=>updateMatch(x.id,{status:"live"})}>Start live</button><button className="button" onClick={()=>updateMatch(x.id,{status:"postponed"})}>Postpone</button><button className="button" onClick={()=>updateMatch(x.id,{status:"cancelled"})}>Cancel</button></div>
        </div>)}{!matches.length&&<p className="muted">No fixtures yet.</p>}</div>
      </div>}

      {tab==="live"&&<div className="stats-grid"><div className="panel"><h2>Live Match Control</h2><label>Select match<select value={liveMatch?.id||""} onChange={async e=>{const m=matches.find(x=>x.id===e.target.value);setLiveMatch(m||null);if(m){await loadLive(m.id);setClock(elapsed(m));}}}><option value="">Select fixture</option>{matches.map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {x.status}</option>)}</select></label>{liveMatch&&<><div className="card" style={{marginTop:16,textAlign:"center"}}><p>{liveMatch.home?.name} vs {liveMatch.away?.name}</p><h1>{liveMatch.home_score} - {liveMatch.away_score}</h1><strong style={{fontSize:32}}>{displayClock(clock)}</strong><p>{liveMatch.status.toUpperCase()}</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{liveMatch.status==="scheduled"&&<button className="button primary" onClick={()=>clockAction(liveMatch,"start")}>Start match</button>}{liveMatch.status==="live"&&<><button className="button" onClick={()=>clockAction(liveMatch,"halftime")}>Half-time</button><button className="button" onClick={()=>clockAction(liveMatch,"finish")}>Finish match</button></>}{liveMatch.status==="halftime"&&<button className="button primary" onClick={()=>clockAction(liveMatch,"resume")}>Resume 2nd half</button>}</div></>}</div><div className="panel"><h2>Events</h2>{liveMatch?<div className="form-stack"><select value={eventForm.type} onChange={e=>setEventForm({...eventForm,type:e.target.value})}><option value="goal">Goal</option><option value="yellow_card">Yellow card</option><option value="red_card">Red card</option><option value="substitution">Substitution</option><option value="penalty_missed">Penalty missed</option><option value="own_goal">Own goal</option><option value="var">VAR</option><option value="note">Note</option></select><select value={eventForm.team_id} onChange={e=>setEventForm({...eventForm,team_id:e.target.value})}><option value="">Team</option><option value={liveMatch.home_team_id}>{liveMatch.home?.name}</option><option value={liveMatch.away_team_id}>{liveMatch.away?.name}</option></select><input placeholder="Player UUID (optional)" value={eventForm.player_id} onChange={e=>setEventForm({...eventForm,player_id:e.target.value})}/><input type="number" placeholder="Minute" value={eventForm.minute} onChange={e=>setEventForm({...eventForm,minute:e.target.value})}/><input placeholder="Details" value={eventForm.details} onChange={e=>setEventForm({...eventForm,details:e.target.value})}/><button className="button primary" disabled={saving} onClick={addEvent}>Add event</button></div>:<p className="muted">Select a match.</p>}{events.map(x=><div className="status-card" key={x.id}><b>{x.minute||"—"}′ · {x.event_type}</b><span>{x.teams?.name||""} · {x.players?.full_name||""} {x.details||""}</span></div>)}</div><div className="panel"><h2>Live Match Statistics</h2>{!liveMatch?<p className="muted">Select a match to manage statistics.</p>:<div className="form-stack"><div className="status-card"><b>Possession %</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_possession"]??0} onChange={e=>setMatchStats({...matchStats,["home_possession"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_possession"]??0} onChange={e=>setMatchStats({...matchStats,["away_possession"]:e.target.value})}/></label></div></div><div className="status-card"><b>Shots</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_shots"]??0} onChange={e=>setMatchStats({...matchStats,["home_shots"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_shots"]??0} onChange={e=>setMatchStats({...matchStats,["away_shots"]:e.target.value})}/></label></div></div><div className="status-card"><b>Shots on target</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_shots_on_target"]??0} onChange={e=>setMatchStats({...matchStats,["home_shots_on_target"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_shots_on_target"]??0} onChange={e=>setMatchStats({...matchStats,["away_shots_on_target"]:e.target.value})}/></label></div></div><div className="status-card"><b>Corners</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_corners"]??0} onChange={e=>setMatchStats({...matchStats,["home_corners"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_corners"]??0} onChange={e=>setMatchStats({...matchStats,["away_corners"]:e.target.value})}/></label></div></div><div className="status-card"><b>Fouls</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_fouls"]??0} onChange={e=>setMatchStats({...matchStats,["home_fouls"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_fouls"]??0} onChange={e=>setMatchStats({...matchStats,["away_fouls"]:e.target.value})}/></label></div></div><div className="status-card"><b>Offsides</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_offsides"]??0} onChange={e=>setMatchStats({...matchStats,["home_offsides"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_offsides"]??0} onChange={e=>setMatchStats({...matchStats,["away_offsides"]:e.target.value})}/></label></div></div><div className="status-card"><b>Saves</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_saves"]??0} onChange={e=>setMatchStats({...matchStats,["home_saves"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_saves"]??0} onChange={e=>setMatchStats({...matchStats,["away_saves"]:e.target.value})}/></label></div></div><div className="status-card"><b>Passes</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_passes"]??0} onChange={e=>setMatchStats({...matchStats,["home_passes"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_passes"]??0} onChange={e=>setMatchStats({...matchStats,["away_passes"]:e.target.value})}/></label></div></div><div className="status-card"><b>Pass accuracy %</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_pass_accuracy"]??0} onChange={e=>setMatchStats({...matchStats,["home_pass_accuracy"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_pass_accuracy"]??0} onChange={e=>setMatchStats({...matchStats,["away_pass_accuracy"]:e.target.value})}/></label></div></div><div className="status-card"><b>Crosses</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_crosses"]??0} onChange={e=>setMatchStats({...matchStats,["home_crosses"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_crosses"]??0} onChange={e=>setMatchStats({...matchStats,["away_crosses"]:e.target.value})}/></label></div></div><div className="status-card"><b>Free kicks</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_free_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["home_free_kicks"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_free_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["away_free_kicks"]:e.target.value})}/></label></div></div><div className="status-card"><b>Goal kicks</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_goal_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["home_goal_kicks"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_goal_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["away_goal_kicks"]:e.target.value})}/></label></div></div><div className="status-card"><b>Throw-ins</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_throw_ins"]??0} onChange={e=>setMatchStats({...matchStats,["home_throw_ins"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_throw_ins"]??0} onChange={e=>setMatchStats({...matchStats,["away_throw_ins"]:e.target.value})}/></label></div></div><div className="status-card"><b>Expected goals (xG)</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_xg"]??0} onChange={e=>setMatchStats({...matchStats,["home_xg"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_xg"]??0} onChange={e=>setMatchStats({...matchStats,["away_xg"]:e.target.value})}/></label></div></div><button className="button primary" disabled={saving} onClick={saveStats}>Save match statistics</button></div>}</div></div>}{tab==="lineups"&&<div className="stats-grid">
        <div className="panel">
          <h2>Match Lineups</h2>
          <p className="muted">Lineups open 30 minutes before kickoff and can be submitted before the match starts.</p>
          <label>Match<select value={lineupMatch?.id||""} onChange={async e=>{const m=matches.find(x=>x.id===e.target.value);setLineupMatch(m||null);setLineupTeam("");setLineup(null);setLineupPlayers([]);}}><option value="">Select fixture</option>{matches.filter(x=>x.status==="scheduled"||x.status==="live"||x.status==="halftime").map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {x.status}</option>)}</select></label>
          {lineupMatch&&<div className="form-stack" style={{marginTop:16}}>
            <label>Team<select value={lineupTeam} onChange={async e=>{setLineupTeam(e.target.value);setLineup(null);setLineupPlayers([]);if(e.target.value)await loadLineup(lineupMatch.id,e.target.value);}}><option value="">Select team</option><option value={lineupMatch.home_team_id}>{lineupMatch.home?.name}</option><option value={lineupMatch.away_team_id}>{lineupMatch.away?.name}</option></select></label>
            {lineupTeam&&<><label>Formation<input placeholder="e.g. 4-3-3" value={lineup?.formation||""} onChange={e=>setLineup({...lineup,formation:e.target.value})}/></label>
            <label>Captain<select value={lineup?.captain_player_id||""} onChange={e=>setLineup({...lineup,captain_player_id:e.target.value})}><option value="">Select captain</option>{lineupPlayers.filter(x=>x.role==="starter").map(x=>{const p=players.find(y=>y.id===x.player_id);return <option key={x.player_id} value={x.player_id}>{p?.full_name||x.player_id}</option>})}</select></label>
            <button className="button primary" disabled={saving||lineupLoading} onClick={saveLineup}>Save lineup</button></>}
          </div>}
        </div>
        <div className="panel">
          <h2>Squad Selection</h2>
          {!lineupTeam?<p className="muted">Select a match and team.</p>:<div className="form-stack">
            {players.filter(p=>p.team_id===lineupTeam).map(p=>{const row=lineupPlayers.find(x=>x.player_id===p.id);return <div key={p.id} className="status-card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span><b>{p.full_name}</b><br/>#{p.shirt_number||"—"} · {p.position||"Position not set"}</span><div style={{display:"flex",gap:6}}><button className={"button "+(row?.role==="starter"?"primary":"")} onClick={()=>{if(row?.role==="starter")setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id));else {setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id).concat({player_id:p.id,role:"starter",shirt_number:p.shirt_number||null,position:p.position||null}));}}}>Starter</button><button className={"button "+(row?.role==="substitute"?"primary":"")} onClick={()=>{if(row?.role==="substitute")setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id));else {setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id).concat({player_id:p.id,role:"substitute",shirt_number:p.shirt_number||null,position:p.position||null}));}}}>Sub</button></div></div>})}
            <p className="muted">Starters: {lineupPlayers.filter(x=>x.role==="starter").length}/11 · Substitutes: {lineupPlayers.filter(x=>x.role==="substitute").length}</p>
          </div>}
        </div>
      </div>}
      {tab==="review"&&<div className="stats-grid">
  <div className="panel">
    <h2>Reporter / Match Reports</h2>
    <p className="muted">Create and submit an official report for a completed match.</p>
    <label>Match<select value={reportMatch?.id||""} onChange={e=>{const m=matches.find(x=>x.id===e.target.value);setReportMatch(m||null);setReport(null);}}><option value="">Select finished match</option>{matches.filter(x=>x.status==="finished"||x.status==="verified").map(x=><option key={x.id} value={x.id}>{x.home?.name} {x.home_score} - {x.away_score} {x.away?.name}</option>)}</select></label>
    {reportMatch&&<div className="form-stack" style={{marginTop:16}}>
      <label>Summary<textarea rows="5" value={report?.summary||""} onChange={e=>setReport({...report,summary:e.target.value})}/></label>
      <label>Incidents<textarea rows="7" value={report?.incidents||""} onChange={e=>setReport({...report,incidents:e.target.value})}/></label>
      <button className="button primary" disabled={saving} onClick={saveReport}>Save / Submit Report</button>
      {report?.status&&<p className="muted">Current status: {report.status}</p>}
    </div>}
  </div>
  <div className="panel">
    <h2>Verification Queue</h2>
    <p className="muted">Review submitted reports and lock official results after verification.</p>
    <div className="form-stack">{reports.map(r=><div key={r.id} className="status-card">
      <b>{r.match?.home?.name} {r.match?.home_score} - {r.match?.away_score} {r.match?.away?.name}</b>
      <p className="muted">{r.status} · {r.submitted_at?new Date(r.submitted_at).toLocaleString():"Not submitted"}</p>
      <p>{r.summary||"No summary yet."}</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button className="button" onClick={()=>setReport(r)}>Open</button>
        <button className="button primary" disabled={saving||r.status==="verified"} onClick={()=>verifyReport(r)}>Verify & Lock</button>
        <button className="button" disabled={saving||r.status==="rejected"} onClick={()=>rejectReport(r)}>Reject</button>
      </div>
    </div>)}{!reports.length&&<p className="muted">No reports in the queue.</p>}</div>
  </div>
</div>}
{tab==="teams"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("teams",{name:team.name.trim(),short_name:team.short_name.trim()||null,area:team.area.trim()||null,home_venue:team.home_venue.trim()||null},()=>setTeam({name:"",short_name:"",area:"",home_venue:""}));}}>
          <h2>Team registry</h2><label>Team name<input required value={team.name} onChange={e=>setTeam({...team,name:e.target.value})}/></label><label>Short name<input value={team.short_name} onChange={e=>setTeam({...team,short_name:e.target.value})}/></label><label>Area<input value={team.area} onChange={e=>setTeam({...team,area:e.target.value})}/></label><label>Home venue<input value={team.home_venue} onChange={e=>setTeam({...team,home_venue:e.target.value})}/></label><button className="button primary" disabled={saving}>Register team</button>
        </form>
        <div className="panel"><h2>Registered teams</h2>{teams.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.short_name||"—"} · {x.area||"Oti"} · {x.home_venue||"Venue not set"}</span></div>)}{!teams.length&&<p className="muted">No teams yet.</p>}</div>
      </div>}

      {tab==="players"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("players",{team_id:player.team_id,full_name:player.full_name.trim(),shirt_number:player.shirt_number?Number(player.shirt_number):null,position:player.position.trim()||null},()=>setPlayer({team_id:"",full_name:"",shirt_number:"",position:""}));}}>
          <h2>Player registry</h2><label>Team<select required value={player.team_id} onChange={e=>setPlayer({...player,team_id:e.target.value})}><option value="">Select team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Full name<input required value={player.full_name} onChange={e=>setPlayer({...player,full_name:e.target.value})}/></label><label>Shirt number<input type="number" value={player.shirt_number} onChange={e=>setPlayer({...player,shirt_number:e.target.value})}/></label><label>Position<input value={player.position} onChange={e=>setPlayer({...player,position:e.target.value})}/></label><button className="button primary" disabled={saving}>Register player</button>
        </form>
        <div className="panel"><h2>Registered players</h2>{players.map(x=><div className="status-card" key={x.id}><b>{x.full_name}</b><span>{x.teams?.name||"Team"} · #{x.shirt_number||"—"} · {x.position||"Position not set"}</span></div>)}{!players.length&&<p className="muted">No players yet.</p>}</div>
      </div>}
    </section>
  </main>;
}