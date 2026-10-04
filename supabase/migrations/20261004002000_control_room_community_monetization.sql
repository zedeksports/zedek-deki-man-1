-- Zedek Sports Control Room: community, feedback and monetization batch
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id=(select auth.uid())
      and is_active=true
      and role in ('super_admin','zedek_admin')
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(), content_type text not null check (content_type in ('news','community_update')),
  title text not null, slug text not null unique, excerpt text, body text not null, cover_image_url text, category text,
  status text not null default 'draft' check (status in ('draft','published','archived')), featured boolean not null default false,
  author_id uuid references public.profiles(id), published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists content_posts_type_status_idx on public.content_posts(content_type,status,published_at desc);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  status text not null default 'draft' check (status in ('draft','published','closed')), starts_at timestamptz, ends_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(), survey_id uuid not null references public.surveys(id) on delete cascade,
  prompt text not null, question_type text not null default 'text' check (question_type in ('text','single','multi','rating')),
  options jsonb not null default '[]'::jsonb, required boolean not null default false, sort_order integer not null default 1 check (sort_order>0), created_at timestamptz not null default now()
);
create index if not exists survey_questions_order_idx on public.survey_questions(survey_id,sort_order);
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(), survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(), unique(survey_id,user_id)
);
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  category text not null default 'general' check (category in ('general','bug','match','team','player','news','feature','other')),
  subject text, message text not null, rating integer check (rating is null or rating between 1 and 5),
  status text not null default 'new' check (status in ('new','reviewing','resolved','closed')), admin_note text,
  created_at timestamptz not null default now(), resolved_at timestamptz
);
create index if not exists user_feedback_status_idx on public.user_feedback(status,created_at desc);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(), name text not null unique, logo_url text, website_url text,
  contact_name text, contact_email text, contact_phone text, tier text not null default 'standard' check (tier in ('community','standard','premium','title')),
  status text not null default 'prospect' check (status in ('prospect','active','paused','ended')), start_date date, end_date date,
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sponsorship_deals (
  id uuid primary key default gen_random_uuid(), sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  deal_name text not null, amount numeric(12,2) not null default 0 check (amount>=0), currency text not null default 'GHS',
  status text not null default 'proposed' check (status in ('proposed','active','completed','cancelled')),
  start_date date, end_date date, placement text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(), name text not null unique, placement text not null,
  format text not null default 'banner' check (format in ('banner','card','logo','native')), sponsor_id uuid references public.sponsors(id) on delete set null,
  image_url text, target_url text, active boolean not null default false, start_date date, end_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.monetization_transactions (
  id uuid primary key default gen_random_uuid(), sponsor_id uuid references public.sponsors(id) on delete set null,
  deal_id uuid references public.sponsorship_deals(id) on delete set null, transaction_type text not null check (transaction_type in ('invoice','payment','refund','adjustment')),
  amount numeric(12,2) not null default 0, currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')), transaction_date date not null default current_date,
  reference text, notes text, created_at timestamptz not null default now()
);
create index if not exists sponsorship_deals_status_idx on public.sponsorship_deals(status,start_date);
create index if not exists monetization_transactions_date_idx on public.monetization_transactions(transaction_date desc);

alter table public.content_posts enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.user_feedback enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsorship_deals enable row level security;
alter table public.ad_slots enable row level security;
alter table public.monetization_transactions enable row level security;

drop policy if exists "public read published content" on public.content_posts;
create policy "public read published content" on public.content_posts for select to anon,authenticated using (status='published');
drop policy if exists "admins manage content" on public.content_posts;
create policy "admins manage content" on public.content_posts for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read published surveys" on public.surveys;
create policy "public read published surveys" on public.surveys for select to anon,authenticated using (status='published');
drop policy if exists "admins manage surveys" on public.surveys;
create policy "admins manage surveys" on public.surveys for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read published survey questions" on public.survey_questions;
create policy "public read published survey questions" on public.survey_questions for select to anon,authenticated using (exists(select 1 from public.surveys s where s.id=survey_id and s.status='published'));
drop policy if exists "admins manage survey questions" on public.survey_questions;
create policy "admins manage survey questions" on public.survey_questions for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "users submit survey responses" on public.survey_responses;
create policy "users submit survey responses" on public.survey_responses for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "users read own survey responses" on public.survey_responses;
create policy "users read own survey responses" on public.survey_responses for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "admins manage survey responses" on public.survey_responses;
create policy "admins manage survey responses" on public.survey_responses for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "users submit feedback" on public.user_feedback;
create policy "users submit feedback" on public.user_feedback for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "users read own feedback" on public.user_feedback;
create policy "users read own feedback" on public.user_feedback for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "admins manage feedback" on public.user_feedback;
create policy "admins manage feedback" on public.user_feedback for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read active sponsors" on public.sponsors;
create policy "public read active sponsors" on public.sponsors for select to anon using (status='active');
drop policy if exists "admins manage sponsors" on public.sponsors;
create policy "admins manage sponsors" on public.sponsors for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage sponsorship deals" on public.sponsorship_deals;
create policy "admins manage sponsorship deals" on public.sponsorship_deals for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "public read active ad slots" on public.ad_slots;
create policy "public read active ad slots" on public.ad_slots for select to anon,authenticated using (active=true and (start_date is null or start_date<=current_date) and (end_date is null or end_date>=current_date));
drop policy if exists "admins manage ad slots" on public.ad_slots;
create policy "admins manage ad slots" on public.ad_slots for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "admins manage monetization transactions" on public.monetization_transactions;
create policy "admins manage monetization transactions" on public.monetization_transactions for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
revoke all on public.sponsorship_deals from anon;
revoke all on public.monetization_transactions from anon;

revoke all on table public.content_posts,public.surveys,public.survey_questions,public.survey_responses,public.user_feedback,public.sponsors,public.sponsorship_deals,public.ad_slots,public.monetization_transactions from anon,authenticated;
grant select on public.content_posts,public.surveys,public.survey_questions,public.ad_slots to anon;
grant select,insert,update,delete on public.content_posts,public.surveys,public.survey_questions,public.survey_responses,public.user_feedback,public.sponsors,public.sponsorship_deals,public.ad_slots,public.monetization_transactions to authenticated;
revoke all on table public.sponsors from anon;
grant select (id,name,logo_url,website_url,tier,status,start_date,end_date) on public.sponsors to anon;
