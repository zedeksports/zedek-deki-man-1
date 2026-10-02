"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Team = { id:string; name:string; short_name:string|null; area:string|null; home_venue:string|null; founded_year:number|null; is_active:boolean };
type Season = { id:string; name:string; year:number|null; is_active:boolean };
type Stage = { id:string; season_id:string; name:string; stage_type:string; is_active:boolean };
type Group = { id:string; stage_id:string; name:string; group_order:number };
type Link = { season_id:string; team_id:string };
type StageLink = { stage_id:string; team_id:string; group_id:string|null };

export default function TeamsPage() {
  const [teams,setTeams]=useState<Team[]>([]), [seasons,setSeasons]=useState<Season[]>([]), [stages,setStages]=useState<Stage[]>([]);
  const [groups,setGroups]=useState<Group[]>([]), [seasonLinks,setSeasonLinks]=useState<Link[]>([]), [stageLinks,setStageLinks]=useState<StageLink[]>([]);
  const [seasonId,setSeasonId]=useState(""), [stageId,setStageId]=useState(""), [groupId,setGroupId]=useState(""), [newGroup,setNewGroup]=useState("");
  const [form,setForm]=useState({name:"",short_name:"",area:"",home_venue:"",founded_year:""});
  const [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [error,setError]=useState(""), [notice,setNotice]=useState("");

  const stageOptions=useMemo(()=>stages.filter(s=>!seasonId||s.season_id===seasonId),[stages,seasonId]);
  const groupOptions=useMemo(()=>groups.filter(g=>g.stage_id===stageId),[groups,stageId]);
  const seasonTeamIds=useMemo(()=>new Set(seasonLinks.filter(x=>x.season_id===seasonId).map(x=>x.team_id)),[seasonLinks,seasonId]);
  const stageTeamIds=useMemo(()=>new Set(stageLinks.filter(x=>x.stage_id===stageId).map(x=>x.team_id)),[stageLinks,stageId]);

  async function load(){
    setLoading(true); setError("");
    const s=createSupabaseBrowserClient();
    const r=await Promise.all([
      s.from("teams").select("id,name,short_name,area,home_venue,founded_year,is_active").order("name"),
      s.from("seasons").select("id,name,year,is_active").order("year",{ascending:false,nullsFirst:false}),
      s.from("stages").select("id,season_id,name,stage_type,is_active").order("stage_order"),
      s.from("groups").select("id,stage_id,name,group_order").order("group_order"),
      s.from("season_teams").select("season_id,team_id"),
      s.from("stage_teams").select("stage_id,team_id,group_id,seed")
    ]);
    const failed=r.find(x=>x.error);
    if(failed?.error)setError(failed.error.message);
    else { setTeams(r[0].data||[]); setSeasons(r[1].data||[]); setStages(r[2].data||[]); setGroups(r[3].data||[]); setSeasonLinks(r[4].data||[]); setStageLinks(r[5].data||[]);
      if(!seasonId&&r[1].data?.length)setSeasonId(r[1].data[0].id);
      if(!stageId&&r[2].data?.length)setStageId(r[2].data[0].id);
    }
    setLoading(false);
  }
  useEffect(()=>{load()},[]);

  async function createTeam(e:FormEvent){
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const s=createSupabaseBrowserClient();
    const {error}=await s.from("teams").insert({name:form.name.trim(),short_name:form.short_name.trim()||null,area:form.area.trim()||null,home_venue:form.home_venue.trim()||null,founded_year:form.founded_year?Number(form.founded_year):null});
    if(error)setError(error.message); else {setForm({name:"",short_name:"",area:"",home_venue:"",founded_year:""});setNotice("Team created.");await load()} setSaving(false);
  }
  async function toggleTeam(t:Team){const s=createSupabaseBrowserClient();const {error}=await s.from("teams").update({is_active:!t.is_active}).eq("id",t.id);if(error)setError(error.message);else await load()}
  async function deleteTeam(t:Team){if(!window.confirm("Delete "+t.name+"? Historical or assigned records may prevent deletion."))return;const s=createSupabaseBrowserClient();const {error}=await s.from("teams").delete().eq("id",t.id);if(error)setError(error.message);else{setNotice("Team deleted.");await load()}}
  async function seasonToggle(teamId:string){
    const s=createSupabaseBrowserClient(); setError("");
    const exists=seasonTeamIds.has(teamId);
    const q=exists?s.from("season_teams").delete().eq("season_id",seasonId).eq("team_id",teamId):s.from("season_teams").insert({season_id:seasonId,team_id:teamId});
    const {error}=await q;if(error)setError(error.message);else await load();
  }
  async function createGroup(e:FormEvent){e.preventDefault();if(!stageId||!newGroup.trim())return;const s=createSupabaseBrowserClient();const {error}=await s.from("groups").insert({stage_id:stageId,name:newGroup.trim(),group_order:groupOptions.length+1});if(error)setError(error.message);else{setNewGroup("");setNotice("Group created.");await load()}}
  async function stageAssign(teamId:string){
    const s=createSupabaseBrowserClient();const exists=stageTeamIds.has(teamId);setError("");
    const result=exists?s.from("stage_teams").update({group_id:groupId||null}).eq("stage_id",stageId).eq("team_id",teamId):s.from("stage_teams").insert({stage_id:stageId,team_id:teamId,group_id:groupId||null});
    const {error}=await result;if(error)setError(error.message);else{setNotice(exists?"Team moved.":"Team assigned to stage.");await load()}
  }

  return <main className="page">
    <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Control Room</a><a href="/control-room/seasons">Seasons</a><a href="/control-room/stages">Stages</a></nav></div></header>
    <section className="container page-header"><div className="eyebrow">Football Operations · Phase 2</div><h1>Teams, Seasons & Groups</h1><p>Create teams, register them for seasons, create groups and assign teams to stages.</p></section>
    <section className="container section"><div className="panel"><h2>Create team</h2><form className="form-stack" onSubmit={createTeam}>
      <label>Team name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Short name<input value={form.short_name} onChange={e=>setForm({...form,short_name:e.target.value})}/></label>
      <label>Area<input value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></label>
      <label>Home venue<input value={form.home_venue} onChange={e=>setForm({...form,home_venue:e.target.value})}/></label>
      <label>Founded year<input type="number" value={form.founded_year} onChange={e=>setForm({...form,founded_year:e.target.value})}/></label>
      <button className="button primary" disabled={saving}>{saving?"Creating...":"Create team"}</button>
    </form></div></section>
    <section className="container section"><div className="panel"><h2>Season registration</h2>
      <label>Season<select value={seasonId} onChange={e=>setSeasonId(e.target.value)}><option value="">Select season</option>{seasons.map(s=><option key={s.id} value={s.id}>{s.name}{s.year?" ("+s.year+")":""}</option>)}</select></label>
      {seasonId&&<div className="module-grid">{teams.map(t=><article className="module" key={t.id}><strong>{t.name}</strong><small>{t.area||"Area not set"}</small><button className="button" onClick={()=>seasonToggle(t.id)}>{seasonTeamIds.has(t.id)?"Remove from season":"Add to season"}</button></article>)}</div>}
    </div></section>
    <section className="container section"><div className="panel"><h2>Groups & stage teams</h2>
      <label>Stage<select value={stageId} onChange={e=>{setStageId(e.target.value);setGroupId("")}}><option value="">Select stage</option>{stageOptions.map(s=><option key={s.id} value={s.id}>{s.name+" · "+s.stage_type}</option>)}</select></label>
      {stageId&&<form className="form-stack" onSubmit={createGroup}><label>New group<input required value={newGroup} onChange={e=>setNewGroup(e.target.value)} placeholder="e.g. Group A"/></label><button className="button primary">Create group</button></form>}
      {stageId&&<><label>Target group<select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">No group</option>{groupOptions.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <div className="module-grid">{teams.filter(t=>seasonTeamIds.has(t.id)).map(t=><article className="module" key={t.id}><strong>{t.name}</strong><small>{stageTeamIds.has(t.id)?"Assigned to stage":"Not assigned"}</small><button className="button" onClick={()=>stageAssign(t.id)}>{stageTeamIds.has(t.id)?"Move to selected group":"Assign to stage"}</button></article>)}</div></>}
    </div></section>
    <section className="container section"><div className="section-heading"><h2>Registered teams</h2><span>{teams.length} total</span></div>{loading?<p>Loading teams...</p>:teams.length===0?<div className="panel"><p>No teams yet.</p></div>:<div className="module-grid">{teams.map(t=><article className="module" key={t.id}><strong>{t.name}</strong><small>{t.short_name||"No short name"} · {t.area||"Area not set"}</small><div className="button-row"><button className="button" onClick={()=>toggleTeam(t)}>{t.is_active?"Deactivate":"Activate"}</button><button className="button danger" onClick={()=>deleteTeam(t)}>Delete</button></div></article>)}</div>}</section>
    {notice&&<div className="container success-box">{notice}</div>}{error&&<div className="container error-box">{error}</div>}
  </main>
}
