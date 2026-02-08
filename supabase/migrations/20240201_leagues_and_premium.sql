-- 1. Add premium flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- 2. Leagues
CREATE TABLE leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sport_type text NOT NULL,
  scoring_format text NOT NULL CHECK (scoring_format IN ('team_vs_team', 'individual_time', 'individual_points')),
  league_type text NOT NULL CHECK (league_type IN ('season', 'ongoing')),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 20,
  start_date date,
  end_date date,
  season_weeks integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leagues_creator_id ON leagues(creator_id);

-- 3. League members
CREATE TABLE league_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_id, user_id)
);
CREATE INDEX idx_league_members_user_id ON league_members(user_id);
CREATE INDEX idx_league_members_league_id ON league_members(league_id);

-- 4. Matches
CREATE TABLE league_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  week_number integer,
  match_date date,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_league_matches_league_id ON league_matches(league_id);

-- 5. Match participants / results (unified for all scoring formats)
CREATE TABLE match_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES league_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team text CHECK (team IN ('A', 'B')),
  score numeric,
  time_seconds numeric,
  points numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);
CREATE INDEX idx_match_participants_match_id ON match_participants(match_id);

-- 6. RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- Leagues: anyone can view, only premium can create, owner can update/delete
CREATE POLICY "Anyone can view leagues" ON leagues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Premium users can create leagues" ON leagues FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_premium = true));
CREATE POLICY "Owner can update league" ON leagues FOR UPDATE TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Owner can delete league" ON leagues FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- League members
CREATE POLICY "Anyone can view members" ON league_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner/admin or self can insert" ON league_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM league_members WHERE league_id = league_members.league_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Self or owner can delete" ON league_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM league_members lm WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid() AND lm.role IN ('owner', 'admin')));
CREATE POLICY "Owner can update roles" ON league_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM league_members lm WHERE lm.league_id = league_members.league_id AND lm.user_id = auth.uid() AND lm.role = 'owner'));

-- Matches
CREATE POLICY "Anyone can view matches" ON league_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner/admin can create matches" ON league_matches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM league_members WHERE league_id = league_matches.league_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Owner/admin can update matches" ON league_matches FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = league_matches.league_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Owner/admin can delete matches" ON league_matches FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM league_members WHERE league_id = league_matches.league_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Match participants
CREATE POLICY "Anyone can view results" ON match_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner/admin can record results" ON match_participants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM league_matches lm JOIN league_members mem ON mem.league_id = lm.league_id WHERE lm.id = match_participants.match_id AND mem.user_id = auth.uid() AND mem.role IN ('owner', 'admin')));
CREATE POLICY "Owner/admin can update results" ON match_participants FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM league_matches lm JOIN league_members mem ON mem.league_id = lm.league_id WHERE lm.id = match_participants.match_id AND mem.user_id = auth.uid() AND mem.role IN ('owner', 'admin')));
CREATE POLICY "Owner/admin can delete results" ON match_participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM league_matches lm JOIN league_members mem ON mem.league_id = lm.league_id WHERE lm.id = match_participants.match_id AND mem.user_id = auth.uid() AND mem.role IN ('owner', 'admin')));
