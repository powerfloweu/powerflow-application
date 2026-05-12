/**
 * GET /api/admin/totp/status
 * Returns { configured: boolean, verified: boolean }
 *
 * `configured` — TOTP_SECRET env var is set (gate is active)
 * `verified`   — caller's pf_admin_totp session cookie is valid and unexpired
 *
 * Requires an active Supabase admin session.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { isTotpConfigured, verifyTotpSession, TOTP_COOKIE } from "@/lib/adminTotp";

export const runtime = "nodejs";

async function isAdminSession(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase() === adminEmail;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const configured = isTotpConfigured();
  const cookieValue = req.cookies.get(TOTP_COOKIE)?.value ?? "";
  const verified = configured ? verifyTotpSession(cookieValue) : false;

  return NextResponse.json({ configured, verified });
}
