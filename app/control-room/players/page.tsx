"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Team={id:string;name:string;short_name:string|null;area:string|null;is_active:boolean};
type Player={id:string;team_id:string;full_name:string;shirt_number:number|null;position:string|null;date_of_birth:string|null;is_captain:boolean;is_active:boolean};

export default function PlayersPage(){
 const [teams,setTeams]=useState<Team[]>([]),[players,setPlayers]=useState<Player[]>([]),[teamId,setTeamId]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [form,setForm]=useState({full_name:"",shirt_number:"",position:"",date_of_birth:"",is_captain:false});
 async function load(){setLoading(true);const s=createSupabaseBrowserClient();const [t,p]=await Promise.all([s.from("teams").select("id,name,short_name,area,is_active").order("name"),s.from("players").select("id,team_id,full_name,shirt_number,position,date_of_birth,is_captain,is_active").order("full_name")]);if(t.error||p.error)setError(t.error?.message||p.error?.message||"Unable to load players.");else{setTeams(t.data||[]);setPlayers(p.data||[]);if(!teamId&&t.data?.length)setTeamId(t.data[0].id)}setLoading(false)}
 useEffect(()=>{load()},[]);
 async function createPlayer(e:FormEvent){e.preventDefault();if(!teamId)return;setSaving(true);setError("");setNotice("");const s=createSupabaseBrowserClient();if(form.is_captain)await s.from("players").update({is_captain:false}).eq("team_id",teamId);const {error}=await s.from("players").insert({team_id:teamId,full_name:form.full_name.trim(),shirt_number:form.shirt_number?Number(form.shirt_number):null,position:form.position.trim()||null,date_of_birth:form.date_of_birth||null,is_captain:form.is_captain});if(error)setError(error.message);else{setForm({full_name:"",shirt_number:"",position:"",date_of_birth:"",is_captain:false});setNotice("Player added.");await load()}setSaving(false)}
 async function toggle(p:Player){const s=createSupabaseBrowserClient();const {error}=await s.from("players").update({is_active:!p.is_active}).eq("id",p.id);if(error)setError(error.message);else await load()}
 async function captain(p:Player){const s=createSupabaseBrowserClient();setError("");if(!p.is_captain)await s.from("players").update({is_captain:false}).eq("team_id",p.team_id);const {error}=await s.from("players").update({is_captain:!p.is_captain}).eq("id",p.id);if(error)setError(error.message);else{setNotice(p.is_captain?"Captain removed.":"Captain assigned.");await load()}}
 async function remove(p:Player){if(!window.confirm("Delete "+p.full_name+"? Historical match records may prevent deletion."))return;const s=createSupabaseBrowserClient();const {error}=await s.from("players").delete().eq("id",p.id);if(error)setError(error.message);else{setNotice("Player deleted.");await load()}}
 const visible=players.filter(p=>!teamId||p.team_id===teamId);
 return <main className="page"><header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Control Room</a><a href="/control-room/teams">Teams</a></nav></div></header>
 <section className="container page-header"><div className="eyebrow">Football Operations · Phase 2</div><h1>Players & Squads</h1><p>Build team squads now; these players will later feed lineups, match events and player statistics.</p></section>
 <section className="container section"><div className="panel"><h2>Team</h2><label>Select team<select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}{t.area?" · "+t.area:""}</option>)}</select></label></div></section>
 <section className="container section"><div className="panel"><h2>Add player</h2><form className="form-stack" onSubmit={createPlayer}>
 <label>Full name<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
 <label>Shirt number<input type="number" min="1" max="99" value={form.shirt_number} onChange={e=>setForm({...form,shirt_number:e.target.value})}/></label>
 <label>Position<input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="Goalkeeper / Defender / Midfielder / Forward"/></label>
 <label>Date of birth<input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></label>
 <label><input type="checkbox" checked={form.is_captain} onChange={e=>setForm({...form,is_captain:e.target.checked})}/> Captain</label>
 <button className="button primary" disabled={saving||!teamId}>{saving?"Adding...":"Add player"}</button></form></div></section>
 <section className="container section"><div className="section-heading"><h2>Squad</h2><span>{visible.length} players</span></div>{loading?<p>Loading...</p>:visible.length===0?<div className="panel"><p>No players registered for this team yet.</p></div>:<div className="module-grid">{visible.map(p=><article className="module" key={p.id}><strong>{p.full_name}</strong><small>#{p.shirt_number??"—"} · {p.position||"Position not set"}{p.is_captain?" · Captain":""}</small><small>{p.is_active?"Active":"Inactive"}</small><div className="button-row"><button className="button" onClick={()=>captain(p)}>{p.is_captain?"Remove captain":"Make captain"}</button><button className="button" onClick={()=>toggle(p)}>{p.is_active?"Deactivate":"Activate"}</button><button className="button danger" onClick={()=>remove(p)}>Delete</button></div></article>)}</div>}</section>
 {notice&&<div className="container success-box">{notice}</div>}{error&&<div className="container error-box">{error}</div>}</main>
}