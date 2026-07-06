/**
 * GET  /api/life/body?limit=120 — recent body-log rows, newest first.
 * POST /api/life/body — merge-upsert by date.
 *      Body: { log_date, weight_kg?, meal_ids?, macros?, note? }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";
import type { Macros } from "@/lib/life";

export const dynamic = "force-dynamic";

type Row = {
  id: string; log_date: string; weight_kg: number | null;
  meal_ids: string[]; macros: Macros | null; note: string | null;
};

export async function GET(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 120), 400);
  const rows = await dbSelect<Row>("lifestyle_body_log", {
    user_id: `eq.${userId}`,
    select: "id,log_date,weight_kg,meal_ids,macros,note",
    order: "log_date.desc",
    limit: String(limit),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    log_date?: string; weight_kg?: number | null;
    meal_ids?: string[]; macros?: Macros | null; note?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.log_date) return NextResponse.json({ error: "log_date required" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.weight_kg !== undefined) {
    const w = body.weight_kg === null ? null : Number(body.weight_kg);
    if (w !== null && (!Number.isFinite(w) || w <= 0 || w > 400)) {
      return NextResponse.json({ error: "weight_kg out of range" }, { status: 400 });
    }
    patch.weight_kg = w;
  }
  if (Array.isArray(body.meal_ids)) patch.meal_ids = body.meal_ids;
  if (body.macros !== undefined) patch.macros = body.macros;
  if (body.note !== undefined) patch.note = body.note?.trim() || null;

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const existing = await dbSelect<{ id: string }>("lifestyle_body_log", {
    user_id: `eq.${userId}`,
    log_date: `eq.${body.log_date}`,
    select: "id",
  });

  if (existing.length) {
    const ok = await dbPatch("lifestyle_body_log", { id: existing[0].id }, patch);
    if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const inserted = await dbInsert("lifestyle_body_log", {
    ...patch, user_id: userId, log_date: body.log_date,
  });
  if (!inserted) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
