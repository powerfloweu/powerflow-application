/**
 * Minimum plan tier required to open each library tool.
 *
 * Single source of truth for tool gating. The library page groups these same
 * tools into sections that each carry a `minTier`; this map must agree with it.
 * `lib/toolTiers.test.ts` asserts the two stay in sync, so adding a tool to the
 * library without adding it here fails the test rather than silently shipping
 * an ungated tool.
 *
 * Pure data — safe to import from both server routes and client components.
 */

import type { PlanTier } from "./plan";

export const TOOL_MIN_TIER: Record<string, PlanTier> = {
  // Relaxation
  "pmr":                 "opener",
  "autogenic-training":  "opener",
  // Visualizations
  "viz-squat":           "second",
  "viz-bench":           "second",
  "viz-deadlift":        "second",
  // Activation
  "resource-activation": "second",
  // Affirmations
  "affirmations":        "second",
  // Focus
  "barrier":             "pr",
  "hibajavitas":         "pr",
  // Competition
  "comp-day-viz":        "pr",
};

export type ToolId = keyof typeof TOOL_MIN_TIER;

export function isKnownTool(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOOL_MIN_TIER, id);
}
