-- Add user language preference (i18n).
-- Allowed values: 'en', 'de', 'hu'. Default 'en' for safety.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'
  CHECK (language IN ('en', 'de', 'hu'));

-- Force PostgREST to pick up the new column without a project restart.
NOTIFY pgrst, 'reload schema';
