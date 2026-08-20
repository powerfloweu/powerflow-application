/**
 * Self-service management of one seminar sign-up, reached from the link in the
 * confirmation email.
 *
 *   GET    /api/seminar/manage/<token> — the sign-up behind this token
 *   PATCH  /api/seminar/manage/<token> — change topics / format / materials / question
 *   DELETE /api/seminar/manage/<token> — cancel the place (soft: status = cancelled)
 *
 * The token IS the credential — these people have no PowerFlow account. So:
 * name and email are not editable here (that would make a leaked link an
 * account takeover), every verb is rate limited by IP, and an unknown token
 * gets a flat 404 with no hint about whether it ever existed.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { sendPromoted } from "@/lib/seminarEmails";
import {
  SEMINAR,
  validateSelections,
  statusForNextSignup,
  type SignupStatus,
  type SeminarSignup,
} from "@/lib/seminar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  context: string | null;
  topics: string[];
  format_pref: string | null;
  materials: string[];
  question: string | null;
  status: SignupStatus;
  manage_token: string;
  created_at: string;
};

const SELECT = "id,full_name,email,country,context,topics,format_pref,materials,question,status,manage_token,created_at";

/** Rejects anything that isn't a uuid before it reaches the database. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notFound = () =>
  NextResponse.json({ error: "That link isn't valid any more." }, { status: 404 });

async function findByToken(token: string): Promise<Row | null> {
  if (!UUID_RE.test(token)) return null;
  const rows = await dbSelect<Row>("seminar_signups", {
    select:       SELECT,
    manage_token: `eq.${token}`,
    limit:        "1",
  });
  return rows[0] ?? null;
}

/** Only what the page needs — no ids, no token echoed back. */
function present(row: Row) {
  return {
    fullName:   row.full_name,
    email:      row.email,
    topics:     row.topics ?? [],
    formatPref: row.format_pref,
    materials:  row.materials ?? [],
    question:   row.question,
    status:     row.status,
  };
}

function toSignup(row: Row): SeminarSignup {
  return {
    fullName:   row.full_name,
    email:      row.email,
    country:    row.country,
    context:    row.context,
    topics:     row.topics ?? [],
    formatPref: row.format_pref,
    materials:  row.materials ?? [],
    question:   row.question,
  };
}

async function limit(req: NextRequest, verb: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return rateLimit(`seminar-manage:${verb}:${ip}`, { limit: 30, windowSec: 300 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = await limit(req, "get");
  if (!rl.ok) return rateLimitResponse(rl);

  const row = await findByToken((await params).token);
  if (!row) return notFound();

  return NextResponse.json({
    signup:  present(row),
    seminar: {
      title:    SEMINAR.title,
      startsAt: SEMINAR.startsAt,
      hostTime: SEMINAR.hostTimeLabel,
      duration: SEMINAR.durationLabel,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = await limit(req, "patch");
  if (!rl.ok) return rateLimitResponse(rl);

  const row = await findByToken((await params).token);
  if (!row) return notFound();
  if (row.status === "cancelled") {
    return NextResponse.json(
      { error: "This place has been cancelled. Sign up again to rejoin." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[seminar/manage] invalid JSON", err);
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const parsed = validateSelections(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const ok = await dbPatch("seminar_signups", { id: row.id }, {
    topics:      parsed.value.topics,
    format_pref: parsed.value.formatPref,
    materials:   parsed.value.materials,
    question:    parsed.value.question,
  });
  if (!ok) {
    console.error("[seminar/manage] update failed for", row.id);
    return NextResponse.json({ error: "We couldn't save that. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signup: { ...present(row), ...parsed.value } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = await limit(req, "delete");
  if (!rl.ok) return rateLimitResponse(rl);

  const row = await findByToken((await params).token);
  if (!row) return notFound();
  // Cancelling twice is not an error — the outcome they wanted already holds.
  if (row.status === "cancelled") {
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  const wasRegistered = row.status === "registered";

  const ok = await dbPatch("seminar_signups", { id: row.id }, { status: "cancelled" });
  if (!ok) {
    console.error("[seminar/manage] cancel failed for", row.id);
    return NextResponse.json({ error: "We couldn't cancel that. Please try again." }, { status: 500 });
  }

  // Giving up a seat should hand it to whoever is next, not leave it idle
  // until the owner notices.
  if (wasRegistered) await promoteNextFromWaitlist();

  return NextResponse.json({ ok: true, status: "cancelled" });
}

/**
 * Promote the longest-waiting person, if a seat is genuinely free. Re-checks
 * capacity rather than assuming, since the owner may have moved people by hand.
 */
async function promoteNextFromWaitlist(): Promise<void> {
  const registered = await dbSelect<{ id: string }>("seminar_signups", {
    select:       "id",
    seminar_slug: `eq.${SEMINAR.slug}`,
    status:       "eq.registered",
    limit:        "500",
  });
  if (statusForNextSignup(registered.length) !== "registered") return;

  const [next] = await dbSelect<Row>("seminar_signups", {
    select:       SELECT,
    seminar_slug: `eq.${SEMINAR.slug}`,
    status:       "eq.waitlist",
    order:        "created_at.asc",
    limit:        "1",
  });
  if (!next) return;

  const ok = await dbPatch("seminar_signups", { id: next.id }, { status: "registered" });
  if (!ok) {
    console.error("[seminar/manage] promotion failed for", next.id);
    return;
  }

  await sendPromoted(toSignup(next), next.manage_token);
}
