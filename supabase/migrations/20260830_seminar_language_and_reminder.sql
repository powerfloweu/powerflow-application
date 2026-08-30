-- Preferred language and reminder tracking for seminar sign-ups.
--
-- Language: the session runs in a language only if enough people pick it (see
-- MIN_PER_LANGUAGE in lib/seminar.ts). Everyone else joins the English one, so
-- this is a preference, not a promise — the form says so.
--
-- reminder_sent_at makes the reminder cron idempotent. Without it a re-run,
-- a retry, or two overlapping fires would email the same person twice, and a
-- duplicate reminder reads as disorganised to someone deciding whether to
-- give you their Saturday morning.

ALTER TABLE seminar_signups
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS reminder_sent_at   timestamptz;

-- The cron scans for registered people who have not been reminded yet.
CREATE INDEX IF NOT EXISTS seminar_signups_reminder_idx
  ON seminar_signups (seminar_slug, status, reminder_sent_at);

-- Rows created before this column existed belong to the English session, which
-- is the same default the validator applies to new sign-ups.
UPDATE seminar_signups SET preferred_language = 'en' WHERE preferred_language IS NULL;
