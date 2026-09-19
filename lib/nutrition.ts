/**
 * Nutrition calculation engine — ported from tamas60, adapted to PowerFlow.
 *
 * Provides auto-calculated daily macro targets (Mifflin–St Jeor BMR → TDEE →
 * deficit) with manual overrides, plus types shared between the UI and API.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface HandMeasurements {
  fistWidthCm?: number;
  fistLengthCm?: number;
  palmSpanCm?: number;
  fingerCm?: number;
  wristCm?: number;
  fistMl?: number;   // "fist-sized" volume in ml
  palmG?: number;    // "palm-sized" meat mass in grams
}

export interface NutritionConfig {
  birthYear?: number;
  heightCm?: number;
  sex?: "male" | "female";     // Mifflin–St Jeor constant
  startWeight?: number;        // fallback when no weight logged
  goalWeight?: number;
  activityBase?: number;       // sedentary multiplier (default 1.2)
  plateDiameterCm?: number;    // for AI portion estimation
  hand?: HandMeasurements;
  fatPreferenceG?: number;     // slider override for fat grams
  /** Any manually overridden targets. Auto-calc fills the rest. */
  manualTargets?: Partial<MacroTargets>;
}

export interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionTargetResult extends MacroTargets {
  bmr: number;
  tdee: number;
  kg: number;
  ref: number;           // reference weight (min of current, goal)
  kcalLow: number;
  kcalHigh: number;
  fatMin: number;
  fatMax: number;
  lossLow: number;       // kg/week at kcalHigh
  lossHigh: number;      // kg/week at kcalLow
  fromManual: Partial<Record<keyof MacroTargets, boolean>>;
}

export interface MealItem {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealRow {
  id: string;
  meal_date: string;
  description: string;
  items: MealItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "photo" | "photo+text" | "text" | "barcode";
  created_at: string;
}

// ── Core calculation ─────────────────────────────────────────────────────────

const r10 = (v: number) => Math.round(v / 10) * 10;
const r5 = (v: number) => Math.round(v / 5) * 5;

/**
 * Compute daily macro targets from weight + config.
 * Returns null if no weight is available.
 */
export function computeTargets(
  currentKg: number | null,
  config: NutritionConfig,
): NutritionTargetResult | null {
  const kg = currentKg ?? config.startWeight ?? null;
  if (!kg) return null;

  const age = ageFromBirthYear(config.birthYear ?? 1990);
  const h = config.heightCm ?? 175;
  const sex = config.sex ?? "male";

  // Mifflin–St Jeor BMR
  const bmr = 10 * kg + 6.25 * h - 5 * age + (sex === "male" ? 5 : -161);

  // TDEE = BMR × activity base (no step/workout add-ons for now — that's
  // tamas-specific; athletes train differently).
  const tdee = bmr * (config.activityBase ?? 1.2);

  // 0.5–1% weekly loss range
  const lossLow = kg * 0.005;   // conservative
  const lossHigh = kg * 0.01;   // aggressive
  const floor = r10(bmr);

  let kcalHigh = r10(tdee - lossLow * 7700 / 7);
  let kcalLow = r10(tdee - lossHigh * 7700 / 7);
  kcalLow = Math.max(floor, kcalLow);
  kcalHigh = Math.max(kcalLow, kcalHigh);
  let kcal = r10((kcalLow + kcalHigh) / 2);

  // Reference weight for protein/fat: use goal weight if lower (excess fat
  // mass doesn't need extra protein).
  const ref = Math.min(kg, config.goalWeight ?? kg);
  let protein = r5(ref * 1.8);

  // Fat/carb split
  const rest = kcal - protein * 4;
  const fatMin = r5(Math.max(40, ref * 0.5));
  const fatMax = Math.max(fatMin, Math.floor((rest - 50 * 4) / 9 / 5) * 5);
  const fatDef = r5(ref * 0.8);
  const fatPref = config.fatPreferenceG;
  let fat = Math.min(fatMax, Math.max(fatMin, fatPref != null ? r5(fatPref) : Math.min(fatMax, fatDef)));
  let carbs = Math.max(50, r5((rest - fat * 9) / 4));

  // Apply manual overrides
  const manual = config.manualTargets ?? {};
  const fromManual: Partial<Record<keyof MacroTargets, boolean>> = {};
  if (manual.kcal != null) { kcal = manual.kcal; fromManual.kcal = true; }
  if (manual.protein != null) { protein = manual.protein; fromManual.protein = true; }
  if (manual.fat != null) { fat = manual.fat; fromManual.fat = true; }
  if (manual.carbs != null) { carbs = manual.carbs; fromManual.carbs = true; }

  return {
    kcal, protein, carbs, fat,
    bmr: Math.round(bmr), tdee: Math.round(tdee),
    kg, ref,
    kcalLow, kcalHigh,
    fatMin, fatMax,
    lossLow, lossHigh,
    fromManual,
  };
}

function ageFromBirthYear(birthYear: number): number {
  const now = new Date();
  return now.getFullYear() - birthYear;
}

// ── Meal totals ──────────────────────────────────────────────────────────────

export function mealTotals(meals: MealRow[]): MacroTargets {
  return meals.reduce(
    (t, m) => ({
      kcal: t.kcal + (m.kcal || 0),
      protein: t.protein + (m.protein || 0),
      carbs: t.carbs + (m.carbs || 0),
      fat: t.fat + (m.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ── AI prompt helper (reused by /api/life/food) ──────────────────────────────

export function handBlock(hand: HandMeasurements | undefined): string {
  const h = hand && typeof hand === "object" ? hand : ({} as HandMeasurements);
  const n = (v: number | undefined) => (v && v > 0 ? v : null);
  const fw = n(h.fistWidthCm) || 9.5;
  const fl = n(h.fistLengthCm);

  const lines = [
    `- If a fist or hand is visible on the table in the photo, use it as a scale reference. The user's fist is ${fw} cm wide` +
      (fl ? ` and ${fl} cm long` : "") +
      ". Scale to these measurements, not population averages.",
  ];

  const extra: string[] = [];
  if (n(h.palmSpanCm)) extra.push(`hand span (thumb to pinky) ${n(h.palmSpanCm)} cm`);
  if (n(h.fingerCm)) extra.push(`longest finger ${n(h.fingerCm)} cm`);
  if (n(h.wristCm)) extra.push(`wrist width ${n(h.wristCm)} cm`);
  if (extra.length) lines.push(`- If the hand is open or partially visible: ${extra.join(", ")}.`);

  const fistMl = n(h.fistMl) || 240;
  const palmG = n(h.palmG) || 110;
  lines.push(
    `- Portion words calibrated to this hand: "palm-sized meat" ≈ ${palmG - 10}–${palmG + 10} g, "fist-sized" ≈ ${fistMl - 20}–${fistMl + 20} ml volume, "thumb-sized" ≈ 1 tablespoon.`,
  );

  return lines.join("\n");
}

export function foodSystemPrompt(opts: {
  plateCm?: number;
  hand?: HandMeasurements;
}): string {
  const plateCm = opts.plateCm || 26;
  return `You are a nutrition assistant helping someone track their daily food intake. Your job: estimate items, quantities, and macronutrients from a photo and/or short description of a meal.

PRINCIPLES
- Recognize common foods from any cuisine. Estimate per standard recipes and cooking methods.
- The text description overrides the photo for IDENTIFYING the food. If they say "chicken breast", it's chicken, not pork.
- The photo overrides the text for QUANTITY if the plate is visible.
- Only include hidden ingredients (oil, butter, sauce) if the description mentions them or they're clearly visible. If typical but uncertain, mention in the note — don't guess in the numbers.

SCALE
- The user's standard plate is ${plateCm} cm in diameter. If a plate is visible and there's no other info, use this as reference.
${handBlock(opts.hand)}
- Portion words: "large serving" ≈ +40%, "small serving" / "half plate" ≈ −40% compared to a typical portion.

PORTION EATEN
- If the user indicates they didn't eat everything ("half of it", "just a little"), scale the numbers accordingly. Estimate the full plate first, then multiply.

HONESTY
- Photo-based quantity estimates are ±30%. Don't appear more precise than you are: use round numbers (to nearest 5g, 10 kcal).
- Confidence should be "good" if there's both a description AND a scale reference; "medium" if only one; "low" if neither, or the food isn't identifiable.
- If you see nothing edible and there's no description, return an empty items list and explain in the note.`;
}
