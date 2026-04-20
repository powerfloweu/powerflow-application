"use client";

import React from "react";
import { score as scoreAnswers } from "../../lib/tests/self-awareness/scoring";
import type {
  Answers,
  ScoreReport,
  FactorResult,
  SubfactorResult,
  Validity,
} from "../../lib/tests/self-awareness/scoring";
import { FACTOR_NORMS, SUBFACTOR_NORMS, classify } from "../../lib/tests/self-awareness/norms";
import type { SubfactorName } from "../../lib/tests/self-awareness/norms";
import type { FactorName } from "../../lib/tests/self-awareness/items";
import type {
  AcsiReport,
  AcsiSubscaleResult,
  AcsiSubscaleKey,
  Band as AcsiBand,
} from "../../lib/tests/acsi/scoring";
import type {
  CsaiReport,
  CsaiSubscaleResult,
  CsaiSubscaleKey,
  Band as CsaiBand,
} from "../../lib/tests/csai/scoring";

// ── Types ─────────────────────────────────────────────────────────────────────

type Result = {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  score_performance: number;
  score_affiliation: number;
  score_aggression: number;
  score_defensiveness: number;
  score_consciousness: number;
  score_dominance: number;
  score_exhibition: number;
  score_autonomy: number;
  score_caregiving: number;
  score_order: number;
  score_helplessness: number;
  sf_self_confirmation: number;
  sf_rational_dominance: number;
  sf_aggressive_nonconformity: number;
  sf_passive_dependence: number;
  sf_sociability: number;
  sf_agreeableness: number;
  sum_yes: number;
  validity_reliable: boolean;
};

type AcsiResult = {
  id: string;
  created_at: string;
  result_ref?: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  score_coping: number;
  score_peaking: number;
  score_goal_setting: number;
  score_concentration: number;
  score_freedom: number;
  score_confidence: number;
  score_coachability: number;
  total_score: number;
};

type CsaiResult = {
  id: string;
  created_at: string;
  result_ref?: string;
  first_name: string;
  email: string;
  gender: string;
  lang: string;
  submitted_at: string;
  paid: boolean;
  score_cognitive: number;
  score_somatic: number;
  score_confidence: number;
};

type AthleteProfile = {
  email: string;
  name: string;
  sat: Result[];
  acsi: AcsiResult[];
  csai: CsaiResult[];
};

type GenderFilter = "all" | "male" | "female";

type ImportFile = {
  id: string;
  filename: string;
  name: string;
  email: string;
  gender: "male" | "female" | null;
  answers: Record<number, 0 | 1>;
  answeredCount: number;
  status: "pending" | "scored" | "saving" | "saved" | "error";
  report?: ScoreReport;
  resultAsRow?: Result;
  errorMsg?: string;
};

// ── ACSI / CSAI band helpers ──────────────────────────────────────────────────

function classifyAcsi(score: number): AcsiBand {
  if (score <= 8) return "low";
  if (score <= 12) return "average";
  return "high";
}

const CSAI_CUTOFFS: Record<CsaiSubscaleKey, { low: number; avg: number }> = {
  cognitive:  { low: 15, avg: 22 },
  somatic:    { low: 13, avg: 20 },
  confidence: { low: 21, avg: 29 },
};

function classifyCsai(key: CsaiSubscaleKey, score: number): CsaiBand {
  const { low, avg } = CSAI_CUTOFFS[key];
  if (score <= low) return "low";
  if (score <= avg) return "average";
  return "high";
}

// ── Norms (hardcoded inline — intentionally not imported from norms.ts) ───────

type FactorKey =
  | "performance"
  | "affiliation"
  | "aggression"
  | "defensiveness"
  | "consciousness"
  | "dominance"
  | "exhibition"
  | "autonomy"
  | "caregiving"
  | "order"
  | "helplessness";

const FACTOR_KEYS: FactorKey[] = [
  "performance",
  "affiliation",
  "aggression",
  "defensiveness",
  "consciousness",
  "dominance",
  "exhibition",
  "autonomy",
  "caregiving",
  "order",
  "helplessness",
];

const CURRENT_NORMS: Record<"male" | "female", Record<FactorKey, { min: number; max: number }>> = {
  male: {
    performance: { min: 6, max: 12 },
    affiliation: { min: 6, max: 12 },
    aggression: { min: 4, max: 10 },
    defensiveness: { min: 5, max: 10 },
    consciousness: { min: 5, max: 10 },
    dominance: { min: 5, max: 11 },
    exhibition: { min: 4, max: 9 },
    autonomy: { min: 5, max: 10 },
    caregiving: { min: 7, max: 13 },
    order: { min: 8, max: 13 },
    helplessness: { min: 4, max: 10 },
  },
  female: {
    performance: { min: 5, max: 10 },
    affiliation: { min: 8, max: 13 },
    aggression: { min: 3, max: 7 },
    defensiveness: { min: 5, max: 10 },
    consciousness: { min: 5, max: 10 },
    dominance: { min: 4, max: 9 },
    exhibition: { min: 5, max: 10 },
    autonomy: { min: 5, max: 10 },
    caregiving: { min: 9, max: 14 },
    order: { min: 8, max: 12 },
    helplessness: { min: 5, max: 12 },
  },
};

// ── Utility ───────────────────────────────────────────────────────────────────

function getFactorScore(r: Result, key: FactorKey): number {
  return r[`score_${key}` as keyof Result] as number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return +(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)).toFixed(2);
}

function computeBandStats(
  rows: Result[],
  gender: "male" | "female",
): Array<{
  factor: FactorKey;
  n: number;
  mean: number;
  p25: number;
  p50: number;
  p75: number;
  normMin: number;
  normMax: number;
  p25Diff: boolean;
  p75Diff: boolean;
}> {
  const valid = rows.filter((r) => r.gender === gender && r.validity_reliable);
  return FACTOR_KEYS.map((key) => {
    const scores = valid.map((r) => getFactorScore(r, key)).sort((a, b) => a - b);
    const n = scores.length;
    const mean = n > 0 ? +(scores.reduce((s, v) => s + v, 0) / n).toFixed(2) : 0;
    const p25 = percentile(scores, 25);
    const p50 = percentile(scores, 50);
    const p75 = percentile(scores, 75);
    const norm = CURRENT_NORMS[gender][key];
    return {
      factor: key,
      n,
      mean,
      p25,
      p50,
      p75,
      normMin: norm.min,
      normMax: norm.max,
      p25Diff: Math.abs(p25 - norm.min) > 1,
      p75Diff: Math.abs(p75 - norm.max) > 1,
    };
  });
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

const parseFile = async (
  file: File,
): Promise<{ answers: Record<number, 0 | 1>; parsedCount: number }> => {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const answers: Record<number, 0 | 1> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const itemMatch = String(row[0] ?? "").match(/^(\d+)/);
    if (!itemMatch) continue;
    const num = parseInt(itemMatch[1]);
    if (num < 1 || num > 165) continue;
    const colB = String(row[1] ?? "").trim().toLowerCase();
    let ans: 0 | 1 | null = null;
    if (colB === "1" || ["yes", "igen", "ja", "y"].includes(colB)) ans = 1;
    else if (colB === "0" || ["no", "nem", "nein", "n"].includes(colB)) ans = 0;
    if (ans !== null) answers[num] = ans;
  }
  const parsedCount = Object.keys(answers).length;
  for (let i = 1; i <= 165; i++) {
    if (!(i in answers)) answers[i] = 0;
  }
  return { answers, parsedCount };
};

function nameFromFilename(filename: string): string {
  let n = filename.replace(/\.(xlsx?|csv)$/i, "");
  n = n.replace(/^(ö?it|öit|oit|sat)[-_]/i, "");
  n = n.replace(/[-_]/g, " ");
  return n.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

// ── Build report helpers ──────────────────────────────────────────────────────

const FACTOR_NAME_MAP: Record<FactorKey, FactorName> = {
  performance: "Performance",
  affiliation: "Affiliation",
  aggression: "Aggression",
  defensiveness: "Defensiveness",
  consciousness: "Consciousness",
  dominance: "Dominance",
  exhibition: "Exhibition",
  autonomy: "Autonomy",
  caregiving: "Caregiving",
  order: "Order",
  helplessness: "Helplessness",
};

function buildReportFromResult(result: Result): ScoreReport {
  const gender = result.gender as "male" | "female";
  const norms = FACTOR_NORMS[gender];

  const factors: FactorResult[] = FACTOR_KEYS.map((key) => {
    const name = FACTOR_NAME_MAP[key];
    const rawScore = getFactorScore(result, key);
    const n = norms[name];
    return {
      factor: name,
      rawScore,
      max: 15,
      band: classify(rawScore, n.min, n.max),
      bandMin: n.min,
      bandMax: n.max,
      populationAverage: n.average,
    };
  });

  const subfactorData: Array<{ subfactor: SubfactorName; score: number }> = [
    { subfactor: "Self-confirmation", score: result.sf_self_confirmation },
    { subfactor: "Rational dominance", score: result.sf_rational_dominance },
    { subfactor: "Aggressive nonconformity", score: result.sf_aggressive_nonconformity },
    { subfactor: "Passive dependence", score: result.sf_passive_dependence },
    { subfactor: "Sociability", score: result.sf_sociability },
    { subfactor: "Agreeableness", score: result.sf_agreeableness },
  ];

  const subfactors: SubfactorResult[] = subfactorData.map(({ subfactor, score }) => {
    const n = SUBFACTOR_NORMS[subfactor];
    return {
      subfactor,
      score,
      band: classify(score, n.min, n.max),
      bandMin: n.min,
      bandMax: n.max,
    };
  });

  const validityNorm = SUBFACTOR_NORMS["Agreeableness"];
  const validity: Validity = {
    sumYes: result.sum_yes,
    band: classify(result.sum_yes, validityNorm.min, validityNorm.max),
    bandMin: validityNorm.min,
    bandMax: validityNorm.max,
    reliable: result.validity_reliable,
  };

  return { gender, factors, subfactors, validity };
}

function buildAcsiReport(result: AcsiResult): AcsiReport {
  const subscales: AcsiSubscaleResult[] = [
    { key: "coping",        score: result.score_coping,        band: classifyAcsi(result.score_coping),        min: 4, max: 16 },
    { key: "peaking",       score: result.score_peaking,       band: classifyAcsi(result.score_peaking),       min: 4, max: 16 },
    { key: "goalSetting",   score: result.score_goal_setting,  band: classifyAcsi(result.score_goal_setting),  min: 4, max: 16 },
    { key: "concentration", score: result.score_concentration, band: classifyAcsi(result.score_concentration), min: 4, max: 16 },
    { key: "freedom",       score: result.score_freedom,       band: classifyAcsi(result.score_freedom),       min: 4, max: 16 },
    { key: "confidence",    score: result.score_confidence,    band: classifyAcsi(result.score_confidence),    min: 4, max: 16 },
    { key: "coachability",  score: result.score_coachability,  band: classifyAcsi(result.score_coachability),  min: 4, max: 16 },
  ];
  return { subscales, totalScore: result.total_score };
}

function buildCsaiReport(result: CsaiResult): CsaiReport {
  const subscales: CsaiSubscaleResult[] = [
    { key: "cognitive",  score: result.score_cognitive,  band: classifyCsai("cognitive",  result.score_cognitive),  min: 9, max: 36 },
    { key: "somatic",    score: result.score_somatic,    band: classifyCsai("somatic",    result.score_somatic),    min: 9, max: 36 },
    { key: "confidence", score: result.score_confidence, band: classifyCsai("confidence", result.score_confidence), min: 9, max: 36 },
  ];
  return { subscales };
}

function buildResultFromReport(file: ImportFile, report: ScoreReport): Result {
  const f = (name: string) =>
    report.factors.find((x) => x.factor === name)?.rawScore ?? 0;
  const sf = (name: string) =>
    report.subfactors.find((x) => x.subfactor === name)?.score ?? 0;

  return {
    id: file.id,
    created_at: new Date().toISOString(),
    first_name: file.name,
    email: file.email,
    gender: file.gender!,
    lang: "en",
    submitted_at: new Date().toISOString(),
    paid: false,
    score_performance: f("Performance"),
    score_affiliation: f("Affiliation"),
    score_aggression: f("Aggression"),
    score_defensiveness: f("Defensiveness"),
    score_consciousness: f("Consciousness"),
    score_dominance: f("Dominance"),
    score_exhibition: f("Exhibition"),
    score_autonomy: f("Autonomy"),
    score_caregiving: f("Caregiving"),
    score_order: f("Order"),
    score_helplessness: f("Helplessness"),
    sf_self_confirmation: sf("Self-confirmation"),
    sf_rational_dominance: sf("Rational dominance"),
    sf_aggressive_nonconformity: sf("Aggressive nonconformity"),
    sf_passive_dependence: sf("Passive dependence"),
    sf_sociability: sf("Sociability"),
    sf_agreeableness: sf("Agreeableness"),
    sum_yes: report.validity.sumYes,
    validity_reliable: report.validity.reliable,
  };
}

function groupByAthlete(
  sat: Result[],
  acsi: AcsiResult[],
  csai: CsaiResult[],
): AthleteProfile[] {
  const map = new Map<string, AthleteProfile>();
  const getOrCreate = (email: string, name: string) => {
    const key = email.toLowerCase();
    if (!map.has(key)) map.set(key, { email: key, name, sat: [], acsi: [], csai: [] });
    return map.get(key)!;
  };
  for (const r of sat)  getOrCreate(r.email, r.first_name).sat.push(r);
  for (const r of acsi) getOrCreate(r.email, r.first_name).acsi.push(r);
  for (const r of csai) getOrCreate(r.email, r.first_name).csai.push(r);
  const ts = (r: { submitted_at: string }) => new Date(r.submitted_at).getTime();
  return Array.from(map.values()).sort((a, b) => {
    const aMax = Math.max(...[...a.sat, ...a.acsi, ...a.csai].map(ts), 0);
    const bMax = Math.max(...[...b.sat, ...b.acsi, ...b.csai].map(ts), 0);
    return bMax - aMax;
  });
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SparkBar({ scores }: { scores: number[] }) {
  const max = 15;
  return (
    <div className="flex items-end gap-[2px] h-6">
      {scores.map((s, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-purple-500/70"
          style={{ height: `${Math.max(4, Math.round((s / max) * 24))}px` }}
          title={String(s)}
        />
      ))}
    </div>
  );
}

function AcsiSparkBar({ result }: { result: AcsiResult }) {
  const scores = [
    result.score_coping,
    result.score_peaking,
    result.score_goal_setting,
    result.score_concentration,
    result.score_freedom,
    result.score_confidence,
    result.score_coachability,
  ];
  return (
    <div className="flex items-end gap-[2px] h-6">
      {scores.map((s, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-purple-500/70"
          style={{ height: `${Math.max(4, Math.round((s / 16) * 24))}px` }}
          title={String(s)}
        />
      ))}
    </div>
  );
}

function MiniProgressBar({ value, max = 15 }: { value: number; max?: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-purple-500"
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  );
}

function BandChip({
  band,
  inverse = false,
}: {
  band: "low" | "average" | "high";
  inverse?: boolean;
}) {
  const effective = inverse
    ? band === "low"
      ? "high"
      : band === "high"
      ? "low"
      : "average"
    : band;
  const cls =
    effective === "high"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : effective === "low"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-saira text-[9px] uppercase tracking-[0.12em] ${cls}`}
    >
      {band}
    </span>
  );
}

function BandAnalysisPanel({ results }: { results: Result[] }) {
  const [genderFilter, setGenderFilter] = React.useState<"male" | "female">("male");
  return (
    <div className="mt-8 rounded-2xl border border-white/5 bg-[#13151A] p-6 space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-saira text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
            Band Analysis — SAT
          </h2>
          <p className="font-saira text-[11px] text-zinc-500 mt-1">
            P25 → Low/Avg boundary · P75 → Avg/High boundary · Amber = differs from norm by &gt;1 pt
          </p>
        </div>
        <div className="flex gap-2">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderFilter(g)}
              className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.14em] transition ${
                genderFilter === g
                  ? "border-purple-400 bg-purple-500/20 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-purple-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {(["male", "female"] as const)
        .filter((g) => g === genderFilter)
        .map((gender) => {
          const stats = computeBandStats(results, gender);
          const validN = results.filter(
            (r) => r.gender === gender && r.validity_reliable,
          ).length;
          return (
            <div key={gender}>
              <p className="font-saira text-[11px] text-zinc-500 mb-4">
                Based on {validN} valid responses
              </p>
              <div className="overflow-x-auto">
                <table className="w-full font-saira text-xs">
                  <thead>
                    <tr className="text-zinc-500 uppercase tracking-[0.15em]">
                      <th className="text-left py-2 pr-4 font-semibold">Factor</th>
                      <th className="text-right py-2 px-2 font-semibold">n</th>
                      <th className="text-right py-2 px-2 font-semibold">Mean</th>
                      <th className="text-right py-2 px-2 font-semibold">P25</th>
                      <th className="text-right py-2 px-2 font-semibold">Median</th>
                      <th className="text-right py-2 px-2 font-semibold">P75</th>
                      <th className="text-right py-2 px-2 font-semibold">Norm min–max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => (
                      <tr
                        key={s.factor}
                        className="border-t border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="py-2 pr-4 text-zinc-200 capitalize">{s.factor}</td>
                        <td className="py-2 px-2 text-right text-zinc-400">{s.n}</td>
                        <td className="py-2 px-2 text-right text-zinc-300">{s.mean}</td>
                        <td
                          className={`py-2 px-2 text-right font-semibold ${
                            s.p25Diff ? "text-amber-300" : "text-zinc-300"
                          }`}
                        >
                          {s.p25}
                        </td>
                        <td className="py-2 px-2 text-right text-zinc-300">{s.p50}</td>
                        <td
                          className={`py-2 px-2 text-right font-semibold ${
                            s.p75Diff ? "text-amber-300" : "text-zinc-300"
                          }`}
                        >
                          {s.p75}
                        </td>
                        <td className="py-2 px-2 text-right text-zinc-500">
                          {s.normMin}–{s.normMax}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ── SAT ResultRow ─────────────────────────────────────────────────────────────

function ResultRow({
  result,
  onUnlock,
  onDelete,
}: {
  result: Result;
  onUnlock?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [unlocking, setUnlocking] = React.useState(false);
  const [localPaid, setLocalPaid] = React.useState(result.paid);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  if (deleted) return null;

  const factorScores: number[] = FACTOR_KEYS.map((k) => getFactorScore(result, k));

  const subfactors: Array<{ label: string; score: number }> = [
    { label: "Self-confirmation", score: result.sf_self_confirmation },
    { label: "Rational dominance", score: result.sf_rational_dominance },
    { label: "Aggressive nonconformity", score: result.sf_aggressive_nonconformity },
    { label: "Passive dependence", score: result.sf_passive_dependence },
    { label: "Sociability", score: result.sf_sociability },
    { label: "Agreeableness", score: result.sf_agreeableness },
  ];

  return (
    <div
      className="rounded-2xl border border-white/5 bg-[#13151A] overflow-hidden cursor-pointer hover:border-purple-500/20 transition"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Collapsed row */}
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="flex-1 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100 truncate">
            {result.first_name}{" "}
            <span className="font-normal text-zinc-400 text-xs">{result.email}</span>
          </p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">{fmtDate(result.submitted_at)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] ${
              result.gender === "male"
                ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                : "border-pink-500/40 bg-pink-500/10 text-pink-300"
            }`}
          >
            {result.gender}
          </span>

          {localPaid && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-emerald-300">
              Unlocked
            </span>
          )}

          {!result.validity_reliable && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-amber-300">
              Low validity
            </span>
          )}

          <SparkBar scores={factorScores} />
          <span className="font-saira text-[11px] text-zinc-600 ml-1">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t border-white/5 p-4 sm:p-5 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Factor scores */}
          <div>
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300 mb-3">
              Factor Scores
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {FACTOR_KEYS.map((key) => {
                const factorScore = getFactorScore(result, key);
                return (
                  <div key={key} className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                    <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-1 capitalize">
                      {key}
                    </p>
                    <p className="font-saira text-base font-bold text-zinc-100">
                      {factorScore}
                      <span className="text-xs font-normal text-zinc-600">/15</span>
                    </p>
                    <MiniProgressBar value={factorScore} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subfactor scores */}
          <div>
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300 mb-3">
              Subfactor Scores
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subfactors.map(({ label, score }) => (
                <div key={label} className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                  <p className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1">
                    {label}
                  </p>
                  <p className="font-saira text-base font-bold text-zinc-100">{score}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Validity */}
          <div>
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300 mb-3">
              Validity
            </p>
            <div className="flex flex-wrap gap-4 font-saira text-sm">
              <span>
                <span className="text-zinc-500 text-xs uppercase tracking-[0.15em] mr-2">Sum Yes</span>
                <span className="text-zinc-200 font-semibold">{result.sum_yes}</span>
              </span>
              <span>
                <span className="text-zinc-500 text-xs uppercase tracking-[0.15em] mr-2">Reliable</span>
                <span
                  className={`font-semibold ${
                    result.validity_reliable ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {result.validity_reliable ? "Yes" : "No"}
                </span>
              </span>
            </div>
          </div>

          {/* View full report */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const report = buildReportFromResult(result);
                const payload = {
                  report,
                  respondent: {
                    firstName: result.first_name,
                    email: result.email,
                    gender: result.gender,
                    lang: result.lang ?? "en",
                    startedAt: result.submitted_at,
                    submittedAt: result.submitted_at,
                  },
                };
                try {
                  localStorage.setItem("powerflow.selfAwareness.lastResult.v1", JSON.stringify(payload));
                  localStorage.setItem("powerflow.selfAwareness.unlocked.v1", "1");
                } catch { /* ignore */ }
                window.open("/tests/self-awareness/results", "_blank");
              }}
              className="rounded-full border border-purple-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-200 transition hover:bg-purple-500/20"
            >
              View full report →
            </button>

            {onUnlock && (
              localPaid ? (
                <p className="self-center font-saira text-[11px] text-emerald-400">
                  ✓ Report unlocked for this client
                </p>
              ) : (
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setUnlocking(true);
                    try {
                      await onUnlock(result.id);
                      setLocalPaid(true);
                    } finally {
                      setUnlocking(false);
                    }
                  }}
                  className="rounded-full border border-emerald-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  {unlocking ? "Unlocking…" : "Unlock for client"}
                </button>
              )
            )}

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="font-saira text-[11px] text-red-300">Delete this result?</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                    className="rounded-full border border-zinc-600 px-3 py-1 font-saira text-[10px] text-zinc-400 hover:border-zinc-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDeleting(true);
                      try {
                        await onDelete(result.id);
                        setDeleted(true);
                      } finally {
                        setDeleting(false);
                        setConfirmDelete(false);
                      }
                    }}
                    className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 font-saira text-[10px] font-semibold text-red-300 hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="ml-auto rounded-full border border-zinc-700 px-3 py-1 font-saira text-[10px] text-zinc-500 hover:border-red-500/50 hover:text-red-400 transition"
                >
                  Delete
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ACSI ResultRow ────────────────────────────────────────────────────────────

const ACSI_LABELS: Record<AcsiSubscaleKey, string> = {
  coping:        "Coping",
  peaking:       "Peaking",
  goalSetting:   "Goal Setting",
  concentration: "Concentration",
  freedom:       "Freedom",
  confidence:    "Confidence",
  coachability:  "Coachability",
};

const ACSI_ORDER: AcsiSubscaleKey[] = [
  "coping",
  "peaking",
  "goalSetting",
  "concentration",
  "freedom",
  "confidence",
  "coachability",
];

function AcsiResultRow({
  result,
  onUnlock,
  onDelete,
}: {
  result: AcsiResult;
  onUnlock?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [unlocking, setUnlocking] = React.useState(false);
  const [localPaid, setLocalPaid] = React.useState(result.paid);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  if (deleted) return null;

  return (
    <div
      className="rounded-2xl border border-white/5 bg-[#13151A] overflow-hidden cursor-pointer hover:border-purple-500/20 transition"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Collapsed row */}
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="flex-1 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100 truncate">
            {result.first_name}{" "}
            <span className="font-normal text-zinc-400 text-xs">{result.email}</span>
          </p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">{fmtDate(result.submitted_at)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-saira text-xs font-semibold text-zinc-200">
            {result.total_score}
            <span className="text-zinc-600 font-normal">/112</span>
          </span>

          {localPaid && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-emerald-300">
              Unlocked
            </span>
          )}

          <AcsiSparkBar result={result} />
          <span className="font-saira text-[11px] text-zinc-600 ml-1">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t border-white/5 p-4 sm:p-5 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300 mb-3">
              Subscale Scores
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ACSI_ORDER.map((key) => {
                const scoreMap: Record<AcsiSubscaleKey, number> = {
                  coping:        result.score_coping,
                  peaking:       result.score_peaking,
                  goalSetting:   result.score_goal_setting,
                  concentration: result.score_concentration,
                  freedom:       result.score_freedom,
                  confidence:    result.score_confidence,
                  coachability:  result.score_coachability,
                };
                const s = scoreMap[key];
                const band = classifyAcsi(s);
                return (
                  <div key={key} className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                    <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                      {ACSI_LABELS[key]}
                    </p>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="font-saira text-base font-bold text-zinc-100">
                        {s}
                        <span className="text-xs font-normal text-zinc-600">/16</span>
                      </p>
                      <BandChip band={band} />
                    </div>
                    <MiniProgressBar value={s - 4} max={12} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const report = buildAcsiReport(result);
                const payload = {
                  report,
                  respondent: {
                    firstName: result.first_name,
                    email: result.email,
                    gender: result.gender,
                    lang: result.lang ?? "en",
                    startedAt: result.submitted_at,
                    submittedAt: result.submitted_at,
                  },
                };
                try {
                  localStorage.setItem("powerflow.acsi.lastResult.v1", JSON.stringify(payload));
                  localStorage.setItem("powerflow.acsi.unlocked.v1", "1");
                } catch { /* ignore */ }
                window.open("/tests/acsi/results", "_blank");
              }}
              className="rounded-full border border-purple-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-200 transition hover:bg-purple-500/20"
            >
              View full report →
            </button>

            {onUnlock && (
              localPaid ? (
                <p className="self-center font-saira text-[11px] text-emerald-400">
                  ✓ Report unlocked for this client
                </p>
              ) : (
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setUnlocking(true);
                    try {
                      await onUnlock(result.id);
                      setLocalPaid(true);
                    } finally {
                      setUnlocking(false);
                    }
                  }}
                  className="rounded-full border border-emerald-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  {unlocking ? "Unlocking…" : "Unlock for client"}
                </button>
              )
            )}

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="font-saira text-[11px] text-red-300">Delete this result?</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                    className="rounded-full border border-zinc-600 px-3 py-1 font-saira text-[10px] text-zinc-400 hover:border-zinc-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDeleting(true);
                      try {
                        await onDelete(result.id);
                        setDeleted(true);
                      } finally {
                        setDeleting(false);
                        setConfirmDelete(false);
                      }
                    }}
                    className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 font-saira text-[10px] font-semibold text-red-300 hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="ml-auto rounded-full border border-zinc-700 px-3 py-1 font-saira text-[10px] text-zinc-500 hover:border-red-500/50 hover:text-red-400 transition"
                >
                  Delete
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSAI ResultRow ────────────────────────────────────────────────────────────

const CSAI_LABELS: Record<CsaiSubscaleKey, string> = {
  cognitive:  "Cognitive Anxiety",
  somatic:    "Somatic Anxiety",
  confidence: "Self-Confidence",
};

function CsaiResultRow({
  result,
  onUnlock,
  onDelete,
}: {
  result: CsaiResult;
  onUnlock?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [unlocking, setUnlocking] = React.useState(false);
  const [localPaid, setLocalPaid] = React.useState(result.paid);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  if (deleted) return null;

  const scores: Record<CsaiSubscaleKey, number> = {
    cognitive:  result.score_cognitive,
    somatic:    result.score_somatic,
    confidence: result.score_confidence,
  };

  return (
    <div
      className="rounded-2xl border border-white/5 bg-[#13151A] overflow-hidden cursor-pointer hover:border-sky-500/20 transition"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Collapsed row */}
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="flex-1 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100 truncate">
            {result.first_name}{" "}
            <span className="font-normal text-zinc-400 text-xs">{result.email}</span>
          </p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">{fmtDate(result.submitted_at)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["cognitive", "somatic", "confidence"] as CsaiSubscaleKey[]).map((key) => (
            <span
              key={key}
              className="font-saira text-[11px] text-zinc-400"
              title={CSAI_LABELS[key]}
            >
              {key === "cognitive" ? "Cog" : key === "somatic" ? "Som" : "Conf"}:{" "}
              <span className="text-zinc-200 font-semibold">{scores[key]}</span>
            </span>
          ))}

          {localPaid && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-emerald-300">
              Unlocked
            </span>
          )}

          <span className="font-saira text-[11px] text-zinc-600 ml-1">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t border-white/5 p-4 sm:p-5 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300 mb-3">
              Subscale Scores
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["cognitive", "somatic", "confidence"] as CsaiSubscaleKey[]).map((key) => {
                const s = scores[key];
                const band = classifyCsai(key, s);
                // Anxiety subscales: low is good; confidence: high is good
                const inverse = key !== "confidence";
                return (
                  <div key={key} className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                    <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                      {CSAI_LABELS[key]}
                    </p>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className="font-saira text-base font-bold text-zinc-100">
                        {s}
                        <span className="text-xs font-normal text-zinc-600">/36</span>
                      </p>
                      <BandChip band={band} inverse={inverse} />
                    </div>
                    <MiniProgressBar value={s - 9} max={27} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const report = buildCsaiReport(result);
                const payload = {
                  report,
                  respondent: {
                    firstName: result.first_name,
                    email: result.email,
                    gender: result.gender,
                    lang: result.lang ?? "en",
                    startedAt: result.submitted_at,
                    submittedAt: result.submitted_at,
                  },
                };
                try {
                  localStorage.setItem("powerflow.csai.lastResult.v1", JSON.stringify(payload));
                  localStorage.setItem("powerflow.csai.unlocked.v1", "1");
                } catch { /* ignore */ }
                window.open("/tests/csai/results", "_blank");
              }}
              className="rounded-full border border-sky-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-200 transition hover:bg-sky-500/20"
            >
              View full report →
            </button>

            {onUnlock && (
              localPaid ? (
                <p className="self-center font-saira text-[11px] text-emerald-400">
                  ✓ Report unlocked for this client
                </p>
              ) : (
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setUnlocking(true);
                    try {
                      await onUnlock(result.id);
                      setLocalPaid(true);
                    } finally {
                      setUnlocking(false);
                    }
                  }}
                  className="rounded-full border border-emerald-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  {unlocking ? "Unlocking…" : "Unlock for client"}
                </button>
              )
            )}

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="font-saira text-[11px] text-red-300">Delete this result?</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                    className="rounded-full border border-zinc-600 px-3 py-1 font-saira text-[10px] text-zinc-400 hover:border-zinc-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDeleting(true);
                      try {
                        await onDelete(result.id);
                        setDeleted(true);
                      } finally {
                        setDeleting(false);
                        setConfirmDelete(false);
                      }
                    }}
                    className="rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 font-saira text-[10px] font-semibold text-red-300 hover:bg-red-500/20 transition disabled:opacity-40"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="ml-auto rounded-full border border-zinc-700 px-3 py-1 font-saira text-[10px] text-zinc-500 hover:border-red-500/50 hover:text-red-400 transition"
                >
                  Delete
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AthleteCard ───────────────────────────────────────────────────────────────

function AthleteCard({
  profile,
  onUnlock,
  onDelete,
}: {
  profile: AthleteProfile;
  onUnlock: (id: string, table: string) => Promise<void>;
  onDelete: (id: string, table: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const totalTests = profile.sat.length + profile.acsi.length + profile.csai.length;
  const allDates = [...profile.sat, ...profile.acsi, ...profile.csai].map(
    (r) => new Date(r.submitted_at).getTime(),
  );
  const latestDate = allDates.length > 0 ? Math.max(...allDates) : 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F1117] overflow-hidden transition hover:border-purple-500/15">
      {/* Header row */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 sm:p-5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar letter */}
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <span className="font-saira text-sm font-bold text-purple-200 uppercase">
            {(profile.name || profile.email).charAt(0)}
          </span>
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100 truncate">
            {profile.name}
          </p>
          <p className="font-saira text-[11px] text-zinc-500 truncate">{profile.email}</p>
        </div>

        {/* Test badges */}
        <div className="flex flex-wrap items-center gap-2">
          {profile.sat.length > 0 && (
            <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-fuchsia-300">
              SAT ×{profile.sat.length}
            </span>
          )}
          {profile.acsi.length > 0 && (
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-purple-300">
              ACSI ×{profile.acsi.length}
            </span>
          )}
          {profile.csai.length > 0 && (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-saira text-[10px] uppercase tracking-[0.15em] text-sky-300">
              CSAI ×{profile.csai.length}
            </span>
          )}
        </div>

        {/* Date + expand */}
        <div className="flex items-center gap-2">
          {latestDate > 0 && (
            <span className="font-saira text-[11px] text-zinc-600">
              {fmtDate(new Date(latestDate).toISOString())}
            </span>
          )}
          <span className="font-saira text-[11px] text-zinc-600">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded: per-test sections */}
      {expanded && (
        <div
          className="border-t border-white/5 p-4 sm:p-5 space-y-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* SAT section */}
          {profile.sat.length > 0 && (
            <div>
              <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300 mb-3 flex items-center gap-2">
                <span className="inline-block h-[2px] w-4 rounded-full bg-fuchsia-400 opacity-70" />
                Self-Awareness Test · {profile.sat.length} result{profile.sat.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {profile.sat.map((r) => (
                  <ResultRow
                    key={r.id}
                    result={r}
                    onUnlock={(id) => onUnlock(id, "sat_results")}
                    onDelete={(id) => onDelete(id, "sat_results")}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ACSI section */}
          {profile.acsi.length > 0 && (
            <div>
              <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-300 mb-3 flex items-center gap-2">
                <span className="inline-block h-[2px] w-4 rounded-full bg-purple-400 opacity-70" />
                Coping Skills Inventory · {profile.acsi.length} result{profile.acsi.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {profile.acsi.map((r) => (
                  <AcsiResultRow
                    key={r.id}
                    result={r}
                    onUnlock={(id) => onUnlock(id, "acsi_results")}
                    onDelete={(id) => onDelete(id, "acsi_results")}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CSAI section */}
          {profile.csai.length > 0 && (
            <div>
              <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300 mb-3 flex items-center gap-2">
                <span className="inline-block h-[2px] w-4 rounded-full bg-sky-400 opacity-70" />
                Competitive Anxiety Inventory · {profile.csai.length} result{profile.csai.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {profile.csai.map((r) => (
                  <CsaiResultRow
                    key={r.id}
                    result={r}
                    onUnlock={(id) => onUnlock(id, "csai_results")}
                    onDelete={(id) => onDelete(id, "csai_results")}
                  />
                ))}
              </div>
            </div>
          )}

          {totalTests === 0 && (
            <p className="font-saira text-sm text-zinc-600 text-center py-4">No results</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Import Tab ────────────────────────────────────────────────────────────────

function ImportTab({ onSwitchToResults }: { onSwitchToResults: () => void }) {
  const [files, setFiles] = React.useState<ImportFile[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = async (rawFiles: FileList | File[]) => {
    const arr = Array.from(rawFiles).filter((f) => /\.xlsx?$/i.test(f.name));
    if (arr.length === 0) return;

    const newEntries: ImportFile[] = await Promise.all(
      arr.map(async (f) => {
        const { answers, parsedCount } = await parseFile(f);
        return {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          filename: f.name,
          name: nameFromFilename(f.name),
          email: "",
          gender: null,
          answers,
          answeredCount: parsedCount,
          status: "pending" as const,
        };
      }),
    );

    setFiles((prev) => [...prev, ...newEntries]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const updateFile = (id: string, patch: Partial<ImportFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const canScoreAll = files.some((f) => f.gender !== null && f.status === "pending");

  const handleScoreAll = () => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.gender === null || f.status !== "pending") return f;
        try {
          const report = scoreAnswers(f.answers as Answers, f.gender);
          const resultAsRow = buildResultFromReport(f, report);
          return { ...f, status: "scored" as const, report, resultAsRow };
        } catch {
          return {
            ...f,
            status: "error" as const,
            errorMsg: "Scoring failed — check answer count",
          };
        }
      }),
    );
  };

  const canSaveAll = files.some((f) => f.status === "scored");

  const handleSaveAll = async () => {
    const toSave = files.filter((f) => f.status === "scored");
    for (const f of toSave) {
      updateFile(f.id, { status: "saving" });
      try {
        const resultRef = `pfsa_import_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const res = await fetch("/api/test/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respondent: {
              firstName: f.name,
              email:
                f.email ||
                `${f.name.toLowerCase().replace(/\s+/g, ".")}@imported`,
              gender: f.gender,
              lang: "en",
              startedAt: null,
              submittedAt: new Date().toISOString(),
            },
            report: f.report,
            resultRef,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        updateFile(f.id, { status: "saved" });
      } catch (err) {
        updateFile(f.id, {
          status: "error",
          errorMsg: err instanceof Error ? err.message : "Save failed",
        });
      }
    }
  };

  const anyJustSaved = files.some((f) => f.status === "saved");

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-purple-400 bg-purple-500/10"
            : "border-zinc-700 hover:border-purple-500/50 hover:bg-white/[0.02]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          className="hidden"
          onChange={handleBrowse}
        />
        <p className="font-saira text-sm text-zinc-300">
          Drop <span className="text-purple-300">.xlsx</span> files here, or{" "}
          <span className="text-purple-300 underline underline-offset-2">browse</span>
        </p>
        <p className="font-saira text-[11px] text-zinc-600 mt-1">
          Multiple files allowed · One person per file
        </p>
      </div>

      {/* Staged files table */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#13151A] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="font-saira text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-300">
              Staged files — {files.length}
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {files.map((f) => (
              <div key={f.id} className="p-4 space-y-3">
                {/* Row header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-saira text-[11px] text-zinc-500 truncate max-w-[180px]">
                    {f.filename}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-saira text-[10px] font-semibold ${
                      f.answeredCount >= 160
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {f.answeredCount}/165
                  </span>
                  {f.status === "scored" && (
                    <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 font-saira text-[10px] text-purple-300">
                      Scored
                    </span>
                  )}
                  {f.status === "saving" && (
                    <span className="rounded-full border border-zinc-500/40 bg-zinc-500/10 px-2 py-0.5 font-saira text-[10px] text-zinc-400">
                      Saving…
                    </span>
                  )}
                  {f.status === "saved" && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-saira text-[10px] text-emerald-300">
                      Saved ✓
                    </span>
                  )}
                  {f.status === "error" && (
                    <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-saira text-[10px] text-red-300">
                      Error
                    </span>
                  )}
                  {f.answeredCount < 160 && (
                    <span className="font-saira text-[10px] text-amber-400">
                      Only {f.answeredCount}/165 answered
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="ml-auto font-saira text-xs text-zinc-600 hover:text-red-400 transition"
                  >
                    ×
                  </button>
                </div>

                {/* Inputs row */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => updateFile(f.id, { name: e.target.value })}
                    placeholder="Full name"
                    className="rounded-lg border border-zinc-700/70 bg-[#0D0F14] px-3 py-1.5 font-saira text-xs text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40 w-44"
                  />
                  <input
                    type="email"
                    value={f.email}
                    onChange={(e) => updateFile(f.id, { email: e.target.value })}
                    placeholder="Email (optional)"
                    className="rounded-lg border border-zinc-700/70 bg-[#0D0F14] px-3 py-1.5 font-saira text-xs text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/40 w-48"
                  />
                  <div className="flex gap-1.5">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          updateFile(f.id, {
                            gender: f.gender === g ? null : g,
                            status: f.status === "scored" ? "pending" : f.status,
                            report: f.gender === g ? undefined : f.report,
                            resultAsRow: f.gender === g ? undefined : f.resultAsRow,
                          })
                        }
                        className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.14em] transition ${
                          f.gender === g
                            ? g === "male"
                              ? "border-sky-400 bg-sky-500/20 text-sky-200"
                              : "border-pink-400 bg-pink-500/20 text-pink-200"
                            : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {f.status === "error" && f.errorMsg && (
                  <p className="font-saira text-[11px] text-red-400">{f.errorMsg}</p>
                )}

                {(f.status === "scored" || f.status === "saved") &&
                  f.resultAsRow &&
                  f.report && (
                    <div className="mt-2 space-y-2">
                      <ResultRow result={f.resultAsRow} />
                      <button
                        type="button"
                        onClick={() => {
                          const payload = {
                            report: f.report,
                            respondent: {
                              firstName: f.name,
                              email: f.email || "",
                              gender: f.gender,
                              lang: "en",
                              startedAt: new Date().toISOString(),
                              submittedAt: new Date().toISOString(),
                            },
                          };
                          try {
                            localStorage.setItem(
                              "powerflow.selfAwareness.lastResult.v1",
                              JSON.stringify(payload),
                            );
                            localStorage.setItem("powerflow.selfAwareness.unlocked.v1", "1");
                          } catch { /* ignore */ }
                          window.open("/tests/self-awareness/results", "_blank");
                        }}
                        className="rounded-full border border-purple-500/50 px-4 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-200 transition hover:bg-purple-500/20"
                      >
                        View full results →
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={handleScoreAll}
            disabled={!canScoreAll}
            className="rounded-full bg-purple-500 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Score all
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!canSaveAll}
            className="rounded-full border border-purple-500/50 px-6 py-2 font-saira text-xs font-semibold uppercase tracking-[0.18em] text-purple-200 transition hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save all to database
          </button>
          {anyJustSaved && (
            <button
              type="button"
              onClick={onSwitchToResults}
              className="font-saira text-xs text-purple-300 underline underline-offset-2 hover:text-purple-200 transition"
            >
              View in Results tab →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // All results — null means not yet logged in
  const [satResults, setSatResults] = React.useState<Result[] | null>(null);
  const [acsiResults, setAcsiResults] = React.useState<AcsiResult[]>([]);
  const [csaiResults, setCsaiResults] = React.useState<CsaiResult[]>([]);

  const [search, setSearch] = React.useState("");
  const [showBandAnalysis, setShowBandAnalysis] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"results" | "import">("results");

  // Derived athlete list
  const athletes = React.useMemo(() => {
    if (satResults === null) return [];
    return groupByAthlete(satResults, acsiResults, csaiResults);
  }, [satResults, acsiResults, csaiResults]);

  const filteredAthletes = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [athletes, search]);

  // ── Auth ───────────────────────────────────────────────────────────────────

  const fetchAllResults = React.useCallback(async (pw: string) => {
    const res = await fetch(`/api/admin/all-results?password=${encodeURIComponent(pw)}`);
    if (res.status === 401) throw new Error("__unauthorized__");
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      sat?: Result[];
      acsi?: AcsiResult[];
      csai?: CsaiResult[];
    };
    return {
      sat: data.sat ?? [],
      acsi: data.acsi ?? [],
      csai: data.csai ?? [],
    };
  }, []);

  const handleLogin = React.useCallback(async () => {
    if (!password.trim() || loading) return;
    setLoading(true);
    setAuthError(null);
    try {
      const { sat, acsi, csai } = await fetchAllResults(password);
      setSatResults(sat);
      setAcsiResults(acsi);
      setCsaiResults(csai);
      if (sat.length >= 10 && sat.length % 50 === 0) {
        setShowBandAnalysis(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reach server";
      setAuthError(msg === "__unauthorized__" ? "Wrong password" : msg);
    } finally {
      setLoading(false);
    }
  }, [password, loading, fetchAllResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  const refreshResults = React.useCallback(async () => {
    if (!password.trim()) return;
    try {
      const { sat, acsi, csai } = await fetchAllResults(password);
      setSatResults(sat);
      setAcsiResults(acsi);
      setCsaiResults(csai);
    } catch {
      // silent
    }
  }, [password, fetchAllResults]);

  const handleSwitchToResults = React.useCallback(() => {
    setActiveTab("results");
    refreshResults();
  }, [refreshResults]);

  const handleUnlock = React.useCallback(
    async (resultId: string, table: string) => {
      await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, password, table }),
      });
    },
    [password],
  );

  const handleDelete = React.useCallback(
    async (resultId: string, table: string) => {
      await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId, password, table }),
      });
    },
    [password],
  );

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (satResults === null) {
    return (
      <div className="min-h-screen bg-[#050608] pt-24 text-white">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-sm px-4 py-16 text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            PowerFlow
          </p>
          <h1 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.12em]">
            Admin Dashboard
          </h1>
          <div className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-zinc-700/70 bg-[#13151A] px-4 py-3 font-saira text-sm text-zinc-50 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40"
              autoFocus
            />
            {authError && (
              <p className="font-saira text-xs text-red-300">{authError}</p>
            )}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !password.trim()}
              className="w-full rounded-full bg-purple-500 px-8 py-3 font-saira text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.10),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
              PowerFlow · Admin
            </p>
            <h1 className="mt-1 font-saira text-2xl font-extrabold uppercase tracking-[0.1em]">
              Athletes
            </h1>
            <p className="mt-1 font-saira text-sm text-zinc-400">
              {athletes.length} athlete{athletes.length !== 1 ? "s" : ""}
              {" · "}
              <span className="text-fuchsia-300/80">{satResults.length} SAT</span>
              {" · "}
              <span className="text-purple-300/80">{acsiResults.length} ACSI</span>
              {" · "}
              <span className="text-sky-300/80">{csaiResults.length} CSAI</span>
            </p>
          </div>

          {activeTab === "results" && satResults.length >= 10 && (
            <button
              type="button"
              onClick={() => setShowBandAnalysis((v) => !v)}
              className={`rounded-full border px-4 py-1.5 font-saira text-[11px] uppercase tracking-[0.15em] transition self-start mt-1 ${
                showBandAnalysis
                  ? "border-purple-400 bg-purple-500/20 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-purple-400"
              }`}
            >
              {showBandAnalysis ? "Hide band analysis" : "Band analysis"}
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="mt-8 flex gap-0 border-b border-white/5">
          {(
            [
              { key: "results", label: "Athletes" },
              { key: "import", label: "Import Excel" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                activeTab === tab.key ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-purple-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "results" && (
            <>
              {/* Band analysis panel */}
              {showBandAnalysis && <BandAnalysisPanel results={satResults} />}

              {/* Search */}
              <div className="mt-4 mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full max-w-sm rounded-xl border border-zinc-700/70 bg-[#13151A] px-4 py-2.5 font-saira text-sm text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30"
                />
              </div>

              {/* Athletes list */}
              <div className="space-y-3">
                {filteredAthletes.length === 0 ? (
                  <p className="font-saira text-sm text-zinc-500 py-8 text-center">
                    {search ? "No athletes match your search." : "No results found."}
                  </p>
                ) : (
                  filteredAthletes.map((profile) => (
                    <AthleteCard
                      key={profile.email}
                      profile={profile}
                      onUnlock={handleUnlock}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "import" && (
            <ImportTab onSwitchToResults={handleSwitchToResults} />
          )}
        </div>
      </div>
    </div>
  );
}
