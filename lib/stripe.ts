/**
 * Stripe SDK singleton for server-side use.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY         — rk_live_... or sk_live_... Stripe secret key
 *   STRIPE_WEBHOOK_SECRET     — whsec_... from `stripe listen` or Stripe dashboard
 *   STRIPE_SECOND_PRICE_ID    — price_... for the Second Tier (€9/mo)
 *   STRIPE_PR_PRICE_ID        — price_... for the PR Tier (€19/mo)
 *
 * Optional:
 *   NEXT_PUBLIC_APP_URL        — e.g. https://app.power-flow.eu (for redirect URLs)
 */

import Stripe from "stripe";
import type { PlanTier } from "@/lib/plan";

const key = process.env.STRIPE_SECRET_KEY ?? "";

/** Shared Stripe client (lazily-created). */
export const stripe = new Stripe(key, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/** Map tier → Stripe price ID (from env). */
export const PRICE_IDS: Record<Exclude<PlanTier, "opener">, string> = {
  second: process.env.STRIPE_SECOND_PRICE_ID ?? "",
  pr: process.env.STRIPE_PR_PRICE_ID ?? "",
};

/** Map Stripe price ID → app tier. */
export function tierForPrice(priceId: string): PlanTier | null {
  if (priceId === PRICE_IDS.second) return "second";
  if (priceId === PRICE_IDS.pr) return "pr";
  return null;
}

/** App base URL — used for Stripe redirect URLs. */
export function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return url.replace(/\/$/, "");
}
