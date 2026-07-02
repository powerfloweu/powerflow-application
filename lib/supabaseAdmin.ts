/**
 * Minimal Supabase REST helpers — no SDK dependency.
 * Uses native fetch with env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * All functions gracefully no-op when the env vars are absent.
 *
 * ── Filter conventions (IMPORTANT) ─────────────────────────────────────────
 * dbSelect:            params are raw PostgREST query params — callers must
 *                      include the operator themselves, e.g. { id: "eq.<uuid>" }.
 * dbPatch / dbDelete:  match values are RAW values — the helper adds "eq."
 *                      itself, e.g. { id: "<uuid>" }.
 * Passing "eq.<value>" to dbPatch/dbDelete used to build "id=eq.eq.<value>",
 * silently matching zero rows (this caused real data loss in production).
 * The helpers now strip a redundant "eq." prefix and log loudly when they do.
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

/** Guard against the double-"eq." bug: match values must be raw. */
function rawMatchValue(table: string, key: string, value: string): string {
  if (value.startsWith("eq.")) {
    console.error(
      `[supabaseAdmin] match value for ${table}.${key} already has an "eq." prefix — stripping it. ` +
        `Pass raw values to dbPatch/dbDelete (the helper adds "eq." itself).`,
    );
    return value.slice(3);
  }
  return value;
}

/** Build "?k=eq.v&k2=eq.v2" from a match object, normalizing raw values. */
export function buildMatchQuery(table: string, match: Record<string, string>): string {
  return (
    "?" +
    Object.entries(match)
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=eq.${encodeURIComponent(rawMatchValue(table, k, v))}`,
      )
      .join("&")
  );
}

/**
 * INSERT a single row into `table`.
 * Returns the inserted row (first element) or null on failure.
 * Callers MUST check for null before reporting success to the client.
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
 * Params are raw PostgREST syntax — include operators in values:
 * Example params: { id: "eq.<uuid>", order: "submitted_at.desc", limit: "500" }
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
 * PATCH rows in `table`. Match values are RAW (no "eq." prefix):
 * Example: dbPatch("sat_results", { result_ref: "pfsa_xxx" }, { paid: true })
 *
 * Returns true only when the request succeeded AND at least one row was
 * actually updated. A patch that matches zero rows returns false — callers
 * MUST check the result and surface an error instead of reporting success.
 */
export async function dbPatch(
  table: string,
  match: Record<string, string>,
  data: Record<string, unknown>,
): Promise<boolean> {
  const qs = buildMatchQuery(table, match);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "PATCH",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[supabaseAdmin] dbPatch ${table} failed ${res.status}`, text);
    return false;
  }

  const rows = (await res.json().catch(() => [])) as unknown[];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error(`[supabaseAdmin] dbPatch ${table} matched 0 rows (${qs}) — nothing was updated`);
    return false;
  }
  return true;
}

/**
 * DELETE rows from `table`. Match values are RAW (no "eq." prefix):
 * Example: dbDelete("sat_results", { id: "uuid-here" })
 * Returns true when the request succeeded.
 */
export async function dbDelete(
  table: string,
  match: Record<string, string>,
): Promise<boolean> {
  const qs = buildMatchQuery(table, match);

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
    return false;
  }
  return true;
}

/**
 * Delete a user from auth.users via the GoTrue admin API.
 * This cascades to profile + all related rows (if FK constraints are set up).
 */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  return res.ok;
}
