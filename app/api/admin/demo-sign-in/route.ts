/**
 * POST /api/admin/demo-sign-in
 *
 * Generates a Supabase magic link for the demo coach account using the
 * admin API (no email sent — returns the link directly).
 * The caller can open the link to sign in as demo.coach@powerflow.training
 * without needing Google OAuth or email/password auth enabled.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { dbSelect } from "@/lib/supabaseAdmin";

const SB_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEMO_COACH_TAG   = "DEMO_COACH";
const DEMO_COACH_EMAIL = "demo.coach@powerflow.training";

export async function POST(req: Request) {
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://app.power-flow.eu"
      : "http://localhost:3000");

  // redirect_to must point to /auth/confirm so it can handle the implicit-flow
  // hash fragment (#access_token=…).  The `next` param tells confirm where to
  // forward after the session is established.
  const confirmUrl = `${appUrl}/auth/confirm?next=/coach/athletes`;

  // Generate magic link via Supabase admin API (no email sent)
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
      options: {
        redirect_to: confirmUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[demo-sign-in] generate_link failed", res.status, text);
    return NextResponse.json(
      { error: `Failed to generate link: ${res.status}` },
      { status: 500 }
    );
  }

  const data = (await res.json()) as { action_link?: string; properties?: { action_link?: string } };
  // Supabase returns action_link at top level or inside properties
  const link = data.action_link ?? data.properties?.action_link;

  if (!link) {
    return NextResponse.json({ error: "No action_link in response" }, { status: 500 });
  }

  return NextResponse.json({ link });
}
