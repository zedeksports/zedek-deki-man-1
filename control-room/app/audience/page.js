"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function daysAgo(n){return new Date(Date.now()-n*86400000).toISOString();}
function fmt(n){return Number(n||0).toLocaleString();}
function fmtTime(v){return v?new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"—";}
function friendlyPage(path){
  if(!path||path==="/") return "Home";
  if(path.startsWith("/matches/")) return "Match Centre";
  if(path.startsWith("/teams/")) return "Team Profile";
  if(path.startsWith("/players/")) return "Player Profile";
  if(path.startsWith("/competitions/")) return "Competition";
  if(path.startsWith("/news/")) return "News";
  return path.replace(/^\//,"").replace(/[-_]/g," ").replace(/\b\w/g,x=>x.toUpperCase())||"Page";
}
function dayLabel(v){return new Date(v).toLocaleDateString([], {weekday:"short",month:"short",day:"numeric"});}

export default function AudiencePage(){
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [metrics,setMetrics]=useState({live:0,todayVisitors:0,todayViews:0,todaySessions:0,weekVisitors:0});
  const [presenceLive,setPresenceLive]=useState(null);
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

  useEffect(()=>{
    load();
    const id=setInterval(load,60000);
    const supabase=createSupabaseBrowserClient();
    const channel=supabase.channel("zedek-public-audience",{
      config:{presence:{key:"control-room-audience-monitor"}}
    });
    channel.on("presence",{event:"sync"},()=>{
      const state=channel.presenceState();
      setPresenceLive(Object.keys(state).length);
    });
    channel.subscribe();
    return()=>{
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  },[]);

  const maxViews=useMemo(()=>Math.max(1,...daily.map(x=>Number(x.page_views||0))),[daily]);

  if(loading)return <main className="container section"><div className="status-card">Loading audience monitor…</div></main>;
  if(error)return <main className="container section"><div className="status-card"><b>Audience Monitor</b><p className="muted">{error}</p></div></main>;

  return <main className="container section">
    <div className="card-heading" style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}>
      <div><span className="section-kicker">CONTROL ROOM · AUDIENCE</span><h1>Audience Dashboard</h1><p className="muted">A simple view of how people are using the Zedek Sports public website. All visitors are anonymous.</p></div>
      <button className="button" onClick={load}>Refresh data</button>
    </div>

    <section style={{marginTop:18}}>
      <div className="section-kicker">TODAY AT A GLANCE</div>
      <div className="stats-grid" style={{marginTop:8}}>
        {[["Live now",presenceLive!==null?presenceLive:metrics.live,"People connected right now"],["Visitors today",metrics.todayVisitors,"Unique visitors"],["Page views",metrics.todayViews,"Pages opened"],["Sessions",metrics.todaySessions,"Visits started today"],["Last 7 days",metrics.weekVisitors,"Unique visitors"]].map(([label,value,note])=><div className="status-card" key={label}><span className="section-kicker">{label}</span><strong style={{display:"block",fontSize:32,marginTop:5}}>{fmt(value)}</strong><span className="muted">{note}</span></div>)}
      </div>
    </section>

    <section className="dashboard-card" style={{marginTop:18}}>
      <div className="card-heading"><span className="section-kicker">TRAFFIC</span><h3>Visitors and page views by day</h3><p className="muted">This shows how many different visitors came and how many pages they opened.</p></div>
      <div style={{display:"grid",gap:10,marginTop:14}}>
        {daily.map(row=><div key={row.day} style={{display:"grid",gridTemplateColumns:"110px minmax(120px,1fr) 110px 100px",gap:12,alignItems:"center"}}>
          <b>{dayLabel(row.day)}</b>
          <div><div style={{height:9,background:"rgba(0,0,0,.08)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:Math.max(2,Number(row.page_views||0)/maxViews*100)+"%",background:"currentColor",borderRadius:99}}/></div></div>
          <span><b>{fmt(row.unique_visitors)}</b> visitors</span><span><b>{fmt(row.page_views)}</b> views</span>
        </div>)}
        {!daily.length&&<div className="status-card"><b>No traffic recorded yet</b><p className="muted">Traffic data will appear after people visit the public website.</p></div>}
      </div>
      <div className="muted" style={{marginTop:14}}>Tip: visitors and page views are different. One person can open several pages.</div>
    </section>

    <section style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:18,marginTop:18}}>
      <section className="dashboard-card">
        <div className="card-heading"><span className="section-kicker">POPULAR PAGES</span><h3>What people are viewing</h3><p className="muted">Ranked by page views.</p></div>
        <div style={{display:"grid",gap:12,marginTop:14}}>
          {pages.map((row,i)=><div key={row.page_path} style={{display:"grid",gridTemplateColumns:"34px 1fr auto",gap:10,alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,.08)"}}>
            <strong>{i+1}</strong>
            <div><div style={{fontWeight:700}}>{friendlyPage(row.page_path)}</div><span className="muted" style={{fontSize:12}}>{row.page_path}</span><div className="muted">{fmt(row.unique_visitors)} visitors · {fmt(row.page_views)} views</div></div>
          </div>)}
          {!pages.length&&<p className="muted">No page-view data yet.</p>}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="card-heading"><span className="section-kicker">LIVE NOW</span><h3>People currently browsing</h3><p className="muted">Updated automatically and refreshed every minute.</p></div>
        <div style={{display:"grid",gap:12,marginTop:14}}>
          {liveRows.slice(0,12).map(row=><div key={row.session_id+row.occurred_at} style={{padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,.08)"}}><div style={{fontWeight:700}}>{friendlyPage(row.page_path)}</div><span className="muted">{row.page_path} · Last activity {fmtTime(row.occurred_at)}</span></div>)}
          {!liveRows.length&&<div className="status-card"><b>No one is browsing right now.</b><p className="muted">When a visitor is active, their current page will appear here.</p></div>}
        </div>
      </section>
    </section>

    <section className="dashboard-card" style={{marginTop:18}}>
      <div className="card-heading"><span className="section-kicker">HOW TO READ THIS</span><h3>Understanding your audience</h3></div>
      <div style={{display:"grid",gap:8,marginTop:12}}>
        <div><b>Visitors</b> — different anonymous browsers that reached the site.</div>
        <div><b>Page views</b> — total pages opened. One visitor can create multiple page views.</div>
        <div><b>Sessions</b> — visits started on the site.</div>
        <div><b>Live now</b> — visitors currently connected to the public website.</div>
      </div>
    </section>
    <p className="muted" style={{marginTop:18}}>Privacy: the monitor uses anonymous visitor/session identifiers, page paths and basic device information. It does not display names, email addresses or precise visitor location.</p>
  </main>;
}
