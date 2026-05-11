/**
 * POST /api/chat/summarize
 * Finds the most recent unsummarized session (messages from a day that has no
 * summary yet) and generates a structured summary using Claude.
 * Called automatically when the chat page loads and the last message is from a
 * previous day — meaning a session just ended.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export const runtime = "nodejs";

type MessageRow = { id: string; role: string; content: string; created_at: string };
type SummaryRow = { session_date: string };

export async function POST() {
  if (!isConfigured) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // Fetch all messages before today
  const allMessages = await dbSelect<MessageRow>("chat_messages", {
    user_id: `eq.${user.id}`,
    created_at: `lt.${today}T00:00:00Z`,
    select: "id,role,content,created_at",
    order: "created_at.asc",
  });

  if (!allMessages.length) return NextResponse.json({ ok: true, reason: "no past messages" });

  // Get already-summarized dates
  const existingSummaries = await dbSelect<SummaryRow>("conversation_summaries", {
    user_id: `eq.${user.id}`,
    select: "session_date",
  });
  const summarizedDates = new Set(existingSummaries.map((s) => s.session_date));

  // Group messages by calendar date
  const byDate: Record<string, MessageRow[]> = {};
  for (const msg of allMessages) {
    const date = msg.created_at.split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(msg);
  }

  // Find most recent unsummarized date
  const unsummarized = Object.keys(byDate)
    .filter((d) => !summarizedDates.has(d))
    .sort();

  if (!unsummarized.length) return NextResponse.json({ ok: true, reason: "all sessions summarized" });

  const dateToSummarize = unsummarized[unsummarized.length - 1];
  const sessionMessages = byDate[dateToSummarize];

  const transcript = sessionMessages
    .map((m) => `${m.role === "user" ? "Athlete" : "Coach AI"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 8000); // cap to stay within token limits

  const prompt = `You are analysing a sports psychology AI coaching conversation for a competitive powerlifter. Extract a concise structured summary.

CONVERSATION DATE: ${dateToSummarize}

${transcript}

Respond with JSON only — no other text:
{
  "summary": "2-3 sentences: what the athlete brought to this session and any shift or insight that emerged",
  "techniques_used": ["Use these specific technique names where applicable: reframing, reframe test, scaling, thought analysis, visualization, mental rehearsal, self-talk upgrade, body scan, body of water, movie screening room, protective veil / barrier, ego state mapping, grounding induction, resource activation, somatic anchoring, validation, Socratic questioning, pattern interruption, perspective shift, normalizing, containment strategy, activation script creation. Use other names only if none of these fit."],
  "themes": ["recurring themes, e.g. pre-competition anxiety, self-doubt, missed lift, injury, confidence, alignment, focus, coach relationship, goal setting, performance pressure"],
  "resonated": "1-2 sentences on what seemed to land or produce a shift — or null if unclear"
}`;

  let parsed: {
    summary: string;
    techniques_used: string[];
    themes: string[];
    resonated: string | null;
  };

  try {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = resp.content[0].type === "text" ? resp.content[0].text.trim() : "{}";
    // Strip any markdown fences if present
    const jsonStr = raw.replace(/^```json?\n?/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }

  // Store (UNIQUE(user_id, session_date) → safe to upsert)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/conversation_summaries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: user.id,
      summary: parsed.summary ?? "",
      techniques_used: parsed.techniques_used ?? [],
      themes: parsed.themes ?? [],
      resonated: parsed.resonated ?? null,
      session_date: dateToSummarize,
      message_count: sessionMessages.length,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Store failed" }, { status: 500 });
  return NextResponse.json({ ok: true, date: dateToSummarize });
}
