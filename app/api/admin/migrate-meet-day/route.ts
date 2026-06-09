import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
export const runtime = "nodejs";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SQL = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meet_config JSONB DEFAULT '{}';
CREATE TABLE IF NOT EXISTS meet_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meet_date DATE NOT NULL,
  lift TEXT NOT NULL CHECK (lift IN ('squat','bench','deadlift')),
  attempt_num INT NOT NULL CHECK (attempt_num IN (1,2,3)),
  planned_kg NUMERIC(6,2), actual_kg NUMERIC(6,2),
  result TEXT CHECK (result IN ('made','missed','red_light')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, meet_date, lift, attempt_num)
);
CREATE INDEX IF NOT EXISTS meet_attempts_athlete_idx ON meet_attempts(athlete_id,meet_date);
CREATE TABLE IF NOT EXISTS prep_lifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lift TEXT NOT NULL CHECK (lift IN ('squat','bench','deadlift','general')),
  weight_kg NUMERIC(6,2), title TEXT, video_url TEXT, lift_date DATE,
  athlete_notes TEXT, coach_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prep_lifts_athlete_idx ON prep_lifts(athlete_id);
NOTIFY pgrst, 'reload schema';
`;
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const check = await fetch(`${SUPABASE_URL}/rest/v1/meet_attempts?limit=1&select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (check.ok) return NextResponse.json({ ok: true, message: "meet_day tables already exist." });
  const projectRef = SUPABASE_URL.replace("https://","").split(".")[0];
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN ?? "";
  if (!mgmtToken) return NextResponse.json({ ok: false, message: "Set SUPABASE_ACCESS_TOKEN or run SQL manually.", sql: SQL.trim() }, { status: 503 });
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: 500 });
  return NextResponse.json({ ok: true, message: "meet_day tables created." });
}
