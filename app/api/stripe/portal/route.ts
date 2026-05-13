/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session so users can manage or cancel
 * their subscription, update payment methods, etc.
 * Returns { url } which the browser should redirect to.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { stripe, appUrl } from "@/lib/stripe";

export const runtime = "nodejs";

type ProfileRow = { stripe_customer_id?: string | null };

export async function POST() {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${user.id}`,
    select: "stripe_customer_id",
  });
  const customerId = rows[0]?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer found — no active subscription" },
      { status: 404 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/upgrade`,
  });

  return NextResponse.json({ url: session.url });
}
