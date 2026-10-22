-- Restore Supabase Realtime publication membership for the public football match feed.
-- Idempotent: safe if a table was added manually or by a prior migration.
DO $migration$
DECLARE
  v_table text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'Required publication supabase_realtime does not exist';
  END IF;

  FOREACH v_table IN ARRAY ARRAY[
    'matches',
    'match_events',
    'match_statistics',
    'match_lineups',
    'match_lineup_players'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END
$migration$;
