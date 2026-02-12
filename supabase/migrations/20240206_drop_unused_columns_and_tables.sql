-- Drop unused columns and tables
-- These were either never wired up in application code or belong to
-- the removed push-notification system.

-- 1. Drop unused columns
ALTER TABLE events DROP COLUMN IF EXISTS metadata;
ALTER TABLE events DROP COLUMN IF EXISTS reminder_minutes;
ALTER TABLE leagues DROP COLUMN IF EXISTS metadata;
ALTER TABLE leagues DROP COLUMN IF EXISTS end_date;

-- 2. Drop associated indexes (metadata GIN indexes from migration 20240203)
DROP INDEX IF EXISTS idx_events_metadata;
DROP INDEX IF EXISTS idx_leagues_metadata;

-- 3. Drop orphaned push-notification tables (service was removed)
DROP TABLE IF EXISTS event_reminders;
DROP TABLE IF EXISTS push_subscriptions;
