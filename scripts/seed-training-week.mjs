/**
 * Seed a week of mock training_entries for a target athlete.
 * Idempotent — uses ON CONFLICT(user_id, entry_date) DO UPDATE.
 *
 * Usage: node scripts/seed-training-week.mjs <athlete_id_prefix>
 *   e.g. node scripts/seed-training-week.mjs b1ec99ad
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

const idPrefix = process.argv[2];
if (!idPrefix) {
  console.error("usage: node scripts/seed-training-week.mjs <athlete_id_prefix>");
  process.exit(1);
}

// Resolve full athlete id
const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,role`, { headers });
const profiles = await profilesRes.json();
const athlete = profiles.find(p => p.id.startsWith(idPrefix));
if (!athlete) { console.error("No profile found with id starting", idPrefix); process.exit(1); }
console.log(`Seeding for: ${athlete.display_name} (${athlete.id})`);

// Generate 7 days back from today (today = 2026-04-25 per user's MEMORY.md).
// Use the actual current date from system clock so it always lands on "this week".
function ymd(d) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
today.setHours(12, 0, 0, 0);

const week = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(today.getDate() - i);
  week.push(ymd(d));
}

// Mix: 5 training days + 2 rest, varied mood, realistic answers
const PLAN = [
  // 6 days ago
  { is_training_day: true, mood_rating: 6,
    thoughts_before: "Felt sluggish coming in. Squat day, working up to 175kg singles.",
    thoughts_after: "Numbers moved better than they felt. Bar speed was actually decent on the singles.",
    what_went_well: "Brace stayed tight even on the heaviest top set.",
    frustrations: "Warm-ups felt like garbage and shook my confidence early.",
    next_session: "Bench day tomorrow — stay aggressive on the leg drive." },
  // 5 days ago
  { is_training_day: true, mood_rating: 7,
    thoughts_before: "Bench day. Felt more locked in than yesterday.",
    thoughts_after: "Hit 110kg for a double, cleanest reps in weeks.",
    what_went_well: "Stayed patient off the chest, no rushing.",
    frustrations: null,
    next_session: "Rest tomorrow, then deadlifts. Don't skip the warm-up sets." },
  // 4 days ago
  { is_training_day: false, mood_rating: 8,
    thoughts_before: null, thoughts_after: null, what_went_well: null,
    frustrations: null,
    next_session: "Mobility + walk. Mentally reset for deadlift day." },
  // 3 days ago
  { is_training_day: true, mood_rating: 5,
    thoughts_before: "Nervous about pulling heavy after the rest day. Lower back tight.",
    thoughts_after: "Pulled 195kg, technique broke down at lockout. Frustrated.",
    what_went_well: "Setup and first pull were strong even on the top single.",
    frustrations: "Lockout was rounded, not happy with how the bar drifted forward.",
    next_session: "Need to drill hip lockout pattern with paused reps." },
  // 2 days ago
  { is_training_day: true, mood_rating: 6,
    thoughts_before: "Squat volume day. Trying to forget yesterday and focus.",
    thoughts_after: "Volume work felt okay. Bar speed dropped on the last set, expected.",
    what_went_well: "Stayed mentally present despite carrying yesterday's frustration.",
    frustrations: "Still ruminating on the deadlift session.",
    next_session: "Bench accessory tomorrow. Focus on triceps and upper back." },
  // 1 day ago (yesterday)
  { is_training_day: false, mood_rating: 7,
    thoughts_before: null, thoughts_after: null, what_went_well: null,
    frustrations: null,
    next_session: "Sleep early, get to gym fresh for tomorrow's bench heavy." },
  // today
  { is_training_day: true, mood_rating: 8,
    thoughts_before: "Feeling good. Bench heavy single day. Trust the process.",
    thoughts_after: "Hit 115kg, biggest in 3 months. Bar speed was great.",
    what_went_well: "Cue 'tight back, drive feet through floor' worked perfectly.",
    frustrations: null,
    next_session: "Rest day. Light walk and eat well." },
];

const rows = week.map((entry_date, i) => ({
  user_id: athlete.id,
  entry_date,
  ...PLAN[i],
}));

// Upsert via PostgREST: Prefer: resolution=merge-duplicates, on_conflict=user_id,entry_date
const insertRes = await fetch(
  `${SUPABASE_URL}/rest/v1/training_entries?on_conflict=user_id,entry_date`,
  {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  }
);

if (!insertRes.ok) {
  console.error("Insert failed:", insertRes.status, await insertRes.text());
  process.exit(1);
}

const inserted = await insertRes.json();
console.log(`\n✓ Seeded ${inserted.length} training_entries:\n`);
for (const e of inserted.sort((a, b) => a.entry_date.localeCompare(b.entry_date))) {
  const day = new Date(e.entry_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" });
  console.log(`  ${e.entry_date} (${day})  ${e.is_training_day ? "🏋️ training" : "💤 rest    "}  mood ${e.mood_rating}/10`);
}
