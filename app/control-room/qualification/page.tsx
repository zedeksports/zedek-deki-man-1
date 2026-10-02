"use client";
import {useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "../../../lib/supabase/browser";

type Season={id:string;name:string};
type Stage={id:string;season_id:string;name:string;stage_type:string;stage_order:number};
type Group={id:string;name:string;stage_id:string};
type Team={id:string;name:string};
type Rule={id:string;from_stage_id:string;to_stage_id:string;from_group_id:string|null;source_position:number;target_slot:number|null};

export default function QualificationPage(){
 const s=createSupabaseBrowserClient();
 const [seasons,setSeasons]=useState<Season[]>([]);
 const [stages,setStages]=useState<Stage[]>([]);
 const [groups,setGroups]=useState<Group[]>([]);
 const [rules,setRules]=useState<Rule[]>([]);
 const [seasonId,setSeasonId]=useState("");
 const [fromId,setFromId]=useState("");
 const [toId,setToId]=useState("");
 const [fromGroup,setFromGroup]=useState("");
 const [position,setPosition]=useState("1");
 const [slot,setSlot]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [applying,setApplying]=useState(false);

 async function load(){
  const [a,b,c,d]=await Promise.all([
   s.from("seasons").select("id,name").order("created_at",{ascending:false}),
   s.from("stages").select("id,season_id,name,stage_type,stage_order").order("stage_order"),
   s.from("groups").select("id,name,stage_id").order("group_order"),
   s.from("stage_qualification_rules").select("*")
  ]);
  const er=a.error||b.error||c.error||d.error;
  if(er){setError(er.message);return}
  setSeasons(a.data||[]);setStages(b.data||[]);setGroups(c.data||[]);setRules(d.data||[]);
  if(!seasonId&&a.data?.[0])setSeasonId(a.data[0].id);
 }
 useEffect(()=>{load()},[]);

 const seasonStages=useMemo(()=>stages.filter(x=>x.season_id===seasonId),[stages,seasonId]);
 const fromGroups=useMemo(()=>groups.filter(g=>g.stage_id===fromId),[groups,fromId]);

 async function addRule(){
  setError("");setMessage("");
  if(!fromId||!toId||fromId===toId){setError("Choose two different stages.");return}
  const {error:e}=await s.from("stage_qualification_rules").insert({
   from_stage_id:fromId,to_stage_id:toId,from_group_id:fromGroup||null,
   source_position:Number(position),target_slot:slot?Number(slot):null
  });
  if(e)setError(e.message);else{setMessage("Qualification rule saved.");await load()}
 }

 async function calculate(){
  setError("");setMessage("");
  if(!seasonId||!fromId||!toId){setError("Choose season and both stages.");return}
  const stage=stages.find(x=>x.id===fromId);
  if(stage?.stage_type==="knockout"){setError("Knockout progression needs tie/bracket logic; league-position calculation is not applied.");return}

  const {data:rs,error:re}=await s.from("stage_qualification_rules").select("*").eq("from_stage_id",fromId).eq("to_stage_id",toId);
  if(re){setError(re.message);return}
  if(!rs?.length){setError("No qualification rules exist for this stage transition.");return}

  const [mr,tr]=await Promise.all([
   s.from("matches").select("id,stage_id,group_id,home_team_id,away_team_id,status,home_score,away_score").eq("stage_id",fromId).in("status",["finished","verified"]),
   s.from("stage_teams").select("stage_id,team_id,group_id").eq("stage_id",fromId)
  ]);
  if(mr.error||tr.error){setError(mr.error?.message||tr.error?.message||"Could not load stage data.");return}

  const rows:Record<string,any>={};
  (tr.data||[]).forEach((x:any)=>rows[x.team_id]={team_id:x.team_id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,group_id:x.group_id});
  (mr.data||[]).forEach((m:any)=>{
   if(!rows[m.home_team_id]||!rows[m.away_team_id])return;
   const h=rows[m.home_team_id],a=rows[m.away_team_id];
   h.p++;a.p++;h.gf+=m.home_score;h.ga+=m.away_score;a.gf+=m.away_score;a.ga+=m.home_score;
   if(m.home_score>m.away_score){h.w++;h.pts+=3;a.l++}
   else if(m.home_score<m.away_score){a.w++;a.pts+=3;h.l++}
   else{h.d++;a.d++;h.pts++;a.pts++}
  });

  const qualified:any[]=[];
  (rs as Rule[]).forEach(r=>{
   const pool=Object.values(rows).filter((x:any)=>!r.from_group_id||x.group_id===r.from_group_id)
    .sort((a:any,b:any)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||String(a.team_id).localeCompare(String(b.team_id)));
   const pick=pool[r.source_position-1] as any;
   if(pick)qualified.push({
    rule_id:r.id,season_id:seasonId,team_id:pick.team_id,to_stage_id:toId,
    target_slot:r.target_slot,source_position:r.source_position,source_group_id:r.from_group_id,status:"qualified"
   });
  });

  if(!qualified.length){setError("No team currently qualifies under the configured rules.");return}
  const {error:ie}=await s.from("stage_qualifications").upsert(qualified,{onConflict:"season_id,rule_id,team_id"});
  if(ie){setError(ie.message);return}
  setMessage(qualified.length+" qualification outcome(s) calculated and stored.");
 }

 async function applyQualifications(){
  setError("");setMessage("");setApplying(true);
  try{
   if(!seasonId||!toId){setError("Choose a season and destination stage.");return}
   const {data:q,error:qe}=await s.from("stage_qualifications").select("*").eq("season_id",seasonId).eq("to_stage_id",toId).eq("status","qualified");
   if(qe){setError(qe.message);return}
   if(!q?.length){setError("No calculated qualified teams are ready to apply.");return}
   const {data:existing,error:ee}=await s.from("stage_teams").select("team_id").eq("stage_id",toId);
   if(ee){setError(ee.message);return}
   const existingIds=new Set((existing||[]).map((x:any)=>x.team_id));
   const rows=q.filter((x:any)=>!existingIds.has(x.team_id)).map((x:any)=>({stage_id:toId,team_id:x.team_id,group_id:null,seed:x.target_slot}));
   if(rows.length){const {error:ie}=await s.from("stage_teams").insert(rows);if(ie){setError(ie.message);return}}
   const {error:ue}=await s.from("stage_qualifications").update({status:"applied"}).in("id",q.map((x:any)=>x.id));
   if(ue){setError(ue.message);return}
   setMessage(rows.length+" qualified team(s) applied to the destination stage.");
  }finally{setApplying(false)}
 }

 const visibleRules=rules.filter(r=>seasonStages.some(s=>s.id===r.from_stage_id)||seasonStages.some(s=>s.id===r.to_stage_id));

 return <main className="page">
  <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Dashboard</a><a href="/control-room/standings">Standings</a></nav></div></header>
  <section className="container page-header"><div className="eyebrow">Football Intelligence · Progression</div><h1>Qualification & Progression</h1><p>Configure stage rules and calculate qualified teams from official completed results.</p></section>
  <section className="container section"><div className="panel"><h2>Stage Rule</h2>
   <div className="form-grid">
    <label>Season<select value={seasonId} onChange={e=>{setSeasonId(e.target.value);setFromId("");setToId("")}}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>From Stage<select value={fromId} onChange={e=>setFromId(e.target.value)}><option value="">Select stage</option>{seasonStages.map(x=><option key={x.id} value={x.id}>{x.name} · {x.stage_type}</option>)}</select></label>
    <label>To Stage<select value={toId} onChange={e=>setToId(e.target.value)}><option value="">Select stage</option>{seasonStages.filter(x=>x.id!==fromId).map(x=><option key={x.id} value={x.id}>{x.name} · {x.stage_type}</option>)}</select></label>
    {fromGroups.length>0&&<label>Source Group<select value={fromGroup} onChange={e=>setFromGroup(e.target.value)}><option value="">Any group</option>{fromGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
    <label>Source Position<input type="number" min="1" value={position} onChange={e=>setPosition(e.target.value)}/></label>
    <label>Target Slot (optional)<input type="number" min="1" value={slot} onChange={e=>setSlot(e.target.value)}/></label>
   </div>
   <div className="button-row"><button className="button primary" onClick={addRule}>Save Rule</button><button className="button" onClick={calculate}>Calculate Qualification</button><button className="button primary" onClick={applyQualifications} disabled={applying}>{applying?"Applying…":"Apply Qualified Teams"}</button></div>
   {message&&<div className="success-box">{message}</div>}{error&&<div className="error-box">{error}</div>}
  </div></section>
  <section className="container section"><div className="panel"><h2>Configured Rules</h2>
   {visibleRules.map(r=><div className="status-card" key={r.id}>{stages.find(s=>s.id===r.from_stage_id)?.name||"Stage"} → {stages.find(s=>s.id===r.to_stage_id)?.name||"Stage"} · Position {r.source_position}{r.target_slot?(" → Slot "+r.target_slot):""}</div>)}
   {visibleRules.length===0&&<div className="status-card">No qualification rules configured yet.</div>}
  </div></section>
 </main>
}
