/**
 * POST /api/admin/totp/verify
 * Body: { code: string }
 *
 * Verifies the 6-digit TOTP code.  On success, sets the HttpOnly session
 * cookie `pf_admin_totp` (4-hour lifetime).
 *
 * Requires an active Supabase admin session — the TOTP layer sits on top of,
 * not instead of, the existing Google OAuth check.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import {
  isTotpConfigured,
  verifyTotpCode,
  signTotpSession,
  TOTP_COOKIE,
  SESSION_MAX_AGE_S,
} from "@/lib/adminTotp";

export const runtime = "nodejs";

async function requireAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if ((user.email ?? "").toLowerCase() !== adminEmail) return null;
  return user;
}

export async function POST(req: Request) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isTotpConfigured()) {
    return NextResponse.json({ error: "TOTP not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({})) as { code?: string };
  const code = (body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Code must be 6 digits" }, { status: 400 });
  }

  if (!verifyTotpCode(code)) {
    return NextResponse.json({ error: "Incorrect code — try again" }, { status: 401 });
  }

  const token = signTotpSession(user.id);
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TOTP_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
