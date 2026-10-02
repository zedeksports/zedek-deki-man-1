'use client';

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function CompetitionCard({c}) {
  return <a className="competition-card" href={"/competitions/"+c.id}>
    <span className="section-kicker">{c.location || "Oti"}</span>
    <h2>{c.name}</h2>
    {c.description ? <p>{c.description}</p> : <p>Follow fixtures, results and competition football on Zedek Sports.</p>}
    <span className="quiet-link">Explore competition →</span>
  </a>;
}

export default function CompetitionsPage(){
  const [competitions,setCompetitions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{ const supabase=createSupabaseBrowserClient();
    supabase.from("competitions").select("id,name,code,description,location,format,is_active").eq("is_active",true).order("name").then(({data,error})=>{if(error)setError(error.message);else setCompetitions(data||[]);setLoading(false);});
  },[]);
  return <main><section className="container page-hero"><span className="section-kicker">Zedek Sports</span><h1>Competitions</h1><p>Explore local football competitions, their seasons, fixtures and official results.</p></section>
  <section className="container competition-grid">{error?<div className="data-note">{error}</div>:loading?<div className="empty-state">Loading competitions…</div>:competitions.length?competitions.map(c=><CompetitionCard c={c} key={c.id}/>):<div className="empty-state"><strong>No competitions published yet.</strong><span>Active competitions will appear here when published.</span></div>}</section></main>;
}