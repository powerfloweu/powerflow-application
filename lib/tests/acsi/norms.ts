// Population averages for the ACSI-28, split by gender.
// Used for radar chart display and comparative interpretation.
// Source: Smith, Schutz, Smoll & Ptacek (1995) — ACSI-28 normative data.

import type { AcsiSubscaleKey, Band } from "./scoring";

// ---------------------------------------------------------------------------
// Population averages per gender per subscale
// ---------------------------------------------------------------------------

export const POPULATION_AVERAGES: Record<"male" | "female", Record<AcsiSubscaleKey, number>> = {
  female: {
    coping: 9,
    peaking: 10,
    goalSetting: 13,
    concentration: 10.5,
    freedom: 10,
    confidence: 9,
    coachability: 11,
  },
  male: {
    coping: 10.5,
    peaking: 11.5,
    goalSetting: 12.5,
    concentration: 11.5,
    freedom: 14,
    confidence: 15.5,
    coachability: 14.5,
  },
};

// ---------------------------------------------------------------------------
// Band cutoffs (shared across genders)
// ---------------------------------------------------------------------------

export type BandCutoff = { min: number; max: number };

/** Band cutoffs for each subscale (identical for all subscales in the ACSI). */
export const BAND_CUTOFFS: Record<Band, BandCutoff> = {
  low:     { min: 4,  max: 8 },
  average: { min: 9,  max: 12 },
  high:    { min: 13, max: 16 },
};
