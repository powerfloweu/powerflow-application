/**
 * GET  /api/life/workouts?limit=30 — recent workout logs, newest first.
 * POST /api/life/workouts — upsert a session by (log_date, day_key).
 *      Body: { log_date, day_key, week_number?, entries, note?, completed?, plan_id? }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { WorkoutEntry, WorkoutRow } from "@/lib/life";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 30), 200);
  const rows = await dbSelect<WorkoutRow>("lifestyle_workouts", {
    user_id: `eq.${userId}`,
    select: "id,plan_id,log_date,day_key,week_number,entries,note,completed",
    order: "log_date.desc",
    limit: String(limit),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    log_date?: string; day_key?: string; week_number?: number;
    entries?: WorkoutEntry[]; note?: string; completed?: boolean; plan_id?: string | null;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { log_date, day_key } = body;
  if (!log_date || !day_key) {
    return NextResponse.json({ error: "log_date and day_key required" }, { status: 400 });
  }
  if (!Array.isArray(body.entries)) {
    return NextResponse.json({ error: "entries required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    entries: body.entries,
    note: body.note?.trim() || null,
    completed: body.completed ?? false,
    week_number: body.week_number ?? null,
    plan_id: body.plan_id ?? null,
    updated_at: new Date().toISOString(),
  };

  const existing = await dbSelect<{ id: string }>("lifestyle_workouts", {
    user_id: `eq.${userId}`,
    log_date: `eq.${log_date}`,
    day_key: `eq.${day_key}`,
    select: "id",
  });

  if (existing.length) {
    const ok = await dbPatch("lifestyle_workouts", { id: existing[0].id }, data);
    if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
    return NextResponse.json({ ok: true, id: existing[0].id });
  }

  const inserted = await dbInsert("lifestyle_workouts", {
    ...data, user_id: userId, log_date, day_key,
  });
  if (!inserted) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
