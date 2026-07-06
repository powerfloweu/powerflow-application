import { describe, it, expect } from "vitest";
import { computeDimStatuses, schemeForWeek, sumMealMacros, type LifeDimension, type CheckinRow } from "./life";

const car: LifeDimension = { id: "car", label: "Car tidiness", cadence: "weekly", threshold: 6 };
const train: LifeDimension = { id: "train", label: "Motivation to train", cadence: "daily" };

function checkin(date: string, scores: Record<string, number>): CheckinRow {
  return { checkin_date: date, scores };
}

describe("computeDimStatuses — adaptive cadence", () => {
  it("weekly dim with no history is due", () => {
    const [s] = computeDimStatuses([car], [], "2026-07-06");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(true);
    expect(s.lastScore).toBeNull();
  });

  it("weekly dim answered 3 days ago is not due yet", () => {
    const [s] = computeDimStatuses([car], [checkin("2026-07-03", { car: 8 })], "2026-07-06");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(false);
  });

  it("weekly dim answered 7 days ago is due", () => {
    const [s] = computeDimStatuses([car], [checkin("2026-06-29", { car: 8 })], "2026-07-06");
    expect(s.due).toBe(true);
  });

  it("two consecutive bad scores flip a weekly dim into focus mode (every 3 days)", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-02");
    expect(s.mode).toBe("focus");
    expect(s.due).toBe(true); // 3 days since last answer
  });

  it("focus mode is not due only 2 days after the last answer", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("focus");
    expect(s.due).toBe(false);
  });

  it("one good score exits focus mode back to weekly", () => {
    const history = [
      checkin("2026-06-22", { car: 4 }),
      checkin("2026-06-25", { car: 3 }),
      checkin("2026-06-28", { car: 8 }), // recovered
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("weekly");
    expect(s.due).toBe(false); // only 3 days since answer; weekly interval now applies
  });

  it("one bad score after a good one stays weekly (needs two in a row)", () => {
    const history = [
      checkin("2026-06-22", { car: 8 }),
      checkin("2026-06-29", { car: 3 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-01");
    expect(s.mode).toBe("weekly");
  });

  it("daily dim is due when not answered today and not due when answered today", () => {
    const [due] = computeDimStatuses([train], [checkin("2026-07-05", { train: 7 })], "2026-07-06");
    expect(due.mode).toBe("daily");
    expect(due.due).toBe(true);
    const [notDue] = computeDimStatuses([train], [checkin("2026-07-06", { train: 7 })], "2026-07-06");
    expect(notDue.due).toBe(false);
  });

  it("ignores check-in rows that don't contain the dimension", () => {
    const history = [
      checkin("2026-07-05", { train: 7 }),      // no car score
      checkin("2026-06-29", { car: 8 }),
    ];
    const [s] = computeDimStatuses([car], history, "2026-07-06");
    expect(s.lastDate).toBe("2026-06-29");
    expect(s.due).toBe(true);
  });
});

describe("schemeForWeek", () => {
  it("returns static scheme text as-is", () => {
    expect(schemeForWeek("4 x 8 @ RPE 7", 2)).toBe("4 x 8 @ RPE 7");
  });
  it("picks the week from a per-week map", () => {
    const wave = { "1": "7 / 5 / 3", "2": "6 / 4 / 2", "3": "5 / 3 / 1" };
    expect(schemeForWeek(wave, 2)).toBe("6 / 4 / 2");
  });
  it("falls back to the first defined week when the week is missing", () => {
    const wave = { "1": "7 / 5 / 3" };
    expect(schemeForWeek(wave, 9)).toBe("7 / 5 / 3");
  });
});

describe("sumMealMacros", () => {
  const meals = [
    { id: "m1", name: "Chicken rice", kcal: 650, protein: 45, carbs: 70, fat: 15 },
    { id: "m2", name: "Oats", kcal: 420, protein: 18, carbs: 60, fat: 12 },
  ];
  it("sums selected meals, counting duplicates", () => {
    expect(sumMealMacros(["m1", "m2", "m2"], meals)).toEqual({
      kcal: 1490, protein: 81, carbs: 190, fat: 39,
    });
  });
  it("ignores unknown meal ids", () => {
    expect(sumMealMacros(["nope"], meals)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
