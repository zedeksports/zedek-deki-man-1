'use client';

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function dateKey(value) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Accra",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
}
function formatDate(value) {
  if (!value) return "Date TBC";
  return new Intl.DateTimeFormat("en-GH",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Africa/Accra"}).format(new Date(value));
}
function Team({ team }) {
  return <div className="mc-team"><div className="mc-logo">{team?.logo_url ? <img src={team.logo_url} alt="" /> : <span>{(team?.short_name || team?.name || "?").slice(0,2).toUpperCase()}</span>}</div><strong>{team?.short_name || team?.name || "Team TBC"}</strong></div>;
}
export default function MatchesPage() {
  const [matches,setMatches]=useState([]),[official,setOfficial]=useState(new Set()),[loading,setLoading]=useState(true),[filter,setFilter]=useState("all");
  const [selectedDate,setSelectedDate]=useState(()=>dateKey(new Date())),[error,setError]=useState("");
  useEffect(()=>{let cancelled=false;async function load(){try{const s=createSupabaseBrowserClient();const [m,v]=await Promise.all([
    s.from("matches").select("id,scheduled_at,status,home_score,away_score,home_team:teams!matches_home_team_id_fkey(id,name,short_name,logo_url),away_team:teams!matches_away_team_id_fkey(id,name,short_name,logo_url),season:seasons(id,name,competition:competitions(id,name))").order("scheduled_at",{ascending:true}).limit(200),
    s.from("match_verifications").select("match_id").eq("official_result",true)
  ]);if(m.error||v.error)throw(m.error||v.error);if(!cancelled){setMatches(m.data||[]);setOfficial(new Set((v.data||[]).map(x=>x.match_id)));setLoading(false);}}catch(e){if(!cancelled){setError(e?.message||"Matches could not be loaded.");setLoading(false);}}}load();const timer=setInterval(load,5000);return()=>{cancelled=true;clearInterval(timer)}},[]);
  const days=useMemo(()=>Array.from({length:8},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return{key:dateKey(d),label:i===0?"Today":i===1?"Tomorrow":new Intl.DateTimeFormat("en-GH",{weekday:"short",timeZone:"Africa/Accra"}).format(d),date:new Intl.DateTimeFormat("en-GH",{day:"numeric",month:"short",timeZone:"Africa/Accra"}).format(d)}}),[]);
  const visible=useMemo(()=>{const now=Date.now();const liveStatuses=["live","in_progress","halftime","paused"],finished=["finished","verified"];return matches.filter(m=>{const isLive=liveStatuses.includes(m.status),sameDay=dateKey(m.scheduled_at)===selectedDate,isOfficial=official.has(m.id),isUpcoming=sameDay&&!isLive&&!finished.includes(m.status)&&new Date(m.scheduled_at).getTime()>=now,isResult=sameDay&&isOfficial&&finished.includes(m.status);if(filter==="upcoming")return isUpcoming;if(filter==="live")return isLive;if(filter==="results")return isResult;return isLive||isUpcoming||isResult}).sort((a,b)=>{const al=liveStatuses.includes(a.status),bl=liveStatuses.includes(b.status);if(al!==bl)return al?-1:1;return new Date(a.scheduled_at)-new Date(b.scheduled_at)})},[matches,official,filter,selectedDate]);
  return <main><section className="container page-hero"><span className="section-kicker">Zedek Sports</span><h1>Match Centre</h1><p>Fixtures, live football and verified results from local football across Oti.</p></section><section className="container match-centre">
    <div className="mc-date-strip">{days.map(d=><button type="button" key={d.key} className={selectedDate===d.key?"mc-day active":"mc-day"} onClick={()=>setSelectedDate(d.key)}><b>{d.label}</b><span>{d.date}</span></button>)}<label className="mc-calendar"><span>Calendar</span><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label></div>
    <div className="mc-tabs">{[["all","All football"],["upcoming","Upcoming"],["live","Live"],["results","Results"]].map(([key,label])=><button type="button" key={key} className={filter===key?"mc-tab active":"mc-tab"} onClick={()=>setFilter(key)}>{label}</button>)}</div>
    {error?<div className="data-note">{error}</div>:loading?<div className="empty-state">Loading football from Zedek Control Room…</div>:!visible.length?<div className="empty-state"><strong>{filter==="live"?"No live matches for this date.":filter==="results"?"No verified results for this date.":"No published matches for this date."}</strong><span>Official fixtures and verified results will appear automatically when available.</span></div>:null}
    <div className="match-list">{visible.map(m=>{const isOfficial=official.has(m.id),isLive=["live","in_progress","halftime","paused"].includes(m.status);return <a className="mc-match" href={"/matches/"+m.id} key={m.id}><div className="mc-meta"><span>{m.season?.competition?.name||"Competition TBC"}</span><span className={isLive?"live-dot":""}>{isLive?"LIVE":isOfficial?"OFFICIAL":formatDate(m.scheduled_at)}</span></div><div className="mc-teams"><Team team={m.home_team}/><div className="mc-score">{isOfficial||isLive?<><b>{m.home_score??0}</b><span>—</span><b>{m.away_score??0}</b></>:<span>vs</span>}</div><Team team={m.away_team}/></div><div className="mc-footer"><span>{formatDate(m.scheduled_at)}</span><span>View match →</span></div></a>})}</div>
  </section></main>;
}