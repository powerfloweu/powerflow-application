-- Track whether an athlete has completed onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- All EXISTING profiles are already onboarded — only NEW sign-ups start at false
UPDATE profiles SET onboarding_complete = true;

-- Allow any authenticated user to read coach profiles
-- (needed for the coach picker in the onboarding form)
DROP POLICY IF EXISTS "profiles: any auth reads coaches" ON profiles;
CREATE POLICY "profiles: any auth reads coaches" ON profiles
  FOR SELECT TO authenticated
  USING (role = 'coach');
