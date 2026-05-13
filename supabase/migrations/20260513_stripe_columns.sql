-- ─────────────────────────────────────────────────────────────────────────────
-- PowerFlow — Stripe subscription columns on profiles
--
-- Adds:
--   profiles.stripe_customer_id      — Stripe customer ID (cus_...)
--   profiles.stripe_subscription_id  — Stripe subscription ID (sub_...)
--   profiles.stripe_price_id         — Price ID of the active subscription
--
-- Idempotent: safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id        TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
