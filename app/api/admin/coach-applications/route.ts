/**
 * GET   /api/admin/coach-applications — every application, newest first.
 * PATCH /api/admin/coach-applications — set status and/or working notes.
 *   Body: { id: string; status?: ApplicationStatus; notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/coachApply";

export const dynamic = "force-dynamic";

export type CoachApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  instagram: string | null;
  website: string | null;
  qualification: string | null;
  experience: string | null;
  languages: string[];
  athletes: string | null;
  motivation: string;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
};

const SELECT =
  "id,full_name,email,country,instagram,website,qualification,experience,languages,athletes,motivation,status,notes,created_at";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const applications = await dbSelect<CoachApplicationRow>("coach_applications", {
    select: SELECT,
    order:  "created_at.desc",
    limit:  "500",
  });

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return NextResponse.json({ applications, counts });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; status?: string; notes?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error("[admin/coach-applications] invalid JSON", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status, notes } = body;
  if (!id) return NextResponse.json({ error: "Expected { id }" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = status;
  }
  if (notes !== undefined) patch.notes = String(notes).slice(0, 4000) || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // dbPatch takes RAW match values — it adds the eq. prefix itself.
  const ok = await dbPatch("coach_applications", { id }, patch);
  if (!ok) {
    return NextResponse.json({ error: "Update failed — no matching application." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
