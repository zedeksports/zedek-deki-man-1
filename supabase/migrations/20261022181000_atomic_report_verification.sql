-- Make administrator report verification atomic and allow reporters to clear report text.
-- All result, verification, report, assignment and official-statistics changes run in one transaction.

CREATE OR REPLACE FUNCTION public.verify_match_report_atomic(
  p_report_id uuid,
  p_outcome text,
  p_reschedule_at timestamptz DEFAULT NULL,
  p_interruption_reason text DEFAULT NULL,
  p_interruption_minute integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_report public.match_reports%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_now timestamptz := clock_timestamp();
  v_interrupted boolean;
  v_target_status text;
  v_reason text := nullif(btrim(coalesce(p_interruption_reason, '')), '');
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid
      AND p.is_active = true
      AND p.role IN ('super_admin', 'zedek_admin')
  ) THEN
    RAISE EXCEPTION 'Active administrator access required';
  END IF;

  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'Select a match report to verify';
  END IF;

  IF p_outcome IS NULL OR p_outcome NOT IN ('completed', 'suspended', 'postponed', 'abandoned', 'cancelled') THEN
    RAISE EXCEPTION 'Select a valid official outcome';
  END IF;

  v_interrupted := p_outcome IN ('suspended', 'postponed', 'abandoned', 'cancelled');
  IF v_interrupted AND v_reason IS NULL THEN
    RAISE EXCEPTION 'A reason is required before locking an interrupted match';
  END IF;
  IF p_interruption_minute IS NOT NULL AND p_interruption_minute < 0 THEN
    RAISE EXCEPTION 'Interruption minute must be zero or greater';
  END IF;

  SELECT mr.* INTO v_report
  FROM public.match_reports mr
  WHERE mr.id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match report not found';
  END IF;
  IF v_report.status = 'verified' THEN
    RAISE EXCEPTION 'This report has already been verified and locked';
  END IF;

  SELECT m.* INTO v_match
  FROM public.matches m
  WHERE m.id = v_report.match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The report match no longer exists';
  END IF;

  v_target_status := CASE WHEN p_outcome = 'completed' THEN 'verified' ELSE p_outcome END;

  INSERT INTO public.match_verifications (
    match_id, verified_by, verified_at, official_result, locked_at, notes
  ) VALUES (
    v_match.id, v_uid, v_now, (p_outcome = 'completed'), v_now, CASE WHEN v_interrupted THEN v_reason ELSE NULL END
  )
  ON CONFLICT (match_id) DO UPDATE SET
    verified_by = EXCLUDED.verified_by,
    verified_at = EXCLUDED.verified_at,
    official_result = EXCLUDED.official_result,
    locked_at = EXCLUDED.locked_at,
    notes = EXCLUDED.notes;

  UPDATE public.matches
  SET status = v_target_status::public.match_status,
      rescheduled_at = CASE WHEN v_interrupted THEN p_reschedule_at ELSE NULL END,
      interruption_reason = CASE WHEN v_interrupted THEN v_reason ELSE NULL END,
      interruption_minute = CASE WHEN v_interrupted THEN p_interruption_minute ELSE NULL END,
      outcome_note = v_report.summary,
      updated_at = v_now
  WHERE id = v_match.id;

  UPDATE public.match_reports
  SET status = 'verified',
      outcome = p_outcome,
      interruption_reason = CASE WHEN v_interrupted THEN v_reason ELSE NULL END,
      interruption_minute = CASE WHEN v_interrupted THEN p_interruption_minute ELSE NULL END,
      reschedule_at = CASE WHEN v_interrupted THEN p_reschedule_at ELSE NULL END,
      updated_at = v_now
  WHERE id = v_report.id;

  -- Close the corresponding reporter assignment when it still exists.
  IF v_report.reporter_id IS NOT NULL THEN
    UPDATE public.reporter_assignments
    SET status = 'completed',
        completed_at = coalesce(completed_at, v_now),
        updated_at = v_now
    WHERE match_id = v_report.match_id
      AND reporter_id = v_report.reporter_id
      AND status IN ('assigned', 'accepted', 'in_progress');
  END IF;

  -- This function checks administrator access too. Any error rolls back all
  -- updates above, including the official result and report verification.
  IF p_outcome = 'completed' AND v_match.season_id IS NOT NULL THEN
    PERFORM public.rebuild_official_player_statistics(v_match.season_id);
  END IF;

  RETURN jsonb_build_object(
    'report_id', v_report.id,
    'match_id', v_report.match_id,
    'outcome', p_outcome,
    'match_status', v_target_status,
    'verified_at', v_now
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_match_report_atomic(uuid, text, timestamptz, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_match_report_atomic(uuid, text, timestamptz, text, integer) TO authenticated;

-- Replace the reporter submission function so an explicit empty string clears
-- summary/incidents. The Reporter Desk sends empty strings when those fields
-- have been erased by the reporter.
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
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid
      AND p.is_active = true
      AND p.role = 'reporter'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Only an active reporter account can submit a match report';
  END IF;

  IF p_match_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id = p_match_id
  ) THEN
    RAISE EXCEPTION 'Select an assigned match that still exists';
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

  PERFORM pg_advisory_xact_lock(hashtextextended(p_match_id::text, 0));

  SELECT ra.status INTO v_assignment_status
  FROM public.reporter_assignments ra
  WHERE ra.match_id = p_match_id
    AND ra.reporter_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No reporter assignment is linked to this match';
  END IF;

  SELECT mr.* INTO v_existing
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
        summary = coalesce(p_summary, ''),
        incidents = coalesce(p_incidents, ''),
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
