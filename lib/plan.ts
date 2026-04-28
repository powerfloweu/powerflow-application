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
