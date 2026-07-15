/**
 * GET   /api/coach/digests            — this coach's pending AI drafts (status 'new'),
 *                                        newest first, joined with the athlete's name.
 * PATCH /api/coach/digests            — { id, status: 'used' | 'dismissed' }
 *
 * Coach-only. Rows are always scoped to the calling coach.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type DigestRow = {
  id: string;
  athlete_id: string;
  period_start: string;
  period_end: string;
  entry_count: number;
  summary: string;
  draft_message: string;
  created_at: string;
};

async function getCoachId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const rows = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`, role: "eq.coach", select: "id",
  });
  return rows.length ? user.id : null;
}

export async function GET() {
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await dbSelect<DigestRow>("coach_digests", {
    coach_id: `eq.${coachId}`,
    status: "eq.new",
    select: "id,athlete_id,period_start,period_end,entry_count,summary,draft_message,created_at",
    order: "created_at.desc",
    limit: "50",
  });

  // Attach athlete display names.
  const names = new Map<string, string>();
  if (rows.length) {
    const ids = [...new Set(rows.map((r) => r.athlete_id))];
    const profiles = await dbSelect<{ id: string; display_name: string }>("profiles", {
      id: `in.(${ids.join(",")})`,
      select: "id,display_name",
    });
    profiles.forEach((p) => names.set(p.id, p.display_name));
  }

  return NextResponse.json(rows.map((r) => ({ ...r, athlete_name: names.get(r.athlete_id) ?? "Athlete" })));
}

export async function PATCH(req: NextRequest) {
  const coachId = await getCoachId();
  if (!coachId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { id?: string; status?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.id || (body.status !== "used" && body.status !== "dismissed")) {
    return NextResponse.json({ error: "id and status (used|dismissed) required" }, { status: 400 });
  }

  // Match includes coach_id so a coach can only touch their own digests.
  const ok = await dbPatch("coach_digests", { id: body.id, coach_id: coachId }, { status: body.status });
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
