/**
 * POST /api/course/generate-plan
 *
 * Deterministic module selection based on David's coaching framework:
 *
 *   ALWAYS:  w01 (resource activation / finding the why)
 *            w09 + w10 + w11 (visualizations for each lift)
 *            w15 (meet day mental training)
 *
 *   ANXIETY: w05–w08 (relaxation block) — triggered by low anxiety/pressure/
 *            recovery self-ratings and/or journal themes
 *
 *   FOCUS:   w13–w14 — triggered when distraction is a stated barrier
 *            and/or journal themes flag focus issues
 *
 *   OPTIONAL: w02, w03, w12, w04 — scored and added until plan reaches
 *             the 12-week target length
 *
 *   PROXIMITY: meet closeness multiplies the urgency of anxiety and focus
 *              signals — a 4/5 anxiety score with 6 weeks to go is very
 *              different from the same score with 30 weeks to go.
 *
 * Claude is called only to write a short personalised rationale paragraph
 * after the selection is already complete.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { COURSE_WEEKS, type CoursePlan } from "@/lib/course";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ── Slug constants ─────────────────────────────────────────────────────────────

const ANCHOR_START = "w01-me-and-powerlifting";
const ANCHOR_VIZ   = ["w09-visualization-basics", "w10-mental-rehearsal", "w11-cues"] as const;
const ANCHOR_END   = "w15-meet-day";

/** Full 4-week relaxation / arousal regulation block */
const ANXIETY_BLOCK = [
  "w05-arousal-control",
  "w06-breath-and-body",
  "w07-pressure",
  "w08-flow",
] as const;

/** Focus / attention block */
const FOCUS_BLOCK = ["w13-attention", "w14-refocus"] as const;

/** Optional enrichment — ordered by default priority */
const OPTIONAL_POOL = [
  "w02-who-am-i",           // self-identity, confidence
  "w03-goals",              // goal clarity — broadly useful
  "w12-self-talk",          // inner critic / self-talk patterns
  "w04-coach-relationship", // coach comms — lower priority
] as const;

/** Aim for at least this many weeks before dipping into optional pool */
const TARGET_MIN = 12;

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  course_access: boolean;
  mental_goals: string[] | null;
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  years_powerlifting: string | null;
  meet_date: string | null;
  coach_id: string | null;
};

type JournalRow = { themes: string[] | null };

// ── Scoring helpers ───────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function flatThemes(rows: JournalRow[]): string[] {
  return rows.flatMap((r) => r.themes ?? []).map((t) => t.toLowerCase());
}

function hits(themes: string[], keywords: string[]): number {
  return themes.filter((t) => keywords.some((k) => t.includes(k))).length;
}

/**
 * Meet proximity multiplier.
 * The closer the meet, the more urgently relevant signals are weighted.
 */
function proximityMult(days: number | null): number {
  if (days === null) return 1.0;
  if (days < 0)   return 0.5;   // meet passed — less relevant
  if (days < 42)  return 2.5;   // < 6 weeks
  if (days < 84)  return 2.0;   // 6–12 weeks
  if (days < 168) return 1.5;   // 12–24 weeks
  return 1.0;                   // > 24 weeks
}

/**
 * Anxiety/arousal relevance (0–100).
 * Drives whether to include the w05–w08 relaxation block.
 */
function anxietyScore(p: ProfileRow, themes: string[]): number {
  let s = 0;
  // Self-ratings: lower rating = higher anxiety = higher score
  if (p.self_competition_anxiety !== null) s += (5 - p.self_competition_anxiety) * 9;  // max 36
  if (p.self_handling_pressure   !== null) s += (5 - p.self_handling_pressure)   * 7;  // max 28
  if (p.self_emotional_recovery  !== null) s += (5 - p.self_emotional_recovery)  * 4;  // max 16
  // Journal signals
  const kw = ["anxiety", "anxious", "nerves", "nervous", "stress", "pressure", "panic", "fear", "overwhelm", "worried"];
  s += Math.min(hits(themes, kw) * 4, 20);
  return Math.min(s, 100);
}

/**
 * Focus/distraction relevance (0–100).
 * Drives whether to include the w13–w14 focus block.
 */
function focusScore(p: ProfileRow, themes: string[]): number {
  let s = 0;
  if (p.self_focus_fatigue !== null) s += (5 - p.self_focus_fatigue) * 12; // max 48
  const kw = ["distract", "focus", "attention", "concentrat", "drift", "mind wander", "zone out"];
  const barrier = (p.main_barrier ?? "").toLowerCase();
  const overthink = (p.overthinking_focus ?? "").toLowerCase();
  if (kw.some((k) => barrier.includes(k)))    s += 25;
  if (kw.some((k) => overthink.includes(k)))  s += 15;
  s += Math.min(hits(themes, kw) * 4, 20);
  return Math.min(s, 100);
}

/**
 * Per-slug score for optional enrichment weeks.
 * Higher = more relevant to this athlete, picked first when filling to target.
 */
function optionalScore(slug: string, p: ProfileRow, themes: string[]): number {
  switch (slug) {
    case "w02-who-am-i": {
      let s = 0;
      if (p.self_confidence_reg !== null) s += (5 - p.self_confidence_reg) * 10;
      s += Math.min(hits(themes, ["confidence", "identity", "self-doubt", "doubt", "belief", "insecur"]) * 5, 25);
      return Math.min(s, 100);
    }
    case "w03-goals": {
      // Always broadly useful; boost if journal mentions goal confusion
      let s = 25;
      s += Math.min(hits(themes, ["goal", "motivat", "direction", "purpose", "why", "drift"]) * 5, 25);
      return Math.min(s, 100);
    }
    case "w12-self-talk": {
      let s = 0;
      if ((p.overthinking_focus ?? "").length > 10) s += 20;
      s += Math.min(hits(themes, ["self-talk", "inner critic", "negative thought", "voice", "telling myself", "head", "chatter"]) * 8, 40);
      return Math.min(s, 80);
    }
    case "w04-coach-relationship":
      return p.coach_id ? 20 : 5;
    default:
      return 0;
  }
}

// ── Selection algorithm ───────────────────────────────────────────────────────

function buildPlan(p: ProfileRow, themes: string[]): string[] {
  const days = daysUntil(p.meet_date);
  const mult = proximityMult(days);

  const aScore = anxietyScore(p, themes) * mult;
  const fScore = focusScore(p, themes)   * mult;

  const selected = new Set<string>();

  // 1. Anchors — always
  selected.add(ANCHOR_START);
  for (const s of ANCHOR_VIZ) selected.add(s);
  selected.add(ANCHOR_END);

  // 2. Anxiety / relaxation block
  //    2 weeks of daily practice is sufficient — include w05 + w06 when
  //    anxiety signals are present (score > 15), never the full 4-week block.
  if (aScore > 15) {
    selected.add("w05-arousal-control");
    selected.add("w06-breath-and-body");
  }

  // 3. Focus / attention block — threshold 20 (lower than anxiety since
  //    distraction is almost always present at some level)
  if (fScore > 20) {
    for (const s of FOCUS_BLOCK) selected.add(s);
  }

  // 4. Fill to TARGET_MIN with scored optional weeks
  const optionals = (OPTIONAL_POOL as readonly string[])
    .filter((s) => !selected.has(s))
    .map((s) => ({ slug: s, score: optionalScore(s, p, themes) }))
    .sort((a, b) => b.score - a.score);

  for (const { slug } of optionals) {
    if (selected.size >= TARGET_MIN) break;
    selected.add(slug);
  }

  // 5. Fixed progression order — determines sequence, not inclusion
  const ORDER = [
    ANCHOR_START,
    "w02-who-am-i",
    "w03-goals",
    "w04-coach-relationship",
    ...ANXIETY_BLOCK,
    ...ANCHOR_VIZ,
    "w12-self-talk",
    ...FOCUS_BLOCK,
    ANCHOR_END,
  ];

  return ORDER.filter((s) => selected.has(s));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST() {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch profile
  const profileRows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: [
      "id", "course_access", "mental_goals", "main_barrier", "confidence_break",
      "overthinking_focus", "self_confidence_reg", "self_focus_fatigue",
      "self_handling_pressure", "self_competition_anxiety", "self_emotional_recovery",
      "years_powerlifting", "meet_date", "coach_id",
    ].join(","),
  });

  if (!profileRows.length) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const profile = profileRows[0];

  if (!profile.course_access) {
    return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  // Fetch recent journal themes (last 20 entries)
  const journalRows = await dbSelect<JournalRow>("journal_entries", {
    user_id: `eq.${user.id}`,
    select: "themes",
    order: "created_at.desc",
    limit: "20",
  });
  const themes = flatThemes(journalRows);

  // Deterministic selection — no AI involved
  const slugs = buildPlan(profile, themes);

  // Claude writes only the rationale (cannot change the selection)
  const days = daysUntil(profile.meet_date);
  const meetLabel =
    days === null          ? "no meet date set"
    : days < 0            ? "meet already completed"
    : days < 42           ? `meet in ${days} days — high urgency`
    : days < 168          ? `meet in ${Math.round(days / 7)} weeks`
    :                       `${Math.round(days / 7)} weeks until meet`;

  const selectedTitles = slugs
    .map((slug) => COURSE_WEEKS.find((w) => w.slug === slug)?.title ?? slug)
    .join(", ");

  const rationalePrompt = `Write a 2–3 sentence personalised rationale for a powerlifter's mental training plan. Be direct and specific to this athlete. Do not mention week numbers or module names. Keep it under 60 words. Do not hallucinate facts not given below.

Athlete: mental goals = ${profile.mental_goals?.join(", ") || "not set"}; main barrier = ${profile.main_barrier || "not set"}; competition anxiety self-rating = ${profile.self_competition_anxiety ?? "unknown"}/5; focus under fatigue = ${profile.self_focus_fatigue ?? "unknown"}/5; handling pressure = ${profile.self_handling_pressure ?? "unknown"}/5; ${meetLabel}.

Plan covers: ${selectedTitles}.`;

  let rationale = "";
  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 150,
      messages: [{ role: "user", content: rationalePrompt }],
    });
    rationale = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  } catch {
    // Non-critical — plan is still valid without rationale
  }

  // Anchors are always highlighted; add the first week of each triggered block
  const highlights: string[] = [
    ANCHOR_START,
    ...ANCHOR_VIZ,
    ANCHOR_END,
  ];
  // Conditional blocks are only added to slugs when their signal threshold is met,
  // so slug inclusion is equivalent to score-checking here.
  if (slugs.includes("w05-arousal-control")) highlights.push("w05-arousal-control");
  if (slugs.includes("w13-attention"))        highlights.push("w13-attention");

  const plan: CoursePlan = {
    type: "ai",
    slugs,
    highlights,
    rationale,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ plan });
}
