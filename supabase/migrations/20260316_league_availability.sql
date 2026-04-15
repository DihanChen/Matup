-- Player availability tracking per league per week
CREATE TABLE IF NOT EXISTS league_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('available', 'unavailable', 'maybe', 'unknown')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id, week_number)
);

CREATE INDEX idx_league_availability_league ON league_availability(league_id);
CREATE INDEX idx_league_availability_user ON league_availability(user_id);

-- RLS
ALTER TABLE league_availability ENABLE ROW LEVEL SECURITY;

-- Members can read availability for their leagues
CREATE POLICY "league_availability_select" ON league_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_availability.league_id
        AND league_members.user_id = auth.uid()
    )
  );

-- Users can insert/update their own availability
CREATE POLICY "league_availability_insert" ON league_availability
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_availability.league_id
        AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "league_availability_update" ON league_availability
  FOR UPDATE USING (auth.uid() = user_id);
