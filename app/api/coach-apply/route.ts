/**
 * POST /api/coach-apply — public, unauthenticated application to become a
 * PowerFlow affiliated coach.
 *
 *   Body:     CoachApplication fields + `consent: true` + honeypot `website2`
 *   Response: { ok: true, already?: true }
 *   Side effects: confirmation to the applicant, notification to the owner.
 *
 * Anyone with the link can post here, so this carries the same defences as the
 * seminar route: per-IP rate limit, a honeypot, strict whitelist validation in
 * lib/coachApply.ts, and a unique index on lower(email).
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { dbSelect, dbInsert } from "@/lib/supabaseAdmin";
import { validateApplication } from "@/lib/coachApply";
import { sendApplicantConfirmation, notifyOwnerOfApplication } from "@/lib/coachApplyEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; status: string };

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`coach-apply:${ip}`, { limit: 5, windowSec: 900 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[coach-apply] invalid JSON", err);
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot. Named `website2` because the form has a real `website` field —
  // a bot filling everything would trip this, a human never sees it.
  const hp = (body as Record<string, unknown>)?.website2;
  if (typeof hp === "string" && hp !== "") {
    console.warn("[coach-apply] honeypot tripped from", ip);
    return NextResponse.json({ ok: true });
  }

  const parsed = validateApplication(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const app = parsed.value;

  // Already applied? Say so rather than failing on the unique index. We do not
  // overwrite the earlier application — the first version is the one David read.
  const existing = await dbSelect<Row>("coach_applications", {
    select: "id,status",
    email:  `eq.${app.email}`,
    limit:  "1",
  });
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, already: true });
  }

  const inserted = await dbInsert("coach_applications", {
    full_name:     app.fullName,
    email:         app.email,
    country:       app.country,
    instagram:     app.instagram,
    website:       app.website,
    qualification: app.qualification,
    experience:    app.experience,
    languages:     app.languages,
    athletes:      app.athletes,
    motivation:    app.motivation,
  });

  if (!inserted) {
    console.error("[coach-apply] insert failed for", app.email);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }

  // Both are best-effort and log their own failures — the row is already
  // written, so a mail outage must not turn a saved application into an error.
  await Promise.all([
    sendApplicantConfirmation(app),
    notifyOwnerOfApplication(app),
  ]);

  return NextResponse.json({ ok: true });
}
