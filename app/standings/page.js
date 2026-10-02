'use client';

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function Table({rows}) {
 return <div className="standings-table-wrap"><table className="standings-table"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.id}><td>{i+1}</td><td><strong>{r.name}</strong></td><td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gf-r.ga}</td><td><strong>{r.pts}</strong></td></tr>)}</tbody></table></div>;
}

export default function StandingsPage(){
 const [competitions,setCompetitions]=useState([]),[seasons,setSeasons]=useState([]),[stages,setStages]=useState([]),[matches,setMatches]=useState([]),[official,setOfficial]=useState(new Set());
 const [competitionId,setCompetitionId]=useState(""),[seasonId,setSeasonId]=useState(""),[stageId,setStageId]=useState("");
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{const supabase=createSupabaseBrowserClient();
  Promise.all([
   supabase.from("competitions").select("id,name").eq("is_active",true).order("name"),
   supabase.from("seasons").select("id,name,year,competition_id").eq("is_active",true).order("year",{ascending:false}),
   supabase.from("stages").select("id,name,season_id,stage_order,is_active").eq("is_active",true).order("stage_order"),
   supabase.from("matches").select("id,season_id,stage_id,group_id,home_team_id,away_team_id,home_score,away_score,status,scheduled_at,home_team:teams!matches_home_team_id_fkey(id,name,short_name),away_team:teams!matches_away_team_id_fkey(id,name,short_name)"),
   supabase.from("match_verifications").select("match_id").eq("official_result",true)
  ]).then(([c,s,st,m,v])=>{if(c.error||s.error||st.error||m.error||v.error){setError((c.error||s.error||st.error||m.error||v.error).message);setLoading(false);return}setCompetitions(c.data||[]);setSeasons(s.data||[]);setStages(st.data||[]);setMatches(m.data||[]);setOfficial(new Set((v.data||[]).map(x=>x.match_id)));setLoading(false);});
 },[]);
 useEffect(()=>{const list=seasons.filter(s=>s.competition_id===competitionId);if(!list.some(s=>s.id===seasonId))setSeasonId(list[0]?.id||"");},[competitionId,seasons]);
 const seasonList=useMemo(()=>seasons.filter(s=>s.competition_id===competitionId),[seasons,competitionId]);
 const stageList=useMemo(()=>stages.filter(s=>s.season_id===seasonId),[stages,seasonId]);
 useEffect(()=>{if(!stageList.some(s=>s.id===stageId))setStageId(stageList[0]?.id||"");},[stageList,stageId]);
 const rows=useMemo(()=>{
  const relevant=matches.filter(m=>m.season_id===seasonId&&(!stageId||m.stage_id===stageId)&&official.has(m.id)&&["finished","verified"].includes(m.status));
  const map=new Map();
  const add=(id,name,gf,ga,w,d,l)=>{if(!map.has(id))map.set(id,{id,name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});const r=map.get(id);r.p++;r.gf+=gf;r.ga+=ga;r.w+=w;r.d+=d;r.l+=l;r.pts+=w*3+d;};
  relevant.forEach(m=>{if(m.home_score==null||m.away_score==null)return;const h=m.home_score,a=m.away_score;add(m.home_team_id,m.home_team?.name||"Home",h,a,h>a?1:0,h===a?1:0,h<a?1:0);add(m.away_team_id,m.away_team?.name||"Away",a,h,a>h?1:0,h===a?1:0,a<h?1:0);});
  return [...map.values()].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name));
 },[matches,seasonId,stageId,official]);
 const selectedComp=competitions.find(c=>c.id===competitionId),selectedSeason=seasons.find(s=>s.id===seasonId),selectedStage=stages.find(s=>s.id===stageId);
 return <main><section className="container page-hero"><span className="section-kicker">Zedek Sports • Official</span><h1>Standings</h1><p>Verified competition tables, calculated from official results only.</p></section><section className="container standings-page">
 <div className="standings-filters"><label>Competition<select value={competitionId} onChange={e=>setCompetitionId(e.target.value)}><option value="">Choose competition</option>{competitions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Season<select value={seasonId} onChange={e=>setSeasonId(e.target.value)} disabled={!seasonList.length}><option value="">Choose season</option>{seasonList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Stage<select value={stageId} onChange={e=>setStageId(e.target.value)} disabled={!stageList.length}><option value="">All stages</option>{stageList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
 {error?<div className="data-note">{error}</div>:loading?<div className="empty-state">Loading standings…</div>:!competitionId||!seasonId?<div className="empty-state"><strong>Select a competition and season.</strong><span>The official table will appear here.</span></div>:<><div className="section-heading"><div><span className="section-kicker">{selectedComp?.name}</span><h2>{selectedSeason?.name}{selectedStage?" • "+selectedStage.name:""}</h2></div><span className="verified-badge">✓ Official only</span></div>{rows.length?<Table rows={rows}/>:<div className="empty-state"><strong>No official results yet.</strong><span>Standings will populate automatically after verified matches are published.</span></div>}</>}
 </section></main>;
}