/**
 * POST /api/stripe/checkout
 * Body: { tier: "second" | "pr", period?: "monthly" | "6mo" | "yearly" }
 *
 * Creates a Stripe Checkout Session for the given tier + billing period.
 * Returns { url } — the browser should redirect immediately.
 *
 * - Looks up (or creates) a Stripe Customer for this Supabase user.
 * - If the user already has an active subscription, redirects to Billing Portal.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { stripe, priceIdFor, appUrl, type BillingPeriod } from "@/lib/stripe";
import type { PlanTier } from "@/lib/plan";

export const runtime = "nodejs";

type RequestBody = { tier?: string; period?: string };
type ProfileRow = {
  id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export async function POST(req: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as RequestBody;
  const tier = (body.tier ?? "") as PlanTier;
  if (tier !== "second" && tier !== "pr") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const period = (body.period ?? "monthly") as BillingPeriod;
  const priceId = priceIdFor(tier, period);
  if (!priceId) {
    return NextResponse.json(
      { error: `Price not configured for ${tier} / ${period}` },
      { status: 503 },
    );
  }

  // Load profile for existing Stripe IDs
  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "id,stripe_customer_id,stripe_subscription_id",
  });
  const profile = rows[0];

  // If already subscribed, send to billing portal instead
  if (profile?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      if (sub.status === "active" || sub.status === "trialing") {
        const session = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id as string,
          return_url: `${appUrl()}/upgrade`,
        });
        return NextResponse.json({ url: session.url, alreadySubscribed: true });
      }
    } catch {
      // subscription may have been deleted — fall through to new checkout
    }
  }

  // Find or create Stripe customer
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await dbPatch("profiles", { id: `eq.${user.id}` }, { stripe_customer_id: customerId });
  }

  const base = appUrl();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${base}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/upgrade?cancelled=1`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    locale: "auto",
  });

  return NextResponse.json({ url: session.url });
}
