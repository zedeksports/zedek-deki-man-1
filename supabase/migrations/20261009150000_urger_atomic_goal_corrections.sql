-- URGER: keep goal event + score changes in one transaction.
create or replace function public.record_match_goal(
 p_match_id uuid,p_team_id uuid,p_player_id uuid,p_secondary_player_id uuid,
 p_event_type text,p_minute integer,p_extra_minute integer default null,p_details text default null
) returns table(event_id uuid,home_score integer,away_score integer)
language plpgsql security invoker set search_path=public,pg_temp as $$
declare m public.matches%rowtype; eid uuid; scoring_team uuid; hs integer; ascore integer;
begin
 if p_event_type is null or p_event_type not in ('goal','own_goal') then raise exception 'Invalid goal event type'; end if;
 select * into m from public.matches where id=p_match_id for update;
 if not found then raise exception 'Match unavailable or score update not permitted'; end if;
 if m.status not in ('live','halftime') then raise exception 'Goals can only be recorded while a match is live or at halftime'; end if;
 if p_team_id is null or p_team_id not in (m.home_team_id,m.away_team_id) then raise exception 'Event team is not in this match'; end if;
 if p_player_id is not null and not exists(select 1 from public.players where id=p_player_id and team_id=p_team_id) then raise exception 'Goal scorer must belong to the selected team'; end if;
 if p_secondary_player_id is not null and (p_secondary_player_id=p_player_id or not exists(select 1 from public.players where id=p_secondary_player_id and team_id=p_team_id)) then raise exception 'Assist player must be a different player from the same team'; end if;
 insert into public.match_events(match_id,team_id,player_id,secondary_player_id,event_type,minute,extra_minute,details)
 values(p_match_id,p_team_id,p_player_id,p_secondary_player_id,p_event_type,greatest(0,coalesce(p_minute,0)),case when p_extra_minute is null then null else greatest(0,p_extra_minute) end,p_details) returning id into eid;
 scoring_team:=case when p_event_type='own_goal' and p_team_id=m.home_team_id then m.away_team_id when p_event_type='own_goal' then m.home_team_id else p_team_id end;
 if scoring_team=m.home_team_id then update public.matches set home_score=coalesce(home_score,0)+1 where id=p_match_id returning home_score,away_score into hs,ascore;
 else update public.matches set away_score=coalesce(away_score,0)+1 where id=p_match_id returning home_score,away_score into hs,ascore; end if;
 if not found then raise exception 'Score update denied; goal was not committed'; end if;
 return query select eid,hs,ascore;
end $$;

create or replace function public.correct_match_goal(p_event_id uuid,p_reason text)
returns table(event_id uuid,match_id uuid,home_score integer,away_score integer)
language plpgsql security invoker set search_path=public,pg_temp as $$
declare e public.match_events%rowtype; m public.matches%rowtype; scorer text; credited uuid; hs integer; ascore integer;
begin
 if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Correction reason required'; end if;
 select * into e from public.match_events where id=p_event_id for update;
 if not found or e.event_type not in ('goal','own_goal') then raise exception 'Goal not found or already corrected'; end if;
 select * into m from public.matches where id=e.match_id for update;
 if not found then raise exception 'Match unavailable or update not permitted'; end if;
 if m.status not in ('live','halftime','finished') then raise exception 'Goals can only be corrected for live, halftime, or finished matches'; end if;
 if e.team_id is null or e.team_id not in (m.home_team_id,m.away_team_id) then raise exception 'Goal event team is not part of this match'; end if;
 if m.status='verified' or exists(select 1 from public.match_verifications v where v.match_id=e.match_id and v.official_result is true) then raise exception 'This match has an official verified result. An administrator must reopen the result before correcting the goal.'; end if;
 select full_name into scorer from public.players where id=e.player_id;
 credited:=case when e.event_type='own_goal' and e.team_id=m.home_team_id then m.away_team_id when e.event_type='own_goal' then m.home_team_id else e.team_id end;
 update public.match_events set event_type='goal_disallowed',details=concat_ws(' · ','GOAL DISALLOWED — '||trim(p_reason),'Original event: '||e.event_type||coalesce(' by '||scorer,''),nullif(e.details,'')) where id=e.id;
 if not found then raise exception 'Goal correction is not permitted'; end if;
 if credited=m.home_team_id then update public.matches set home_score=coalesce(home_score,0)-1 where id=m.id and coalesce(home_score,0)>0 returning home_score,away_score into hs,ascore;
 else update public.matches set away_score=coalesce(away_score,0)-1 where id=m.id and coalesce(away_score,0)>0 returning home_score,away_score into hs,ascore; end if;
 if not found then raise exception 'Score is already zero or update not permitted; correction rolled back'; end if;
 return query select e.id,m.id,hs,ascore;
end $$;
revoke all on function public.record_match_goal(uuid,uuid,uuid,uuid,text,integer,integer,text) from public,anon;
revoke all on function public.correct_match_goal(uuid,text) from public,anon;
grant execute on function public.record_match_goal(uuid,uuid,uuid,uuid,text,integer,integer,text) to authenticated;
grant execute on function public.correct_match_goal(uuid,text) to authenticated;


-- Notify followers when an existing goal is disallowed. This is deliberately
-- separate from the INSERT notification trigger, so it cannot emit a second
-- ordinary "goal" notification for the same event.
create or replace function public.notify_match_goal_correction()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare home_name text; away_name text; scorer_name text; correction_reason text;
begin
  if old.event_type not in ('goal','own_goal') or new.event_type <> 'goal_disallowed' then
    return new;
  end if;

  select ht.name, at.name
    into home_name, away_name
    from public.matches m
    join public.teams ht on ht.id=m.home_team_id
    join public.teams at on at.id=m.away_team_id
   where m.id=new.match_id;

  select full_name into scorer_name from public.players where id=old.player_id;
  correction_reason := nullif(trim(split_part(coalesce(new.details,''),' · ',1)),'');

  perform public.notify_match_followers(
    new.match_id,
    'goal_correction',
    'Goal disallowed',
    coalesce(home_name,'Home') || ' vs ' || coalesce(away_name,'Away')
      || ' • ' || coalesce(old.minute::text,'?') || ''''
      || case when scorer_name is not null then ' • ' || scorer_name else '' end
      || case when correction_reason is not null then ' • ' || correction_reason else '' end
  );
  return new;
end;
$$;

drop trigger if exists on_match_goal_correction_zedek_notifications on public.match_events;
create trigger on_match_goal_correction_zedek_notifications
after update of event_type on public.match_events
for each row
when (old.event_type in ('goal','own_goal') and new.event_type='goal_disallowed')
execute function public.notify_match_goal_correction();
