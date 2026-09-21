/**
 * Reading coach voice notes out of the "coach-audio" bucket.
 *
 * Rows written before the bucket became private store a full public URL;
 * newer ones may store a bare object path. Both shapes resolve to the same
 * object, so callers hand whatever is in the database to `signCoachAudio`
 * and get back a short-lived signed URL — no data migration needed, and
 * nothing breaks on the day the bucket stops being public.
 */

import { encodeStoragePath } from "./storagePath";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const COACH_AUDIO_BUCKET = "coach-audio";
/** Long enough to listen to a note without being a durable public link. */
export const COACH_AUDIO_TTL_SECONDS = 7200;

/**
 * The object path inside the bucket, from either a stored public URL or an
 * already-bare path. Returns null for anything that doesn't name an object in
 * this bucket, so a malformed row can't be turned into a request.
 */
export function coachAudioPath(stored: string | null | undefined): string | null {
  const raw = (stored ?? "").trim();
  if (!raw) return null;

  // Full URL form: .../object/public/coach-audio/<path> or .../object/coach-audio/<path>
  const marker = `/${COACH_AUDIO_BUCKET}/`;
  const at = raw.indexOf(marker);
  if (at !== -1) {
    const path = raw.slice(at + marker.length).split("?")[0];
    return path ? decodeURIComponent(path) : null;
  }

  // Bare path form — reject anything that looks like a URL to some other host.
  if (/^https?:\/\//i.test(raw)) return null;
  return raw.replace(/^\/+/, "") || null;
}

/**
 * A signed, expiring URL for a stored coach voice note. Null when the row
 * holds nothing usable or Storage refuses — callers render no player rather
 * than an <audio> element pointed at a URL that will 400.
 */
export async function signCoachAudio(stored: string | null | undefined): Promise<string | null> {
  const path = coachAudioPath(stored);
  if (!path || !SUPABASE_URL || !SERVICE_KEY) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/${COACH_AUDIO_BUCKET}/${encodeStoragePath(path)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ expiresIn: COACH_AUDIO_TTL_SECONDS }),
      },
    );
    if (!res.ok) {
      console.error("[coachAudio] sign failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const signed = (await res.json()) as { signedURL?: string; url?: string };
    const signedPath = signed.signedURL ?? signed.url;
    if (!signedPath) return null;
    // Storage returns paths relative to its own API root, not the project root.
    const withPrefix = signedPath.startsWith("/storage/v1")
      ? signedPath
      : `/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
    return `${SUPABASE_URL}${withPrefix}`;
  } catch (err) {
    console.error("[coachAudio] sign threw", err);
    return null;
  }
}
