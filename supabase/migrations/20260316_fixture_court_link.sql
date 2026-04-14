-- Link fixtures to courts and add default court to leagues

-- Add court_id to league_fixtures
ALTER TABLE league_fixtures
  ADD COLUMN IF NOT EXISTS court_id uuid REFERENCES courts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_league_fixtures_court_id ON league_fixtures(court_id);

-- Add default_court_id to leagues
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS default_court_id uuid REFERENCES courts(id) ON DELETE SET NULL;
