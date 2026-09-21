import { describe, it, expect } from "vitest";
import { encodeStoragePath } from "./storagePath";

describe("encodeStoragePath", () => {
  it("keeps the separators between segments", () => {
    // encodeURIComponent turns these into %2F, which signs fine and then
    // fails on fetch with 400 InvalidSignature. Verified against production.
    expect(encodeStoragePath("066eeaf0/1784624962304.webm"))
      .toBe("066eeaf0/1784624962304.webm");
  });

  it("still escapes characters inside a segment", () => {
    expect(encodeStoragePath("coach id/my note.webm")).toBe("coach%20id/my%20note.webm");
    expect(encodeStoragePath("a/b?c.webm")).toBe("a/b%3Fc.webm");
    expect(encodeStoragePath("a/b#c.webm")).toBe("a/b%23c.webm");
  });

  it("never produces an escaped slash", () => {
    // The whole point: %2F is what broke every multi-segment path.
    expect(encodeStoragePath("a/b/c.webm")).not.toContain("%2F");
  });

  it("drops empty segments from stray slashes", () => {
    expect(encodeStoragePath("/a//b.webm")).toBe("a/b.webm");
  });

  it("handles a single-segment path unchanged", () => {
    expect(encodeStoragePath("note.webm")).toBe("note.webm");
  });
});
