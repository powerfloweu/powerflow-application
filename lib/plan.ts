/**
 * Plan tier definitions and access helpers.
 *
 * Tiers (powerlifting attempt metaphor):
 *   opener  — free, journal only
 *   second  — tools (library, scripts, voices, test reports)
 *   pr      — all-access (course + AI coach)
 */

export type PlanTier = "opener" | "second" | "pr";

const ORDER: Record<PlanTier, number> = { opener: 0, second: 1, pr: 2 };

export const TIER_LABELS: Record<PlanTier, string> = {
  opener: "Opener Tier",
  second: "Second Tier",
  pr: "PR Tier",
};

export const TIER_SUBTITLES: Record<PlanTier, string> = {
  opener: "Free",
  second: "Tools",
  pr: "All-access",
};

export const TIER_DESCRIPTIONS: Record<PlanTier, string> = {
  opener: "Journal your sessions and track your training.",
  second: "The full mental performance toolkit.",
  pr: "Every tool, the full course, and your AI coach.",
};

export const TIER_FEATURES: Record<PlanTier, string[]> = {
  opener: [
    "Daily journal & training log",
    "Athlete profile",
    "Check-in reminders",
  ],
  second: [
    "Everything in Opener",
    "Resource library",
    "Mental performance scripts",
    "Voice work sessions",
    "Psychological test reports",
  ],
  pr: [
    "Everything in Second",
    "16-week mental performance course",
    "AI coaching chat",
    "Personalised course plan",
  ],
};

/** True if userTier meets or exceeds the requiredTier. */
export function hasAccess(userTier: PlanTier, requiredTier: PlanTier): boolean {
  return ORDER[userTier] >= ORDER[requiredTier];
}

/** Second tier or above (library, scripts, voices, test reports). */
export function canAccessTools(tier: PlanTier): boolean {
  return hasAccess(tier, "second");
}

/** PR tier only (course + AI chat). */
export function canAccessPR(tier: PlanTier): boolean {
  return hasAccess(tier, "pr");
}

/**
 * Per-user override flags an admin can grant manually on `profiles`,
 * independent of (and possibly above) the athlete's `plan_tier`.
 * Any subset may be present — every field is optional so this accepts
 * a raw DB row, a partial `/api/me` response, or a hand-built object.
 */
export interface TierOverrides {
  plan_tier?: string | null;
  course_access?: boolean | null;
  test_access?: boolean | null;
  ai_access?: boolean | null;
}

const VALID_TIERS = new Set<PlanTier>(["opener", "second", "pr"]);

function normalizeTier(raw: string | null | undefined): PlanTier {
  return raw && VALID_TIERS.has(raw as PlanTier) ? (raw as PlanTier) : "opener";
}

/**
 * THE canonical tier resolver. Folds admin-granted override flags into the
 * base `plan_tier` so every gate in the app (nav, page guards, API routes)
 * agrees on what a user can actually access.
 *
 *   course_access / ai_access → at least "pr"     (both are PR-tier features —
 *                                                    course + AI coach)
 *   test_access               → at least "second" (tools tier)
 *
 * This is a strict upgrade only — it never downgrades a tier the DB already
 * reports. Use this instead of reading `plan_tier` directly anywhere access
 * is being decided; reading the raw column silently under-grants any athlete
 * whose admin-granted flag doesn't match their base tier.
 */
export function effectiveTier(row: TierOverrides): PlanTier {
  let tier = normalizeTier(row.plan_tier);
  if ((row.course_access || row.ai_access) && tier !== "pr") {
    tier = "pr";
  } else if (row.test_access && tier === "opener") {
    tier = "second";
  }
  return tier;
}
