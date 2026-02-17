-- Add editable profile fields used by /users/[id]
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS bio text;

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}'::text[];

-- Safety backfill in case the column exists but has nulls
UPDATE public.profiles
SET gallery_urls = '{}'::text[]
WHERE gallery_urls IS NULL;
