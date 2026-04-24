-- Tool requests from members
CREATE TABLE IF NOT EXISTS tool_requests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text       text        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tool_requests ENABLE ROW LEVEL SECURITY;

-- Members can insert their own requests; coaches can read all
CREATE POLICY "insert own"   ON tool_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read own"     ON tool_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "coach read"   ON tool_requests FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'coach'
  ));
