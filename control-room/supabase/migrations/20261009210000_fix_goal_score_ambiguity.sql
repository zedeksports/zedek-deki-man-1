-- Fix output-column/table-column ambiguity in goal score mutations.
-- Keep score updates atomic with their match event mutations.

CREATE OR REPLACE FUNCTION public.record_match_goal(
  p_match_id uuid,
  p_team_id uuid,
  p_player_id uuid,
  p_secondary_player_id uuid,
  p_event_type text,
  p_minute integer,
  p_extra_minute integer DEFAULT NULL::integer,
  p_details text DEFAULT NULL::text
)
RETURNS TABLE(event_id uuid, home_score integer, away_score integer)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  m public.matches%rowtype;
  eid uuid;
  scoring_team uuid;
  hs integer;
  ascore integer;
BEGIN
  IF p_event_type IS NULL OR p_event_type NOT IN ('goal','own_goal') THEN
    RAISE EXCEPTION 'Invalid goal event type';
  END IF;

  SELECT * INTO m FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match unavailable or score update not permitted';
  END IF;
  IF m.status NOT IN ('live','halftime') THEN
    RAISE EXCEPTION 'Goals can only be recorded while a match is live or at halftime';
  END IF;
  IF p_team_id IS NULL OR p_team_id NOT IN (m.home_team_id,m.away_team_id) THEN
    RAISE EXCEPTION 'Event team is not in this match';
  END IF;
  IF p_player_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = p_player_id AND team_id = p_team_id
  ) THEN
    RAISE EXCEPTION 'Goal scorer must belong to the selected team';
  END IF;
  IF p_secondary_player_id IS NOT NULL AND (
    p_secondary_player_id = p_player_id OR NOT EXISTS (
      SELECT 1 FROM public.players WHERE id = p_secondary_player_id AND team_id = p_team_id
    )
  ) THEN
    RAISE EXCEPTION 'Assist player must be a different player from the same team';
  END IF;

  INSERT INTO public.match_events(
    match_id,team_id,player_id,secondary_player_id,event_type,minute,extra_minute,details
  )
  VALUES (
    p_match_id,p_team_id,p_player_id,p_secondary_player_id,p_event_type,
    greatest(0,coalesce(p_minute,0)),
    CASE WHEN p_extra_minute IS NULL THEN NULL ELSE greatest(0,p_extra_minute) END,
    p_details
  )
  RETURNING id INTO eid;

  scoring_team := CASE
    WHEN p_event_type = 'own_goal' AND p_team_id = m.home_team_id THEN m.away_team_id
    WHEN p_event_type = 'own_goal' THEN m.home_team_id
    ELSE p_team_id
  END;

  IF scoring_team = m.home_team_id THEN
    UPDATE public.matches AS score_match
       SET home_score = coalesce(score_match.home_score,0) + 1
     WHERE score_match.id = p_match_id
    RETURNING score_match.home_score, score_match.away_score INTO hs, ascore;
  ELSE
    UPDATE public.matches AS score_match
       SET away_score = coalesce(score_match.away_score,0) + 1
     WHERE score_match.id = p_match_id
    RETURNING score_match.home_score, score_match.away_score INTO hs, ascore;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Score update denied; goal was not committed';
  END IF;

  RETURN QUERY SELECT eid, hs, ascore;
END
$function$;

CREATE OR REPLACE FUNCTION public.correct_match_goal(p_event_id uuid, p_reason text)
RETURNS TABLE(event_id uuid, match_id uuid, home_score integer, away_score integer)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  e public.match_events%rowtype;
  m public.matches%rowtype;
  credited uuid;
  hs integer;
  ascore integer;
BEGIN
  IF nullif(trim(coalesce(p_reason,'')),'') IS NULL THEN
    RAISE EXCEPTION 'Correction reason required';
  END IF;

  SELECT * INTO e FROM public.match_events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR e.event_type NOT IN ('goal','own_goal') THEN
    RAISE EXCEPTION 'Goal not found or already corrected';
  END IF;

  SELECT * INTO m FROM public.matches WHERE id = e.match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match unavailable or update not permitted';
  END IF;
  IF m.status NOT IN ('live','halftime','finished') THEN
    RAISE EXCEPTION 'Goals can only be corrected for live, halftime, or finished matches';
  END IF;
  IF m.status = 'verified' OR EXISTS (
    SELECT 1 FROM public.match_verifications v
     WHERE v.match_id = e.match_id AND v.official_result IS TRUE
  ) THEN
    RAISE EXCEPTION 'This match has an official verified result. An administrator must reopen the result before correcting the goal.';
  END IF;
  IF e.team_id IS NULL OR e.team_id NOT IN (m.home_team_id,m.away_team_id) THEN
    RAISE EXCEPTION 'Goal event team is not part of this match';
  END IF;

  credited := CASE
    WHEN e.event_type = 'own_goal' AND e.team_id = m.home_team_id THEN m.away_team_id
    WHEN e.event_type = 'own_goal' THEN m.home_team_id
    ELSE e.team_id
  END;

  UPDATE public.match_events
     SET event_type = 'goal_disallowed',
         details = concat_ws(' · ','GOAL DISALLOWED — ' || trim(p_reason),
                             'Original event: ' || e.event_type,
                             nullif(e.details,''))
   WHERE id = e.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal correction is not permitted';
  END IF;

  IF credited = m.home_team_id THEN
    UPDATE public.matches AS score_match
       SET home_score = coalesce(score_match.home_score,0) - 1
     WHERE score_match.id = m.id AND coalesce(score_match.home_score,0) > 0
    RETURNING score_match.home_score, score_match.away_score INTO hs, ascore;
  ELSE
    UPDATE public.matches AS score_match
       SET away_score = coalesce(score_match.away_score,0) - 1
     WHERE score_match.id = m.id AND coalesce(score_match.away_score,0) > 0
    RETURNING score_match.home_score, score_match.away_score INTO hs, ascore;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Score is already zero or update not permitted; correction rolled back';
  END IF;

  RETURN QUERY SELECT e.id, m.id, hs, ascore;
END
$function$;
