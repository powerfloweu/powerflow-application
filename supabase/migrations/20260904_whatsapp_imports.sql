-- WhatsApp imports: coach-uploaded chat exports attached to one athlete.
-- The import row holds coach-only psychological analysis; messages are stored
-- separately so future session prep can query recent excerpts without reparsing.

CREATE TABLE IF NOT EXISTS whatsapp_imports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name         text,
  file_hash         text        NOT NULL,
  message_count     integer     NOT NULL DEFAULT 0,
  period_start      timestamptz,
  period_end        timestamptz,
  participant_names text[]      NOT NULL DEFAULT '{}'::text[],
  analysis          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  model             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id, file_hash)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id    uuid        NOT NULL REFERENCES whatsapp_imports(id) ON DELETE CASCADE,
  coach_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at      timestamptz,
  sender_name  text        NOT NULL,
  sender_role  text        NOT NULL DEFAULT 'unknown',
  content      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_role IN ('athlete', 'coach', 'unknown'))
);

CREATE INDEX IF NOT EXISTS whatsapp_imports_coach_athlete_idx
  ON whatsapp_imports (coach_id, athlete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_messages_athlete_sent_idx
  ON whatsapp_messages (athlete_id, sent_at DESC);

ALTER TABLE whatsapp_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_imports_coach_all" ON whatsapp_imports;
CREATE POLICY "whatsapp_imports_coach_all"
  ON whatsapp_imports
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "whatsapp_messages_coach_all" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages_coach_all"
  ON whatsapp_messages
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_imports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_messages TO authenticated;

NOTIFY pgrst, 'reload schema';
