/**
 * POST /api/coach/suggest-tool
 *
 * Coach recommends a specific library tool to one of their athletes.
 * Body: { athlete_id: string; tool_id: string; message?: string }
 * Returns: { ok: true; id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbInsert, dbSelect } from "@/lib/supabaseAdmin";
import { effectiveTier, hasAccess, type PlanTier } from "@/lib/plan";
import { TOOL_MIN_TIER } from "@/lib/toolTiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TOOL_IDS = new Set([
  "pmr", "autogenic-training",
  "viz-squat", "viz-bench", "viz-deadlift",
  "resource-activation", "affirmations",
  "barrier", "hibajavitas", "comp-day-viz",
]);

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify the caller is a coach
  type ProfileRow = { role: string };
  const [profile] = await dbSelect<ProfileRow>("profiles", {
    select: "role",
    id: `eq.${user.id}`,
    limit: "1",
  });
  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { athlete_id, tool_id, message } = body as { athlete_id?: string; tool_id?: string; message?: string };

  if (!athlete_id || typeof athlete_id !== "string") {
    return NextResponse.json({ error: "athlete_id required" }, { status: 400 });
  }
  if (!tool_id || !VALID_TOOL_IDS.has(tool_id)) {
    return NextResponse.json({ error: "invalid tool_id" }, { status: 400 });
  }

  // Verify the athlete actually belongs to this coach — otherwise a coach could
  // forge suggestions for athletes they don't manage. Also pull the tier fields
  // so we can check the athlete can actually open what is being suggested.
  const owned = await dbSelect<{
    id: string;
    plan_tier: PlanTier | null;
    course_access: boolean | null;
    test_access: boolean | null;
    ai_access: boolean | null;
  }>("profiles", {
    select: "id,plan_tier,course_access,test_access,ai_access",
    id: `eq.${athlete_id}`,
    coach_id: `eq.${user.id}`,
    limit: "1",
  });
  if (!owned.length) {
    return NextResponse.json({ error: "athlete not found or not under this coach" }, { status: 404 });
  }

  // Don't let a coach suggest a tool the athlete cannot open. The suggestion
  // renders as a card on their Today page linking straight into the library,
  // so an above-tier suggestion produces a card whose link goes nowhere.
  const athleteTier = effectiveTier(owned[0]);
  const requiredTier = TOOL_MIN_TIER[tool_id];
  if (!hasAccess(athleteTier, requiredTier)) {
    return NextResponse.json(
      { error: "athlete's plan does not include this tool", requiredTier },
      { status: 409 },
    );
  }

  const row = await dbInsert("tool_suggestions", {
    coach_id:   user.id,
    athlete_id,
    tool_id,
    message:    message?.trim() || null,
  });

  if (!row) return NextResponse.json({ error: "insert failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: row.id });
}
