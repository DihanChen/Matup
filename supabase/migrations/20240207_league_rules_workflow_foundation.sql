-- League rules and workflow foundation
-- Adds rule versioning, fixture lifecycle, result submission/confirmation,
-- QR membership credentials/check-ins, and running session entities.

-- 1) League rules versioning
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS rules_version integer NOT NULL DEFAULT 1;

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS rules_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE leagues
  DROP CONSTRAINT IF EXISTS leagues_rules_jsonb_is_object;

ALTER TABLE leagues
  ADD CONSTRAINT leagues_rules_jsonb_is_object
  CHECK (jsonb_typeof(rules_jsonb) = 'object');

-- 2) Canonical fixtures (schedule and lifecycle state)
CREATE TABLE IF NOT EXISTS league_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  week_number integer,
  starts_at timestamptz,
  ends_at timestamptz,
  fixture_type text NOT NULL DEFAULT 'league_match'
    CHECK (fixture_type IN ('league_match', 'time_trial_session', 'group_run_session')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'submitted', 'confirmed', 'finalized', 'disputed', 'cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_fixtures_league_id ON league_fixtures(league_id);
CREATE INDEX IF NOT EXISTS idx_league_fixtures_week_number ON league_fixtures(week_number);
CREATE INDEX IF NOT EXISTS idx_league_fixtures_status ON league_fixtures(status);

-- Optional participant slots by fixture side (A/B)
CREATE TABLE IF NOT EXISTS league_fixture_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES league_fixtures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side text CHECK (side IN ('A', 'B')),
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'captain')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fixture_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_fixture_participants_fixture_id ON league_fixture_participants(fixture_id);
CREATE INDEX IF NOT EXISTS idx_league_fixture_participants_user_id ON league_fixture_participants(user_id);

-- 3) Result workflow
CREATE TABLE IF NOT EXISTS result_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES league_fixtures(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'participant' CHECK (source IN ('organizer', 'participant')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'superseded')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_note text
);

CREATE INDEX IF NOT EXISTS idx_result_submissions_fixture_id ON result_submissions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_result_submissions_status ON result_submissions(status);
CREATE INDEX IF NOT EXISTS idx_result_submissions_submitted_by ON result_submissions(submitted_by);

CREATE TABLE IF NOT EXISTS result_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES result_submissions(id) ON DELETE CASCADE,
  fixture_id uuid NOT NULL REFERENCES league_fixtures(id) ON DELETE CASCADE,
  confirmed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirming_side text NOT NULL CHECK (confirming_side IN ('A', 'B', 'organizer')),
  decision text NOT NULL CHECK (decision IN ('confirm', 'reject')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, confirmed_by)
);

CREATE INDEX IF NOT EXISTS idx_result_confirmations_submission_id ON result_confirmations(submission_id);
CREATE INDEX IF NOT EXISTS idx_result_confirmations_fixture_id ON result_confirmations(fixture_id);

-- 4) Membership QR credentials + fixture check-ins
CREATE TABLE IF NOT EXISTS member_qr_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  token_version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_rotated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_id, user_id, token_version)
);

CREATE INDEX IF NOT EXISTS idx_member_qr_credentials_active
  ON member_qr_credentials(league_id, user_id, is_active);

CREATE TABLE IF NOT EXISTS fixture_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES league_fixtures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('organizer_scan', 'self_checkin')),
  status text NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'verified', 'rejected')),
  notes text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fixture_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fixture_checkins_fixture_id ON fixture_checkins(fixture_id);
CREATE INDEX IF NOT EXISTS idx_fixture_checkins_user_id ON fixture_checkins(user_id);

-- 5) Running sessions and submissions
CREATE TABLE IF NOT EXISTS running_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  week_number integer,
  session_type text NOT NULL DEFAULT 'group_run'
    CHECK (session_type IN ('time_trial', 'group_run', 'interval')),
  distance_meters integer,
  route_name text,
  surface_type text CHECK (surface_type IN ('road', 'trail', 'track')),
  elevation_profile text CHECK (elevation_profile IN ('flat', 'mixed', 'hilly')),
  starts_at timestamptz,
  submission_deadline timestamptz,
  comparison_mode text NOT NULL DEFAULT 'absolute_performance'
    CHECK (comparison_mode IN ('absolute_performance', 'personal_progress')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'open', 'closed', 'finalized')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_running_sessions_league_id ON running_sessions(league_id);
CREATE INDEX IF NOT EXISTS idx_running_sessions_status ON running_sessions(status);

CREATE TABLE IF NOT EXISTS session_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES running_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elapsed_seconds numeric NOT NULL CHECK (elapsed_seconds > 0),
  distance_meters integer NOT NULL CHECK (distance_meters > 0),
  proof_url text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'rejected', 'finalized')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_runs_session_id ON session_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_runs_user_id ON session_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_runs_status ON session_runs(status);

-- 6) RLS policies
ALTER TABLE league_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_fixture_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_qr_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_runs ENABLE ROW LEVEL SECURITY;

-- league_fixtures
DROP POLICY IF EXISTS "Members can view fixtures" ON league_fixtures;
CREATE POLICY "Members can view fixtures" ON league_fixtures FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_fixtures.league_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin can manage fixtures" ON league_fixtures;
CREATE POLICY "Owner/admin can manage fixtures" ON league_fixtures FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_fixtures.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_fixtures.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- league_fixture_participants
DROP POLICY IF EXISTS "Members can view fixture participants" ON league_fixture_participants;
CREATE POLICY "Members can view fixture participants" ON league_fixture_participants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = league_fixture_participants.fixture_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin can manage fixture participants" ON league_fixture_participants;
CREATE POLICY "Owner/admin can manage fixture participants" ON league_fixture_participants FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = league_fixture_participants.fixture_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = league_fixture_participants.fixture_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- result_submissions
DROP POLICY IF EXISTS "Members can view result submissions" ON result_submissions;
CREATE POLICY "Members can view result submissions" ON result_submissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = result_submissions.fixture_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can submit results" ON result_submissions;
CREATE POLICY "Members can submit results" ON result_submissions FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = result_submissions.fixture_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Submitter or owner/admin can update results" ON result_submissions;
CREATE POLICY "Submitter or owner/admin can update results" ON result_submissions FOR UPDATE TO authenticated
USING (
  submitted_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = result_submissions.fixture_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- result_confirmations
DROP POLICY IF EXISTS "Members can view result confirmations" ON result_confirmations;
CREATE POLICY "Members can view result confirmations" ON result_confirmations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = result_confirmations.fixture_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can create result confirmations" ON result_confirmations;
CREATE POLICY "Members can create result confirmations" ON result_confirmations FOR INSERT TO authenticated
WITH CHECK (
  confirmed_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = result_confirmations.fixture_id
      AND mem.user_id = auth.uid()
  )
);

-- member_qr_credentials
DROP POLICY IF EXISTS "Members can view own QR credentials" ON member_qr_credentials;
CREATE POLICY "Members can view own QR credentials" ON member_qr_credentials FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = member_qr_credentials.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owner/admin can manage QR credentials" ON member_qr_credentials;
CREATE POLICY "Owner/admin can manage QR credentials" ON member_qr_credentials FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = member_qr_credentials.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = member_qr_credentials.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- fixture_checkins
DROP POLICY IF EXISTS "Members can view fixture checkins" ON fixture_checkins;
CREATE POLICY "Members can view fixture checkins" ON fixture_checkins FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = fixture_checkins.fixture_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin or self can create checkins" ON fixture_checkins;
CREATE POLICY "Owner/admin or self can create checkins" ON fixture_checkins FOR INSERT TO authenticated
WITH CHECK (
  (
    source = 'self_checkin'
    AND user_id = auth.uid()
    AND checked_in_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = fixture_checkins.fixture_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owner/admin can update checkins" ON fixture_checkins;
CREATE POLICY "Owner/admin can update checkins" ON fixture_checkins FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_fixtures f
    JOIN league_members mem ON mem.league_id = f.league_id
    WHERE f.id = fixture_checkins.fixture_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- running_sessions
DROP POLICY IF EXISTS "Members can view running sessions" ON running_sessions;
CREATE POLICY "Members can view running sessions" ON running_sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = running_sessions.league_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin can manage running sessions" ON running_sessions;
CREATE POLICY "Owner/admin can manage running sessions" ON running_sessions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = running_sessions.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = running_sessions.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

-- session_runs
DROP POLICY IF EXISTS "Members can view session runs" ON session_runs;
CREATE POLICY "Members can view session runs" ON session_runs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM running_sessions rs
    JOIN league_members mem ON mem.league_id = rs.league_id
    WHERE rs.id = session_runs.session_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can submit own runs" ON session_runs;
CREATE POLICY "Members can submit own runs" ON session_runs FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM running_sessions rs
    JOIN league_members mem ON mem.league_id = rs.league_id
    WHERE rs.id = session_runs.session_id
      AND mem.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner/admin can review runs" ON session_runs;
CREATE POLICY "Owner/admin can review runs" ON session_runs FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM running_sessions rs
    JOIN league_members mem ON mem.league_id = rs.league_id
    WHERE rs.id = session_runs.session_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);
