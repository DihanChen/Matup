-- Multi-season support for leagues
CREATE TABLE IF NOT EXISTS league_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_number INT NOT NULL,
  name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE (league_id, season_number)
);

CREATE INDEX idx_league_seasons_league ON league_seasons(league_id);

-- Add season_id to league_fixtures (nullable for backward compatibility)
ALTER TABLE league_fixtures ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES league_seasons(id);
CREATE INDEX IF NOT EXISTS idx_league_fixtures_season ON league_fixtures(season_id);

-- Add current_season_id to leagues for quick lookup
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS current_season_id UUID REFERENCES league_seasons(id);

-- RLS
ALTER TABLE league_seasons ENABLE ROW LEVEL SECURITY;

-- Members can read seasons
CREATE POLICY "league_seasons_select" ON league_seasons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_seasons.league_id
        AND league_members.user_id = auth.uid()
    )
  );

-- Owner/admin can create seasons
CREATE POLICY "league_seasons_insert" ON league_seasons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_seasons.league_id
        AND league_members.user_id = auth.uid()
        AND league_members.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can update seasons
CREATE POLICY "league_seasons_update" ON league_seasons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_seasons.league_id
        AND league_members.user_id = auth.uid()
        AND league_members.role IN ('owner', 'admin')
    )
  );
