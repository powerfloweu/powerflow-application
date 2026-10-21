/**
 * Backfill: cap any coach's live Stripe subscription quantity at
 * MAX_BILLABLE_ATHLETES (20 seats = €99/month), matching the fix in
 * lib/coachBilling.ts.
 *
 * Dry-run by default — prints which coaches would change, writes nothing.
 * Pass --apply to actually update Stripe.
 *
 * Usage:
 *   node scripts/backfill-coach-seat-cap.mjs            # dry run
 *   node scripts/backfill-coach-seat-cap.mjs --apply     # live update
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Stripe from "stripe";

const MAX_BILLABLE_ATHLETES = 20;
const APPLY = process.argv.includes("--apply");

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

async function run() {
  console.log(APPLY ? "Running LIVE — will update Stripe.\n" : "Dry run — no writes. Pass --apply to update Stripe.\n");

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
    if (count <= MAX_BILLABLE_ATHLETES) continue;

    const sub = await stripe.subscriptions.retrieve(coach.stripe_coach_sub_id);
    const item = sub.items.data[0];
    if (!item) continue;
    if (item.quantity === MAX_BILLABLE_ATHLETES) continue;

    changed++;
    console.log(
      `coach ${coach.id}: ${count} athletes, Stripe quantity ${item.quantity} → ${MAX_BILLABLE_ATHLETES}`,
    );

    if (APPLY) {
      await stripe.subscriptions.update(coach.stripe_coach_sub_id, {
        items: [{ id: item.id, quantity: MAX_BILLABLE_ATHLETES }],
        proration_behavior: "always_invoice",
      });
    }
  }

  console.log(`\n${changed} coach(es) ${APPLY ? "corrected" : "would be corrected"}.`);
}

run();
