/**
 * GET  /api/coach/athlete-settings?athlete_id=<id>  — Returns settings for a specific athlete.
 * PATCH /api/coach/athlete-settings                  — Upserts settings for a specific athlete.
 *
 * PATCH body (every field optional besides athlete_id):
 *   { athlete_id: string; journal_prompt_labels?: string[] | null; whatsapp_phone?: string | null }
 *
 * Only the fields present in the body are written, so saving a phone number
 * does not wipe the athlete's journal prompts. For journal_prompt_labels,
 * passing null or an empty array resets the athlete to defaults.
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

  const rows = await dbSelect<{ journal_prompt_labels: string[] | null; whatsapp_phone: string | null }>(
    "coach_athlete_settings",
    {
      coach_id: `eq.${user.id}`,
      athlete_id: `eq.${athlete_id}`,
      select: "journal_prompt_labels,whatsapp_phone",
    },
  );

  return NextResponse.json({
    journal_prompt_labels: rows[0]?.journal_prompt_labels ?? null,
    whatsapp_phone: rows[0]?.whatsapp_phone ?? null,
  });
}

type SettingsRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  journal_prompt_labels: string[] | null;
  whatsapp_phone: string | null;
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

  let body: { athlete_id?: string; journal_prompt_labels?: string[] | null; whatsapp_phone?: string | null };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { athlete_id } = body;
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

  // Build the patch from the keys actually sent — a body carrying only a phone
  // number must leave the journal prompts alone.
  const patch: { journal_prompt_labels?: string[] | null; whatsapp_phone?: string | null } = {};

  if ("journal_prompt_labels" in body) {
    // Sanitise labels: max MAX_JOURNAL_PROMPTS, trim whitespace, null if empty
    let sanitised: string[] | null = null;
    if (Array.isArray(body.journal_prompt_labels)) {
      const cleaned = body.journal_prompt_labels
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
        .slice(0, MAX_JOURNAL_PROMPTS);
      sanitised = cleaned.length ? cleaned : null;
    }
    patch.journal_prompt_labels = sanitised;
  }

  if ("whatsapp_phone" in body) {
    const raw = typeof body.whatsapp_phone === "string" ? body.whatsapp_phone.trim() : "";
    // Store what the coach typed (so they can read it back in their own
    // format); waLink() is what strips it down to wa.me's digits.
    patch.whatsapp_phone = raw ? raw.slice(0, 32) : null;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
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
      { ...patch, updated_at: new Date().toISOString() },
    );
  } else {
    const inserted = await dbInsert("coach_athlete_settings", {
      coach_id: user.id,
      athlete_id,
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

  return NextResponse.json({ ok: true, ...patch });
}
