/**
 * POST /api/admin/summarize-batch
 * Admin-only. Finds every session-day in chat_messages that has no corresponding
 * conversation_summaries row (across ALL users), runs each through Claude, and
 * writes the summaries. Skips today (sessions may still be in progress).
 *
 * Returns { processed: number, skipped: number, errors: number, results: [...] }
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
// Batch summarization can take a while — allow up to 5 minutes
export const maxDuration = 300;

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anthropic    = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

async function verifyAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase() === adminEmail;
}

type MessageRow = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

type SummaryRow = {
  user_id: string;
  session_date: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch all historical messages (excluding today — sessions may still be open)
  const [allMessages, existingSummaries] = await Promise.all([
    dbSelect<MessageRow>("chat_messages", {
      created_at: `lt.${today}T00:00:00Z`,
      select: "id,user_id,role,content,created_at",
      order: "created_at.asc",
      limit: "10000",
    }),
    dbSelect<SummaryRow>("conversation_summaries", {
      select: "user_id,session_date",
    }),
  ]);

  // Build set of already-summarized (user_id, date) pairs
  const summarized = new Set(
    existingSummaries.map((s) => `${s.user_id}::${s.session_date}`)
  );

  // Group messages by user_id → date
  const byUserDate: Record<string, Record<string, MessageRow[]>> = {};
  for (const msg of allMessages) {
    const date = msg.created_at.split("T")[0];
    if (!byUserDate[msg.user_id]) byUserDate[msg.user_id] = {};
    if (!byUserDate[msg.user_id][date]) byUserDate[msg.user_id][date] = [];
    byUserDate[msg.user_id][date].push(msg);
  }

  // Collect all gaps (sessions without a summary)
  const gaps: Array<{ userId: string; date: string; messages: MessageRow[] }> = [];
  for (const [userId, dateMap] of Object.entries(byUserDate)) {
    for (const [date, messages] of Object.entries(dateMap)) {
      if (!summarized.has(`${userId}::${date}`)) {
        // Only include sessions with at least 4 messages (meaningful conversation)
        if (messages.length >= 4) {
          gaps.push({ userId, date, messages });
        }
      }
    }
  }

  // Sort oldest first so memory builds chronologically
  gaps.sort((a, b) => a.date.localeCompare(b.date));

  const results: Array<{
    userId: string;
    date: string;
    status: "ok" | "error" | "skipped";
    techniques?: string[];
    error?: string;
  }> = [];

  for (const { userId, date, messages } of gaps) {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Athlete" : "Coach AI"}: ${m.content}`)
      .join("\n\n")
      .slice(0, 8000);

    const prompt = `You are analysing a sports psychology AI coaching conversation for a competitive powerlifter. Extract a concise structured summary.

CONVERSATION DATE: ${date}

${transcript}

Respond with JSON only — no other text:
{
  "summary": "2-3 sentences: what the athlete brought to this session and any shift or insight that emerged",
  "techniques_used": ["Use these specific technique names where applicable: reframing, reframe test, scaling, thought analysis, visualization, mental rehearsal, self-talk upgrade, body scan, body of water, movie screening room, protective veil / barrier, ego state mapping, grounding induction, resource activation, somatic anchoring, validation, Socratic questioning, pattern interruption, perspective shift, normalizing, containment strategy, activation script creation. Use other names only if none of these fit."],
  "themes": ["recurring themes, e.g. pre-competition anxiety, self-doubt, missed lift, injury, confidence, alignment, focus, coach relationship, goal setting, performance pressure"],
  "resonated": "1-2 sentences on what seemed to land or produce a shift — or null if unclear"
}`;

    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5",  // cheaper for batch work
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = resp.content[0].type === "text" ? resp.content[0].text.trim() : "{}";
      const jsonStr = raw.replace(/^```json?\n?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(jsonStr) as {
        summary: string;
        techniques_used: string[];
        themes: string[];
        resonated: string | null;
      };

      // Upsert into conversation_summaries
      const res = await fetch(`${SUPABASE_URL}/rest/v1/conversation_summaries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          session_date: date,
          summary: parsed.summary ?? "",
          techniques_used: parsed.techniques_used ?? [],
          themes: parsed.themes ?? [],
          resonated: parsed.resonated ?? null,
          message_count: messages.length,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        results.push({ userId, date, status: "error", error: `DB write failed: ${txt}` });
      } else {
        results.push({ userId, date, status: "ok", techniques: parsed.techniques_used });
      }
    } catch (e) {
      results.push({ userId, date, status: "error", error: String(e) });
    }

    // Throttle: 300ms between Claude calls to stay within rate limits
    await sleep(300);
  }

  return NextResponse.json({
    processed: results.filter((r) => r.status === "ok").length,
    errors:    results.filter((r) => r.status === "error").length,
    skipped:   results.filter((r) => r.status === "skipped").length,
    results,
  });
}
