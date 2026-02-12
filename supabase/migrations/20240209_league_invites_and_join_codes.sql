-- League invite codes + email invite tracking

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_league_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM leagues
      WHERE invite_code = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS invite_code text;

ALTER TABLE leagues
  ALTER COLUMN invite_code SET DEFAULT generate_league_invite_code();

UPDATE leagues
SET invite_code = generate_league_invite_code()
WHERE invite_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leagues_invite_code_unique
  ON leagues(invite_code)
  WHERE invite_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS league_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  expires_at timestamptz,
  UNIQUE(league_id, email)
);

CREATE INDEX IF NOT EXISTS idx_league_invites_league_id ON league_invites(league_id);
CREATE INDEX IF NOT EXISTS idx_league_invites_status ON league_invites(status);
CREATE INDEX IF NOT EXISTS idx_league_invites_email ON league_invites(email);

ALTER TABLE league_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner/admin can view invites" ON league_invites;
CREATE POLICY "Owner/admin can view invites" ON league_invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_invites.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Invitee can view own invites" ON league_invites;
CREATE POLICY "Invitee can view own invites" ON league_invites FOR SELECT TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "Owner/admin can insert invites" ON league_invites;
CREATE POLICY "Owner/admin can insert invites" ON league_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_invites.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owner/admin can update invites" ON league_invites;
CREATE POLICY "Owner/admin can update invites" ON league_invites FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_invites.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_invites.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Invitee can accept own invite" ON league_invites;
CREATE POLICY "Invitee can accept own invite" ON league_invites FOR UPDATE TO authenticated
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND claimed_by = auth.uid()
);

DROP POLICY IF EXISTS "Owner/admin can delete invites" ON league_invites;
CREATE POLICY "Owner/admin can delete invites" ON league_invites FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM league_members mem
    WHERE mem.league_id = league_invites.league_id
      AND mem.user_id = auth.uid()
      AND mem.role IN ('owner', 'admin')
  )
);
