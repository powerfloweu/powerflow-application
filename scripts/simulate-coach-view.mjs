/**
 * Simulate what the coach dashboard receives + computes for a given coach.
 * Mirrors logic in app/api/coach/athletes/route.ts and app/coach/page.tsx.
 *
 * Usage: node scripts/simulate-coach-view.mjs <coach_id_prefix>
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
if (!idPrefix) { console.error("usage: node scripts/simulate-coach-view.mjs <coach_id_prefix>"); process.exit(1); }

async function rest(p) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${p}`, { headers });
  return r.json();
}

const profiles = await rest("profiles?select=id,role,display_name,coach_id");
const coach = profiles.find(p => p.id.startsWith(idPrefix) && p.role === "coach");
if (!coach) { console.error("no coach found with that id prefix"); process.exit(1); }

// Same as /api/coach/athletes
const athletes = profiles.filter(p => p.coach_id === coach.id && p.role === "athlete");
console.log(`\n═══ COACH VIEW: ${coach.display_name} (${coach.id.slice(0, 8)}) ═══`);
console.log(`Linked athletes: ${athletes.length}\n`);

if (!athletes.length) { console.log("(none)"); process.exit(0); }

// Compute Mon-Sun of current week (LOCAL TZ — matches lib/date.ts)
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const today = new Date();
const day = today.getDay();
const monDiff = day === 0 ? -6 : 1 - day;
const monday = new Date(today);
monday.setDate(today.getDate() + monDiff);
const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);

const weekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(monday); d.setDate(monday.getDate() + i); return ymd(d);
});

console.log(`Week: ${ymd(monday)} (Mon) → ${ymd(sunday)} (Sun)\n`);

for (const athlete of athletes) {
  const idList = `("${athlete.id}")`;

  const [entries, training] = await Promise.all([
    rest(`journal_entries?user_id=in.${idList}&order=created_at.desc&limit=200&select=id,content,sentiment,context,created_at`),
    rest(`training_entries?user_id=in.${idList}&entry_date=gte.${ymd(monday)}&entry_date=lte.${ymd(sunday)}&order=entry_date.asc&select=entry_date,is_training_day,mood_rating,thoughts_before,thoughts_after,what_went_well,frustrations,next_session`),
  ]);

  console.log(`\n━━━ ${athlete.display_name} ━━━`);

  // ── Sentiment metrics (computeClient) ──
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7); weekAgo.setHours(0,0,0,0);
  const weekEntries = entries.filter(e => new Date(e.created_at) >= weekAgo);
  const positiveRate = weekEntries.length
    ? Math.round((weekEntries.filter(e => e.sentiment === "positive").length / weekEntries.length) * 100)
    : 0;
  const flag = positiveRate < 30 ? "🔴 attention" : positiveRate < 55 ? "🟡 monitor" : "🟢 on-track";

  console.log(`  Header: ${weekEntries.length} entries this week · ${positiveRate}% positive · ${flag}`);

  // ── Training week summary (TrainingLogTab) ──
  const trainingDayCount = training.filter(e => e.is_training_day).length;
  const moodValues = training.map(e => e.mood_rating).filter(m => m !== null);
  const avgMood = moodValues.length ? (moodValues.reduce((s, v) => s + v, 0) / moodValues.length).toFixed(1) : "—";

  console.log(`\n  ── Training Log tab ──`);
  console.log(`  Week summary: ${trainingDayCount}/7 training days · avg mood ${avgMood}/10`);
  console.log(`  Mood sparkline (Mon-Sun):`);
  for (const d of weekDays) {
    const e = training.find(t => t.entry_date === d);
    const dayLabel = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" });
    if (!e) {
      console.log(`    ${dayLabel} ${d}  · (no entry)`);
    } else {
      const bar = "█".repeat(e.mood_rating ?? 0).padEnd(10, "·");
      const type = e.is_training_day ? "🏋️" : "💤";
      console.log(`    ${dayLabel} ${d}  ${type} mood ${e.mood_rating}/10 ${bar}`);
    }
  }

  // ── Daily log (just check one entry's contents render) ──
  console.log(`\n  ── Daily Log entries (sample) ──`);
  for (const e of training.slice(0, 2)) {
    const dayLabel = new Date(e.entry_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    console.log(`    ${dayLabel} (${e.is_training_day ? "Training" : "Rest"}, mood ${e.mood_rating}/10)`);
    if (e.thoughts_before)  console.log(`      Before:       "${e.thoughts_before.slice(0, 70)}…"`);
    if (e.thoughts_after)   console.log(`      After:        "${e.thoughts_after.slice(0, 70)}…"`);
    if (e.what_went_well)   console.log(`      Went well:    "${e.what_went_well.slice(0, 70)}…"`);
    if (e.frustrations)     console.log(`      Frustrations: "${e.frustrations.slice(0, 70)}…"`);
    if (e.next_session)     console.log(`      Next:         "${e.next_session.slice(0, 70)}…"`);
  }

  // ── Recent journal entries tab ──
  console.log(`\n  ── Recent Entries tab (latest 5) ──`);
  for (const e of entries.slice(0, 5)) {
    const d = new Date(e.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    const sentEmoji = e.sentiment === "positive" ? "🟢" : e.sentiment === "negative" ? "🔴" : "⚪";
    console.log(`    ${d}  ${sentEmoji} [${e.context}] "${e.content.slice(0, 60)}…"`);
  }
}
console.log();
