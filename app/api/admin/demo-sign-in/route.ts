/**
 * POST /api/admin/demo-sign-in
 *
 * Returns the email OTP for the demo coach account so the caller can verify
 * it client-side via supabase.auth.verifyOtp() — no email sent, no redirect
 * chain, no dependence on Supabase's redirect_to allowlist.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

const SB_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEMO_COACH_TAG   = "DEMO_COACH";
const DEMO_COACH_EMAIL = "demo.coach@powerflow.training";

export async function POST() {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Make sure the demo coach account actually exists
  type Row = { id: string };
  const rows = await dbSelect<Row>("profiles", {
    coach_notes: `eq.${DEMO_COACH_TAG}`,
    select: "id",
  });
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Demo coach not found — seed demo data first." },
      { status: 404 }
    );
  }

  // Generate a magic link via the Supabase admin API.
  // We don't use the action_link redirect — instead we return the email_otp
  // so the client can call supabase.auth.verifyOtp() directly, which avoids
  // any dependence on Supabase's redirect_to allowlist.
  const res = await fetch(`${SB_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
    body: JSON.stringify({
      type: "magiclink",
      email: DEMO_COACH_EMAIL,
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

  return NextResponse.json({ otp, email: DEMO_COACH_EMAIL });
}
