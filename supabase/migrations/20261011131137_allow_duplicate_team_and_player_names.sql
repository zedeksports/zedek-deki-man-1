-- Allow different real-world teams and players to share the same display name.
-- Names alone are not reliable identifiers; distinct records are identified by their UUID
-- and supporting details such as team, area, venue, player photo and registration details.
-- Existing records and foreign-key relationships are preserved.
alter table public.teams
  drop constraint if exists teams_name_key;

alter table public.players
  drop constraint if exists players_team_id_full_name_key;
