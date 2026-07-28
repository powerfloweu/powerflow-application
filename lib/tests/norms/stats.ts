/**
 * Distribution statistics for building data-driven test norms.
 * Pure, dependency-free, unit-tested.
 */

export interface Distribution {
  n: number;
  mean: number | null;
  sd: number | null; // sample standard deviation (n-1); null when n < 2
  min: number | null;
  max: number | null;
  percentiles: Record<string, number>; // { p10, p25, p50, p75, p90 }
}

export const PERCENTILE_POINTS = [10, 25, 50, 75, 90] as const;

export function mean(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample standard deviation (n-1 denominator). Null for n < 2. */
export function sampleStdDev(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  const ss = xs.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return Math.sqrt(ss / (xs.length - 1));
}

/**
 * Percentile via linear interpolation between closest ranks (the common
 * "type 7" method used by NumPy/Excel PERCENTILE.INC). `p` is 0–100.
 */
export function percentile(xs: number[], p: number): number | null {
  if (!xs.length) return null;
  if (xs.length === 1) return xs[0];
  const sorted = [...xs].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  const frac = rank - lo;
  return sorted[lo] + (sorted[hi] - sorted[lo]) * frac;
}

function round(v: number | null, dp = 2): number | null {
  if (v === null) return null;
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

export function describeDistribution(xs: number[]): Distribution {
  const clean = xs.filter((x) => typeof x === "number" && Number.isFinite(x));
  const percentiles: Record<string, number> = {};
  for (const p of PERCENTILE_POINTS) {
    const v = percentile(clean, p);
    if (v !== null) percentiles[`p${p}`] = round(v)!;
  }
  return {
    n: clean.length,
    mean: round(mean(clean)),
    sd: round(sampleStdDev(clean)),
    min: clean.length ? Math.min(...clean) : null,
    max: clean.length ? Math.max(...clean) : null,
    percentiles,
  };
}

/** Where a raw score falls in a reference distribution, 0–100. Null if unknown. */
export function percentileRank(value: number, sortedAsc: number[]): number | null {
  if (!sortedAsc.length) return null;
  let below = 0, equal = 0;
  for (const x of sortedAsc) {
    if (x < value) below++;
    else if (x === value) equal++;
  }
  // Mid-rank (average) percentile — standard for discrete data.
  return Math.round(((below + equal / 2) / sortedAsc.length) * 100);
}
