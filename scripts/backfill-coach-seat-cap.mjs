/**
 * Backfill: move any coach with FLAT_RATE_THRESHOLD+ athletes onto the flat
 * €99/month Stripe price (quantity 1), matching the fix in lib/coachBilling.ts.
 * Coaches under the threshold are left on the per-athlete price.
 *
 * Dry-run by default — prints which coaches would change, writes nothing.
 * Pass --apply to actually update Stripe.
 *
 * The flat price itself may not exist in Stripe yet. Pass --create-price to
 * create it (also dry-run unless combined with --apply) and print the
 * STRIPE_PRICE_COACH_FLAT_99 env var to set.
 *
 * Usage:
 *   node scripts/backfill-coach-seat-cap.mjs                        # dry run
 *   node scripts/backfill-coach-seat-cap.mjs --create-price          # preview price creation
 *   node scripts/backfill-coach-seat-cap.mjs --create-price --apply  # create price + backfill, live
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Stripe from "stripe";

// Keep in sync with FLAT_RATE_THRESHOLD in lib/coachBilling.ts — not imported
// here because this is a plain Node script, not a Next.js module.
const FLAT_RATE_THRESHOLD = 20;
const FLAT_RATE_EUR_CENTS = 9900; // €99/month
const APPLY = process.argv.includes("--apply");
const CREATE_PRICE = process.argv.includes("--create-price");

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const SUPABASE_URL = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = env.STRIPE_SECRET_KEY;
let FLAT_PRICE_ID = env.STRIPE_PRICE_COACH_FLAT_99;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Error: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.local");
  process.exit(1);
}
if (!STRIPE_KEY) {
  console.error("Error: STRIPE_SECRET_KEY missing from .env.local");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2026-03-25.dahlia" });

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) {
    console.error(`Failed ${res.status} on ${path}:`, await res.text());
    return null;
  }
  return res.json();
}

async function maybeCreateFlatPrice() {
  if (FLAT_PRICE_ID) {
    console.log(`Flat price already configured: ${FLAT_PRICE_ID}\n`);
    return;
  }
  if (!CREATE_PRICE) {
    console.error(
      "Error: STRIPE_PRICE_COACH_FLAT_99 is not set and --create-price was not passed. " +
        "Either set the env var or re-run with --create-price.",
    );
    process.exit(1);
  }

  console.log(
    `${APPLY ? "Creating" : "Would create"} a €${FLAT_RATE_EUR_CENTS / 100}/month flat-rate coach price in Stripe…`,
  );
  if (!APPLY) {
    console.log("(dry run — pass --apply to actually create it)\n");
    FLAT_PRICE_ID = "price_PREVIEW_NOT_CREATED";
    return;
  }

  const product = await stripe.products.create({
    name: "PowerFlow — Coach Plan (flat rate, 20+ athletes)",
    metadata: { type: "coach_plan_flat" },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: FLAT_RATE_EUR_CENTS,
    currency: "eur",
    recurring: { interval: "month" },
  });
  FLAT_PRICE_ID = price.id;
  console.log(`Created price ${FLAT_PRICE_ID}. Set STRIPE_PRICE_COACH_FLAT_99=${FLAT_PRICE_ID}\n`);
}

async function run() {
  console.log(APPLY ? "Running LIVE — will update Stripe.\n" : "Dry run — no writes. Pass --apply to update Stripe.\n");

  await maybeCreateFlatPrice();

  const coaches = await rest(
    "profiles?select=id,stripe_coach_sub_id&role=eq.coach&stripe_coach_sub_id=not.is.null",
  );
  if (!coaches) process.exit(1);

  let changed = 0;
  for (const coach of coaches) {
    const athletes = await rest(
      `profiles?select=id&role=eq.athlete&coach_id=eq.${coach.id}&limit=10000`,
    );
    const count = athletes?.length ?? 0;
    if (count < FLAT_RATE_THRESHOLD) continue;

    const sub = await stripe.subscriptions.retrieve(coach.stripe_coach_sub_id);
    const item = sub.items.data[0];
    if (!item) continue;
    if (item.price.id === FLAT_PRICE_ID && item.quantity === 1) continue;

    changed++;
    console.log(
      `coach ${coach.id}: ${count} athletes, price ${item.price.id} × ${item.quantity} → ${FLAT_PRICE_ID} × 1`,
    );

    if (APPLY) {
      await stripe.subscriptions.update(coach.stripe_coach_sub_id, {
        items: [{ id: item.id, price: FLAT_PRICE_ID, quantity: 1 }],
        proration_behavior: "always_invoice",
      });
    }
  }

  console.log(`\n${changed} coach(es) ${APPLY ? "moved to the flat price" : "would move to the flat price"}.`);
}

run();
