/**
 * GET   /api/admin/seminar — every sign-up for the current seminar, newest first,
 *   plus the topic tally and whether the minimum has been reached.
 *
 * PATCH /api/admin/seminar — move one sign-up between statuses.
 *   Body: { id: string; status: "registered" | "waitlist" | "cancelled" }
 *   Used to promote someone off the waitlist when a seat frees up.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { SEMINAR, spotsLeft, meetsMinimum, tallyTopics, type SignupStatus } from "@/lib/seminar";

export const dynamic = "force-dynamic";

export type SeminarSignupRow = {
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
  created_at: string;
};

const STATUSES: SignupStatus[] = ["registered", "waitlist", "cancelled"];

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const signups = await dbSelect<SeminarSignupRow>("seminar_signups", {
    select:       "id,full_name,email,country,context,topics,format_pref,materials,question,status,created_at",
    seminar_slug: `eq.${SEMINAR.slug}`,
    order:        "created_at.desc",
    limit:        "500",
  });

  const registered = signups.filter((s) => s.status === "registered");

  return NextResponse.json({
    signups,
    seminar: {
      title:      SEMINAR.title,
      startsAt:   SEMINAR.startsAt,
      hostTime:   SEMINAR.hostTimeLabel,
      min:        SEMINAR.minParticipants,
      max:        SEMINAR.maxParticipants,
    },
    stats: {
      registered:   registered.length,
      waitlist:     signups.filter((s) => s.status === "waitlist").length,
      cancelled:    signups.filter((s) => s.status === "cancelled").length,
      spotsLeft:    spotsLeft(registered.length),
      meetsMinimum: meetsMinimum(registered.length),
    },
    // Tallied over people actually attending, not cancellations.
    topics: tallyTopics(registered),
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("[admin/seminar] invalid JSON", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status } = body;
  if (!id || !status || !STATUSES.includes(status as SignupStatus)) {
    return NextResponse.json({ error: "Expected { id, status }" }, { status: 400 });
  }

  // dbPatch takes RAW match values — it adds the eq. prefix itself.
  const ok = await dbPatch("seminar_signups", { id }, { status });
  if (!ok) {
    return NextResponse.json({ error: "Update failed — no matching sign-up." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
