/**
 * Coach billing helpers.
 *
 * Coaches pay €5/athlete/month as a per-seat Stripe subscription.
 * Call syncCoachQuantity whenever an athlete links or unlinks from a coach.
 */

import { stripe, appUrl } from "@/lib/stripe";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

type CoachRow = {
  id: string;
  stripe_customer_id?: string | null;
  stripe_coach_sub_id?: string | null;
};

type AthleteRow = { id: string };

/** Returns the number of athletes currently linked to a coach. */
export async function countAthletes(coachId: string): Promise<number> {
  const rows = await dbSelect<AthleteRow>("profiles", {
    coach_id: `eq.${coachId}`,
    role: "eq.athlete",
    select: "id",
    limit: "10000",
  });
  return rows.length;
}

/**
 * Syncs the coach's Stripe subscription quantity to their current athlete count.
 *
 * - If count > 0 and subscription exists   → update quantity
 * - If count = 0 and subscription exists   → cancel subscription
 * - If count > 0 and no subscription       → do nothing (coach hasn't set up billing yet)
 * - If count = 0 and no subscription       → do nothing
 */
export async function syncCoachQuantity(coachId: string): Promise<void> {
  const rows = await dbSelect<CoachRow>("profiles", {
    id: `eq.${coachId}`,
    select: "id,stripe_customer_id,stripe_coach_sub_id",
  });
  const coach = rows[0];
  if (!coach?.stripe_coach_sub_id) return; // no subscription yet — nothing to sync

  const count = await countAthletes(coachId);

  try {
    if (count === 0) {
      // Cancel subscription — no athletes left
      await stripe.subscriptions.cancel(coach.stripe_coach_sub_id);
      await dbPatch("profiles", { id: coachId }, { stripe_coach_sub_id: null });
    } else {
      // Update quantity on existing subscription
      const sub = await stripe.subscriptions.retrieve(coach.stripe_coach_sub_id);
      const itemId = sub.items.data[0]?.id;
      if (itemId) {
        await stripe.subscriptions.update(coach.stripe_coach_sub_id, {
          items: [{ id: itemId, quantity: count }],
          proration_behavior: "always_invoice",
        });
      }
    }
  } catch (err) {
    console.error("[coachBilling] syncCoachQuantity failed:", err);
  }
}

/**
 * Creates a Stripe Checkout Session for a coach to set up their billing plan.
 * Quantity is set to their current athlete count (minimum 1).
 * Returns the Checkout URL.
 */
export async function createCoachCheckoutSession(
  coachId: string,
  coachEmail: string,
): Promise<string> {
  const priceId = process.env.STRIPE_COACH_PRICE_ID ?? "";
  if (!priceId) throw new Error("STRIPE_COACH_PRICE_ID env var is not set");

  const rows = await dbSelect<CoachRow>("profiles", {
    id: `eq.${coachId}`,
    select: "id,stripe_customer_id,stripe_coach_sub_id",
  });
  const coach = rows[0];

  // Find or create Stripe customer
  let customerId = coach?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: coachEmail,
      metadata: { supabase_user_id: coachId },
    });
    customerId = customer.id;
    await dbPatch("profiles", { id: coachId }, { stripe_customer_id: customerId });
  }

  const athleteCount = await countAthletes(coachId);
  const quantity = Math.max(athleteCount, 1); // minimum 1 for checkout

  const base = appUrl();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity }],
    mode: "subscription",
    success_url: `${base}/coach?billing=success`,
    cancel_url: `${base}/coach?billing=cancelled`,
    subscription_data: {
      metadata: { supabase_user_id: coachId, type: "coach_plan" },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    locale: "auto",
  });

  return session.url ?? "";
}
