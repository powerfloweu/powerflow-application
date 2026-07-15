-- Coach AI digests: a periodic loop reads each athlete's recent journal entries
-- and produces (a) a trend summary and (b) a drafted coach message in the
-- PowerFlow coaching-AI voice. The coach reviews the draft — nothing is sent
-- automatically. Deduped by the newest entry included, so a digest is only
-- (re)generated when the athlete has written something new.

CREATE TABLE IF NOT EXISTS coach_digests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start    date        NOT NULL,
  period_end      date        NOT NULL,
  entry_count     int         NOT NULL,
  latest_entry_at timestamptz NOT NULL,          -- dedup key: newest entry included
  summary         text        NOT NULL,
  draft_message   text        NOT NULL,
  model           text,
  status          text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'used', 'dismissed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, latest_entry_at)
);

CREATE INDEX IF NOT EXISTS coach_digests_coach_idx
  ON coach_digests (coach_id, status, created_at DESC);

ALTER TABLE coach_digests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "coach_digests_own" ON coach_digests FOR ALL USING (auth.uid() = coach_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
