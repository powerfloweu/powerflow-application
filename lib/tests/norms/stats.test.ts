import { describe, it, expect } from "vitest";
import { mean, sampleStdDev, percentile, describeDistribution, percentileRank } from "./stats";

describe("mean", () => {
  it("averages", () => expect(mean([2, 4, 6])).toBe(4));
  it("null on empty", () => expect(mean([])).toBeNull());
});

describe("sampleStdDev", () => {
  it("uses n-1", () => expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2));
  it("null for n<2", () => expect(sampleStdDev([5])).toBeNull());
});

describe("percentile (type-7 interpolation)", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  it("median", () => expect(percentile(xs, 50)).toBe(5.5));
  it("p25 / p75", () => {
    expect(percentile(xs, 25)).toBeCloseTo(3.25, 2);
    expect(percentile(xs, 75)).toBeCloseTo(7.75, 2);
  });
  it("min/max at extremes", () => {
    expect(percentile(xs, 0)).toBe(1);
    expect(percentile(xs, 100)).toBe(10);
  });
  it("single value", () => expect(percentile([42], 90)).toBe(42));
  it("null on empty", () => expect(percentile([], 50)).toBeNull());
});

describe("describeDistribution", () => {
  it("summarizes and filters non-finite", () => {
    const d = describeDistribution([10, 20, 30, 40, NaN, 50]);
    expect(d.n).toBe(5);
    expect(d.mean).toBe(30);
    expect(d.min).toBe(10);
    expect(d.max).toBe(50);
    expect(d.percentiles.p50).toBe(30);
  });
  it("handles empty", () => {
    const d = describeDistribution([]);
    expect(d).toEqual({ n: 0, mean: null, sd: null, min: null, max: null, percentiles: {} });
  });
});

describe("percentileRank", () => {
  it("mid-ranks against a sorted sample", () => {
    const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentileRank(5, sample)).toBe(45); // 4 below + 0.5 = 4.5/10
    expect(percentileRank(10, sample)).toBe(95);
    expect(percentileRank(1, sample)).toBe(5);
  });
  it("null on empty reference", () => expect(percentileRank(5, [])).toBeNull());
});
