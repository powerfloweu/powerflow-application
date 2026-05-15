/**
 * POST  /api/coach/assign-test  — Coach assigns a test to one of their athletes.
 * DELETE /api/coach/assign-test — Coach withdraws a test assignment.
 *
 * Body: { athlete_id: string; test_slug: "sat"|"acsi"|"csai"|"das" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SLUGS = ["sat", "acsi", "csai", "das"] as const;
type TestSlug = (typeof VALID_SLUGS)[number];

const TEST_NAMES: Record<TestSlug, string> = {
  sat:  "Sport Anxiety Test (SAT)",
  acsi: "Coping Skills Inventory (ACSI)",
  csai: "Competitive Anxiety Inventory (CSAI-2)",
  das:  "Depression, Anxiety & Stress Scale (DAS)",
};

async function getCoachId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await dbSelect<{ id: string; role: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "id,role",
  });
  if (!rows.length || rows[0].role !== "coach") return null;
  return user.id;
}

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const coachId = await getCoachId();
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { athlete_id?: string; test_slug?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { athlete_id, test_slug } = body;
  if (!athlete_id || !test_slug) {
    return NextResponse.json({ error: "athlete_id and test_slug required" }, { status: 400 });
  }
  if (!(VALID_SLUGS as readonly string[]).includes(test_slug)) {
    return NextResponse.json({ error: "Invalid test_slug" }, { status: 400 });
  }

  // Verify athlete belongs to this coach
  const athleteRows = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${athlete_id}`,
    coach_id: `eq.${coachId}`,
    select: "id",
  });
  if (!athleteRows.length) {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  const inserted = await dbInsert("assigned_tests", {
    coach_id: coachId,
    athlete_id,
    test_slug: test_slug as TestSlug,
  });

  if (!inserted) {
    // Likely a duplicate (already assigned) — treat as success
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Notify athlete (fire-and-forget — don't block the response)
  void sendPushToUser(athlete_id, {
    title: "New test assigned 🧪",
    body: `Your coach has assigned you the ${TEST_NAMES[test_slug as TestSlug]}`,
    tag: `test-assigned-${test_slug}`,
    url: "/tools",
    requireInteraction: true,
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: inserted.id });
}

export async function DELETE(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const coachId = await getCoachId();
  if (!coachId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { athlete_id?: string; test_slug?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { athlete_id, test_slug } = body;
  if (!athlete_id || !test_slug) {
    return NextResponse.json({ error: "athlete_id and test_slug required" }, { status: 400 });
  }

  await dbDelete("assigned_tests", {
    coach_id: coachId,
    athlete_id,
    test_slug,
  });

  return NextResponse.json({ ok: true });
}
