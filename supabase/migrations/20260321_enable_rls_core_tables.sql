-- Enable RLS on tables that already have policies but RLS was never turned on
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- events: public read, creator can insert/update/delete
-- ============================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creator can update own events" ON events
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creator can delete own events" ON events
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- ============================================================
-- event_participants: public read, user can join/leave,
-- event creator can remove participants
-- ============================================================
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join events" ON event_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can leave or creator can remove participants" ON event_participants
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- ============================================================
-- event_comments: public read, authenticated users can comment
-- ============================================================
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event comments" ON event_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON event_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON event_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- profiles: public read, users can manage own profile
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- reviews: authenticated read own + reviewed, insert own
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews they wrote or received" ON reviews
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR reviewed_id = auth.uid());

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());
