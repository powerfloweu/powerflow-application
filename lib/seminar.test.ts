import { describe, it, expect } from "vitest";
import {
  SEMINAR,
  SEMINAR_TOPICS,
  TOPIC_IDS,
  spotsLeft,
  statusForNextSignup,
  meetsMinimum,
  validateSignup,
  tallyTopics,
  contextLabel,
  formatLabel,
} from "./seminar";

/** A submission that passes, so each test can vary one field at a time. */
function valid(over: Record<string, unknown> = {}) {
  return {
    fullName: "Marthe Henry",
    email: "marthe@example.com",
    topics: ["arousal"],
    consent: true,
    ...over,
  };
}

describe("config", () => {
  it("starts at 10:00 Budapest time on 3 October 2026", () => {
    const d = new Date(SEMINAR.startsAt);
    expect(
      d.toLocaleString("en-GB", {
        timeZone: "Europe/Budapest",
        dateStyle: "short",
        timeStyle: "short",
      }),
    ).toBe("03/10/2026, 10:00");
  });

  it("has a sane capacity window", () => {
    expect(SEMINAR.minParticipants).toBeLessThan(SEMINAR.maxParticipants);
  });

  it("has unique topic ids", () => {
    expect(new Set(TOPIC_IDS).size).toBe(SEMINAR_TOPICS.length);
  });
});

describe("capacity", () => {
  it("counts down to the cap and stops at zero", () => {
    expect(spotsLeft(0)).toBe(SEMINAR.maxParticipants);
    expect(spotsLeft(19)).toBe(1);
    expect(spotsLeft(20)).toBe(0);
    // Over-full (e.g. the owner promoted extra people by hand) never goes negative.
    expect(spotsLeft(25)).toBe(0);
  });

  it("puts the 21st sign-up on the waitlist", () => {
    expect(statusForNextSignup(19)).toBe("registered");
    expect(statusForNextSignup(20)).toBe("waitlist");
    expect(statusForNextSignup(99)).toBe("waitlist");
  });

  it("reports the go/no-go minimum", () => {
    expect(meetsMinimum(9)).toBe(false);
    expect(meetsMinimum(10)).toBe(true);
  });
});

describe("validateSignup", () => {
  it("accepts a minimal valid submission", () => {
    const res = validateSignup(valid());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.fullName).toBe("Marthe Henry");
      expect(res.value.topics).toEqual(["arousal"]);
      // Optional fields collapse to null rather than "".
      expect(res.value.country).toBeNull();
      expect(res.value.formatPref).toBeNull();
    }
  });

  it("rejects a missing name, email or topic", () => {
    expect(validateSignup(valid({ fullName: "  " })).ok).toBe(false);
    expect(validateSignup(valid({ email: "" })).ok).toBe(false);
    expect(validateSignup(valid({ topics: [] })).ok).toBe(false);
  });

  it("requires explicit consent", () => {
    expect(validateSignup(valid({ consent: false })).ok).toBe(false);
    expect(validateSignup(valid({ consent: undefined })).ok).toBe(false);
    // A truthy non-true value must not pass — consent is a checkbox, not a hint.
    expect(validateSignup(valid({ consent: "yes" })).ok).toBe(false);
  });

  it("rejects addresses that are clearly not addresses", () => {
    for (const email of ["nope", "a@b", "a b@c.com", "@example.com"]) {
      expect(validateSignup(valid({ email })).ok, email).toBe(false);
    }
  });

  it("lowercases the email so the unique index catches duplicates", () => {
    const res = validateSignup(valid({ email: "  Marthe@Example.COM " }));
    expect(res.ok && res.value.email).toBe("marthe@example.com");
  });

  it("drops unknown ids instead of storing them", () => {
    const res = validateSignup(
      valid({
        topics: ["arousal", "not-a-topic", 42],
        context: "hacker",
        formatPref: "telepathy",
        materials: ["video", "hologram"],
      }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.topics).toEqual(["arousal"]);
      expect(res.value.context).toBeNull();
      expect(res.value.formatPref).toBeNull();
      expect(res.value.materials).toEqual(["video"]);
    }
  });

  it("de-duplicates topics and returns them in display order", () => {
    const res = validateSignup(valid({ topics: ["burnout", "arousal", "burnout"] }));
    expect(res.ok && res.value.topics).toEqual(["arousal", "burnout"]);
  });

  it("truncates a long free-text question rather than rejecting it", () => {
    const res = validateSignup(valid({ question: "x".repeat(5000) }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.question!.length).toBe(2000);
  });

  it("rejects non-object payloads", () => {
    expect(validateSignup(null).ok).toBe(false);
    expect(validateSignup("hello").ok).toBe(false);
  });
});

describe("tallyTopics", () => {
  it("ranks by count and includes topics nobody picked", () => {
    const tally = tallyTopics([
      { topics: ["arousal", "burnout"] },
      { topics: ["arousal"] },
      { topics: ["arousal", "setbacks"] },
    ]);
    expect(tally).toHaveLength(SEMINAR_TOPICS.length);
    expect(tally[0]).toMatchObject({ id: "arousal", count: 3 });
    expect(tally.find((t) => t.id === "communication")!.count).toBe(0);
  });

  it("ignores stale ids and missing arrays", () => {
    const tally = tallyTopics([
      { topics: ["retired-topic"] },
      { topics: undefined as unknown as string[] },
    ]);
    expect(tally.every((t) => t.count === 0)).toBe(true);
  });
});

describe("labels", () => {
  it("renders an em dash for nothing selected", () => {
    expect(contextLabel(null)).toBe("—");
    expect(formatLabel(null)).toBe("—");
  });

  it("falls back to the raw id for an unknown value", () => {
    expect(contextLabel("legacy-value")).toBe("legacy-value");
  });
});
