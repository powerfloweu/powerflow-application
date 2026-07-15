/**
 * GET /api/cron/coach-digests
 *
 * The "loop". Daily (Vercel Cron). For every athlete who has written at least
 * 2 journal entries in the trailing 5 days AND has a new entry since their last
 * digest, calls Claude to produce a trend summary + a drafted coach message in
 * the PowerFlow coaching-AI voice, and stores it for the coach to review.
 *
 * Nothing is sent to the athlete — the coach reviews every draft.
 * Protected by CRON_SECRET (Vercel sends `Authorization: Bearer <CRON_SECRET>`).
 */

import { NextRequest, NextResponse } from "next/server";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import Anthropic from "@anthropic-ai/sdk";
import {
  DIGEST_MODEL, DIGEST_SYSTEM, buildDigestUserPrompt, parseDigest,
  type DigestEntry,
} from "@/lib/coachDigest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const WINDOW_DAYS = 5;
const MIN_ENTRIES = 2;
const MAX_ATHLETES_PER_RUN = 40; // cost/time guard; logged if exceeded

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

type Athlete = { id: string; display_name: string; coach_id: string | null };
type EntryRow = { content: string; sentiment: string | null; created_at: string };

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const windowStartIso = windowStart.toISOString();

  // Athletes who have a coach.
  const athletes = await dbSelect<Athlete>("profiles", {
    select: "id,display_name,coach_id",
    role: "eq.athlete",
    coach_id: "not.is.null",
    limit: "1000",
  }).catch(() => [] as Athlete[]);

  let considered = 0, generated = 0, skipped = 0, failed = 0, capped = 0;

  for (const a of athletes) {
    if (!a.coach_id) continue;

    const entries = await dbSelect<EntryRow>("journal_entries", {
      user_id: `eq.${a.id}`,
      created_at: `gte.${windowStartIso}`,
      order: "created_at.asc",
      select: "content,sentiment,created_at",
      limit: "50",
    }).catch(() => [] as EntryRow[]);

    if (entries.length < MIN_ENTRIES) continue;
    considered++;

    if (generated >= MAX_ATHLETES_PER_RUN) { capped++; continue; }

    const latestEntryAt = entries[entries.length - 1].created_at;

    // Dedup: skip if we already have a digest for this exact newest entry.
    const existing = await dbSelect<{ id: string }>("coach_digests", {
      athlete_id: `eq.${a.id}`,
      latest_entry_at: `eq.${latestEntryAt}`,
      select: "id",
      limit: "1",
    }).catch(() => []);
    if (existing.length) { skipped++; continue; }

    const digestEntries: DigestEntry[] = entries.map((e) => ({
      created_at: e.created_at, content: e.content, sentiment: e.sentiment,
    }));

    let out;
    try {
      const resp = await anthropic.messages.create({
        model: DIGEST_MODEL,
        max_tokens: 1024,
        system: DIGEST_SYSTEM,
        messages: [{ role: "user", content: buildDigestUserPrompt(a.display_name, digestEntries) }],
      });
      const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      out = parseDigest(text);
    } catch (err) {
      console.error(`[coach-digests] AI call failed for athlete ${a.id}`, err);
      failed++;
      continue;
    }
    if (!out) { failed++; continue; }

    const inserted = await dbInsert("coach_digests", {
      coach_id: a.coach_id,
      athlete_id: a.id,
      period_start: ymd(windowStart),
      period_end: ymd(now),
      entry_count: entries.length,
      latest_entry_at: latestEntryAt,
      summary: out.summary,
      draft_message: out.draft_message,
      model: DIGEST_MODEL,
    });
    if (!inserted) { failed++; continue; }

    generated++;
    // Notify the coach a draft is waiting (gated by their push subscription).
    await sendPushToUser(a.coach_id, {
      title: `AI draft ready — ${a.display_name}`,
      body: out.summary.length > 120 ? out.summary.slice(0, 120) + "…" : out.summary,
      url: "/coach/activity",
      tag: `coach-digest-${a.id}`,
    }).catch((err) => console.error("[coach-digests] push failed", err));
  }

  return NextResponse.json({
    athletes: athletes.length, considered, generated, skipped, failed, capped,
  });
}
