/**
 * GET  /api/me — Returns the current user's full profile.
 * PATCH /api/me — Updates any patchable profile field.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbInsert } from "@/lib/supabaseAdmin";
import type { AthleteProfile } from "@/lib/athlete";

const SELECT_COLS = [
  "id", "display_name", "avatar_url", "role", "coach_id", "coach_code", "meet_date",
  "course_access", "onboarding_complete",
  "gender", "bodyweight_kg", "weight_category",
  "squat_current_kg", "squat_goal_kg",
  "bench_current_kg", "bench_goal_kg",
  "deadlift_current_kg", "deadlift_goal_kg",
  "mental_goals",
  "training_days_per_week",
].join(",");

export async function GET() {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<AthleteProfile>("profiles", {
    id: `eq.${user.id}`,
    select: SELECT_COLS,
  });

  if (!rows.length) {
    return NextResponse.json({
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete" as const,
      coach_id: null,
      coach_code: null,
      meet_date: null,
      course_access: false,
      onboarding_complete: false,
      gender: null,
      bodyweight_kg: null,
      weight_category: null,
      squat_current_kg: null,
      squat_goal_kg: null,
      bench_current_kg: null,
      bench_goal_kg: null,
      deadlift_current_kg: null,
      deadlift_goal_kg: null,
      mental_goals: [],
      training_days_per_week: null,
    } satisfies AthleteProfile);
  }

  const row = rows[0];
  // Normalise: mental_goals may come back as null from DB
  return NextResponse.json({ ...row, mental_goals: row.mental_goals ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<AthleteProfile>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Allowlist — only these keys may be patched
  const PATCHABLE: Array<keyof AthleteProfile> = [
    "meet_date", "display_name",
    "gender", "bodyweight_kg", "weight_category",
    "squat_current_kg", "squat_goal_kg",
    "bench_current_kg", "bench_goal_kg",
    "deadlift_current_kg", "deadlift_goal_kg",
    "mental_goals",
    "training_days_per_week",
    "onboarding_complete",
  ];

  const patch: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in body) {
      const val = body[key];
      // Null out empty strings for nullable numeric/text fields
      if (val === "") patch[key] = null;
      else patch[key] = val ?? null;
    }
  }

  // Guard: onboarding_complete may only be set to true, never to false/null
  if ("onboarding_complete" in patch && !patch.onboarding_complete) {
    delete patch.onboarding_complete;
  }

  // Special: trim display_name
  if (typeof patch.display_name === "string") {
    patch.display_name = (patch.display_name as string).trim();
    if (!patch.display_name) delete patch.display_name;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Check whether a profile row exists first
  const existing = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "id",
  });

  let ok: boolean;
  if (existing.length > 0) {
    ok = await dbPatch("profiles", { id: user.id }, patch);
  } else {
    // Row was never created (ensureProfile may have failed during OAuth).
    // Insert now with required defaults + the patch data.
    const inserted = await dbInsert("profiles", {
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email ?? "User",
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
