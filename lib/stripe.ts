/**
 * Stripe SDK singleton for server-side use.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY              — rk_live_... or sk_live_... Stripe secret key
 *   STRIPE_WEBHOOK_SECRET          — whsec_... from Stripe dashboard
 *   STRIPE_SECOND_PRICE_ID         — price_... Second Tier monthly (€9/mo)
 *   STRIPE_SECOND_PRICE_YEARLY_ID  — price_... Second Tier yearly (€97.20/yr, 10% off)
 *   STRIPE_PR_PRICE_ID             — price_... PR Tier monthly (€29/mo)
 *   STRIPE_PR_PRICE_6MO_ID         — price_... PR Tier 6-month (€156.60/6mo, 10% off)
 *   STRIPE_PR_PRICE_YEARLY_ID      — price_... PR Tier yearly (€261/yr, 25% off)
 *   NEXT_PUBLIC_APP_URL            — e.g. https://app.power-flow.eu
 */

import Stripe from "stripe";
import type { PlanTier } from "@/lib/plan";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

export type BillingPeriod = "monthly" | "6mo" | "yearly";

/** All price IDs keyed by tier + period. */
export const PRICE_IDS: Record<string, string> = {
  second_monthly: process.env.STRIPE_SECOND_PRICE_ID ?? "",
  second_yearly:  process.env.STRIPE_SECOND_PRICE_YEARLY_ID ?? "",
  pr_monthly:     process.env.STRIPE_PR_PRICE_ID ?? "",
  pr_6mo:         process.env.STRIPE_PR_PRICE_6MO_ID ?? "",
  pr_yearly:      process.env.STRIPE_PR_PRICE_YEARLY_ID ?? "",
};

/** Human-readable labels for each period. */
export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  "6mo":   "Every 6 months",
  yearly:  "Yearly",
};

/** Discount labels shown on the period selector. */
export const PERIOD_SAVINGS: Partial<Record<BillingPeriod, string>> = {
  "6mo":  "Save 10%",
  yearly: "Save 25%",
};

/** Periods available per paid tier. */
export const TIER_PERIODS: Record<Exclude<PlanTier, "opener">, BillingPeriod[]> = {
  second: ["monthly", "yearly"],
  pr:     ["monthly", "6mo", "yearly"],
};

/** Per-period display prices (for the upgrade page). */
export const PERIOD_PRICES: Record<string, string> = {
  second_monthly: "€9 / month",
  second_yearly:  "€97.20 / year  (€8.10/mo)",
  pr_monthly:     "€29 / month",
  pr_6mo:         "€156.60 / 6 months  (€26.10/mo)",
  pr_yearly:      "€261 / year  (€21.75/mo)",
};

/** Returns the price ID for a given tier + period. Null if not found/configured. */
export function priceIdFor(tier: Exclude<PlanTier, "opener">, period: BillingPeriod): string | null {
  const key = `${tier}_${period}`;
  return PRICE_IDS[key] || null;
}

/** Returns which tier a price ID belongs to. */
export function tierForPrice(priceId: string): PlanTier | null {
  for (const [key, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return key.split("_")[0] as PlanTier;
  }
  return null;
}

/** App base URL. */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}
