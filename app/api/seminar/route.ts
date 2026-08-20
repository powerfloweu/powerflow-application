/**
 * GET  /api/seminar — public availability. Returns no personal data at all,
 *   only what the form needs to render: { spotsLeft, isFull, closed }.
 *
 * POST /api/seminar — public, unauthenticated sign-up.
 *   Body:     SeminarSignup fields + `consent: true` + honeypot `website`
 *   Response: { ok: true, status: "registered" | "waitlist", already?: true }
 *   Side effects: confirmation email to the registrant, notification to the owner.
 *
 * Anyone with the link can post here, so this route carries the usual public
 * defences: per-IP rate limit, a honeypot field, strict whitelist validation in
 * lib/seminar.ts, and a unique index on (seminar_slug, lower(email)).
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { notifyOwner, sendConfirmation } from "@/lib/seminarEmails";
import {
  SEMINAR,
  validateSignup,
  spotsLeft,
  statusForNextSignup,
  type SignupStatus,
} from "@/lib/seminar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignupRow = { id: string; status: SignupStatus };

/** Sign-ups close once the seminar has started. */
function isClosed(): boolean {
  return Date.now() >= new Date(SEMINAR.startsAt).getTime();
}

async function countRegistered(): Promise<number> {
  const rows = await dbSelect<SignupRow>("seminar_signups", {
    select:       "id,status",
    seminar_slug: `eq.${SEMINAR.slug}`,
    status:       "eq.registered",
    limit:        "500",
  });
  return rows.length;
}

export async function GET() {
  const registered = await countRegistered();
  return NextResponse.json({
    spotsLeft: spotsLeft(registered),
    isFull:    spotsLeft(registered) === 0,
    closed:    isClosed(),
  });
}

export async function POST(req: NextRequest) {
  if (isClosed()) {
    return NextResponse.json({ error: "Sign-ups for this seminar have closed." }, { status: 410 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`seminar:${ip}`, { limit: 5, windowSec: 300 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[seminar] invalid JSON", err);
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot: a hidden field no human ever fills. Answer 200 so a bot cannot
  // tell it was caught, but store nothing.
  if (typeof (body as Record<string, unknown>)?.website === "string" &&
      (body as Record<string, unknown>).website !== "") {
    console.warn("[seminar] honeypot tripped from", ip);
    return NextResponse.json({ ok: true, status: "registered" });
  }

  const parsed = validateSignup(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const signup = parsed.value;

  // Already signed up? Report their existing status rather than failing on the
  // unique index — people re-submit when they aren't sure it went through.
  const existing = await dbSelect<SignupRow>("seminar_signups", {
    select:       "id,status",
    seminar_slug: `eq.${SEMINAR.slug}`,
    email:        `eq.${signup.email}`,
    limit:        "1",
  });
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, status: existing[0].status, already: true });
  }

  const status = statusForNextSignup(await countRegistered());

  const inserted = await dbInsert("seminar_signups", {
    seminar_slug: SEMINAR.slug,
    full_name:    signup.fullName,
    email:        signup.email,
    country:      signup.country,
    context:      signup.context,
    topics:       signup.topics,
    format_pref:  signup.formatPref,
    materials:    signup.materials,
    question:     signup.question,
    status,
  });

  if (!inserted) {
    // Most likely cause is the unique index racing with the check above, which
    // means they are in fact signed up — but we cannot prove that here, so this
    // stays an error rather than a cheerful lie.
    console.error("[seminar] insert failed for", signup.email);
    return NextResponse.json(
      { error: "We couldn't save your sign-up. Please try again." },
      { status: 500 },
    );
  }

  // Both are best-effort and log their own failures — the row is already
  // written, so a mail outage must not turn a successful sign-up into an error.
  await Promise.all([
    sendConfirmation(signup, status),
    notifyOwner(signup, status),
  ]);

  return NextResponse.json({ ok: true, status });
}
