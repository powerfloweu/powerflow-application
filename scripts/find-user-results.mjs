#!/usr/bin/env node
// Usage: node scripts/find-user-results.mjs hendrik
// Searches all 4 result tables for a matching first_name or email (case-insensitive).

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch { /* ignore if missing */ }

const URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const term = (process.argv[2] ?? "").toLowerCase();

if (!URL || !KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
if (!term)        { console.error("Usage: node scripts/find-user-results.mjs <name-or-email>"); process.exit(1); }

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function query(table, select) {
  const res = await fetch(
    `${URL}/rest/v1/${table}?select=${select}&order=submitted_at.desc&limit=500`,
    { headers }
  );
  if (!res.ok) { console.error(`${table}: HTTP ${res.status}`); return []; }
  const rows = await res.json();
  return rows.filter(r =>
    (r.first_name ?? "").toLowerCase().includes(term) ||
    (r.email      ?? "").toLowerCase().includes(term)
  );
}

const [sat, acsi, csai, das] = await Promise.all([
  query("sat_results",  "id,first_name,email,submitted_at,paid,sum_yes,validity_reliable"),
  query("acsi_results", "id,first_name,email,submitted_at,paid,total_score,score_coping,score_peaking,score_goal_setting,score_concentration,score_freedom,score_confidence,score_coachability"),
  query("csai_results", "id,first_name,email,submitted_at,paid,score_cognitive,score_somatic,score_confidence"),
  query("das_results",  "id,first_name,email,submitted_at,paid,total_score,depression_prone"),
]);

function fmt(rows, label, extra) {
  if (!rows.length) { console.log(`\n${label}: no results`); return; }
  console.log(`\n${label}: ${rows.length} result(s)`);
  for (const r of rows) {
    console.log(`  ${r.first_name} <${r.email}>  submitted: ${r.submitted_at?.slice(0,10)}  paid: ${r.paid}`);
    console.log(`  ${extra(r)}`);
  }
}

fmt(sat,  "SAT",  r => `score: ${r.sum_yes}  valid: ${r.validity_reliable}`);
fmt(acsi, "ACSI", r => `total: ${r.total_score}  coping:${r.score_coping} peaking:${r.score_peaking} goals:${r.score_goal_setting} conc:${r.score_concentration} freedom:${r.score_freedom} conf:${r.score_confidence} coach:${r.score_coachability}`);
fmt(csai, "CSAI", r => `cognitive: ${r.score_cognitive}  somatic: ${r.score_somatic}  confidence: ${r.score_confidence}`);
fmt(das,  "DAS",  r => `total: ${r.total_score}  depression-prone: ${r.depression_prone}`);
