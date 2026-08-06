import { describe, it, expect } from "vitest";
import { effectiveTier, hasAccess, canAccessTools, canAccessPR } from "./plan";

describe("effectiveTier", () => {
  it("defaults to opener when plan_tier is missing/null", () => {
    expect(effectiveTier({})).toBe("opener");
    expect(effectiveTier({ plan_tier: null })).toBe("opener");
  });

  it("falls back to opener for an unrecognised plan_tier value", () => {
    expect(effectiveTier({ plan_tier: "bogus" })).toBe("opener");
  });

  it("passes through a valid raw tier with no overrides", () => {
    expect(effectiveTier({ plan_tier: "second" })).toBe("second");
    expect(effectiveTier({ plan_tier: "pr" })).toBe("pr");
  });

  it("course_access promotes an opener to pr", () => {
    expect(effectiveTier({ plan_tier: "opener", course_access: true })).toBe("pr");
  });

  it("ai_access promotes an opener to pr", () => {
    expect(effectiveTier({ plan_tier: "opener", ai_access: true })).toBe("pr");
  });

  it("course_access promotes a second-tier athlete to pr", () => {
    expect(effectiveTier({ plan_tier: "second", course_access: true })).toBe("pr");
  });

  it("test_access promotes an opener to second", () => {
    expect(effectiveTier({ plan_tier: "opener", test_access: true })).toBe("second");
  });

  it("test_access does not downgrade an existing pr tier", () => {
    expect(effectiveTier({ plan_tier: "pr", test_access: true })).toBe("pr");
  });

  it("test_access alone does not reach pr", () => {
    expect(effectiveTier({ plan_tier: "opener", test_access: true })).not.toBe("pr");
  });

  it("no overrides leaves the raw tier untouched", () => {
    expect(effectiveTier({
      plan_tier: "second", course_access: false, test_access: false, ai_access: false,
    })).toBe("second");
  });

  it("never downgrades — a pr athlete stays pr regardless of flags", () => {
    expect(effectiveTier({ plan_tier: "pr" })).toBe("pr");
    expect(effectiveTier({ plan_tier: "pr", course_access: false, ai_access: false, test_access: false })).toBe("pr");
  });

  it("composes with canAccessTools / canAccessPR as expected", () => {
    const tier = effectiveTier({ plan_tier: "opener", course_access: true });
    expect(canAccessTools(tier)).toBe(true);
    expect(canAccessPR(tier)).toBe(true);
  });
});

describe("hasAccess", () => {
  it("opener does not meet second", () => {
    expect(hasAccess("opener", "second")).toBe(false);
  });
  it("pr meets every tier", () => {
    expect(hasAccess("pr", "opener")).toBe(true);
    expect(hasAccess("pr", "second")).toBe(true);
    expect(hasAccess("pr", "pr")).toBe(true);
  });
});
