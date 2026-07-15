import { describe, it, expect } from "vitest";
import { parseDigest, buildDigestUserPrompt } from "./coachDigest";

describe("parseDigest", () => {
  it("parses clean JSON", () => {
    const out = parseDigest('{"summary":"trending up","draft_message":"nice work"}');
    expect(out).toEqual({ summary: "trending up", draft_message: "nice work" });
  });

  it("tolerates code fences and surrounding prose", () => {
    const raw = 'Here you go:\n```json\n{"summary":"a","draft_message":"b"}\n```\nhope that helps';
    expect(parseDigest(raw)).toEqual({ summary: "a", draft_message: "b" });
  });

  it("trims whitespace in fields", () => {
    expect(parseDigest('{"summary":"  a  ","draft_message":"\\n b \\n"}')).toEqual({ summary: "a", draft_message: "b" });
  });

  it("returns null when a required field is missing", () => {
    expect(parseDigest('{"summary":"only summary"}')).toBeNull();
  });

  it("returns null on non-JSON", () => {
    expect(parseDigest("the model refused")).toBeNull();
  });
});

describe("buildDigestUserPrompt", () => {
  it("numbers entries oldest-first with dates and sentiment", () => {
    const prompt = buildDigestUserPrompt("Marthe", [
      { created_at: "2026-07-01T09:00:00Z", content: "felt strong", sentiment: "positive" },
      { created_at: "2026-07-03T18:00:00Z", content: "rough day", sentiment: "negative" },
    ]);
    expect(prompt).toContain("Athlete: Marthe");
    expect(prompt).toContain("Entry 1 — 2026-07-01 [positive]:");
    expect(prompt).toContain("Entry 2 — 2026-07-03 [negative]:");
    expect(prompt.indexOf("felt strong")).toBeLessThan(prompt.indexOf("rough day"));
  });
});
