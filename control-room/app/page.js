"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

const TABS=["overview","competitions","seasons","teams","players"];

function getSupabase(){if(typeof window==="undefined")return null;return createSupabaseBrowserClient();}

export default function ControlRoomPage(){
  const [loading,setLoading]=useState(true),[user,setUser]=useState(null),[profile,setProfile]=useState(null);
  const [tab,setTab]=useState("overview"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [competitions,setCompetitions]=useState([]),[seasons,setSeasons]=useState([]),[teams,setTeams]=useState([]),[players,setPlayers]=useState([]);
  const [competition,setCompetition]=useState({name:"",code:"",location:"",format:"league",description:""});
  const [season,setSeason]=useState({competition_id:"",name:"",year:"",start_date:"",end_date:""});
  const [team,setTeam]=useState({name:"",short_name:"",area:"",home_venue:""});
  const [player,setPlayer]=useState({team_id:"",full_name:"",shirt_number:"",position:""});
  const [saving,setSaving]=useState(false);

  async function refresh(){
    setError(""); const supabase=getSupabase(); if(!supabase)return;
    const [a,b,c,d]=await Promise.all([
      supabase.from("competitions").select("*").order("name"),
      supabase.from("seasons").select("*, competitions(name)").order("created_at",{ascending:false}),
      supabase.from("teams").select("*").order("name"),
      supabase.from("players").select("*, teams(name)").order("full_name")
    ]);
    const bad=[a,b,c,d].find(x=>x.error); if(bad){setError(bad.error.message);return;}
    setCompetitions(a.data||[]);setSeasons(b.data||[]);setTeams(c.data||[]);setPlayers(d.data||[]);
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
    boot(); return()=>{mounted=false};
  },[]);

  async function save(table,values,reset){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!supabase){setSaving(false);return;}
    const result=await supabase.from(table).insert(values);setSaving(false);
    if(result.error){setError(result.error.message);return;} reset();setNotice("Saved successfully.");await refresh();
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
        {TABS.map(item=><button key={item} className={"button "+(tab===item?"primary":"")} onClick={()=>setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</button>)}
      </div>
      {tab==="overview"&&<div className="grid">
        <div className="card"><h2>{competitions.length}</h2><p>Competitions</p></div><div className="card"><h2>{seasons.length}</h2><p>Seasons</p></div>
        <div className="card"><h2>{teams.length}</h2><p>Teams</p></div><div className="card"><h2>{players.length}</h2><p>Players</p></div>
        <div className="card"><h2>Phase 2</h2><p>Next: stages → fixtures → lineups → match control → reports.</p></div>
      </div>}
      {tab==="competitions"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("competitions",{name:competition.name.trim(),code:competition.code.trim()||null,location:competition.location.trim()||null,format:competition.format,description:competition.description.trim()||null},()=>setCompetition({name:"",code:"",location:"",format:"league",description:""}));}}><h2>Competition registry</h2><label>Name<input required value={competition.name} onChange={e=>setCompetition({...competition,name:e.target.value})}/></label><label>Code<input value={competition.code} onChange={e=>setCompetition({...competition,code:e.target.value})}/></label><label>Location<input value={competition.location} onChange={e=>setCompetition({...competition,location:e.target.value})}/></label><label>Format<select value={competition.format} onChange={e=>setCompetition({...competition,format:e.target.value})}><option value="league">League</option><option value="group">Group</option><option value="h2h">H2H</option><option value="knockout">Knockout</option><option value="two_leg">Two-leg</option></select></label><button className="button primary" disabled={saving}>Create competition</button></form>
        <div className="panel"><h2>Registered</h2>{competitions.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.code||"No code"} · {x.location||"No location"} · {x.format}</span></div>)}{!competitions.length&&<p className="muted">No competitions yet.</p>}</div>
      </div>}
      {tab==="seasons"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("seasons",{competition_id:season.competition_id,name:season.name.trim(),year:season.year?Number(season.year):null,start_date:season.start_date||null,end_date:season.end_date||null},()=>setSeason({competition_id:"",name:"",year:"",start_date:"",end_date:""}));}}><h2>Season registry</h2><label>Competition<select required value={season.competition_id} onChange={e=>setSeason({...season,competition_id:e.target.value})}><option value="">Select competition</option>{competitions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Name<input required value={season.name} onChange={e=>setSeason({...season,name:e.target.value})}/></label><label>Year<input type="number" value={season.year} onChange={e=>setSeason({...season,year:e.target.value})}/></label><label>Start<input type="date" value={season.start_date} onChange={e=>setSeason({...season,start_date:e.target.value})}/></label><label>End<input type="date" value={season.end_date} onChange={e=>setSeason({...season,end_date:e.target.value})}/></label><button className="button primary" disabled={saving}>Create season</button></form>
        <div className="panel"><h2>Registered</h2>{seasons.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.competitions?.name||"Competition"} · {x.year||"Year not set"}</span></div>)}{!seasons.length&&<p className="muted">No seasons yet.</p>}</div>
      </div>}
      {tab==="teams"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("teams",{name:team.name.trim(),short_name:team.short_name.trim()||null,area:team.area.trim()||null,home_venue:team.home_venue.trim()||null},()=>setTeam({name:"",short_name:"",area:"",home_venue:""}));}}><h2>Team registry</h2><label>Team name<input required value={team.name} onChange={e=>setTeam({...team,name:e.target.value})}/></label><label>Short name<input value={team.short_name} onChange={e=>setTeam({...team,short_name:e.target.value})}/></label><label>Area<input value={team.area} onChange={e=>setTeam({...team,area:e.target.value})}/></label><label>Home venue<input value={team.home_venue} onChange={e=>setTeam({...team,home_venue:e.target.value})}/></label><button className="button primary" disabled={saving}>Register team</button></form>
        <div className="panel"><h2>Registered teams</h2>{teams.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.short_name||"—"} · {x.area||"Oti"} · {x.home_venue||"Venue not set"}</span></div>)}{!teams.length&&<p className="muted">No teams yet.</p>}</div>
      </div>}
      {tab==="players"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("players",{team_id:player.team_id,full_name:player.full_name.trim(),shirt_number:player.shirt_number?Number(player.shirt_number):null,position:player.position.trim()||null},()=>setPlayer({team_id:"",full_name:"",shirt_number:"",position:""}));}}><h2>Player registry</h2><label>Team<select required value={player.team_id} onChange={e=>setPlayer({...player,team_id:e.target.value})}><option value="">Select team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Full name<input required value={player.full_name} onChange={e=>setPlayer({...player,full_name:e.target.value})}/></label><label>Shirt number<input type="number" value={player.shirt_number} onChange={e=>setPlayer({...player,shirt_number:e.target.value})}/></label><label>Position<input value={player.position} onChange={e=>setPlayer({...player,position:e.target.value})}/></label><button className="button primary" disabled={saving}>Register player</button></form>
        <div className="panel"><h2>Registered players</h2>{players.map(x=><div className="status-card" key={x.id}><b>{x.full_name}</b><span>{x.teams?.name||"Team"} · #{x.shirt_number||"—"} · {x.position||"Position not set"}</span></div>)}{!players.length&&<p className="muted">No players yet.</p>}</div>
      </div>}
    </section>
  </main>;
}