-- Extend courts table for OSM data and enrichments
ALTER TABLE courts
  ADD COLUMN IF NOT EXISTS osm_id bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS osm_type text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS surface text,
  ADD COLUMN IF NOT EXISTS num_courts smallint,
  ADD COLUMN IF NOT EXISTS lighting boolean,
  ADD COLUMN IF NOT EXISTS access_type text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS operator text,
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS average_rating numeric(2,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Allow null created_by for OSM-sourced courts
ALTER TABLE courts ALTER COLUMN created_by DROP NOT NULL;

-- Index for OSM lookups
CREATE INDEX IF NOT EXISTS idx_courts_osm_id ON courts(osm_id) WHERE osm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courts_source ON courts(source);

-- Court reviews table
CREATE TABLE IF NOT EXISTS court_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(court_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_court_reviews_court_id ON court_reviews(court_id);

-- RLS for court_reviews
ALTER TABLE court_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable" ON court_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON court_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON court_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON court_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update denormalized rating on courts
CREATE OR REPLACE FUNCTION update_court_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courts SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM court_reviews
      WHERE court_id = COALESCE(NEW.court_id, OLD.court_id)
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM court_reviews
      WHERE court_id = COALESCE(NEW.court_id, OLD.court_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.court_id, OLD.court_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_court_review_stats ON court_reviews;
CREATE TRIGGER trg_court_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON court_reviews
  FOR EACH ROW EXECUTE FUNCTION update_court_rating_stats();

-- Update courts SELECT RLS to allow viewing OSM courts
DROP POLICY IF EXISTS "Users can view approved courts or own courts" ON courts;
CREATE POLICY "Users can view approved courts or own courts" ON courts
  FOR SELECT TO authenticated
  USING (status = 'approved' OR created_by = auth.uid());
