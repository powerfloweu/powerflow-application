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

// Explicit allowlist — without this, `{ ...current, ...body }` lets any caller
// persist unlimited arbitrary keys of arbitrary size into profiles.meet_config
// forever. `null` explicitly clears a field (plain `undefined` is dropped by
// JSON.stringify before it reaches the server, so it can never express "clear
// this value" — only a literal `null` can).
const NUMERIC_FIELDS = [
  "squat_opener",
  "bench_opener",
  "deadlift_opener",
  "flight_size",
  "seconds_per_person",
] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

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
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Merge with existing, but only through the allowlist above.
  const rows = await dbSelect<{ meet_config: MeetConfig | null }>("profiles", { id: `eq.${userId}`, select: "meet_config" });
  const current = rows[0]?.meet_config ?? {};
  const merged: MeetConfig = { ...current };

  for (const field of NUMERIC_FIELDS as readonly NumericField[]) {
    if (!(field in body)) continue;
    const raw = body[field];

    if (raw === null) {
      merged[field] = null;
      continue;
    }
    if (typeof raw !== "number" && typeof raw !== "string") {
      return NextResponse.json({ error: `${field} must be a number or null` }, { status: 400 });
    }
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: `${field} must be a number or null` }, { status: 400 });
    }
    merged[field] = num;
  }

  const ok = await dbPatch("profiles", { id: userId }, { meet_config: merged });
  if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json(merged);
}
