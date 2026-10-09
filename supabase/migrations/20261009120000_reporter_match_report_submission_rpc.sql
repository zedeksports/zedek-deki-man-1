-- Reporter Desk: safely submit or claim the single official report row for a match.
-- The table intentionally has UNIQUE(match_id), so reporter submissions must update/claim
-- an existing unverified row instead of attempting a second INSERT.

CREATE OR REPLACE FUNCTION public.submit_match_report(
  p_match_id uuid,
  p_summary text DEFAULT NULL,
  p_incidents text DEFAULT NULL,
  p_outcome text DEFAULT NULL,
  p_interruption_reason text DEFAULT NULL,
  p_interruption_minute integer DEFAULT NULL,
  p_reschedule_at timestamptz DEFAULT NULL
)
RETURNS public.match_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_assignment_status text;
  v_existing public.match_reports%ROWTYPE;
  v_saved public.match_reports%ROWTYPE;
  v_has_report boolean := false;
  v_outcome text := p_outcome;
  v_reason text := nullif(btrim(coalesce(p_interruption_reason, '')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in before submitting a match report';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_uid
      AND p.is_active = true
      AND p.role = 'reporter'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Only an active reporter account can submit a match report';
  END IF;

  IF p_match_id IS NULL THEN
    RAISE EXCEPTION 'Select an assigned match before submitting the report';
  END IF;

  IF v_outcome IS NULL OR v_outcome NOT IN ('completed', 'suspended', 'postponed', 'abandoned', 'cancelled') THEN
    RAISE EXCEPTION 'Select a valid match outcome';
  END IF;

  IF p_interruption_minute IS NOT NULL AND p_interruption_minute < 0 THEN
    RAISE EXCEPTION 'Minute at interruption must be zero or greater';
  END IF;

  IF v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') AND v_reason IS NULL THEN
    RAISE EXCEPTION 'An interruption reason is required for this match outcome';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.id = p_match_id) THEN
    RAISE EXCEPTION 'The selected match no longer exists';
  END IF;

  SELECT ra.status
    INTO v_assignment_status
  FROM public.reporter_assignments ra
  WHERE ra.match_id = p_match_id
    AND ra.reporter_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No reporter assignment is linked to this match';
  END IF;

  -- Serialize submissions for the same match to avoid concurrent unique-key races.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_match_id::text, 0));

  SELECT mr.*
    INTO v_existing
  FROM public.match_reports mr
  WHERE mr.match_id = p_match_id
  FOR UPDATE;

  v_has_report := FOUND;

  IF v_has_report THEN
    IF v_existing.status = 'verified' THEN
      RAISE EXCEPTION 'This match report has already been verified and locked';
    END IF;

    IF v_existing.status NOT IN ('draft', 'submitted', 'rejected') THEN
      RAISE EXCEPTION 'This report is currently under review and cannot be changed';
    END IF;

    IF v_existing.reporter_id IS NOT NULL AND v_existing.reporter_id <> v_uid THEN
      RAISE EXCEPTION 'A different reporter already owns this match report';
    END IF;

    IF v_assignment_status NOT IN ('assigned', 'accepted', 'in_progress')
       AND NOT (
         v_assignment_status = 'completed'
         AND v_existing.reporter_id = v_uid
         AND v_existing.status IN ('submitted', 'rejected')
       ) THEN
      RAISE EXCEPTION 'This reporter assignment is no longer active for report submission';
    END IF;

    UPDATE public.match_reports
    SET reporter_id = v_uid,
        summary = coalesce(nullif(btrim(coalesce(p_summary, '')), ''), v_existing.summary, ''),
        incidents = coalesce(nullif(btrim(coalesce(p_incidents, '')), ''), v_existing.incidents, ''),
        outcome = v_outcome,
        interruption_reason = CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN v_reason ELSE NULL END,
        interruption_minute = CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN p_interruption_minute ELSE NULL END,
        reschedule_at = CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN p_reschedule_at ELSE NULL END,
        status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    WHERE id = v_existing.id
    RETURNING * INTO v_saved;
  ELSE
    IF v_assignment_status NOT IN ('assigned', 'accepted', 'in_progress') THEN
      RAISE EXCEPTION 'This reporter assignment is no longer active for report submission';
    END IF;

    INSERT INTO public.match_reports (
      match_id, reporter_id, summary, incidents, outcome,
      interruption_reason, interruption_minute, reschedule_at,
      status, submitted_at, updated_at
    )
    VALUES (
      p_match_id, v_uid, coalesce(p_summary, ''), coalesce(p_incidents, ''), v_outcome,
      CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN v_reason ELSE NULL END,
      CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN p_interruption_minute ELSE NULL END,
      CASE WHEN v_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled') THEN p_reschedule_at ELSE NULL END,
      'submitted', now(), now()
    )
    RETURNING * INTO v_saved;
  END IF;

  RETURN v_saved;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_match_report(uuid, text, text, text, text, integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_match_report(uuid, text, text, text, text, integer, timestamptz) TO authenticated;
