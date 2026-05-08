-- Add translator_access flag to profiles.
-- Allows master admin to grant translation editor access to any user
-- directly from the admin dashboard, without touching env vars.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS translator_access boolean NOT NULL DEFAULT false;
