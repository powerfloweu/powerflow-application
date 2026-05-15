/**
 * GET   /api/athlete/assigned-tests  — Returns pending (not completed) test assignments for the
 *                                      current athlete.
 * PATCH /api/athlete/assigned-tests  — Marks a specific assignment as completed.
 *
 * PATCH body: { test_slug: "sat"|"acsi"|"csai"|"das" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";

const TEST_NAMES: Record<string, string> = {
  sat:  "Sport Anxiety Test (SAT)",
  acsi: "Coping Skills Inventory (ACSI)",
  csai: "Competitive Anxiety Inventory (CSAI-2)",
  das:  "Depression, Anxiety & Stress Scale (DAS)",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssignedRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  test_slug: string;
  assigned_at: string;
  completed_at: string | null;
};

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<AssignedRow>("assigned_tests", {
    athlete_id: `eq.${user.id}`,
    completed_at: "is.null",
    select: "id,coach_id,athlete_id,test_slug,assigned_at,completed_at",
    order: "assigned_at.asc",
  });

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { test_slug?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { test_slug } = body;
  if (!test_slug) {
    return NextResponse.json({ error: "test_slug required" }, { status: 400 });
  }

  // Find the pending assignment row for this athlete + test
  const rows = await dbSelect<AssignedRow>("assigned_tests", {
    athlete_id: `eq.${user.id}`,
    test_slug: `eq.${test_slug}`,
    completed_at: "is.null",
    select: "id,coach_id",
  });

  if (!rows.length) {
    return NextResponse.json({ ok: true, notFound: true });
  }

  await dbPatch(
    "assigned_tests",
    { id: rows[0].id },
    { completed_at: new Date().toISOString() },
  );

  const testName = TEST_NAMES[test_slug] ?? test_slug.toUpperCase();

  // 1. Replace the lingering "test assigned" notification on the athlete's device
  //    (same tag → browser replaces the old one; requireInteraction:false lets it fade)
  void sendPushToUser(user.id, {
    title: "Test complete ✓",
    body: `Your ${testName} results have been saved`,
    tag: `test-assigned-${test_slug}`,
    url: "/tools",
  }).catch(() => {});

  // 2. Notify the coach
  const coachId = rows[0].coach_id;
  if (coachId) {
    const athleteRows = await dbSelect<{ full_name: string }>("profiles", {
      id: `eq.${user.id}`,
      select: "full_name",
    });
    const name = athleteRows[0]?.full_name || "An athlete";

    void sendPushToUser(coachId, {
      title: `${name} completed a test 📊`,
      body: `${name} has completed the ${testName}`,
      tag: `test-result-${test_slug}-${user.id}`,
      url: "/coach",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
