create or replace function public.return_expired_loans()
returns integer
language plpgsql
set search_path to ''
as $function$
declare
  returned_count integer := 0;
begin
  with latest_movements as (
    select distinct on (pm.player_id)
      pm.id,
      pm.player_id,
      pm.movement_type,
      pm.from_team_id,
      pm.to_team_id,
      pm.start_date,
      pm.end_date
    from public.player_movements pm
    where pm.start_date is not null
      and pm.start_date <= current_date
    order by pm.player_id, pm.start_date desc, pm.created_at desc, pm.id desc
  ),
  expired_loans as (
    select lm.id, lm.player_id, lm.from_team_id
    from latest_movements lm
    join public.players p on p.id = lm.player_id
    where lm.movement_type = 'loan'
      and lm.end_date is not null
      and lm.end_date < current_date
      and lm.from_team_id is not null
      and p.team_id = lm.to_team_id
  ),
  moved_back as (
    update public.players p
    set team_id = e.from_team_id,
        is_active = true,
        updated_at = now()
    from expired_loans e
    where p.id = e.player_id
    returning p.id
  )
  update public.player_movements pm
  set status = 'completed',
      updated_at = now()
  from expired_loans e
  where pm.id = e.id;

  get diagnostics returned_count = row_count;
  return returned_count;
end;
$function$;
