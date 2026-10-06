create or replace function public.rebuild_official_player_statistics(p_season_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.is_active=true and p.role in ('super_admin','zedek_admin')
  ) then raise exception 'Administrator access required'; end if;

  delete from public.official_player_statistics where season_id=p_season_id;

  insert into public.official_player_statistics
    (season_id,player_id,team_id,matches_played,starts,goals,assists,yellow_cards,red_cards,minutes_played,updated_at)
  with official_matches as (
    select m.id from public.matches m
    join public.match_verifications v on v.match_id=m.id and v.official_result=true
    where m.season_id=p_season_id and m.status='verified'
  ),
  lineup_participants as (
    select om.id match_id,lp.player_id,l.team_id,lp.role
    from official_matches om
    join public.match_lineups l on l.match_id=om.id
    join public.match_lineup_players lp on lp.lineup_id=l.id
  ),
  event_participants as (
    select e.match_id,e.player_id,e.team_id,null::text role
    from public.match_events e join official_matches om on om.id=e.match_id
    where e.player_id is not null and e.event_type in ('goal','own_goal','yellow_card','red_card')
    union
    select e.match_id,e.secondary_player_id,e.team_id,null::text
    from public.match_events e join official_matches om on om.id=e.match_id
    where e.secondary_player_id is not null and e.event_type='goal'
  ),
  participants as (
    select distinct match_id,player_id,team_id,role
    from (select * from lineup_participants union all select * from event_participants)x
  ),
  mins as (
    select p.*,
      greatest(0,least(90,
        case
          when p.role='starter' then coalesce((select min(e.minute) from public.match_events e where e.match_id=p.match_id and e.event_type='substitution' and e.player_id=p.player_id),90)
          when p.role='substitute' then greatest(0,90-coalesce((select min(e.minute) from public.match_events e where e.match_id=p.match_id and e.event_type='substitution' and e.secondary_player_id=p.player_id),90))
          else 0
        end
      ))::int minutes
    from participants p
  )
  select p_season_id,a.player_id,a.team_id,
    count(distinct a.match_id)::int,
    count(distinct case when a.role='starter' then a.match_id end)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.team_id=a.team_id and e.event_type='goal'),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.secondary_player_id=a.player_id and e.event_type='goal'),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.team_id=a.team_id and e.event_type='yellow_card'),0)::int,
    coalesce((select count(*) from public.match_events e join official_matches om on om.id=e.match_id where e.player_id=a.player_id and e.team_id=a.team_id and e.event_type='red_card'),0)::int,
    sum(a.minutes)::int,now()
  from mins a group by a.player_id,a.team_id;
end;
$function$;

revoke execute on function public.rebuild_official_player_statistics(uuid) from public, anon;
grant execute on function public.rebuild_official_player_statistics(uuid) to authenticated, service_role;