/**
 * POST /api/onboarding — submits all onboarding fields at once and marks the
 * athlete's profile as onboarding_complete = true.
 *
 * This endpoint is separate from PATCH /api/me because:
 *  1. It sets coach_id, which is not normally user-patchable via /api/me.
 *  2. It atomically marks onboarding_complete in the same write.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbPatch, dbInsert, dbSelect } from "@/lib/supabaseAdmin";

interface OnboardingBody {
  display_name?: string;
  gender?: "male" | "female" | null;
  bodyweight_kg?: number | null;
  weight_category?: string | null;
  squat_current_kg?: number | null;
  squat_goal_kg?: number | null;
  bench_current_kg?: number | null;
  bench_goal_kg?: number | null;
  deadlift_current_kg?: number | null;
  deadlift_goal_kg?: number | null;
  meet_date?: string | null;
  training_days_per_week?: number | null;
  mental_goals?: string[];
  coach_id?: string | null;
}

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: OnboardingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Build the patch payload, normalising empty strings to null
  const patch: Record<string, unknown> = {
    onboarding_complete: true,
  };

  const textFields: Array<keyof OnboardingBody> = [
    "display_name", "gender", "weight_category", "meet_date",
  ];
  for (const key of textFields) {
    if (key in body) {
      const val = body[key];
      patch[key] = val === "" ? null : (val ?? null);
    }
  }

  // Trim display_name
  if (typeof patch.display_name === "string") {
    patch.display_name = (patch.display_name as string).trim() || null;
  }

  const numericFields: Array<keyof OnboardingBody> = [
    "bodyweight_kg",
    "squat_current_kg", "squat_goal_kg",
    "bench_current_kg", "bench_goal_kg",
    "deadlift_current_kg", "deadlift_goal_kg",
    "training_days_per_week",
  ];
  for (const key of numericFields) {
    if (key in body) {
      const val = body[key];
      if (val === null || val === undefined || val === (0 as unknown)) {
        patch[key] = null;
      } else {
        patch[key] = Number(val) > 0 ? Number(val) : null;
      }
    }
  }

  // mental_goals — keep as-is (array of strings)
  if ("mental_goals" in body) {
    patch.mental_goals = Array.isArray(body.mental_goals) ? body.mental_goals : [];
  }

  // coach_id — allow setting (including null = "no coach")
  // Must refer to an actual coach if non-null. Self-links rejected.
  if ("coach_id" in body) {
    const cid = body.coach_id ?? null;
    if (cid !== null) {
      if (cid === user.id) {
        return NextResponse.json(
          { error: "Cannot set yourself as your coach." },
          { status: 400 },
        );
      }
      const coachRows = await dbSelect<{ id: string }>("profiles", {
        id: `eq.${cid}`,
        role: "eq.coach",
        select: "id",
      });
      if (!coachRows.length) {
        return NextResponse.json(
          { error: "Selected coach does not exist." },
          { status: 400 },
        );
      }
    }
    patch.coach_id = cid;
  }

  // Check whether the profile row exists
  const existing = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "id",
  });

  let ok: boolean;
  if (existing.length > 0) {
    ok = await dbPatch("profiles", { id: user.id }, patch);
  } else {
    // Profile row was never created — insert with required defaults
    const inserted = await dbInsert("profiles", {
      id: user.id,
      display_name:
        (patch.display_name as string | null) ??
        user.user_metadata?.full_name ??
        user.email ??
        "Athlete",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete",
      ...patch,
    });
    ok = !!inserted;
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Database write failed — check server logs or run missing migrations." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
