import { describe, it, expect } from "vitest";
import {
  validateApplication,
  normaliseHandle,
  normaliseUrl,
  qualificationLabel,
  experienceLabel,
  languageLabels,
  QUALIFICATIONS,
  EXPERIENCE_BANDS,
  COACH_LANGUAGES,
  APPLICATION_STATUSES,
} from "./coachApply";
import {
  applicantHtml,
  applicantText,
  ownerHtml,
} from "./coachApplyEmails";

/** A submission that passes, so each test can vary one field at a time. */
function valid(over: Record<string, unknown> = {}) {
  return {
    fullName: "Jacqueline Ulrich",
    email: "jay@example.com",
    motivation: "I have coached powerlifters for six years and want the mental side in the same place as the training.",
    consent: true,
    ...over,
  };
}

describe("options", () => {
  it("have unique ids", () => {
    for (const list of [QUALIFICATIONS, EXPERIENCE_BANDS, COACH_LANGUAGES]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(new Set(APPLICATION_STATUSES).size).toBe(APPLICATION_STATUSES.length);
  });

  it("start applications as new", () => {
    expect(APPLICATION_STATUSES[0]).toBe("new");
  });
});

describe("validateApplication", () => {
  it("accepts a minimal valid application", () => {
    const res = validateApplication(valid());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.fullName).toBe("Jacqueline Ulrich");
      // Optional fields collapse to null rather than "".
      expect(res.value.country).toBeNull();
      expect(res.value.instagram).toBeNull();
      expect(res.value.website).toBeNull();
      expect(res.value.languages).toEqual([]);
    }
  });

  it("rejects a missing name or email", () => {
    expect(validateApplication(valid({ fullName: "  " })).ok).toBe(false);
    expect(validateApplication(valid({ email: "" })).ok).toBe(false);
    expect(validateApplication(valid({ email: "nope" })).ok).toBe(false);
  });

  it("requires enough motivation to be worth reading", () => {
    expect(validateApplication(valid({ motivation: "hi" })).ok).toBe(false);
    expect(validateApplication(valid({ motivation: "x".repeat(39) })).ok).toBe(false);
    expect(validateApplication(valid({ motivation: "x".repeat(40) })).ok).toBe(true);
  });

  it("requires explicit consent", () => {
    expect(validateApplication(valid({ consent: false })).ok).toBe(false);
    expect(validateApplication(valid({ consent: "yes" })).ok).toBe(false);
  });

  it("lowercases the email so the unique index catches duplicates", () => {
    const res = validateApplication(valid({ email: "  Jay@Example.COM " }));
    expect(res.ok && res.value.email).toBe("jay@example.com");
  });

  it("drops unknown ids instead of storing them", () => {
    const res = validateApplication(valid({
      country: "Atlantis", qualification: "wizard", experience: "forever",
      languages: ["en", "klingon"],
    }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.country).toBeNull();
      expect(res.value.qualification).toBeNull();
      expect(res.value.experience).toBeNull();
      expect(res.value.languages).toEqual(["en"]);
    }
  });

  it("keeps known ids", () => {
    const res = validateApplication(valid({
      country: "DE", qualification: "sport-psych-msc", experience: "3to5",
      languages: ["de", "en"],
    }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.country).toBe("DE");
      expect(res.value.qualification).toBe("sport-psych-msc");
      // Returned in the canonical display order, not the order submitted.
      expect(res.value.languages).toEqual(["en", "de"]);
    }
  });

  it("truncates over-long free text rather than rejecting it", () => {
    const res = validateApplication(valid({ motivation: "x".repeat(5000) }));
    expect(res.ok && res.value.motivation.length).toBe(3000);
  });
});

describe("normaliseHandle", () => {
  it("accepts the many ways people give an Instagram", () => {
    for (const input of [
      "omgitsjacqueline",
      "@omgitsjacqueline",
      "instagram.com/omgitsjacqueline",
      "https://www.instagram.com/omgitsjacqueline/",
      "https://instagram.com/omgitsjacqueline",
    ]) {
      expect(normaliseHandle(input), input).toBe("omgitsjacqueline");
    }
  });
});

describe("normaliseUrl", () => {
  it("adds a scheme so the stored value is a usable href", () => {
    expect(normaliseUrl("odysseystrength.ie")).toBe("https://odysseystrength.ie/");
    expect(normaliseUrl("https://odysseystrength.ie/")).toBe("https://odysseystrength.ie/");
  });

  it("rejects things that are not addresses", () => {
    // A bare word parses as a hostname — insisting on a dot rules it out.
    expect(normaliseUrl("portfolio")).toBeNull();
    expect(normaliseUrl("")).toBeNull();
  });
});

describe("labels", () => {
  it("renders an em dash for nothing selected", () => {
    expect(qualificationLabel(null)).toBe("—");
    expect(experienceLabel(null)).toBe("—");
    expect(languageLabels([])).toBe("—");
    expect(languageLabels(null)).toBe("—");
  });

  it("joins languages readably", () => {
    expect(languageLabels(["en", "de"])).toBe("English, German");
  });
});

describe("emails", () => {
  const app = {
    fullName: "Jacqueline Ulrich",
    email: "jay@example.com",
    country: "DE",
    instagram: "omgitsjacqueline",
    website: "https://example.com/",
    qualification: "sport-psych-msc",
    experience: "3to5",
    languages: ["en", "de"],
    athletes: "Mostly IPF lifters, national level.",
    motivation: "I want the mental side in the same place as the training.",
  };

  it("greets the applicant by first name and sets expectations", () => {
    const html = applicantHtml(app);
    expect(html).toContain("Hi Jacqueline,");
    expect(html).toContain("a few days");
    expect(applicantText(app)).toContain("Hi Jacqueline,");
  });

  it("tells the applicant how to be forgotten", () => {
    expect(applicantHtml(app)).toContain("deleted");
    expect(applicantText(app)).toContain("deleted");
  });

  it("never quotes the application back at the applicant", () => {
    // The confirmation is a receipt, not a transcript — no need to email
    // someone's own free text back to them.
    expect(applicantHtml(app)).not.toContain(app.motivation);
  });

  it("gives the owner everything needed to judge it", () => {
    const html = ownerHtml(app);
    expect(html).toContain("Jacqueline Ulrich");
    expect(html).toContain("Sport psychologist (MSc)");
    expect(html).toContain("3–5 years");
    expect(html).toContain("English, German");
    expect(html).toContain(app.motivation);
    expect(html).toContain("Germany");
  });

  it("escapes free text from the public form", () => {
    const nasty = { ...app, fullName: "<script>alert(1)</script>", motivation: "a & b < c" };
    const html = ownerHtml(nasty);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b &lt; c");
    expect(applicantHtml(nasty)).not.toContain("<script>");
  });

  it("omits optional rows the owner didn't get", () => {
    const bare = { ...app, instagram: null, website: null, athletes: null, country: null };
    const html = ownerHtml(bare);
    expect(html).not.toContain("Instagram");
    expect(html).not.toContain("Website");
    expect(html).not.toContain("Who they work with");
    expect(html).not.toContain("Country");
  });
});
