/**
 * GET /api/admin/totp/setup
 * Returns { secret, qrDataUrl, configured }
 *
 * - If TOTP_SECRET is already set in env: returns QR for the existing secret.
 * - If not set: generates a fresh secret on every call (the admin must copy it
 *   into the TOTP_SECRET env var before it becomes permanent).
 *
 * The QR code is generated server-side so the otpauth:// URI (which contains
 * the secret) never passes through the client bundle.
 *
 * Requires admin Supabase session only — TOTP verification is NOT required so
 * the admin can still do the initial setup before the gate is configured.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { generateTotpSecret, buildTotpUri } from "@/lib/adminTotp";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();

  const configured = !!(process.env.TOTP_SECRET ?? "").trim();
  const secret = configured
    ? (process.env.TOTP_SECRET as string).trim()
    : generateTotpSecret();

  const uri = buildTotpUri(secret, email);
  const qrDataUrl = await QRCode.toDataURL(uri, {
    width: 240,
    margin: 2,
    color: { dark: "#ffffff", light: "#18181b" }, // white dots, dark bg
  });

  return NextResponse.json({ secret, qrDataUrl, configured });
}
