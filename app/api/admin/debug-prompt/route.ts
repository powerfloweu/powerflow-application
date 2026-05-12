/**
 * GET /api/admin/debug-prompt?userId=<uuid>
 * Admin-only. Builds and returns the full system prompt that would be sent to
 * Claude for a given athlete — exactly as the chat endpoint constructs it.
 * Use this to verify that feedback adaptation and global patterns are injecting correctly.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";
import type { AthleteProfile } from "@/lib/athlete";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Mirror exactly what /api/chat/route.ts fetches
  const [profiles, entries, egoStates, training, summaries, rawFeedback, allSummaries] =
    await Promise.all([
      dbSelect<AthleteProfile>("profiles", {
        id: `eq.${userId}`,
        select: [
          "id","display_name","meet_date","weight_category","training_days_per_week",
          "mental_goals","main_barrier",
          "self_confidence_reg","self_focus_fatigue","self_handling_pressure",
          "self_competition_anxiety","self_emotional_recovery",
          "viz_keywords","affirmations","ai_access","plan_tier","role","coach_notes",
        ].join(","),
      }),
      dbSelect<{ content: string; sentiment: string; themes: string[]; created_at: string }>(
        "journal_entries",
        { user_id: `eq.${userId}`, select: "content,sentiment,themes,created_at", order: "created_at.desc", limit: "15" }
      ),
      dbSelect<{ name: string; color: string; domain: string | null; body_feeling: string | null; shadow_side: string | null; activation_ritual: string | null }>(
        "ego_states",
        { user_id: `eq.${userId}`, select: "name,color,domain,body_feeling,shadow_side,activation_ritual", order: "sort_order.asc,created_at.asc" }
      ).catch(() => []),
      dbSelect<{ entry_date: string; is_training_day: boolean; mood_rating: number | null; thoughts_before: string | null; thoughts_after: string | null }>(
        "training_entries",
        { user_id: `eq.${userId}`, select: "entry_date,is_training_day,mood_rating,thoughts_before,thoughts_after", order: "entry_date.desc", limit: "7" }
      ),
      dbSelect<{ session_date: string; summary: string; techniques_used: string[]; resonated: string | null }>(
        "conversation_summaries",
        { user_id: `eq.${userId}`, select: "session_date,summary,techniques_used,resonated", order: "session_date.desc", limit: "5" }
      ),
      dbSelect<{ length_rating: string | null; style_rating: string | null; helpfulness: number | null; note: string | null }>(
        "coach_ai_feedback",
        { user_id: `eq.${userId}`, select: "length_rating,style_rating,helpfulness,note", order: "rated_on.desc", limit: "14" }
      ).catch(() => []),
      dbSelect<{ techniques_used: string[] | null; resonated: string | null }>(
        "conversation_summaries",
        { select: "techniques_used,resonated", order: "session_date.desc", limit: "500" }
      ).catch(() => []),
    ]);

  const profile = profiles[0];
  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── Derive feedback aggregate ─────────────────────────────────────────────
  let feedbackSummary: Record<string, unknown> = { status: "no feedback yet" };
  if (rawFeedback.length > 0) {
    let shorter = 0, moreDetail = 0, direct = 0, warmer = 0;
    let helpSum = 0, helpCount = 0;
    let recentNote: string | null = null;
    for (const f of rawFeedback) {
      if (f.length_rating === "shorter")     shorter++;
      if (f.length_rating === "more_detail") moreDetail++;
      if (f.style_rating  === "direct")      direct++;
      if (f.style_rating  === "warmer")      warmer++;
      if (f.helpfulness != null) { helpSum += f.helpfulness; helpCount++; }
      if (!recentNote && f.note?.trim()) recentNote = f.note.trim();
    }
    const n = rawFeedback.length;
    feedbackSummary = {
      entries: n,
      prefersShorter:    shorter    >= Math.ceil(n * 0.5),
      prefersMoreDetail: moreDetail >= Math.ceil(n * 0.5),
      prefersDirect:     direct     >= Math.ceil(n * 0.5),
      prefersWarmer:     warmer     >= Math.ceil(n * 0.5),
      avgHelpfulness:    helpCount > 0 ? Math.round((helpSum / helpCount) * 10) / 10 : null,
      recentNote,
      raw: { shorter, moreDetail, direct, warmer },
    };
  }

  // ── Derive global patterns ────────────────────────────────────────────────
  const techTotal:     Record<string, number> = {};
  const techResonated: Record<string, number> = {};
  for (const s of allSummaries) {
    for (const t of (s.techniques_used ?? [])) {
      if (!t) continue;
      techTotal[t] = (techTotal[t] ?? 0) + 1;
      if (s.resonated) techResonated[t] = (techResonated[t] ?? 0) + 1;
    }
  }
  const globalPatterns = Object.entries(techTotal)
    .filter(([, total]) => total >= 3)
    .map(([technique, totalSessions]) => ({
      technique,
      totalSessions,
      resonanceRate: Math.round(((techResonated[technique] ?? 0) / totalSessions) * 100),
    }))
    .sort((a, b) => b.resonanceRate - a.resonanceRate || b.totalSessions - a.totalSessions)
    .slice(0, 6);

  return NextResponse.json({
    athlete: {
      name:       profile.display_name,
      ai_access:  profile.ai_access,
      plan_tier:  profile.plan_tier,
    },
    context: {
      journal_entries:    entries.length,
      ego_states:         egoStates.length,
      training_entries:   training.length,
      session_summaries:  summaries.length,
    },
    feedback_aggregate: feedbackSummary,
    global_patterns: {
      total_sessions_analysed: allSummaries.length,
      top_techniques: globalPatterns,
    },
    session_summaries: summaries,
    coach_notes: profile.coach_notes?.trim() || null,
    will_inject: {
      feedback_section:  rawFeedback.length > 0,
      patterns_section:  globalPatterns.length > 0,
      coach_notes:       !!profile.coach_notes?.trim(),
    },
  });
}
