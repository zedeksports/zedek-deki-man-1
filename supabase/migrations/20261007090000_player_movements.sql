create table if not exists public.player_movements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  movement_type text not null check (movement_type in ('transfer','loan')),
  from_team_id uuid references public.teams(id) on delete set null,
  to_team_id uuid references public.teams(id) on delete set null,
  start_date date,
  end_date date,
  status text not null default 'completed' check (status in ('upcoming','current','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_movements_player_idx on public.player_movements(player_id, start_date desc);
create index if not exists player_movements_from_team_idx on public.player_movements(from_team_id);
create index if not exists player_movements_to_team_idx on public.player_movements(to_team_id);

alter table public.player_movements enable row level security;

drop policy if exists "Public reads player movements" on public.player_movements;
create policy "Public reads player movements" on public.player_movements
  for select to anon, authenticated using (true);

drop policy if exists "Admins manage player movements" on public.player_movements;
create policy "Admins manage player movements" on public.player_movements
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select on public.player_movements to anon, authenticated;
grant insert, update, delete on public.player_movements to authenticated;