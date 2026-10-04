create or replace function public.rebuild_official_player_statistics(p_season_id uuid)
returns void
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  delete from public.official_player_statistics
  where season_id = p_season_id;

  insert into public.official_player_statistics
    (season_id, player_id, team_id, matches_played, starts, goals, assists, yellow_cards, red_cards, minutes_played, updated_at)
  with appearances as (
    select
      m.id as match_id,
      x.player_id,
      l.team_id as team_id,
      x.role,
      coalesce((
        select min(e.minute)
        from public.match_events e
        where e.match_id=m.id
          and e.event_type='substitution'
          and e.secondary_player_id=x.player_id
      ), null) as sub_in_minute,
      coalesce((
        select min(e.minute)
        from public.match_events e
        where e.match_id=m.id
          and e.event_type='substitution'
          and e.player_id=x.player_id
      ), null) as sub_out_minute
    from public.matches m
    join public.match_lineups l on l.match_id=m.id
    join public.match_lineup_players x on x.lineup_id=l.id
    where m.season_id=p_season_id and m.status='verified'
  ),
  mins as (
    select *,
      greatest(
        0,
        least(
          90,
          case
            when role='starter' then
              90 - coalesce(sub_out_minute,90) + coalesce(sub_in_minute,0)
            when sub_in_minute is not null then
              90 - sub_in_minute
            else 0
          end
        )
      )::int as minutes
    from appearances
  )
  select
    p_season_id,
    a.player_id,
    a.team_id,
    count(distinct a.match_id)::int,
    count(distinct case when a.role='starter' then a.match_id end)::int,
    coalesce((select count(*) from public.match_events e join public.matches mm on mm.id=e.match_id where mm.season_id=p_season_id and mm.status='verified' and e.player_id=a.player_id and e.event_type='goal'),0)::int,
    coalesce((select count(*) from public.match_events e join public.matches mm on mm.id=e.match_id where mm.season_id=p_season_id and mm.status='verified' and e.player_id=a.player_id and e.event_type='assist'),0)::int,
    coalesce((select count(*) from public.match_events e join public.matches mm on mm.id=e.match_id where mm.season_id=p_season_id and mm.status='verified' and e.player_id=a.player_id and e.event_type='yellow_card'),0)::int,
    coalesce((select count(*) from public.match_events e join public.matches mm on mm.id=e.match_id where mm.season_id=p_season_id and mm.status='verified' and e.player_id=a.player_id and e.event_type='red_card'),0)::int,
    sum(a.minutes)::int,
    now()
  from mins a
  group by a.player_id,a.team_id;
end;
$function$;