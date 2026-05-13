/**
 * POST /api/stripe/coach-checkout
 *
 * Creates a Stripe Checkout Session for a coach to set up their billing plan
 * (€5/athlete/month). Returns { url }.
 *
 * If the coach already has an active coach subscription, returns a Billing
 * Portal URL instead so they can manage it.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { stripe, appUrl } from "@/lib/stripe";
import { createCoachCheckoutSession } from "@/lib/coachBilling";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  role: string;
  stripe_customer_id?: string | null;
  stripe_coach_sub_id?: string | null;
};

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
    select: "id,role,stripe_customer_id,stripe_coach_sub_id",
  });
  const profile = rows[0];

  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "Coach accounts only" }, { status: 403 });
  }

  // If already subscribed, send to billing portal
  if (profile.stripe_coach_sub_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_coach_sub_id);
      if (sub.status === "active" || sub.status === "trialing") {
        const session = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id as string,
          return_url: `${appUrl()}/coach`,
        });
        return NextResponse.json({ url: session.url, alreadySubscribed: true });
      }
    } catch {
      // subscription gone — fall through to new checkout
    }
  }

  const url = await createCoachCheckoutSession(user.id, user.email ?? "");
  return NextResponse.json({ url });
}
