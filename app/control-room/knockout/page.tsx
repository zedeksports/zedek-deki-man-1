"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type Season={id:string;name:string};
type Stage={id:string;season_id:string;name:string;stage_type:string;stage_order:number};
type Team={id:string;name:string};
type Tie={id:string;stage_id:string;season_id:string;tie_number:number;leg_count:number;home_team_id:string|null;away_team_id:string|null;winner_team_id:string|null;status:string;next_tie_id:string|null;next_slot:number|null};
type Leg={id:string;tie_id:string;leg_number:number;match_id:string|null;home_team_id:string|null;away_team_id:string|null;home_score:number;away_score:number;winner_team_id:string|null;penalty_winner_team_id:string|null;resolved_by:string|null;extra_time_played:boolean};

export default function KnockoutPage(){
 const s=createSupabaseBrowserClient();
 const [seasons,setSeasons]=useState<Season[]>([]);
 const [stages,setStages]=useState<Stage[]>([]);
 const [teams,setTeams]=useState<Team[]>([]);
 const [ties,setTies]=useState<Tie[]>([]);
 const [legs,setLegs]=useState<Leg[]>([]);
 const [seasonId,setSeasonId]=useState("");
 const [stageId,setStageId]=useState("");
 const [tieNumber,setTieNumber]=useState("1");
 const [legCount,setLegCount]=useState("1");
 const [homeId,setHomeId]=useState("");
 const [awayId,setAwayId]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [generating,setGenerating]=useState(false);

 async function load(){
  const [a,b,c,d,e]=await Promise.all([
   s.from("seasons").select("id,name").order("created_at",{ascending:false}),
   s.from("stages").select("id,season_id,name,stage_type,stage_order").order("stage_order"),
   s.from("teams").select("id,name").order("name"),
   s.from("knockout_ties").select("*").order("tie_number"),
   s.from("knockout_tie_legs").select("*").order("leg_number")
  ]);
  const er=a.error||b.error||c.error||d.error||e.error;
  if(er){setError(er.message);return}
  setSeasons(a.data||[]);setStages(b.data||[]);setTeams(c.data||[]);setTies(d.data||[]);setLegs(e.data||[]);
  if(!seasonId&&a.data?.[0])setSeasonId(a.data[0].id);
 }
 useEffect(()=>{load()},[]);

 const seasonStages=useMemo(()=>stages.filter(x=>x.season_id===seasonId&&["knockout","quarter_final","semi_final","final"].includes(x.stage_type)),[stages,seasonId]);
 const stageTies=useMemo(()=>ties.filter(x=>x.stage_id===stageId),[ties,stageId]);
 const teamName=(id:string|null)=>teams.find(t=>t.id===id)?.name||"TBD";

 async function generateBracket(){
  setError("");setMessage("");setGenerating(true);
  try{
   if(!seasonId||!stageId){setError("Choose a season and knockout stage.");return}
   if(stageTies.length){setError("This stage already has ties. Generate only on an empty knockout stage.");return}
   const {data:registered,error:re}=await s.from("stage_teams").select("team_id,seed").eq("stage_id",stageId);
   if(re)throw new Error(re.message);
   const seeded=(registered||[]).map((x:any)=>({id:x.team_id,seed:x.seed})).filter((x:any)=>x.id);
   if(seeded.length<2){setError("At least two teams are required.");return}
   const ids=seeded.sort((a:any,b:any)=>(a.seed??999999)-(b.seed??999999)||a.id.localeCompare(b.id)).map((x:any)=>x.id);
   const power=2**Math.ceil(Math.log2(ids.length));
   const firstTieCount=power/2;
   const slots=(ids.length===power)?ids:[...ids,...Array(power-ids.length).fill(null)];
   const firstRows:any[]=[];
   for(let i=0;i<firstTieCount;i++){
    const home=slots[i*2]||null,away=slots[i*2+1]||null;
    const isBye=!!home!==!!away;
    const {data:t,error:te}=await s.from("knockout_ties").insert({
      season_id:seasonId,stage_id:stageId,tie_number:i+1,leg_count:1,
      home_team_id:home,away_team_id:away,
      winner_team_id:isBye?(home||away):null,status:isBye?"decided":"scheduled"
    }).select("*").single();
    if(te||!t)throw new Error(te?.message||"Could not create first-round tie.");
    firstRows.push(t);
    if(!isBye){
      const {error:le}=await s.from("knockout_tie_legs").insert({tie_id:t.id,leg_number:1,home_team_id:home,away_team_id:away});
      if(le)throw new Error(le.message);
    }
   }
   const orderedStages=stages.filter(x=>x.season_id===seasonId&&["knockout","quarter_final","semi_final","final"].includes(x.stage_type)).sort((a,b)=>a.stage_order-b.stage_order);
   const currentIndex=orderedStages.findIndex(x=>x.id===stageId);
   let previous=firstRows;
   for(let si=currentIndex+1;si<orderedStages.length&&previous.length>1;si++){
    const nextStage=orderedStages[si];
    const needed=Math.ceil(previous.length/2);
    const existing=ties.filter(x=>x.stage_id===nextStage.id);
    if(existing.length)throw new Error(nextStage.name+" already contains knockout ties. Clear that stage before generating the bracket.");
    const nextRows:any[]=[];
    for(let i=0;i<needed;i++){
      const {data:t,error:te}=await s.from("knockout_ties").insert({
       season_id:seasonId,stage_id:nextStage.id,tie_number:i+1,leg_count:1,status:"pending"
      }).select("*").single();
      if(te||!t)throw new Error(te?.message||"Could not create "+nextStage.name+" tie.");
      nextRows.push(t);
      const {error:le}=await s.from("knockout_tie_legs").insert({tie_id:t.id,leg_number:1});
      if(le)throw new Error(le.message);
    }
    for(let i=0;i<previous.length;i++){
      const next=nextRows[Math.floor(i/2)];
      const slot=i%2===0?1:2;
      const {error:ue}=await s.from("knockout_ties").update({next_tie_id:next.id,next_slot:slot}).eq("id",previous[i].id);
      if(ue)throw new Error(ue.message);
    }
    previous=nextRows;
   }
   // Push any first-round byes into their next slots immediately.
   for(const row of firstRows){
    if(row.status!=="decided"||!row.winner_team_id||!row.next_tie_id)continue;
    await advanceWinner(row,row.winner_team_id);
   }
   setMessage(ids.length===power
    ?"Full knockout bracket generated."
    :"Knockout bracket generated with automatic byes for the unmatched slots.");
   await load();
  }catch(e:any){setError(e?.message||"Bracket generation failed.")}
  finally{setGenerating(false)}
 }
 async function createTie(){
  setError("");setMessage("");
  if(!seasonId||!stageId){setError("Choose a season and knockout stage.");return}
  if(homeId&&awayId&&homeId===awayId){setError("A team cannot face itself.");return}
  const n=Number(tieNumber);
  if(!Number.isInteger(n)||n<1){setError("Tie number must be positive.");return}
  const {data,error:e}=await s.from("knockout_ties").insert({
   season_id:seasonId,stage_id:stageId,tie_number:n,leg_count:Number(legCount),
   home_team_id:homeId||null,away_team_id:awayId||null,status:"scheduled"
  }).select("*").single();
  if(e){setError(e.message);return}
  const count=Number(legCount);
  for(let i=1;i<=count;i++){
   const {error:le}=await s.from("knockout_tie_legs").insert({
    tie_id:data.id,leg_number:i,
    home_team_id:i===1?homeId||null:(awayId||null),
    away_team_id:i===1?awayId||null:(homeId||null)
   });
   if(le){setError(le.message);return}
  }
  setMessage("Knockout tie created.");setTieNumber(String(n+1));await load();
 }

 async function resolveTie(tie:Tie){
  setError("");setMessage("");
  const ls=legs.filter(x=>x.tie_id===tie.id).sort((a,b)=>a.leg_number-b.leg_number);
  if(!ls.length||ls.some(x=>!x.match_id)){setError("Every leg must be linked to a match before resolution.");return}
  const matchIds=ls.map(x=>x.match_id as string);
  const {data:matches,error:me}=await s.from("matches").select("id,status,home_score,away_score").in("id",matchIds);
  if(me){setError(me.message);return}
  if((matches||[]).some((m:any)=>!["finished","verified"].includes(m.status))){setError("Only finished or verified matches can decide a knockout tie.");return}
  let homeTotal=0,awayTotal=0;
  const updates:any[]=[];
  for(const leg of ls){
   const m=(matches||[]).find((x:any)=>x.id===leg.match_id) as any;
   if(!m)continue;
   // Aggregate by tie participants, not by the physical home/away side of leg 2.
   if(leg.home_team_id===tie.home_team_id){homeTotal+=m.home_score;awayTotal+=m.away_score}
   else if(leg.away_team_id===tie.home_team_id){homeTotal+=m.away_score;awayTotal+=m.home_score}
   else {homeTotal+=m.home_score;awayTotal+=m.away_score}
   let winner:null|string=null;
   if(m.home_score>m.away_score)winner=leg.home_team_id;
   else if(m.away_score>m.home_score)winner=leg.away_team_id;
   updates.push({id:leg.id,winner_team_id:winner,home_score:m.home_score,away_score:m.away_score,resolved_by:m.home_score===m.away_score?"penalties_pending":"score"});
  }
  if(tie.leg_count===1){
   const l=updates[0];
   if(!l.winner_team_id){
    const home=teamName(ls[0].home_team_id),away=teamName(ls[0].away_team_id);
    const choice=window.prompt("Match is level. Enter the deciding winner exactly as shown: "+home+" OR "+away);
    const winner=choice?.trim()===home?ls[0].home_team_id:choice?.trim()===away?ls[0].away_team_id:null;
    if(!winner){setError("A valid penalty winner is required: "+home+" or "+away+".");return}
    l.winner_team_id=winner;l.penalty_winner_team_id=winner;l.resolved_by="penalties";l.extra_time_played=window.confirm("Was extra time played before the penalties?");
   }
   await s.from("knockout_tie_legs").update(l).eq("id",l.id);
   await s.from("knockout_ties").update({winner_team_id:l.winner_team_id,status:"decided"}).eq("id",tie.id);
   await advanceWinner(tie,l.winner_team_id);
  }else{
   const h=homeTotal,a=awayTotal;
   if(h===a){
    const home=teamName(tie.home_team_id),away=teamName(tie.away_team_id);
    const choice=window.prompt("Aggregate is level. Enter the deciding winner exactly as shown: "+home+" OR "+away);
    const winner=choice?.trim()===home?tie.home_team_id:choice?.trim()===away?tie.away_team_id:null;
    if(!winner){setError("A valid aggregate penalty winner is required: "+home+" or "+away+".");return}
    const et=window.confirm("Was extra time played before the penalties?");
    for(const u of updates)if(u.winner_team_id===null){u.penalty_winner_team_id=winner;u.resolved_by="penalties";u.extra_time_played=et}
    for(const u of updates)await s.from("knockout_tie_legs").update(u).eq("id",u.id);
    await s.from("knockout_ties").update({winner_team_id:winner,status:"decided"}).eq("id",tie.id);
    await advanceWinner(tie,winner);
    setMessage("Two-leg tie resolved by penalties from the aggregate draw.");await load();return
   }
   const winner=h>a?tie.home_team_id:tie.away_team_id;
   if(!winner){setError("Tie teams are incomplete.");return}
   for(const u of updates)await s.from("knockout_tie_legs").update(u).eq("id",u.id);
   await s.from("knockout_ties").update({winner_team_id:winner,status:"decided"}).eq("id",tie.id);
   await advanceWinner(tie,winner);
  }
  setMessage("Tie resolved from official match results.");await load();
 }

 async function advanceWinner(tie:Tie,winner:string){
  if(!tie.next_tie_id)return;
  const field=tie.next_slot===2?"away_team_id":"home_team_id";
  await s.from("knockout_ties").update({[field]:winner}).eq("id",tie.next_tie_id);
  const nextLeg=await s.from("knockout_tie_legs").select("id,leg_number").eq("tie_id",tie.next_tie_id).eq("leg_number",1).maybeSingle();
  if(nextLeg.data)await s.from("knockout_tie_legs").update({[field]:winner}).eq("id",nextLeg.data.id);
 }

 async function linkLeg(id:string){
  const matchId=window.prompt("Enter the existing match UUID to link to this leg:");
  if(!matchId)return;
  setError("");setMessage("");
  const {data,error:e}=await s.from("matches").select("id").eq("id",matchId).maybeSingle();
  if(e||!data){setError("Match UUID was not found.");return}
  const {error:ue}=await s.from("knockout_tie_legs").update({match_id:matchId}).eq("id",id);
  if(ue)setError(ue.message);else{setMessage("Leg linked to match.");await load()}
 }

 return <main className="page">
  <header className="site-header"><div className="container nav"><a className="brand" href="/control-room">ZEDEK <span>SPORTS</span></a><nav className="nav-links"><a href="/control-room">Dashboard</a><a href="/control-room/qualification">Qualification</a></nav></div></header>
  <section className="container page-header"><div className="eyebrow">Football Operations · Knockout</div><h1>Knockout & Tie Manager</h1><p>Manage one-leg and two-leg knockout ties using verified match results.</p></section>
  <section className="container section"><div className="panel"><h2>Create Tie</h2>
   <div className="form-grid">
    <label>Season<select value={seasonId} onChange={e=>{setSeasonId(e.target.value);setStageId("")}}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Knockout Stage<select value={stageId} onChange={e=>setStageId(e.target.value)}><option value="">Select stage</option>{seasonStages.map(x=><option key={x.id} value={x.id}>{x.name} · {x.stage_type}</option>)}</select></label>
    <label>Tie Number<input type="number" min="1" value={tieNumber} onChange={e=>setTieNumber(e.target.value)}/></label>
    <label>Format<select value={legCount} onChange={e=>setLegCount(e.target.value)}><option value="1">One leg</option><option value="2">Two legs</option></select></label>
    <label>Home Team<select value={homeId} onChange={e=>setHomeId(e.target.value)}><option value="">TBD</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Away Team<select value={awayId} onChange={e=>setAwayId(e.target.value)}><option value="">TBD</option>{teams.filter(x=>x.id!==homeId).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   </div>
   <div className="button-row"><button className="button primary" onClick={createTie}>Create Knockout Tie</button><button className="button" onClick={generateBracket} disabled={generating}>{generating?"Generating…":"Generate Bracket from Stage Teams"}</button></div>
   {message&&<div className="success-box">{message}</div>}{error&&<div className="error-box">{error}</div>}
  </div></section>
  <section className="container section"><div className="panel"><h2>Stage Bracket</h2>
   {stageTies.map(t=>{
    const ls=legs.filter(l=>l.tie_id===t.id).sort((a,b)=>a.leg_number-b.leg_number);
    return <div className="status-card" key={t.id}><strong>Tie {t.tie_number}</strong> · {t.leg_count} leg{t.leg_count===1?"":"s"} · {t.status}
      <div>{teamName(t.home_team_id)} vs {teamName(t.away_team_id)}</div>
      {ls.map(l=><div className="panel" key={l.id}><small>Leg {l.leg_number}: {teamName(l.home_team_id)} {l.home_score}-{l.away_score} {teamName(l.away_team_id)}</small><div className="button-row"><button className="button" onClick={()=>linkLeg(l.id)}>{l.match_id?"Relink Match":"Link Match"}</button></div></div>)}
      <div className="button-row"><button className="button primary" onClick={()=>resolveTie(t)}>Resolve Tie</button></div>
      {t.winner_team_id&&<div>Winner: <strong>{teamName(t.winner_team_id)}</strong></div>}
    </div>
   })}
   {!stageTies.length&&<div className="status-card">No knockout ties in this stage yet.</div>}
  </div></section>
 </main>
}
