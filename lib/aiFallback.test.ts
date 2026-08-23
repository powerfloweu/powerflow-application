import { describe, it, expect } from "vitest";
import { classifyAiError, suggestTool, offlineReply } from "./aiFallback";

/** Shaped like a real Anthropic SDK error. */
function apiError(status: number, message: string) {
  return Object.assign(new Error(`${status} ${message}`), { status });
}

describe("classifyAiError", () => {
  it("recognises credit exhaustion, which arrives as a 400", () => {
    // Verbatim from production — a 400 invalid_request_error, otherwise
    // indistinguishable from a malformed request.
    const err = apiError(
      400,
      '{"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}',
    );
    expect(classifyAiError(err)).toBe("quota");
  });

  it("separates transient overload from being out of credit", () => {
    expect(classifyAiError(apiError(429, "rate_limit_error"))).toBe("busy");
    expect(classifyAiError(apiError(529, "overloaded_error"))).toBe("busy");
  });

  it("falls back to a plain error for anything else", () => {
    expect(classifyAiError(apiError(401, "authentication_error"))).toBe("error");
    expect(classifyAiError(new Error("socket hang up"))).toBe("error");
    expect(classifyAiError(undefined)).toBe("error");
  });
});

describe("suggestTool", () => {
  it("routes on the words an athlete would actually use", () => {
    expect(suggestTool("I'm so anxious before every session", "pr")?.id).toBe("pmr");
    expect(suggestTool("can't sleep the night before", "pr")?.id).toBe("autogenic-training");
    expect(suggestTool("my squat feels awful", "pr")?.id).toBe("viz-squat");
    expect(suggestTool("no confidence at all right now", "pr")?.id).toBe("affirmations");
  });

  it("never suggests a tool the athlete's tier cannot open", () => {
    // Visualizations are second-tier and up; affirmations too.
    expect(suggestTool("my squat feels awful", "opener")).toBeNull();
    expect(suggestTool("no confidence at all", "opener")).toBeNull();
    // PMR is available on every tier.
    expect(suggestTool("so tense", "opener")?.id).toBe("pmr");
    // Competition work is PR-only.
    expect(suggestTool("meet day next week", "second")).toBeNull();
    expect(suggestTool("meet day next week", "pr")?.id).toBe("comp-day-viz");
  });

  it("returns nothing rather than guessing when no cue matches", () => {
    expect(suggestTool("hi", "pr")).toBeNull();
    expect(suggestTool("", "pr")).toBeNull();
  });
});

describe("offlineReply", () => {
  const base = { message: "I feel really tense about the meet", tier: "pr" as const };

  it("says up front that it is not the coach", () => {
    const text = offlineReply(base);
    // The very first thing an athlete reads must be that nobody read this.
    expect(text.split("\n\n")[0]).toMatch(/unavailable/i);
    expect(text).toMatch(/automatic reply/i);
    expect(text).toMatch(/haven't read what you wrote/i);
  });

  it("reassures them their message was kept", () => {
    expect(offlineReply(base)).toMatch(/saved|not lost|Nothing you wrote is lost/i);
  });

  it("points at a tool when the message gives it something to go on", () => {
    expect(offlineReply(base)).toContain("Progressive muscle relaxation");
  });

  it("still says something useful when no tool matches", () => {
    const text = offlineReply({ message: "hello", tier: "pr" });
    expect(text).toMatch(/journal/i);
    expect(text).not.toContain("**");
  });

  it("names the coach when there is one, and doesn't invent one otherwise", () => {
    expect(offlineReply({ ...base, coachName: "Jay" })).toContain("@Jay");
    expect(offlineReply(base)).not.toContain("@");
  });

  it("offers no advice of its own", () => {
    // The whole point: it routes to things that exist, it does not counsel.
    const text = offlineReply({ message: "I want to quit powerlifting", tier: "pr" });
    expect(text).toMatch(/unavailable/i);
    expect(text.length).toBeLessThan(700);
  });
});
