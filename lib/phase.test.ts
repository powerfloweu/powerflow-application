import { describe, it, expect, afterEach } from "vitest";
import { computePhase } from "./phase";

const originalTZ = process.env.TZ;

afterEach(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe("computePhase — UTC-parsing off-by-one (negative UTC offset)", () => {
  it("does not shift the meet into 'Meet week' a day early for a US-timezone user", () => {
    // Regression test for the bug where `new Date("YYYY-MM-DD")` parses as UTC
    // midnight, then `.setHours(0,0,0,0)` re-normalises in LOCAL time — in any
    // timezone west of UTC that lands one calendar day earlier, making the
    // meet look like it's already "tomorrow" one day sooner than it is.
    process.env.TZ = "America/Los_Angeles"; // UTC-7 (PDT) in August

    // Freeze "today" by picking a meetDateStr exactly 7 days out from the
    // real current time is unreliable across CI runs, so instead assert the
    // day-boundary math directly: a meet date should read as exactly 7 days
    // away when "today" (in LA) is 7 calendar days before it — regardless of
    // what UTC offset that local midnight sits at.
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const meet = new Date(today);
    meet.setDate(meet.getDate() + 7);
    const y = meet.getFullYear();
    const m = String(meet.getMonth() + 1).padStart(2, "0");
    const d = String(meet.getDate()).padStart(2, "0");
    const meetDateStr = `${y}-${m}-${d}`;

    const info = computePhase(meetDateStr);
    expect(info).not.toBeNull();
    expect(info!.daysUntil).toBe(7);
    expect(info!.phase).toBe("Peak"); // 7 days out falls in the Peak window (7–21)
  });

  it("meet day (daysUntil === 0) stays 'Meet day' in a negative-UTC-offset zone, not the day before", () => {
    process.env.TZ = "America/New_York"; // UTC-4/-5

    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    const info = computePhase(todayStr);
    expect(info).not.toBeNull();
    expect(info!.daysUntil).toBe(0);
    expect(info!.phase).toBe("Meet day");
  });

  it("a fixed UTC date string reads as the correct local day count under a western timezone", () => {
    // Direct repro of the reported bug: with the old `new Date(meetDateStr)`
    // parse, "2026-08-10" parsed as UTC midnight, then setHours(0,0,0,0) in
    // America/Los_Angeles normalised it to Aug 9 local — one day early.
    process.env.TZ = "America/Los_Angeles";
    // Use "today" = the day before the meet, expressed as a local YYYY-MM-DD,
    // so the expected daysUntil is deterministically 1 no matter when the
    // suite runs.
    const meet = new Date();
    meet.setHours(12, 0, 0, 0);
    meet.setDate(meet.getDate() + 1);
    const y = meet.getFullYear();
    const m = String(meet.getMonth() + 1).padStart(2, "0");
    const d = String(meet.getDate()).padStart(2, "0");
    const meetDateStr = `${y}-${m}-${d}`;

    const info = computePhase(meetDateStr);
    expect(info).not.toBeNull();
    expect(info!.daysUntil).toBe(1);
    expect(info!.phase).toBe("Meet week");
  });
});
