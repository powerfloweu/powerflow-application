/**
 * GET /api/admin/feedback — Aggregated Coach AI feedback stats for the admin dashboard.
 * Returns technique effectiveness, feedback distributions, message ratings, and recent notes.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all data in parallel — service role bypasses RLS so we get cross-user data
  const [feedback, summaries, messageRatings] = await Promise.all([
    dbSelect<{
      user_id: string;
      rated_on: string;
      length_rating: string | null;
      style_rating: string | null;
      helpfulness: number | null;
      note: string | null;
    }>("coach_ai_feedback", {
      select: "user_id,rated_on,length_rating,style_rating,helpfulness,note",
      order: "rated_on.desc",
      limit: "1000",
    }),
    dbSelect<{
      user_id: string;
      session_date: string;
      techniques_used: string[] | null;
      resonated: string | null;
      message_count: number;
    }>("conversation_summaries", {
      select: "user_id,session_date,techniques_used,resonated,message_count",
      order: "session_date.desc",
      limit: "2000",
    }),
    dbSelect<{
      user_id: string;
      rating: string;
      created_at: string;
    }>("chat_message_ratings", {
      select: "user_id,rating,created_at",
      limit: "5000",
    }).catch(() => [] as { user_id: string; rating: string; created_at: string }[]),
  ]);

  // ── Feedback aggregation ──────────────────────────────────────────────────
  const lengthCounts = { shorter: 0, perfect: 0, more_detail: 0 };
  const styleCounts  = { direct: 0, good: 0, warmer: 0 };
  let helpfulnessSum   = 0;
  let helpfulnessCount = 0;

  const notes: { note: string; rated_on: string }[] = [];

  for (const f of feedback) {
    if (f.length_rating === "shorter")     lengthCounts.shorter++;
    else if (f.length_rating === "perfect") lengthCounts.perfect++;
    else if (f.length_rating === "more_detail") lengthCounts.more_detail++;

    if (f.style_rating === "direct")   styleCounts.direct++;
    else if (f.style_rating === "good") styleCounts.good++;
    else if (f.style_rating === "warmer") styleCounts.warmer++;

    if (f.helpfulness != null) {
      helpfulnessSum += f.helpfulness;
      helpfulnessCount++;
    }
    if (f.note?.trim()) notes.push({ note: f.note.trim(), rated_on: f.rated_on });
  }

  // ── Technique effectiveness ───────────────────────────────────────────────
  const techniqueTotal:     Record<string, number> = {};
  const techniqueResonated: Record<string, number> = {};

  for (const s of summaries) {
    for (const tech of (s.techniques_used ?? [])) {
      if (!tech) continue;
      techniqueTotal[tech] = (techniqueTotal[tech] ?? 0) + 1;
      if (s.resonated) {
        techniqueResonated[tech] = (techniqueResonated[tech] ?? 0) + 1;
      }
    }
  }

  const techniques = Object.entries(techniqueTotal)
    .map(([technique, total]) => ({
      technique,
      total,
      resonated:     techniqueResonated[technique] ?? 0,
      resonanceRate: Math.round(((techniqueResonated[technique] ?? 0) / total) * 100),
    }))
    .sort((a, b) => b.resonanceRate - a.resonanceRate || b.total - a.total);

  // ── Message ratings ───────────────────────────────────────────────────────
  const thumbsUp   = messageRatings.filter((r) => r.rating === "good").length;
  const thumbsDown = messageRatings.filter((r) => r.rating === "bad").length;

  // ── Session stats ─────────────────────────────────────────────────────────
  const uniqueUsers    = new Set(summaries.map((s) => s.user_id)).size;
  const totalMessages  = summaries.reduce((acc, s) => acc + (s.message_count ?? 0), 0);
  const avgMsgPerSession = summaries.length > 0
    ? Math.round(totalMessages / summaries.length)
    : 0;

  return NextResponse.json({
    feedback: {
      total:           feedback.length,
      uniqueRaters:    new Set(feedback.map((f) => f.user_id)).size,
      lengthCounts,
      styleCounts,
      avgHelpfulness:  helpfulnessCount > 0
        ? Math.round((helpfulnessSum / helpfulnessCount) * 10) / 10
        : null,
      notes: notes.slice(0, 100),
    },
    techniques,
    messages: {
      thumbsUp,
      thumbsDown,
      total: messageRatings.length,
      upRate: messageRatings.length > 0
        ? Math.round((thumbsUp / messageRatings.length) * 100)
        : null,
    },
    sessions: {
      total:             summaries.length,
      uniqueUsers,
      avgMsgPerSession,
    },
  });
}
