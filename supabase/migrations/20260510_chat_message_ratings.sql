-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Chat message ratings
--
-- Creates:
--   chat_message_ratings — per-message thumbs up/down from athletes
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_message_ratings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('good', 'bad')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_message_ratings_user_id
  ON chat_message_ratings (user_id, created_at DESC);

ALTER TABLE chat_message_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_message_ratings_self" ON chat_message_ratings;
CREATE POLICY "chat_message_ratings_self"
  ON chat_message_ratings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
