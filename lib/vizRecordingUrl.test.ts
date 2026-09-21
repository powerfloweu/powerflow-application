/**
 * Guards /api/tools/viz-recording against the three bugs that kept athlete
 * visualization voice notes from ever working. Each was silent and each was
 * fatal on its own:
 *
 *  1. Signed paths from Supabase Storage are relative to the storage API root
 *     ("/object/sign/…"), not the project root. Appending one straight to
 *     SUPABASE_URL yields 404 "requested path is invalid".
 *  2. The upload-sign endpoint answers with `url`; only the read-sign endpoint
 *     answers with `signedURL`. Reading the wrong key appended the string
 *     "undefined" to the base URL.
 *  3. The "viz-recordings" bucket did not exist, so signing 404'd upstream.
 *     Covered by supabase/migrations/20260921_viz_recordings_bucket.sql.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(
  join(__dirname, "../app/api/tools/viz-recording/route.ts"),
  "utf8",
);

describe("/api/tools/viz-recording", () => {
  it("never appends a signed path straight onto the base URL", () => {
    // `${SUPABASE_URL}${signedURL}` is exactly the shape that 404s.
    expect(SRC).not.toMatch(/\$\{SUPABASE_URL\}\$\{signed/);
  });

  it("puts the storage API prefix back on signed paths", () => {
    expect(SRC).toContain("/storage/v1");
  });

  it("accepts either key the two sign endpoints return", () => {
    // Both reads must tolerate `url` and `signedURL`.
    const reads = SRC.match(/signed\.(url|signedURL)\s*\?\?\s*signed\.(url|signedURL)/g) ?? [];
    expect(reads.length, "both sign calls should fall back across key names").toBe(2);
  });

  it("fails loudly when signing returns no usable path", () => {
    // Previously this produced a URL ending in "undefined" and no error.
    expect(SRC).toMatch(/if\s*\(!signedPath\)/);
  });

  it("writes to the bucket the migration creates", () => {
    const bucket = SRC.match(/BUCKET\s*=\s*"([^"]+)"/)?.[1];
    expect(bucket).toBe("viz-recordings");
    const migration = readFileSync(
      join(__dirname, "../supabase/migrations/20260921_viz_recordings_bucket.sql"),
      "utf8",
    );
    expect(migration).toContain("'viz-recordings'");
  });

  it("keeps the bucket private — these are personal recordings", () => {
    const migration = readFileSync(
      join(__dirname, "../supabase/migrations/20260921_viz_recordings_bucket.sql"),
      "utf8",
    );
    // A public bucket would make any athlete's voice note fetchable by path.
    expect(migration).toMatch(/,\s*false\s*\)/);
    // And the route must therefore hand out signed reads, not public URLs.
    expect(SRC).not.toContain("/object/public/");
  });
});
