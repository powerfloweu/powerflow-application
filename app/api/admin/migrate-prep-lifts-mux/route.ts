import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SQL = `ALTER TABLE prep_lifts ADD COLUMN IF NOT EXISTS mux_playback_id TEXT; NOTIFY pgrst, 'reload schema';`;

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if column already exists
  const check = await fetch(`${SUPABASE_URL}/rest/v1/prep_lifts?limit=1&select=mux_playback_id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (check.ok) return NextResponse.json({ ok: true, message: "mux_playback_id column already exists." });

  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const mgmtToken  = process.env.SUPABASE_ACCESS_TOKEN ?? "";
  if (!mgmtToken) {
    return NextResponse.json({ ok: false, message: "Set SUPABASE_ACCESS_TOKEN or run SQL manually.", sql: SQL }, { status: 503 });
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SQL }),
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: 500 });
  return NextResponse.json({ ok: true, message: "mux_playback_id column added to prep_lifts." });
}
