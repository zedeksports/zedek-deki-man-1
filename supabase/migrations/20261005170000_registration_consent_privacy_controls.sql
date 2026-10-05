-- Zedek Sports registration consent and privacy controls
create table if not exists public.data_consents (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('team','player','coach','official')),
  subject_id uuid not null,
  consent_type text not null default 'registration',
  terms_version text not null,
  privacy_version text not null,
  consent_status text not null default 'active' check (consent_status in ('active','withdrawn','superseded')),
  consented_by uuid references auth.users(id) on delete set null,
  consented_by_name text,\n  consent_holder_name text,\n  consent_holder_contact text,
  authority_type text not null default 'self' check (authority_type in ('self','team_authorized_representative','parent_or_guardian')),
  guardian_name text,
  guardian_contact text,
  scope text not null default 'registration_and_public_football_profile',
  consented_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists data_consents_subject_idx on public.data_consents(subject_type, subject_id);
create index if not exists data_consents_status_idx on public.data_consents(consent_status);
alter table public.data_consents enable row level security;

drop policy if exists "Admins can read data consents" on public.data_consents;\ncreate policy "Admins can read data consents" on public.data_consents for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins can create data consents" on public.data_consents;\ncreate policy "Admins can create data consents" on public.data_consents for insert to authenticated with check ((select private.is_admin()) and consented_by = (select auth.uid()));
drop policy if exists "Admins can update data consents" on public.data_consents;\ncreate policy "Admins can update data consents" on public.data_consents for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('team','player','coach','official','account')),
  subject_id uuid,
  request_type text not null check (request_type in ('access','rectification','withdraw_consent','restriction','erasure','complaint')),
  requester_name text not null,
  requester_contact text,
  details text,
  status text not null default 'open' check (status in ('open','in_review','resolved','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text
);

create index if not exists data_subject_requests_status_idx on public.data_subject_requests(status, created_at desc);
alter table public.data_subject_requests enable row level security;
drop policy if exists "Admins can manage privacy requests" on public.data_subject_requests;\ncreate policy "Admins can manage privacy requests" on public.data_subject_requests for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
