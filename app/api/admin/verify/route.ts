/**
 * GET /api/admin/verify
 * Returns { isAdmin: boolean, email: string | null }.
 * Checks whether the current Supabase session user's email matches ADMIN_EMAIL.
 * No secrets are exposed — only isAdmin boolean + the caller's own email.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();

  if (!adminEmail) {
    return NextResponse.json({
      isAdmin: false,
      email: null,
      error: "ADMIN_EMAIL env var not configured",
    });
  }

  if (!isConfigured) {
    return NextResponse.json({ isAdmin: false, email: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionEmail = (user?.email ?? "").toLowerCase().trim();
  const isAdmin = !!sessionEmail && sessionEmail === adminEmail;

  return NextResponse.json({ isAdmin, email: user?.email ?? null });
}
