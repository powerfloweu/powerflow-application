-- Add course_access flag to profiles.
-- Default false — must be explicitly granted by a coach or admin.
-- Athletes cannot self-grant via the PATCH /api/me allowlist.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS course_access boolean NOT NULL DEFAULT false;
