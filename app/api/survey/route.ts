/**
 * GET  /api/survey — Check whether a feedback survey is due for the current user.
 *   Response: { due: false } | { due: true; round: 1|2|3; role: string }
 *
 * POST /api/survey — Submit a survey response.
 *   Body:    { round: 1|2|3; answers: Record<string, unknown> }
 *   Response: { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = { id: string; role: string; created_at: string };
type ResponseRow = { round: number; submitted_at: string };

export async function GET() {
  if (!isConfigured) return NextResponse.json({ due: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ due: false });

  const [profile] = await dbSelect<ProfileRow>("profiles", {
    select: "id,role,created_at",
    id:    `eq.${user.id}`,
    limit: "1",
  });
  if (!profile) return NextResponse.json({ due: false });

  // Which rounds has this user already completed, and when?
  const completed = await dbSelect<ResponseRow>("survey_responses", {
    select:  "round,submitted_at",
    user_id: `eq.${user.id}`,
    limit:   "3",
  });
  const byRound = new Map(completed.map((r) => [r.round, r.submitted_at]));

  // Round 1: always due on next login if not yet done.
  // Round 2: due 30 days after round 1 was submitted.
  // Round 3: due 30 days after round 2 was submitted.
  let nextRound: 1 | 2 | 3 | null = null;

  if (!byRound.has(1)) {
    nextRound = 1;
  } else if (!byRound.has(2)) {
    const r1 = new Date(byRound.get(1)!).getTime();
    if (Date.now() >= r1 + 30 * 24 * 60 * 60 * 1000) nextRound = 2;
  } else if (!byRound.has(3)) {
    const r2 = new Date(byRound.get(2)!).getTime();
    if (Date.now() >= r2 + 30 * 24 * 60 * 60 * 1000) nextRound = 3;
  }

  if (!nextRound) return NextResponse.json({ due: false });

  return NextResponse.json({ due: true, round: nextRound, role: profile.role });
}

export async function POST(req: NextRequest) {
  if (!isConfigured) return NextResponse.json({ ok: false }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [profile] = await dbSelect<ProfileRow>("profiles", {
    select: "id,role,created_at",
    id:    `eq.${user.id}`,
    limit: "1",
  });
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { round?: number; answers?: unknown };
  const { round, answers } = body;

  if (!round || ![1, 2, 3].includes(round)) {
    return NextResponse.json({ error: "invalid round" }, { status: 400 });
  }

  await dbInsert("survey_responses", {
    user_id:  user.id,
    round,
    role:     profile.role,
    answers:  answers ?? {},
  });

  return NextResponse.json({ ok: true });
}
