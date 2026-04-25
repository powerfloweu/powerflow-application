"use client";

import React from "react";
import Link from "next/link";
import EntryCard from "@/app/components/EntryCard";
import TagChip from "@/app/components/TagChip";
import { THEME_DEFS, type Sentiment, type Context } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";
import { weekDays as currentWeekDaysLocal } from "@/lib/date";

// ── Types ─────────────────────────────────────────────────────────────────────

type Flag = "attention" | "monitor" | "stable";
type Trend     = "up" | "down" | "stable";

type EntryRow = {
  id: string;
  user_id: string;
  content: string;
  sentiment: Sentiment;
  context: Context;
  themes: string[];
  created_at: string;
};

type SatRow  = { id: string; total_score: number; submitted_at: string; paid: boolean };
type AcsiRow = { id: string; score_coping: number; score_concentration: number; score_confidence: number; score_goal_setting: number; total_score: number; submitted_at: string; paid: boolean };
type CsaiRow = { id: string; score_cognitive: number; score_somatic: number; score_confidence: number; submitted_at: string; paid: boolean };
type DasRow  = { id: string; total_score: number; depression_prone: boolean; submitted_at: string; paid: boolean };

type AthleteRaw = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  // onboarding profile fields
  meet_date: string | null;
  gender: string | null;
  bodyweight_kg: number | null;
  weight_category: string | null;
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  mental_goals: string[] | null;
  training_days_per_week: number | null;
  instagram: string | null;
  years_powerlifting: string | null;
  federation: string | null;
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  previous_mental_work: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  expectations: string | null;
  previous_tools: string | null;
  anything_else: string | null;
  // activity data
  entries: EntryRow[];
  sat: SatRow[];
  acsi: AcsiRow[];
  csai: CsaiRow[];
  das: DasRow[];
  training_entries: TrainingEntry[];
};

type CoachProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_code: string | null;
};

// ── Data computation ───────────────────────────────────────────────────────────

function weekAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d;
}

function computeClient(a: AthleteRaw) {
  const now = new Date();
  const cutWeek = weekAgo(7);
  const cutPrev = weekAgo(14);

  const weekEntries = a.entries.filter((e) => new Date(e.created_at) >= cutWeek);
  const prevEntries = a.entries.filter((e) => new Date(e.created_at) >= cutPrev && new Date(e.created_at) < cutWeek);

  const positiveRate = weekEntries.length
    ? Math.round((weekEntries.filter((e) => e.sentiment === "positive").length / weekEntries.length) * 100)
    : 0;

  const prevPositiveRate = prevEntries.length
    ? Math.round((prevEntries.filter((e) => e.sentiment === "positive").length / prevEntries.length) * 100)
    : positiveRate;

  const trend: Trend = positiveRate > prevPositiveRate + 10 ? "up"
    : positiveRate < prevPositiveRate - 10 ? "down"
    : "stable";

  const flag: Flag = positiveRate < 30 ? "attention" : positiveRate < 55 ? "monitor" : "stable";

  // 7-day daily positive %
  const sentimentWeek = Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekAgo(6 - i);
    const dayEnd   = weekAgo(6 - i - 1);
    const dayE = a.entries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= dayStart && d < (i === 6 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : dayEnd);
    });
    if (!dayE.length) return 0;
    return Math.round((dayE.filter((e) => e.sentiment === "positive").length / dayE.length) * 100);
  });

  // Themes
  const themes = THEME_DEFS.map((def) => {
    const weekCount = weekEntries.filter((e) =>
      def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
    ).length;
    const prevCount = prevEntries.filter((e) =>
      def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
    ).length;
    return {
      label: def.label,
      count: weekCount,
      trend: (weekCount > prevCount + 1 ? "up" : weekCount < prevCount - 1 ? "down" : "stable") as Trend,
      color: def.color,
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // Last active
  const lastEntry = a.entries[0];
  let lastActive = "Never";
  if (lastEntry) {
    const diffMs = now.getTime() - new Date(lastEntry.created_at).getTime();
    const diffH  = Math.floor(diffMs / 3600000);
    const diffD  = Math.floor(diffMs / 86400000);
    lastActive = diffH < 1 ? "Just now"
      : diffH < 24 ? `${diffH}h ago`
      : diffD === 1 ? "Yesterday"
      : `${diffD} days ago`;
  }

  return {
    id: a.id,
    name: a.display_name,
    initials: a.display_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2),
    avatarUrl: a.avatar_url,
    flag,
    positiveRate,
    trend,
    entriesThisWeek: weekEntries.length,
    sentimentWeek,
    themes,
    recentEntries: a.entries.slice(0, 5),
    testScores: { sat: a.sat, acsi: a.acsi, csai: a.csai, das: a.das },
    lastActive,
    joinedAt: a.created_at,
    trainingThisWeek: a.training_entries,
    // full onboarding profile — passed through for Profile tab
    profile: {
      meet_date: a.meet_date,
      gender: a.gender,
      bodyweight_kg: a.bodyweight_kg,
      weight_category: a.weight_category,
      squat_current_kg: a.squat_current_kg,
      squat_goal_kg: a.squat_goal_kg,
      bench_current_kg: a.bench_current_kg,
      bench_goal_kg: a.bench_goal_kg,
      deadlift_current_kg: a.deadlift_current_kg,
      deadlift_goal_kg: a.deadlift_goal_kg,
      mental_goals: a.mental_goals ?? [],
      training_days_per_week: a.training_days_per_week,
      instagram: a.instagram,
      years_powerlifting: a.years_powerlifting,
      federation: a.federation,
      main_barrier: a.main_barrier,
      confidence_break: a.confidence_break,
      overthinking_focus: a.overthinking_focus,
      previous_mental_work: a.previous_mental_work,
      self_confidence_reg: a.self_confidence_reg,
      self_focus_fatigue: a.self_focus_fatigue,
      self_handling_pressure: a.self_handling_pressure,
      self_competition_anxiety: a.self_competition_anxiety,
      self_emotional_recovery: a.self_emotional_recovery,
      expectations: a.expectations,
      previous_tools: a.previous_tools,
      anything_else: a.anything_else,
    },
  };
}

type Client = ReturnType<typeof computeClient>;

// ── Visual helpers ─────────────────────────────────────────────────────────────

const FLAG_CONFIG: Record<Flag, { label: string; dot: string; text: string; bg: string; border: string }> = {
  attention: { label: "Needs attention", dot: "bg-rose-400",    text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
  monitor:   { label: "Monitor",         dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  stable:    { label: "On track",        dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};


const TREND_ICON:  Record<Trend, string> = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR: Record<Trend, string> = { up: "text-emerald-400", down: "text-rose-400", stable: "text-zinc-500" };

// ── Sentiment sparkline ────────────────────────────────────────────────────────

function SentimentSparkline({ data }: { data: number[] }) {
  const w = 80; const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1] ?? 0;
  const color = last >= 60 ? "rgb(52,211,153)" : last >= 40 ? "rgb(251,191,36)" : "rgb(251,113,133)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}


// ── Profile tab helpers ────────────────────────────────────────────────────────

function ProfileField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
        {label}
      </p>
      <p className="font-saira text-xs text-zinc-300 leading-relaxed">{String(value)}</p>
    </div>
  );
}

function ScaleBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  const pct = (value / 10) * 100;
  const barColor = value >= 7 ? "bg-emerald-400" : value >= 4 ? "bg-amber-400" : "bg-rose-400";
  const textColor = value >= 7 ? "text-emerald-300" : value >= 4 ? "text-amber-300" : "text-rose-300";
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-saira text-[10px] text-zinc-400">{label}</span>
        <span className={`font-saira text-[10px] font-bold ${textColor}`}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: ReturnType<typeof computeClient>["profile"] }) {
  const goals = profile.mental_goals.filter(Boolean);
  const hasLifts =
    profile.squat_current_kg || profile.bench_current_kg || profile.deadlift_current_kg ||
    profile.squat_goal_kg    || profile.bench_goal_kg    || profile.deadlift_goal_kg;
  const hasSelfRatings =
    profile.self_confidence_reg || profile.self_focus_fatigue || profile.self_handling_pressure ||
    profile.self_competition_anxiety || profile.self_emotional_recovery;
  const hasMindset =
    profile.main_barrier || profile.confidence_break ||
    profile.overthinking_focus || profile.previous_mental_work;
  const hasGoalsSection =
    goals.length > 0 || profile.expectations || profile.previous_tools || profile.anything_else;
  const hasBio =
    profile.gender || profile.federation || profile.years_powerlifting ||
    profile.bodyweight_kg || profile.meet_date || profile.training_days_per_week;

  if (!hasBio && !hasLifts && !hasSelfRatings && !hasMindset && !hasGoalsSection) {
    return (
      <p className="font-saira text-sm text-zinc-600 py-6 text-center">
        Onboarding not completed yet — no profile data to show.
      </p>
    );
  }

  return (
    <div className="space-y-6">

      {/* Personal & sport */}
      {hasBio && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Personal &amp; sport
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ProfileField label="Gender" value={profile.gender} />
            <ProfileField label="Instagram" value={profile.instagram ? `@${profile.instagram}` : null} />
            <ProfileField label="Federation" value={profile.federation} />
            <ProfileField label="Years in sport" value={profile.years_powerlifting} />
            <ProfileField label="Bodyweight" value={profile.bodyweight_kg ? `${profile.bodyweight_kg} kg` : null} />
            <ProfileField label="Weight class" value={profile.weight_category} />
            <ProfileField label="Next meet" value={profile.meet_date} />
            <ProfileField label="Training days/week" value={profile.training_days_per_week} />
          </div>
        </div>
      )}

      {/* Lifts */}
      {hasLifts && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Lifts
          </p>
          <div className="space-y-2">
            {(
              [
                ["Squat",    profile.squat_current_kg,    profile.squat_goal_kg],
                ["Bench",    profile.bench_current_kg,    profile.bench_goal_kg],
                ["Deadlift", profile.deadlift_current_kg, profile.deadlift_goal_kg],
              ] as [string, number | null, number | null][]
            )
              .filter(([, cur, goal]) => cur || goal)
              .map(([label, cur, goal]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-16 flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-saira text-sm font-bold text-white">
                    {cur ? `${cur} kg` : "—"}
                  </span>
                  {goal && (
                    <span className="font-saira text-[10px] text-zinc-500">
                      → goal: {goal} kg
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mental goals */}
      {goals.length > 0 && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Mental goals (next 3 months)
          </p>
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-saira text-[10px] font-bold text-purple-400 flex-shrink-0 pt-0.5 w-4">
                  {i + 1}.
                </span>
                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self-assessment scales */}
      {hasSelfRatings && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Self-assessment (athlete&apos;s own rating, 1–10)
          </p>
          <div className="space-y-3">
            <ScaleBar label="Confidence regulation"  value={profile.self_confidence_reg} />
            <ScaleBar label="Focus under fatigue"    value={profile.self_focus_fatigue} />
            <ScaleBar label="Handling pressure"      value={profile.self_handling_pressure} />
            <ScaleBar label="Competition anxiety"    value={profile.self_competition_anxiety} />
            <ScaleBar label="Emotional recovery"     value={profile.self_emotional_recovery} />
          </div>
        </div>
      )}

      {/* Open mindset questions */}
      {hasMindset && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Mindset assessment
          </p>
          <div className="space-y-4">
            <ProfileField label="Main barrier to performance"             value={profile.main_barrier} />
            <ProfileField label="When confidence breaks"                  value={profile.confidence_break} />
            <ProfileField label="When they overthink / lose focus"        value={profile.overthinking_focus} />
            <ProfileField label="Previous mental coaching / psych work"   value={profile.previous_mental_work} />
          </div>
        </div>
      )}

      {/* Goals & context */}
      {(profile.expectations || profile.previous_tools || profile.anything_else) && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            Goals &amp; context
          </p>
          <div className="space-y-4">
            <ProfileField label="Expectations from coaching"      value={profile.expectations} />
            <ProfileField label="Mental strategies tried before"  value={profile.previous_tools} />
            <ProfileField label="Anything else"                   value={profile.anything_else} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client card ────────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const [expanded, setExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"analysis" | "entries" | "scores" | "training" | "profile">("analysis");
  const flag = FLAG_CONFIG[client.flag];

  return (
    <div className={`rounded-3xl border bg-[#0C0E13] overflow-hidden transition ${
      client.flag === "attention" ? "border-rose-500/20" : "border-white/6"
    }`}>
      {/* ── Collapsed header ── */}
      <div
        className="flex flex-wrap items-center gap-4 p-5 sm:p-6 cursor-pointer hover:bg-white/[0.015] transition"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        {client.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.avatarUrl}
            alt={client.name}
            className={`flex-shrink-0 w-10 h-10 rounded-full border ${
              client.flag === "attention" ? "border-rose-500/30" :
              client.flag === "monitor"   ? "border-amber-500/30" :
              "border-purple-500/30"
            }`}
          />
        ) : (
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-saira text-sm font-bold ${
            client.flag === "attention" ? "bg-rose-500/20 text-rose-200 border border-rose-500/30" :
            client.flag === "monitor"   ? "bg-amber-500/20 text-amber-200 border border-amber-500/30" :
            "bg-purple-500/20 text-purple-200 border border-purple-500/30"
          }`}>
            {client.initials}
          </div>
        )}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100">{client.name}</p>
          <p className="font-saira text-[11px] text-zinc-600 mt-0.5">
            Last active {client.lastActive} · {client.entriesThisWeek} entries this week
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <div title="7-day positive sentiment %">
            <SentimentSparkline data={client.sentimentWeek} />
          </div>

          <div className="text-center hidden sm:block">
            <p className={`font-saira text-base font-bold ${
              client.positiveRate >= 60 ? "text-emerald-300" :
              client.positiveRate >= 40 ? "text-amber-300" : "text-rose-300"
            }`}>{client.positiveRate}%</p>
            <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-600">positive</p>
          </div>

          <span className={`font-saira text-lg font-bold ${TREND_COLOR[client.trend]}`}>
            {TREND_ICON[client.trend]}
          </span>

          <span className={`rounded-full border px-3 py-0.5 font-saira text-[10px] uppercase tracking-[0.14em] ${flag.border} ${flag.bg} ${flag.text}`}>
            <span className={`mr-1.5 inline-block w-1.5 h-1.5 rounded-full ${flag.dot}`} />
            {flag.label}
          </span>

          <span className="font-saira text-[11px] text-zinc-600">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-white/5 px-5 sm:px-6">
            {([
              { key: "analysis",  label: "Analysis" },
              { key: "entries",   label: "Recent entries" },
              { key: "scores",    label: "Test scores" },
              { key: "training",  label: "Training Log" },
              { key: "profile",   label: "Profile" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-3 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
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

          <div className="p-5 sm:p-6">
            {/* ── Tab: Analysis ── */}
            {activeTab === "analysis" && (
              <div className="space-y-5">
                {client.themes.length > 0 ? (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
                      Detected themes this week
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {client.themes.map((t) => (
                        <TagChip
                          key={t.label}
                          label={t.label}
                          color={THEME_DEFS.find((d) => d.label === t.label)?.color ?? "purple"}
                          count={t.count}
                          trend={t.trend}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="font-saira text-sm text-zinc-600 py-2">
                    {client.entriesThisWeek === 0 ? "No entries this week — no theme data yet." : "No recurring themes detected this week."}
                  </p>
                )}

                {/* Stats summary */}
                {client.entriesThisWeek > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-[#0D0F14] p-5">
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 mb-3">
                      This week at a glance
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat label="Entries" value={String(client.entriesThisWeek)} />
                      <MiniStat
                        label="Positive"
                        value={`${client.positiveRate}%`}
                        color={client.positiveRate >= 60 ? "text-emerald-300" : client.positiveRate >= 40 ? "text-amber-300" : "text-rose-300"}
                      />
                      <MiniStat
                        label="Trend"
                        value={TREND_ICON[client.trend]}
                        color={TREND_COLOR[client.trend]}
                      />
                    </div>
                  </div>
                )}

                {/* AI insight placeholder */}
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-purple-300">✦</span>
                    </div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300">
                      Pattern analysis
                    </p>
                    <span className="ml-auto rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-saira text-[9px] text-purple-400 uppercase tracking-[0.14em]">
                      AI · Coming soon
                    </span>
                  </div>
                  <p className="font-saira text-xs leading-relaxed text-zinc-500">
                    AI-generated narrative analysis will appear here once your athlete has logged at least 7 entries. Patterns, belief structures, and session recommendations will be surfaced automatically.
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Recent entries ── */}
            {activeTab === "entries" && (
              <div className="space-y-3">
                {client.recentEntries.length === 0 ? (
                  <p className="font-saira text-sm text-zinc-600 py-4 text-center">No entries yet.</p>
                ) : (
                  client.recentEntries.map((e) => (
                    <EntryCard key={e.id} entry={e} />
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Test scores ── */}
            {activeTab === "scores" && (
              <div className="space-y-5">
                {/* DAS */}
                {client.testScores.das.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300 mb-3">
                      Dysfunctional Attitude Scale (DAS) — latest
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(() => {
                        const r = client.testScores.das[0];
                        return (
                          <>
                            <ScoreCard label="Total score" value={`${r.total_score > 0 ? "+" : ""}${r.total_score}`} sub="of ±70" flag={r.depression_prone ? "rose" : r.total_score > 18 ? "amber" : "emerald"} />
                            <ScoreCard label="Depression-prone" value={r.depression_prone ? "Yes" : "No"} sub="" flag={r.depression_prone ? "rose" : "emerald"} />
                            <ScoreCard label="Submitted" value={new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} sub={r.paid ? "Paid" : "Free"} flag="amber" />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ACSI */}
                {client.testScores.acsi.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300 mb-3">
                      Coping Skills (ACSI) — latest
                    </p>
                    {(() => {
                      const r = client.testScores.acsi[0];
                      const total = r.total_score ?? (r.score_coping + r.score_concentration + r.score_confidence + r.score_goal_setting);
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <ScoreCard label="Total" value={String(total)} sub="of 196" flag={total >= 130 ? "emerald" : total >= 90 ? "amber" : "rose"} />
                          <ScoreCard label="Coping" value={String(r.score_coping)} sub="of 28" flag={r.score_coping >= 18 ? "emerald" : "rose"} />
                          <ScoreCard label="Concentration" value={String(r.score_concentration)} sub="of 28" flag={r.score_concentration >= 18 ? "emerald" : "rose"} />
                          <ScoreCard label="Confidence" value={String(r.score_confidence)} sub="of 28" flag={r.score_confidence >= 18 ? "emerald" : "rose"} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* CSAI */}
                {client.testScores.csai.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300 mb-3">
                      Competitive Anxiety (CSAI) — latest
                    </p>
                    {(() => {
                      const r = client.testScores.csai[0];
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <ScoreCard label="Cognitive" value={String(r.score_cognitive)} sub="of 36" flag={r.score_cognitive <= 18 ? "emerald" : "rose"} />
                          <ScoreCard label="Somatic"   value={String(r.score_somatic)}   sub="of 36" flag={r.score_somatic <= 18 ? "emerald" : "rose"} />
                          <ScoreCard label="Confidence" value={String(r.score_confidence)} sub="of 36" flag={r.score_confidence >= 22 ? "emerald" : "rose"} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SAT */}
                {client.testScores.sat.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300 mb-3">
                      Self-Awareness (SAT) — latest
                    </p>
                    {(() => {
                      const r = client.testScores.sat[0];
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <ScoreCard label="Total" value={String(r.total_score)} sub="of 165" flag="emerald" />
                          <ScoreCard label="Submitted" value={new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} sub={r.paid ? "Paid" : "Free"} flag="amber" />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {client.testScores.das.length === 0 &&
                 client.testScores.acsi.length === 0 &&
                 client.testScores.csai.length === 0 &&
                 client.testScores.sat.length === 0 && (
                  <p className="font-saira text-sm text-zinc-600 py-4 text-center">
                    No tests completed yet.
                    {" "}
                    <Link href="/tests" className="text-purple-400 underline hover:text-purple-300">View tests →</Link>
                  </p>
                )}
              </div>
            )}

            {/* ── Tab: Training Log ── */}
            {activeTab === "training" && (
              <TrainingLogTab trainingThisWeek={client.trainingThisWeek} />
            )}

            {/* ── Tab: Profile ── */}
            {activeTab === "profile" && (
              <ProfileTab profile={client.profile} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Training log helpers ───────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","the","is","it","and","i","my","to","of","was","that","were","with","for",
  "so","not","but","in","on","at","be","by","as","an","or","if","do","no","we",
  "up","out","had","have","has","did","get","got","just","its","im","me","they",
  "our","he","she","us","you","your","this","from","are","all","can","when",
  "what","how","really","very","too","also","about","their","there","then",
]);

function extractTopics(texts: string[]): string[] {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    for (const word of t.toLowerCase().split(/\W+/)) {
      if (word.length < 3 || STOP_WORDS.has(word)) continue;
      freq[word] = (freq[word] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

/** 7 days Mon–Sun for the current week. Returns YYYY-MM-DD strings (local TZ). */
const currentWeekDays = (): string[] => currentWeekDaysLocal();

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MoodSparkline({ entries, weekDays }: { entries: TrainingEntry[]; weekDays: string[] }) {
  const byDate = new Map(entries.map((e) => [e.entry_date, e]));
  return (
    <div className="flex items-end gap-1.5 h-8">
      {weekDays.map((d, i) => {
        const e = byDate.get(d);
        const mood = e?.mood_rating ?? null;
        const pct = mood !== null ? (mood / 10) : 0;
        const height = mood !== null ? Math.max(4, Math.round(pct * 32)) : 4;
        const color = mood === null ? "bg-white/10"
          : mood >= 7 ? "bg-emerald-400"
          : mood >= 5 ? "bg-amber-400"
          : "bg-rose-400";
        return (
          <div key={d} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className={`w-full rounded-sm ${color} transition-all`}
              style={{ height: `${height}px` }}
              title={`${DAY_LABELS[i]}: ${mood !== null ? `${mood}/10` : "no entry"}`}
            />
            <span className="font-saira text-[8px] text-zinc-600">{DAY_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrainingLogTab({ trainingThisWeek }: { trainingThisWeek: TrainingEntry[] }) {
  const weekDays = React.useMemo(() => currentWeekDays(), []);
  const trainingDays = trainingThisWeek.filter((e) => e.is_training_day).length;
  const moodValues = trainingThisWeek
    .map((e) => e.mood_rating)
    .filter((m): m is number => m !== null);
  const avgMood = moodValues.length
    ? (moodValues.reduce((s, v) => s + v, 0) / moodValues.length).toFixed(1)
    : null;

  const allMoodValues = moodValues;
  const moodTrend = allMoodValues.length >= 2
    ? allMoodValues[allMoodValues.length - 1] > allMoodValues[0] ? "up"
      : allMoodValues[allMoodValues.length - 1] < allMoodValues[0] ? "down"
      : "flat"
    : "flat";

  const beforeTexts = trainingThisWeek.map((e) => e.thoughts_before ?? "").filter(Boolean);
  const afterTexts  = trainingThisWeek.map((e) => e.thoughts_after ?? "").filter(Boolean);
  const nextTexts   = trainingThisWeek.map((e) => e.next_session ?? "").filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Week summary */}
      <div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-3">
          Week Summary
        </p>
        <div className="rounded-2xl border border-white/5 bg-[#0D0F14] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-saira">
            <span className="text-zinc-400">Training days</span>
            <span className="font-semibold text-white">{trainingDays}/7</span>
          </div>
          {avgMood !== null && (
            <div className="flex items-center justify-between text-xs font-saira">
              <span className="text-zinc-400">Avg mood</span>
              <span className={`font-semibold ${
                parseFloat(avgMood) >= 7 ? "text-emerald-300"
                : parseFloat(avgMood) >= 5 ? "text-amber-300"
                : "text-rose-300"
              }`}>{avgMood}/10</span>
            </div>
          )}
          <MoodSparkline entries={trainingThisWeek} weekDays={weekDays} />
        </div>
      </div>

      {/* Daily log */}
      {trainingThisWeek.length > 0 && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-3">
            Daily Log
          </p>
          <div className="space-y-3">
            {trainingThisWeek.map((e, idx) => {
              const dateObj = new Date(e.entry_date + "T12:00:00");
              const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
              const dayNum  = dateObj.getDate();
              return (
                <div key={e.id} className="rounded-xl border border-white/5 bg-[#0D0F14] p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-saira text-xs font-semibold text-zinc-300">
                      Day {idx + 1} · {dayName} {dayNum}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.12em] ${
                      e.is_training_day
                        ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                        : "border-zinc-600/40 bg-zinc-600/10 text-zinc-400"
                    }`}>
                      {e.is_training_day ? "Training" : "Rest"}
                    </span>
                    {e.mood_rating !== null && (
                      <span className={`font-saira text-[10px] font-semibold ${
                        e.mood_rating >= 7 ? "text-emerald-400"
                        : e.mood_rating >= 5 ? "text-amber-400"
                        : "text-rose-400"
                      }`}>
                        Mood: {e.mood_rating}/10
                      </span>
                    )}
                  </div>
                  {e.is_training_day && (
                    <div className="space-y-1.5 mt-2">
                      {(
                        [
                          ["Before", e.thoughts_before],
                          ["After",  e.thoughts_after],
                          ["Went well", e.what_went_well],
                          ["Frustrations", e.frustrations],
                          ["Next session", e.next_session],
                        ] as [string, string | null][]
                      ).map(([label, val]) =>
                        val ? (
                          <div key={label} className="flex gap-2">
                            <span className="font-saira text-[10px] uppercase tracking-[0.12em] text-zinc-600 w-20 flex-shrink-0 pt-0.5">
                              {label}
                            </span>
                            <span className="font-saira text-xs text-zinc-300 leading-snug">
                              {val.length > 80 ? val.slice(0, 80) + "…" : val}
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  {!e.is_training_day && e.next_session && (
                    <p className="font-saira text-xs text-zinc-400 mt-1 leading-snug">
                      {e.next_session.length > 80 ? e.next_session.slice(0, 80) + "…" : e.next_session}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly brief */}
      <div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-3">
          Weekly Brief
        </p>
        <div className="rounded-2xl border border-white/5 bg-[#0D0F14] p-4 space-y-2">
          <BriefLine>
            Mood trend: <span className={
              moodTrend === "up" ? "text-emerald-300"
              : moodTrend === "down" ? "text-rose-300"
              : "text-zinc-400"
            }>{moodTrend === "up" ? "↑ Up" : moodTrend === "down" ? "↓ Down" : "→ Flat"}</span>
          </BriefLine>
          <BriefLine>
            Training days: <span className="text-zinc-200 font-semibold">{trainingDays} this week</span>
          </BriefLine>
          {beforeTexts.length > 0 && (
            <BriefLine>
              Pre-session themes:{" "}
              <span className="text-zinc-300">{extractTopics(beforeTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {afterTexts.length > 0 && (
            <BriefLine>
              Post-session themes:{" "}
              <span className="text-zinc-300">{extractTopics(afterTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {nextTexts.length > 0 && (
            <BriefLine>
              Recurring focus:{" "}
              <span className="text-zinc-300">{extractTopics(nextTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {trainingThisWeek.length === 0 && (
            <p className="font-saira text-xs text-zinc-600">No training entries logged this week.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-saira text-xs text-zinc-500 leading-snug">
      — {children}
    </p>
  );
}

function ScoreCard({ label, value, sub, flag, small = false }: {
  label: string; value: string; sub: string; flag: string; small?: boolean;
}) {
  const color = flag === "emerald" ? "text-emerald-300"
    : flag === "rose" ? "text-rose-300"
    : flag === "amber" ? "text-amber-300"
    : "text-sky-300";
  return (
    <div className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
      <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1">{label}</p>
      <p className={`font-saira ${small ? "text-xs" : "text-base"} font-bold leading-tight ${color}`}>
        {value}
        {sub && <span className="text-[10px] font-normal text-zinc-600 ml-1">{sub}</span>}
      </p>
    </div>
  );
}

function MiniStat({ label, value, color = "text-zinc-100" }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`font-saira text-lg font-extrabold ${color}`}>{value}</p>
      <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-600 mt-0.5">{label}</p>
    </div>
  );
}

// ── Roster summary bar ─────────────────────────────────────────────────────────

function RosterSummary({ clients }: { clients: Client[] }) {
  const attention    = clients.filter((c) => c.flag === "attention").length;
  const monitor      = clients.filter((c) => c.flag === "monitor").length;
  const stable       = clients.filter((c) => c.flag === "stable").length;
  const avgPositive  = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.positiveRate, 0) / clients.length)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      <SummaryTile value={String(clients.length)}  label="Athletes"          color="text-zinc-100"     />
      <SummaryTile value={String(attention)}        label="Attention"         color="text-rose-300"    dot="bg-rose-400"    />
      <SummaryTile value={String(monitor)}          label="Monitor"           color="text-amber-300"   dot="bg-amber-400"   />
      <SummaryTile value={String(stable)}           label="On track"          color="text-emerald-300" dot="bg-emerald-400" />
      <SummaryTile value={`${avgPositive}%`}        label="Avg positive · 7d" color="text-purple-300"  />
    </div>
  );
}

function SummaryTile({ value, label, color, dot }: { value: string; label: string; color: string; dot?: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#0C0E13] p-4 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {dot && <div className={`w-2 h-2 rounded-full ${dot}`} />}
        <p className={`font-saira text-2xl font-extrabold ${color}`}>{value}</p>
      </div>
      <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-600 mt-1">{label}</p>
    </div>
  );
}

// ── Invite link panel ──────────────────────────────────────────────────────────

function InvitePanel({ coachCode }: { coachCode: string }) {
  const [copied, setCopied] = React.useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/join/${coachCode}`
    : `/join/${coachCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="mb-8 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-300 mb-1">
            Your athlete invite link
          </p>
          <p className="font-saira text-xs text-zinc-400 font-mono truncate">{url}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`flex-shrink-0 rounded-full border px-4 py-1.5 font-saira text-[11px] font-semibold transition ${
            copied
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-purple-400/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
          }`}
        >
          {copied ? "✓ Copied!" : "Copy link"}
        </button>
      </div>
      <p className="mt-2 font-saira text-[10px] text-zinc-600">
        Share this link with your athletes. They sign in with Google and their journal is linked to your dashboard automatically.
      </p>
    </div>
  );
}

// ── Coach header ───────────────────────────────────────────────────────────────

function CoachHeader({ profile }: { profile: CoachProfile }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-8 h-8 rounded-full border border-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-saira text-xs font-bold text-purple-300">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-saira text-xs font-semibold text-zinc-200">{profile.display_name}</p>
          <p className="font-saira text-[10px] text-zinc-600">Coach</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/guide"
          className="font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition"
        >
          📖 Guide
        </Link>
        <a
          href="/auth/sign-out"
          className="font-saira text-[10px] text-zinc-700 hover:text-zinc-400 transition underline underline-offset-2"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}

// ── Sort helpers ───────────────────────────────────────────────────────────────

type SortKey = "flag" | "positive" | "entries" | "name";

function sortClients(clients: Client[], sort: SortKey): Client[] {
  const flagOrder: Record<Flag, number> = { attention: 0, monitor: 1, stable: 2 };
  return [...clients].sort((a, b) => {
    if (sort === "flag")     return flagOrder[a.flag] - flagOrder[b.flag];
    if (sort === "positive") return a.positiveRate - b.positiveRate;
    if (sort === "entries")  return b.entriesThisWeek - a.entriesThisWeek;
    if (sort === "name")     return a.name.localeCompare(b.name);
    return 0;
  });
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const [clients, setClients]   = React.useState<Client[]>([]);
  const [profile, setProfile]   = React.useState<CoachProfile | null>(null);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<string | null>(null);
  const [sort, setSort]         = React.useState<SortKey>("flag");
  const [search, setSearch]     = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const [profileRes, athletesRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/coach/athletes"),
        ]);

        if (!profileRes.ok || !athletesRes.ok) {
          setError("Couldn't load data. Please refresh.");
          return;
        }

        const prof: CoachProfile = await profileRes.json();
        if (prof.role !== "coach") {
          setError("This dashboard is for coaches only.");
          return;
        }

        const athletes: AthleteRaw[] = await athletesRes.json();
        setProfile(prof);
        setClients(athletes.map(computeClient));
      } catch {
        setError("Network error — please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
    return sortClients(base, sort);
  }, [clients, sort, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.11),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
              PowerFlow · Coach
            </p>
            <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
              Athlete Overview
            </h1>
            <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
              Monitor your athletes' mental state, self-talk patterns, and test results in one place.
            </p>
          </div>
          <div className="flex gap-3 self-start mt-1">
            <Link href="/journal" className="rounded-full border border-white/10 px-4 py-2 font-saira text-[11px] text-zinc-400 hover:border-purple-400/50 hover:text-zinc-200 transition">
              My journal
            </Link>
            <Link href="/tests" className="rounded-full border border-white/10 px-4 py-2 font-saira text-[11px] text-zinc-400 hover:border-purple-400/50 hover:text-zinc-200 transition">
              Tests
            </Link>
          </div>
        </div>

        {/* Coach profile header */}
        {profile && <CoachHeader profile={profile} />}

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="font-saira text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Invite link */}
        {profile?.coach_code && <InvitePanel coachCode={profile.coach_code} />}

        {/* Roster summary */}
        {clients.length > 0 && <RosterSummary clients={clients} />}

        {/* Empty state */}
        {!error && clients.length === 0 && (
          <div className="rounded-3xl border border-white/5 bg-[#0F1117] p-14 text-center mb-8">
            <p className="font-saira text-3xl mb-4">👥</p>
            <p className="font-saira text-sm font-semibold text-zinc-300 mb-2">No athletes connected yet</p>
            <p className="font-saira text-xs text-zinc-600 max-w-xs mx-auto mb-6">
              Share your invite link above with athletes. Once they accept and log in, their journal and test data will appear here.
            </p>
            {profile?.coach_code && (
              <p className="font-saira text-xs text-purple-400 font-mono">/join/{profile.coach_code}</p>
            )}
          </div>
        )}

        {/* Controls */}
        {clients.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes…"
              className="rounded-xl border border-zinc-700/70 bg-[#13151A] px-4 py-2 font-saira text-sm text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30 w-52"
            />
            <div className="flex gap-1.5 ml-auto">
              <span className="font-saira text-[10px] text-zinc-600 self-center mr-1 uppercase tracking-[0.18em]">Sort</span>
              {([
                { key: "flag",     label: "Priority" },
                { key: "positive", label: "Positive %" },
                { key: "entries",  label: "Activity" },
                { key: "name",     label: "Name" },
              ] as { key: SortKey; label: string }[]).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.13em] transition ${
                    sort === s.key
                      ? "border-purple-400 bg-purple-500/20 text-white"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Client list */}
        <div className="space-y-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
          {clients.length > 0 && filtered.length === 0 && (
            <p className="font-saira text-sm text-zinc-600 text-center py-10">No athletes match your search.</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link href="/journal" className="font-saira text-[11px] text-zinc-700 underline decoration-zinc-700 hover:text-zinc-400 transition">
            Open your own journal →
          </Link>
        </div>
      </div>
    </div>
  );
}
