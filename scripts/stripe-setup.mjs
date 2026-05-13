/**
 * stripe-setup.mjs
 *
 * Creates the PowerFlow subscription products and prices in Stripe,
 * then prints the env vars you need to add.
 *
 * Prerequisites:
 *   - Node 18+
 *   - STRIPE_SECRET_KEY env var set to a key with product + price write permissions
 *     (a FULL secret key starting with sk_live_... or sk_test_...)
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Error: STRIPE_SECRET_KEY env var is not set.");
  process.exit(1);
}
if (!key.startsWith("sk_") && !key.startsWith("rk_")) {
  console.error("Error: A Stripe secret or restricted key is required (sk_live_... or rk_live_...).");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });

async function run() {
  console.log("Creating PowerFlow subscription products and prices in Stripe…\n");

  // ── Second Tier ──────────────────────────────────────────────────────────
  const secondProduct = await stripe.products.create({
    name: "PowerFlow — Second Tier",
    description:
      "The full mental performance toolkit: audio library, scripts, voice sessions, psychological test reports.",
    metadata: { tier: "second" },
  });

  const secondPrice = await stripe.prices.create({
    product: secondProduct.id,
    unit_amount: 900, // €9.00
    currency: "eur",
    recurring: { interval: "month" },
    nickname: "Second Tier Monthly",
  });

  // ── PR Tier ──────────────────────────────────────────────────────────────
  const prProduct = await stripe.products.create({
    name: "PowerFlow — PR Tier",
    description:
      "Every tool, the 16-week mental performance course, AI coaching chat, and personalised plan.",
    metadata: { tier: "pr" },
  });

  const prPrice = await stripe.prices.create({
    product: prProduct.id,
    unit_amount: 1900, // €19.00
    currency: "eur",
    recurring: { interval: "month" },
    nickname: "PR Tier Monthly",
  });

  console.log("✅ Products and prices created successfully!\n");
  console.log("Add these env vars to your .env.local and Vercel dashboard:\n");
  console.log(`STRIPE_SECOND_PRICE_ID=${secondPrice.id}`);
  console.log(`STRIPE_PR_PRICE_ID=${prPrice.id}`);
  console.log(`\nSecond Tier product: https://dashboard.stripe.com/products/${secondProduct.id}`);
  console.log(`PR Tier product: https://dashboard.stripe.com/products/${prProduct.id}`);
  console.log(`\nNext steps:`);
  console.log(`1. Add the env vars above to .env.local and Vercel`);
  console.log(`2. Set up the webhook in the Stripe dashboard:`);
  console.log(`   - URL: https://app.power-flow.eu/api/stripe/webhook`);
  console.log(`   - Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted`);
  console.log(`   - Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET env var`);
  console.log(`3. Add NEXT_PUBLIC_APP_URL=https://app.power-flow.eu to Vercel`);
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
