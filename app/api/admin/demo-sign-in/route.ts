/**
 * POST /api/admin/demo-sign-in
 *
 * Returns an email OTP for the requested demo account (coach or athlete) so
 * the caller can verify it client-side via supabase.auth.verifyOtp().
 * No email sent, no redirect chain, no Supabase redirect allowlist needed.
 *
 * Body: { account: "coach" | "athlete" }
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

const SB_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEMO_COACH_EMAIL   = "demo.coach@powerflow.training";
const DEMO_ATHLETE_EMAIL = "demo.athlete@powerflow.training";
const DEMO_COACH_TAG     = "DEMO_COACH";
const DEMO_ATHLETE_TAG   = "DEMO_ATHLETE";

export async function POST(req: Request) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { account?: string };
  const account = body.account === "athlete" ? "athlete" : "coach";

  const email     = account === "athlete" ? DEMO_ATHLETE_EMAIL : DEMO_COACH_EMAIL;
  const coachNotes = account === "athlete" ? DEMO_ATHLETE_TAG  : DEMO_COACH_TAG;
  const redirectTo = account === "athlete" ? "/today"          : "/coach/athletes";

  // Verify the account exists
  type Row = { id: string };
  const rows = await dbSelect<Row>("profiles", {
    coach_notes: `eq.${coachNotes}`,
    select: "id",
  });
  if (rows.length === 0) {
    return NextResponse.json(
      { error: `Demo ${account} not found — seed demo data first.` },
      { status: 404 }
    );
  }

  // Generate OTP via Supabase admin API (no email sent)
  const res = await fetch(`${SB_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
    body: JSON.stringify({
      type: "magiclink",
      email,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[demo-sign-in] generate_link failed", res.status, text);
    return NextResponse.json(
      { error: `Failed to generate OTP: ${res.status}` },
      { status: 500 }
    );
  }

  const data = (await res.json()) as {
    email_otp?: string;
    properties?: { email_otp?: string };
  };

  const otp = data.email_otp ?? data.properties?.email_otp;
  if (!otp) {
    return NextResponse.json({ error: "No OTP in response" }, { status: 500 });
  }

  return NextResponse.json({ otp, email, redirectTo });
}
