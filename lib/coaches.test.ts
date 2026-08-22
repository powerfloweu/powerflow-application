import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  COACHES,
  VISIBLE_COACHES,
  FOUNDER,
  AFFILIATE_COACHES,
  coachBySlug,
  coachBioParagraphs,
  coachFirstName,
} from "./coaches";

const PUBLIC = path.join(process.cwd(), "public");

describe("roster", () => {
  it("has unique slugs", () => {
    const slugs = COACHES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("looks up by slug and refuses unknown ones", () => {
    expect(coachBySlug("jay")?.name).toBe("Jacqueline Ulrich");
    expect(coachBySlug("nobody")).toBeUndefined();
  });

  it("gives every coach a title, a bio and something to be known for", () => {
    for (const c of COACHES) {
      expect(c.title.length, c.slug).toBeGreaterThan(0);
      expect(c.bio.length, c.slug).toBeGreaterThan(80);
      expect(c.tags.length, c.slug).toBeGreaterThan(0);
      // A face or initials to fall back on — never neither.
      expect(c.photo || c.initials, c.slug).toBeTruthy();
    }
  });
});

describe("images", () => {
  /**
   * Every referenced file must exist. A missing coach photo is a broken face
   * on a public marketing page, and next/image fails silently at runtime —
   * so it has to fail here instead.
   */
  it("resolves every photo and gallery path under public/", () => {
    for (const c of COACHES) {
      if (c.photo) {
        expect(fs.existsSync(path.join(PUBLIC, c.photo)), `${c.slug}: ${c.photo}`).toBe(true);
      }
      for (const p of c.gallery) {
        expect(fs.existsSync(path.join(PUBLIC, p.src)), `${c.slug}: ${p.src}`).toBe(true);
      }
    }
  });

  it("gives every gallery image real alt text", () => {
    for (const c of COACHES) {
      for (const p of c.gallery) {
        expect(p.alt.length, p.src).toBeGreaterThan(10);
        // "Photo of X" describes the medium, not the content.
        expect(p.alt.toLowerCase(), p.src).not.toMatch(/^(photo|image|picture) of/);
      }
    }
  });
});

describe("testimonials", () => {
  /**
   * Empty is the correct state until a real athlete has said something they
   * are happy to be quoted on. This test exists to make the rule visible: if
   * you are adding entries here, they must be real and attributed.
   */
  it("are attributed whenever they exist", () => {
    for (const c of COACHES) {
      for (const t of c.testimonials) {
        expect(t.quote.trim().length, c.slug).toBeGreaterThan(20);
        expect(t.author.trim().length, c.slug).toBeGreaterThan(0);
        expect(t.author.toLowerCase(), c.slug).not.toMatch(/anonymous|placeholder|lorem|athlete name/);
      }
    }
  });
});

describe("display helpers", () => {
  it("uses the name each coach actually goes by", () => {
    expect(coachFirstName(coachBySlug("jay")!)).toBe("Jay");
    expect(coachFirstName(coachBySlug("david")!)).toBe("David");
    // Titles are not first names. Read from COACHES, not the public lookup —
    // Kate is currently hidden.
    const kate = COACHES.find((c) => c.slug === "kate")!;
    expect(coachFirstName(kate)).toBe("Kate");
  });

  it("falls back to the short bio when there is no long one", () => {
    const bare = { ...COACHES[0], longBio: undefined };
    expect(coachBioParagraphs(bare)).toEqual([bare.bio]);
  });

  it("returns every paragraph of the long bio when there is one", () => {
    const jay = coachBySlug("jay")!;
    expect(coachBioParagraphs(jay).length).toBeGreaterThan(1);
    expect(coachBioParagraphs(jay).every((p) => p.trim().length > 0)).toBe(true);
  });
});

describe("visibility", () => {
  it("keeps hidden coaches out of everything public", () => {
    const hidden = COACHES.filter((c) => c.hidden);
    expect(hidden.length, "expected at least one hidden coach to exercise this").toBeGreaterThan(0);
    for (const c of hidden) {
      expect(VISIBLE_COACHES.some((v) => v.slug === c.slug), c.slug).toBe(false);
      expect(AFFILIATE_COACHES.some((v) => v.slug === c.slug), c.slug).toBe(false);
      // The landing page must 404 rather than staying reachable by URL.
      expect(coachBySlug(c.slug), c.slug).toBeUndefined();
    }
  });

  it("keeps the hidden coach's record intact so bringing them back is one line", () => {
    const kate = COACHES.find((c) => c.slug === "kate");
    expect(kate).toBeDefined();
    expect(kate!.bio.length).toBeGreaterThan(80);
  });

  it("splits the visible roster into the founder and the affiliates", () => {
    expect(FOUNDER?.slug).toBe("david");
    expect(AFFILIATE_COACHES.map((c) => c.slug)).toEqual(["jay", "clarice"]);
    // Together they account for everyone shown — nobody falls between roles.
    expect(AFFILIATE_COACHES.length + 1).toBe(VISIBLE_COACHES.length);
  });
});
