/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep plan_tier in sync.
 *
 * Events handled:
 *   checkout.session.completed        — new subscription created
 *   customer.subscription.updated     — plan change, renewal, status change
 *   customer.subscription.deleted     — cancellation / non-renewal
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   — from Stripe dashboard or `stripe listen`
 *   STRIPE_SECOND_PRICE_ID
 *   STRIPE_PR_PRICE_ID
 *
 * Stripe sends the raw body; we must NOT parse it before signature verification.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPrice } from "@/lib/stripe";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Stripe requires the raw request body for signature verification
export const dynamic = "force-dynamic";

// ─── helpers ────────────────────────────────────────────────────────────────

type ProfileRow = { id: string };

/** Returns the Supabase user_id for a Stripe customer ID. */
async function userForCustomer(customerId: string): Promise<string | null> {
  const rows = await dbSelect<ProfileRow>("profiles", {
    stripe_customer_id: `eq.${customerId}`,
    select: "id",
    limit: "1",
  });
  return rows[0]?.id ?? null;
}

/** Activates a paid tier for a user. */
async function activateTier(
  userId: string,
  subscriptionId: string,
  priceId: string,
): Promise<void> {
  const tier = tierForPrice(priceId);
  if (!tier) {
    console.error(`[webhook] Unknown price ID: ${priceId}`);
    return;
  }

  const isCourse = tier === "pr";
  const isTools = tier === "second" || tier === "pr";

  await dbPatch("profiles", { id: `eq.${userId}` }, {
    plan_tier: tier,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    // Sync the legacy boolean access flags
    ai_access: isCourse,
    course_access: isCourse,
    test_access: isTools,
  });

  console.log(`[webhook] ✅ User ${userId} → tier=${tier}`);
}

/** Downgrades user to free Opener tier. */
async function deactivate(userId: string, subscriptionId: string): Promise<void> {
  await dbPatch("profiles", { id: `eq.${userId}` }, {
    plan_tier: "opener",
    stripe_subscription_id: null,
    stripe_price_id: null,
    ai_access: false,
    course_access: false,
    test_access: false,
  });
  console.log(`[webhook] ⬇️  User ${userId} downgraded to opener (sub: ${subscriptionId})`);
}

// ─── main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] Invalid signature:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── New subscription via Checkout ──────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Retrieve full subscription to get price ID
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id ?? "";

        // Link customer → user if not already done
        const userId =
          (session.metadata?.supabase_user_id as string | undefined) ??
          (await userForCustomer(customerId));

        if (!userId) {
          console.error("[webhook] No user found for customer:", customerId);
          break;
        }

        // Persist customer ID in case checkout route didn't (race condition)
        await dbPatch("profiles", { id: `eq.${userId}` }, {
          stripe_customer_id: customerId,
        });

        await activateTier(userId, subscriptionId, priceId);
        break;
      }

      // ── Subscription updated (plan change, renewal, pause, etc.) ──────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = await userForCustomer(customerId);
        if (!userId) break;

        const priceId = sub.items.data[0]?.price.id ?? "";

        if (sub.status === "active" || sub.status === "trialing") {
          await activateTier(userId, sub.id, priceId);
        } else {
          // past_due, canceled, unpaid, etc.
          await deactivate(userId, sub.id);
        }
        break;
      }

      // ── Subscription cancelled / expired ──────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = await userForCustomer(customerId);
        if (!userId) break;
        await deactivate(userId, sub.id);
        break;
      }

      default:
        // Ignore all other event types
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
