// Population averages and band cutoffs for the CSAI-2.
// Used for radar chart display and comparative interpretation.
// Source: Martens, Burton, Vealey, Bump & Smith (1990) -- CSAI-2 normative data.

import type { CsaiSubscaleKey, Band } from "./scoring";

// ---------------------------------------------------------------------------
// Population averages per subscale
// ---------------------------------------------------------------------------

export const POPULATION_AVERAGES: Record<CsaiSubscaleKey, number> = {
  cognitive: 18,
  somatic: 13,
  confidence: 32.5,
};

// ---------------------------------------------------------------------------
// Band cutoffs (different per subscale due to opposite valence)
// ---------------------------------------------------------------------------

export type BandCutoff = { min: number; max: number };

/**
 * Band cutoffs for each subscale.
 *
 * Cognitive Anxiety (higher = MORE anxiety = worse):
 *   low 9--15, average 16--22, high 23--36
 *
 * Somatic Anxiety (higher = MORE physical arousal):
 *   low 9--13, average 14--20, high 21--36
 *
 * Self-Confidence (higher = MORE confidence = better):
 *   low 9--21, average 22--29, high 30--36
 */
export const BAND_CUTOFFS: Record<CsaiSubscaleKey, Record<Band, BandCutoff>> = {
  cognitive: {
    low:     { min: 9,  max: 15 },
    average: { min: 16, max: 22 },
    high:    { min: 23, max: 36 },
  },
  somatic: {
    low:     { min: 9,  max: 13 },
    average: { min: 14, max: 20 },
    high:    { min: 21, max: 36 },
  },
  confidence: {
    low:     { min: 9,  max: 21 },
    average: { min: 22, max: 29 },
    high:    { min: 30, max: 36 },
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Classify a raw subscale score into a band for the given subscale. */
export function getBandForSubscale(subscale: CsaiSubscaleKey, score: number): Band {
  const cutoffs = BAND_CUTOFFS[subscale];
  if (score <= cutoffs.low.max) return "low";
  if (score <= cutoffs.average.max) return "average";
  return "high";
}
