import { describe, it, expect } from "vitest";
import {
  validateQuestions,
  validateTitle,
  validateIntro,
  validateAnswersPatch,
  mergeAnswers,
  validateNoteInput,
  canSend,
  MAX_QUESTIONS,
  MAX_TITLE_LEN,
  MAX_PROMPT_LEN,
} from "./reflections";

describe("validateQuestions", () => {
  it("accepts a well-formed question set", () => {
    const result = validateQuestions([
      { id: "q1", prompt: "Do I genuinely want to coach?", helper: "Think about the work itself.", kind: "text" },
      { id: "commit", prompt: "One small action I can take this week is:", kind: "commitment" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("q1");
      expect(result.value[1].kind).toBe("commitment");
    }
  });

  it("strips unknown keys instead of persisting them (allowlist pattern)", () => {
    const result = validateQuestions([
      { id: "q1", prompt: "Prompt", kind: "text", evilKey: "drop me", __proto__: { polluted: true } },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value[0]).sort()).toEqual(["id", "kind", "prompt"]);
    }
  });

  it("rejects a non-array payload", () => {
    expect(validateQuestions({ id: "q1" }).ok).toBe(false);
    expect(validateQuestions(null).ok).toBe(false);
    expect(validateQuestions("nope").ok).toBe(false);
  });

  it("accepts an empty array (draft in progress)", () => {
    const result = validateQuestions([]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("rejects more than MAX_QUESTIONS items", () => {
    const many = Array.from({ length: MAX_QUESTIONS + 1 }, (_, i) => ({
      id: `q${i}`, prompt: "x", kind: "text",
    }));
    const result = validateQuestions(many);
    expect(result.ok).toBe(false);
  });

  it("rejects a missing or empty id", () => {
    expect(validateQuestions([{ prompt: "x", kind: "text" }]).ok).toBe(false);
    expect(validateQuestions([{ id: "  ", prompt: "x", kind: "text" }]).ok).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const result = validateQuestions([
      { id: "q1", prompt: "a", kind: "text" },
      { id: "q1", prompt: "b", kind: "text" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicate/i);
  });

  it("rejects an empty prompt", () => {
    expect(validateQuestions([{ id: "q1", prompt: "  ", kind: "text" }]).ok).toBe(false);
  });

  it("rejects a prompt over the length limit", () => {
    const result = validateQuestions([{ id: "q1", prompt: "x".repeat(MAX_PROMPT_LEN + 1), kind: "text" }]);
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid kind", () => {
    expect(validateQuestions([{ id: "q1", prompt: "x", kind: "essay" }]).ok).toBe(false);
    expect(validateQuestions([{ id: "q1", prompt: "x" }]).ok).toBe(false);
  });

  it("rejects a non-string helper", () => {
    expect(validateQuestions([{ id: "q1", prompt: "x", kind: "text", helper: 42 }]).ok).toBe(false);
  });

  it("drops a blank helper rather than storing empty string", () => {
    const result = validateQuestions([{ id: "q1", prompt: "x", kind: "text", helper: "   " }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value[0].helper).toBeUndefined();
  });
});

describe("validateTitle / validateIntro", () => {
  it("trims and requires a non-empty title", () => {
    const result = validateTitle("  Becoming a coach  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("Becoming a coach");
    expect(validateTitle("   ").ok).toBe(false);
    expect(validateTitle(42).ok).toBe(false);
  });

  it("rejects an over-length title", () => {
    expect(validateTitle("x".repeat(MAX_TITLE_LEN + 1)).ok).toBe(false);
  });

  it("treats omitted/null intro as null, not an error", () => {
    const r1 = validateIntro(undefined);
    const r2 = validateIntro(null);
    expect(r1.ok && r1.value).toBeNull();
    expect(r2.ok && r2.value).toBeNull();
  });

  it("collapses a blank intro string to null", () => {
    const result = validateIntro("   ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });
});

describe("validateAnswersPatch", () => {
  it("accepts a plain string-valued object", () => {
    const result = validateAnswersPatch({ q1: "yes", q2: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ q1: "yes", q2: "" });
  });

  it("rejects a non-object payload", () => {
    expect(validateAnswersPatch(null).ok).toBe(false);
    expect(validateAnswersPatch("nope").ok).toBe(false);
    expect(validateAnswersPatch(["a"]).ok).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(validateAnswersPatch({ q1: 42 }).ok).toBe(false);
    expect(validateAnswersPatch({ q1: null }).ok).toBe(false);
  });
});

describe("mergeAnswers — partial autosave must merge, not replace", () => {
  it("preserves prior keys while overwriting the incoming one", () => {
    const existing = { q1: "first answer", q2: "second answer" };
    const merged = mergeAnswers(existing, { q1: "edited first answer" });
    expect(merged).toEqual({ q1: "edited first answer", q2: "second answer" });
  });

  it("adds a brand-new key without touching the rest", () => {
    const existing = { q1: "a" };
    const merged = mergeAnswers(existing, { q3: "c" });
    expect(merged).toEqual({ q1: "a", q3: "c" });
  });

  it("does not mutate the existing object (pure)", () => {
    const existing = { q1: "a" };
    mergeAnswers(existing, { q1: "b" });
    expect(existing).toEqual({ q1: "a" });
  });

  it("an empty patch is a no-op merge", () => {
    const existing = { q1: "a", q2: "b" };
    expect(mergeAnswers(existing, {})).toEqual(existing);
  });
});

describe("validateNoteInput", () => {
  it("accepts a body-only note", () => {
    const result = validateNoteInput({ body: "  Proud of this answer.  " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).toBe("Proud of this answer.");
      expect(result.value.audio_url).toBeNull();
    }
  });

  it("accepts an https audio_url-only note", () => {
    const result = validateNoteInput({ audio_url: "https://example.supabase.co/storage/v1/object/public/coach-audio/x.webm" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.body).toBeNull();
  });

  it("rejects a note with neither body nor audio_url", () => {
    expect(validateNoteInput({}).ok).toBe(false);
    expect(validateNoteInput({ body: "   " }).ok).toBe(false);
  });

  it("rejects a non-https audio_url", () => {
    const result = validateNoteInput({ audio_url: "http://insecure.example/x.webm" });
    expect(result.ok).toBe(false);
  });

  it("rejects a javascript: URL disguised as audio_url", () => {
    const result = validateNoteInput({ audio_url: "javascript:alert(1)" });
    expect(result.ok).toBe(false);
  });
});

describe("canSend", () => {
  it("is false for an empty question list", () => {
    expect(canSend([])).toBe(false);
  });

  it("is true once there is at least one question", () => {
    expect(canSend([{ id: "q1", prompt: "x", kind: "text" }])).toBe(true);
  });
});
