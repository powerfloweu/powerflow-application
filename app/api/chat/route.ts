/**
 * POST /api/chat — Streaming AI coaching endpoint.
 * Authenticates, verifies ai_access, fetches full athlete context,
 * builds system prompt, and streams response from Anthropic.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";
import type { AthleteProfile } from "@/lib/athlete";
import type { Voice } from "@/lib/voices";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// ── Types for fetched context ─────────────────────────────────────────────────

type JournalEntryContext = {
  content: string;
  sentiment: string;
  themes: string[];
  created_at: string;
};

type TrainingEntryContext = {
  entry_date: string;
  is_training_day: boolean;
  mood_rating: number | null;
  thoughts_before: string | null;
  thoughts_after: string | null;
};

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(
  profile: AthleteProfile,
  entries: JournalEntryContext[],
  voices: Voice[],
  training: TrainingEntryContext[],
): string {
  // Collect all themes from recent entries
  const allThemes = entries.flatMap((e) => e.themes ?? []);
  const themeCounts: Record<string, number> = {};
  for (const t of allThemes) {
    themeCounts[t] = (themeCounts[t] ?? 0) + 1;
  }
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  // Average mood from training days
  const trainingWithMood = training.filter(
    (t) => t.is_training_day && t.mood_rating != null
  );
  const avgMood =
    trainingWithMood.length > 0
      ? (
          trainingWithMood.reduce((s, t) => s + (t.mood_rating ?? 0), 0) /
          trainingWithMood.length
        ).toFixed(1)
      : null;

  // Viz cue words
  const vizKw = profile.viz_keywords ?? {};
  const squatCues = (vizKw["viz-squat"] ?? []).join(", ") || "none saved";
  const benchCues = (vizKw["viz-bench"] ?? []).join(", ") || "none saved";
  const deadliftCues = (vizKw["viz-deadlift"] ?? []).join(", ") || "none saved";

  // Voices summary
  const voicesSummary =
    voices.length > 0
      ? voices
          .map(
            (v) =>
              `- "${v.name}" (${v.shape}, located: ${v.body_locations.join(", ") || "unspecified"}; helps when: ${v.helps_when.join(", ") || "not specified"})`
          )
          .join("\n")
      : "No voices mapped yet.";

  // Recent journal entries (last 8, condensed)
  const recentEntriesText =
    entries.slice(0, 8).length > 0
      ? entries
          .slice(0, 8)
          .map((e) => {
            const date = new Date(e.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            return `[${date} · ${e.sentiment}] ${e.content.slice(0, 300)}${e.content.length > 300 ? "…" : ""}`;
          })
          .join("\n\n")
      : "No recent entries.";

  const name = profile.display_name || "Athlete";
  const meetDate = profile.meet_date
    ? new Date(profile.meet_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not set";
  const weightClass = profile.weight_category ?? "Not set";
  const trainingDays = profile.training_days_per_week
    ? `${profile.training_days_per_week}×/week`
    : "Not set";
  const mentalGoals =
    (profile.mental_goals ?? []).filter(Boolean).join("; ") || "Not specified";
  const mainBarrier = profile.main_barrier ?? "Not specified";
  const conf = profile.self_confidence_reg ?? "?";
  const focus = profile.self_focus_fatigue ?? "?";
  const pressure = profile.self_handling_pressure ?? "?";
  const anxiety = profile.self_competition_anxiety ?? "?";

  return `You are the PowerFlow coaching AI — built on hundreds of hours of real coaching sessions with competitive powerlifters. You think and respond exactly as a high-performance mental coach would: direct, warm, evidence-based, and always grounded in what the athlete actually told you.

## Your coaching methodology

### Voice / Parts work
Every internal voice the athlete hears is a part of them — it exists because they created it and need it. Your job is never to silence these voices but to give them the right context. A harsh inner critic useful during technique review becomes destructive the night before a competition. Help athletes:
- Name their voices (e.g. "The Cheater", "The Warrior")
- Locate where they feel each voice in the body
- Understand when each voice serves them — and when to tell it to step back
- Give every voice a purpose so it can show up at the right time

### Reframing
When an athlete presents a negative self-judgment, don't argue with it directly. Instead:
1. Acknowledge it: "I hear that."
2. Find the concrete evidence question: "What would prove this wrong in 3 weeks?"
3. Set the reframe test: "Search for those clues."
Never tell an athlete their thought is wrong. Ask what evidence would change their mind.

### Visualization
Effective visualization is sensory, specific, and lift-specific. It uses the athlete's own language. When generating a script:
- Use first person, present tense ("I step up to the bar")
- Reference their actual cue words if they've saved any
- Include the physical setup (chalk, belt, walkout, breath)
- End on the completion, not just the lift

### Somatic awareness
Emotions live in the body. When an athlete describes a feeling, ask: where do you feel it? What shape, size, tone? This isn't metaphor — it's data. Grounding techniques work through the body, not around it.

### Competition anxiety
Pre-competition anxiety is energy, not a problem. The goal is not to remove it — it's to channel it. If an athlete says they're nervous, ask: "What would happen if you let that energy work FOR you?"

### Powerlifting specifics
- Attempts selection is a high-stakes decision point: calm, data-driven, not emotion-driven
- The warmup room is not for PR attempts in your head
- Openers should feel boring. Save the fire for the third attempt
- Sleep and nutrition the night before matter more than any mental technique

## What you can do

1. **Talk through what's going on** — listen, reflect, ask one good question at a time
2. **Pinpoint the right tool** — based on what the athlete shares, recommend: visualization, relaxation breathing, PMR, affirmations, or voice work
3. **Generate a personalized visualization script** — for squat, bench, or deadlift, using their saved cue words
4. **Walk through voice work** — help them name, locate, and find purpose for a recurring internal voice
5. **Create a reframe test** — take a negative thought and build a concrete evidence check
6. **Reference their patterns** — use their journal themes, training mood data, and meet date to contextualize advice

## Rules

- Ask one question at a time. Don't overwhelm.
- Be specific. "What did you tell yourself when you missed that lift?" beats "How are you feeling?"
- Never diagnose. If an athlete describes persistent low mood, sleep disruption, or hopelessness, gently point toward professional support.
- Keep responses concise — 3–5 sentences for reflections, longer only for generated scripts.
- When you recommend a tool, name it clearly: "I'd use **visualization** here" or "This sounds like a **voice work** moment."
- When you generate a script, format it in a clearly marked block.

## Athlete context

Name: ${name}
Next competition: ${meetDate}
Weight class: ${weightClass}
Training days/week: ${trainingDays}

Recent journal themes (last 2 weeks): ${topThemes.length > 0 ? topThemes.join(", ") : "None recorded"}
Average mood (training days, last 7 days): ${avgMood != null ? `${avgMood}/10` : "No data"}

Mapped voices:
${voicesSummary}

Saved visualization cues:
- Squat: ${squatCues}
- Bench: ${benchCues}
- Deadlift: ${deadliftCues}

Mental goals: ${mentalGoals}
Main barrier: ${mainBarrier}
Self-ratings: confidence ${conf}/10 · focus ${focus}/10 · pressure ${pressure}/10 · anxiety ${anxiety}/10

Recent journal entries (for context, not to quote back verbatim):
${recentEntriesText}`;
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse body
  let body: { messages: { role: "user" | "assistant"; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // Fetch profile and verify ai_access
  const profiles = await dbSelect<AthleteProfile>("profiles", {
    id: `eq.${user.id}`,
    select: [
      "id", "display_name", "meet_date", "weight_category", "training_days_per_week",
      "mental_goals", "main_barrier",
      "self_confidence_reg", "self_focus_fatigue", "self_handling_pressure",
      "self_competition_anxiety", "self_emotional_recovery",
      "viz_keywords", "affirmations", "ai_access",
    ].join(","),
  });

  const profile = profiles[0] as AthleteProfile | undefined;
  if (!profile || !profile.ai_access) {
    return NextResponse.json({ error: "AI access not enabled" }, { status: 403 });
  }

  // Fetch context in parallel
  const [entries, voices, training] = await Promise.all([
    dbSelect<JournalEntryContext>("journal_entries", {
      user_id: `eq.${user.id}`,
      select: "content,sentiment,themes,created_at",
      order: "created_at.desc",
      limit: "15",
    }),
    dbSelect<Voice>("voices", {
      user_id: `eq.${user.id}`,
      select: "*",
      order: "updated_at.desc",
    }),
    dbSelect<TrainingEntryContext>("training_entries", {
      user_id: `eq.${user.id}`,
      select: "entry_date,is_training_day,mood_rating,thoughts_before,thoughts_after",
      order: "entry_date.desc",
      limit: "7",
    }),
  ]);

  const systemPrompt = buildSystemPrompt(profile, entries, voices, training);

  // Limit to last 20 messages
  const messages = body.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Stream from Anthropic
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system: systemPrompt,
    messages,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
