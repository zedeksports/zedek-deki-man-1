"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function daysAgo(n){return new Date(Date.now()-n*86400000).toISOString();}
function fmt(n){return Number(n||0).toLocaleString();}
function fmtTime(v){return v?new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"—";}

export default function AudiencePage(){
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [metrics,setMetrics]=useState({live:0,todayVisitors:0,todayViews:0,todaySessions:0,weekVisitors:0});
  const [daily,setDaily]=useState([]),[pages,setPages]=useState([]),[liveRows,setLiveRows]=useState([]);

  async function load(){
    setError("");
    const supabase=createSupabaseBrowserClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if(sessionError || !sessionData.session?.user){
      window.location.href="/login";
      return;
    }

    const { data: current, error: userError } = await supabase.auth.getUser();
    if(userError || !current.user){
      window.location.href="/login";
      return;
    }

    const profileQuery=await supabase.from("profiles").select("role,is_active,full_name").eq("id",current.user.id).maybeSingle();
    if(profileQuery.error){setError(profileQuery.error.message);setLoading(false);return;}
    if(!profileQuery.data?.is_active||!["super_admin","zedek_admin"].includes(profileQuery.data.role)){
      setError("Audience monitoring is restricted to active Zedek administrators.");
      setLoading(false);
      return;
    }

    const [summaryResult,dailyResult,pagesResult,liveResult]=await Promise.all([
      supabase.from("site_analytics_summary").select("*").maybeSingle(),
      supabase.from("site_analytics_daily").select("*").gte("day",daysAgo(13)).order("day",{ascending:true}),
      supabase.from("site_analytics_top_pages").select("*").limit(10),
      supabase.from("site_analytics_events").select("session_id,page_path,occurred_at").gte("occurred_at",new Date(Date.now()-5*60000).toISOString()).order("occurred_at",{ascending:false}).limit(500)
    ]);

    const bad=[summaryResult,dailyResult,pagesResult,liveResult].find(x=>x.error);
    if(bad){setError(bad.error.message);setLoading(false);return;}

    const summary=summaryResult.data||{};
    const liveMap=new Map();
    for(const row of liveResult.data||[]){
      if(!liveMap.has(row.session_id)) liveMap.set(row.session_id,row);
    }
    const liveRowsUnique=[...liveMap.values()];
    const liveUnique=liveRowsUnique.length;
    setMetrics({
      live:liveUnique,
      todayVisitors:summary.today_unique_visitors||0,
      todayViews:summary.today_page_views||0,
      todaySessions:summary.today_sessions||0,
      weekVisitors:summary.week_unique_visitors||0
    });
    setDaily(dailyResult.data||[]);
    setPages(pagesResult.data||[]);
    setLiveRows(liveRowsUnique);
    setLoading(false);
  }

  useEffect(()=>{load();const id=setInterval(load,60000);return()=>clearInterval(id)},[]);

  const maxViews=useMemo(()=>Math.max(1,...daily.map(x=>Number(x.page_views||0))),[daily]);

  if(loading)return <main className="container section"><div className="status-card">Loading audience monitor…</div></main>;
  if(error)return <main className="container section"><div className="status-card"><b>Audience Monitor</b><p className="muted">{error}</p></div></main>;

  return <main className="container section">
    <div className="card-heading" style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}>
      <div><span className="section-kicker">CONTROL ROOM</span><h1>Audience Monitor</h1><p className="muted">Anonymous site traffic and engagement. “Visitors” means an anonymous browser identifier, not a named account.</p></div>
      <button className="button" onClick={load}>Refresh</button>
    </div>

    <div className="stats-grid" style={{marginTop:18}}>
      {[["Live now",metrics.live,"active sessions in the last 5 minutes"],["Visitors today",metrics.todayVisitors,"unique anonymous visitors"],["Page views today",metrics.todayViews,"document page views"],["Sessions today",metrics.todaySessions,"new sessions"],["Visitors · 7 days",metrics.weekVisitors,"unique anonymous visitors"]].map(([label,value,note])=><div className="status-card" key={label}><span className="section-kicker">{label}</span><strong style={{display:"block",fontSize:32,marginTop:5}}>{fmt(value)}</strong><span className="muted">{note}</span></div>)}
    </div>

    <div className="home-dashboard" style={{marginTop:18}}>
      <section className="dashboard-card dashboard-card-wide">
        <div className="card-heading"><div><span className="section-kicker">TRAFFIC TREND</span><h3>Daily visitors and page views</h3></div></div>
        <div style={{display:"grid",gap:8,marginTop:14}}>
          {daily.map(row=><div key={row.day} style={{display:"grid",gridTemplateColumns:"90px 1fr 90px 90px",gap:10,alignItems:"center"}}>
            <span className="muted">{new Date(row.day).toLocaleDateString([], {month:"short",day:"numeric"})}</span>
            <div style={{height:10,background:"rgba(0,0,0,.08)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:Math.max(2,Number(row.page_views||0)/maxViews*100)+"%" ,background:"currentColor",borderRadius:99}}/></div>
            <span>{fmt(row.unique_visitors)} visitors</span><span>{fmt(row.page_views)} views</span>
          </div>)}
          {!daily.length&&<p className="muted">Traffic data will appear after the public site receives visits.</p>}
        </div>
      </section>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:18,marginTop:18}}>
      <section className="dashboard-card">
        <div className="card-heading"><div><span className="section-kicker">TOP CONTENT</span><h3>Most viewed pages</h3></div></div>
        <div style={{display:"grid",gap:10,marginTop:12}}>{pages.map((row,i)=><div key={row.page_path} style={{display:"grid",gridTemplateColumns:"28px 1fr auto",gap:10,alignItems:"center"}}><b>{i+1}</b><div><div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis"}}>{row.page_path}</div><span className="muted">{fmt(row.unique_visitors)} visitors</span></div><strong>{fmt(row.page_views)}</strong></div>)}</div>
      </section>
      <section className="dashboard-card">
        <div className="card-heading"><div><span className="section-kicker">LIVE ACTIVITY</span><h3>Currently active sessions</h3></div></div>
        <div style={{display:"grid",gap:10,marginTop:12}}>{liveRows.slice(0,12).map(row=><div key={row.session_id+row.occurred_at} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{row.page_path}</span><span className="muted">{fmtTime(row.occurred_at)}</span></div>)}{!liveRows.length&&<p className="muted">No active sessions in the last 5 minutes.</p>}</div>
      </section>
    </div>
    <p className="muted" style={{marginTop:18}}>Privacy: this monitor stores anonymous visitor/session identifiers, page paths and basic device class. It does not store names, email addresses or precise visitor location.</p>
  </main>;
}
