/**
 * GET  /api/me/meet-config  — returns meet_config from profile
 * PATCH /api/me/meet-config — updates meet_config fields
 * meet_config shape: { squat_opener, bench_opener, deadlift_opener, flight_size, seconds_per_person }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";

type MeetConfig = {
  squat_opener?: number | null;
  bench_opener?: number | null;
  deadlift_opener?: number | null;
  flight_size?: number | null;
  seconds_per_person?: number | null;
};

async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await dbSelect<{ meet_config: MeetConfig | null }>("profiles", {
    id: `eq.${userId}`, select: "meet_config",
  });
  return NextResponse.json(rows[0]?.meet_config ?? {});
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: MeetConfig;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  // Merge with existing
  const rows = await dbSelect<{ meet_config: MeetConfig | null }>("profiles", { id: `eq.${userId}`, select: "meet_config" });
  const current = rows[0]?.meet_config ?? {};
  const merged = { ...current, ...body };
  await dbPatch("profiles", { id: userId }, { meet_config: merged });
  return NextResponse.json(merged);
}
