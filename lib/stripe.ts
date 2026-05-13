/**
 * Stripe SDK singleton — SERVER-SIDE ONLY.
 * Never import this in "use client" components. Use lib/stripePricing.ts for
 * display constants that are safe to use in the browser.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY              — rk_live_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET          — whsec_...
 *   STRIPE_SECOND_PRICE_ID         — Second Tier monthly (€9/mo)
 *   STRIPE_SECOND_PRICE_YEARLY_ID  — Second Tier yearly (€97.20/yr, 10% off)
 *   STRIPE_PR_PRICE_ID             — PR Tier monthly (€29/mo)
 *   STRIPE_PR_PRICE_6MO_ID         — PR Tier 6-month (€156.60/6mo, 10% off)
 *   STRIPE_PR_PRICE_YEARLY_ID      — PR Tier yearly (€261/yr, 25% off)
 *   STRIPE_COACH_PRICE_ID          — Coach Plan per-seat (€5/athlete/mo)
 *   NEXT_PUBLIC_APP_URL            — e.g. https://app.power-flow.eu
 */

import "server-only";
import Stripe from "stripe";
import type { PlanTier } from "@/lib/plan";
import type { BillingPeriod } from "@/lib/stripePricing";

export type { BillingPeriod };

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/** All price IDs keyed by tier + period. */
export const PRICE_IDS: Record<string, string> = {
  second_monthly: process.env.STRIPE_SECOND_PRICE_ID ?? "",
  second_yearly:  process.env.STRIPE_SECOND_PRICE_YEARLY_ID ?? "",
  pr_monthly:     process.env.STRIPE_PR_PRICE_ID ?? "",
  pr_6mo:         process.env.STRIPE_PR_PRICE_6MO_ID ?? "",
  pr_yearly:      process.env.STRIPE_PR_PRICE_YEARLY_ID ?? "",
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
