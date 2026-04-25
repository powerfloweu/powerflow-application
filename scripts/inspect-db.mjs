/**
 * Read-only DB inspector — lists profiles, training_entries counts, links.
 * Run: node scripts/inspect-db.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Manually load .env.local since this is a plain Node script
const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const SUPABASE_URL = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

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

const profiles = await rest("profiles?select=id,role,display_name,coach_id,coach_code,onboarding_complete,created_at&order=created_at.asc");
console.log("\n── PROFILES ──");
console.table(profiles.map(p => ({
  id: p.id.slice(0, 8),
  role: p.role,
  name: p.display_name,
  coach_id: p.coach_id?.slice(0, 8) ?? "—",
  code: p.coach_code ?? "—",
  onboarded: p.onboarding_complete,
  joined: p.created_at?.slice(0, 10),
})));

console.log(`\nTotal: ${profiles.length} profiles (${profiles.filter(p => p.role === "coach").length} coaches, ${profiles.filter(p => p.role === "athlete").length} athletes)`);

const trainingEntries = await rest("training_entries?select=user_id,entry_date,is_training_day,mood_rating&order=entry_date.desc&limit=200");
console.log("\n── TRAINING ENTRIES (most recent 200) ──");
const byUser = {};
for (const e of trainingEntries) {
  byUser[e.user_id] ??= [];
  byUser[e.user_id].push(e);
}
for (const [uid, entries] of Object.entries(byUser)) {
  const prof = profiles.find(p => p.id === uid);
  const trainingDays = entries.filter(e => e.is_training_day).length;
  const restDays = entries.filter(e => !e.is_training_day).length;
  console.log(`  ${prof?.display_name ?? uid.slice(0, 8)}: ${entries.length} total (${trainingDays} training, ${restDays} rest), latest ${entries[0]?.entry_date}`);
}
if (!Object.keys(byUser).length) console.log("  (none)");

const journal = await rest("journal_entries?select=user_id,created_at&order=created_at.desc&limit=200");
console.log("\n── JOURNAL ENTRIES (count by user) ──");
const jByUser = {};
for (const e of journal) jByUser[e.user_id] = (jByUser[e.user_id] ?? 0) + 1;
for (const [uid, count] of Object.entries(jByUser)) {
  const prof = profiles.find(p => p.id === uid);
  console.log(`  ${prof?.display_name ?? uid.slice(0, 8)}: ${count}`);
}
if (!Object.keys(jByUser).length) console.log("  (none)");

console.log("\n── COACH→ATHLETE LINKS ──");
const coaches = profiles.filter(p => p.role === "coach");
for (const c of coaches) {
  const linked = profiles.filter(p => p.coach_id === c.id);
  console.log(`  ${c.display_name} (${c.coach_code}): ${linked.length} athletes ${linked.length ? "→ " + linked.map(a => a.display_name).join(", ") : ""}`);
}
