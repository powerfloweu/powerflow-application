/**
 * GET  /api/coach/athlete-settings?athlete_id=<id>  — Returns settings for a specific athlete.
 * PATCH /api/coach/athlete-settings                  — Upserts settings for a specific athlete.
 *
 * PATCH body:
 *   { athlete_id: string; journal_prompt_labels: string[] | null }
 *
 * Passing null or an empty array resets the athlete to defaults.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch, dbInsert } from "@/lib/supabaseAdmin";
import { MAX_JOURNAL_PROMPTS } from "@/lib/training";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ journal_prompt_labels: null }, { status: 200 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRows = await dbSelect<{ role: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "role",
  });
  if (callerRows[0]?.role !== "coach") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const athlete_id = req.nextUrl.searchParams.get("athlete_id");
  if (!athlete_id) {
    return NextResponse.json({ error: "athlete_id required" }, { status: 400 });
  }

  const rows = await dbSelect<{ journal_prompt_labels: string[] | null }>(
    "coach_athlete_settings",
    {
      coach_id: `eq.${user.id}`,
      athlete_id: `eq.${athlete_id}`,
      select: "journal_prompt_labels",
    },
  );

  return NextResponse.json({
    journal_prompt_labels: rows[0]?.journal_prompt_labels ?? null,
  });
}

type SettingsRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  journal_prompt_labels: string[] | null;
};

export async function PATCH(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Caller must be a coach
  const callerRows = await dbSelect<{ role: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "role",
  });
  if (callerRows[0]?.role !== "coach") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { athlete_id?: string; journal_prompt_labels?: string[] | null };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { athlete_id, journal_prompt_labels } = body;
  if (!athlete_id) {
    return NextResponse.json({ error: "athlete_id required" }, { status: 400 });
  }

  // Verify athlete belongs to this coach
  const athleteRows = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${athlete_id}`,
    coach_id: `eq.${user.id}`,
    select: "id",
  });
  if (!athleteRows.length) {
    return NextResponse.json({ error: "Athlete not found or not under this coach" }, { status: 404 });
  }

  // Sanitise labels: max MAX_JOURNAL_PROMPTS, trim whitespace, null if empty
  let sanitised: string[] | null = null;
  if (Array.isArray(journal_prompt_labels)) {
    const cleaned = journal_prompt_labels
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .slice(0, MAX_JOURNAL_PROMPTS);
    sanitised = cleaned.length ? cleaned : null;
  }

  // Upsert into coach_athlete_settings
  const existing = await dbSelect<SettingsRow>("coach_athlete_settings", {
    coach_id: `eq.${user.id}`,
    athlete_id: `eq.${athlete_id}`,
    select: "id",
  });

  let ok: boolean;
  if (existing.length) {
    ok = await dbPatch(
      "coach_athlete_settings",
      { id: existing[0].id },
      { journal_prompt_labels: sanitised, updated_at: new Date().toISOString() },
    );
  } else {
    const inserted = await dbInsert("coach_athlete_settings", {
      coach_id: user.id,
      athlete_id,
      journal_prompt_labels: sanitised,
    });
    ok = !!inserted;
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Database write failed — check server logs or run missing migrations." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, journal_prompt_labels: sanitised });
}
