create table if not exists public.team_officials (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Team Official',
  is_current boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists team_officials_current_unique on public.team_officials(team_id, user_id, role) where is_current = true;
create index if not exists team_officials_team_current_idx on public.team_officials(team_id, is_current);
create index if not exists team_officials_user_current_idx on public.team_officials(user_id, is_current);

alter table public.team_officials enable row level security;
drop policy if exists "Admins manage team officials" on public.team_officials;
create policy "Admins manage team officials" on public.team_officials for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "Officials read own assignments" on public.team_officials;
create policy "Officials read own assignments" on public.team_officials for select to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.team_officials to authenticated;