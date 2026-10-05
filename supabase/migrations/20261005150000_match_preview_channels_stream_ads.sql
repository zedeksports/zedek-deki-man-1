-- ZEDEK Sports: match preview publishing, channel publishing, and live-stream ad targeting
create table if not exists public.match_previews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  headline text,
  summary text,
  key_storylines text,
  form_note text,
  h2h_note text,
  venue_note text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists match_previews_status_idx on public.match_previews(status,published_at desc);

create table if not exists public.match_channels (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  channel_type text not null default 'live_stream' check (channel_type in ('live_stream','tv','radio','social')),
  name text not null,
  provider text,
  url text,
  is_primary boolean not null default false,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists match_channels_match_idx on public.match_channels(match_id,active,is_primary);

create table if not exists public.match_stream_ads (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  ad_slot_id uuid not null references public.ad_slots(id) on delete cascade,
  position text not null default 'pre_roll' check (position in ('pre_roll','mid_roll','post_roll','overlay')),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  priority integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id,ad_slot_id,position)
);
create index if not exists match_stream_ads_match_idx on public.match_stream_ads(match_id,active,priority);

alter table public.match_previews enable row level security;
alter table public.match_channels enable row level security;
alter table public.match_stream_ads enable row level security;

drop policy if exists "public read published match previews" on public.match_previews;
create policy "public read published match previews" on public.match_previews
for select to anon,authenticated using (status='published');

drop policy if exists "admins manage match previews" on public.match_previews;
create policy "admins manage match previews" on public.match_previews
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read active match channels" on public.match_channels;
create policy "public read active match channels" on public.match_channels
for select to anon,authenticated using (
  active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now())
);

drop policy if exists "admins manage match channels" on public.match_channels;
create policy "admins manage match channels" on public.match_channels
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read active match stream ads" on public.match_stream_ads;
create policy "public read active match stream ads" on public.match_stream_ads
for select to anon,authenticated using (
  active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now())
);

drop policy if exists "admins manage match stream ads" on public.match_stream_ads;
create policy "admins manage match stream ads" on public.match_stream_ads
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on table public.match_previews,public.match_channels,public.match_stream_ads from anon,authenticated;
grant select on public.match_previews,public.match_channels,public.match_stream_ads to anon,authenticated;
grant insert,update,delete on public.match_previews,public.match_channels,public.match_stream_ads to authenticated;
