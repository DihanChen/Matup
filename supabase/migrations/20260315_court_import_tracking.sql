ALTER TABLE courts
  ADD COLUMN IF NOT EXISTS imported_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_courts_last_seen_at ON courts(last_seen_at DESC);
