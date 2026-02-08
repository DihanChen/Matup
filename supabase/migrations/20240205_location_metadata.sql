-- Add location_name and address_line columns to events table
-- location_name: primary venue/place name (e.g. "Central Park")
-- address_line: secondary address text (e.g. "Manhattan, New York, NY, USA")

ALTER TABLE events ADD COLUMN IF NOT EXISTS location_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS address_line text;
