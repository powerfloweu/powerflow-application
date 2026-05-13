/**
 * Client-safe pricing constants for the upgrade page.
 * No Stripe SDK imports — safe to use in "use client" components.
 */

import type { PlanTier } from "@/lib/plan";

export type BillingPeriod = "monthly" | "6mo" | "yearly";

export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  "6mo":   "Every 6 months",
  yearly:  "Yearly",
};

export const PERIOD_SAVINGS: Partial<Record<BillingPeriod, string>> = {
  "6mo":  "Save 10%",
  yearly: "Save 25%",
};

export const TIER_PERIODS: Record<Exclude<PlanTier, "opener">, BillingPeriod[]> = {
  second: ["monthly", "yearly"],
  pr:     ["monthly", "6mo", "yearly"],
};

export const PERIOD_PRICES: Record<string, string> = {
  second_monthly: "€9 / month",
  second_yearly:  "€97.20 / year  (€8.10/mo)",
  pr_monthly:     "€29 / month",
  pr_6mo:         "€156.60 / 6 months  (€26.10/mo)",
  pr_yearly:      "€261 / year  (€21.75/mo)",
};
