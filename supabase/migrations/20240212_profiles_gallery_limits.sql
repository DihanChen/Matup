DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_gallery_urls_max_items'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_gallery_urls_max_items
    CHECK (cardinality(gallery_urls) <= 9);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_gallery_urls_no_null_items'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_gallery_urls_no_null_items
    CHECK (array_position(gallery_urls, NULL) IS NULL);
  END IF;
END $$;
