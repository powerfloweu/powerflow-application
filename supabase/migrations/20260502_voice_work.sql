-- Voice Work (Beta) — PR 1 schema
-- Adds voices, voice_drafts tables; extends profiles and journal_entries.

-- ── profiles: self_talk_mode ──────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS self_talk_mode TEXT NOT NULL DEFAULT 'classic'
  CHECK (self_talk_mode IN ('classic', 'beta_voice_work'));

-- ── journal_entries: voice linking + reframe fields ───────────────────────────

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS voice_id             UUID        REFERENCES voices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reframe_text         TEXT,
  ADD COLUMN IF NOT EXISTS reframe_test_due     DATE,
  ADD COLUMN IF NOT EXISTS reframe_test_resolved TEXT       CHECK (reframe_test_resolved IN ('true', 'false'));

-- ── voices ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voices (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name                     TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),

  -- Visual identity (Step 3)
  shape                    TEXT        NOT NULL DEFAULT 'cloud'
                           CHECK (shape IN ('cloud','orb','beam','blade','fog','spike','thread','custom')),
  shape_custom_description TEXT,
  color                    TEXT        NOT NULL DEFAULT '#A78BFA',
  size                     SMALLINT    NOT NULL DEFAULT 3 CHECK (size BETWEEN 1 AND 5),

  -- Somatic identity (Step 2)
  tone                     SMALLINT    NOT NULL DEFAULT 50 CHECK (tone BETWEEN 0 AND 100),
  volume                   SMALLINT    NOT NULL DEFAULT 50 CHECK (volume BETWEEN 0 AND 100),
  body_locations           TEXT[]      NOT NULL DEFAULT '{}',

  -- Spatial placement (Step 4)
  current_distance         TEXT        NOT NULL DEFAULT 'close'
                           CHECK (current_distance IN ('on','close','arm','meters','gone')),
  current_side             TEXT        NOT NULL DEFAULT 'front'
                           CHECK (current_side IN ('front','back','left','right')),
  desired_distance         TEXT        NOT NULL DEFAULT 'arm'
                           CHECK (desired_distance IN ('on','close','arm','meters','gone')),
  desired_side             TEXT        NOT NULL DEFAULT 'front'
                           CHECK (desired_side IN ('front','back','left','right')),

  -- Purpose (Step 5)
  helps_when               TEXT[]      NOT NULL DEFAULT '{}',
  helps_note               TEXT        NOT NULL DEFAULT '',

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voices_user_id_updated_at_idx
  ON voices (user_id, updated_at DESC);

-- ── voice_drafts ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_drafts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  editing_voice_id  UUID        REFERENCES voices(id) ON DELETE CASCADE,
  state             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS voice_drafts_user_new_voice_idx
  ON voice_drafts (user_id) WHERE editing_voice_id IS NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE voices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voices: own rows"        ON voices;
DROP POLICY IF EXISTS "voices: coach sees athletes" ON voices;
DROP POLICY IF EXISTS "voice_drafts: own rows"  ON voice_drafts;

CREATE POLICY "voices: own rows"
  ON voices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "voices: coach sees athletes"
  ON voices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = voices.user_id
        AND coach_id = auth.uid()
    )
  );

CREATE POLICY "voice_drafts: own rows"
  ON voice_drafts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Fix forward-reference: journal_entries.voice_id references voices ─────────
-- (The ALTER TABLE above may fail if voices didn't exist yet; this is safe to
--  re-run because of ADD COLUMN IF NOT EXISTS.)
