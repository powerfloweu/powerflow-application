import { describe, it, expect } from "vitest";
import {
  computeTargets, mealTotals, foodSystemPrompt, handBlock,
  type NutritionConfig, type MealRow,
} from "./nutrition";

const BASE: NutritionConfig = {
  birthYear: 1990,
  heightCm: 180,
  sex: "male",
  goalWeight: 85,
  activityBase: 1.2,
};

function meal(partial: Partial<MealRow>): MealRow {
  return {
    id: "m1", meal_date: "2026-09-14", description: "test", items: [],
    kcal: 0, protein: 0, carbs: 0, fat: 0, source: "text",
    created_at: "2026-09-14T10:00:00Z", ...partial,
  };
}

describe("computeTargets", () => {
  it("returns null when there is no weight anywhere", () => {
    expect(computeTargets(null, BASE)).toBeNull();
    expect(computeTargets(null, {})).toBeNull();
  });

  it("falls back to startWeight when no weight is logged yet", () => {
    const t = computeTargets(null, { ...BASE, startWeight: 90 });
    expect(t).not.toBeNull();
    expect(t!.kg).toBe(90);
  });

  it("prefers a logged weight over startWeight", () => {
    const t = computeTargets(88, { ...BASE, startWeight: 110 })!;
    expect(t.kg).toBe(88);
  });

  it("uses the female Mifflin-St Jeor constant", () => {
    const male = computeTargets(80, { ...BASE, sex: "male" })!;
    const female = computeTargets(80, { ...BASE, sex: "female" })!;
    // -161 vs +5 => a 166 kcal gap in BMR
    expect(male.bmr - female.bmr).toBe(166);
  });

  it("never sets the calorie floor below BMR", () => {
    // A light person on an aggressive deficit would otherwise go under.
    const t = computeTargets(50, { ...BASE, goalWeight: 45 })!;
    expect(t.kcalLow).toBeGreaterThanOrEqual(Math.round(t.bmr / 10) * 10);
  });

  it("bases protein on goal weight when it is lower than current", () => {
    const t = computeTargets(110, { ...BASE, goalWeight: 85 })!;
    expect(t.ref).toBe(85);
    expect(t.protein).toBe(Math.round((85 * 1.8) / 5) * 5); // 155
  });

  it("bases protein on current weight when the goal is higher", () => {
    const t = computeTargets(80, { ...BASE, goalWeight: 95 })!;
    expect(t.ref).toBe(80);
  });

  it("keeps fat within its hormonal floor and ceiling", () => {
    const t = computeTargets(90, { ...BASE, fatPreferenceG: 5 })!;
    expect(t.fat).toBeGreaterThanOrEqual(t.fatMin);
    const high = computeTargets(90, { ...BASE, fatPreferenceG: 500 })!;
    expect(high.fat).toBeLessThanOrEqual(high.fatMax);
  });

  it("never drops carbs below the 50g floor", () => {
    const t = computeTargets(120, { ...BASE, goalWeight: 120, fatPreferenceG: 200 })!;
    expect(t.carbs).toBeGreaterThanOrEqual(50);
  });

  it("applies manual overrides and flags which ones are manual", () => {
    const t = computeTargets(90, {
      ...BASE,
      manualTargets: { kcal: 3000, protein: 200 },
    })!;
    expect(t.kcal).toBe(3000);
    expect(t.protein).toBe(200);
    expect(t.fromManual.kcal).toBe(true);
    expect(t.fromManual.protein).toBe(true);
    expect(t.fromManual.fat).toBeUndefined();
    expect(t.fromManual.carbs).toBeUndefined();
  });

  it("treats each manual target independently — overriding kcal does not re-split carbs", () => {
    // Documented behaviour: overrides replace one number, they don't recompute
    // the others. Someone setting kcal by hand is expected to set the macros
    // they care about too, rather than have the app silently move them.
    const auto = computeTargets(90, BASE)!;
    const manual = computeTargets(90, { ...BASE, manualTargets: { kcal: 3000 } })!;
    expect(manual.carbs).toBe(auto.carbs);
    expect(manual.fat).toBe(auto.fat);
  });

  it("targets a 0.5–1%/week loss band", () => {
    const t = computeTargets(100, BASE)!;
    expect(t.lossLow).toBeCloseTo(0.5, 5);
    expect(t.lossHigh).toBeCloseTo(1.0, 5);
    expect(t.kcalLow).toBeLessThanOrEqual(t.kcalHigh);
    expect(t.kcal).toBeGreaterThanOrEqual(t.kcalLow);
    expect(t.kcal).toBeLessThanOrEqual(t.kcalHigh);
  });
});

describe("mealTotals", () => {
  it("returns zeros for an empty day", () => {
    expect(mealTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it("sums every macro across meals", () => {
    const total = mealTotals([
      meal({ id: "a", kcal: 500, protein: 40, carbs: 50, fat: 15 }),
      meal({ id: "b", kcal: 320, protein: 25, carbs: 30, fat: 10 }),
    ]);
    expect(total).toEqual({ kcal: 820, protein: 65, carbs: 80, fat: 25 });
  });
});

describe("foodSystemPrompt", () => {
  it("carries the user's own plate size, not a default", () => {
    expect(foodSystemPrompt({ plateCm: 31 })).toContain("31 cm");
  });

  it("falls back to 26 cm when no plate is configured", () => {
    expect(foodSystemPrompt({})).toContain("26 cm");
  });

  it("tells the model to scale to this hand, not population averages", () => {
    const p = foodSystemPrompt({ hand: { fistWidthCm: 8, fistLengthCm: 14 } });
    expect(p).toContain("8 cm wide");
    expect(p).toContain("14 cm long");
    expect(p).toMatch(/not population averages/i);
  });

  it("states the ±30% honesty rule so the UI never implies false precision", () => {
    expect(foodSystemPrompt({})).toContain("±30%");
  });

  it("uses the same confidence vocabulary as the Zod schema", () => {
    // If these drift, the UI's confidence badge silently falls through to the
    // raw enum value.
    const p = foodSystemPrompt({});
    for (const level of ["low", "medium", "good"]) {
      expect(p).toContain(`"${level}"`);
    }
  });
});

describe("handBlock", () => {
  it("still produces a usable scale line with no measurements at all", () => {
    const b = handBlock(undefined);
    expect(b).toContain("9.5 cm"); // documented default fist width
    expect(b).toContain("palm-sized meat");
  });

  it("omits optional measurements that were never taken", () => {
    const b = handBlock({ fistWidthCm: 8 });
    expect(b).not.toContain("hand span");
    expect(b).not.toContain("wrist width");
  });

  it("ignores zero and negative measurements rather than emitting them", () => {
    const b = handBlock({ fistWidthCm: 0, palmSpanCm: -5 });
    expect(b).toContain("9.5 cm");
    expect(b).not.toContain("-5");
  });
});
