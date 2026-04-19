// Gender-split reference bands for the ÖIT self-awareness test.
// Source: ÖIT_GOLD_v2.0_Eng.xlsx — Férfi / Női / Men_Eng sheets, columns M (avg) and O (band).
//
// Band semantics: a score strictly below the band min is LOW, strictly above the max is HIGH,
// anything inside (inclusive) is AVERAGE. Primary factors are 0–15; subfactors are weighted sums.

import type { FactorName } from "./items";

export type Gender = "male" | "female";
export type Band = "low" | "average" | "high";

type FactorNorm = {
  average: number;   // population mean
  min: number;       // inclusive lower bound of AVERAGE band
  max: number;       // inclusive upper bound of AVERAGE band
};

export const FACTOR_NORMS: Record<Gender, Record<FactorName, FactorNorm>> = {
  male: {
    Performance:   { average:  9.00, min: 6, max: 12 },
    Affiliation:   { average:  9.00, min: 6, max: 12 },
    Aggression:    { average:  7.05, min: 4, max: 10 },
    Defensiveness: { average:  7.50, min: 5, max: 10 },
    Consciousness: { average:  7.50, min: 5, max: 10 },
    Dominance:     { average:  7.95, min: 5, max: 11 },
    Exhibition:    { average:  6.45, min: 4, max:  9 },
    Autonomy:      { average:  7.50, min: 5, max: 10 },
    Caregiving:    { average: 10.05, min: 7, max: 13 },
    Order:         { average: 10.50, min: 8, max: 13 },
    Helplessness:  { average:  7.05, min: 4, max: 10 },
  },
  female: {
    Performance:   { average:  7.50, min: 5, max: 10 },
    Affiliation:   { average: 10.50, min: 8, max: 13 },
    Aggression:    { average:  4.95, min: 3, max:  7 },
    Defensiveness: { average:  7.50, min: 5, max: 10 },
    Consciousness: { average:  7.50, min: 5, max: 10 },
    Dominance:     { average:  6.50, min: 4, max:  9 },
    Exhibition:    { average:  7.50, min: 5, max: 10 },
    Autonomy:      { average:  7.50, min: 5, max: 10 },
    Caregiving:    { average: 11.50, min: 9, max: 14 },
    Order:         { average: 10.00, min: 8, max: 12 },
    Helplessness:  { average:  8.50, min: 5, max: 12 },
  },
};

// Subfactor bands are shared across genders in the source workbook.
export type SubfactorName =
  | "Self-confirmation"
  | "Rational dominance"
  | "Aggressive nonconformity"
  | "Passive dependence"
  | "Sociability"
  | "Agreeableness";

export const SUBFACTOR_NORMS: Record<SubfactorName, { min: number; max: number }> = {
  "Self-confirmation":        { min: 120, max: 165 },
  "Rational dominance":       { min:   5, max:  40 },
  "Aggressive nonconformity": { min:  10, max:  23 },
  "Passive dependence":       { min: 100, max: 140 },
  "Sociability":              { min:  55, max:  90 },
  "Agreeableness":            { min:  60, max: 100 },
};

export function classify(value: number, min: number, max: number): Band {
  if (value < min) return "low";
  if (value > max) return "high";
  return "average";
}
