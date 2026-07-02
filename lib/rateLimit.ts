/**
 * Per-user sliding-window rate limiting — no SDK dependency.
 *
 * Uses Upstash Redis over its REST API when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (real distributed limiting across all
 * serverless instances). Falls back to a best-effort in-memory limiter when
 * they are not — that still stops a single hot instance from being hammered,
 * but the counter is per-instance so it is weaker than the Redis path.
 *
 * Usage in a route:
 *   const rl = await rateLimit(`chat:${user.id}`, { limit: 20, windowSec: 60 });
 *   if (!rl.ok) return rateLimitResponse(rl);
 */

import { NextResponse } from "next/server";

export interface RateLimitOptions {
  limit: number;      // max requests allowed within the window
  windowSec: number;  // window length in seconds
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetSec: number;   // seconds until the window resets
}

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const useRedis = UPSTASH_URL.length > 0 && UPSTASH_TOKEN.length > 0;

// ── In-memory fallback ────────────────────────────────────────────────────────
// Map<key, timestamps[]> — timestamps are ms. Pruned on each call.
const memory = new Map<string, number[]>();

function memoryLimit(key: string, opts: RateLimitOptions, now: number): RateLimitResult {
  const windowMs = opts.windowSec * 1000;
  const cutoff = now - windowMs;
  const hits = (memory.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= opts.limit) {
    const oldest = hits[0];
    return {
      ok: false,
      limit: opts.limit,
      remaining: 0,
      resetSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  memory.set(key, hits);

  // Opportunistically bound memory growth.
  if (memory.size > 10_000) {
    for (const [k, v] of memory) {
      const kept = v.filter((t) => t > cutoff);
      if (kept.length === 0) memory.delete(k);
      else memory.set(k, kept);
    }
  }

  return {
    ok: true,
    limit: opts.limit,
    remaining: opts.limit - hits.length,
    resetSec: opts.windowSec,
  };
}

// ── Redis path (Upstash REST, sorted-set sliding window) ──────────────────────
async function redisLimit(key: string, opts: RateLimitOptions, now: number): Promise<RateLimitResult> {
  const windowMs = opts.windowSec * 1000;
  const member = `${now}-${Math.floor(now % 1000)}`;
  const redisKey = `rl:${key}`;

  // Pipeline: drop old entries, count, add current, set expiry.
  const commands = [
    ["ZREMRANGEBYSCORE", redisKey, "0", String(now - windowMs)],
    ["ZCARD", redisKey],
    ["ZADD", redisKey, String(now), member],
    ["EXPIRE", redisKey, String(opts.windowSec)],
  ];

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    // Fail open — a limiter outage must not take down the API.
    console.error("[rateLimit] Upstash error", res.status, await res.text().catch(() => ""));
    return { ok: true, limit: opts.limit, remaining: opts.limit, resetSec: opts.windowSec };
  }

  // Response is an array of { result } objects, one per command.
  const out = (await res.json()) as Array<{ result: unknown }>;
  const countBefore = Number(out[1]?.result ?? 0);
  const total = countBefore + 1; // include the ZADD we just did

  if (total > opts.limit) {
    return { ok: false, limit: opts.limit, remaining: 0, resetSec: opts.windowSec };
  }
  return { ok: true, limit: opts.limit, remaining: Math.max(0, opts.limit - total), resetSec: opts.windowSec };
}

/**
 * Record a hit for `key` and report whether it is within the limit.
 * Never throws — on any internal error it fails open (allows the request).
 */
export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  try {
    return useRedis ? await redisLimit(key, opts, now) : memoryLimit(key, opts, now);
  } catch (err) {
    console.error("[rateLimit] unexpected error — failing open", err);
    return { ok: true, limit: opts.limit, remaining: opts.limit, resetSec: opts.windowSec };
  }
}

/** Standard 429 response with Retry-After for a blocked request. */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests — please slow down and try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
