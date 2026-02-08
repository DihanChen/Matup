-- Tennis League Redesign Migration
-- Extends existing schema to support singles and doubles tennis leagues

-- 1. Extend scoring_format to include tennis types
ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_scoring_format_check;
ALTER TABLE leagues ADD CONSTRAINT leagues_scoring_format_check
  CHECK (scoring_format IN ('team_vs_team','individual_time','individual_points','singles','doubles'));

-- 2. Rotation type for doubles leagues (null for singles)
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS rotation_type text
  CHECK (rotation_type IS NULL OR rotation_type IN ('random','assigned'));

-- 3. Set scores JSONB for detailed tennis scoring (null for simple win/loss)
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS set_scores jsonb;

-- 4. Winner field on matches for quick win/loss recording
ALTER TABLE league_matches ADD COLUMN IF NOT EXISTS winner text
  CHECK (winner IS NULL OR winner IN ('A','B'));
