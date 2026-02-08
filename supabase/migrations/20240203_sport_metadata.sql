-- Sport-specific metadata for events and leagues
-- Stores running/tennis/common fields as JSONB for flexible sport support
-- Existing events/leagues without metadata default to empty object

-- 1. Add metadata to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 2. Add metadata to leagues (for future sport-specific league config)
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 3. Index for querying by sport metadata (GIN index for JSONB containment queries)
CREATE INDEX IF NOT EXISTS idx_events_metadata ON events USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_leagues_metadata ON leagues USING gin (metadata);
