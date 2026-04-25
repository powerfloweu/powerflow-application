/**
 * Seed a week of journal entries for an athlete.
 * Each entry has: content, sentiment, context.
 * Idempotent-ish: not strictly upsert, but we delete prior entries dated in the
 * past 7 days for this user before inserting (to keep totals predictable on rerun).
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
if (!idPrefix) { console.error("usage: node scripts/seed-journal-week.mjs <athlete_id_prefix>"); process.exit(1); }

const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,display_name`, { headers });
const profiles = await profilesRes.json();
const athlete = profiles.find(p => p.id.startsWith(idPrefix));
if (!athlete) { console.error("not found"); process.exit(1); }
console.log(`Seeding journal for: ${athlete.display_name} (${athlete.id})`);

// Wipe existing entries from the past 8 days to keep this idempotent
const eightDaysAgo = new Date();
eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
const cutoff = eightDaysAgo.toISOString();
const delRes = await fetch(
  `${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${athlete.id}&created_at=gte.${encodeURIComponent(cutoff)}`,
  { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" } }
);
if (!delRes.ok) console.warn("delete warn:", delRes.status, await delRes.text());

const ENTRIES = [
  // 6 days ago — neutral/negative pre-training
  { daysAgo: 6, content: "Felt sluggish coming into squat day. Self-doubt creeping in about my numbers.", sentiment: "negative", context: "pre-training", themes: ["confidence"] },
  // 5 days ago — positive post-session
  { daysAgo: 5, content: "Bench felt smooth today. The cue to drive my feet through the floor finally clicked.", sentiment: "positive", context: "post-competition", themes: ["technique"] },
  // 4 days ago — rest day reflection
  { daysAgo: 4, content: "Took a walk and journaled. Realising I'm comparing myself too much to others on Instagram.", sentiment: "neutral", context: "rest-day", themes: ["comparison", "social-media"] },
  // 3 days ago — frustration
  { daysAgo: 3, content: "Deadlift session was rough. Lockout broke down on the top single. I keep failing in the same place.", sentiment: "negative", context: "post-competition", themes: ["frustration", "technique"] },
  // 2 days ago — recovery
  { daysAgo: 2, content: "Squat volume day. Stayed mentally present even though I was still annoyed about deadlifts.", sentiment: "neutral", context: "post-competition", themes: ["focus", "frustration"] },
  // 1 day ago — anxiety about meet
  { daysAgo: 1, content: "Meet is in 6 weeks and I keep imagining bombing out. Need to talk to my coach about this.", sentiment: "negative", context: "general", themes: ["anxiety", "competition"] },
  // today — bench breakthrough
  { daysAgo: 0, content: "Hit a 3-month bench PR today. Big confidence boost. I CAN do this.", sentiment: "positive", context: "post-competition", themes: ["confidence", "breakthrough"] },
];

const now = Date.now();
const rows = ENTRIES.map(e => {
  const ts = new Date(now - e.daysAgo * 86400000);
  return {
    user_id: athlete.id,
    content: e.content,
    sentiment: e.sentiment,
    context: e.context,
    themes: e.themes,
    created_at: ts.toISOString(),
  };
});

const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify(rows),
});
if (!insertRes.ok) { console.error("insert failed", insertRes.status, await insertRes.text()); process.exit(1); }
const inserted = await insertRes.json();
console.log(`\n✓ Inserted ${inserted.length} journal entries:`);
for (const e of inserted.sort((a, b) => a.created_at.localeCompare(b.created_at))) {
  const d = new Date(e.created_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  console.log(`  ${d}  ${e.sentiment.padEnd(8)}  ${e.context.padEnd(18)}  "${e.content.slice(0, 60)}…"`);
}
