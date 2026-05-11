-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Coach application questionnaire + rejected status
--
-- Changes:
--   1. Extend coach_status to include 'rejected'
--   2. Add coach_application JSONB column for pre-approval questionnaire answers
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the old check constraint and recreate with 'rejected' included
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_coach_status_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_coach_status_check
  CHECK (coach_status IN ('pending', 'approved', 'rejected'));

-- 2. Add coach_application JSONB column (stores questionnaire answers)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coach_application jsonb;

NOTIFY pgrst, 'reload schema';
