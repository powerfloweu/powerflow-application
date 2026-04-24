/**
 * Minimal Supabase REST helpers — no SDK dependency.
 * Uses native fetch with env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * All functions gracefully no-op when the env vars are absent.
 */

// Fall back to the public env var so Vercel deployments work even when only
// NEXT_PUBLIC_SUPABASE_URL is set (SUPABASE_URL is the same value, server-only alias)
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_SERVICE_ROLE_KEY.length > 0;
}

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

/**
 * INSERT a single row into `table`.
 * Returns the inserted row (first element) or null on failure.
 */
export async function dbInsert<T extends Record<string, unknown>>(
  table: string,
  data: T,
): Promise<{ id: string } | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[supabaseAdmin] dbInsert ${table} failed ${res.status}`, text);
    return null;
  }

  const rows = (await res.json()) as Array<{ id: string }>;
  return rows[0] ?? null;
}

/**
 * SELECT rows from `table` with optional query params.
 * Example params: { order: "submitted_at.desc", limit: "500" }
 */
export async function dbSelect<T>(
  table: string,
  params?: Record<string, string>,
): Promise<T[]> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[supabaseAdmin] dbSelect ${table} failed ${res.status}`, text);
    return [];
  }

  return (await res.json()) as T[];
}

/**
 * PATCH rows in `table` where each match entry becomes `key=eq.value`.
 * Example: dbPatch("sat_results", { result_ref: "pfsa_xxx" }, { paid: true })
 */
export async function dbPatch(
  table: string,
  match: Record<string, string>,
  data: Record<string, unknown>,
): Promise<boolean> {
  const qs =
    "?" +
    Object.entries(match)
      .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`)
      .join("&");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "PATCH",
    headers: {
      ...headers(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[supabaseAdmin] dbPatch ${table} failed ${res.status}`, text);
    return false;
  }
  return true;
}

/**
 * DELETE rows from `table` where each match entry becomes `key=eq.value`.
 * Example: dbDelete("sat_results", { id: "uuid-here" })
 */
export async function dbDelete(
  table: string,
  match: Record<string, string>,
): Promise<void> {
  const qs =
    "?" +
    Object.entries(match)
      .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`)
      .join("&");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "DELETE",
    headers: {
      ...headers(),
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[supabaseAdmin] dbDelete ${table} failed ${res.status}`, text);
  }
}
