'use client';

import {useEffect,useMemo,useState} from "react";
import {createSupabaseBrowserClient} from "../../lib/supabase/browser";

export default function StatisticsPage(){
 const [competitions,setCompetitions]=useState([]);
 const [seasons,setSeasons]=useState([]);
 const [stats,setStats]=useState([]);
 const [players,setPlayers]=useState([]);
 const [competitionId,setCompetitionId]=useState("");
 const [seasonId,setSeasonId]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");

 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const s=createSupabaseBrowserClient();
    const [c,se,st,p]=await Promise.all([
     s.from("competitions").select("id,name").eq("is_active",true).order("name"),
     s.from("seasons").select("id,name,year,competition_id,is_active").order("year",{ascending:false}),
     s.from("official_player_statistics").select("id,player_id,season_id,team_id,matches_played,starts,goals,assists,yellow_cards,red_cards,minutes_played,player:players(id,full_name,shirt_number,position,photo_url),team:teams(id,name,short_name,logo_url),season:seasons(id,name,competition:competitions(id,name))").order("goals",{ascending:false}).order("assists",{ascending:false}).limit(500),
     s.from("players").select("id,full_name,shirt_number,position,photo_url,team:teams(id,name,short_name,logo_url)").eq("is_active",true)
    ]);
    const e=c.error||se.error||st.error||p.error;
    if(e) throw e;
    if(!cancelled){setCompetitions(c.data||[]);setSeasons(se.data||[]);setStats(st.data||[]);setPlayers(p.data||[]);setLoading(false);}
   }catch(e){if(!cancelled){setError(e?.message||"Statistics could not be loaded.");setLoading(false);}}
  }
  load(); return()=>{cancelled=true};
 },[]);

 const seasonList=useMemo(()=>seasons.filter(s=>!competitionId||s.competition_id===competitionId),[seasons,competitionId]);
 useEffect(()=>{if(!seasonList.some(s=>s.id===seasonId))setSeasonId(seasonList[0]?.id||"");},[seasonList,seasonId]);

 const rows=useMemo(()=>stats.filter(x=>(!competitionId||x.season?.competition?.id===competitionId)&&(!seasonId||x.season_id===seasonId)).sort((a,b)=>(b.goals||0)-(a.goals||0)||(b.assists||0)-(a.assists||0)||(b.minutes_played||0)-(a.minutes_played||0)),[stats,competitionId,seasonId]);
 const topScorers=rows.slice(0,10);
 const leaders=[...rows].sort((a,b)=>(b.assists||0)-(a.assists||0)||(b.goals||0)-(a.goals||0)).slice(0,10);
 const selectedComp=competitions.find(c=>c.id===competitionId);
 const selectedSeason=seasons.find(s=>s.id===seasonId);

 return <main>
  <section className="container page-hero"><span className="section-kicker">Zedek Sports • Official</span><h1>Statistics</h1><p>Official player statistics published from verified football data in the Control Room.</p></section>
  <section className="container statistics-page">
   <div className="standings-filters">
    <label>Competition<select value={competitionId} onChange={e=>setCompetitionId(e.target.value)}><option value="">All competitions</option>{competitions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Season<select value={seasonId} onChange={e=>setSeasonId(e.target.value)} disabled={!seasonList.length}><option value="">All seasons</option>{seasonList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   </div>
   {error?<div className="data-note">{error}</div>:loading?<div className="empty-state">Loading official statistics…</div>:<>
    <div className="stats-strip"><div><b>{rows.length}</b><span>Stat records</span></div><div><b>{new Set(rows.map(x=>x.player_id)).size}</b><span>Players</span></div><div><b>{rows.reduce((n,x)=>n+(x.goals||0),0)}</b><span>Goals recorded</span></div><div><b>{rows.reduce((n,x)=>n+(x.assists||0),0)}</b><span>Assists recorded</span></div></div>
    <div className="statistics-grid">
     <section className="team-panel"><span className="section-kicker">Top scorers</span><h2>{selectedComp?.name||"All competitions"}{selectedSeason?" • "+selectedSeason.name:""}</h2>{topScorers.length?<div className="player-season-list">{topScorers.map((x,i)=><a className="player-season-row" href={"/players/"+x.player_id} key={x.id}><div><strong>{i+1}. {x.player?.full_name||"Player"}</strong><span>{x.team?.short_name||x.team?.name||"Team"} • {x.matches_played||0} apps</span></div><div className="player-season-numbers"><b>{x.goals||0}</b><span>Goals</span><b>{x.assists||0}</b><span>Assists</span></div></a>)}</div>:<div className="empty-state compact"><strong>No official player statistics yet.</strong><span>Statistics will appear after verified matches are recorded in the Control Room.</span></div>}</section>
     <section className="team-panel"><span className="section-kicker">Assist leaders</span><h2>Creative output</h2>{leaders.length?<div className="player-season-list">{leaders.map((x,i)=><a className="player-season-row" href={"/players/"+x.player_id} key={x.id}><div><strong>{i+1}. {x.player?.full_name||"Player"}</strong><span>{x.team?.short_name||x.team?.name||"Team"} • {x.minutes_played||0} min</span></div><div className="player-season-numbers"><b>{x.assists||0}</b><span>Assists</span><b>{x.goals||0}</b><span>Goals</span></div></a>)}</div>:<div className="empty-state compact">No assist records yet.</div>}</section>
    </div>
    <section className="team-panel"><span className="section-kicker">Player directory</span><h2>Published players</h2>{players.length?<div className="squad-grid">{players.slice(0,30).map(p=><a className="player-card" href={"/players/"+p.id} key={p.id}><div className="player-photo">{p.photo_url?<img src={p.photo_url} alt=""/>:<span>{(p.full_name||"P").slice(0,1)}</span>}</div><div className="player-card-info"><span>{p.team?.short_name||p.team?.name||"Team"} {p.shirt_number!=null?"• #"+p.shirt_number:""}</span><h3>{p.full_name}</h3><p>{p.position||"Player"}</p></div></a>)}</div>:<div className="empty-state">No published players yet.</div>}</section>
    <div className="section-heading"><div><span className="section-kicker">Tables</span><h2>More official data</h2></div><a className="quiet-link" href="/standings">Open standings →</a></div>
   </>}
  </section>
 </main>;
}