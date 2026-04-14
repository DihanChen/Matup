-- League in-app announcements

CREATE TABLE IF NOT EXISTS league_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_announcements_league_id ON league_announcements(league_id);

-- RLS
ALTER TABLE league_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "League members can view announcements" ON league_announcements;
CREATE POLICY "League members can view announcements" ON league_announcements FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM league_members
    WHERE league_members.league_id = league_announcements.league_id
    AND league_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "League owner/admin can create announcements" ON league_announcements;
CREATE POLICY "League owner/admin can create announcements" ON league_announcements FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM league_members
    WHERE league_members.league_id = league_announcements.league_id
    AND league_members.user_id = auth.uid()
    AND league_members.role IN ('owner', 'admin')
  )
);
