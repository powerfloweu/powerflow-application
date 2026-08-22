-- Applications to become a PowerFlow affiliated coach.
--
-- Public, unauthenticated form at /coaches/apply. Applicants are coaches from
-- outside the platform, so rows here are NOT tied to profiles(id) and there is
-- deliberately no FK to auth.users — most applicants have no account, and the
-- ones who do should not be treated differently.
--
-- Same shape and same defences as seminar_signups: per-IP rate limit, honeypot,
-- whitelist validation, unique index on (lower(email)).
--
-- RLS is enabled with NO policies on purpose. Every read/write goes through the
-- service-role key, which bypasses RLS, so a leaked anon key still yields
-- nothing. These rows are names, email addresses, CVs and free-text motivation
-- from people outside the app — anon must never reach them.

CREATE TABLE IF NOT EXISTS coach_applications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      text        NOT NULL,
  email          text        NOT NULL,
  -- Country id from lib/countries.ts, e.g. "IE", "US-ET".
  country        text,
  instagram      text,
  website        text,
  -- See QUALIFICATIONS in lib/coachApply.ts
  qualification  text,
  -- See EXPERIENCE_BANDS in lib/coachApply.ts
  experience     text,
  -- Locale ids they can coach in, e.g. ["en","de"]
  languages      jsonb       NOT NULL DEFAULT '[]',
  -- Free text: who they currently work with
  athletes       text,
  -- Free text: why PowerFlow. Required by the form.
  motivation     text        NOT NULL,
  status         text        NOT NULL DEFAULT 'new'
                             CHECK (status IN ('new', 'reviewing', 'accepted', 'declined')),
  -- Owner-only working notes. Never shown to the applicant.
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- One live application per person. Case-insensitive: the API lowercases on
-- write, this index is the backstop.
CREATE UNIQUE INDEX IF NOT EXISTS coach_applications_email_uniq
  ON coach_applications (lower(email));

CREATE INDEX IF NOT EXISTS coach_applications_status_idx
  ON coach_applications (status, created_at DESC);

ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies — service-role only. See header comment.
