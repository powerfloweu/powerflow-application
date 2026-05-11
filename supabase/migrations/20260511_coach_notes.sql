-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Coach notes on athletes
--
-- Adds coach_notes (free-text) to profiles.
-- Written by admin/coach, injected into Coach AI system prompt.
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coach_notes text;

NOTIFY pgrst, 'reload schema';
