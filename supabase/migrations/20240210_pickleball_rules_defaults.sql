-- Backfill pickleball-specific rules_jsonb defaults.
-- This keeps existing pickleball leagues consistent with the new rule model.

UPDATE leagues
SET
  rules_version = COALESCE(rules_version, 1),
  rules_jsonb = jsonb_build_object(
    'sport', 'pickleball',
    'schedule', jsonb_build_object(
      'cadence', 'weekly',
      'starts_on', start_date,
      'season_weeks', COALESCE(season_weeks, 10)
    ),
    'match', jsonb_build_object(
      'mode', CASE WHEN scoring_format = 'doubles' THEN 'doubles' ELSE 'singles' END,
      'doubles_partner_mode', CASE
        WHEN scoring_format = 'doubles' AND rotation_type = 'assigned' THEN 'fixed_pairs'
        WHEN scoring_format = 'doubles' THEN 'random_weekly'
        ELSE NULL
      END,
      'fixed_pairs', CASE
        WHEN scoring_format = 'doubles' AND rotation_type = 'assigned' THEN COALESCE(rules_jsonb #> '{match,fixed_pairs}', '[]'::jsonb)
        ELSE NULL
      END,
      'scoring_input', 'game_by_game',
      'best_of_games', 3,
      'game_points_to', 11,
      'win_by', 2,
      'serving_model', 'side_out'
    ),
    'standings', jsonb_build_object(
      'points', jsonb_build_object('win', 3, 'loss', 0),
      'tie_breakers', jsonb_build_array('points', 'head_to_head', 'game_diff', 'point_diff')
    ),
    'submissions', jsonb_build_object(
      'allow_participant_submission', true,
      'require_opponent_confirmation', true
    ),
    'attendance', jsonb_build_object(
      'checkin_required', false,
      'checkin_window_minutes_before_start', 30,
      'allow_self_checkin', true,
      'late_checkin_policy', 'allow'
    )
  )
WHERE sport_type = 'pickleball'
  AND (
    rules_jsonb IS NULL
    OR rules_jsonb = '{}'::jsonb
    OR COALESCE(rules_jsonb->>'sport', '') <> 'pickleball'
  );
