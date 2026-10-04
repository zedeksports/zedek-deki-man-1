-- Correct official assist aggregation: reporter records the assisting player
-- in match_events.secondary_player_id on the goal event.
create or replace function public.rebuild_official_player_statistics(p_season_id uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active=true and p.role in ('super_admin','zedek_admin')) then raise exception 'Administrator access required'; end if;
  delete from public.official_player_statistics where season_id=p_season_id;
  insert into public.official_player_statistics
    (season_id,player_id,team_id,matches_played,starts,goals,assists,yellow_cards,red_cards,minutes_played,updated_at)
  with official_matches as (
    select m.id,m.season_id from public.matches m join public.match_verifications v on v.match_id=m.id
    where m.season_id=p_season_id and m.status='verified' and v.official_result=true
  ),
  appearances as (
    select om.id as match_id,om.season_id,x.player_id,l.team_id,x.role,
      (select min(e.minute) from public.match_events e where e.match_id=om.id and e.event_type='substitution' and e.player_id=x.player_id) sub_out_minute,
      (select min(e.minute) from public.match_events e where e.match_id=om.id and e.event_type='substitution' and e.secondary_player_id=x.player_id) sub_in_minute
    from official_matches om join public.match_lineups l on l.match_id=om.id join public.match_lineup_players x on x.lineup_id=l.id
  ),
  mins as (
    select *,greatest(0,least(90,case when role='starter' then coalesce(sub_out_minute,90) when role='substitute' and sub_in_minute is not null then greatest(0,90-sub_in_minute) else 0 end))::int minutes
    from appearances
  )
  select p_season_id,a.player_id,a.team_id,count(distinct a.match_id)::int,count(distinct case when a.role='starter' then a.match_id end)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.event_type='goal' and e.team_id=a.team_id),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.secondary_player_id=a.player_id and e.event_type='goal' and e.team_id=a.team_id),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.event_type='yellow_card' and e.team_id=a.team_id),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.event_type='red_card' and e.team_id=a.team_id),0)::int,
    sum(a.minutes)::int,now()
  from mins a group by a.player_id,a.team_id;
end;
$$;
