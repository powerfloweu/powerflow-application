-- Coach-authored reflection sets ("From your coach").
--
-- A coach writes a small, bespoke set of open-ended questions for one
-- athlete (e.g. "Becoming a coach", "Imposter feelings"), the athlete
-- answers at their own pace (partial answers are normal — never gated on
-- completeness), and a note thread accumulates alongside the set so either
-- side can add a written or voice note over time.
--
-- Recombination of existing patterns, not a new mechanism:
--   reflection_sets    ~ shape of assigned_tests / tool_suggestions (coach → athlete, ownership-checked)
--   reflection_answers ~ shape of meet_reflections (JSONB answers keyed by question id, upsert-merge)
--   reflection_notes   ~ shape of checkin_feedback (text + audio_url), but threaded (many rows, not one)
--
-- This is the most sensitive table in the app content-wise (imposter
-- feelings, rejection, self-worth) — RLS is athlete-own + coach-of-that-
-- athlete only, no broader read path.

-- ── reflection_sets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reflection_sets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  intro       text,
  questions   jsonb       NOT NULL DEFAULT '[]',  -- [{ id, prompt, helper?, kind: "text"|"commitment" }]
  status      text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz
);

CREATE INDEX IF NOT EXISTS reflection_sets_coach_idx   ON reflection_sets (coach_id);
CREATE INDEX IF NOT EXISTS reflection_sets_athlete_idx ON reflection_sets (athlete_id, status);

ALTER TABLE reflection_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reflection_sets_coach_all"    ON reflection_sets;
DROP POLICY IF EXISTS "reflection_sets_athlete_read" ON reflection_sets;
CREATE POLICY "reflection_sets_coach_all" ON reflection_sets
  FOR ALL USING (auth.uid() = coach_id);
-- Athletes never see a draft — only once the coach has sent it.
CREATE POLICY "reflection_sets_athlete_read" ON reflection_sets
  FOR SELECT USING (auth.uid() = athlete_id AND status <> 'draft');

-- ── reflection_answers ───────────────────────────────────────────────────────
-- One row per set. `athlete_id` is denormalised (also derivable via
-- reflection_set_id → reflection_sets.athlete_id) to keep RLS and simple
-- querying fast without a join, matching meet_reflections' shape.
CREATE TABLE IF NOT EXISTS reflection_answers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_set_id uuid        NOT NULL REFERENCES reflection_sets(id) ON DELETE CASCADE,
  athlete_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers           jsonb       NOT NULL DEFAULT '{}',  -- { [questionId]: string }
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reflection_set_id)
);

CREATE INDEX IF NOT EXISTS reflection_answers_athlete_idx ON reflection_answers (athlete_id);

ALTER TABLE reflection_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reflection_answers_athlete_all" ON reflection_answers;
DROP POLICY IF EXISTS "reflection_answers_coach_read"  ON reflection_answers;
CREATE POLICY "reflection_answers_athlete_all" ON reflection_answers
  FOR ALL USING (auth.uid() = athlete_id);
CREATE POLICY "reflection_answers_coach_read" ON reflection_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reflection_sets rs
      WHERE rs.id = reflection_answers.reflection_set_id
        AND rs.coach_id = auth.uid()
    )
  );

-- ── reflection_notes ─────────────────────────────────────────────────────────
-- Threaded "ongoing note" — many rows per set, both coach and athlete can
-- author. Not a single notes column: the whole point is that it accumulates.
CREATE TABLE IF NOT EXISTS reflection_notes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_set_id uuid        NOT NULL REFERENCES reflection_sets(id) ON DELETE CASCADE,
  author_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body              text,
  audio_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reflection_notes_set_idx ON reflection_notes (reflection_set_id, created_at);

ALTER TABLE reflection_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reflection_notes_author_own"  ON reflection_notes;
DROP POLICY IF EXISTS "reflection_notes_thread_read" ON reflection_notes;
-- Either party can write, but only as themselves, and only into a thread on
-- a set that actually involves them (their own coaching relationship).
CREATE POLICY "reflection_notes_author_own" ON reflection_notes
  FOR ALL USING (auth.uid() = author_id)
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM reflection_sets rs
      WHERE rs.id = reflection_notes.reflection_set_id
        AND (rs.coach_id = auth.uid() OR rs.athlete_id = auth.uid())
    )
  );
-- Either party can read the whole thread (not just their own notes).
CREATE POLICY "reflection_notes_thread_read" ON reflection_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reflection_sets rs
      WHERE rs.id = reflection_notes.reflection_set_id
        AND (rs.coach_id = auth.uid() OR rs.athlete_id = auth.uid())
    )
  );
