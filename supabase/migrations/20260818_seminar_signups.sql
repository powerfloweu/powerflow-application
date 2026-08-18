-- Sign-ups for the "Mental Performance for Coaches" seminar.
--
-- Public, unauthenticated form at /seminar — anyone with the link can register,
-- so rows here are NOT tied to profiles(id) and there is deliberately no FK to
-- auth.users. Most registrants will not have a PowerFlow account.
--
-- Capacity is a soft cap enforced in the API, not a constraint: once
-- SEMINAR.maxParticipants rows have status 'registered', further sign-ups land
-- as 'waitlist' and the owner promotes them by hand from the admin tab.
--
-- RLS is enabled with NO policies on purpose. Every read/write goes through the
-- service-role key in /api/seminar and /api/admin/seminar, which bypasses RLS.
-- Leaving the table policy-less means a leaked anon key still yields nothing —
-- this table is a list of names, email addresses and free-text questions from
-- people outside the app, so anon must never reach it.

CREATE TABLE IF NOT EXISTS seminar_signups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Which seminar. Lets the same table serve a second run without a migration.
  seminar_slug text        NOT NULL,
  full_name    text        NOT NULL,
  email        text        NOT NULL,
  country      text,
  -- What they coach: see COACHING_CONTEXTS in lib/seminar.ts
  context      text,
  -- Topic ids from SEMINAR_TOPICS, e.g. ["arousal","burnout"]
  topics       jsonb       NOT NULL DEFAULT '[]',
  -- "workshop" | "seminar_qa" | "no_preference" | null
  format_pref  text,
  -- Follow-up material preference: ["written"], ["video"], both or neither
  materials    jsonb       NOT NULL DEFAULT '[]',
  -- Free text: anything specific they want covered
  question     text,
  status       text        NOT NULL DEFAULT 'registered'
                           CHECK (status IN ('registered', 'waitlist', 'cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One sign-up per email per seminar. Case-insensitive: the API lowercases on
-- write, this index is the backstop.
CREATE UNIQUE INDEX IF NOT EXISTS seminar_signups_email_uniq
  ON seminar_signups (seminar_slug, lower(email));

-- The two hot reads: the public spots-left count and the admin list.
CREATE INDEX IF NOT EXISTS seminar_signups_slug_status_idx
  ON seminar_signups (seminar_slug, status);

ALTER TABLE seminar_signups ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies — service-role only. See header comment.
