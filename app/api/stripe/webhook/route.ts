/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events:
 *
 * Athlete tier subscriptions:
 *   checkout.session.completed        — new subscription
 *   customer.subscription.updated     — plan change / renewal / status change
 *   customer.subscription.deleted     — cancellation
 *
 * Coach plan subscriptions (€5/athlete/month):
 *   Same three events, routed by metadata.type === "coach_plan"
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPrice } from "@/lib/stripe";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── helpers ────────────────────────────────────────────────────────────────

type ProfileRow = { id: string };

async function userForCustomer(customerId: string): Promise<string | null> {
  const rows = await dbSelect<ProfileRow>("profiles", {
    stripe_customer_id: `eq.${customerId}`,
    select: "id",
    limit: "1",
  });
  return rows[0]?.id ?? null;
}

// ─── athlete tier handlers ───────────────────────────────────────────────────

async function activateTier(userId: string, subscriptionId: string, priceId: string) {
  const tier = tierForPrice(priceId);
  if (!tier) { console.error(`[webhook] Unknown price: ${priceId}`); return; }
  const isCourse = tier === "pr";
  const isTools  = tier === "second" || tier === "pr";
  await dbPatch("profiles", { id: userId }, {
    plan_tier: tier,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    ai_access: isCourse,
    course_access: isCourse,
    test_access: isTools,
  });
  console.log(`[webhook] ✅ Athlete ${userId} → tier=${tier}`);
}

async function deactivateTier(userId: string, subscriptionId: string) {
  await dbPatch("profiles", { id: userId }, {
    plan_tier: "opener",
    stripe_subscription_id: null,
    stripe_price_id: null,
    ai_access: false,
    course_access: false,
    test_access: false,
  });
  console.log(`[webhook] ⬇️  Athlete ${userId} downgraded (sub: ${subscriptionId})`);
}

// ─── coach plan handlers ─────────────────────────────────────────────────────

async function activateCoachSub(userId: string, subscriptionId: string) {
  await dbPatch("profiles", { id: userId }, {
    stripe_coach_sub_id: subscriptionId,
  });
  console.log(`[webhook] ✅ Coach ${userId} → coach plan active`);
}

async function deactivateCoachSub(userId: string) {
  await dbPatch("profiles", { id: userId }, {
    stripe_coach_sub_id: null,
  });
  console.log(`[webhook] ⬇️  Coach ${userId} → coach plan cancelled`);
}

// ─── main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature failed";
    console.error("[webhook] Invalid signature:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId    = session.customer as string;
        const subscriptionId = session.subscription as string;
        const isCoachPlan   = session.metadata?.type === "coach_plan";

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const userId =
          (session.metadata?.supabase_user_id as string | undefined) ??
          (await userForCustomer(customerId));
        if (!userId) { console.error("[webhook] No user for customer:", customerId); break; }

        // Persist customer ID in case checkout route hit a race condition
        await dbPatch("profiles", { id: userId }, { stripe_customer_id: customerId });

        if (isCoachPlan) {
          await activateCoachSub(userId, subscriptionId);
        } else {
          await activateTier(userId, subscriptionId, sub.items.data[0]?.price.id ?? "");
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId     = await userForCustomer(customerId);
        if (!userId) break;

        const isCoachPlan = sub.metadata?.type === "coach_plan";
        const isActive    = sub.status === "active" || sub.status === "trialing";

        if (isCoachPlan) {
          if (isActive) await activateCoachSub(userId, sub.id);
          else          await deactivateCoachSub(userId);
        } else {
          if (isActive) await activateTier(userId, sub.id, sub.items.data[0]?.price.id ?? "");
          else          await deactivateTier(userId, sub.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId     = await userForCustomer(customerId);
        if (!userId) break;

        const isCoachPlan = sub.metadata?.type === "coach_plan";
        if (isCoachPlan) await deactivateCoachSub(userId);
        else             await deactivateTier(userId, sub.id);
        break;
      }

      default: break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
