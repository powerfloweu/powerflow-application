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
    select: "id",
  });

  if (!rows.length) {
    return NextResponse.json({ ok: true, notFound: true });
  }

  await dbPatch(
    "assigned_tests",
    { id: rows[0].id },
    { completed_at: new Date().toISOString() },
  );

  return NextResponse.json({ ok: true });
}
