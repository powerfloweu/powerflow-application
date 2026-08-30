/**
 * GET /api/cron/seminar-reminder — emails registered attendees the day before.
 *
 * Runs daily and does nothing on every day but one. It fires when the seminar
 * is inside REMIND_WITHIN_HOURS and still in the future, so a missed day (a
 * failed deploy, a cron outage) is picked up by the next run rather than being
 * lost — which a single hard-coded date would not survive.
 *
 * Idempotent via seminar_signups.reminder_sent_at: a re-run, a retry, or two
 * overlapping fires cannot email the same person twice.
 */

import { NextRequest, NextResponse } from "next/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { sendReminder } from "@/lib/seminarEmails";
import { SEMINAR, joinUrl, type SeminarSignup } from "@/lib/seminar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Send once the seminar is within this many hours. */
const REMIND_WITHIN_HOURS = 36;

type Row = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  context: string | null;
  topics: string[];
  question: string | null;
  preferred_language: string | null;
  manage_token: string;
};

export async function GET(req: NextRequest) {
  // Same guard as the other crons: Vercel sends the secret as a bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startsAt = new Date(SEMINAR.startsAt).getTime();
  const hoursAway = (startsAt - Date.now()) / 3_600_000;

  if (hoursAway <= 0) {
    return NextResponse.json({ ok: true, reason: "seminar has passed", sent: 0 });
  }
  if (hoursAway > REMIND_WITHIN_HOURS) {
    return NextResponse.json({ ok: true, reason: "too early", hoursAway: Math.round(hoursAway), sent: 0 });
  }

  const rows = await dbSelect<Row>("seminar_signups", {
    select:          "id,full_name,email,country,context,topics,question,preferred_language,manage_token",
    seminar_slug:    `eq.${SEMINAR.slug}`,
    // Registered only — nobody on the waitlist has a seat to be reminded about,
    // and a cancelled person must never hear from us again.
    status:          "eq.registered",
    reminder_sent_at: "is.null",
    limit:           "500",
  });

  let sent = 0, failed = 0;

  for (const row of rows) {
    const signup: SeminarSignup = {
      fullName:          row.full_name,
      email:             row.email,
      country:           row.country,
      context:           row.context,
      topics:            row.topics ?? [],
      question:          row.question,
      preferredLanguage: row.preferred_language ?? "en",
    };

    // Mark first, then send. If the send fails we have recorded an attempt and
    // will not retry — a duplicate reminder is worse than a missing one, and a
    // failure is visible in the logs either way.
    const marked = await dbPatch("seminar_signups", { id: row.id }, {
      reminder_sent_at: new Date().toISOString(),
    });
    if (!marked) {
      console.error("[seminar-reminder] could not mark", row.email, "— skipping to avoid a double send");
      failed++;
      continue;
    }

    if (await sendReminder(signup, row.manage_token)) sent++;
    else failed++;
  }

  const linkReady = !!joinUrl();
  if (!linkReady && sent > 0) {
    console.warn("[seminar-reminder] SEMINAR_JOIN_URL is not set — reminders went out without a joining link");
  }

  return NextResponse.json({
    ok: true,
    hoursAway: Math.round(hoursAway),
    candidates: rows.length,
    sent,
    failed,
    // Surfaced so a run that sent reminders without the Meet link is obvious.
    joinUrlConfigured: linkReady,
  });
}
