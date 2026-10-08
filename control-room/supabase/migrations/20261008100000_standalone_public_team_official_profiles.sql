-- Standalone public team official profiles.
-- These are football registry records, not auth accounts or team_official assignments.

alter table public.team_official_public_profiles
  alter column team_official_id drop not null;

alter table public.team_official_public_profiles
  drop constraint if exists team_official_public_profiles_team_official_id_key;

alter table public.team_official_public_profiles
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists date_of_birth date,
  add column if not exists nationality text,
  add column if not exists photo_url text,
  add column if not exists consent_confirmed boolean not null default false,
  add column if not exists authority_type text not null default 'self',
  add column if not exists holder_name text;

update public.team_official_public_profiles
set full_name = coalesce(nullif(full_name, ''), display_name)
where full_name is null or full_name = '';
