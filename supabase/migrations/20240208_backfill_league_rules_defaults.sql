-- Backfill default rules_jsonb for existing leagues created before rules rollout

UPDATE leagues
SET
  rules_version = COALESCE(rules_version, 1),
  rules_jsonb = CASE
    WHEN sport_type = 'running' THEN jsonb_build_object(
      'sport', 'running',
      'schedule', jsonb_build_object(
        'cadence', 'weekly',
        'starts_on', start_date,
        'season_weeks', COALESCE(season_weeks, 10)
      ),
      'sessions', jsonb_build_object(
        'default_session_type', 'time_trial',
        'comparison_mode', 'personal_progress',
        'distance_tolerance_percent', 5
      ),
      'submissions', jsonb_build_object(
        'allow_runner_submission', true,
        'require_organizer_approval', false,
        'proof_required', false
      ),
      'standings', jsonb_build_object(
        'mode', 'personal_progress',
        'best_n_weeks', GREATEST(1, COALESCE(season_weeks, 10) - 1),
        'drop_worst_k_weeks', 1,
        'min_sessions_for_ranking', LEAST(3, COALESCE(season_weeks, 10))
      ),
      'attendance', jsonb_build_object(
        'checkin_required', false,
        'checkin_window_minutes_before_start', 30,
        'allow_self_checkin', true,
        'late_checkin_policy', 'allow'
      )
    )
    ELSE jsonb_build_object(
      'sport', 'tennis',
      'schedule', jsonb_build_object(
        'cadence', 'weekly',
        'starts_on', start_date,
        'season_weeks', COALESCE(season_weeks, 10)
      ),
      'match', jsonb_build_object(
        'mode', CASE WHEN scoring_format = 'doubles' THEN 'doubles' ELSE 'singles' END,
        'doubles_partner_mode', CASE WHEN scoring_format = 'doubles' AND rotation_type = 'assigned' THEN 'fixed_pairs'
                                     WHEN scoring_format = 'doubles' THEN 'random_weekly'
                                     ELSE null END,
        'scoring_input', 'set_by_set',
        'best_of_sets', 3,
        'tiebreak_at_games', 6
      ),
      'standings', jsonb_build_object(
        'points', jsonb_build_object('win', 3, 'loss', 0),
        'tie_breakers', jsonb_build_array('points', 'head_to_head', 'set_diff', 'game_diff')
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
  END
WHERE rules_jsonb = '{}'::jsonb OR rules_jsonb IS NULL;
