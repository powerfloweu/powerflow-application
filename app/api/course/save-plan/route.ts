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
import { PLAN_MODULES, type CoursePlan } from "@/lib/course";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify PR tier (or legacy course_access flag, or coach role)
  const rows = await dbSelect<{ course_access: boolean; plan_tier: string | null; role: string | null }>("profiles", {
    id: `eq.${user.id}`,
    select: "course_access,plan_tier,role",
  });
  if (!rows.length) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const { canAccessPR } = await import("@/lib/plan");
  const row = rows[0];
  const hasCourseAccess =
    row.course_access ||
    canAccessPR((row.plan_tier ?? "opener") as import("@/lib/plan").PlanTier);
  if (!hasCourseAccess) {
    return NextResponse.json({ error: "PR tier required for course" }, { status: 403 });
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

  // Validate all slugs exist in the plan library (bonus modules excluded)
  const validSlugs = new Set(PLAN_MODULES.map((w) => w.slug));
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
