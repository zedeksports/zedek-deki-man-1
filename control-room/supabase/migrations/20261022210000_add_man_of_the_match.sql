-- Store the administrator-selected Man of the Match on each fixture.
-- Selection is nullable for historical matches and remains linked to the player record.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS man_of_the_match_player_id uuid
  REFERENCES public.players(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS matches_man_of_the_match_player_id_idx
  ON public.matches (man_of_the_match_player_id);

COMMENT ON COLUMN public.matches.man_of_the_match_player_id IS
  'Player selected by an administrator as Man of the Match after the official result is verified and locked.';
