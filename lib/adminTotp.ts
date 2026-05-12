/**
 * Server-only TOTP + session-cookie utilities for the master admin 2FA gate.
 * Implements RFC 6238 (TOTP) using Node's built-in crypto — no third-party
 * TOTP library required.
 *
 * Required env vars:
 *   TOTP_SECRET          — base32 secret (scan once with Google Authenticator)
 *   TOTP_SESSION_SECRET  — random string used to sign the HttpOnly session cookie
 *
 * Cookie lifetime: 4 hours.  The admin re-enters their TOTP code after expiry.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// ── Constants ─────────────────────────────────────────────────────────────────

export const TOTP_COOKIE = "pf_admin_totp";
export const SESSION_MAX_AGE_S = 4 * 60 * 60; // seconds — used for cookie maxAge
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_S * 1000;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// ── Base32 helpers ────────────────────────────────────────────────────────────

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let val = 0;
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((val >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let val = 0;
  let out = "";
  for (const byte of buf) {
    val = (val << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(val >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(val << (5 - bits)) & 31];
  return out;
}

// ── TOTP (RFC 6238) ───────────────────────────────────────────────────────────

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  // Write 64-bit counter as big-endian (counter fits safely in 32-bit for TOTP)
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

/** True when TOTP_SECRET is present in env — gate is active. */
export function isTotpConfigured(): boolean {
  return !!(process.env.TOTP_SECRET ?? "").trim();
}

/**
 * Verify a 6-digit TOTP code against TOTP_SECRET.
 * Allows ±1 time step (±30 s) to handle clock drift.
 */
export function verifyTotpCode(code: string): boolean {
  const secret = (process.env.TOTP_SECRET ?? "").trim();
  if (!secret) return false;
  const keyBuf = base32Decode(secret);
  const step = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    if (hotp(keyBuf, step + delta) === code) return true;
  }
  return false;
}

/** Generate a fresh base32 secret (used only on the setup screen). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20)); // 160-bit → 32 base32 chars
}

/**
 * Return the otpauth:// URI for the given secret so callers can render a QR.
 * Pass the secret explicitly so this works during setup before env var is set.
 */
export function buildTotpUri(secret: string, adminEmail: string): string {
  const label = encodeURIComponent(`PowerFlow Admin:${adminEmail}`);
  const issuer = encodeURIComponent("PowerFlow Admin");
  return (
    `otpauth://totp/${label}?secret=${secret}` +
    `&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
  );
}

// ── Session cookie ────────────────────────────────────────────────────────────

function sessionSecret(): string {
  const s = (process.env.TOTP_SESSION_SECRET ?? "").trim();
  if (!s) throw new Error("TOTP_SESSION_SECRET env var not set");
  return s;
}

/**
 * Create a signed `userId.issuedAt.signature` token to store in the cookie.
 * HMAC-SHA256 so the server can verify without a DB lookup.
 */
export function signTotpSession(userId: string): string {
  const ts = Date.now().toString(36);
  const payload = `${userId}.${ts}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/**
 * Verify a session token.  Returns true only when the signature is valid AND
 * the token was issued within SESSION_MAX_AGE_MS.
 */
export function verifyTotpSession(token: string): boolean {
  try {
    const secret = sessionSecret();
    const lastDot = token.lastIndexOf(".");
    if (lastDot < 0) return false;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    const sBuf = Buffer.from(sig, "hex");
    const eBuf = Buffer.from(expectedSig, "hex");
    if (sBuf.length !== eBuf.length) return false;
    if (!timingSafeEqual(sBuf, eBuf)) return false;

    // Expiry: payload is "userId.base36timestamp"
    const dotIdx = payload.indexOf(".");
    const ts = parseInt(payload.slice(dotIdx + 1), 36);
    if (isNaN(ts) || Date.now() - ts > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}
