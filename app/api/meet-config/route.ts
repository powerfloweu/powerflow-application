/**
 * GET   /api/meet-config              — athlete's own meet config
 * GET   /api/meet-config?athlete_id=x — coach fetches athlete's config
 * PATCH /api/meet-config              — update (athlete patches own; coach patches their athlete)
 *                                       Body: { athlete_id?: string, lifts?: {...}, affirmations?: string[], show_attempt_options?: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";

async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch { return null; }
}

async function isCoachOf(coachId: string, athleteId: string): Promise<boolean> {
  const rows = await dbSelect<{ coach_id: string | null }>("profiles", {
    id: `eq.${athleteId}`, select: "coach_id",
  });
  return rows[0]?.coach_id === coachId;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const athleteId = new URL(req.url).searchParams.get("athlete_id") ?? userId;
  if (athleteId !== userId && !await isCoachOf(userId, athleteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await dbSelect<{ meet_config: Record<string, unknown> | null }>("profiles", {
    id: `eq.${athleteId}`, select: "meet_config",
  });
  return NextResponse.json(rows[0]?.meet_config ?? {});
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    athlete_id?: string;
    lifts?: Record<string, unknown>;
    affirmations?: string[];
    show_attempt_options?: boolean;
    [key: string]: unknown;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const athleteId = body.athlete_id ?? userId;
  if (athleteId !== userId && !await isCoachOf(userId, athleteId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch existing config to deep-merge
  const rows = await dbSelect<{ meet_config: Record<string, unknown> | null }>("profiles", {
    id: `eq.${athleteId}`, select: "meet_config",
  });
  const existing = rows[0]?.meet_config ?? {};

  // Merge top-level keys; deep-merge `lifts`
  const { athlete_id: _aid, ...rest } = body;
  const merged: Record<string, unknown> = { ...existing, ...rest };

  if (typeof rest.lifts === "object" && rest.lifts !== null && typeof existing.lifts === "object" && existing.lifts !== null) {
    const existingLifts = existing.lifts as Record<string, unknown>;
    const newLifts = rest.lifts as Record<string, unknown>;
    merged.lifts = { ...existingLifts };
    for (const lift of ["squat", "bench", "deadlift"]) {
      if (newLifts[lift]) {
        const el = (existingLifts[lift] ?? {}) as Record<string, unknown>;
        const nl = newLifts[lift] as Record<string, unknown>;
        (merged.lifts as Record<string, unknown>)[lift] = { ...el, ...nl };
      }
    }
  }

  await dbPatch("profiles", { id: athleteId }, { meet_config: merged });
  return NextResponse.json({ ok: true, meet_config: merged });
}
