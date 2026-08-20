-- Self-service management link for seminar sign-ups.
--
-- The confirmation email carries /seminar/manage/<token>, where the registrant
-- can change their topic picks or cancel without emailing anyone. The token is
-- the capability: it is the only credential, since these people have no
-- PowerFlow account to authenticate against.
--
-- It is separate from `id` on purpose. The id travels through admin URLs, logs
-- and error reports; the token appears only in the email and the manage URL, so
-- the two can be reasoned about — and rotated — independently.
--
-- Generated app-side with crypto.randomUUID() so the insert can return it
-- without a second read; the DB default only backfills existing rows.

ALTER TABLE seminar_signups
  ADD COLUMN IF NOT EXISTS manage_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS seminar_signups_manage_token_uniq
  ON seminar_signups (manage_token);
