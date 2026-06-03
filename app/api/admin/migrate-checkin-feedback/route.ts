/**
 * GET /api/admin/migrate-checkin-feedback
 * Creates the checkin_feedback table. Idempotent (IF NOT EXISTS).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SQL = `
CREATE TABLE IF NOT EXISTS checkin_feedback (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id   UUID        NOT NULL,
  checkin_type TEXT        NOT NULL CHECK (checkin_type IN ('weekly', 'monthly')),
  content      TEXT,
  audio_url    TEXT,
  reviewed     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, checkin_id, checkin_type)
);
CREATE INDEX IF NOT EXISTS checkin_feedback_athlete_idx ON checkin_feedback(athlete_id);
CREATE INDEX IF NOT EXISTS checkin_feedback_checkin_idx ON checkin_feedback(checkin_id, checkin_type);
NOTIFY pgrst, 'reload schema';
`;

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  // Check if table already exists
  const check = await fetch(`${SUPABASE_URL}/rest/v1/checkin_feedback?limit=1&select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (check.ok) return NextResponse.json({ ok: true, message: "checkin_feedback table already exists." });

  // Apply via Supabase Management API
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const mgmtToken  = process.env.SUPABASE_ACCESS_TOKEN ?? "";

  if (!mgmtToken) {
    return NextResponse.json({
      ok: false,
      message: "Table missing. Set SUPABASE_ACCESS_TOKEN or run the SQL manually in the Supabase SQL editor.",
      sql: SQL.trim(),
    }, { status: 503 });
  }

  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });

  if (!mgmtRes.ok) {
    const err = await mgmtRes.text().catch(() => "");
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "checkin_feedback table created." });
}
