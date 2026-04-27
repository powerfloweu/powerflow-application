/**
 * POST /api/course/save-plan
 * Body: { plan: CoursePlan }
 *
 * Auth: must be logged in with course_access = true.
 *
 * Persists the athlete's confirmed course plan to profiles.course_plan (JSONB).
 * Validates slugs, enforces minimum 8 weeks.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { COURSE_WEEKS, type CoursePlan } from "@/lib/course";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify course_access
  const rows = await dbSelect<{ course_access: boolean }>("profiles", {
    id: `eq.${user.id}`,
    select: "course_access",
  });
  if (!rows.length || !rows[0].course_access) {
    return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  let body: { plan?: CoursePlan };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = body.plan;

  // Basic shape check
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.slugs)) {
    return NextResponse.json({ error: "plan.slugs must be an array" }, { status: 400 });
  }

  if (plan.slugs.length < 8) {
    return NextResponse.json(
      { error: "A plan must contain at least 8 weeks" },
      { status: 400 },
    );
  }

  // Validate all slugs exist in the library
  const validSlugs = new Set(COURSE_WEEKS.map((w) => w.slug));
  const invalid = plan.slugs.filter((s) => !validSlugs.has(s));
  if (invalid.length) {
    return NextResponse.json(
      { error: `Unknown slugs: ${invalid.join(", ")}` },
      { status: 400 },
    );
  }

  // Deduplicate (shouldn't happen but be safe)
  const deduped = plan.slugs.filter((s, i, arr) => arr.indexOf(s) === i);

  const cleanPlan: CoursePlan = {
    type: plan.type ?? "ai",
    slugs: deduped,
    rationale: typeof plan.rationale === "string" ? plan.rationale : undefined,
    generatedAt: plan.generatedAt ?? new Date().toISOString(),
    generatedBy: plan.generatedBy,
  };

  const ok = await dbPatch("profiles", { id: user.id }, { course_plan: cleanPlan });
  if (!ok) {
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
