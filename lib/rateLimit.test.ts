import { describe, it, expect } from "vitest";
import { rateLimit } from "./rateLimit";

// No Upstash env vars in the test environment → in-memory limiter path.

describe("rateLimit (in-memory)", () => {
  it("allows requests up to the limit then blocks", async () => {
    const key = "test:allow-then-block";
    const opts = { limit: 3, windowSec: 60 };

    const r1 = await rateLimit(key, opts);
    const r2 = await rateLimit(key, opts);
    const r3 = await rateLimit(key, opts);
    const r4 = await rateLimit(key, opts);

    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.ok).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetSec).toBeGreaterThan(0);
  });

  it("keeps separate counters per key", async () => {
    const opts = { limit: 1, windowSec: 60 };
    const a = await rateLimit("test:user-a", opts);
    const b = await rateLimit("test:user-b", opts);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true); // different key, not affected by user-a
  });

  it("reports a Retry-After window when blocked", async () => {
    const key = "test:retry-after";
    const opts = { limit: 1, windowSec: 30 };
    await rateLimit(key, opts);
    const blocked = await rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.resetSec).toBeGreaterThan(0);
    expect(blocked.resetSec).toBeLessThanOrEqual(30);
  });
});
