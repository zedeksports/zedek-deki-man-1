// Phase 5 batch: JSX boundary repaired and deployment validation requested
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

const TABS=["overview","competitions","seasons","stages","fixtures","live","lineups","review","stats","publishing","community","teams","players","coaches","officials","privacy"];
const STAGE_TYPES=["league","group","knockout","quarter_final","semi_final","final"];
const CONSENT_TERMS_VERSION="ZEDek-REG-TERMS-v1";
const CONSENT_PRIVACY_VERSION="ZEDek-PRIVACY-v1";

function getSupabase(){if(typeof window==="undefined")return null;return createSupabaseBrowserClient();}
function fmtDate(v){return v?new Date(v).toLocaleString():"—";}

function RegistrationConsent({kind,confirmed,setConfirmed,authorityType,setAuthorityType,holderName,setHolderName,guardianName,setGuardianName,guardianContact,setGuardianContact}){
  const isTeam=kind==="team", isMinor=authorityType==="parent_or_guardian";
  return <div className="status-card" style={{marginTop:12,border:"1px solid rgba(0,0,0,.12)"}}>
    <b>Consent & privacy confirmation</b>
    <span style={{display:"block",marginTop:6}}>Zedek Sports will use the submitted information to create and maintain the football record, publish appropriate public team/player information, provide match reporting and statistics, and operate the Zedek Sports service. Required registration data will not be treated as permission for unrelated direct marketing.</span>
    {!isTeam&&<label style={{marginTop:10}}>Consent/authority basis<select value={authorityType} onChange={e=>setAuthorityType(e.target.value)}>
      <option value="self">Player/coach gave consent directly</option>
      <option value="team_authorized_representative">Team-authorized representative confirms consent was obtained</option>
      <option value="parent_or_guardian">Parent/guardian consent for a minor</option>
    </select></label>}
    <label style={{marginTop:10}}>Consent holder / authorised person<input required value={holderName} onChange={e=>setHolderName(e.target.value)} placeholder={isTeam?"Name of authorised team representative":"Name of player, coach, authorised representative or guardian"}/></label>
    {isMinor&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label>Guardian name<input required value={guardianName} onChange={e=>setGuardianName(e.target.value)}/></label>
      <label>Guardian contact<input required value={guardianContact} onChange={e=>setGuardianContact(e.target.value)}/></label>
    </div>}
    <label style={{display:"flex",gap:8,alignItems:"flex-start",marginTop:10}}>
      <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required style={{width:18,height:18,marginTop:2}}/>
      <span>I confirm that the person/club named above has been informed about this registration, the data being collected, its football-related purposes, public profile use, and their rights to request access, correction or withdrawal where applicable. I have authority to submit this registration.</span>
    </label>
    <span className="muted" style={{display:"block",marginTop:8}}>Terms {CONSENT_TERMS_VERSION} · Privacy notice {CONSENT_PRIVACY_VERSION} · Recorded with the Zedek admin account, date/time and consent basis. <a href="https://public-7vqk2gqm1-zedeksportsofficial-2298.vercel.app/terms" target="_blank" rel="noreferrer">Terms</a> · <a href="https://public-7vqk2gqm1-zedeksportsofficial-2298.vercel.app/privacy" target="_blank" rel="noreferrer">Privacy</a></span>
  </div>;
}

export default function ControlRoomPage(){
  const [loading,setLoading]=useState(true),[user,setUser]=useState(null),[profile,setProfile]=useState(null);
  const [tab,setTab]=useState("overview"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [competitions,setCompetitions]=useState([]),[seasons,setSeasons]=useState([]),[teams,setTeams]=useState([]),[players,setPlayers]=useState([]),[coaches,setCoaches]=useState([]),[officialProfiles,setOfficialProfiles]=useState([]),[candidateProfiles,setCandidateProfiles]=useState([]),[teamOfficials,setTeamOfficials]=useState([]),[stages,setStages]=useState([]),[matches,setMatches]=useState([]);
  const [competition,setCompetition]=useState({id:"",name:"",code:"",location:"",format:"league",image:null}); const [editingCompetitionId,setEditingCompetitionId]=useState("");
  const [season,setSeason]=useState({competition_id:"",name:"",year:"",start_date:"",end_date:""});
  const [stage,setStage]=useState({season_id:"",name:"",stage_type:"league",stage_order:"1",is_active:true});
  const [fixture,setFixture]=useState({season_id:"",stage_id:"",home_team_id:"",away_team_id:"",scheduled_at:"",venue:"",round_name:"",leg:"1",notes:""});
  const [team,setTeam]=useState({id:"",name:"",short_name:"",area:"",home_venue:"",image:null});
  const [player,setPlayer]=useState({id:"",team_id:"",full_name:"",shirt_number:"",position:"",image:null});
  const [coach,setCoach]=useState({team_id:"",full_name:"",date_of_birth:"",nationality:"",role:"Head Coach",image:null});
  const [officialForm,setOfficialForm]=useState({team_id:"",user_id:"",role:"Team Official",start_date:"",end_date:""}); const [editingTeamId,setEditingTeamId]=useState(""); const [editingPlayerId,setEditingPlayerId]=useState("");
  const [consents,setConsents]=useState([]),[privacyRequests,setPrivacyRequests]=useState([]);
  const [saving,setSaving]=useState(false),[statsCompetitionId,setStatsCompetitionId]=useState(""),[statsSeasonId,setStatsSeasonId]=useState(""),[officialStats,setOfficialStats]=useState([]),[statsData,setStatsData]=useState({standings:[],scorers:[],recent:[],form:[]}),[h2hHome,setH2hHome]=useState(""),[h2hAway,setH2hAway]=useState(""),[h2hData,setH2hData]=useState([]),[h2hSummary,setH2hSummary]=useState(null), [reportMatch,setReportMatch]=useState(null), [report,setReport]=useState(null), [reports,setReports]=useState([]),[liveMatch,setLiveMatch]=useState(null),[events,setEvents]=useState([]),[matchStats,setMatchStats]=useState(null),[clock,setClock]=useState(0),[eventForm,setEventForm]=useState({type:"goal",team_id:"",player_id:"",secondary_player_id:"",minute:"",extra_minute:"",details:""}),[lineupMatch,setLineupMatch]=useState(null),[lineupTeam,setLineupTeam]=useState(""),[lineup,setLineup]=useState(null),[lineupPlayers,setLineupPlayers]=useState([]),[lineupLoading,setLineupLoading]=useState(false);
  const [contentPosts,setContentPosts]=useState([]),[editingContentId,setEditingContentId]=useState("");
  const [contentForm,setContentForm]=useState({content_type:"news",title:"",slug:"",excerpt:"",body:"",category:"",status:"draft",featured:false,cover_image_url:""});
  const [surveys,setSurveys]=useState([]),[surveyQuestions,setSurveyQuestions]=useState([]),[surveyResponses,setSurveyResponses]=useState([]);
  const [surveyForm,setSurveyForm]=useState({title:"",description:"",status:"draft",starts_at:"",ends_at:""}),[editingSurveyId,setEditingSurveyId]=useState("");
  const [questionForm,setQuestionForm]=useState({survey_id:"",prompt:"",question_type:"text",options:"",required:false,sort_order:"1"});
  const [feedbackRows,setFeedbackRows]=useState([]),[feedbackFilter,setFeedbackFilter]=useState("new");
  const [sponsors,setSponsors]=useState([]),[editingSponsorId,setEditingSponsorId]=useState(""),[sponsorForm,setSponsorForm]=useState({name:"",logo_url:"",website_url:"",contact_name:"",contact_email:"",contact_phone:"",tier:"standard",status:"prospect",start_date:"",end_date:"",notes:""});
  const [deals,setDeals]=useState([]),[editingDealId,setEditingDealId]=useState(""),[dealForm,setDealForm]=useState({sponsor_id:"",deal_name:"",amount:"",currency:"GHS",status:"proposed",start_date:"",end_date:"",placement:"",notes:""});
  const [ads,setAds]=useState([]),[adForm,setAdForm]=useState({name:"",placement:"homepage",format:"banner",sponsor_id:"",image_url:"",target_url:"",active:false,start_date:"",end_date:""}),[editingAdId,setEditingAdId]=useState("");
  const [transactions,setTransactions]=useState([]),[transactionForm,setTransactionForm]=useState({sponsor_id:"",deal_id:"",transaction_type:"payment",amount:"",currency:"GHS",status:"pending",transaction_date:new Date().toISOString().slice(0,10),reference:"",notes:""});
  const [notificationForm,setNotificationForm]=useState({title:"",body:"",notification_type:"news",team_id:"",match_id:""}),[reviewChoices,setReviewChoices]=useState({});
  const [notificationSaving,setNotificationSaving]=useState(false);
  const [previewRows,setPreviewRows]=useState([]),[channelRows,setChannelRows]=useState([]),[streamAds,setStreamAds]=useState([]);
  const [previewForm,setPreviewForm]=useState({match_id:"",headline:"",summary:"",key_storylines:"",form_note:"",h2h_note:"",venue_note:"",status:"draft"});
  const [channelForm,setChannelForm]=useState({match_id:"",channel_type:"live_stream",name:"",provider:"",url:"",is_primary:false,active:true,starts_at:"",ends_at:""});

  useEffect(()=>{if(!liveMatch)return;const tick=()=>setClock(elapsed(liveMatch));tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[liveMatch]);
  useEffect(()=>{if(!loading&&tab==="stats")loadStats();},[loading,tab,statsCompetitionId,statsSeasonId]);
  useEffect(()=>{if(!loading&&tab==="privacy")loadPrivacy();},[loading,tab]);

  async function refresh(){
    setError(""); const supabase=getSupabase(); if(!supabase)return;
    const [a,b,c,d,coachRows,officialProfileRows,candidateProfileRows,officialAssignmentRows,e,f,contentRows,surveyRows,questionRows,feedbackResult,sponsorRows,dealRows,adRows,transactionRows,previewRowsResult,channelRowsResult,streamAdsResult]=await Promise.all([
      supabase.from("competitions").select("*").order("name"),
      supabase.from("seasons").select("*, competitions(name)").order("created_at",{ascending:false}),
      supabase.from("teams").select("*").order("name"),
      supabase.from("players").select("*, teams(name)").order("full_name"),
      supabase.from("coaches").select("*, team_coaches(team_id,is_current,teams(name))").order("full_name"),
      supabase.from("profiles").select("id,full_name,phone,role,is_active").eq("role","team_official").eq("is_active",true).order("full_name"),
      supabase.from("profiles").select("id,full_name,phone,role,is_active").eq("role","public_user").eq("is_active",true).order("full_name"),
      supabase.from("team_officials").select("*, teams(name), profiles(id,full_name,phone,is_active,role)").order("created_at",{ascending:false}),
      supabase.from("stages").select("*, seasons(name, competitions(name))").order("season_id").order("stage_order"),
      supabase.from("matches").select("*, home:teams!matches_home_team_id_fkey(name), away:teams!matches_away_team_id_fkey(name), seasons(name), stages(name)").order("scheduled_at",{ascending:true}),
      supabase.from("content_posts").select("*").order("created_at",{ascending:false}),
      supabase.from("surveys").select("*").order("created_at",{ascending:false}),
      supabase.from("survey_questions").select("*").order("sort_order"),
      supabase.from("user_feedback").select("*").order("created_at",{ascending:false}),
      supabase.from("sponsors").select("*").order("created_at",{ascending:false}),
      supabase.from("sponsorship_deals").select("*, sponsors(name)").order("created_at",{ascending:false}),
      supabase.from("ad_slots").select("*, sponsors(name)").order("created_at",{ascending:false}),
      supabase.from("monetization_transactions").select("*, sponsors(name), sponsorship_deals(deal_name)").order("transaction_date",{ascending:false}).order("created_at",{ascending:false}),
      supabase.from("match_previews").select("*").order("updated_at",{ascending:false}),
      supabase.from("match_channels").select("*, matches(home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").order("created_at",{ascending:false}),
      supabase.from("match_stream_ads").select("*, ad_slots(name,placement,format,sponsors(name)), matches(home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").order("priority").order("created_at",{ascending:false})
    ]);
    const bad=[a,b,c,d,coachRows,officialProfileRows,candidateProfileRows,officialAssignmentRows,e,f,contentRows,surveyRows,questionRows,feedbackResult,sponsorRows,dealRows,adRows,transactionRows,previewRowsResult,channelRowsResult,streamAdsResult].find(x=>x.error); if(bad){setError(bad.error.message);return;}
    setCompetitions(a.data||[]);setSeasons(b.data||[]);setTeams(c.data||[]);setPlayers(d.data||[]);setCoaches(coachRows.data||[]);setOfficialProfiles(officialProfileRows.data||[]);setCandidateProfiles(candidateProfileRows.data||[]);setTeamOfficials(officialAssignmentRows.data||[]);
    setStages(e.data||[]);setMatches(f.data||[]);
    setContentPosts(contentRows.data||[]);setSurveys(surveyRows.data||[]);setSurveyQuestions(questionRows.data||[]);setFeedbackRows(feedbackResult.data||[]);
    setSponsors(sponsorRows.data||[]);setDeals(dealRows.data||[]);setAds(adRows.data||[]);setTransactions(transactionRows.data||[]);setPreviewRows(previewRowsResult.data||[]);setChannelRows(channelRowsResult.data||[]);setStreamAds(streamAdsResult.data||[]);
  }

  useEffect(()=>{let mounted=true;
    async function boot(){
      const supabase=getSupabase(); if(!supabase)return;
      const session=await supabase.auth.getSession(); if(!mounted)return;
      if(session.error||!session.data.session){window.location.href="/login";return;}
      setUser(session.data.session.user);
      const p=await supabase.from("profiles").select("role,is_active,full_name").eq("id",session.data.session.user.id).maybeSingle();
      if(!mounted)return;
      if(p.error)setError(p.error.message); setProfile(p.data);
      if(p.data&&p.data.is_active&&["super_admin","zedek_admin"].includes(p.data.role)){await refresh();await loadReports();}
      setLoading(false);
    }
    boot(); return()=>{mounted=false};
},[]);

  async function loadPrivacy(){
    const supabase=getSupabase(); if(!supabase)return;
    const [c,r]=await Promise.all([
      supabase.from("data_consents").select("*").order("consented_at",{ascending:false}).limit(100),
      supabase.from("data_subject_requests").select("*").order("created_at",{ascending:false}).limit(100)
    ]);
    if(c.error)setError(c.error.message); else setConsents(c.data||[]);
    if(r.error)setError(r.error.message); else setPrivacyRequests(r.data||[]);
  }
  async function withdrawConsent(x){
    if(!window.confirm("Withdraw this registration consent for "+(x.consent_holder_name||x.subject_type)+"? This records the withdrawal and does not erase historical football records automatically."))return;
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const result=await supabase.from("data_consents").update({consent_status:"withdrawn",withdrawn_at:new Date().toISOString()}).eq("id",x.id).eq("consent_status","active");
    setSaving(false);if(result.error){setError(result.error.message);return;}setNotice("Consent withdrawal recorded.");await loadPrivacy();
  }
  async function recordRegistrationConsent({subjectType,subjectId,authorityType="self",holderName,guardianName="",guardianContact=""}){
    const supabase=getSupabase();
    const result=await supabase.from("data_consents").insert({
      subject_type:subjectType,subject_id:subjectId,consent_type:"registration",
      terms_version:CONSENT_TERMS_VERSION,privacy_version:CONSENT_PRIVACY_VERSION,
      consent_status:"active",consented_by:user?.id||null,consented_by_name:profile?.full_name||null,
      authority_type:authorityType,consent_holder_name:holderName.trim()||null,
      guardian_name:guardianName.trim()||null,guardian_contact:guardianContact.trim()||null,
      scope:"registration_and_public_football_profile",consented_at:new Date().toISOString()
    });
    if(result.error)throw result.error;
  }
  async function optimizeImageUpload(file,kind="photo"){
    if(!file)return null;
    if(!file.type?.startsWith("image/"))throw new Error("Please select an image file.");
    const isLogo=kind==="logo";
    const MAX_DIMENSION=isLogo?1600:1200;
    const TARGET_BYTES=isLogo?600*1024:300*1024;
    const MIN_QUALITY=isLogo?0.80:0.55;
    const START_QUALITY=isLogo?0.94:0.82;
    const QUALITY_STEP=isLogo?0.05:0.07;
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,MAX_DIMENSION/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale));
    const height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");
    if(!ctx){bitmap.close();throw new Error("Image processing is not supported in this browser.");}
    ctx.drawImage(bitmap,0,0,width,height);
    bitmap.close();
    let quality=START_QUALITY;
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",quality));
    while(blob&&blob.size>TARGET_BYTES&&quality>MIN_QUALITY){
      quality=Math.max(MIN_QUALITY,quality-QUALITY_STEP);
      blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",quality));
    }
    if(!blob)throw new Error("Could not optimize the selected image.");
    return new File([blob],"optimized.webp",{type:"image/webp",lastModified:Date.now()});
  }
  async function uploadAsset(file,folder,id,kind="photo"){
    if(!file)return null;
    const supabase=getSupabase();
    const optimized=await optimizeImageUpload(file,kind);
    const path=folder+"/"+id+".webp";
    const upload=await supabase.storage.from("sports-assets").upload(path,optimized,{upsert:true,contentType:"image/webp",cacheControl:"31536000"});
    if(upload.error)throw upload.error;
    return supabase.storage.from("sports-assets").getPublicUrl(path).data.publicUrl;
  }
  async function saveTeam(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();const isNew=!editingTeamId;
    if(isNew&&!team.consent_confirmed){setSaving(false);setError("Consent confirmation is required before registering a team.");return;}
    if(isNew&&!team.holder_name.trim()){setSaving(false);setError("Enter the authorised team representative's name.");return;}
    const values={name:team.name.trim(),short_name:team.short_name.trim()||null,area:team.area.trim()||null,home_venue:team.home_venue.trim()||null};
    const result=editingTeamId?await supabase.from("teams").update(values).eq("id",editingTeamId).select("*").single():await supabase.from("teams").insert(values).select("*").single();
    if(result.error){setSaving(false);setError(result.error.message);return;}
    if(isNew){try{await recordRegistrationConsent({subjectType:"team",subjectId:result.data.id,authorityType:"team_authorized_representative",holderName:team.holder_name});}catch(err){await supabase.from("teams").delete().eq("id",result.data.id);setSaving(false);setError("Team was not registered because the consent record could not be saved: "+err.message);return;}}
    try{const logo_url=await uploadAsset(team.image,"teams",result.data.id,"logo");if(logo_url){const updated=await supabase.from("teams").update({logo_url}).eq("id",result.data.id);if(updated.error)throw updated.error;}}
    catch(err){setSaving(false);setError((editingTeamId?"Team updated":"Team saved")+", but logo upload failed: "+err.message);await refresh();return;}
    const wasEditing=!!editingTeamId;setSaving(false);setEditingTeamId("");setTeam({id:"",name:"",short_name:"",area:"",home_venue:"",image:null,consent_confirmed:false,holder_name:""});setNotice(wasEditing?"Team updated successfully.":"Team registered successfully.");await refresh();
  }
  function editTeam(x){setEditingTeamId(x.id);setTeam({id:x.id,name:x.name||"",short_name:x.short_name||"",area:x.area||"",home_venue:x.home_venue||"",image:null,consent_confirmed:false,holder_name:""});setTab("teams");window.scrollTo({top:0,behavior:"smooth"});}
  async function deleteTeam(x){if(!window.confirm("Delete "+x.name+"? This cannot be undone."))return;setSaving(true);setError("");setNotice("");const supabase=getSupabase();const result=await supabase.from("teams").delete().eq("id",x.id);if(result.error){setSaving(false);setError("Team could not be deleted: "+result.error.message);return;}setSaving(false);setNotice("Team deleted successfully.");await refresh();}

  async function promoteOfficial(x){
    if(!window.confirm("Promote "+(x.full_name||x.id)+" to a Team Official account? The user will keep the same login and will gain access to the official portal after their next session refresh."))return;
    setSaving(true);setError("");setNotice("");
    const supabase=getSupabase();
    const result=await supabase.from("profiles").update({role:"team_official",is_active:true,updated_at:new Date().toISOString()}).eq("id",x.id).eq("role","public_user");
    setSaving(false);
    if(result.error){setError("Account could not be activated as a team official: "+result.error.message);return;}
    setNotice("Account promoted to Team Official. Assign the team below, then the official can sign in through the public site.");
    await refresh();
  }

  async function saveOfficial(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");
    const supabase=getSupabase();
    if(!officialForm.team_id||!officialForm.user_id){setSaving(false);setError("Select both a team and a team-official account.");return;}
    const values={team_id:officialForm.team_id,user_id:officialForm.user_id,role:officialForm.role.trim()||"Team Official",is_current:true,start_date:officialForm.start_date||new Date().toISOString().slice(0,10),end_date:officialForm.end_date||null};
    const old=await supabase.from("team_officials").update({is_current:false,end_date:values.start_date}).eq("team_id",values.team_id).eq("user_id",values.user_id).eq("role",values.role).eq("is_current",true);
    if(old.error){setSaving(false);setError("Existing assignment could not be closed: "+old.error.message);return;}
    const result=await supabase.from("team_officials").insert(values);
    if(result.error){setSaving(false);setError("Official could not be assigned: "+result.error.message);return;}
    setSaving(false);setOfficialForm({team_id:"",user_id:"",role:"Team Official",start_date:"",end_date:""});setNotice("Team official assigned successfully.");await refresh();
  }
  async function deactivateOfficial(x){
    if(!window.confirm("End "+(x.profiles?.full_name||"this official")+" assignment?"))return;
    setSaving(true);setError("");setNotice("");
    const supabase=getSupabase();
    const result=await supabase.from("team_officials").update({is_current:false,end_date:new Date().toISOString().slice(0,10)}).eq("id",x.id);
    if(result.error){setSaving(false);setError("Official assignment could not be ended: "+result.error.message);return;}
    setSaving(false);setNotice("Official assignment ended.");await refresh();
  }

  async function saveCoach(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!coach.consent_confirmed){setSaving(false);setError("Consent confirmation is required before registering a coach.");return;}
    if(!coach.holder_name.trim()){setSaving(false);setError("Enter the name of the coach or authorised person confirming consent.");return;}
    if(coach.authority_type==="parent_or_guardian"&&(!coach.guardian_name.trim()||!coach.guardian_contact.trim())){setSaving(false);setError("Guardian name and contact are required when registering a minor.");return;}
    const inserted=await supabase.from("coaches").insert({full_name:coach.full_name.trim(),date_of_birth:coach.date_of_birth||null,nationality:coach.nationality.trim()||null,role:coach.role.trim()||"Head Coach",is_active:true}).select("*").single();
    if(inserted.error){setSaving(false);setError(inserted.error.message);return;}
    try{
      await recordRegistrationConsent({subjectType:"coach",subjectId:inserted.data.id,authorityType:coach.authority_type,holderName:coach.holder_name,guardianName:coach.guardian_name,guardianContact:coach.guardian_contact});
      const photo_url=await uploadAsset(coach.image,"coaches",inserted.data.id);
      if(photo_url){const updated=await supabase.from("coaches").update({photo_url}).eq("id",inserted.data.id);if(updated.error)throw updated.error;}
      if(coach.team_id){
        const old=await supabase.from("team_coaches").update({is_current:false,end_date:new Date().toISOString().slice(0,10)}).eq("team_id",coach.team_id).eq("role",coach.role).eq("is_current",true);
        if(old.error)throw old.error;
        const linked=await supabase.from("team_coaches").insert({team_id:coach.team_id,coach_id:inserted.data.id,role:coach.role,start_date:new Date().toISOString().slice(0,10),is_current:true});
        if(linked.error)throw linked.error;
      }
    }catch(err){await supabase.from("coaches").delete().eq("id",inserted.data.id);setSaving(false);setError("Coach was not registered because the consent/photo/team setup failed: "+err.message);await refresh();return;}
    setSaving(false);setCoach({team_id:"",full_name:"",date_of_birth:"",nationality:"",role:"Head Coach",image:null,consent_confirmed:false,authority_type:"self",holder_name:"",guardian_name:"",guardian_contact:""});setNotice("Coach registered successfully.");await refresh();
  }

  async function saveCompetition(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={name:competition.name.trim(),code:competition.code.trim()||null,location:competition.location.trim()||null,format:competition.format};
    const result=editingCompetitionId?await supabase.from("competitions").update(values).eq("id",editingCompetitionId).select("*").single():await supabase.from("competitions").insert(values).select("*").single();
    if(result.error){setSaving(false);setError(result.error.message);return;}
    try{
      const logo_url=await uploadAsset(competition.image,"competitions",result.data.id,"logo");
      if(logo_url){const updated=await supabase.from("competitions").update({logo_url}).eq("id",result.data.id);if(updated.error)throw updated.error;}
    }catch(err){setSaving(false);setError((editingCompetitionId?"Competition updated":"Competition saved")+", but logo upload failed: "+err.message);await refresh();return;}
    const wasEditing=!!editingCompetitionId;
    setSaving(false);setEditingCompetitionId("");setCompetition({id:"",name:"",code:"",location:"",format:"league",image:null});
    setNotice(wasEditing?"Competition updated successfully.":"Competition registered successfully.");await refresh();
  }
  function editCompetition(x){setEditingCompetitionId(x.id);setCompetition({id:x.id,name:x.name||"",code:x.code||"",location:x.location||"",format:x.format||"league",image:null});setTab("competitions");window.scrollTo({top:0,behavior:"smooth"});}
  async function deleteCompetition(x){
    if(!window.confirm("Delete "+x.name+"? This cannot be undone."))return;
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const result=await supabase.from("competitions").delete().eq("id",x.id);
    if(result.error){setSaving(false);setError("Competition could not be deleted: "+result.error.message);return;}
    setSaving(false);setNotice("Competition deleted successfully.");await refresh();
  }

  async function savePlayer(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();const isNew=!editingPlayerId;
    if(isNew&&!player.consent_confirmed){setSaving(false);setError("Consent confirmation is required before registering a player.");return;}
    if(isNew&&!player.holder_name.trim()){setSaving(false);setError("Enter the name of the player, guardian or authorised representative confirming consent.");return;}
    if(isNew&&player.authority_type==="parent_or_guardian"&&(!player.guardian_name.trim()||!player.guardian_contact.trim())){setSaving(false);setError("Guardian name and contact are required for a minor.");return;}
    const values={team_id:player.team_id,full_name:player.full_name.trim(),shirt_number:player.shirt_number?Number(player.shirt_number):null,position:player.position.trim()||null};
    const result=editingPlayerId?await supabase.from("players").update(values).eq("id",editingPlayerId).select("*").single():await supabase.from("players").insert(values).select("*").single();
    if(result.error){setSaving(false);setError(result.error.message);return;}
    if(isNew){try{await recordRegistrationConsent({subjectType:"player",subjectId:result.data.id,authorityType:player.authority_type,holderName:player.holder_name,guardianName:player.guardian_name,guardianContact:player.guardian_contact});}catch(err){await supabase.from("players").delete().eq("id",result.data.id);setSaving(false);setError("Player was not registered because the consent record could not be saved: "+err.message);return;}}
    try{const photo_url=await uploadAsset(player.image,"players",result.data.id);if(photo_url){const updated=await supabase.from("players").update({photo_url}).eq("id",result.data.id);if(updated.error)throw updated.error;}}
    catch(err){setSaving(false);setError((editingPlayerId?"Player updated":"Player saved")+", but photo upload failed: "+err.message);await refresh();return;}
    const wasEditing=!!editingPlayerId;setSaving(false);setEditingPlayerId("");setPlayer({id:"",team_id:"",full_name:"",shirt_number:"",position:"",image:null,consent_confirmed:false,authority_type:"self",holder_name:"",guardian_name:"",guardian_contact:""});setNotice(wasEditing?"Player updated successfully.":"Player registered successfully.");await refresh();
  }
  function editPlayer(x){setEditingPlayerId(x.id);setPlayer({id:x.id,team_id:x.team_id||"",full_name:x.full_name||"",shirt_number:x.shirt_number??"",position:x.position||"",image:null,consent_confirmed:false,authority_type:"self",holder_name:"",guardian_name:"",guardian_contact:""});setTab("players");window.scrollTo({top:0,behavior:"smooth"});}
  async function deletePlayer(x){
    if(!window.confirm("Remove "+x.full_name+" from the active player registry? Historical records will be preserved."))return;
    setSaving(true);setError("");setNotice("");
    const supabase=getSupabase();
    const refs=await Promise.all([
      supabase.from("match_events").select("id",{count:"exact",head:true}).eq("player_id",x.id),
      supabase.from("match_events").select("id",{count:"exact",head:true}).eq("secondary_player_id",x.id),
      supabase.from("match_lineup_players").select("id",{count:"exact",head:true}).eq("player_id",x.id),
      supabase.from("match_lineups").select("id",{count:"exact",head:true}).eq("captain_player_id",x.id),
      supabase.from("official_player_statistics").select("id",{count:"exact",head:true}).eq("player_id",x.id)
    ]);
    const refError=refs.find(r=>r.error);
    if(refError){setSaving(false);setError("Player reference check failed: "+refError.error.message);return;}
    const referenced=refs.some(r=>(r.count||0)>0);
    if(referenced){
      const archived=await supabase.from("players").update({is_active:false}).eq("id",x.id);
      if(archived.error){setSaving(false);setError("Player could not be deactivated: "+archived.error.message);return;}
      setSaving(false);setNotice(x.full_name+" was deactivated because historical match records reference this player. Historical data was preserved.");await refresh();return;
    }
    const result=await supabase.from("players").delete().eq("id",x.id);
    if(result.error){setSaving(false);setError("Player could not be deleted: "+result.error.message);return;}
    setSaving(false);setNotice("Player removed successfully.");await refresh();
  }

  async function save(table,values,reset){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!supabase){setSaving(false);return;}
    const result=await supabase.from(table).insert(values);setSaving(false);
    if(result.error){setError(result.error.message);return;}
    reset();setNotice("Saved successfully.");await refresh();
  }
  async function loadLive(id){ const supabase=getSupabase(); if(!supabase)return; const [ev,st]=await Promise.all([supabase.from("match_events").select("*, teams(name), player:players!match_events_player_id_fkey(full_name,shirt_number), secondary_player:players!match_events_secondary_player_id_fkey(full_name,shirt_number)").eq("match_id",id).order("created_at",{ascending:false}),supabase.from("match_statistics").select("*").eq("match_id",id).maybeSingle()]); if(ev.error)setError(ev.error.message); else setEvents(ev.data||[]); if(st.error)setError(st.error.message); else setMatchStats(st.data||null); }
  function elapsed(m){ if(!m)return 0; const now=Date.now(); const kickoff=m.kickoff_at?new Date(m.kickoff_at).getTime():0; if(!kickoff)return 0; const halftime=m.halftime_at?new Date(m.halftime_at).getTime():0; const secondHalf=m.second_half_at?new Date(m.second_half_at).getTime():0; const finished=m.finished_at?new Date(m.finished_at).getTime():0; if(m.status==="scheduled")return 0; if(m.status==="live"){ if(secondHalf){ const firstHalfEnd=halftime||secondHalf; const first=Math.max(0,firstHalfEnd-kickoff); const second=Math.max(0,now-secondHalf); return Math.floor((first+second)/1000); } return Math.floor(Math.max(0,now-kickoff)/1000); } if(m.status==="halftime"){ const end=halftime||now; return Math.floor(Math.max(0,end-kickoff)/1000); } if(m.status==="finished"){ if(secondHalf){ const firstHalfEnd=halftime||secondHalf; const first=Math.max(0,firstHalfEnd-kickoff); const second=Math.max(0,(finished||now)-secondHalf); return Math.floor((first+second)/1000); } return Math.floor(Math.max(0,(finished||now)-kickoff)/1000); } return 0; }
  function displayClock(sec){const min=Math.floor(sec/60),s=sec%60;return String(min).padStart(2,"0")+":"+String(s).padStart(2,"0");}
  function lineupEligible(m){if(!m)return false;if(m.status==="live"||m.status==="halftime")return true;if(m.status!=="scheduled"||!m.scheduled_at)return false;return Date.now()>=new Date(m.scheduled_at).getTime()-30*60*1000;}
  async function clockAction(m,action){ const now=new Date().toISOString(); let values={}; if(action==="start")values={status:"live",kickoff_at:now,halftime_at:null,second_half_at:null,finished_at:null}; if(action==="halftime")values={status:"halftime",halftime_at:now}; if(action==="resume")values={status:"live",second_half_at:now}; if(action==="finish")values={status:"finished",finished_at:now}; await updateMatch(m.id,values); setLiveMatch({...m,...values}); }
  async function addEvent(){ if(!liveMatch)return; const supabase=getSupabase(); setSaving(true); setError(""); const minute=eventForm.minute?Number(eventForm.minute):Math.floor(clock/60); const teamId=eventForm.team_id||null; const playerId=eventForm.player_id||null; if((eventForm.type!=="note"&&eventForm.type!=="var")&&!teamId){setError("Select a team for this event.");setSaving(false);return;} if(playerId){const p=players.find(x=>x.id===playerId);if(!p||p.team_id!==teamId){setError("The selected player does not belong to the selected team.");setSaving(false);return;}} const result=await supabase.from("match_events").insert({match_id:liveMatch.id,team_id:teamId,player_id:playerId,secondary_player_id:eventForm.secondary_player_id||null,event_type:eventForm.type,minute,extra_minute:eventForm.extra_minute?Number(eventForm.extra_minute):null,details:eventForm.details||null}); if(result.error){setError(result.error.message);setSaving(false);return;} if((eventForm.type==="goal"||eventForm.type==="own_goal")&&teamId){const scoringTeam=eventForm.type==="own_goal"?(teamId===liveMatch.home_team_id?liveMatch.away_team_id:liveMatch.home_team_id):teamId; const home=scoringTeam===liveMatch.home_team_id; const values=home?{home_score:(liveMatch.home_score||0)+1}:{away_score:(liveMatch.away_score||0)+1}; const upd=await supabase.from("matches").update(values).eq("id",liveMatch.id); if(upd.error){setError(upd.error.message);setSaving(false);return;} setLiveMatch({...liveMatch,...values});} setEventForm({type:"goal",team_id:"",player_id:"",secondary_player_id:"",minute:"",extra_minute:"",details:""});setSaving(false);await loadLive(liveMatch.id); }
  async function rebuildOfficialStats(){
    const supabase=getSupabase(); if(!supabase)return;
    setSaving(true); setError(""); setNotice("");
    try{
      let seasonIds=[];
      if(statsSeasonId) seasonIds=[statsSeasonId];
      else if(statsCompetitionId) seasonIds=seasons.filter(x=>x.competition_id===statsCompetitionId).map(x=>x.id);
      else seasonIds=seasons.map(x=>x.id);
      seasonIds=[...new Set(seasonIds.filter(Boolean))];
      if(!seasonIds.length){setNotice("No seasons are registered for this scope yet.");return;}
      for(const seasonId of seasonIds){
        const result=await supabase.rpc("rebuild_official_player_statistics",{p_season_id:seasonId});
        if(result.error)throw result.error;
      }
      await loadStats();
      setNotice("Official player statistics rebuilt from officially verified results, lineups and match events.");
    }catch(err){setError("Statistics rebuild failed: "+err.message);}
    finally{setSaving(false);}
  }
  async function loadStats(){
    const supabase=getSupabase(); if(!supabase)return;
    setError(""); setNotice("");
    const selectedSeasonIds=statsCompetitionId?seasons.filter(x=>x.competition_id===statsCompetitionId).map(x=>x.id):[];
    if(statsCompetitionId&&!selectedSeasonIds.length){setStatsData({standings:[],scorers:[],recent:[],form:[]});setOfficialStats([]);setNotice("No seasons are registered for this competition yet.");return;}
    let matchQuery=supabase.from("matches").select("id,season_id,stage_id,scheduled_at,status,home_score,away_score,home_team_id,away_team_id,home:teams!matches_home_team_id_fkey(id,name)").eq("status","verified").order("scheduled_at",{ascending:false});
    if(statsSeasonId)matchQuery=matchQuery.eq("season_id",statsSeasonId);
    else if(statsCompetitionId)matchQuery=matchQuery.in("season_id",selectedSeasonIds);
    const m=await matchQuery;
    if(m.error){setError(m.error.message);return;}
    const ids=(m.data||[]).map(x=>x.id);
    const e=ids.length?await supabase.from("match_events").select("match_id,team_id,player_id,event_type,player:players!match_events_player_id_fkey(full_name,shirt_number),teams(name)").in("match_id",ids).in("event_type",["goal","own_goal","yellow_card","red_card"]):{data:[],error:null};
    if(e.error){setError(e.error.message);return;}
    const map={}; const ensure=(id,name)=>{if(!id)return null;if(!map[id])map[id]={team_id:id,team:name||"Unknown",played:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,points:0};return map[id];};
    (m.data||[]).forEach(x=>{const h=ensure(x.home_team_id,x.home?.name),a=ensure(x.away_team_id,x.away?.name);if(!h||!a)return;h.played++;a.played++;h.gf+=x.home_score||0;h.ga+=x.away_score||0;a.gf+=x.away_score||0;a.ga+=x.home_score||0;if((x.home_score||0)>(x.away_score||0)){h.wins++;h.points+=3;a.losses++;}else if((x.home_score||0)<(x.away_score||0)){a.wins++;a.points+=3;h.losses++;}else{h.draws++;a.draws++;h.points++;a.points++;}});
    Object.values(map).forEach(x=>x.gd=x.gf-x.ga);
    const formMap={};
    const ensureForm=(id,name)=>{
      if(!id)return null;
      if(!formMap[id])formMap[id]={team_id:id,team:name||"Unknown",matches:[],form:[]};
      return formMap[id];
    };
    (m.data||[]).forEach(x=>{
      const h=ensureForm(x.home_team_id,x.home?.name),a=ensureForm(x.away_team_id,x.away?.name);
      if(!h||!a)return;
      const hs=x.home_score||0, as=x.away_score||0;
      h.matches.push({id:x.id,opponent:a.team,venue:"H",score:hs+"-"+as,date:x.scheduled_at,result:hs>as?"W":hs<as?"L":"D"});
      a.matches.push({id:x.id,opponent:h.team,venue:"A",score:as+"-"+hs,date:x.scheduled_at,result:as>hs?"W":as<hs?"L":"D"});
    });
    Object.values(formMap).forEach(x=>{
      x.matches.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
      x.form=x.matches.slice(0,5).map(y=>y.result);
    });
    const form=Object.values(formMap).filter(x=>x.matches.length).sort((a,b)=>b.matches.length-a.matches.length||a.team.localeCompare(b.team));
    const scorers={}; (e.data||[]).forEach(x=>{if(x.event_type!=="goal"||!x.player_id)return;const p=x.players;if(!scorers[x.player_id])scorers[x.player_id]={player_id:x.player_id,player:p?.full_name||"Unknown",shirt_number:p?.shirt_number||"",team:x.teams?.name||"Unknown",goals:0};scorers[x.player_id].goals++;});
    const statQuery=supabase.from("official_player_statistics").select("*, players(full_name,shirt_number), teams(name)").order("goals",{ascending:false}).order("minutes_played",{ascending:false});
    let oq=statQuery;
    if(statsSeasonId) oq=oq.eq("season_id",statsSeasonId);
    else if(statsCompetitionId) oq=oq.in("season_id",selectedSeasonIds);
    const os=await oq;
    if(os.error){setError(os.error.message);return;}
    setOfficialStats(os.data||[]);
    setStatsData({standings:Object.values(map).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team)),scorers:Object.values(scorers).sort((a,b)=>b.goals-a.goals||a.player.localeCompare(b.player)),recent:(m.data||[]).slice(0,10),form});
  }
  async function loadH2H(){
    const supabase=getSupabase(); if(!supabase)return;
    setError(""); setNotice("");
    if(!h2hHome||!h2hAway||h2hHome===h2hAway){setH2hData([]);setH2hSummary(null);if(h2hHome===h2hAway&&h2hHome)setError("Select two different teams for H2H.");return;}
    const selectedSeasonIds=statsCompetitionId?seasons.filter(x=>x.competition_id===statsCompetitionId).map(x=>x.id):[];
    if(statsCompetitionId&&!selectedSeasonIds.length){setH2hData([]);setNotice("No seasons are registered for this competition yet.");return;}
    let q=supabase.from("matches").select("id,season_id,stage_id,scheduled_at,status,home_score,away_score,home_team_id,away_team_id,home:teams!matches_home_team_id_fkey(id,name),away:teams!matches_away_team_id_fkey(id,name)").in("status",["finished","verified"]).order("scheduled_at",{ascending:false});
    if(statsSeasonId)q=q.eq("season_id",statsSeasonId); else if(statsCompetitionId)q=q.in("season_id",selectedSeasonIds);
    const r=await q.or("home_team_id.eq."+h2hHome+",away_team_id.eq."+h2hHome);
    if(r.error){setError(r.error.message);return;}
    const rows=(r.data||[]).filter(x=>(x.home_team_id===h2hHome&&x.away_team_id===h2hAway)||(x.home_team_id===h2hAway&&x.away_team_id===h2hHome));
    const summary={meetings:rows.length,homeWins:0,awayWins:0,draws:0,homeGoals:0,awayGoals:0};
    rows.forEach(x=>{const firstIsHome=x.home_team_id===h2hHome;const hs=Number(x.home_score||0),as=Number(x.away_score||0);const firstGoals=firstIsHome?hs:as;const secondGoals=firstIsHome?as:hs;summary.homeGoals+=firstGoals;summary.awayGoals+=secondGoals;if(firstGoals>secondGoals)summary.homeWins++;else if(secondGoals>firstGoals)summary.awayWins++;else summary.draws++;});
    setH2hData(rows);setH2hSummary(summary);
  }

  async function loadReports(){
    const supabase=getSupabase(); if(!supabase)return;
    const r=await supabase.from("match_reports").select("*,match:matches(id,home_score,away_score,status,rescheduled_at,interruption_reason,interruption_minute,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").order("created_at",{ascending:false});
    if(!r.error)setReports(r.data||[]);
  }
  async function saveReport(){
    if(!reportMatch)return;
    const supabase=getSupabase(); setSaving(true);setError("");setNotice("");
    const payload={match_id:reportMatch.id,summary:report?.summary||"",incidents:report?.incidents||"",submitted_at:new Date().toISOString(),status:"submitted"};
    const r=await supabase.from("match_reports").upsert(payload,{onConflict:"match_id"}).select("*,match:matches(id,home_score,away_score,home:teams!matches_home_team_id_fkey(name),away:teams!matches_away_team_id_fkey(name))").single();
    setSaving(false); if(r.error){setError(r.error.message);return;} setReport(r.data);setNotice("Report submitted for verification.");await loadReports();
  }
  async function verifyReport(r){
    const choice=reviewChoices[r.id]||{};
    const outcome=choice.outcome||r.outcome||"completed";
    const interruptionReason=(choice.interruption_reason??r.interruption_reason??"").trim();
    const interruptionMinute=choice.interruption_minute!==undefined&&choice.interruption_minute!==""?Number(choice.interruption_minute):(r.interruption_minute??null);
    const rescheduleAt=choice.reschedule_at||r.reschedule_at||null;
    await lockReport(r,outcome,rescheduleAt,interruptionReason,interruptionMinute);
  }
  async function lockReport(r,outcome,rescheduleAt,interruptionReason,interruptionMinute){
    const supabase=getSupabase();setSaving(true);setError("");setNotice("");
    const {data:{user}}=await supabase.auth.getUser();
    const interrupted=["suspended","postponed","abandoned","cancelled"].includes(outcome);
    if(!["completed","suspended","postponed","abandoned","cancelled"].includes(outcome)){setError("Select a valid official outcome.");setSaving(false);return;}
    if(interrupted&&!interruptionReason){setError("A reason is required before locking an interrupted match.");setSaving(false);return;}
    if(interruptionMinute!==null&&(!Number.isInteger(interruptionMinute)||interruptionMinute<0)){setError("Interruption minute must be a whole number of 0 or greater.");setSaving(false);return;}
    const now=new Date().toISOString();
    const officialResult=outcome==="completed";
    const targetStatus=officialResult?"verified":outcome;
    const v=await supabase.from("match_verifications").upsert({match_id:r.match_id,verified_by:user?.id||null,verified_at:now,official_result:officialResult,locked_at:now,notes:interruptionReason||null},{onConflict:"match_id"});
    if(v.error){setError(v.error.message);setSaving(false);return;}
    const m=await supabase.from("matches").update({status:targetStatus,rescheduled_at:rescheduleAt||null,interruption_reason:interruptionReason||null,interruption_minute:interruptionMinute,outcome_note:r.summary||null}).eq("id",r.match_id);
    if(m.error){setError(m.error.message);setSaving(false);return;}
    const rr=await supabase.from("match_reports").update({status:"verified",outcome,interruption_reason:interruptionReason||null,interruption_minute:interruptionMinute,reschedule_at:rescheduleAt||null,updated_at:now}).eq("id",r.id);
    if(rr.error){setError(rr.error.message);setSaving(false);return;}
    setSaving(false);setNotice(outcome==="completed"?"Official result verified and locked.":("Match locked as "+outcome+"."+(rescheduleAt?" Reschedule/restart time recorded.":" No reschedule time is required or recorded.")));await loadReports();await refresh();
  }
  async function rejectReport(r){
    const supabase=getSupabase();setSaving(true);setError("");setNotice("");
    const x=await supabase.from("match_reports").update({status:"rejected",updated_at:new Date().toISOString()}).eq("id",r.id);
    setSaving(false);if(x.error){setError(x.error.message);return;}setNotice("Report rejected and returned for correction.");await loadReports();
  }
  async function loadLineup(matchId,teamId){
    const supabase=getSupabase(); if(!supabase)return;
    setLineupLoading(true); setError("");
    const existing=await supabase.from("match_lineups").select("*").eq("match_id",matchId).eq("team_id",teamId).maybeSingle();
    if(existing.error){setError(existing.error.message);setLineupLoading(false);return;}
    setLineup(existing.data||null);
    if(existing.data){
      const rows=await supabase.from("match_lineup_players").select("*").eq("lineup_id",existing.data.id);
      if(rows.error)setError(rows.error.message); else setLineupPlayers(rows.data||[]);
    } else setLineupPlayers([]);
    setLineupLoading(false);
  }
  function toggleLineupPlayer(playerId,role){
    setLineupPlayers(prev=>{
      const found=prev.find(x=>x.player_id===playerId);
      if(found){return prev.filter(x=>x.player_id!==playerId);}
      const p=players.find(x=>x.id===playerId);
      return [...prev,{player_id:playerId,role,shirt_number:p?.shirt_number||null,position:p?.position||null}];
    });
  }
  async function saveLineup(){
    if(!lineupMatch||!lineupTeam)return;
    const selected=lineupPlayers;
    const starters=selected.filter(x=>x.role==="starter");
    if(starters.length!==11){setError("A starting lineup must contain exactly 11 players.");return;}
    const captain=selected.find(x=>x.player_id===lineup?.captain_player_id)?.player_id||lineup?.captain_player_id;
    if(!captain||!starters.some(x=>x.player_id===captain)){setError("Select a captain from the starting XI.");return;}
    const supabase=getSupabase(); setSaving(true);setError("");setNotice("");
    let lineupId=lineup?.id;
    if(lineupId){
      const r=await supabase.from("match_lineups").update({formation:lineup.formation||null,captain_player_id:captain,submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",lineupId);
      if(r.error){setError(r.error.message);setSaving(false);return;}
      await supabase.from("match_lineup_players").delete().eq("lineup_id",lineupId);
    } else {
      const r=await supabase.from("match_lineups").insert({match_id:lineupMatch.id,team_id:lineupTeam,formation:lineup?.formation||null,captain_player_id:captain,submitted_at:new Date().toISOString()}).select("*").single();
      if(r.error){setError(r.error.message);setSaving(false);return;}
      lineupId=r.data.id;
    }
    const rows=selected.map(x=>({lineup_id:lineupId,player_id:x.player_id,role:x.role,shirt_number:x.shirt_number||null,position:x.position||null}));
    const r2=await supabase.from("match_lineup_players").insert(rows);
    setSaving(false);
    if(r2.error){setError(r2.error.message);return;}
    setNotice("Lineup saved and submitted."); await loadLineup(lineupMatch.id,lineupTeam);
  }
  async function saveStats(){ if(!liveMatch)return; const supabase=getSupabase(); const keys=["home_possession","away_possession","home_shots","away_shots","home_shots_on_target","away_shots_on_target","home_corners","away_corners","home_fouls","away_fouls","home_offsides","away_offsides","home_saves","away_saves","home_passes","away_passes","home_pass_accuracy","away_pass_accuracy","home_crosses","away_crosses","home_free_kicks","away_free_kicks","home_goal_kicks","away_goal_kicks","home_throw_ins","away_throw_ins","home_xg","away_xg"]; const values={match_id:liveMatch.id}; keys.forEach(k=>values[k]=Number(matchStats?.[k]||0)); const r=await supabase.from("match_statistics").upsert(values,{onConflict:"match_id"}); if(r.error)setError(r.error.message);else setNotice("Match statistics saved."); await loadLive(liveMatch.id); }
  async function updateMatch(id,values){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const result=await supabase.from("matches").update(values).eq("id",id);setSaving(false);
    if(result.error){setError(result.error.message);return;}setNotice("Fixture updated.");await refresh();
  }
  function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
  async function savePreview(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!previewForm.match_id){setSaving(false);setError("Select a match for the preview.");return;}
    const values={...previewForm,headline:previewForm.headline.trim()||null,summary:previewForm.summary.trim()||null,key_storylines:previewForm.key_storylines.trim()||null,form_note:previewForm.form_note.trim()||null,h2h_note:previewForm.h2h_note.trim()||null,venue_note:previewForm.venue_note.trim()||null,author_id:user?.id||null,published_at:previewForm.status==="published"?new Date().toISOString():null,updated_at:new Date().toISOString()};
    const r=await supabase.from("match_previews").upsert(values,{onConflict:"match_id"}).select("*").single();
    setSaving(false);if(r.error){setError(r.error.message);return;}setPreviewForm({match_id:"",headline:"",summary:"",key_storylines:"",form_note:"",h2h_note:"",venue_note:"",status:"draft"});setNotice(previewForm.status==="published"?"Match preview published.":"Match preview saved as draft.");await refresh();
  }
  async function publishPreview(id,status){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const r=await supabase.from("match_previews").update({status,published_at:status==="published"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",id);
    setSaving(false);if(r.error){setError(r.error.message);return;}setNotice(status==="published"?"Match preview published.":"Match preview moved to draft.");await refresh();
  }
  async function saveChannel(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    if(!channelForm.match_id||!channelForm.name.trim()){setSaving(false);setError("Match and channel name are required.");return;}
    if(channelForm.starts_at&&channelForm.ends_at&&new Date(channelForm.ends_at)<=new Date(channelForm.starts_at)){setSaving(false);setError("Channel end time must be after its start time.");return;}
    const values={...channelForm,name:channelForm.name.trim(),provider:channelForm.provider.trim()||null,url:channelForm.url.trim()||null,starts_at:channelForm.starts_at?new Date(channelForm.starts_at).toISOString():null,ends_at:channelForm.ends_at?new Date(channelForm.ends_at).toISOString():null,updated_at:new Date().toISOString()};
    if(values.is_primary){const primary=await supabase.from("match_channels").update({is_primary:false}).eq("match_id",values.match_id);if(primary.error){setSaving(false);setError(primary.error.message);return;}}
    const r=await supabase.from("match_channels").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setChannelForm({match_id:"",channel_type:"live_stream",name:"",provider:"",url:"",is_primary:false,active:true,starts_at:"",ends_at:""});setNotice("Match channel published.");await refresh();
  }
  async function toggleChannel(row){
    setSaving(true);setError("");const supabase=getSupabase();const r=await supabase.from("match_channels").update({active:!row.active,updated_at:new Date().toISOString()}).eq("id",row.id);
    setSaving(false);if(r.error){setError(r.error.message);return;}await refresh();
  }
  async function attachStreamAd(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const form=e.currentTarget,matchId=form.elements.match_id.value,adId=form.elements.ad_slot_id.value,position=form.elements.position.value;
    const startsAt=form.elements.starts_at.value,endsAt=form.elements.ends_at.value,priority=Math.max(1,Number(form.elements.priority.value)||1);
    if(!matchId||!adId){setSaving(false);setError("Select both a match and an ad slot.");return;}
    if(startsAt&&endsAt&&new Date(endsAt)<=new Date(startsAt)){setSaving(false);setError("Ad end time must be after its start time.");return;}
    const ad=await supabase.from("ad_slots").select("id,name,active,start_date,end_date,sponsor_id").eq("id",adId).maybeSingle();
    if(ad.error){setSaving(false);setError(ad.error.message);return;}
    if(!ad.data){setSaving(false);setError("The selected ad slot no longer exists.");return;}
    if(!ad.data.active){setSaving(false);setError("The selected ad slot is inactive. Activate it in Ad Slot Manager first.");return;}
    const today=new Date().toISOString().slice(0,10);
    if(ad.data.start_date&&ad.data.start_date>today){setSaving(false);setError("The selected ad slot has not started yet.");return;}
    if(ad.data.end_date&&ad.data.end_date<today){setSaving(false);setError("The selected ad slot has expired.");return;}
    const r=await supabase.from("match_stream_ads").upsert({match_id:matchId,ad_slot_id:adId,position,active:true,starts_at:startsAt?new Date(startsAt).toISOString():null,ends_at:endsAt?new Date(endsAt).toISOString():null,priority,updated_at:new Date().toISOString()},{onConflict:"match_id,ad_slot_id,position"});
    setSaving(false);if(r.error){setError(r.error.message);return;}form.reset();setNotice("Live-stream ad attached to the match.");await refresh();
  }
  async function toggleStreamAd(row){
    setSaving(true);setError("");const supabase=getSupabase();const r=await supabase.from("match_stream_ads").update({active:!row.active,updated_at:new Date().toISOString()}).eq("id",row.id);
    setSaving(false);if(r.error){setError(r.error.message);return;}await refresh();
  }
  async function saveContent(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={content_type:contentForm.content_type,title:contentForm.title.trim(),slug:(slugify(contentForm.slug.trim()||contentForm.title))+(editingContentId?"":"-"+Date.now()),excerpt:contentForm.excerpt.trim()||null,body:contentForm.body,category:contentForm.category.trim()||null,status:contentForm.status,featured:!!contentForm.featured,cover_image_url:contentForm.cover_image_url.trim()||null,author_id:user?.id||null,published_at:contentForm.status==="published"?new Date().toISOString():null,updated_at:new Date().toISOString()};
    const r=editingContentId?await supabase.from("content_posts").update(values).eq("id",editingContentId):await supabase.from("content_posts").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setEditingContentId("");setContentForm({content_type:"news",title:"",slug:"",excerpt:"",body:"",category:"",status:"draft",featured:false,cover_image_url:""});setNotice("Content saved.");await refresh();
  }
  async function saveSurvey(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={title:surveyForm.title.trim(),description:surveyForm.description.trim()||null,status:surveyForm.status,starts_at:surveyForm.starts_at?new Date(surveyForm.starts_at).toISOString():null,ends_at:surveyForm.ends_at?new Date(surveyForm.ends_at).toISOString():null,created_by:user?.id||null,updated_at:new Date().toISOString()};
    const r=editingSurveyId?await supabase.from("surveys").update(values).eq("id",editingSurveyId):await supabase.from("surveys").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setEditingSurveyId("");setSurveyForm({title:"",description:"",status:"draft",starts_at:"",ends_at:""});setNotice("Survey saved.");await refresh();
  }
  async function saveQuestion(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const options=questionForm.options.split(",").map(x=>x.trim()).filter(Boolean);
    const r=await supabase.from("survey_questions").insert({survey_id:questionForm.survey_id,prompt:questionForm.prompt.trim(),question_type:questionForm.question_type,options,required:!!questionForm.required,sort_order:Number(questionForm.sort_order)||1});
    setSaving(false);if(r.error){setError(r.error.message);return;}setQuestionForm({survey_id:questionForm.survey_id,prompt:"",question_type:"text",options:"",required:false,sort_order:String((surveyQuestions.filter(x=>x.survey_id===questionForm.survey_id).length||0)+2)});setNotice("Survey question added.");await refresh();
  }
  async function updateFeedback(row,status){
    const supabase=getSupabase();setSaving(true);setError("");const values={status,admin_note:row.admin_note||null,resolved_at:status==="resolved"?new Date().toISOString():null};
    const r=await supabase.from("user_feedback").update(values).eq("id",row.id);setSaving(false);if(r.error){setError(r.error.message);return;}setNotice("Feedback updated.");await refresh();
  }
  async function saveFeedbackNote(row,note){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();const r=await supabase.from("user_feedback").update({admin_note:note.trim()||null}).eq("id",row.id);
    setSaving(false);if(r.error){setError(r.error.message);return;}setNotice("Feedback note saved.");await refresh();
  }
  async function saveSponsor(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={...sponsorForm,name:sponsorForm.name.trim(),logo_url:sponsorForm.logo_url.trim()||null,website_url:sponsorForm.website_url.trim()||null,contact_name:sponsorForm.contact_name.trim()||null,contact_email:sponsorForm.contact_email.trim()||null,contact_phone:sponsorForm.contact_phone.trim()||null,start_date:sponsorForm.start_date||null,end_date:sponsorForm.end_date||null,notes:sponsorForm.notes.trim()||null,updated_at:new Date().toISOString()};
    const r=editingSponsorId?await supabase.from("sponsors").update(values).eq("id",editingSponsorId):await supabase.from("sponsors").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setEditingSponsorId("");setSponsorForm({name:"",logo_url:"",website_url:"",contact_name:"",contact_email:"",contact_phone:"",tier:"standard",status:"prospect",start_date:"",end_date:"",notes:""});setNotice("Sponsor saved.");await refresh();
  }
  async function saveDeal(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={sponsor_id:dealForm.sponsor_id,deal_name:dealForm.deal_name.trim(),amount:Number(dealForm.amount)||0,currency:dealForm.currency.trim()||"GHS",status:dealForm.status,start_date:dealForm.start_date||null,end_date:dealForm.end_date||null,placement:dealForm.placement.trim()||null,notes:dealForm.notes.trim()||null,updated_at:new Date().toISOString()};
    const r=editingDealId?await supabase.from("sponsorship_deals").update(values).eq("id",editingDealId):await supabase.from("sponsorship_deals").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setEditingDealId("");setDealForm({sponsor_id:"",deal_name:"",amount:"",currency:"GHS",status:"proposed",start_date:"",end_date:"",placement:"",notes:""});setNotice(editingDealId?"Sponsorship deal updated.":"Sponsorship deal saved.");await refresh();
  }
  function editSponsor(x){setEditingSponsorId(x.id);setSponsorForm({...x,name:x.name||"",logo_url:x.logo_url||"",website_url:x.website_url||"",contact_name:x.contact_name||"",contact_email:x.contact_email||"",contact_phone:x.contact_phone||"",tier:x.tier||"standard",status:x.status||"prospect",start_date:x.start_date||"",end_date:x.end_date||"",notes:x.notes||""});}
  function editDeal(x){setEditingDealId(x.id);setDealForm({sponsor_id:x.sponsor_id||"",deal_name:x.deal_name||"",amount:x.amount??"",currency:x.currency||"GHS",status:x.status||"proposed",start_date:x.start_date||"",end_date:x.end_date||"",placement:x.placement||"",notes:x.notes||""});}
  async function saveAd(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const values={...adForm,name:adForm.name.trim(),image_url:adForm.image_url.trim()||null,target_url:adForm.target_url.trim()||null,sponsor_id:adForm.sponsor_id||null,start_date:adForm.start_date||null,end_date:adForm.end_date||null,updated_at:new Date().toISOString()};
    const r=editingAdId?await supabase.from("ad_slots").update(values).eq("id",editingAdId):await supabase.from("ad_slots").insert(values);
    setSaving(false);if(r.error){setError(r.error.message);return;}setEditingAdId("");setAdForm({name:"",placement:"homepage",format:"banner",sponsor_id:"",image_url:"",target_url:"",active:false,start_date:"",end_date:""});setNotice("Ad slot saved.");await refresh();
  }
  async function saveTransaction(e){
    e.preventDefault();setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const r=await supabase.from("monetization_transactions").insert({sponsor_id:transactionForm.sponsor_id||null,deal_id:transactionForm.deal_id||null,transaction_type:transactionForm.transaction_type,amount:Number(transactionForm.amount)||0,currency:transactionForm.currency.trim()||"GHS",status:transactionForm.status,transaction_date:transactionForm.transaction_date,reference:transactionForm.reference.trim()||null,notes:transactionForm.notes.trim()||null});
    setSaving(false);if(r.error){setError(r.error.message);return;}setTransactionForm({sponsor_id:"",deal_id:"",transaction_type:"payment",amount:"",currency:"GHS",status:"pending",transaction_date:new Date().toISOString().slice(0,10),reference:"",notes:""});setNotice("Revenue transaction saved.");await refresh();
  }
  async function sendBroadcastNotification(e){
    e.preventDefault();setNotificationSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const title=notificationForm.title.trim(),body=notificationForm.body.trim();
    if(!title||!body){setNotificationSaving(false);setError("Notification title and message are required.");return;}
    let recipientIds=[];
    if(notificationForm.team_id||notificationForm.match_id){
      const [teamFans,matchFans]=await Promise.all([
        notificationForm.team_id?supabase.from("user_favorite_teams").select("user_id").eq("team_id",notificationForm.team_id):Promise.resolve({data:[],error:null}),
        notificationForm.match_id?supabase.from("user_favorite_matches").select("user_id").eq("match_id",notificationForm.match_id):Promise.resolve({data:[],error:null})
      ]);
      const recipientError=teamFans.error||matchFans.error;
      if(recipientError){setNotificationSaving(false);setError(recipientError.message);return;}
      recipientIds=[...new Set([...(teamFans.data||[]),...(matchFans.data||[])].map(x=>x.user_id))];
      if(!recipientIds.length){setNotificationSaving(false);setError("No followers match the selected notification target.");return;}
    }else{
      const {data:users,error:userError}=await supabase.from("profiles").select("id").eq("is_active",true);
      if(userError){setNotificationSaving(false);setError(userError.message);return;}
      recipientIds=(users||[]).map(x=>x.id);
    }
    const rows=recipientIds.map(user_id=>({user_id,notification_type:notificationForm.notification_type,title,body,team_id:notificationForm.team_id||null,match_id:notificationForm.match_id||null}));
    if(!rows.length){setNotificationSaving(false);setError("There are no active user accounts to notify.");return;}
    const r=await supabase.from("user_notifications").insert(rows);
    setNotificationSaving(false);if(r.error){setError(r.error.message);return;}
    setNotificationForm({title:"",body:"",notification_type:"news",team_id:"",match_id:""});setNotice("Notification sent to "+rows.length+" recipient(s).");
  }
  async function moderateContent(id,status){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const r=await supabase.from("content_posts").update({status,published_at:status==="published"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",id);
    setSaving(false);if(r.error){setError(r.error.message);return;}setNotice(status==="published"?"Content approved and published.":"Content moved out of publication.");await refresh();
  }
  async function closeSurvey(id){
    setSaving(true);setError("");setNotice("");const supabase=getSupabase();
    const r=await supabase.from("surveys").update({status:"closed",updated_at:new Date().toISOString()}).eq("id",id);
    setSaving(false);if(r.error){setError(r.error.message);return;}setNotice("Survey closed.");await refresh();
  }
  async function signOut(){const supabase=getSupabase();if(supabase)await supabase.auth.signOut();window.location.href="/login";}

  if(loading)return <main className="auth-page"><div className="panel">Loading ZEDEK Sports Control Room...</div></main>;
  if(!user||!profile)return <main className="auth-page"><div className="panel"><h1>Access unavailable</h1><p>{error||"Administrator profile unavailable."}</p><button className="button" onClick={signOut}>Sign out</button></div></main>;
  if(profile.role==="reporter"&&profile.is_active){window.location.href="/reporter";return <main className="auth-page"><div className="panel">Redirecting to Reporter Desk...</div></main>;} if(!profile.is_active||!["super_admin","zedek_admin"].includes(profile.role))return <main className="auth-page"><div className="panel"><h1>Access restricted</h1><p>This account is not an active ZEDEK Sports administrator.</p><button className="button" onClick={signOut}>Sign out</button></div></main>;

  return <main className="page">
    <header className="site-header"><div className="container nav"><div className="brand">ZEDEK <span>SPORTS</span> · CONTROL</div><button className="button" onClick={signOut}>Sign out</button></div></header>
    <section className="container page-header"><div className="eyebrow">Private · Football Operations</div><h1>Control Room</h1><p>{profile.full_name||user.email} · {profile.role}</p></section>
    <section className="container">
      {error&&<div className="error-box">{error}</div>}{notice&&<div className="success-box">{notice}</div>}
      <div className="nav-links" style={{margin:"16px 0",overflowX:"auto",flexWrap:"nowrap"}}>
        {TABS.map(item=><button key={item} className={"button "+(tab===item?"primary":"")} onClick={()=>setTab(item)}>{item.replace("_"," ").replace(/^./,x=>x.toUpperCase())}</button>)}<a className="button" href="/reporters">Reporters</a>
      </div>

      {tab==="stats" && (
        <div className="stats-grid">
          <div className="panel">
            <h2>Statistics Hub</h2>
            <p className="muted">Official results from finished and verified matches.</p>
            <label>Competition<select value={statsCompetitionId} onChange={e=>{setStatsCompetitionId(e.target.value);setStatsSeasonId("");setStatsData({standings:[],scorers:[],recent:[],form:[]});setOfficialStats([]);}}><option value="">All competitions</option>{competitions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Season<select value={statsSeasonId} onChange={e=>{setStatsSeasonId(e.target.value);setStatsData({standings:[],scorers:[],recent:[],form:[]});setOfficialStats([]);}}><option value="">All seasons</option>{seasons.filter(x=>!statsCompetitionId||x.competition_id===statsCompetitionId).map(x=><option key={x.id} value={x.id}>{x.name} · {x.competitions?.name||"Competition"}</option>)}</select></label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button primary" onClick={loadStats}>Refresh statistics</button><button className="button" onClick={rebuildOfficialStats} disabled={saving}>{saving?"Rebuilding…":"Rebuild official player stats"}</button></div><div className="panel" style={{marginTop:16}}><h2>Official Player Statistics</h2><p className="muted">Verified-match statistics generated from official lineups and events.</p>{officialStats.length?<div className="form-stack">{officialStats.slice(0,50).map(x=><div className="status-card" key={x.id}><b>{x.players?.full_name||"Unknown player"} {x.players?.shirt_number?"· #"+x.players.shirt_number:""}</b><span>{x.teams?.name||"Team"} · Apps {x.matches_played} · Starts {x.starts} · Goals {x.goals} · Assists {x.assists} · YC {x.yellow_cards} · RC {x.red_cards} · Minutes {x.minutes_played}</span></div>)}</div>:<p className="muted">No official player statistics for the selected scope yet.</p>}</div>
            <h3>Standings</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
                <tbody>
                  {statsData.standings.map((x,i) => (
                    <tr key={x.team_id}>
                      <td>{i+1}</td><td>{x.team}</td><td>{x.played}</td><td>{x.wins}</td><td>{x.draws}</td><td>{x.losses}</td><td>{x.gf}</td><td>{x.ga}</td><td>{x.gd}</td><td><b>{x.points}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!statsData.standings.length && <p className="muted">No finished or verified matches yet.</p>}
          </div>
          <div className="panel">
            <h2>Team Form</h2>
            <p className="muted">Last five completed matches in the selected competition/season, newest first.</p>
            {statsData.form.map(x=>(
              <div className="status-card" key={x.team_id}>
                <b>{x.team}</b>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                  {x.form.map((r,i)=><span key={i} style={{minWidth:28,textAlign:"center",padding:"4px 7px",border:"1px solid #ddd",borderRadius:6,fontWeight:700}}>{r}</span>)}
                </div>
                <span>{x.matches.slice(0,5).map(y=>y.opponent+" ("+y.venue+") "+y.score).join(" · ")}</span>
              </div>
            ))}
            {!statsData.form.length&&<p className="muted">No completed matches available for form yet.</p>}
            <h2>Head-to-Head</h2>
            <p className="muted">Completed meetings between the selected teams in the current competition/season scope.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <select value={h2hHome} onChange={e=>{setH2hHome(e.target.value);setH2hData([]);}}><option value="">Team 1</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select value={h2hAway} onChange={e=>{setH2hAway(e.target.value);setH2hData([]);}}><option value="">Team 2</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            </div>
            <button className="button primary" style={{marginTop:8}} onClick={loadH2H}>Load H2H</button>
            {h2hSummary&&<div className="grid" style={{marginTop:12}}><div className="card"><b>{h2hSummary.meetings}</b><p>Meetings</p></div><div className="card"><b>{h2hSummary.homeWins}</b><p>{teams.find(x=>x.id===h2hHome)?.name||"Team 1"} wins</p></div><div className="card"><b>{h2hSummary.awayWins}</b><p>{teams.find(x=>x.id===h2hAway)?.name||"Team 2"} wins</p></div><div className="card"><b>{h2hSummary.draws}</b><p>Draws</p></div><div className="card"><b>{h2hSummary.homeGoals} — {h2hSummary.awayGoals}</b><p>Goals</p></div></div>}
            {h2hData.map(x=><div className="status-card" key={x.id}><b>{x.home?.name} {x.home_score??0} — {x.away_score??0} {x.away?.name}</b><span>{fmtDate(x.scheduled_at)} · {x.status}</span></div>)}
            {!h2hData.length&&h2hHome&&h2hAway&&<p className="muted">No completed meetings found for the selected scope.</p>}
            <h2>Top Scorers</h2>
            {statsData.scorers.map((x,i) => (
              <div className="status-card" key={x.player_id}>
                <b>{i+1}. {x.player}</b>
                <span>{x.team} · {x.goals} goal{x.goals===1 ? "" : "s"}</span>
              </div>
            ))}
            {!statsData.scorers.length && <p className="muted">No recorded goals yet.</p>}
            <h2 style={{marginTop:20}}>Recent Results</h2>
            {statsData.recent.map(x => (
              <div className="status-card" key={x.id}>
                <b>{x.home?.name} {x.home_score ?? 0} — {x.away_score ?? 0} {x.away?.name}</b>
                <span>{fmtDate(x.scheduled_at)} · {x.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="overview"&&<div className="grid">
        <div className="card"><h2>{competitions.length}</h2><p>Competitions</p></div><div className="card"><h2>{seasons.length}</h2><p>Seasons</p></div>
        <div className="card"><h2>{stages.length}</h2><p>Stages</p></div><div className="card"><h2>{matches.length}</h2><p>Fixtures</p></div>
        <div className="card"><h2>{teams.length}</h2><p>Teams</p></div><div className="card"><h2>{players.length}</h2><p>Players</p></div>
        <div className="card"><h2>Phase 2</h2><p>Stages and fixture scheduling are now connected to the live Supabase football database.</p></div>
      </div>}


      {tab==="competitions"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={saveCompetition}>
          <h2>{editingCompetitionId?"Edit competition":"Competition registry"}</h2>
          <label>Name<input required value={competition.name} onChange={e=>setCompetition({...competition,name:e.target.value})}/></label>
          <label>Code<input value={competition.code} onChange={e=>setCompetition({...competition,code:e.target.value})}/></label>
          <label>Location<input value={competition.location} onChange={e=>setCompetition({...competition,location:e.target.value})}/></label>
          <label>Format<select value={competition.format} onChange={e=>setCompetition({...competition,format:e.target.value})}><option value="league">League</option><option value="group">Group</option><option value="h2h">H2H</option><option value="knockout">Knockout</option><option value="two_leg">Two-leg</option></select></label>
          <label>Competition logo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setCompetition({...competition,image:e.target.files?.[0]||null})}/></label>
          {competition.image&&<span className="muted">Selected: {competition.image.name}</span>}
          {editingCompetitionId&&<button type="button" className="button" disabled={saving} onClick={()=>{setEditingCompetitionId("");setCompetition({id:"",name:"",code:"",location:"",format:"league",image:null});}}>Cancel edit</button>}
          <button className="button primary" disabled={saving}>{saving?"Saving…":editingCompetitionId?"Save competition changes":"Create competition"}</button>
        </form>
        <div className="panel"><h2>Registered</h2>
          {competitions.map(x=><div className="status-card competition-admin-row" key={x.id}>
            <div className="competition-admin-main">{x.logo_url?<img src={x.logo_url} alt="" className="competition-admin-logo"/>:<div className="competition-admin-logo placeholder">C</div>}<div><b>{x.name}</b><span>{x.code||"No code"} · {x.location||"No location"} · {x.format}</span></div></div>
            <div className="row-actions"><button type="button" className="button" onClick={()=>editCompetition(x)}>Edit</button><button type="button" className="button danger" onClick={()=>deleteCompetition(x)}>Delete</button></div>
          </div>)}
          {!competitions.length&&<p className="muted">No competitions yet.</p>}
        </div>
      </div>}
      {tab==="seasons"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("seasons",{competition_id:season.competition_id,name:season.name.trim(),year:season.year?Number(season.year):null,start_date:season.start_date||null,end_date:season.end_date||null},()=>setSeason({competition_id:"",name:"",year:"",start_date:"",end_date:""}));}}>
          <h2>Season registry</h2><label>Competition<select required value={season.competition_id} onChange={e=>setSeason({...season,competition_id:e.target.value})}><option value="">Select competition</option>{competitions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Name<input required value={season.name} onChange={e=>setSeason({...season,name:e.target.value})}/></label><label>Year<input type="number" value={season.year} onChange={e=>setSeason({...season,year:e.target.value})}/></label>
          <label>Start<input type="date" value={season.start_date} onChange={e=>setSeason({...season,start_date:e.target.value})}/></label><label>End<input type="date" value={season.end_date} onChange={e=>setSeason({...season,end_date:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>Create season</button>
        </form>
        <div className="panel"><h2>Registered</h2>{seasons.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.competitions?.name||"Competition"} · {x.year||"Year not set"}</span></div>)}{!seasons.length&&<p className="muted">No seasons yet.</p>}</div>
      </div>}

      {tab==="stages"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();save("stages",{season_id:stage.season_id,name:stage.name.trim(),stage_type:stage.stage_type,stage_order:Number(stage.stage_order)||1,is_active:stage.is_active},()=>setStage({season_id:"",name:"",stage_type:"league",stage_order:"1",is_active:true}));}}>
          <h2>Stage management</h2><label>Season<select required value={stage.season_id} onChange={e=>setStage({...stage,season_id:e.target.value})}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name} · {x.competitions?.name||""}</option>)}</select></label>
          <label>Stage name<input required placeholder="e.g. Main League" value={stage.name} onChange={e=>setStage({...stage,name:e.target.value})}/></label>
          <label>Stage type<select value={stage.stage_type} onChange={e=>setStage({...stage,stage_type:e.target.value})}>{STAGE_TYPES.map(x=><option key={x} value={x}>{x.replace("_"," ")}</option>)}</select></label>
          <label>Order<input type="number" min="1" value={stage.stage_order} onChange={e=>setStage({...stage,stage_order:e.target.value})}/></label>
          <label><input type="checkbox" checked={stage.is_active} onChange={e=>setStage({...stage,is_active:e.target.checked})}/> Active stage</label>
          <button className="button primary" disabled={saving}>Create stage</button>
        </form>
        <div className="panel"><h2>Stages</h2>{stages.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.seasons?.name||"Season"} · {x.stage_type} · order {x.stage_order} · {x.is_active?"ACTIVE":"inactive"}</span></div>)}{!stages.length&&<p className="muted">No stages yet.</p>}</div>
      </div>}

      {tab==="fixtures"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={e=>{e.preventDefault();if(fixture.home_team_id===fixture.away_team_id){setError("Home and away teams must be different.");return;}save("matches",{season_id:fixture.season_id,stage_id:fixture.stage_id,home_team_id:fixture.home_team_id,away_team_id:fixture.away_team_id,scheduled_at:fixture.scheduled_at?new Date(fixture.scheduled_at).toISOString():null,venue:fixture.venue.trim()||null,round_name:fixture.round_name.trim()||null,leg:fixture.leg?Number(fixture.leg):null,notes:fixture.notes.trim()||null},()=>setFixture({season_id:"",stage_id:"",home_team_id:"",away_team_id:"",scheduled_at:"",venue:"",round_name:"",leg:"1",notes:""}));}}>
          <h2>Fixture management</h2>
          <label>Season<select required value={fixture.season_id} onChange={e=>setFixture({...fixture,season_id:e.target.value,stage_id:""})}><option value="">Select season</option>{seasons.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Stage<select required value={fixture.stage_id} onChange={e=>setFixture({...fixture,stage_id:e.target.value})}><option value="">Select stage</option>{stages.filter(x=>x.season_id===fixture.season_id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Home team<select required value={fixture.home_team_id} onChange={e=>setFixture({...fixture,home_team_id:e.target.value})}><option value="">Select home team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Away team<select required value={fixture.away_team_id} onChange={e=>setFixture({...fixture,away_team_id:e.target.value})}><option value="">Select away team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Date & time<input type="datetime-local" required value={fixture.scheduled_at} onChange={e=>setFixture({...fixture,scheduled_at:e.target.value})}/></label>
          <label>Venue<input value={fixture.venue} onChange={e=>setFixture({...fixture,venue:e.target.value})}/></label>
          <label>Round<input placeholder="e.g. Matchday 1" value={fixture.round_name} onChange={e=>setFixture({...fixture,round_name:e.target.value})}/></label>
          <label>Leg<select value={fixture.leg} onChange={e=>setFixture({...fixture,leg:e.target.value})}><option value="1">1</option><option value="2">2</option></select></label>
          <label>Notes<textarea value={fixture.notes} onChange={e=>setFixture({...fixture,notes:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>Create fixture</button>
        </form>
        <div className="panel"><h2>Fixture list</h2>{matches.map(x=><div className="status-card" key={x.id}>
          <b>{x.home?.name||"Home"} vs {x.away?.name||"Away"}</b><span>{x.seasons?.name||"Season"} · {x.stages?.name||"Stage"} · {fmtDate(x.scheduled_at)} · {x.venue||"Venue TBC"}</span>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}><button className="button" onClick={()=>updateMatch(x.id,{status:"scheduled"})}>Scheduled</button><button className="button" onClick={()=>clockAction(x,"start")}>Start live</button><button className="button" onClick={()=>updateMatch(x.id,{status:"postponed"})}>Postpone</button><button className="button" onClick={()=>updateMatch(x.id,{status:"cancelled"})}>Cancel</button></div>
        </div>)}{!matches.length&&<p className="muted">No fixtures yet.</p>}</div>
      </div>}

      {tab==="live"&&<div className="stats-grid"><div className="panel"><h2>Live Match Control</h2><label>Select match<select value={liveMatch?.id||""} onChange={async e=>{const m=matches.find(x=>x.id===e.target.value);setLiveMatch(m||null);if(m){await loadLive(m.id);setClock(elapsed(m));}}}><option value="">Select fixture</option>{matches.map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {x.status}</option>)}</select></label>{liveMatch&&<><div className="card" style={{marginTop:16,textAlign:"center"}}><p>{liveMatch.home?.name} vs {liveMatch.away?.name}</p><h1>{liveMatch.home_score} - {liveMatch.away_score}</h1><strong style={{fontSize:32}}>{displayClock(clock)}</strong><p>{liveMatch.status.toUpperCase()}</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{liveMatch.status==="scheduled"&&<button className="button primary" onClick={()=>clockAction(liveMatch,"start")}>Start match</button>}{liveMatch.status==="live"&&<><button className="button" onClick={()=>clockAction(liveMatch,"halftime")}>Half-time</button><button className="button" onClick={()=>clockAction(liveMatch,"finish")}>Finish match</button></>}{liveMatch.status==="halftime"&&<button className="button primary" onClick={()=>clockAction(liveMatch,"resume")}>Resume 2nd half</button>}</div></>}</div><div className="panel"><h2>Events</h2>{liveMatch?<div className="form-stack"><select value={eventForm.type} onChange={e=>setEventForm({...eventForm,type:e.target.value})}><option value="goal">Goal</option><option value="yellow_card">Yellow card</option><option value="red_card">Red card</option><option value="substitution">Substitution</option><option value="assist">Assist</option><option value="penalty_missed">Penalty missed</option><option value="own_goal">Own goal</option><option value="var">VAR</option><option value="note">Note</option></select><select value={eventForm.team_id} onChange={e=>setEventForm({...eventForm,team_id:e.target.value})}><option value="">Team</option><option value={liveMatch.home_team_id}>{liveMatch.home?.name}</option><option value={liveMatch.away_team_id}>{liveMatch.away?.name}</option></select><select value={eventForm.player_id} onChange={e=>setEventForm({...eventForm,player_id:e.target.value})}><option value="">Player (optional)</option>{players.filter(p=>p.team_id===eventForm.team_id).map(p=><option key={p.id} value={p.id}>#{p.shirt_number||"—"} · {p.full_name}</option>)}</select>{eventForm.type==="substitution"&&<select value={eventForm.secondary_player_id} onChange={e=>setEventForm({...eventForm,secondary_player_id:e.target.value})}><option value="">Incoming player</option>{players.filter(p=>p.team_id===eventForm.team_id&&p.id!==eventForm.player_id).map(p=><option key={p.id} value={p.id}>#{p.shirt_number||"—"} · {p.full_name}</option>)}</select>}<input type="number" placeholder="Minute" value={eventForm.minute} onChange={e=>setEventForm({...eventForm,minute:e.target.value})}/><input placeholder="Details" value={eventForm.details} onChange={e=>setEventForm({...eventForm,details:e.target.value})}/><button className="button primary" disabled={saving} onClick={addEvent}>Add event</button></div>:<p className="muted">Select a match.</p>}{events.map(x=><div className="status-card" key={x.id}><b>{x.minute||"—"}′ · {x.event_type}</b><span>{x.teams?.name||""} · {x.players?.full_name||""} {x.details||""}</span></div>)}</div><div className="panel"><h2>Live Match Statistics</h2>{!liveMatch?<p className="muted">Select a match to manage statistics.</p>:<div className="form-stack"><div className="status-card"><b>Possession %</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_possession"]??0} onChange={e=>setMatchStats({...matchStats,["home_possession"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_possession"]??0} onChange={e=>setMatchStats({...matchStats,["away_possession"]:e.target.value})}/></label></div></div><div className="status-card"><b>Shots</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_shots"]??0} onChange={e=>setMatchStats({...matchStats,["home_shots"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_shots"]??0} onChange={e=>setMatchStats({...matchStats,["away_shots"]:e.target.value})}/></label></div></div><div className="status-card"><b>Shots on target</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_shots_on_target"]??0} onChange={e=>setMatchStats({...matchStats,["home_shots_on_target"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_shots_on_target"]??0} onChange={e=>setMatchStats({...matchStats,["away_shots_on_target"]:e.target.value})}/></label></div></div><div className="status-card"><b>Corners</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_corners"]??0} onChange={e=>setMatchStats({...matchStats,["home_corners"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_corners"]??0} onChange={e=>setMatchStats({...matchStats,["away_corners"]:e.target.value})}/></label></div></div><div className="status-card"><b>Fouls</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_fouls"]??0} onChange={e=>setMatchStats({...matchStats,["home_fouls"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_fouls"]??0} onChange={e=>setMatchStats({...matchStats,["away_fouls"]:e.target.value})}/></label></div></div><div className="status-card"><b>Offsides</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_offsides"]??0} onChange={e=>setMatchStats({...matchStats,["home_offsides"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_offsides"]??0} onChange={e=>setMatchStats({...matchStats,["away_offsides"]:e.target.value})}/></label></div></div><div className="status-card"><b>Saves</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_saves"]??0} onChange={e=>setMatchStats({...matchStats,["home_saves"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_saves"]??0} onChange={e=>setMatchStats({...matchStats,["away_saves"]:e.target.value})}/></label></div></div><div className="status-card"><b>Passes</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_passes"]??0} onChange={e=>setMatchStats({...matchStats,["home_passes"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_passes"]??0} onChange={e=>setMatchStats({...matchStats,["away_passes"]:e.target.value})}/></label></div></div><div className="status-card"><b>Pass accuracy %</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_pass_accuracy"]??0} onChange={e=>setMatchStats({...matchStats,["home_pass_accuracy"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_pass_accuracy"]??0} onChange={e=>setMatchStats({...matchStats,["away_pass_accuracy"]:e.target.value})}/></label></div></div><div className="status-card"><b>Crosses</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_crosses"]??0} onChange={e=>setMatchStats({...matchStats,["home_crosses"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_crosses"]??0} onChange={e=>setMatchStats({...matchStats,["away_crosses"]:e.target.value})}/></label></div></div><div className="status-card"><b>Free kicks</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_free_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["home_free_kicks"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_free_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["away_free_kicks"]:e.target.value})}/></label></div></div><div className="status-card"><b>Goal kicks</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_goal_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["home_goal_kicks"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_goal_kicks"]??0} onChange={e=>setMatchStats({...matchStats,["away_goal_kicks"]:e.target.value})}/></label></div></div><div className="status-card"><b>Throw-ins</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="1" value={matchStats?.["home_throw_ins"]??0} onChange={e=>setMatchStats({...matchStats,["home_throw_ins"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="1" value={matchStats?.["away_throw_ins"]??0} onChange={e=>setMatchStats({...matchStats,["away_throw_ins"]:e.target.value})}/></label></div></div><div className="status-card"><b>Expected goals (xG)</b><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>{liveMatch.home?.name||"Home"}<input type="number" step="0.1" value={matchStats?.["home_xg"]??0} onChange={e=>setMatchStats({...matchStats,["home_xg"]:e.target.value})}/></label><label>{liveMatch.away?.name||"Away"}<input type="number" step="0.1" value={matchStats?.["away_xg"]??0} onChange={e=>setMatchStats({...matchStats,["away_xg"]:e.target.value})}/></label></div></div><button className="button primary" disabled={saving} onClick={saveStats}>Save match statistics</button></div>}</div></div>}{tab==="lineups"&&<div className="stats-grid">
        <div className="panel">
          <h2>Match Lineups</h2>
          <p className="muted">Lineups open 30 minutes before kickoff and can be submitted before the match starts.</p>
          <label>Match<select value={lineupMatch?.id||""} onChange={async e=>{const m=matches.find(x=>x.id===e.target.value);setLineupMatch(m||null);setLineupTeam("");setLineup(null);setLineupPlayers([]);}}><option value="">Select fixture</option>{matches.filter(lineupEligible).map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {x.status}</option>)}</select></label>
          {lineupMatch&&<div className="form-stack" style={{marginTop:16}}>
            <label>Team<select value={lineupTeam} onChange={async e=>{setLineupTeam(e.target.value);setLineup(null);setLineupPlayers([]);if(e.target.value)await loadLineup(lineupMatch.id,e.target.value);}}><option value="">Select team</option><option value={lineupMatch.home_team_id}>{lineupMatch.home?.name}</option><option value={lineupMatch.away_team_id}>{lineupMatch.away?.name}</option></select></label>
            {lineupTeam&&<><label>Formation<input placeholder="e.g. 4-3-3" value={lineup?.formation||""} onChange={e=>setLineup({...lineup,formation:e.target.value})}/></label>
            <label>Captain<select value={lineup?.captain_player_id||""} onChange={e=>setLineup({...lineup,captain_player_id:e.target.value})}><option value="">Select captain</option>{lineupPlayers.filter(x=>x.role==="starter").map(x=>{const p=players.find(y=>y.id===x.player_id);return <option key={x.player_id} value={x.player_id}>{p?.full_name||x.player_id}</option>})}</select></label>
            <button className="button primary" disabled={saving||lineupLoading} onClick={saveLineup}>Save lineup</button></>}
          </div>}
        </div>
        <div className="panel">
          <h2>Squad Selection</h2>
          {!lineupTeam?<p className="muted">Select a match and team.</p>:<div className="form-stack">
            {players.filter(p=>p.team_id===lineupTeam).map(p=>{const row=lineupPlayers.find(x=>x.player_id===p.id);return <div key={p.id} className="status-card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span><b>{p.full_name}</b><br/>#{p.shirt_number||"—"} · {p.position||"Position not set"}</span><div style={{display:"flex",gap:6}}><button className={"button "+(row?.role==="starter"?"primary":"")} onClick={()=>{if(row?.role==="starter")setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id));else {setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id).concat({player_id:p.id,role:"starter",shirt_number:p.shirt_number||null,position:p.position||null}));}}}>Starter</button><button className={"button "+(row?.role==="substitute"?"primary":"")} onClick={()=>{if(row?.role==="substitute")setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id));else {setLineupPlayers(lineupPlayers.filter(x=>x.player_id!==p.id).concat({player_id:p.id,role:"substitute",shirt_number:p.shirt_number||null,position:p.position||null}));}}}>Sub</button></div></div>})}
            <p className="muted">Starters: {lineupPlayers.filter(x=>x.role==="starter").length}/11 · Substitutes: {lineupPlayers.filter(x=>x.role==="substitute").length}</p>
          </div>}
        </div>
      </div>}
      {tab==="review"&&<div className="stats-grid">
  <div className="panel">
    <h2>Reporter / Match Reports</h2>
    <p className="muted">Create and submit an official report for a completed match.</p>
    <label>Match<select value={reportMatch?.id||""} onChange={e=>{const m=matches.find(x=>x.id===e.target.value);setReportMatch(m||null);setReport(null);}}><option value="">Select finished match</option>{matches.filter(x=>x.status==="finished"||x.status==="verified").map(x=><option key={x.id} value={x.id}>{x.home?.name} {x.home_score} - {x.away_score} {x.away?.name}</option>)}</select></label>
    {reportMatch&&<div className="form-stack" style={{marginTop:16}}>
      <label>Summary<textarea rows="5" value={report?.summary||""} onChange={e=>setReport({...report,summary:e.target.value})}/></label>
      <label>Incidents<textarea rows="7" value={report?.incidents||""} onChange={e=>setReport({...report,incidents:e.target.value})}/></label>
      <button className="button primary" disabled={saving} onClick={saveReport}>Save / Submit Report</button>
      {report?.status&&<p className="muted">Current status: {report.status}</p>}
    </div>}
  </div>
  <div className="panel">
    <h2>Verification Queue</h2>
    <p className="muted">Review what the reporter recorded. The administrator chooses and locks the official outcome. Rescheduling is optional.</p>
    <div className="form-stack">{reports.map(r=>{
      const choice=reviewChoices[r.id]||{};
      const outcome=choice.outcome||r.outcome||"completed";
      const interrupted=["suspended","postponed","abandoned","cancelled"].includes(outcome);
      return <div key={r.id} className="status-card">
        <b>{r.match?.home?.name} {r.match?.home_score} - {r.match?.away_score} {r.match?.away?.name}</b>
        <p className="muted">Report: {r.status} · Reporter outcome: {r.outcome||"not selected"} · Submitted {r.submitted_at?new Date(r.submitted_at).toLocaleString():"Not submitted"}</p>
        <p>{r.summary||"No summary yet."}</p>
        {r.interruption_reason&&<p><b>Reporter reason:</b> {r.interruption_reason}</p>}
        <label>Official outcome<select value={outcome} disabled={saving||r.status==="verified"} onChange={e=>setReviewChoices({...reviewChoices,[r.id]:{...choice,outcome:e.target.value}})}>
          <option value="completed">Completed normally</option><option value="suspended">Suspended — resume later</option><option value="postponed">Postponed</option><option value="abandoned">Abandoned</option><option value="cancelled">Cancelled</option>
        </select></label>
        {interrupted&&<div className="form-stack">
          <label>Official interruption reason<textarea rows="3" disabled={saving||r.status==="verified"} required value={choice.interruption_reason??r.interruption_reason??""} onChange={e=>setReviewChoices({...reviewChoices,[r.id]:{...choice,interruption_reason:e.target.value}})} placeholder="Why was the match suspended, postponed, abandoned or cancelled?"/></label>
          <label>Interruption minute <span className="muted">(optional)</span><input type="number" min="0" step="1" disabled={saving||r.status==="verified"} value={choice.interruption_minute??r.interruption_minute??""} onChange={e=>setReviewChoices({...reviewChoices,[r.id]:{...choice,interruption_minute:e.target.value}})}/></label>
          <label>Confirmed reschedule / restart time <span className="muted">(optional)</span><input type="datetime-local" disabled={saving||r.status==="verified"} value={choice.reschedule_at?new Date(choice.reschedule_at).toISOString().slice(0,16):(r.reschedule_at?new Date(r.reschedule_at).toISOString().slice(0,16):"")} onChange={e=>setReviewChoices({...reviewChoices,[r.id]:{...choice,reschedule_at:e.target.value?new Date(e.target.value).toISOString():null}})}/></label>
          <p className="muted">The administrator's reason is stored with the official match outcome. Rescheduling is optional.</p>
        </div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button" onClick={()=>setReport(r)}>Open</button><button className="button primary" disabled={saving||r.status==="verified"} onClick={()=>verifyReport(r)}>Verify & Lock</button><button className="button" disabled={saving||r.status==="rejected"} onClick={()=>rejectReport(r)}>Reject / Return</button></div>
      </div>;
    })}{!reports.length&&<p className="muted">No reports in the queue.</p>}</div>
  </div></div>}
{tab==="publishing"&&(
  <div className="form-stack">
    <div className="stats-grid">
      <div className="panel">
        <h2>Prematch Summary · Preview Publishing</h2><p className="muted">Create and publish the public match preview without touching live match controls.</p>
        <form className="form-stack" onSubmit={savePreview}>
          <label>Match<select required value={previewForm.match_id} onChange={e=>setPreviewForm({...previewForm,match_id:e.target.value})}><option value="">Select match</option>{matches.map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {fmtDate(x.scheduled_at)}</option>)}</select></label>
          <label>Headline<input value={previewForm.headline} onChange={e=>setPreviewForm({...previewForm,headline:e.target.value})}/></label>
          <label>Summary<textarea rows="5" value={previewForm.summary} onChange={e=>setPreviewForm({...previewForm,summary:e.target.value})}/></label>
          <label>Key storylines<textarea rows="4" value={previewForm.key_storylines} onChange={e=>setPreviewForm({...previewForm,key_storylines:e.target.value})}/></label>
          <label>Form note<textarea rows="3" value={previewForm.form_note} onChange={e=>setPreviewForm({...previewForm,form_note:e.target.value})}/></label>
          <label>H2H note<textarea rows="3" value={previewForm.h2h_note} onChange={e=>setPreviewForm({...previewForm,h2h_note:e.target.value})}/></label>
          <label>Venue note<textarea rows="3" value={previewForm.venue_note} onChange={e=>setPreviewForm({...previewForm,venue_note:e.target.value})}/></label>
          <label>Status<select value={previewForm.status} onChange={e=>setPreviewForm({...previewForm,status:e.target.value})}><option value="draft">Draft</option><option value="published">Publish now</option><option value="archived">Archive</option></select></label>
          <button className="button primary" disabled={saving}>Save preview</button>
        </form>
      </div>
      <div className="panel"><h2>Published Previews</h2><div className="form-stack">{previewRows.map(x=>{const m=matches.find(r=>r.id===x.match_id);return <div className="status-card" key={x.id}><b>{x.headline||"Match preview"}</b><span>{m?.home?.name||"Home"} vs {m?.away?.name||"Away"} · {x.status}</span><p>{x.summary||"No summary yet."}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{x.status!=="published"&&<button className="button primary" onClick={()=>publishPreview(x.id,"published")}>Publish</button>}{x.status==="published"&&<button className="button" onClick={()=>publishPreview(x.id,"draft")}>Unpublish</button>}</div></div>})}{!previewRows.length&&<p className="muted">No match previews yet.</p>}</div></div>
    </div>
    <div className="stats-grid">
      <div className="panel"><h2>Match Channels</h2><p className="muted">Publish where fans can follow the match: live stream, TV, radio or social.</p>
        <form className="form-stack" onSubmit={saveChannel}>
          <label>Match<select required value={channelForm.match_id} onChange={e=>setChannelForm({...channelForm,match_id:e.target.value})}><option value="">Select match</option>{matches.map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {fmtDate(x.scheduled_at)}</option>)}</select></label>
          <label>Channel type<select value={channelForm.channel_type} onChange={e=>setChannelForm({...channelForm,channel_type:e.target.value})}><option value="live_stream">Live stream</option><option value="tv">TV</option><option value="radio">Radio</option><option value="social">Social</option></select></label>
          <label>Channel name<input required value={channelForm.name} onChange={e=>setChannelForm({...channelForm,name:e.target.value})}/></label>
          <label>Provider<input value={channelForm.provider} onChange={e=>setChannelForm({...channelForm,provider:e.target.value})}/></label>
          <label>URL<input type="url" value={channelForm.url} onChange={e=>setChannelForm({...channelForm,url:e.target.value})}/></label>
          <label>Starts<input type="datetime-local" value={channelForm.starts_at} onChange={e=>setChannelForm({...channelForm,starts_at:e.target.value})}/></label>
          <label>Ends<input type="datetime-local" value={channelForm.ends_at} onChange={e=>setChannelForm({...channelForm,ends_at:e.target.value})}/></label>
          <label><input type="checkbox" checked={channelForm.is_primary} onChange={e=>setChannelForm({...channelForm,is_primary:e.target.checked})}/> Primary channel</label>
          <label><input type="checkbox" checked={channelForm.active} onChange={e=>setChannelForm({...channelForm,active:e.target.checked})}/> Published / active</label>
          <button className="button primary" disabled={saving}>Publish channel</button>
        </form>
      </div>
      <div className="panel"><h2>Published Channels</h2><div className="form-stack">{channelRows.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.channel_type} · {x.matches?.home?.name||"Home"} vs {x.matches?.away?.name||"Away"} · {x.active?"ACTIVE":"OFF"}</span>{x.url&&<a className="button" href={x.url} target="_blank" rel="noreferrer">Open channel</a>}<button className="button" onClick={()=>toggleChannel(x)}>{x.active?"Disable":"Enable"}</button></div>)}{!channelRows.length&&<p className="muted">No channels published yet.</p>}</div></div>
    </div>
  </div>
)}
{tab==="community"&&(
  <div className="form-stack">
    <div className="stats-grid">
      <div className="panel">
        <h2>Football News & Community Updates</h2>
        <form className="form-stack" onSubmit={saveContent}>
          <label>Type<select value={contentForm.content_type} onChange={e=>setContentForm({...contentForm,content_type:e.target.value})}><option value="news">Football News</option><option value="community_update">Community Update</option></select></label>
          <label>Status<select value={contentForm.status} onChange={e=>setContentForm({...contentForm,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <label>Title<input required value={contentForm.title} onChange={e=>setContentForm({...contentForm,title:e.target.value})}/></label>
          <label>Slug<input value={contentForm.slug} onChange={e=>setContentForm({...contentForm,slug:e.target.value})}/></label>
          <label>Category<input value={contentForm.category} onChange={e=>setContentForm({...contentForm,category:e.target.value})}/></label>
          <label>Excerpt<textarea rows="3" value={contentForm.excerpt} onChange={e=>setContentForm({...contentForm,excerpt:e.target.value})}/></label>
          <label>Story / update body<textarea required rows="8" value={contentForm.body} onChange={e=>setContentForm({...contentForm,body:e.target.value})}/></label>
          <label>Cover image URL<input value={contentForm.cover_image_url} onChange={e=>setContentForm({...contentForm,cover_image_url:e.target.value})}/></label>
          <label><input type="checkbox" checked={contentForm.featured} onChange={e=>setContentForm({...contentForm,featured:e.target.checked})}/> Featured</label>
          <button className="button primary" disabled={saving}>{editingContentId?"Update content":"Save content"}</button>
        </form>
      </div>
      <div className="panel">
        <h2>Published & Draft Content</h2>
        <div className="form-stack">
          {contentPosts.map(x=>(
            <div className="status-card" key={x.id}>
              <b>{x.title}</b>
              <span>{x.content_type} · {x.status}</span>
              <p>{x.excerpt||x.body?.slice(0,180)||""}</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button className="button" onClick={()=>{setEditingContentId(x.id);setContentForm({content_type:x.content_type||"news",title:x.title||"",slug:x.slug||"",excerpt:x.excerpt||"",body:x.body||"",category:x.category||"",status:x.status||"draft",featured:!!x.featured,cover_image_url:x.cover_image_url||""});}}>Edit</button>
                {x.status!=="published"&&<button className="button primary" onClick={()=>moderateContent(x.id,"published")}>Publish</button>}
                {x.status!=="archived"&&<button className="button danger" onClick={()=>moderateContent(x.id,"archived")}>Archive</button>}
              </div>
            </div>
          ))}
          {!contentPosts.length&&<p className="muted">No content yet.</p>}
        </div>
      </div>
    </div>

    <div className="stats-grid">
      <div className="panel">
        <h2>Community Feedback</h2>
        <label>Queue<select value={feedbackFilter} onChange={e=>setFeedbackFilter(e.target.value)}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
        <div className="form-stack" style={{marginTop:12}}>
          {feedbackRows.filter(x=>x.status===feedbackFilter).map(x=>(
            <div className="status-card" key={x.id}>
              <b>{x.subject||"Feedback"}</b><span>{x.category} · {x.rating?x.rating+"/5":"No rating"}</span><p>{x.message}</p>
              <label>Admin note<textarea rows="2" value={x.admin_note||""} onChange={e=>setFeedbackRows(feedbackRows.map(r=>r.id===x.id?{...r,admin_note:e.target.value}:r))}/></label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="button" onClick={()=>saveFeedbackNote(x,x.admin_note||"")}>Save note</button><button className="button" onClick={()=>updateFeedback(x,"reviewing")}>Review</button><button className="button primary" onClick={()=>updateFeedback(x,"resolved")}>Resolve</button><button className="button danger" onClick={()=>updateFeedback(x,"closed")}>Close</button></div>
            </div>
          ))}
          {!feedbackRows.filter(x=>x.status===feedbackFilter).length&&<p className="muted">No feedback in this queue.</p>}
        </div>
      </div>
      <div className="panel">
        <h2>Survey Manager</h2>
        <form className="form-stack" onSubmit={saveSurvey}>
          <label>Title<input required value={surveyForm.title} onChange={e=>setSurveyForm({...surveyForm,title:e.target.value})}/></label>
          <label>Description<textarea rows="3" value={surveyForm.description} onChange={e=>setSurveyForm({...surveyForm,description:e.target.value})}/></label>
          <label>Status<select value={surveyForm.status} onChange={e=>setSurveyForm({...surveyForm,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
          <label>Starts<input type="datetime-local" value={surveyForm.starts_at} onChange={e=>setSurveyForm({...surveyForm,starts_at:e.target.value})}/></label><label>Ends<input type="datetime-local" value={surveyForm.ends_at} onChange={e=>setSurveyForm({...surveyForm,ends_at:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>{editingSurveyId?"Update survey":"Create survey"}</button>
        </form>
        <div className="form-stack" style={{marginTop:12}}>
          {surveys.map(x=>(
            <div className="status-card" key={x.id}>
              <b>{x.title}</b><span>{x.status} · {surveyQuestions.filter(q=>q.survey_id===x.id).length} questions · {surveyResponses.filter(r=>r.survey_id===x.id).length} responses</span>
              {x.status==="published"&&<button className="button danger" onClick={()=>closeSurvey(x.id)}>Close survey</button>}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="panel">
      <h2>Survey Questions</h2>
      <form className="form-stack" onSubmit={saveQuestion}>
        <label>Survey<select required value={questionForm.survey_id} onChange={e=>setQuestionForm({...questionForm,survey_id:e.target.value})}><option value="">Select survey</option>{surveys.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
        <label>Question<input required value={questionForm.prompt} onChange={e=>setQuestionForm({...questionForm,prompt:e.target.value})}/></label>
        <label>Type<select value={questionForm.question_type} onChange={e=>setQuestionForm({...questionForm,question_type:e.target.value})}><option value="text">Text</option><option value="rating">Rating</option><option value="single">Single choice</option><option value="multi">Multiple choice</option></select></label>
        <label>Options<input value={questionForm.options} onChange={e=>setQuestionForm({...questionForm,options:e.target.value})}/></label>
        <button className="button primary" disabled={saving}>Add question</button>
      </form>
      <div className="form-stack" style={{marginTop:12}}>
        {surveyQuestions.map(q=><div className="status-card" key={q.id}><b>{q.prompt}</b><span>{q.question_type==="single"?"Single choice":q.question_type==="multi"?"Multiple choice":q.question_type} · {q.required?"Required":"Optional"}{q.options?.length?" · "+q.options.join(", "):""}</span></div>)}
      </div>
    </div>

    <div className="panel">
      <h2>Survey Responses</h2>
      {surveys.map(s=>{const rows=surveyResponses.filter(r=>r.survey_id===s.id);return <div className="panel" key={s.id}><h3>{s.title} · {rows.length} responses</h3>{rows.length?rows.slice(0,50).map(r=><div className="status-card" key={r.id}><b>Submitted {fmtDate(r.submitted_at)}</b><pre style={{whiteSpace:"pre-wrap",margin:0,fontFamily:"inherit"}}>{JSON.stringify(r.answers,null,2)}</pre></div>):<p className="muted">No responses yet.</p>}</div>})}
    </div>
    <div className="panel">
      <h2>Sponsors & Monetization</h2>
      <div className="stats-grid">
        <form className="form-stack" onSubmit={saveSponsor}>
          <h3>{editingSponsorId?"Edit sponsor":"Sponsor"}</h3>
          <label>Name<input required value={sponsorForm.name} onChange={e=>setSponsorForm({...sponsorForm,name:e.target.value})}/></label>
          <label>Logo URL<input value={sponsorForm.logo_url} onChange={e=>setSponsorForm({...sponsorForm,logo_url:e.target.value})}/></label>
          <label>Website<input value={sponsorForm.website_url} onChange={e=>setSponsorForm({...sponsorForm,website_url:e.target.value})}/></label>
          <label>Contact name<input value={sponsorForm.contact_name} onChange={e=>setSponsorForm({...sponsorForm,contact_name:e.target.value})}/></label>
          <label>Contact email<input type="email" value={sponsorForm.contact_email} onChange={e=>setSponsorForm({...sponsorForm,contact_email:e.target.value})}/></label>
          <label>Contact phone<input value={sponsorForm.contact_phone} onChange={e=>setSponsorForm({...sponsorForm,contact_phone:e.target.value})}/></label>
          <label>Tier<select value={sponsorForm.tier} onChange={e=>setSponsorForm({...sponsorForm,tier:e.target.value})}><option value="community">Community</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="title">Title</option></select></label>
          <label>Status<select value={sponsorForm.status} onChange={e=>setSponsorForm({...sponsorForm,status:e.target.value})}><option value="prospect">Prospect</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></label>
          <label>Start date<input type="date" value={sponsorForm.start_date} onChange={e=>setSponsorForm({...sponsorForm,start_date:e.target.value})}/></label><label>End date<input type="date" value={sponsorForm.end_date} onChange={e=>setSponsorForm({...sponsorForm,end_date:e.target.value})}/></label><label>Notes<textarea rows="2" value={sponsorForm.notes} onChange={e=>setSponsorForm({...sponsorForm,notes:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>{editingSponsorId?"Update sponsor":"Add sponsor"}</button>
        </form>
        <div className="panel">
          <h3>Active Sponsors</h3>
          {sponsors.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.tier} · {x.status} · {x.contact_name||"No contact"}</span><button className="button" onClick={()=>editSponsor(x)}>Edit</button></div>)}
          {!sponsors.length&&<p className="muted">No sponsors yet.</p>}
        </div>
      </div>
      <div className="stats-grid" style={{marginTop:16}}>
        <form className="form-stack" onSubmit={saveDeal}>
          <h3>Sponsorship Deal</h3>
          <label>Sponsor<select required value={dealForm.sponsor_id} onChange={e=>setDealForm({...dealForm,sponsor_id:e.target.value})}><option value="">Select sponsor</option>{sponsors.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Deal name<input required value={dealForm.deal_name} onChange={e=>setDealForm({...dealForm,deal_name:e.target.value})}/></label>
          <label>Amount<input required type="number" step="0.01" value={dealForm.amount} onChange={e=>setDealForm({...dealForm,amount:e.target.value})}/></label><label>Currency<input value={dealForm.currency} onChange={e=>setDealForm({...dealForm,currency:e.target.value.toUpperCase()})}/></label><label>Status<select value={dealForm.status} onChange={e=>setDealForm({...dealForm,status:e.target.value})}><option value="proposed">Proposed</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label>Start<input type="date" value={dealForm.start_date} onChange={e=>setDealForm({...dealForm,start_date:e.target.value})}/></label><label>End<input type="date" value={dealForm.end_date} onChange={e=>setDealForm({...dealForm,end_date:e.target.value})}/></label><label>Placement<input value={dealForm.placement} onChange={e=>setDealForm({...dealForm,placement:e.target.value})}/></label><label>Notes<textarea value={dealForm.notes} onChange={e=>setDealForm({...dealForm,notes:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>{editingDealId?"Update deal":"Save deal"}</button>
        </form>
        <form className="form-stack" onSubmit={saveTransaction}>
          <h3>Revenue Ledger</h3>
          <label>Sponsor<select value={transactionForm.sponsor_id} onChange={e=>setTransactionForm({...transactionForm,sponsor_id:e.target.value})}><option value="">No sponsor</option>{sponsors.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Deal<select value={transactionForm.deal_id} onChange={e=>setTransactionForm({...transactionForm,deal_id:e.target.value})}><option value="">No deal</option>{deals.map(x=><option key={x.id} value={x.id}>{x.deal_name}</option>)}</select></label>
          <label>Type<select value={transactionForm.transaction_type} onChange={e=>setTransactionForm({...transactionForm,transaction_type:e.target.value})}><option value="payment">Payment</option><option value="invoice">Invoice</option><option value="refund">Refund</option><option value="adjustment">Adjustment</option></select></label>
          <label>Amount<input required type="number" step="0.01" value={transactionForm.amount} onChange={e=>setTransactionForm({...transactionForm,amount:e.target.value})}/></label>
          <label>Status<select value={transactionForm.status} onChange={e=>setTransactionForm({...transactionForm,status:e.target.value})}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></label><label>Date<input type="date" value={transactionForm.transaction_date} onChange={e=>setTransactionForm({...transactionForm,transaction_date:e.target.value})}/></label><label>Reference<input value={transactionForm.reference} onChange={e=>setTransactionForm({...transactionForm,reference:e.target.value})}/></label><label>Notes<textarea value={transactionForm.notes} onChange={e=>setTransactionForm({...transactionForm,notes:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>Record transaction</button>
        </form>
      </div>
    </div>

    <div className="panel">
      <h2>Ad Slot Manager</h2><form className="form-stack" onSubmit={saveAd}><label>Name<input required value={adForm.name} onChange={e=>setAdForm({...adForm,name:e.target.value})}/></label><label>Placement<input required value={adForm.placement} onChange={e=>setAdForm({...adForm,placement:e.target.value})}/></label><label>Format<select value={adForm.format} onChange={e=>setAdForm({...adForm,format:e.target.value})}><option value="banner">Banner</option><option value="card">Card</option><option value="logo">Logo</option><option value="native">Native</option></select></label><label>Sponsor<select value={adForm.sponsor_id} onChange={e=>setAdForm({...adForm,sponsor_id:e.target.value})}><option value="">No sponsor</option>{sponsors.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Image URL<input value={adForm.image_url} onChange={e=>setAdForm({...adForm,image_url:e.target.value})}/></label><label>Target URL<input value={adForm.target_url} onChange={e=>setAdForm({...adForm,target_url:e.target.value})}/></label><label>Start<input type="date" value={adForm.start_date} onChange={e=>setAdForm({...adForm,start_date:e.target.value})}/></label><label>End<input type="date" value={adForm.end_date} onChange={e=>setAdForm({...adForm,end_date:e.target.value})}/></label><label><input type="checkbox" checked={adForm.active} onChange={e=>setAdForm({...adForm,active:e.target.checked})}/> Active</label><button className="button primary" disabled={saving}>{editingAdId?"Update ad slot":"Create ad slot"}</button></form><div className="form-stack">{ads.map(x=><div className="status-card" key={x.id}><b>{x.name}</b><span>{x.placement} · {x.format} · {x.sponsors?.name||"No sponsor"} · {x.active?"ACTIVE":"inactive"}</span><button className="button" onClick={()=>{setEditingAdId(x.id);setAdForm({name:x.name||"",placement:x.placement||"homepage",format:x.format||"banner",sponsor_id:x.sponsor_id||"",image_url:x.image_url||"",target_url:x.target_url||"",active:!!x.active,start_date:x.start_date||"",end_date:x.end_date||""});}}>Edit</button></div>)}</div>
    </div>
    <div className="panel">
      <h2>Live Streaming Ads · Monetization</h2><p className="muted">Attach monetized ad inventory to a specific live-stream match and control placement.</p>
      <form className="form-stack" onSubmit={attachStreamAd}>
        <label>Match<select name="match_id" required><option value="">Select match</option>{matches.map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"} · {fmtDate(x.scheduled_at)}</option>)}</select></label>
        <label>Ad slot<select name="ad_slot_id" required><option value="">Select ad slot</option>{ads.map(x=><option key={x.id} value={x.id}>{x.name} · {x.sponsors?.name||"No sponsor"} · {x.placement}</option>)}</select></label>
        <label>Position<select name="position"><option value="pre_roll">Pre-roll</option><option value="mid_roll">Mid-roll</option><option value="post_roll">Post-roll</option><option value="overlay">Overlay</option></select></label>
        <label>Starts<input type="datetime-local" name="starts_at"/></label>
        <label>Ends<input type="datetime-local" name="ends_at"/></label>
        <label>Priority<input type="number" name="priority" min="1" step="1" defaultValue="1"/></label>
        <button className="button primary" disabled={saving}>Attach ad to live stream</button>
      </form>
      <div className="form-stack" style={{marginTop:12}}>{streamAds.map(x=><div className="status-card" key={x.id}><b>{x.ad_slots?.name||"Ad"}</b><span>{x.matches?.home?.name||"Home"} vs {x.matches?.away?.name||"Away"} · {x.position} · {x.active?"ACTIVE":"OFF"} · {x.ad_slots?.sponsors?.name||"No sponsor"}</span><button className="button" onClick={()=>toggleStreamAd(x)}>{x.active?"Disable":"Enable"}</button></div>)}{!streamAds.length&&<p className="muted">No live-stream ads attached yet.</p>}</div>
    </div>
    <div className="panel">
      <h2>Notification Centre</h2>
      <form className="form-stack" onSubmit={sendBroadcastNotification}>
        <label>Type<select value={notificationForm.notification_type} onChange={e=>setNotificationForm({...notificationForm,notification_type:e.target.value})}><option value="news">News</option><option value="community">Community update</option><option value="announcement">Announcement</option><option value="sponsor">Sponsor</option></select></label>
        <label>Title<input required value={notificationForm.title} onChange={e=>setNotificationForm({...notificationForm,title:e.target.value})}/></label>
        <label>Message<textarea required rows="5" value={notificationForm.body} onChange={e=>setNotificationForm({...notificationForm,body:e.target.value})}/></label>
        <label>Team<select value={notificationForm.team_id} onChange={e=>setNotificationForm({...notificationForm,team_id:e.target.value})}><option value="">All teams</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Match<select value={notificationForm.match_id} onChange={e=>setNotificationForm({...notificationForm,match_id:e.target.value})}><option value="">No match link</option>{matches.slice(0,50).map(x=><option key={x.id} value={x.id}>{x.home?.name||"Home"} vs {x.away?.name||"Away"}</option>)}</select></label>
        <button className="button primary" disabled={notificationSaving}>{notificationSaving?"Broadcasting…":"Broadcast notification"}</button>
      </form>
    </div>
  </div>
)}
{tab==="teams"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={saveTeam}>
          <h2>{editingTeamId?"Edit team":"Team registry"}</h2><label>Team name<input required value={team.name} onChange={e=>setTeam({...team,name:e.target.value})}/></label><label>Short name<input value={team.short_name} onChange={e=>setTeam({...team,short_name:e.target.value})}/></label><label>Area<input value={team.area} onChange={e=>setTeam({...team,area:e.target.value})}/></label><label>Home venue<input value={team.home_venue} onChange={e=>setTeam({...team,home_venue:e.target.value})}/></label>{!editingTeamId&&<RegistrationConsent kind="team" confirmed={team.consent_confirmed} setConfirmed={v=>setTeam({...team,consent_confirmed:v})} authorityType="team_authorized_representative" setAuthorityType={()=>{}} holderName={team.holder_name} setHolderName={v=>setTeam({...team,holder_name:v})} guardianName="" setGuardianName={()=>{}} guardianContact="" setGuardianContact={()=>{}}/>}<label>Team logo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setTeam({...team,image:e.target.files?.[0]||null})}/></label>{team.image&&<span className="muted">Selected: {team.image.name}</span>}<button className="button primary" disabled={saving}>{saving?"Saving…":editingTeamId?"Save team changes":"Register team"}</button><button type="button" className="button" disabled={saving} onClick={()=>{setEditingTeamId("");setTeam({id:"",name:"",short_name:"",area:"",home_venue:"",image:null,consent_confirmed:false,holder_name:""});}}>Cancel</button>
        </form>
        <div className="panel"><h2>Registered teams</h2>{teams.map(x=><div className="status-card" key={x.id} style={{display:"flex",alignItems:"center",gap:12}}>{x.logo_url?<img src={x.logo_url} alt="" style={{width:48,height:48,borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:48,height:48,borderRadius:"50%",border:"1px solid #ddd",display:"grid",placeItems:"center"}}>⚽</div>}<div style={{flex:1}}><b>{x.name}</b><span>{x.short_name||"—"} · {x.area||"Oti"} · {x.home_venue||"Venue not set"}</span></div><button className="button" onClick={()=>editTeam(x)}>Edit</button><button className="button danger" disabled={saving} onClick={()=>deleteTeam(x)}>Delete</button></div>)}{!teams.length&&<p className="muted">No teams yet.</p>}</div>
      </div>}


      {tab==="coaches"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={saveCoach}>
          <h2>Coach registry</h2>
          <label>Team<select value={coach.team_id} onChange={e=>setCoach({...coach,team_id:e.target.value})}><option value="">No team assignment</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Full name<input required value={coach.full_name} onChange={e=>setCoach({...coach,full_name:e.target.value})}/></label>
          <label>Role<select value={coach.role} onChange={e=>setCoach({...coach,role:e.target.value})}><option>Head Coach</option><option>Assistant Coach</option><option>Goalkeeping Coach</option><option>Fitness Coach</option><option>Team Manager</option></select></label>
          <label>Date of birth<input type="date" value={coach.date_of_birth} onChange={e=>setCoach({...coach,date_of_birth:e.target.value})}/></label>
          <label>Nationality<input value={coach.nationality} onChange={e=>setCoach({...coach,nationality:e.target.value})}/></label>
          <RegistrationConsent kind="coach" confirmed={coach.consent_confirmed} setConfirmed={v=>setCoach({...coach,consent_confirmed:v})} authorityType={coach.authority_type} setAuthorityType={v=>setCoach({...coach,authority_type:v})} holderName={coach.holder_name} setHolderName={v=>setCoach({...coach,holder_name:v})} guardianName={coach.guardian_name} setGuardianName={v=>setCoach({...coach,guardian_name:v})} guardianContact={coach.guardian_contact} setGuardianContact={v=>setCoach({...coach,guardian_contact:v})}/><label>Coach photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setCoach({...coach,image:e.target.files?.[0]||null})}/></label>
          {coach.image&&<span className="muted">Selected: {coach.image.name}</span>}
          <button className="button primary" disabled={saving}>{saving?"Saving…":"Register coach"}</button>
        </form>
        <div className="panel"><h2>Registered coaches</h2>
          {coaches.map(x=>{const current=(x.team_coaches||[]).find(t=>t.is_current);return <div className="status-card" key={x.id} style={{display:"flex",alignItems:"center",gap:12}}>
            {x.photo_url?<img src={x.photo_url} alt="" style={{width:48,height:48,borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:48,height:48,borderRadius:"50%",border:"1px solid #ddd",display:"grid",placeItems:"center"}}>🧑‍🏫</div>}
            <div><b>{x.full_name}</b><span>{x.role} · {current?.teams?.name||"Unassigned"} · {x.is_active?"ACTIVE":"inactive"}</span></div>
          </div>})}
          {!coaches.length&&<p className="muted">No coaches yet.</p>}
        </div>
      </div>}

      {tab==="officials"&&<div className="stats-grid">
        <div className="panel">
          <h2>Official account activation</h2>
          <p className="muted">A person first creates a normal Zedek Sports account. An administrator then promotes that account to <b>Team Official</b>. This prevents anyone from self-declaring an official role.</p>
          <a className="button" href="https://zedek-sports-score.vercel.app/signup" target="_blank" rel="noreferrer">Open official account signup</a>
          {candidateProfiles.length?candidateProfiles.slice(0,20).map(x=><div className="status-card" key={x.id} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}><b>{x.full_name||"Unnamed account"}</b><span>{x.phone||"No phone"} · Public account</span></div>
            <button className="button primary" disabled={saving} onClick={()=>promoteOfficial(x)}>Activate official</button>
          </div>):<p className="muted">No unactivated public accounts waiting for official access.</p>}
          <p className="muted" style={{marginTop:14}}>After activation, assign the official to a team. The same account is then used to access the official portal.</p>
        </div>
        <form className="panel form-stack" onSubmit={saveOfficial}>
          <h2>Team Official Assignment</h2>
          <p className="muted">Connect an active Team Official account to a local team. Assignment controls what the official can manage.</p>
          <label>Team<select required value={officialForm.team_id} onChange={e=>setOfficialForm({...officialForm,team_id:e.target.value})}><option value="">Select team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Official account<select required value={officialForm.user_id} onChange={e=>setOfficialForm({...officialForm,user_id:e.target.value})}><option value="">Select official</option>{officialProfiles.map(x=><option key={x.id} value={x.id}>{x.full_name||"Unnamed official"}{x.phone?" · "+x.phone:""}</option>)}</select></label>
          <label>Role<select value={officialForm.role} onChange={e=>setOfficialForm({...officialForm,role:e.target.value})}><option>Team Official</option><option>Club Secretary</option><option>Team Manager</option><option>Media Officer</option><option>Welfare Officer</option><option>Technical Official</option></select></label>
          <label>Start date<input type="date" value={officialForm.start_date} onChange={e=>setOfficialForm({...officialForm,start_date:e.target.value})}/></label>
          <label>End date<input type="date" value={officialForm.end_date} onChange={e=>setOfficialForm({...officialForm,end_date:e.target.value})}/></label>
          <button className="button primary" disabled={saving}>{saving?"Saving…":"Assign official"}</button>
        </form>
        <div className="panel"><h2>Current Assignments</h2>
          {teamOfficials.filter(x=>x.is_current).map(x=><div className="status-card" key={x.id}><b>{x.profiles?.full_name||"Team official"}</b><span>{x.teams?.name||"Team"} · {x.role} · {x.start_date||"Start date not set"}</span><button className="button danger" disabled={saving} onClick={()=>deactivateOfficial(x)}>End assignment</button></div>)}
          {!teamOfficials.filter(x=>x.is_current).length&&<p className="muted">No current team-official assignments.</p>}
          <h3 style={{marginTop:18}}>Assignment History</h3>
          {teamOfficials.filter(x=>!x.is_current).slice(0,20).map(x=><div className="status-card" key={"history-"+x.id}><b>{x.profiles?.full_name||"Team official"}</b><span>{x.teams?.name||"Team"} · {x.role} · ended {x.end_date||"—"}</span></div>)}
        </div>
      </div>}

      {tab==="players"&&<div className="stats-grid">
        <form className="panel form-stack" onSubmit={savePlayer}>
          <h2>{editingPlayerId?"Edit player":"Player registry"}</h2><label>Team<select required value={player.team_id} onChange={e=>setPlayer({...player,team_id:e.target.value})}><option value="">Select team</option>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Full name<input required value={player.full_name} onChange={e=>setPlayer({...player,full_name:e.target.value})}/></label><label>Shirt number<input type="number" value={player.shirt_number} onChange={e=>setPlayer({...player,shirt_number:e.target.value})}/></label><label>Position<input value={player.position} onChange={e=>setPlayer({...player,position:e.target.value})}/></label>{!editingPlayerId&&<RegistrationConsent kind="player" confirmed={player.consent_confirmed} setConfirmed={v=>setPlayer({...player,consent_confirmed:v})} authorityType={player.authority_type} setAuthorityType={v=>setPlayer({...player,authority_type:v})} holderName={player.holder_name} setHolderName={v=>setPlayer({...player,holder_name:v})} guardianName={player.guardian_name} setGuardianName={v=>setPlayer({...player,guardian_name:v})} guardianContact={player.guardian_contact} setGuardianContact={v=>setPlayer({...player,guardian_contact:v})}/>}<label>Player photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setPlayer({...player,image:e.target.files?.[0]||null})}/></label>{player.image&&<span className="muted">Selected: {player.image.name}</span>}<button className="button primary" disabled={saving}>{saving?"Saving…":editingPlayerId?"Save player changes":"Register player"}</button><button type="button" className="button" disabled={saving} onClick={()=>{setEditingPlayerId("");setPlayer({id:"",team_id:"",full_name:"",shirt_number:"",position:"",image:null,consent_confirmed:false,authority_type:"self",holder_name:"",guardian_name:"",guardian_contact:""});}}>Cancel</button>
        </form>
        <div className="panel"><h2>Registered players</h2>{players.map(x=><div className="status-card" key={x.id} style={{display:"flex",alignItems:"center",gap:12}}>{x.photo_url?<img src={x.photo_url} alt="" style={{width:48,height:48,borderRadius:"50%",objectFit:"cover"}}/>:<div style={{width:48,height:48,borderRadius:"50%",border:"1px solid #ddd",display:"grid",placeItems:"center"}}>👤</div>}<div style={{flex:1}}><b>{x.full_name}</b><span>{x.teams?.name||"Team"} · #{x.shirt_number||"—"} · {x.position||"Position not set"}</span></div><button className="button" onClick={()=>editPlayer(x)}>Edit</button><button className="button danger" disabled={saving} onClick={()=>deletePlayer(x)}>Delete</button></div>)}{!players.length&&<p className="muted">No players yet.</p>}</div>
      </div>}
    </section>
  </main>;
}