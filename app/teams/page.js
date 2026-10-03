'use client';

import {useEffect,useState} from "react";
import {createSupabaseBrowserClient} from "../../lib/supabase/browser";

function Logo({team}){
  return <div className="team-logo">{team?.logo_url?<img src={team.logo_url} alt="" />:<span>{(team?.short_name||team?.name||"T").slice(0,3).toUpperCase()}</span>}</div>;
}

export default function TeamsPage(){
  const [teams,setTeams]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setLoading(true);
      setError("");
      try{
        const supabase=createSupabaseBrowserClient();
        if(!supabase) throw new Error("Public football connection is unavailable.");
        const {data,error}=await supabase
          .from("teams")
          .select("id,name,short_name,area,home_venue,logo_url")
          .eq("is_active",true)
          .order("name",{ascending:true});
        if(error) throw error;
        if(!cancelled){
          setTeams(data||[]);
          setLoading(false);
        }
      }catch(err){
        if(!cancelled){
          setError(err?.message||"The public team feed could not be loaded.");
          setLoading(false);
        }
      }
    }
    load();
    return()=>{cancelled=true};
  },[]);

  return <main>
    <section className="container page-hero">
      <span className="section-kicker">Zedek Sports • Local football</span>
      <h1>Teams</h1>
      <p>Discover the clubs, identities and football communities across Oti.</p>
    </section>
    <section className="container teams-page">
      {error?<div className="data-note"><strong>Public football feed unavailable.</strong><span>{error}</span></div>
      :loading?<div className="empty-state">Loading teams from Zedek Control Room…</div>
      :teams.length?<div className="team-directory">{teams.map(t=>
        <a className="team-directory-card" href={"/teams/"+t.id} key={t.id}>
          <Logo team={t}/>
          <div><span className="section-kicker">{t.area||"Oti"}</span><h2>{t.name}</h2><p>{t.short_name||"Team profile"}{t.home_venue?" • "+t.home_venue:""}</p></div>
          <span className="team-arrow">↗</span>
        </a>
      )}</div>
      :<div className="empty-state"><strong>No active teams published yet.</strong><span>Teams registered in the Control Room will appear here automatically.</span></div>}
    </section>
  </main>;
}