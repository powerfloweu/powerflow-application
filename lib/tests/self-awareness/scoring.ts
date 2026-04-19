// Deterministic scorer for the ÖIT self-awareness test.
// Matches the Excel workbook formulas exactly (see the test fixture for regression coverage).

import { FACTOR_NAMES, ITEMS, type FactorName } from "./items";
import {
  FACTOR_NORMS,
  SUBFACTOR_NORMS,
  classify,
  type Band,
  type Gender,
  type SubfactorName,
} from "./norms";

export type Answer = 0 | 1;
export type Answers = Record<number, Answer>; // item id → answer

export type FactorResult = {
  factor: FactorName;
  rawScore: number;           // 0..15
  max: number;                // always 15
  band: Band;
  bandMin: number;
  bandMax: number;
  populationAverage: number;
};

export type SubfactorResult = {
  subfactor: SubfactorName;
  score: number;
  band: Band;
  bandMin: number;
  bandMax: number;
};

export type Validity = {
  sumYes: number;              // total count of "yes" answers (1..165)
  band: Band;                  // vs. Agreeableness norm (60..100)
  bandMin: number;
  bandMax: number;
  reliable: boolean;           // false if outside the agreeableness band
};

export type ScoreReport = {
  gender: Gender;
  factors: FactorResult[];     // 11 primary factors in FACTOR_NAMES order
  subfactors: SubfactorResult[]; // 6 subfactors
  validity: Validity;
};

export type IncompleteError = { missingItemIds: number[] };

/**
 * Score a complete set of answers. Throws if any item 1..165 is unanswered.
 */
export function score(answers: Answers, gender: Gender): ScoreReport {
  const missing: number[] = [];
  for (let i = 1; i <= 165; i++) {
    if (answers[i] !== 0 && answers[i] !== 1) missing.push(i);
  }
  if (missing.length > 0) {
    const err = new Error(`Cannot score: ${missing.length} item(s) unanswered`);
    (err as Error & IncompleteError).missingItemIds = missing;
    throw err;
  }

  const factorScores: Record<FactorName, number> = Object.fromEntries(
    FACTOR_NAMES.map((n) => [n, 0]),
  ) as Record<FactorName, number>;

  let sumYes = 0;
  for (const item of ITEMS) {
    const a = answers[item.id];
    sumYes += a;
    if (a === item.key) {
      factorScores[FACTOR_NAMES[item.factor]] += 1;
    }
  }

  const norms = FACTOR_NORMS[gender];
  const factors: FactorResult[] = FACTOR_NAMES.map((name) => {
    const raw = factorScores[name];
    const n = norms[name];
    return {
      factor: name,
      rawScore: raw,
      max: 15,
      band: classify(raw, n.min, n.max),
      bandMin: n.min,
      bandMax: n.max,
      populationAverage: n.average,
    };
  });

  const F = factorScores;
  const subScores: Record<SubfactorName, number> = {
    "Self-confirmation":        6 * F.Performance + 5 * F.Defensiveness + 5 * F.Consciousness + 4 * F.Aggression,
    "Rational dominance":       7 * F.Dominance + 7 * F.Exhibition - 5 * F.Defensiveness - 4 * F.Consciousness,
    "Aggressive nonconformity": 5 * F.Autonomy - 5 * F.Order + 4 * F.Aggression,
    "Passive dependence":       6 * F.Helplessness + 5 * F.Affiliation + 3 * F.Defensiveness,
    "Sociability":              5 * F.Caregiving + 3 * F.Affiliation - 3 * F.Aggression,
    "Agreeableness":            sumYes,
  };

  const subfactors: SubfactorResult[] = (Object.keys(subScores) as SubfactorName[]).map((name) => {
    const n = SUBFACTOR_NORMS[name];
    return {
      subfactor: name,
      score: subScores[name],
      band: classify(subScores[name], n.min, n.max),
      bandMin: n.min,
      bandMax: n.max,
    };
  });

  const validityNorm = SUBFACTOR_NORMS["Agreeableness"];
  const validity: Validity = {
    sumYes,
    band: classify(sumYes, validityNorm.min, validityNorm.max),
    bandMin: validityNorm.min,
    bandMax: validityNorm.max,
    reliable: sumYes >= validityNorm.min && sumYes <= validityNorm.max,
  };

  return { gender, factors, subfactors, validity };
}

/**
 * Return only the item ids (1..165) that haven't been answered yet.
 * Useful for driving the "jump to first unanswered" behaviour in the UI.
 */
export function unansweredItemIds(answers: Answers): number[] {
  const out: number[] = [];
  for (let i = 1; i <= 165; i++) {
    if (answers[i] !== 0 && answers[i] !== 1) out.push(i);
  }
  return out;
}
