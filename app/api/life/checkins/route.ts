/**
 * GET  /api/life/checkins?limit=120 — recent check-in rows, newest first.
 * POST /api/life/checkins — merge-upsert by date.
 *      Body: { checkin_date, scores, note? } — scores merge into the existing
 *      row for that date (daily quick-taps and weekly answers share a row).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbPatch } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Row = { id: string; checkin_date: string; scores: Record<string, number>; note: string | null };

export async function GET(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 120), 400);
  const rows = await dbSelect<Row>("lifestyle_checkins", {
    user_id: `eq.${userId}`,
    select: "id,checkin_date,scores,note",
    order: "checkin_date.desc",
    limit: String(limit),
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { checkin_date?: string; scores?: Record<string, number>; note?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { checkin_date, scores } = body;
  if (!checkin_date) return NextResponse.json({ error: "checkin_date required" }, { status: 400 });
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    return NextResponse.json({ error: "scores required" }, { status: 400 });
  }

  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(scores)) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= 10) clean[k] = n;
  }

  const existing = await dbSelect<Row>("lifestyle_checkins", {
    user_id: `eq.${userId}`,
    checkin_date: `eq.${checkin_date}`,
    select: "id,scores,note",
  });

  if (existing.length) {
    const merged = { ...existing[0].scores, ...clean };
    const patch: Record<string, unknown> = { scores: merged };
    if (body.note !== undefined) patch.note = body.note?.trim() || null;
    const ok = await dbPatch("lifestyle_checkins", { id: existing[0].id }, patch);
    if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 500 });
    return NextResponse.json({ ok: true, merged: true });
  }

  const inserted = await dbInsert("lifestyle_checkins", {
    user_id: userId,
    checkin_date,
    scores: clean,
    note: body.note?.trim() || null,
  });
  if (!inserted) return NextResponse.json({ error: "Save failed" }, { status: 500 });
  return NextResponse.json({ ok: true, merged: false }, { status: 201 });
}
