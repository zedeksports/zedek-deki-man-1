-- Live match events may target either a player or a coach.
-- Player events remain linked to players; coach cards use coach_id.
alter table public.match_events
  add column if not exists coach_id uuid null;

alter table public.match_events
  drop constraint if exists match_events_player_or_coach_check;

alter table public.match_events
  add constraint match_events_player_or_coach_check
  check (player_id is null or coach_id is null);

alter table public.match_events
  drop constraint if exists match_events_coach_id_fkey;

alter table public.match_events
  add constraint match_events_coach_id_fkey
  foreign key (coach_id) references public.coaches(id) on delete restrict;

create index if not exists match_events_coach_id_idx
  on public.match_events(coach_id);
