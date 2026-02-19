CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  sport_types text[] NOT NULL DEFAULT '{}'::text[],
  image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courts_created_by ON courts(created_by);
CREATE INDEX IF NOT EXISTS idx_courts_status ON courts(status);
CREATE INDEX IF NOT EXISTS idx_courts_latitude_longitude ON courts(latitude, longitude);

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view approved courts or own courts" ON courts;
CREATE POLICY "Users can view approved courts or own courts" ON courts
FOR SELECT TO authenticated
USING (status = 'approved' OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own pending courts" ON courts;
CREATE POLICY "Users can insert own pending courts" ON courts
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Users can update own pending courts" ON courts;
CREATE POLICY "Users can update own pending courts" ON courts
FOR UPDATE TO authenticated
USING (created_by = auth.uid() AND status = 'pending')
WITH CHECK (created_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete own pending courts" ON courts;
CREATE POLICY "Users can delete own pending courts" ON courts
FOR DELETE TO authenticated
USING (created_by = auth.uid() AND status = 'pending');

ALTER TABLE events
ADD COLUMN IF NOT EXISTS court_id uuid REFERENCES courts(id) ON DELETE SET NULL;
