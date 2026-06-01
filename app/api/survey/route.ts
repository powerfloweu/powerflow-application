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
type ResponseRow = { round: number };

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

  // How many rounds has this user already completed?
  const completed = await dbSelect<ResponseRow>("survey_responses", {
    select:  "round",
    user_id: `eq.${user.id}`,
    limit:   "3",
  });
  const completedRounds = new Set(completed.map((r) => r.round));
  const nextRound = ([1, 2, 3] as const).find((r) => !completedRounds.has(r));
  if (!nextRound) return NextResponse.json({ due: false });

  const daysOld =
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const dueAfter = nextRound * 30; // 30, 60, 90 days

  if (daysOld < dueAfter) return NextResponse.json({ due: false });

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
