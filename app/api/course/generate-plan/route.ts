/**
 * POST /api/course/generate-plan
 *
 * Auth: must be logged in with course_access = true.
 *
 * Calls Claude to produce a personalised, ordered list of week slugs
 * drawn from COURSE_WEEKS, based on the athlete's onboarding data.
 *
 * Returns { plan: CoursePlan } for the athlete to review — does NOT
 * save to the DB automatically. Call /api/course/save-plan to persist.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import { COURSE_WEEKS, type CoursePlan } from "@/lib/course";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const PROFILE_COLS = [
  "id", "course_access",
  "mental_goals", "main_barrier", "confidence_break",
  "overthinking_focus", "previous_mental_work",
  "self_confidence_reg", "self_focus_fatigue",
  "self_handling_pressure", "self_competition_anxiety",
  "self_emotional_recovery", "years_powerlifting", "meet_date",
].join(",");

type ProfileRow = {
  id: string;
  course_access: boolean;
  mental_goals: string[] | null;
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  previous_mental_work: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  years_powerlifting: string | null;
  meet_date: string | null;
};

export async function POST() {
  if (!isConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: PROFILE_COLS,
  });

  if (!rows.length) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const p = rows[0];

  if (!p.course_access) {
    return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  // ── Build the prompt ──────────────────────────────────────────────────────

  const weekList = COURSE_WEEKS.map(
    (w) => `- ${w.slug}: "${w.title}" (${w.theme}) — ${w.overview}`,
  ).join("\n");

  const lines: string[] = [];
  if (p.mental_goals?.length)              lines.push(`Mental goals: ${p.mental_goals.join(", ")}`);
  if (p.main_barrier)                      lines.push(`Main barrier: ${p.main_barrier}`);
  if (p.overthinking_focus)               lines.push(`Overthinking / focus issue: ${p.overthinking_focus}`);
  if (p.confidence_break)                 lines.push(`Confidence: ${p.confidence_break}`);
  if (p.self_confidence_reg    !== null)  lines.push(`Self-rated confidence (1–5): ${p.self_confidence_reg}`);
  if (p.self_focus_fatigue     !== null)  lines.push(`Focus under fatigue (1–5): ${p.self_focus_fatigue}`);
  if (p.self_handling_pressure !== null)  lines.push(`Handling pressure (1–5): ${p.self_handling_pressure}`);
  if (p.self_competition_anxiety !== null) lines.push(`Competition anxiety (1–5): ${p.self_competition_anxiety}`);
  if (p.self_emotional_recovery  !== null) lines.push(`Emotional recovery (1–5): ${p.self_emotional_recovery}`);
  if (p.years_powerlifting)               lines.push(`Years in powerlifting: ${p.years_powerlifting}`);
  if (p.previous_mental_work)             lines.push(`Previous mental work: ${p.previous_mental_work}`);
  if (p.meet_date)                        lines.push(`Next meet date: ${p.meet_date}`);

  const athleteContext = lines.length
    ? lines.join("\n")
    : "No profile data yet — use a well-rounded foundational selection.";

  // Detect if meet is imminent (< 12 weeks away)
  const meetWarning =
    p.meet_date && new Date(p.meet_date).getTime() - Date.now() < 12 * 7 * 24 * 3600 * 1000
      ? "IMPORTANT: This athlete has a meet within 12 weeks — prioritise competition-prep modules (w14-refocus, w15-meet-day) and include them near the end of the plan."
      : "";

  const prompt = `You are a sports psychology course planner for competitive powerlifters.

Available course modules (${COURSE_WEEKS.length} total):
${weekList}

Athlete profile:
${athleteContext}

${meetWarning}

Instructions:
- Select the most relevant modules for this athlete, ordered from most foundational to most advanced.
- 12–16 weeks is optimal for athletes without prior sports psychology experience. Aim for this range unless there is a strong reason for fewer.
- Minimum 8 modules — never go below this.
- Cover at least 4 of the 7 themes.
- Prioritise modules that directly address the athlete's lowest self-ratings and stated barriers.
- Do not include duplicate slugs.

Return ONLY valid JSON with no markdown fences, no explanation outside the JSON object:
{
  "slugs": ["slug-a", "slug-b", ...],
  "rationale": "2–3 sentences personalised to this athlete explaining the plan focus and why this sequence was chosen."
}`;

  // ── Call Claude ───────────────────────────────────────────────────────────

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Strip accidental markdown fences
    const jsonStr = raw.startsWith("```") ? raw.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "") : raw;
    const parsed = JSON.parse(jsonStr) as { slugs: unknown; rationale: unknown };

    if (!Array.isArray(parsed.slugs)) throw new Error("slugs is not an array");

    const validSlugs = new Set(COURSE_WEEKS.map((w) => w.slug));
    const cleanSlugs = (parsed.slugs as unknown[])
      .filter((s): s is string => typeof s === "string" && validSlugs.has(s))
      .filter((s, i, arr) => arr.indexOf(s) === i); // dedupe

    if (cleanSlugs.length < 8) {
      console.error("generate-plan: AI returned too few valid slugs:", cleanSlugs);
      return NextResponse.json(
        { error: "Plan generation returned too few weeks — please try again." },
        { status: 500 },
      );
    }

    const plan: CoursePlan = {
      type: "ai",
      slugs: cleanSlugs,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("generate-plan error:", err);
    return NextResponse.json({ error: "Plan generation failed — please try again." }, { status: 500 });
  }
}
