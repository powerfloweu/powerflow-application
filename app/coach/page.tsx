"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomSheet from "@/app/components/BottomSheet";
import EntryCard from "@/app/components/EntryCard";
import TagChip from "@/app/components/TagChip";
import { THEME_DEFS, detectSentiment, type Sentiment, type Context } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";
import { weekDays as currentWeekDaysLocal } from "@/lib/date";
import { weekLabel, type WeeklyCheckin, type MonthlyCheckin } from "@/lib/weeklyCheckin";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import NotificationModal, { type NotificationState } from "@/app/components/NotificationModal";

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
  role: "athlete" | "coach";
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
  affirmations: string[] | null;
  viz_keywords: Record<string, string[]> | null;
  // activity data
  entries: EntryRow[];
  sat: SatRow[];
  acsi: AcsiRow[];
  csai: CsaiRow[];
  das: DasRow[];
  training_entries: TrainingEntry[];
  all_training_entries: TrainingEntry[];
  feedbackByEntryId: Record<string, { id: string; content: string; created_at: string }>;
  weekly_checkins: WeeklyCheckin[];
  monthly_checkins: MonthlyCheckin[];
  assigned_tests: { id: string; test_slug: string; assigned_at: string }[];
};

type CoachProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_code: string | null;
  stripe_coach_sub_id?: string | null;
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

  // Flatten all text from a training log entry into a single searchable string.
  // Defined early so both sentiment detection and theme detection can use it.
  const trainingText = (e: { thoughts_before?: string | null; thoughts_after?: string | null; what_went_well?: string | null; frustrations?: string | null; next_session?: string | null }) =>
    [e.thoughts_before, e.thoughts_after, e.what_went_well, e.frustrations, e.next_session]
      .filter(Boolean).join(" ").toLowerCase();

  // Training logs with at least one content field filled in
  const trainingLogsWithContent = a.all_training_entries.filter((e) =>
    e.thoughts_before || e.thoughts_after || e.what_went_well || e.frustrations || e.next_session,
  );
  const weekTrainingLogs = trainingLogsWithContent.filter(
    (e) => new Date(e.entry_date + "T12:00:00") >= cutWeek,
  );

  // Training logs carry no stored sentiment — auto-detect from their text so they
  // contribute to the positiveRate. Without this, athletes who only log training
  // days (never the free-form journal) always show 0% even with upbeat entries.
  const prevTrainingLogsRaw = trainingLogsWithContent.filter(
    (e) => new Date(e.entry_date + "T12:00:00") >= cutPrev && new Date(e.entry_date + "T12:00:00") < cutWeek,
  );

  const weekAllSentiments: Sentiment[] = [
    ...weekEntries.map((e) => e.sentiment),
    ...weekTrainingLogs.map((e) => detectSentiment(trainingText(e))),
  ];
  const prevAllSentiments: Sentiment[] = [
    ...prevEntries.map((e) => e.sentiment),
    ...prevTrainingLogsRaw.map((e) => detectSentiment(trainingText(e))),
  ];

  const positiveRate = weekAllSentiments.length
    ? Math.round(weekAllSentiments.filter((s) => s === "positive").length / weekAllSentiments.length * 100)
    : 0;

  const prevPositiveRate = prevAllSentiments.length
    ? Math.round(prevAllSentiments.filter((s) => s === "positive").length / prevAllSentiments.length * 100)
    : positiveRate;

  const trend: Trend = positiveRate > prevPositiveRate + 10 ? "up"
    : positiveRate < prevPositiveRate - 10 ? "down"
    : "stable";

  const flag: Flag = positiveRate < 30 ? "attention" : positiveRate < 55 ? "monitor" : "stable";

  // 7-day daily positive % — journal entries + training logs combined
  const sentimentWeek = Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekAgo(6 - i);
    const dayEnd   = weekAgo(6 - i - 1);
    const dayJ = a.entries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= dayStart && d < (i === 6 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : dayEnd);
    });
    const dayT = trainingLogsWithContent.filter((e) => {
      const d = new Date(e.entry_date + "T12:00:00");
      return d >= dayStart && d < (i === 6 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : dayEnd);
    });
    const allDay: Sentiment[] = [
      ...dayJ.map((e) => e.sentiment),
      ...dayT.map((e) => detectSentiment(trainingText(e))),
    ];
    if (!allDay.length) return 0;
    return Math.round(allDay.filter((s) => s === "positive").length / allDay.length * 100);
  });

  // Themes — journal entries + training logs both contribute
  const themes = THEME_DEFS.map((def) => {
    const weekCount =
      weekEntries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      weekTrainingLogs.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    const prevTrainingLogs = trainingLogsWithContent.filter(
      (e) => new Date(e.entry_date + "T12:00:00") >= cutPrev && new Date(e.entry_date + "T12:00:00") < cutWeek,
    );
    const prevCount =
      prevEntries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      prevTrainingLogs.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    return {
      label: def.label,
      count: weekCount,
      trend: (weekCount > prevCount + 1 ? "up" : weekCount < prevCount - 1 ? "down" : "stable") as Trend,
      color: def.color,
    };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // All-time themes — journal + all training logs with content
  const allThemes = THEME_DEFS.map((def) => {
    const count =
      a.entries.filter((e) => def.keywords.some((kw) => e.content.toLowerCase().includes(kw))).length +
      trainingLogsWithContent.filter((e) => def.keywords.some((kw) => trainingText(e).includes(kw))).length;
    return { label: def.label, count };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // Last active — whichever is more recent: journal entry or training log
  const lastJournalTime  = a.entries[0] ? new Date(a.entries[0].created_at).getTime() : 0;
  const lastTrainingTime = trainingLogsWithContent.length
    ? Math.max(...trainingLogsWithContent.map((e) => new Date(e.updated_at).getTime()))
    : 0;
  const lastActivityTime = Math.max(lastJournalTime, lastTrainingTime);
  // Return a structured code instead of a hardcoded English string so it can be translated in JSX
  let lastActive: { key: "never" } | { key: "justNow" } | { key: "hoursAgo"; h: number } | { key: "yesterday" } | { key: "daysAgo"; d: number } = { key: "never" };
  if (lastActivityTime > 0) {
    const diffMs = now.getTime() - lastActivityTime;
    const diffH  = Math.floor(diffMs / 3600000);
    const diffD  = Math.floor(diffMs / 86400000);
    lastActive = diffH < 1 ? { key: "justNow" }
      : diffH < 24 ? { key: "hoursAgo", h: diffH }
      : diffD === 1 ? { key: "yesterday" }
      : { key: "daysAgo", d: diffD };
  }

  return {
    id: a.id,
    name: a.display_name,
    displayName: a.display_name,
    initials: a.display_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2),
    avatarUrl: a.avatar_url,
    flag,
    positiveRate,
    trend,
    entriesThisWeek: weekEntries.length + weekTrainingLogs.length,
    entries7d: weekEntries.length + weekTrainingLogs.length,
    sentimentWeek,
    themes,
    allThemes,
    allEntries: a.entries,
    allTrainingWithContent: trainingLogsWithContent,
    allContentCount: a.entries.length + trainingLogsWithContent.length,
    recentEntries: a.entries.slice(0, 5),
    testScores: { sat: a.sat, acsi: a.acsi, csai: a.csai, das: a.das },
    lastActive,
    joinedAt: a.created_at,
    trainingThisWeek: a.training_entries,
    allTrainingEntries: a.all_training_entries,
    feedbackByEntryId: a.feedbackByEntryId,
    weeklyCheckins: a.weekly_checkins,
    monthlyCheckins: a.monthly_checkins ?? [],
    assignedTestSlugs: (a.assigned_tests ?? []).map((t) => t.test_slug),
    isCoach: a.role === "coach",
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
      affirmations: a.affirmations ?? [],
      viz_keywords: a.viz_keywords ?? {},
      athleteId: a.id,
    },
  };
}

type Client = ReturnType<typeof computeClient>;

// ── Visual helpers ─────────────────────────────────────────────────────────────

const FLAG_CONFIG: Record<Flag, { labelKey: string; dot: string; text: string; bg: string; border: string }> = {
  attention: { labelKey: "coach.flagAttention", dot: "bg-rose-400",    text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
  monitor:   { labelKey: "coach.flagMonitor",   dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  stable:    { labelKey: "coach.flagStable",    dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};


const TREND_ICON:  Record<Trend, string> = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR: Record<Trend, string> = { up: "text-emerald-400", down: "text-rose-400", stable: "text-zinc-300" };

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

function ProfileField({ label, value, href }: { label: string; value: string | number | null | undefined; href?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-0.5">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-saira text-xs text-purple-400 hover:text-purple-300 transition"
        >
          {String(value)}
        </a>
      ) : (
        <p className="font-saira text-xs text-zinc-300 leading-relaxed">{String(value)}</p>
      )}
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

function MentalToolsEditor({ profile }: { profile: ReturnType<typeof computeClient>["profile"] }) {
  const { t } = useT();
  const [editingAff, setEditingAff] = React.useState(false);
  const [affDrafts, setAffDrafts]   = React.useState<[string, string, string]>(["", "", ""]);
  const [editingKw, setEditingKw]   = React.useState(false);
  const [kwDrafts, setKwDrafts]     = React.useState({ squat: "", bench: "", deadlift: "" });
  const [saving, setSaving]         = React.useState(false);

  const startEditAff = () => {
    const a = profile.affirmations ?? [];
    setAffDrafts([a[0] ?? "", a[1] ?? "", a[2] ?? ""]);
    setEditingAff(true);
  };

  const startEditKw = () => {
    const kw = profile.viz_keywords ?? {};
    setKwDrafts({
      squat:    (kw["viz-squat"]    ?? []).join(", "),
      bench:    (kw["viz-bench"]    ?? []).join(", "),
      deadlift: (kw["viz-deadlift"] ?? []).join(", "),
    });
    setEditingKw(true);
  };

  const saveAff = async () => {
    setSaving(true);
    const affirmations = affDrafts.map((s) => s.trim()).filter(Boolean);
    await fetch("/api/coach/athletes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId: profile.athleteId, affirmations }),
    });
    profile.affirmations = affirmations;
    setSaving(false);
    setEditingAff(false);
  };

  const saveKw = async () => {
    setSaving(true);
    const parse = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);
    const viz_keywords = {
      ...(profile.viz_keywords ?? {}),
      "viz-squat":    parse(kwDrafts.squat),
      "viz-bench":    parse(kwDrafts.bench),
      "viz-deadlift": parse(kwDrafts.deadlift),
    };
    await fetch("/api/coach/athletes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId: profile.athleteId, viz_keywords }),
    });
    profile.viz_keywords = viz_keywords;
    setSaving(false);
    setEditingKw(false);
  };

  return (
    <div className="space-y-3">
      {/* Affirmations */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-saira text-[10px] text-zinc-400">{t("coach.affirmationsLabel")}</p>
          {!editingAff && (
            <button onClick={startEditAff} className="font-saira text-[10px] text-purple-400 hover:text-purple-300 transition">
              {t("coach.editBtn")}
            </button>
          )}
        </div>
        {editingAff ? (
          <div className="space-y-1.5">
            {([0, 1, 2] as const).map((i) => (
              <input
                key={i}
                value={affDrafts[i]}
                onChange={(e) => { const d = [...affDrafts] as [string,string,string]; d[i] = e.target.value; setAffDrafts(d); }}
                placeholder={t("coach.affirmationPlaceholder").replace("{n}", String(i + 1))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-purple-400/50"
              />
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={saveAff} disabled={saving} className="rounded-lg bg-purple-500 px-3 py-1 font-saira text-[10px] uppercase tracking-wider text-white hover:bg-purple-400 disabled:opacity-50 transition">
                {saving ? t("coach.savingNote") : t("coach.saveNote")}
              </button>
              <button onClick={() => setEditingAff(false)} className="font-saira text-[10px] text-zinc-300 hover:text-zinc-300 transition">
                {t("coach.cancelBtn")}
              </button>
            </div>
          </div>
        ) : profile.affirmations?.length ? (
          <ol className="space-y-1">
            {profile.affirmations.map((a, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="font-saira text-[10px] text-purple-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="font-saira text-sm text-zinc-200">{a}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="font-saira text-sm text-zinc-400">{t("coach.notSetShort")}</p>
        )}
      </div>

      {/* Viz keywords */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-saira text-[10px] text-zinc-400">{t("coach.sbdCueWords")}</p>
          {!editingKw && (
            <button onClick={startEditKw} className="font-saira text-[10px] text-purple-400 hover:text-purple-300 transition">
              {t("coach.editBtn")}
            </button>
          )}
        </div>
        {editingKw ? (
          <div className="space-y-2">
            {(["squat", "bench", "deadlift"] as const).map((lift) => (
              <div key={lift}>
                <label className="block font-saira text-[10px] text-zinc-400 mb-1 capitalize">{t("coach.liftCuesLabel").replace("{lift}", lift)} <span className="text-zinc-500">{t("coach.cuesSeparatorHint")}</span></label>
                <input
                  value={kwDrafts[lift]}
                  onChange={(e) => setKwDrafts((p) => ({ ...p, [lift]: e.target.value }))}
                  placeholder={t("coach.cueWordsPlaceholder")}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-purple-400/50"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={saveKw} disabled={saving} className="rounded-lg bg-purple-500 px-3 py-1 font-saira text-[10px] uppercase tracking-wider text-white hover:bg-purple-400 disabled:opacity-50 transition">
                {saving ? t("coach.savingNote") : t("coach.saveNote")}
              </button>
              <button onClick={() => setEditingKw(false)} className="font-saira text-[10px] text-zinc-300 hover:text-zinc-300 transition">
                {t("coach.cancelBtn")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(["viz-squat", "viz-bench", "viz-deadlift"] as const).map((toolId) => {
              const label = toolId === "viz-squat" ? "Squat" : toolId === "viz-bench" ? "Bench" : "Deadlift";
              const kws = profile.viz_keywords?.[toolId] ?? [];
              return (
                <div key={toolId}>
                  <p className="font-saira text-[10px] text-zinc-500 mb-1">{label}</p>
                  {kws.length ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {kws.map((kw, i) => (
                        <span key={i} className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 font-saira text-xs text-purple-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-saira text-xs text-zinc-500">{t("coach.notSetShort")}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Check-ins tab ─────────────────────────────────────────────────────────────

function CheckinsTab({
  checkins,
  monthlyCheckins,
}: {
  checkins: WeeklyCheckin[];
  monthlyCheckins: MonthlyCheckin[];
}) {
  const { t } = useT();
  const [expandedWeeks, setExpandedWeeks] = React.useState<Set<string>>(new Set());

  // Merge weekly + monthly into one list, sorted newest-first
  type Row =
    | { kind: "weekly";  data: WeeklyCheckin }
    | { kind: "monthly"; data: MonthlyCheckin };

  const rows: Row[] = [
    ...checkins.map((d): Row => ({ kind: "weekly", data: d })),
    ...monthlyCheckins.map((d): Row => ({ kind: "monthly", data: d })),
  ].sort((a, b) => {
    if (b.data.year !== a.data.year) return b.data.year - a.data.year;
    return b.data.week_number - a.data.week_number;
  });

  if (!rows.length) {
    return (
      <p className="font-saira text-sm text-zinc-400 py-6 text-center">
        {t("coach.noCheckinsYet")}
      </p>
    );
  }

  const ratingColor = (v: number) =>
    v >= 8 ? "text-emerald-400" : v >= 5 ? "text-purple-300" : "text-rose-400";

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const ci = row.data;
        const key = `${row.kind}-${ci.year}-${ci.week_number}`;
        const isExpanded = expandedWeeks.has(key);
        const label = weekLabel(ci.week_number, ci.week_start);
        const avg = Math.round(
          ((ci.mood_rating + ci.training_quality + ci.readiness_rating + ci.energy_rating + ci.sleep_rating) / 5) * 10,
        ) / 10;
        const avgColor = avg >= 7.5 ? "text-emerald-400" : avg >= 5 ? "text-purple-300" : "text-rose-400";
        const isMonthly = row.kind === "monthly";

        return (
          <div
            key={key}
            className={`rounded-xl border overflow-hidden ${
              isMonthly ? "border-amber-500/25 bg-amber-500/[0.04]" : "border-white/6 bg-surface-section"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedWeeks((prev) => {
                const next = new Set(prev);
                isExpanded ? next.delete(key) : next.add(key);
                return next;
              })}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isMonthly && (
                  <span className="flex-shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-saira text-[8px] font-bold uppercase tracking-[0.18em] text-amber-400">
                    {t("coach.monthlyBadge")}
                  </span>
                )}
                <span className="font-saira text-[11px] font-semibold text-zinc-300 truncate">{label}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`font-saira text-sm font-bold tabular-nums ${avgColor}`}>{avg.toFixed(1)}</span>
                <svg viewBox="0 0 16 16" className={`w-3 h-3 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none">
                  <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {/* Weekly ratings (both types) */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: t("coach.ciMood"),      v: ci.mood_rating },
                    { label: t("coach.ciTraining"),  v: ci.training_quality },
                    { label: t("coach.ciEnergy"),    v: ci.energy_rating },
                    { label: t("coach.ciSleep"),     v: ci.sleep_rating },
                    { label: t("coach.ciReadiness"), v: ci.readiness_rating },
                  ].map(({ label: rl, v }) => (
                    <div key={rl} className="text-center">
                      <p className={`font-saira text-lg font-extrabold tabular-nums ${ratingColor(v)}`}>{v}</p>
                      <p className="font-saira text-[9px] uppercase tracking-[0.12em] text-zinc-400 leading-tight">{rl}</p>
                    </div>
                  ))}
                </div>

                {/* Weekly reflection fields */}
                {ci.biggest_win && (
                  <div>
                    <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-400 mb-1">{t("coach.ciBiggestWin")}</p>
                    <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.biggest_win}</p>
                  </div>
                )}
                {ci.biggest_challenge && (
                  <div>
                    <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-400 mb-1">{t("coach.ciMainChallenge")}</p>
                    <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.biggest_challenge}</p>
                  </div>
                )}
                {ci.focus_next_week && (
                  <div>
                    <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-400 mb-1">{t("coach.ciFocusNextWeek")}</p>
                    <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.focus_next_week}</p>
                  </div>
                )}

                {/* Monthly-specific fields */}
                {isMonthly && (() => {
                  const mc = (row as { kind: "monthly"; data: MonthlyCheckin }).data;
                  return (
                    <>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 h-px bg-amber-500/20" />
                        <span className="font-saira text-[8px] font-bold uppercase tracking-[0.2em] text-amber-400/60">{t("coach.monthlyDivider")}</span>
                        <div className="flex-1 h-px bg-amber-500/20" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className={`font-saira text-lg font-extrabold tabular-nums ${ratingColor(mc.overall_progress)}`}>{mc.overall_progress}</p>
                          <p className="font-saira text-[9px] uppercase tracking-[0.12em] text-zinc-400 leading-tight">{t("coach.ciProgress")}</p>
                        </div>
                      </div>
                      {mc.biggest_breakthrough && (
                        <div>
                          <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-amber-400/70 mb-1">{t("coach.ciBiggestBreakthrough")}</p>
                          <p className="font-saira text-xs text-zinc-300 leading-relaxed">{mc.biggest_breakthrough}</p>
                        </div>
                      )}
                      {mc.key_lesson && (
                        <div>
                          <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-amber-400/70 mb-1">{t("coach.ciKeyLesson")}</p>
                          <p className="font-saira text-xs text-zinc-300 leading-relaxed">{mc.key_lesson}</p>
                        </div>
                      )}
                      {mc.next_month_intention && (
                        <div>
                          <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-amber-400/70 mb-1">{t("coach.ciNextMonthIntention")}</p>
                          <p className="font-saira text-xs text-zinc-300 leading-relaxed">{mc.next_month_intention}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileTab({ profile }: { profile: ReturnType<typeof computeClient>["profile"] }) {
  const { t } = useT();
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
      <p className="font-saira text-sm text-zinc-400 py-6 text-center">
        {t("coach.onboardingIncomplete")}
      </p>
    );
  }

  return (
    <div className="space-y-6">

      {/* Mental tools */}
      <div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-400 mb-3">
          {t("coach.sectionMentalTools")}
        </p>
        <MentalToolsEditor profile={profile} />
      </div>

      {/* Personal & sport */}
      {hasBio && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            {t("coach.sectionPersonalSport")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ProfileField label={t("coach.pfGender")} value={profile.gender} />
            <ProfileField
              label={t("coach.pfInstagram")}
              value={profile.instagram ? `@${profile.instagram.replace(/^@/, "")}` : null}
              href={profile.instagram ? `https://instagram.com/${profile.instagram.replace(/^@/, "")}` : undefined}
            />
            <ProfileField label={t("coach.pfFederation")} value={profile.federation} />
            <ProfileField label={t("coach.pfYearsInSport")} value={profile.years_powerlifting} />
            <ProfileField label={t("coach.pfBodyweight")} value={profile.bodyweight_kg ? `${profile.bodyweight_kg} kg` : null} />
            <ProfileField label={t("coach.pfWeightClass")} value={profile.weight_category} />
            <ProfileField label={t("coach.pfNextMeet")} value={profile.meet_date} />
            <ProfileField label={t("coach.pfTrainingDays")} value={profile.training_days_per_week} />
          </div>
        </div>
      )}

      {/* Lifts */}
      {hasLifts && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            {t("coach.sectionLifts")}
          </p>
          <div className="space-y-2">
            {(
              [
                [t("you.squat"),    profile.squat_current_kg,    profile.squat_goal_kg],
                [t("you.bench"),    profile.bench_current_kg,    profile.bench_goal_kg],
                [t("you.deadlift"), profile.deadlift_current_kg, profile.deadlift_goal_kg],
              ] as [string, number | null, number | null][]
            )
              .filter(([, cur, goal]) => cur || goal)
              .map(([label, cur, goal]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-300 w-16 flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-saira text-sm font-bold text-white">
                    {cur ? `${cur} kg` : "—"}
                  </span>
                  {goal && (
                    <span className="font-saira text-[10px] text-zinc-300">
                      {t("coach.liftGoal").replace("{n}", String(goal))}
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
            {t("coach.sectionMentalGoals")}
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
            {t("coach.sectionSelfAssessment")}
          </p>
          <div className="space-y-3">
            <ScaleBar label={t("coach.pfConfidenceReg")}    value={profile.self_confidence_reg} />
            <ScaleBar label={t("coach.pfFocusFatigue")}     value={profile.self_focus_fatigue} />
            <ScaleBar label={t("coach.pfHandlingPressure")} value={profile.self_handling_pressure} />
            <ScaleBar label={t("coach.pfCompAnxiety")}      value={profile.self_competition_anxiety} />
            <ScaleBar label={t("coach.pfEmotionalRecovery")} value={profile.self_emotional_recovery} />
          </div>
        </div>
      )}

      {/* Open mindset questions */}
      {hasMindset && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            {t("coach.sectionMindsetAssessment")}
          </p>
          <div className="space-y-4">
            <ProfileField label={t("coach.pfMainBarrier")}         value={profile.main_barrier} />
            <ProfileField label={t("coach.pfConfidenceBreak")}    value={profile.confidence_break} />
            <ProfileField label={t("coach.pfOverthinking")}        value={profile.overthinking_focus} />
            <ProfileField label={t("coach.pfPreviousMentalWork")} value={profile.previous_mental_work} />
          </div>
        </div>
      )}

      {/* Goals & context */}
      {(profile.expectations || profile.previous_tools || profile.anything_else) && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
            {t("coach.sectionGoalsContext")}
          </p>
          <div className="space-y-4">
            <ProfileField label={t("coach.pfExpectations")}    value={profile.expectations} />
            <ProfileField label={t("coach.pfPreviousTools")} value={profile.previous_tools} />
            <ProfileField label={t("coach.pfAnythingElse")}  value={profile.anything_else} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pattern Analysis component ─────────────────────────────────────────────────

// Map theme labels to i18n keys (used in JSX via t())
const THEME_DESC_KEYS: Record<string, string> = {
  "Perfectionism":    "coach.themeDescPerfectionism",
  "Confidence":       "coach.themeDescConfidence",
  "Pre-comp anxiety": "coach.themeDescPrecompAnxiety",
  "Focus & flow":     "coach.themeDescFocusFlow",
  "Motivation":       "coach.themeDescMotivation",
  "Self-doubt":       "coach.themeDescSelfDoubt",
};

const CONVERSATION_STARTER_KEYS: Record<string, string> = {
  "Perfectionism":    "coach.starterPerfectionism",
  "Pre-comp anxiety": "coach.starterPrecompAnxiety",
  "Self-doubt":       "coach.starterSelfDoubt",
  "Confidence":       "coach.starterConfidence",
  "Focus & flow":     "coach.starterFocusFlow",
  "Motivation":       "coach.starterMotivation",
};

// weekLabelKey: index 0 = "3 weeks ago", 1 = "2 weeks ago", 2 = "This week"
function computeSentimentTrajectory(allEntries: EntryRow[]): { labelKey: string; rate: number }[] {
  const now = new Date();
  const result: { labelKey: string; rate: number }[] = [];
  const labelKeys = ["coach.weekLabels0", "coach.weekLabels1", "coach.weekLabels2"];
  for (let w = 2; w >= 0; w--) {
    const start = new Date(now); start.setDate(now.getDate() - (w + 1) * 7); start.setHours(0, 0, 0, 0);
    const end   = new Date(now); end.setDate(now.getDate() - w * 7); end.setHours(0, 0, 0, 0);
    const weekE = allEntries.filter((e) => {
      const d = new Date(e.created_at);
      return d >= start && d < end;
    });
    const rate = weekE.length
      ? Math.round((weekE.filter((e) => e.sentiment === "positive").length / weekE.length) * 100)
      : 0;
    result.push({ labelKey: labelKeys[2 - w], rate });
  }
  return result;
}

function PatternAnalysis({ client }: { client: Client }) {
  const { t } = useT();
  // Count both journal entries and training logs with content
  const entryCount = client.allContentCount;

  if (entryCount < 5) {
    return (
      <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-purple-300">✦</span>
          </div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300">
            {t("coach.patternAnalysisTitle")}
          </p>
        </div>
        <p className="font-saira text-xs leading-relaxed text-zinc-300">
          {t("coach.patternInsufficientData")}
        </p>
      </div>
    );
  }

  const primaryTheme = client.allThemes[0] ?? null;
  const secondaryTheme = client.allThemes[1] ?? null;
  const hasTrajectory = entryCount >= 14;

  const trajectory = hasTrajectory ? computeSentimentTrajectory(client.allEntries) : [];

  // Trajectory direction
  let trajectoryLabel = "";
  let trajectoryColor = "text-zinc-400";
  if (trajectory.length === 3) {
    const first = trajectory[0].rate;
    const last  = trajectory[2].rate;
    const mid   = trajectory[1].rate;
    const variance = Math.abs(last - first);
    const allRates  = trajectory.map((t) => t.rate);
    const spread = Math.max(...allRates) - Math.min(...allRates);
    if (spread >= 30) {
      trajectoryLabel = t("coach.trajectoryVolatile");
      trajectoryColor = "text-amber-300";
    } else if (last > first + 10) {
      trajectoryLabel = t("coach.trajectoryImproving");
      trajectoryColor = "text-emerald-300";
    } else if (last < first - 10) {
      trajectoryLabel = t("coach.trajectoryDeclining");
      trajectoryColor = "text-rose-300";
    } else {
      trajectoryLabel = t("coach.trajectoryStable");
      trajectoryColor = "text-zinc-300";
    }
    void mid; void variance;
  }

  // Conversation starters — collect i18n keys, then translate in JSX
  const starterKeys: string[] = [];
  const dominantLabel = primaryTheme?.label ?? "";
  if (CONVERSATION_STARTER_KEYS[dominantLabel]) {
    starterKeys.push(CONVERSATION_STARTER_KEYS[dominantLabel]);
  }
  if (secondaryTheme && CONVERSATION_STARTER_KEYS[secondaryTheme.label]) {
    starterKeys.push(CONVERSATION_STARTER_KEYS[secondaryTheme.label]);
  }
  if (starterKeys.length < 2) {
    starterKeys.push("coach.starterGoals");
  }

  return (
    <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] text-purple-300">✦</span>
        </div>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300">
          {t("coach.patternAnalysisTitle")}
        </p>
        <span className="font-saira text-[9px] text-zinc-400 ml-auto">{t("coach.entryCount").replace("{n}", String(entryCount))}</span>
      </div>

      {/* Psychological profile */}
      {primaryTheme && (
        <div>
          <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
            {t("coach.psychProfile")}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-saira text-[10px] text-purple-400 font-semibold w-14 flex-shrink-0 pt-0.5">{t("coach.profilePrimary")}</span>
              <div>
                <span className="font-saira text-xs text-zinc-200 font-semibold">{primaryTheme.label}</span>
                {THEME_DESC_KEYS[primaryTheme.label] && (
                  <span className="font-saira text-[10px] text-zinc-300 ml-2">— {t(THEME_DESC_KEYS[primaryTheme.label])}</span>
                )}
                <span className="font-saira text-[10px] text-zinc-400 ml-2">{t("coach.mentionCount").replace("{n}", String(primaryTheme.count))}</span>
              </div>
            </div>
            {secondaryTheme && (
              <div className="flex items-start gap-2">
                <span className="font-saira text-[10px] text-zinc-300 w-14 flex-shrink-0 pt-0.5">{t("coach.profileSecondary")}</span>
                <div>
                  <span className="font-saira text-xs text-zinc-400">{secondaryTheme.label}</span>
                  {THEME_DESC_KEYS[secondaryTheme.label] && (
                    <span className="font-saira text-[10px] text-zinc-400 ml-2">— {t(THEME_DESC_KEYS[secondaryTheme.label])}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sentiment trajectory */}
      {hasTrajectory && trajectory.length === 3 && (
        <div>
          <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
            {t("coach.sentimentTrajectory")}
          </p>
          <div className="flex items-end gap-3 mb-1.5">
            {trajectory.map((pt) => (
              <div key={pt.labelKey} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-sm bg-white/5 overflow-hidden h-6 flex items-end">
                  <div
                    className="w-full bg-purple-400/50 rounded-sm transition-all"
                    style={{ height: `${Math.max(4, pt.rate * 0.24)}px` }}
                  />
                </div>
                <span className="font-saira text-[9px] text-zinc-400 text-center leading-tight">{t(pt.labelKey)}</span>
                <span className={`font-saira text-[10px] font-semibold ${
                  pt.rate >= 60 ? "text-emerald-300" : pt.rate >= 40 ? "text-amber-300" : "text-rose-300"
                }`}>{pt.rate}%</span>
              </div>
            ))}
          </div>
          <p className={`font-saira text-xs font-semibold ${trajectoryColor}`}>{trajectoryLabel}</p>
        </div>
      )}

      {/* Conversation starters */}
      <div>
        <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
          {t("coach.conversationStarters")}
        </p>
        <ul className="space-y-1.5">
          {starterKeys.slice(0, 3).map((sk, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="font-saira text-[10px] text-purple-400 flex-shrink-0 mt-0.5">→</span>
              <span className="font-saira text-xs text-zinc-400 leading-relaxed">{t(sk)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Coach Notes tab ────────────────────────────────────────────────────────────

type TFn = (key: string) => string;

function timeSince(iso: string, t: TFn): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return t("coach.timeSinceJustNow");
  if (diffMin < 60) return t("coach.timeSinceMinAgo").replace("{n}", String(diffMin));
  if (diffH   < 24) return t("coach.timeSinceHAgo").replace("{n}", String(diffH));
  return t("coach.timeSinceDayAgo").replace("{n}", String(diffD));
}

function NotesTab({
  athleteId,
  note,
  savedAt,
  saving,
  onChange,
}: {
  athleteId: string;
  note: string;
  savedAt: string | null;
  saving: boolean;
  onChange: (athleteId: string, value: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => onChange(athleteId, e.target.value)}
        placeholder={t("coach.notesPlaceholder")}
        rows={6}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
      />
      <div className="flex items-center gap-2 font-saira text-[10px] text-zinc-400">
        {saving ? (
          <span className="text-amber-400">{t("coach.savingNote")}</span>
        ) : savedAt ? (
          <span className="text-emerald-400">{t("coach.savedAtTime").replace("{time}", timeSince(savedAt, t))}</span>
        ) : (
          <span>{t("coach.autoSavesHint")}</span>
        )}
      </div>
    </div>
  );
}

// ── Training day card (coach activity feed) ───────────────────────────────────

function CoachTrainingCard({ entry }: { entry: TrainingEntry }) {
  const { t } = useT();
  const fields = [
    { label: t("coach.trainingFieldBefore"),    value: entry.thoughts_before },
    { label: t("coach.trainingFieldAfter"),     value: entry.thoughts_after },
    { label: t("coach.trainingFieldWentWell"),  value: entry.what_went_well },
    { label: t("coach.trainingFieldFrustrated"), value: entry.frustrations },
    { label: t("coach.trainingFieldNext"),      value: entry.next_session },
  ].filter((f) => f.value);

  if (!fields.length) return null;

  const d = new Date(entry.entry_date + "T12:00:00");
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🏋️</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
          {t("coach.trainingDayLogTitle")}
        </p>
        <span className="font-saira text-[10px] text-zinc-400 ml-1">{dateStr}</span>
        {entry.mood_rating != null && (
          <span className="ml-auto font-saira text-[10px] text-zinc-300">{t("coach.moodRating").replace("{n}", String(entry.mood_rating))}</span>
        )}
      </div>
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="font-saira text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">{f.label}</p>
            <p className="font-saira text-sm text-zinc-300 leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Entry Feedback ────────────────────────────────────────────────────────────

function EntryFeedbackSection({
  entryId,
  athleteId,
  existing,
  onSaved,
}: {
  entryId: string;
  athleteId: string;
  existing?: { id: string; content: string; created_at: string };
  onSaved: (entryId: string, feedback: { id: string; content: string; created_at: string }) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(existing?.content ?? "");
  const [saving, setSaving] = React.useState(false);
  const [localFeedback, setLocalFeedback] = React.useState(existing ?? null);

  const handleSave = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coach/entry-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, athlete_id: athleteId, content: draft.trim() }),
      });
      if (res.ok) {
        const data = await res.json() as { id: string; content: string; created_at: string };
        setLocalFeedback(data);
        onSaved(entryId, data);
        setOpen(false);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  if (localFeedback && !open) {
    return (
      <div className="mt-2 pl-3 border-l-2 border-purple-500/20">
        <div className="flex items-start gap-2">
          <p className="font-saira text-[10px] text-zinc-400 flex-1 italic leading-relaxed">
            &ldquo;{localFeedback.content}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => { setDraft(localFeedback.content); setOpen(true); }}
            className="font-saira text-[9px] text-zinc-400 hover:text-purple-300 transition flex-shrink-0"
            title={t("coach.editBtn")}
          >
            ✎
          </button>
        </div>
        <p className="font-saira text-[9px] text-zinc-400 mt-0.5">{t("coach.coachNoteWithTime").replace("{time}", timeSince(localFeedback.created_at, t))}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 font-saira text-[10px] text-zinc-400 hover:text-purple-300 transition"
      >
        {t("coach.addCoachNote")}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder={t("coach.entryNotePlaceholder")}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-saira text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          className={`rounded-full px-3 py-1 font-saira text-[10px] font-semibold transition ${
            draft.trim() && !saving
              ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
              : "bg-white/5 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {saving ? t("coach.savingNote") : t("coach.saveNote")}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setDraft(existing?.content ?? ""); }}
          className="font-saira text-[10px] text-zinc-400 hover:text-zinc-400 transition"
        >
          {t("coach.cancelBtn")}
        </button>
      </div>
    </div>
  );
}

// ── Training entry feedback ────────────────────────────────────────────────────

function TrainingFeedbackSection({
  trainingEntryId,
  athleteId,
  existing,
  onSaved,
}: {
  trainingEntryId: string;
  athleteId: string;
  existing?: string;
  onSaved: (note: string) => void;
}) {
  const { t } = useT();
  const [open, setOpen]           = React.useState(false);
  const [draft, setDraft]         = React.useState(existing ?? "");
  const [saving, setSaving]       = React.useState(false);
  const [localNote, setLocalNote] = React.useState<string | null>(existing ?? null);

  const handleSave = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/coach/training-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ training_entry_id: trainingEntryId, athlete_id: athleteId, content: draft.trim() }),
      });
      if (res.ok) {
        setLocalNote(draft.trim());
        onSaved(draft.trim());
        setOpen(false);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  if (localNote && !open) {
    return (
      <div className="mt-2 pl-3 border-l-2 border-purple-500/20">
        <div className="flex items-start gap-2">
          <p className="font-saira text-[10px] text-zinc-400 flex-1 italic leading-relaxed">
            &ldquo;{localNote}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => { setDraft(localNote); setOpen(true); }}
            className="font-saira text-[9px] text-zinc-400 hover:text-purple-300 transition flex-shrink-0"
            title={t("coach.editBtn")}
          >
            ✎
          </button>
        </div>
        <p className="font-saira text-[9px] text-zinc-400 mt-0.5">{t("coach.coachNoteLabel")}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 font-saira text-[10px] text-zinc-400 hover:text-purple-300 transition"
      >
        {t("coach.addCoachNote")}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder={t("coach.sessionNotePlaceholder")}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-saira text-xs text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          className={`rounded-full px-3 py-1 font-saira text-[10px] font-semibold transition ${
            draft.trim() && !saving
              ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
              : "bg-white/5 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {saving ? t("coach.savingNote") : t("coach.saveNote")}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setDraft(existing ?? ""); }}
          className="font-saira text-[10px] text-zinc-400 hover:text-zinc-400 transition"
        >
          {t("coach.cancelBtn")}
        </button>
      </div>
    </div>
  );
}

// ── Client card ────────────────────────────────────────────────────────────────

type ActiveTab = "analysis" | "entries" | "scores" | "training" | "checkins" | "profile" | "notes" | "prompts";

function ClientCard({
  client,
  coachNote,
  noteSavedAt,
  noteSaving,
  onNoteChange,
  feedbackByEntry,
  onFeedbackSaved,
  trainingNoteByEntry,
  onTrainingNoteSaved,
  sentimentWindow,
  onSentimentWindowChange,
  forceOpen = false,
}: {
  client: Client;
  coachNote: string;
  noteSavedAt: string | null;
  noteSaving: boolean;
  onNoteChange: (athleteId: string, value: string) => void;
  feedbackByEntry: Record<string, { id: string; content: string; created_at: string }>;
  onFeedbackSaved: (athleteId: string, entryId: string, feedback: { id: string; content: string; created_at: string }) => void;
  trainingNoteByEntry: Record<string, string>;
  onTrainingNoteSaved: (athleteId: string, entryId: string, note: string) => void;
  sentimentWindow: 7 | 30 | 60;
  onSentimentWindowChange: (athleteId: string, w: 7 | 30 | 60) => void;
  forceOpen?: boolean;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = React.useState(false);
  const isOpen = forceOpen || expanded;
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("analysis");
  const [trainingWeekOffset, setTrainingWeekOffset] = React.useState(0);
  const flag = FLAG_CONFIG[client.flag];

  // ── Test assignment local state ─────────────────────────────────────────────
  const [assignedSlugs, setAssignedSlugs] = React.useState<string[]>(() => client.assignedTestSlugs ?? []);
  const [assignWorking, setAssignWorking] = React.useState<string | null>(null);

  const toggleTestAssignment = async (slug: string) => {
    if (assignWorking) return;
    const isAssigned = assignedSlugs.includes(slug);
    setAssignWorking(slug);
    try {
      const res = await fetch("/api/coach/assign-test", {
        method: isAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: client.id, test_slug: slug }),
      });
      if (res.ok) {
        setAssignedSlugs((prev) =>
          isAssigned ? prev.filter((s) => s !== slug) : [...prev, slug]
        );
      }
    } finally {
      setAssignWorking(null);
    }
  };

  // Compute windowed stats for Analysis tab
  const windowedEntries = React.useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() - sentimentWindow);
    return client.allEntries.filter((e) => new Date(e.created_at) >= cut);
  }, [client.allEntries, sentimentWindow]);

  // Training logs within the same window (used for entry count + theme detection)
  const windowedTrainingLogs = React.useMemo(() => {
    const cut = new Date();
    cut.setDate(cut.getDate() - sentimentWindow);
    return client.allTrainingWithContent.filter(
      (e) => new Date(e.entry_date + "T12:00:00") >= cut,
    );
  }, [client.allTrainingWithContent, sentimentWindow]);

  // Total entries in window = journal + training logs with content
  const windowedTotalCount = windowedEntries.length + windowedTrainingLogs.length;

  // Sentiment % stays journal-only (training logs don't carry a sentiment field)
  const windowedPositiveRate = windowedEntries.length
    ? Math.round((windowedEntries.filter((e) => e.sentiment === "positive").length / windowedEntries.length) * 100)
    : 0;

  const windowedThemes = React.useMemo(() => {
    return THEME_DEFS.map((def) => {
      const journalCount = windowedEntries.filter((e) =>
        def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
      ).length;
      const trainingCount = windowedTrainingLogs.filter((e) => {
        const text = [e.thoughts_before, e.thoughts_after, e.what_went_well, e.frustrations, e.next_session]
          .filter(Boolean).join(" ").toLowerCase();
        return def.keywords.some((kw) => text.includes(kw));
      }).length;
      return { label: def.label, count: journalCount + trainingCount, color: def.color };
    }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  }, [windowedEntries, windowedTrainingLogs]);

  // Training week navigation
  const trainingByWeek = React.useMemo(() => {
    const weeks: TrainingEntry[][] = [[], [], [], []];
    const now = new Date();
    for (const e of client.allTrainingEntries) {
      const entryDate = new Date(e.entry_date + "T12:00:00");
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 4) {
        weeks[weekIdx].push(e);
      }
    }
    return weeks;
  }, [client.allTrainingEntries]);

  const currentWeekTraining = trainingByWeek[trainingWeekOffset] ?? [];

  const weekLabel = trainingWeekOffset === 0 ? t("coach.trainingWeekThis")
    : trainingWeekOffset === 1 ? t("coach.trainingWeekLast")
    : t("coach.trainingWeekNAgo").replace("{n}", String(trainingWeekOffset));

  // Helper: render lastActive code as translated string
  const renderLastActive = (la: Client["lastActive"]): string => {
    if (la.key === "never") return t("coach.lastActiveNever");
    if (la.key === "justNow") return t("coach.lastActiveJustNow");
    if (la.key === "yesterday") return t("coach.lastActiveYesterday");
    if (la.key === "hoursAgo") return t("coach.hoursAgo").replace("{h}", String(la.h));
    if (la.key === "daysAgo") return t("coach.lastActiveDaysAgo").replace("{n}", String(la.d));
    return "";
  };

  // Unified activity feed: journal entries + training day logs merged by date
  type ActivityItem =
    | { kind: "journal";  entry: EntryRow }
    | { kind: "training"; entry: TrainingEntry };

  const activityFeed = React.useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...client.allEntries.map((e) => ({ kind: "journal" as const, entry: e })),
      ...client.allTrainingEntries
        .filter((e) =>
          e.thoughts_before || e.thoughts_after || e.what_went_well || e.frustrations || e.next_session,
        )
        .map((e) => ({ kind: "training" as const, entry: e })),
    ];
    return items.sort((a, b) => {
      const aT = a.kind === "journal"
        ? new Date(a.entry.created_at).getTime()
        : new Date(a.entry.entry_date + "T12:00:00").getTime();
      const bT = b.kind === "journal"
        ? new Date(b.entry.created_at).getTime()
        : new Date(b.entry.entry_date + "T12:00:00").getTime();
      return bT - aT;
    });
  }, [client.allEntries, client.allTrainingEntries]);

  // Week days for the currently selected offset week
  const offsetWeekDays = React.useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    // Find Monday of the offset week
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) - trainingWeekOffset * 7;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayOffset + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [trainingWeekOffset]);

  return (
    <div className={`rounded-3xl border bg-surface-alt overflow-hidden transition ${
      client.flag === "attention" ? "border-rose-500/20" : "border-white/6"
    }`}>
      {/* ── Collapsed header (hidden when forceOpen) ── */}
      {!forceOpen && (
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
          <p className="font-saira text-[11px] text-zinc-400 mt-0.5">
            {t("coach.lastActiveMeta").replace("{la}", renderLastActive(client.lastActive)).replace("{n}", String(client.entriesThisWeek))}
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
            <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400">{t("coach.positiveLabel")}</p>
          </div>

          <span className={`font-saira text-lg font-bold ${TREND_COLOR[client.trend]}`}>
            {TREND_ICON[client.trend]}
          </span>

          <span className={`rounded-full border px-3 py-0.5 font-saira text-[10px] uppercase tracking-[0.14em] ${flag.border} ${flag.bg} ${flag.text}`}>
            <span className={`mr-1.5 inline-block w-1.5 h-1.5 rounded-full ${flag.dot}`} />
            {t(flag.labelKey)}
          </span>

          <span className="font-saira text-[11px] text-zinc-400">{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>
      )} {/* end !forceOpen */}

      {/* ── Expanded body ── */}
      {isOpen && (
        <div className="border-t border-white/5" onClick={(e) => e.stopPropagation()}>
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-white/5 px-5 sm:px-6 overflow-x-auto">
            {([
              { key: "analysis",  labelKey: "coach.tabAnalysis" },
              { key: "entries",   labelKey: "coach.tabActivity" },
              { key: "scores",    labelKey: "coach.tabScores" },
              { key: "training",  labelKey: "coach.tabTraining" },
              { key: "checkins",  labelKey: "coach.tabCheckins" },
              { key: "profile",   labelKey: "coach.tabProfile" },
              { key: "notes",     labelKey: "coach.tabNotes" },
              { key: "prompts",   labelKey: "coach.tabPrompts" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-shrink-0 px-4 py-3 font-saira text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  activeTab === tab.key ? "text-white" : "text-zinc-300 hover:text-zinc-300"
                }`}
              >
                {t(tab.labelKey)}
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
                {/* Sentiment window selector */}
                <div className="flex items-center gap-2">
                  <span className="font-saira text-[10px] text-zinc-400 uppercase tracking-[0.18em]">{t("coach.windowLabel")}</span>
                  <div className="flex gap-1">
                    {([7, 30, 60] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onSentimentWindowChange(client.id, w)}
                        className={`rounded-full border px-3 py-0.5 font-saira text-[10px] uppercase tracking-[0.12em] transition ${
                          sentimentWindow === w
                            ? "border-purple-400 bg-purple-500/20 text-white"
                            : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {w}{t("coach.sentimentWindowLabel")}
                      </button>
                    ))}
                  </div>
                </div>

                {windowedThemes.length > 0 ? (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
                      {t("coach.detectedThemes").replace("{n}", String(sentimentWindow))}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {windowedThemes.map((t) => (
                        <TagChip
                          key={t.label}
                          label={t.label}
                          color={THEME_DEFS.find((d) => d.label === t.label)?.color ?? "purple"}
                          count={t.count}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="font-saira text-sm text-zinc-400 py-2">
                    {windowedTotalCount === 0
                      ? t("coach.noEntriesInWindow").replace("{n}", String(sentimentWindow))
                      : t("coach.noThemesDetected")}
                  </p>
                )}

                {/* Stats summary */}
                {windowedTotalCount > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-surface-input p-5">
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 mb-3">
                      {t("coach.lastNDaysGlance").replace("{n}", String(sentimentWindow))}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniStat label={t("coach.statEntries")} value={String(windowedTotalCount)} />
                      <MiniStat
                        label={t("coach.statPositive")}
                        value={`${windowedPositiveRate}%`}
                        color={windowedPositiveRate >= 60 ? "text-emerald-300" : windowedPositiveRate >= 40 ? "text-amber-300" : "text-rose-300"}
                      />
                      <MiniStat
                        label={t("coach.statTrend")}
                        value={TREND_ICON[client.trend]}
                        color={TREND_COLOR[client.trend]}
                      />
                    </div>
                  </div>
                )}

                {/* Pattern analysis */}
                <PatternAnalysis client={client} />
              </div>
            )}

            {/* ── Tab: Activity (journal + training logs merged) ── */}
            {activeTab === "entries" && (
              <div className="space-y-3">
                {activityFeed.length === 0 ? (
                  <p className="font-saira text-sm text-zinc-400 py-4 text-center">{t("coach.noActivityYet")}</p>
                ) : (
                  activityFeed.map((item) =>
                    item.kind === "training" ? (
                      <div key={`t-${item.entry.id}`}>
                        <CoachTrainingCard entry={item.entry} />
                        <TrainingFeedbackSection
                          trainingEntryId={item.entry.id}
                          athleteId={client.id}
                          existing={trainingNoteByEntry[item.entry.id] ?? (item.entry.coach_note ?? undefined)}
                          onSaved={(note) => onTrainingNoteSaved(client.id, item.entry.id, note)}
                        />
                      </div>
                    ) : (
                      <div key={item.entry.id}>
                        <EntryCard entry={item.entry} />
                        <EntryFeedbackSection
                          entryId={item.entry.id}
                          athleteId={client.id}
                          existing={feedbackByEntry[item.entry.id]}
                          onSaved={(entryId, feedback) => onFeedbackSaved(client.id, entryId, feedback)}
                        />
                      </div>
                    ),
                  )
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
                      {t("coach.dasHeading")}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(() => {
                        const r = client.testScores.das[0];
                        return (
                          <>
                            <ScoreCard label={t("coach.tsTotal")} value={`${r.total_score > 0 ? "+" : ""}${r.total_score}`} sub="of ±70" flag={r.depression_prone ? "rose" : r.total_score > 18 ? "amber" : "emerald"} />
                            <ScoreCard label={t("coach.tsDepressionProne")} value={r.depression_prone ? t("coach.tsYes") : t("coach.tsNo")} sub="" flag={r.depression_prone ? "rose" : "emerald"} />
                            <ScoreCard label={t("coach.tsSubmitted")} value={new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} sub={r.paid ? t("coach.tsPaid") : t("coach.tsFree")} flag="amber" />
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
                      {t("coach.acsiHeading")}
                    </p>
                    {(() => {
                      const r = client.testScores.acsi[0];
                      const total = r.total_score ?? (r.score_coping + r.score_concentration + r.score_confidence + r.score_goal_setting);
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <ScoreCard label={t("coach.tsTotal")} value={String(total)} sub="of 196" flag={total >= 130 ? "emerald" : total >= 90 ? "amber" : "rose"} />
                          <ScoreCard label={t("coach.tsCoping")} value={String(r.score_coping)} sub="of 28" flag={r.score_coping >= 18 ? "emerald" : "rose"} />
                          <ScoreCard label={t("coach.tsConcentration")} value={String(r.score_concentration)} sub="of 28" flag={r.score_concentration >= 18 ? "emerald" : "rose"} />
                          <ScoreCard label={t("coach.tsConfidence")} value={String(r.score_confidence)} sub="of 28" flag={r.score_confidence >= 18 ? "emerald" : "rose"} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* CSAI */}
                {client.testScores.csai.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300 mb-3">
                      {t("coach.csaiHeading")}
                    </p>
                    {(() => {
                      const r = client.testScores.csai[0];
                      return (
                        <div className="grid grid-cols-3 gap-3">
                          <ScoreCard label={t("coach.tsCognitive")} value={String(r.score_cognitive)} sub="of 36" flag={r.score_cognitive <= 18 ? "emerald" : "rose"} />
                          <ScoreCard label={t("coach.tsSomatic")}   value={String(r.score_somatic)}   sub="of 36" flag={r.score_somatic <= 18 ? "emerald" : "rose"} />
                          <ScoreCard label={t("coach.tsConfidence")} value={String(r.score_confidence)} sub="of 36" flag={r.score_confidence >= 22 ? "emerald" : "rose"} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SAT */}
                {client.testScores.sat.length > 0 && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300 mb-3">
                      {t("coach.satHeading")}
                    </p>
                    {(() => {
                      const r = client.testScores.sat[0];
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <ScoreCard label={t("coach.tsTotal")} value={String(r.total_score)} sub="of 165" flag="emerald" />
                          <ScoreCard label={t("coach.tsSubmitted")} value={new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} sub={r.paid ? t("coach.tsPaid") : t("coach.tsFree")} flag="amber" />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {client.testScores.das.length === 0 &&
                 client.testScores.acsi.length === 0 &&
                 client.testScores.csai.length === 0 &&
                 client.testScores.sat.length === 0 && (
                  <p className="font-saira text-sm text-zinc-400 py-4 text-center">
                    {t("coach.noTestsYet")}
                  </p>
                )}

                {/* ── Assign test ── */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 mb-3">
                    {t("coach.tsAssign")} — {client.name.split(" ")[0]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { slug: "sat",  labelKey: "coach.tsLabelSAT" },
                      { slug: "acsi", labelKey: "coach.tsLabelACSI" },
                      { slug: "csai", labelKey: "coach.tsLabelCSAI" },
                      { slug: "das",  labelKey: "coach.tsLabelDAS"  },
                    ] as const).map(({ slug, labelKey }) => {
                      const label = t(labelKey);
                      const isAssigned = assignedSlugs.includes(slug);
                      const isWorking  = assignWorking === slug;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => toggleTestAssignment(slug)}
                          disabled={!!assignWorking}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 font-saira text-[11px] transition ${
                            isAssigned
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                              : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-purple-500/30 hover:text-zinc-100"
                          } disabled:opacity-50`}
                        >
                          <span>{label}</span>
                          {isWorking ? (
                            <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin flex-shrink-0" />
                          ) : isAssigned ? (
                            <span className="text-amber-300 flex-shrink-0">{t("coach.assignedBadge")}</span>
                          ) : (
                            <span className="text-zinc-500 flex-shrink-0">{t("coach.assignBtn")}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-saira text-[10px] text-zinc-500 mt-2">
                    {t("coach.assignHint")}
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Training Log ── */}
            {activeTab === "training" && (
              <div className="space-y-4">
                {/* Week navigation */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTrainingWeekOffset((v) => Math.min(v + 1, 3))}
                    disabled={trainingWeekOffset >= 3}
                    className={`font-saira text-[11px] px-3 py-1 rounded-full border transition ${
                      trainingWeekOffset >= 3
                        ? "border-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {t("coach.prevWeek")}
                  </button>
                  <span className="font-saira text-[11px] font-semibold text-zinc-300">{weekLabel}</span>
                  <button
                    type="button"
                    onClick={() => setTrainingWeekOffset((v) => Math.max(v - 1, 0))}
                    disabled={trainingWeekOffset <= 0}
                    className={`font-saira text-[11px] px-3 py-1 rounded-full border transition ${
                      trainingWeekOffset <= 0
                        ? "border-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {t("coach.nextWeek")}
                  </button>
                </div>
                <TrainingLogTab trainingThisWeek={currentWeekTraining} weekDays={offsetWeekDays} />
              </div>
            )}

            {/* ── Tab: Check-ins ── */}
            {activeTab === "checkins" && (
              <CheckinsTab checkins={client.weeklyCheckins} monthlyCheckins={client.monthlyCheckins} />
            )}

            {/* ── Tab: Profile ── */}
            {activeTab === "profile" && (
              <ProfileTab profile={client.profile} />
            )}

            {/* ── Tab: Notes ── */}
            {activeTab === "notes" && (
              <NotesTab
                athleteId={client.id}
                note={coachNote}
                savedAt={noteSavedAt}
                saving={noteSaving}
                onChange={onNoteChange}
              />
            )}

            {/* ── Tab: Prompts ── */}
            {activeTab === "prompts" && (
              <PromptsTab athleteId={client.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Prompts tab ───────────────────────────────────────────────────────────────

function PromptsTab({ athleteId }: { athleteId: string }) {
  const { t } = useT();
  const DEFAULT_LABELS = [
    t("journal.qThoughtsBefore"),
    t("journal.qThoughtsAfter"),
    t("journal.qWentWell"),
    t("journal.qFrustrations"),
    t("journal.qNextSession"),
  ];
  const [fields, setFields]   = React.useState<string[]>(Array(5).fill(""));
  const [loaded, setLoaded]   = React.useState(false);
  const [saving, setSaving]   = React.useState(false);
  const [saved, setSaved]     = React.useState(false);

  // Load existing labels for this athlete
  React.useEffect(() => {
    (async () => {
      const res = await fetch(`/api/coach/athlete-settings?athlete_id=${athleteId}`);
      if (res.ok) {
        const data: { journal_prompt_labels: string[] | null } = await res.json();
        const labels = data.journal_prompt_labels ?? [];
        setFields(Array.from({ length: 5 }, (_, i) => labels[i] ?? ""));
      } else {
        setFields(Array(5).fill(""));
      }
      setLoaded(true);
    })();
  }, [athleteId]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch("/api/coach/athlete-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: athleteId, journal_prompt_labels: fields }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetch("/api/coach/athlete-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: athleteId, journal_prompt_labels: null }),
      });
      setFields(Array(5).fill(""));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-white/6" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-saira text-xs font-semibold text-purple-200">
          {t("coach.journalPromptsTitle")}
        </p>
        <p className="mt-1 font-saira text-[11px] text-zinc-400">
          {t("coach.journalPromptsBody")}
        </p>
      </div>

      <div className="space-y-2.5">
        {fields.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 flex-shrink-0 font-saira text-[11px] text-zinc-500 text-right">{i + 1}.</span>
            <input
              type="text"
              value={val}
              onChange={(e) => setFields((prev) => {
                const next = [...prev];
                next[i] = e.target.value;
                return next;
              })}
              placeholder={t("coach.journalPromptsPlaceholder").replace("{n}", String(i + 1)) || DEFAULT_LABELS[i]}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="font-saira text-[11px] text-zinc-500 hover:text-zinc-300 transition underline underline-offset-2 disabled:opacity-40"
        >
          {t("coach.journalPromptsReset")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`ml-auto rounded-full px-6 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
            saved
              ? "bg-emerald-500 text-white"
              : "bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-40"
          }`}
        >
          {saved ? t("coach.journalPromptsSaved") : saving ? t("common.saving") : t("coach.journalPromptsSave")}
        </button>
      </div>
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
            <span className="font-saira text-[8px] text-zinc-400">{DAY_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrainingLogTab({ trainingThisWeek, weekDays: propWeekDays }: { trainingThisWeek: TrainingEntry[]; weekDays?: string[] }) {
  const { t } = useT();
  const defaultWeekDays = React.useMemo(() => currentWeekDays(), []);
  const weekDays = propWeekDays ?? defaultWeekDays;
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
          {t("coach.weekSummaryHeading")}
        </p>
        <div className="rounded-2xl border border-white/5 bg-surface-input p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-saira">
            <span className="text-zinc-400">{t("coach.trainingDaysLabel")}</span>
            <span className="font-semibold text-white">{trainingDays}/7</span>
          </div>
          {avgMood !== null && (
            <div className="flex items-center justify-between text-xs font-saira">
              <span className="text-zinc-400">{t("coach.avgMoodLabel")}</span>
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
            {t("coach.dailyLogHeading")}
          </p>
          <div className="space-y-3">
            {trainingThisWeek.map((e, idx) => {
              const dateObj = new Date(e.entry_date + "T12:00:00");
              const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
              const dayNum  = dateObj.getDate();
              return (
                <div key={e.id} className="rounded-xl border border-white/5 bg-surface-input p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-saira text-xs font-semibold text-zinc-300">
                      {t("coach.dayEntry").replace("{n}", String(idx + 1)).replace("{day}", dayName).replace("{date}", String(dayNum))}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.12em] ${
                      e.is_training_day
                        ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                        : "border-zinc-600/40 bg-zinc-600/10 text-zinc-400"
                    }`}>
                      {e.is_training_day ? t("coach.trainingDay") : t("coach.trainingRest")}
                    </span>
                    {e.mood_rating !== null && (
                      <span className={`font-saira text-[10px] font-semibold ${
                        e.mood_rating >= 7 ? "text-emerald-400"
                        : e.mood_rating >= 5 ? "text-amber-400"
                        : "text-rose-400"
                      }`}>
                        {t("coach.moodEntryRating").replace("{n}", String(e.mood_rating))}
                      </span>
                    )}
                  </div>
                  {e.is_training_day && (
                    <div className="space-y-1.5 mt-2">
                      {(
                        [
                          [t("coach.trainingFieldBeforeShort"), e.thoughts_before],
                          [t("coach.trainingFieldAfterShort"),  e.thoughts_after],
                          [t("coach.trainingFieldWentWellShort"), e.what_went_well],
                          [t("coach.trainingFieldFrustrationsShort"), e.frustrations],
                          [t("coach.trainingFieldNextShort"), e.next_session],
                        ] as [string, string | null][]
                      ).map(([label, val]) =>
                        val ? (
                          <div key={label} className="flex gap-2">
                            <span className="font-saira text-[10px] uppercase tracking-[0.12em] text-zinc-400 w-20 flex-shrink-0 pt-0.5">
                              {label}
                            </span>
                            <span className="font-saira text-xs text-zinc-300 leading-snug">
                              {val}
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  {!e.is_training_day && e.next_session && (
                    <p className="font-saira text-xs text-zinc-400 mt-1 leading-snug">
                      {e.next_session}
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
          {t("coach.weeklyBriefHeading")}
        </p>
        <div className="rounded-2xl border border-white/5 bg-surface-input p-4 space-y-2">
          <BriefLine>
            {t("coach.moodTrendLabel")} <span className={
              moodTrend === "up" ? "text-emerald-300"
              : moodTrend === "down" ? "text-rose-300"
              : "text-zinc-400"
            }>{moodTrend === "up" ? t("coach.moodTrendUp") : moodTrend === "down" ? t("coach.moodTrendDown") : t("coach.moodTrendFlat")}</span>
          </BriefLine>
          <BriefLine>
            {t("coach.trainingDaysThisWeek").replace("{n}", String(trainingDays))}
          </BriefLine>
          {beforeTexts.length > 0 && (
            <BriefLine>
              {t("coach.preSessionThemes")}{" "}
              <span className="text-zinc-300">{extractTopics(beforeTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {afterTexts.length > 0 && (
            <BriefLine>
              {t("coach.postSessionThemes")}{" "}
              <span className="text-zinc-300">{extractTopics(afterTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {nextTexts.length > 0 && (
            <BriefLine>
              {t("coach.recurringFocus")}{" "}
              <span className="text-zinc-300">{extractTopics(nextTexts).join(", ") || "—"}</span>
            </BriefLine>
          )}
          {trainingThisWeek.length === 0 && (
            <p className="font-saira text-xs text-zinc-400">{t("coach.noTrainingEntries")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-saira text-xs text-zinc-300 leading-snug">
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
    <div className="rounded-xl border border-white/5 bg-surface-input p-3">
      <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-300 mb-1">{label}</p>
      <p className={`font-saira ${small ? "text-xs" : "text-base"} font-bold leading-tight ${color}`}>
        {value}
        {sub && <span className="text-[10px] font-normal text-zinc-400 ml-1">{sub}</span>}
      </p>
    </div>
  );
}

function MiniStat({ label, value, color = "text-zinc-100" }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`font-saira text-lg font-extrabold ${color}`}>{value}</p>
      <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400 mt-0.5">{label}</p>
    </div>
  );
}

// ── Mobile athlete row ────────────────────────────────────────────────────────

function MobileAthleteRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const { t } = useT();
  const flagBar =
    client.flag === "attention" ? "bg-rose-500" :
    client.flag === "monitor"   ? "bg-amber-500" :
    "bg-emerald-500";

  const renderLastActive = (la: Client["lastActive"]): string => {
    if (la.key === "never")     return t("coach.lastActiveNever");
    if (la.key === "justNow")   return t("coach.lastActiveJustNow");
    if (la.key === "yesterday") return t("coach.lastActiveYesterday");
    if (la.key === "hoursAgo")  return t("coach.hoursAgo").replace("{h}", String(la.h));
    if (la.key === "daysAgo")   return t("coach.lastActiveDaysAgo").replace("{n}", String(la.d));
    return "";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-0 hover:bg-white/[0.03] active:bg-white/5 transition"
    >
      {/* Colored flag bar */}
      <div className={`flex-shrink-0 w-1 self-stretch ${flagBar} opacity-70`} />

      {/* Avatar */}
      <div className="flex-shrink-0 ml-3 mr-3">
        {client.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full border border-white/10" />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-saira text-xs font-bold ${
            client.flag === "attention" ? "bg-rose-500/20 text-rose-300" :
            client.flag === "monitor"   ? "bg-amber-500/20 text-amber-300" :
            "bg-emerald-500/15 text-emerald-300"
          }`}>
            {client.initials}
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0 py-3">
        <p className="font-saira text-sm font-semibold text-zinc-100 truncate">{client.name}</p>
        <p className="font-saira text-[11px] text-zinc-400 mt-0.5">
          {client.entriesThisWeek > 0
            ? `${client.entriesThisWeek} ${client.entriesThisWeek === 1 ? "entry" : "entries"} this week`
            : renderLastActive(client.lastActive)
          }
        </p>
      </div>

      {/* Right: sparkline + positive % */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1 pr-4 py-3">
        <SentimentSparkline data={client.sentimentWeek} />
        <span className={`font-saira text-xs font-bold tabular-nums ${
          client.positiveRate >= 60 ? "text-emerald-400" :
          client.positiveRate >= 40 ? "text-amber-400" :
          "text-rose-400"
        }`}>{client.positiveRate}%</span>
      </div>
    </button>
  );
}

// ── Mobile athlete sheet ───────────────────────────────────────────────────────

type SheetTab = "overview" | "activity" | "profile";

function MobileAthleteSheet({
  client,
  coachNote,
  onNoteChange,
  noteSaving,
  feedbackByEntry,
  onFeedbackSaved,
}: {
  client: Client;
  coachNote: string;
  onNoteChange: (id: string, val: string) => void;
  noteSaving: boolean;
  feedbackByEntry: Record<string, { id: string; content: string; created_at: string }>;
  onFeedbackSaved: (athleteId: string, entryId: string, fb: { id: string; content: string; created_at: string }) => void;
}) {
  const { t } = useT();
  const [tab, setTab] = React.useState<SheetTab>("overview");
  const [showNotes, setShowNotes] = React.useState(false);
  const flag = FLAG_CONFIG[client.flag];

  return (
    <div className="space-y-4">
      {/* Flag + positive rate row */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.18em] ${flag.border} ${flag.text} ${flag.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${flag.dot}`} />
          {t(flag.labelKey)}
        </span>
        <span className={`font-saira text-sm font-bold tabular-nums ${
          client.positiveRate >= 60 ? "text-emerald-400" :
          client.positiveRate >= 40 ? "text-amber-400" : "text-rose-400"
        }`}>{client.positiveRate}% positive</span>
        <span className={`font-saira text-sm ${TREND_COLOR[client.trend]}`}>
          {TREND_ICON[client.trend]}
        </span>
        {/* Notes toggle */}
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className={`ml-auto rounded-full w-7 h-7 flex items-center justify-center border transition ${
            showNotes ? "border-purple-500/50 bg-purple-500/20 text-purple-300" : "border-white/10 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Coach notes"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden>
            <path d="M2 2h12v9H9.5l-2 3-1-3H2V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M5 5.5h6M5 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1.5">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-purple-300">
            Coach notes {noteSaving ? "· Saving…" : ""}
          </p>
          <textarea
            value={coachNote}
            onChange={(e) => onNoteChange(client.id, e.target.value)}
            rows={4}
            placeholder="Private notes about this athlete…"
            className="w-full bg-transparent font-saira text-sm text-zinc-200 placeholder:text-zinc-500 resize-none focus:outline-none"
          />
        </div>
      )}

      {/* Tab segmented control */}
      <div className="flex rounded-xl border border-white/8 overflow-hidden">
        {([
          { key: "overview", label: "Overview" },
          { key: "activity", label: "Activity" },
          { key: "profile",  label: "Profile"  },
        ] as { key: SheetTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-2 font-saira text-[10px] uppercase tracking-[0.16em] transition ${
              tab === key
                ? "bg-purple-500/20 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* 7-day sparkline */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">
              7-day sentiment
            </p>
            <div className="flex items-end gap-1.5">
              {client.sentimentWeek.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm ${
                      v >= 60 ? "bg-emerald-500/60" : v >= 40 ? "bg-amber-500/60" : v > 0 ? "bg-rose-500/60" : "bg-white/8"
                    }`}
                    style={{ height: `${Math.max(v, 4)}%`, maxHeight: "48px", minHeight: "4px" }}
                  />
                  <span className="font-saira text-[8px] text-zinc-500">
                    {["M","T","W","T","F","S","S"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent check-ins */}
          {client.weeklyCheckins.length > 0 && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">
                Recent check-ins
              </p>
              <div className="space-y-2">
                {client.weeklyCheckins.slice(0, 4).map((wc, i) => {
                  const avg = Math.round(
                    (wc.mood_rating + wc.training_quality + wc.readiness_rating + wc.energy_rating + wc.sleep_rating) / 5
                  );
                  const color = avg >= 7 ? "text-emerald-400" : avg >= 5 ? "text-amber-400" : "text-rose-400";
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-saira text-xs text-zinc-400">
                        {new Date(wc.week_start ?? wc.created_at ?? "").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <span className={`font-saira text-sm font-bold tabular-nums ${color}`}>{avg}/10</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top themes */}
          {client.themes.length > 0 && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">
                Top themes this week
              </p>
              <div className="flex flex-wrap gap-2">
                {client.themes.slice(0, 5).map((theme) => (
                  <span
                    key={theme.label}
                    className="rounded-full border border-white/10 px-2.5 py-1 font-saira text-[10px] text-zinc-300"
                  >
                    {theme.label}
                    {theme.trend === "up" && <span className="text-emerald-400 ml-1">↑</span>}
                    {theme.trend === "down" && <span className="text-rose-400 ml-1">↓</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {client.themes.length === 0 && client.entriesThisWeek === 0 && (
            <p className="font-saira text-sm text-zinc-400 text-center py-4">
              No entries this week
            </p>
          )}
        </div>
      )}

      {/* ── Activity tab ── */}
      {tab === "activity" && (
        <div className="space-y-3">
          {(() => {
            // Merge journal entries + training logs, sorted newest first
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
            const journalItems = client.allEntries
              .filter((e) => new Date(e.created_at) >= cutoff)
              .map((e) => ({
                id: e.id,
                type: "journal" as const,
                date: new Date(e.created_at),
                preview: e.content.slice(0, 100),
                sentiment: e.sentiment,
              }));
            const trainingItems = client.allTrainingWithContent
              .filter((e) => new Date(e.entry_date + "T12:00:00") >= cutoff)
              .map((e) => ({
                id: e.id,
                type: "training" as const,
                date: new Date(e.entry_date + "T12:00:00"),
                preview: [e.thoughts_after, e.what_went_well, e.frustrations].filter(Boolean).join(" · ").slice(0, 100),
                sentiment: null,
              }));
            const all = [...journalItems, ...trainingItems]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 20);

            if (all.length === 0) return (
              <p className="font-saira text-sm text-zinc-400 text-center py-4">
                No activity in the last 14 days
              </p>
            );

            return all.map((item) => (
              <div
                key={item.type + item.id}
                className="rounded-xl border border-white/6 bg-surface-alt p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-[0.16em] ${
                    item.type === "journal"
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                      : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  }`}>
                    {item.type}
                  </span>
                  <span className="font-saira text-[10px] text-zinc-400">
                    {item.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {item.sentiment === "positive" && <span className="ml-auto text-emerald-400 text-xs">+</span>}
                  {item.sentiment === "negative" && <span className="ml-auto text-rose-400 text-xs">–</span>}
                </div>
                {item.preview && (
                  <p className="font-saira text-xs text-zinc-300 leading-relaxed line-clamp-2">
                    {item.preview}
                  </p>
                )}
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Profile tab ── */}
      {tab === "profile" && (
        <div className="space-y-4">
          {/* Lifts */}
          {(client.profile.squat_current_kg || client.profile.bench_current_kg || client.profile.deadlift_current_kg) && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">Current → Goal</p>
              {[
                { label: "SQ", cur: client.profile.squat_current_kg, goal: client.profile.squat_goal_kg },
                { label: "BP", cur: client.profile.bench_current_kg, goal: client.profile.bench_goal_kg },
                { label: "DL", cur: client.profile.deadlift_current_kg, goal: client.profile.deadlift_goal_kg },
              ].filter((l) => l.cur).map((l) => (
                <div key={l.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="font-saira text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 w-8">{l.label}</span>
                  <span className="font-saira text-sm text-zinc-200 tabular-nums">
                    {l.cur}kg
                    {l.goal && <span className="text-zinc-400"> → {l.goal}kg</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Test scores */}
          {(client.testScores.sat.length > 0 || client.testScores.acsi.length > 0 || client.testScores.csai.length > 0 || client.testScores.das.length > 0) && (
            <div className="rounded-xl border border-white/6 bg-surface-alt p-4">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">Latest test scores</p>
              <div className="grid grid-cols-2 gap-2">
                {client.testScores.sat[0] && (
                  <div className="rounded-lg border border-white/5 p-2.5 text-center">
                    <p className="font-saira text-xs font-bold text-purple-300">{client.testScores.sat[0].total_score}</p>
                    <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.14em]">SAT</p>
                  </div>
                )}
                {client.testScores.acsi[0] && (
                  <div className="rounded-lg border border-white/5 p-2.5 text-center">
                    <p className="font-saira text-xs font-bold text-blue-300">{client.testScores.acsi[0].total_score}</p>
                    <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.14em]">ACSI</p>
                  </div>
                )}
                {client.testScores.csai[0] && (
                  <div className="rounded-lg border border-white/5 p-2.5 text-center">
                    <p className="font-saira text-xs font-bold text-amber-300">{client.testScores.csai[0].score_cognitive}</p>
                    <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.14em]">CSAI-2</p>
                  </div>
                )}
                {client.testScores.das[0] && (
                  <div className="rounded-lg border border-white/5 p-2.5 text-center">
                    <p className="font-saira text-xs font-bold text-rose-300">{client.testScores.das[0].total_score}</p>
                    <p className="font-saira text-[9px] text-zinc-400 uppercase tracking-[0.14em]">DAS</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meet date + other key fields */}
          <div className="rounded-xl border border-white/6 bg-surface-alt p-4 space-y-2">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">Profile</p>
            {client.profile.meet_date && (
              <div className="flex justify-between">
                <span className="font-saira text-xs text-zinc-400">Meet date</span>
                <span className="font-saira text-xs text-zinc-200">{new Date(client.profile.meet_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
            {client.profile.training_days_per_week && (
              <div className="flex justify-between">
                <span className="font-saira text-xs text-zinc-400">Training days/wk</span>
                <span className="font-saira text-xs text-zinc-200">{client.profile.training_days_per_week}</span>
              </div>
            )}
            {client.profile.weight_category && (
              <div className="flex justify-between">
                <span className="font-saira text-xs text-zinc-400">Weight class</span>
                <span className="font-saira text-xs text-zinc-200">{client.profile.weight_category}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roster summary bar ─────────────────────────────────────────────────────────

function RosterSummary({ clients }: { clients: Client[] }) {
  const { t } = useT();
  const attention    = clients.filter((c) => c.flag === "attention").length;
  const monitor      = clients.filter((c) => c.flag === "monitor").length;
  const stable       = clients.filter((c) => c.flag === "stable").length;
  const avgPositive  = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.positiveRate, 0) / clients.length)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      <SummaryTile value={String(clients.length)}  label={t("coach.athletes")}    color="text-zinc-100"     />
      <SummaryTile value={String(attention)}        label={t("coach.attention")}   color="text-rose-300"    dot="bg-rose-400"    />
      <SummaryTile value={String(monitor)}          label={t("coach.monitor")}     color="text-amber-300"   dot="bg-amber-400"   />
      <SummaryTile value={String(stable)}           label={t("coach.onTrack")}     color="text-emerald-300" dot="bg-emerald-400" />
      <SummaryTile value={`${avgPositive}%`}        label={t("coach.avgPositive7d")} color="text-purple-300"  />
    </div>
  );
}

function SummaryTile({ value, label, color, dot }: { value: string; label: string; color: string; dot?: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-surface-alt p-4 text-center">
      <div className="flex items-center justify-center gap-1.5">
        {dot && <div className={`w-2 h-2 rounded-full ${dot}`} />}
        <p className={`font-saira text-2xl font-extrabold ${color}`}>{value}</p>
      </div>
      <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-400 mt-1">{label}</p>
    </div>
  );
}

// ── Attention alerts banner ────────────────────────────────────────────────────

function AttentionBanner({ attentionAthletes }: { attentionAthletes: Client[] }) {
  const { t } = useT();
  if (!attentionAthletes.length) return null;
  const n = attentionAthletes.length;
  const bannerLabel = n > 1
    ? t("coach.athletesNeedAttentionPlural").replace("{n}", String(n))
    : t("coach.athletesNeedAttention").replace("{n}", String(n));
  return (
    <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-rose-400">&#9888;</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300">
          {bannerLabel}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {attentionAthletes.map((a) => (
          <div key={a.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] text-rose-300 font-saira font-bold">
                {a.displayName[0]}
              </span>
              <span className="font-saira text-xs text-zinc-300">{a.displayName}</span>
              <span className="font-saira text-[10px] text-rose-400">{t("coach.athletePositiveEntries").replace("{pct}", String(a.positiveRate)).replace("{n}", String(a.entries7d))}</span>
            </div>
            <a
              href={`mailto:?subject=Checking in — ${a.displayName}&body=Hi ${a.displayName.split(" ")[0]},%0A%0AI noticed you've had a tough week. Wanted to check in — how are you doing?%0A%0ABest`}
              className="font-saira text-[10px] uppercase tracking-[0.14em] text-rose-400 border border-rose-500/20 rounded-lg px-3 py-1 hover:bg-rose-500/10 transition"
            >
              {t("coach.emailBtn")}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Coach billing card ─────────────────────────────────────────────────────────

function CoachBillingCard({
  athleteCount,
  hasSubscription,
}: {
  athleteCount: number;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleBilling() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/coach-checkout", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const monthlyTotal = athleteCount * 5;

  return (
    <div className={`mb-6 rounded-2xl border px-5 py-4 ${
      !hasSubscription && athleteCount > 0
        ? "border-amber-500/30 bg-amber-500/[0.06]"
        : "border-white/8 bg-white/3"
    }`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-400 mb-1">
            Coach Plan
          </p>
          <p className="text-white font-semibold text-sm">
            {athleteCount} {athleteCount === 1 ? "athlete" : "athletes"}
            {" · "}
            <span className="text-purple-300">€{monthlyTotal}/month</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">€5 per athlete · billed monthly</p>
        </div>
        <button
          onClick={handleBilling}
          disabled={loading}
          className={`flex-shrink-0 rounded-xl px-4 py-2 font-saira text-[10px] uppercase tracking-wider font-semibold transition disabled:opacity-60 disabled:cursor-wait ${
            !hasSubscription && athleteCount > 0
              ? "bg-amber-500 hover:bg-amber-400 text-black"
              : "bg-white/8 hover:bg-white/12 text-zinc-300"
          }`}
        >
          {loading ? "Loading…" : hasSubscription ? "Manage billing" : "Set up billing"}
        </button>
      </div>
      {!hasSubscription && athleteCount > 0 && (
        <p className="mt-2 font-saira text-[10px] text-amber-300">
          ⚠ Billing not set up — please add a payment method to stay active.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Invite link panel ──────────────────────────────────────────────────────────

function InvitePanel({ coachCode }: { coachCode: string }) {
  const { t } = useT();
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
            {t("coach.inviteLabel")}
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
          {copied ? t("coach.copied") : t("coach.copyLink")}
        </button>
      </div>
      <p className="mt-2 font-saira text-[10px] text-zinc-400">
        {t("coach.inviteHint")}
      </p>
    </div>
  );
}

// ── Coach header ───────────────────────────────────────────────────────────────

function CoachHeader({ profile }: { profile: CoachProfile }) {
  const { t } = useT();
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
          <p className="font-saira text-[10px] text-zinc-400">{t("coach.roleCoach")}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher compact />
        <Link
          href="/guide"
          className="font-saira text-[10px] text-zinc-300 hover:text-purple-300 transition"
        >
          {t("coach.guideLink")}
        </Link>
        <a
          href="/auth/sign-out"
          className="font-saira text-[10px] text-zinc-500 hover:text-zinc-400 transition underline underline-offset-2"
        >
          {t("coach.signOut")}
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

// ── Desktop: stat card ────────────────────────────────────────────────────────

function DesktopStatCard({
  value, label, accent,
}: {
  value: string;
  label: string;
  accent: "purple" | "rose" | "amber" | "emerald" | "zinc";
}) {
  const palette = {
    purple:  { text: "text-purple-300",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
    rose:    { text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/20" },
    amber:   { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
    emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    zinc:    { text: "text-zinc-300",    bg: "bg-white/4",        border: "border-white/8" },
  };
  const c = palette[accent];
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} px-5 py-4`}>
      <p className={`font-saira text-2xl font-extrabold tabular-nums ${c.text}`}>{value}</p>
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 mt-1.5">{label}</p>
    </div>
  );
}

// ── Desktop: Coach home dashboard (shown when no athlete selected) ─────────────

function CoachHomePanel({
  clients,
  profile,
  attentionCount,
  noCheckinCount,
  silentCount,
  onSelect,
}: {
  clients: Client[];
  profile: CoachProfile | null;
  attentionCount: number;
  noCheckinCount: number;
  silentCount: number;
  onSelect: (id: string) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile?.display_name.split(" ")[0] ?? "";
  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const avgPositive = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.positiveRate, 0) / clients.length)
    : 0;

  const attentionClients = clients.filter((c) => c.flag === "attention");

  // Cross-athlete recent activity feed
  type FeedItem = {
    clientId: string; clientName: string; clientInitials: string;
    avatarUrl: string | null; flag: Flag;
    type: "journal" | "training"; content: string; date: string;
    sentiment?: string;
  };
  const feedItems: FeedItem[] = [];
  for (const c of clients) {
    for (const e of c.allEntries.slice(0, 3)) {
      feedItems.push({
        clientId: c.id, clientName: c.name, clientInitials: c.initials,
        avatarUrl: c.avatarUrl, flag: c.flag,
        type: "journal", content: e.content, date: e.created_at, sentiment: e.sentiment,
      });
    }
    for (const e of c.allTrainingWithContent.slice(0, 2)) {
      const text = [e.thoughts_before, e.thoughts_after, e.what_went_well, e.frustrations, e.next_session]
        .filter(Boolean).join(" ");
      feedItems.push({
        clientId: c.id, clientName: c.name, clientInitials: c.initials,
        avatarUrl: c.avatarUrl, flag: c.flag,
        type: "training", content: text, date: e.entry_date + "T12:00:00",
      });
    }
  }
  feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (clients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-sm px-8">
          <p className="text-5xl mb-5">🏋️</p>
          <p className="font-saira text-base font-semibold text-zinc-300 mb-2">No athletes yet</p>
          <p className="font-saira text-sm text-zinc-500 leading-relaxed">
            Share your invite link to get started. Athletes who join via your link will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-y-auto h-full">
      {/* Greeting */}
      <div className="mb-7">
        <h1 className="font-saira text-2xl font-bold text-white">
          {greeting}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="font-saira text-sm text-zinc-400 mt-1">{todayStr}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <DesktopStatCard value={String(clients.length)} label="Athletes" accent="purple" />
        <DesktopStatCard
          value={String(attentionCount)}
          label="Need attention"
          accent={attentionCount > 0 ? "rose" : "emerald"}
        />
        <DesktopStatCard
          value={String(noCheckinCount)}
          label="No check-in this week"
          accent={noCheckinCount > 0 ? "amber" : "emerald"}
        />
        <DesktopStatCard
          value={clients.length > 0 ? `${avgPositive}%` : "—"}
          label="Avg positive"
          accent={avgPositive >= 60 ? "emerald" : avgPositive >= 40 ? "amber" : "rose"}
        />
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left 2 cols: Attention athletes */}
        <div className="col-span-2">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">
            Needs attention
          </p>
          {attentionClients.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-saira text-sm font-semibold text-emerald-400">Everyone&apos;s on track</p>
              <p className="font-saira text-xs text-zinc-400 mt-1">No athletes flagged for attention</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attentionClients.map((c) => {
                const fc = FLAG_CONFIG[c.flag];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarUrl} alt={c.name} className="w-9 h-9 rounded-full flex-shrink-0 border border-rose-500/20" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-saira text-xs font-bold ${fc.bg} ${fc.text} border ${fc.border}`}>
                          {c.initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-saira text-sm font-semibold text-zinc-100 truncate">{c.name}</p>
                        <p className="font-saira text-xs text-zinc-400">{c.positiveRate}% positive · {c.entriesThisWeek} entries this week</p>
                      </div>
                      <SentimentSparkline data={c.sentimentWeek} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 3 cols: Recent activity feed */}
        <div className="col-span-3">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3">
            Recent activity
          </p>
          {feedItems.length === 0 ? (
            <p className="font-saira text-sm text-zinc-500 text-center py-10">No entries yet</p>
          ) : (
            <div className="space-y-2">
              {feedItems.slice(0, 8).map((item, i) => {
                const fc = FLAG_CONFIG[item.flag];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelect(item.clientId)}
                    className="w-full text-left rounded-xl border border-white/5 bg-surface-alt hover:bg-white/[0.04] transition px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.avatarUrl} alt={item.clientName} className="w-7 h-7 rounded-full flex-shrink-0 border border-white/10" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-saira text-[10px] font-bold ${fc.bg} ${fc.text}`}>
                          {item.clientInitials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-saira text-xs font-semibold text-zinc-200">{item.clientName}</span>
                          <span className={`font-saira text-[9px] uppercase tracking-wider font-bold ${item.type === "journal" ? "text-purple-400" : "text-blue-400"}`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="font-saira text-xs text-zinc-400 truncate">{item.content.slice(0, 100)}</p>
                      </div>
                      <span className="font-saira text-[10px] text-zinc-500 flex-shrink-0 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compact athlete row (desktop sidebar roster) ───────────────────────────────

function CompactAthleteRow({
  client,
  selected,
  onClick,
}: {
  client: Client;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useT();
  const flag = FLAG_CONFIG[client.flag];

  const renderLastActive = (la: Client["lastActive"]): string => {
    if (la.key === "never") return t("coach.lastActiveNever");
    if (la.key === "justNow") return t("coach.lastActiveJustNow");
    if (la.key === "yesterday") return t("coach.lastActiveYesterday");
    if (la.key === "hoursAgo") return t("coach.hoursAgo").replace("{h}", String(la.h));
    if (la.key === "daysAgo") return t("coach.lastActiveDaysAgo").replace("{n}", String(la.d));
    return "";
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition border-l-2 ${
        selected
          ? "bg-purple-500/15 border-purple-400"
          : "border-transparent hover:bg-white/[0.03] hover:border-white/10"
      }`}
    >
      {/* Avatar */}
      {client.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={client.avatarUrl}
          alt={client.name}
          className="flex-shrink-0 w-9 h-9 rounded-full border border-white/10"
        />
      ) : (
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-saira text-xs font-bold ${
          client.flag === "attention" ? "bg-rose-500/20 text-rose-300" :
          client.flag === "monitor"   ? "bg-amber-500/20 text-amber-300" :
          "bg-purple-500/20 text-purple-300"
        }`}>
          {client.initials}
        </div>
      )}
      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-saira text-sm font-semibold text-zinc-100 truncate">{client.name}</p>
          {client.isCoach && (
            <span className="flex-shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-saira text-[9px] uppercase tracking-wider text-emerald-400">
              {t("coach.roleCoach")}
            </span>
          )}
        </div>
        <p className="font-saira text-xs text-zinc-300 mt-0.5">
          {client.entriesThisWeek} entries · {renderLastActive(client.lastActive)}
        </p>
      </div>
      {/* Sparkline + positive % */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <SentimentSparkline data={client.sentimentWeek} />
        <span className={`font-saira text-[10px] font-semibold tabular-nums ${
          client.positiveRate >= 60 ? "text-emerald-400" :
          client.positiveRate >= 40 ? "text-amber-400" :
          "text-rose-400"
        }`}>{client.positiveRate}%</span>
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const { t } = useT();
  const router = useRouter();
  const [clients, setClients]   = React.useState<Client[]>([]);
  const [profile, setProfile]   = React.useState<CoachProfile | null>(null);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState<string | null>(null);
  const [sort, setSort]         = React.useState<SortKey>("flag");
  const [search, setSearch]     = React.useState("");

  // Feature 1: Coach notes state
  const [coachNotes, setCoachNotes]         = React.useState<Record<string, string>>({});
  const [notesSavedAt, setNotesSavedAt]     = React.useState<Record<string, string>>({});
  const [notesSaving, setNotesSaving]       = React.useState<Record<string, boolean>>({});
  const noteTimers                          = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Feature 3: Entry feedback state (athleteId -> entryId -> feedback)
  const [feedbackByAthlete, setFeedbackByAthlete] = React.useState<
    Record<string, Record<string, { id: string; content: string; created_at: string }>>
  >({});

  // Feature 5: Training entry coach notes (athleteId -> trainingEntryId -> note)
  const [trainingNoteByAthlete, setTrainingNoteByAthlete] = React.useState<
    Record<string, Record<string, string>>
  >({});

  // Feature 4: Sentiment window per athlete
  const [sentimentWindows, setSentimentWindows] = React.useState<Record<string, 7 | 30 | 60>>({});

  // Desktop two-panel: selected athlete
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Mobile: selected athlete for bottom sheet
  const [mobileSelectedId, setMobileSelectedId] = React.useState<string | null>(null);

  // What's New / broadcast modal
  const [notifications, setNotifications] = React.useState<NotificationState | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [profileRes, athletesRes, notesRes, notifRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/coach/athletes"),
          fetch("/api/coach/notes"),
          fetch("/api/notifications"),
        ]);

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData?.broadcast || notifData?.devlogNew) {
            setNotifications(notifData as NotificationState);
          }
        }

        if (!profileRes.ok || !athletesRes.ok) {
          setError(t("coach.errorLoad"));
          return;
        }

        const prof: CoachProfile = await profileRes.json();
        if ((prof as any).coach_status === "pending") {
          router.replace("/coach/pending");
          return;
        }
        if (prof.role !== "coach") {
          setError(t("coach.errorCoachOnly"));
          return;
        }

        const athletes: AthleteRaw[] = await athletesRes.json();
        const computed = athletes.map(computeClient);
        setProfile(prof);
        setClients(computed);

        // Populate feedback state from loaded athlete data
        const initialFeedback: Record<string, Record<string, { id: string; content: string; created_at: string }>> = {};
        for (const a of athletes) {
          initialFeedback[a.id] = a.feedbackByEntryId ?? {};
        }
        setFeedbackByAthlete(initialFeedback);

        // Load notes
        if (notesRes.ok) {
          const notesData: Record<string, { content: string; updated_at: string }> = await notesRes.json();
          const notes: Record<string, string> = {};
          const savedAts: Record<string, string> = {};
          for (const [athleteId, note] of Object.entries(notesData)) {
            notes[athleteId] = note.content;
            savedAts[athleteId] = note.updated_at;
          }
          setCoachNotes(notes);
          setNotesSavedAt(savedAts);
        }
      } catch {
        setError(t("coach.errorNetwork"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Debounced note auto-save
  const handleNoteChange = React.useCallback((athleteId: string, value: string) => {
    setCoachNotes((prev) => ({ ...prev, [athleteId]: value }));

    if (noteTimers.current[athleteId]) {
      clearTimeout(noteTimers.current[athleteId]);
    }

    noteTimers.current[athleteId] = setTimeout(async () => {
      setNotesSaving((prev) => ({ ...prev, [athleteId]: true }));
      try {
        const res = await fetch("/api/coach/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athlete_id: athleteId, content: value }),
        });
        if (res.ok) {
          const data = await res.json() as { updated_at: string };
          setNotesSavedAt((prev) => ({ ...prev, [athleteId]: data.updated_at }));
        }
      } catch { /* ignore */ }
      finally {
        setNotesSaving((prev) => ({ ...prev, [athleteId]: false }));
      }
    }, 1500);
  }, []);

  const handleFeedbackSaved = React.useCallback((
    athleteId: string,
    entryId: string,
    feedback: { id: string; content: string; created_at: string },
  ) => {
    setFeedbackByAthlete((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? {}), [entryId]: feedback },
    }));
  }, []);

  const handleTrainingNoteSaved = React.useCallback((
    athleteId: string,
    entryId: string,
    note: string,
  ) => {
    setTrainingNoteByAthlete((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? {}), [entryId]: note },
    }));
  }, []);

  const handleSentimentWindowChange = React.useCallback((athleteId: string, w: 7 | 30 | 60) => {
    setSentimentWindows((prev) => ({ ...prev, [athleteId]: w }));
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
    return sortClients(base, sort);
  }, [clients, sort, search]);

  const attentionAthletes = React.useMemo(
    () => clients.filter((c) => c.flag === "attention"),
    [clients],
  );

  const selectedClient = React.useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId],
  );

  const mobileSelectedClient = React.useMemo(
    () => clients.find((c) => c.id === mobileSelectedId) ?? null,
    [clients, mobileSelectedId],
  );

  const noCheckinThisWeek = React.useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return clients.filter((c) =>
      !c.weeklyCheckins.some((wc) => new Date(wc.week_start ?? wc.created_at ?? "") >= weekStart)
    ).length;
  }, [clients]);

  const silentThisWeek = React.useMemo(
    () => clients.filter((c) => c.entriesThisWeek === 0).length,
    [clients],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative bg-surface-base text-white">
      {/* What's New / broadcast modal */}
      {notifications && (
        <NotificationModal
          state={notifications}
          onDone={() => setNotifications(null)}
        />
      )}

      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.11),transparent_55%)]" />
      </div>

      {/* ══ MOBILE HOME view ══════════════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 min-h-screen pt-16 pb-24">
        <div className="mx-auto max-w-lg px-4">

          {/* Header */}
          <div className="mb-5 pt-4">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              PowerFlow · Coach
            </p>
            <h1 className="mt-1 font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
              {profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : t("coach.pageHeading")}
            </h1>
          </div>

          {/* Invite / billing when no athletes yet */}
          {profile?.coach_code && clients.length === 0 && <InvitePanel coachCode={profile.coach_code} />}
          <CoachBillingCard athleteCount={clients.length} hasSubscription={!!profile?.stripe_coach_sub_id} />

          {/* ── Summary strip ── */}
          {clients.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Needs attention */}
              <div className={`rounded-2xl border p-3 text-center ${
                attentionAthletes.length > 0
                  ? "border-rose-500/30 bg-rose-500/8"
                  : "border-white/6 bg-surface-alt"
              }`}>
                <p className={`font-saira text-2xl font-extrabold ${attentionAthletes.length > 0 ? "text-rose-300" : "text-zinc-400"}`}>
                  {attentionAthletes.length}
                </p>
                <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400 mt-0.5 leading-tight">
                  {t("coach.attention")}
                </p>
              </div>
              {/* No check-in */}
              <div className={`rounded-2xl border p-3 text-center ${
                noCheckinThisWeek > 0
                  ? "border-amber-500/30 bg-amber-500/8"
                  : "border-white/6 bg-surface-alt"
              }`}>
                <p className={`font-saira text-2xl font-extrabold ${noCheckinThisWeek > 0 ? "text-amber-300" : "text-zinc-400"}`}>
                  {noCheckinThisWeek}
                </p>
                <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400 mt-0.5 leading-tight">
                  No check-in
                </p>
              </div>
              {/* Silent this week */}
              <div className={`rounded-2xl border p-3 text-center ${
                silentThisWeek > 0
                  ? "border-zinc-500/30 bg-zinc-500/8"
                  : "border-white/6 bg-surface-alt"
              }`}>
                <p className={`font-saira text-2xl font-extrabold ${silentThisWeek > 0 ? "text-zinc-300" : "text-zinc-400"}`}>
                  {silentThisWeek}
                </p>
                <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400 mt-0.5 leading-tight">
                  Silent 7d
                </p>
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {!error && clients.length === 0 && (
            <div className="rounded-3xl border border-white/5 bg-surface-alt p-10 text-center mt-4">
              <p className="font-saira text-3xl mb-3">👥</p>
              <p className="font-saira text-sm font-semibold text-zinc-300 mb-1">{t("coach.noAthletesTitle")}</p>
              <p className="font-saira text-xs text-zinc-400 max-w-xs mx-auto mb-4">{t("coach.noAthletesBody")}</p>
              {profile?.coach_code && (
                <p className="font-saira text-xs text-purple-400 font-mono">/join/{profile.coach_code}</p>
              )}
            </div>
          )}

          {/* ── Priority athletes (attention + monitor) ── */}
          {clients.length > 0 && (() => {
            const priority = filtered.filter((c) => c.flag !== "stable");
            const stable   = filtered.filter((c) => c.flag === "stable");
            return (
              <>
                {priority.length > 0 && (
                  <div className="mb-4">
                    <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-2 px-1">
                      {t("coach.attention")} &amp; {t("coach.monitor")}
                    </p>
                    <div className="rounded-2xl border border-white/6 overflow-hidden divide-y divide-white/5">
                      {priority.map((c) => (
                        <MobileAthleteRow key={c.id} client={c} onClick={() => setMobileSelectedId(c.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {stable.length > 0 && (
                  <div className="mb-4">
                    <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-2 px-1">
                      {t("coach.onTrack")} · {stable.length}
                    </p>
                    <div className="rounded-2xl border border-white/6 overflow-hidden divide-y divide-white/5">
                      {stable.map((c) => (
                        <MobileAthleteRow key={c.id} client={c} onClick={() => setMobileSelectedId(c.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* ── See all link ── */}
          {clients.length > 0 && (
            <div className="mt-2 mb-6 text-center">
              <Link
                href="/coach/athletes"
                className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-200 transition"
              >
                Manage roster →
              </Link>
            </div>
          )}

          {/* ── Athlete detail bottom sheet ── */}
          {mobileSelectedClient && (
            <BottomSheet
              open={!!mobileSelectedClient}
              onClose={() => setMobileSelectedId(null)}
              title={mobileSelectedClient.name}
            >
              <MobileAthleteSheet
                client={mobileSelectedClient}
                coachNote={coachNotes[mobileSelectedClient.id] ?? ""}
                onNoteChange={handleNoteChange}
                noteSaving={notesSaving[mobileSelectedClient.id] ?? false}
                feedbackByEntry={feedbackByAthlete[mobileSelectedClient.id] ?? {}}
                onFeedbackSaved={handleFeedbackSaved}
              />
            </BottomSheet>
          )}

        </div>
      </div>

      {/* ══ DESKTOP two-panel layout ════════════════════════════════════════════ */}
      <div className="hidden md:flex h-screen relative z-10 overflow-hidden">

        {/* ── Left panel: roster sidebar ── */}
        <aside className="w-80 flex-shrink-0 border-r border-white/6 flex flex-col h-full bg-surface-panel/90 overflow-hidden">

          {/* Brand */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/5">
            <span className="font-saira text-[11px] font-bold uppercase tracking-[0.22em] text-purple-300">
              PowerFlow · Coach
            </span>
          </div>

          {/* Coach identity */}
          {profile && (
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-8 h-8 flex-shrink-0 rounded-full border border-white/10" />
                ) : (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-saira text-xs font-bold text-purple-300">
                    {profile.display_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-saira text-sm font-semibold text-zinc-200 truncate">{profile.display_name}</p>
                  <p className="font-saira text-xs text-zinc-400">{t("coach.roleCoach")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <LanguageSwitcher compact />
                <Link href="/today" className="font-saira text-xs text-emerald-600 hover:text-emerald-400 transition">{t("coach.athleteProfileLink")}</Link>
                <Link href="/guide" className="font-saira text-xs text-zinc-400 hover:text-purple-300 transition">{t("coach.guideLink")}</Link>
                <a href="/auth/sign-out" className="font-saira text-xs text-zinc-500 hover:text-zinc-400 transition">{t("coach.signOut")}</a>
              </div>
            </div>
          )}

          {/* Invite link (compact) */}
          {profile?.coach_code && (
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
              <p className="font-saira text-xs uppercase tracking-[0.16em] text-zinc-400 mb-1.5">{t("coach.athleteInviteLabel")}</p>
              <div className="flex items-center gap-2">
                <code className="font-saira text-xs text-purple-400 font-mono truncate flex-1 leading-none">
                  /join/{profile.coach_code}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/join/${profile.coach_code}`;
                    navigator.clipboard.writeText(url).catch(() => {});
                  }}
                  className="flex-shrink-0 font-saira text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1 hover:border-purple-500/40 hover:text-purple-300 transition"
                >
                  {t("coach.copyShort")}
                </button>
              </div>
            </div>
          )}

          {/* Mini roster stats */}
          {clients.length > 0 && (
            <div className="flex-shrink-0 px-4 py-4 border-b border-white/5">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="font-saira text-2xl font-extrabold text-zinc-100">{clients.length}</p>
                  <p className="font-saira text-xs uppercase tracking-[0.12em] text-zinc-300 mt-0.5">{t("coach.sidebarAthletes")}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="font-saira text-2xl font-extrabold text-rose-300">
                    {clients.filter((c) => c.flag === "attention").length}
                  </p>
                  <p className="font-saira text-xs uppercase tracking-[0.12em] text-zinc-300 mt-0.5">{t("coach.sidebarAttention")}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="font-saira text-2xl font-extrabold text-purple-300">
                    {Math.round(clients.reduce((s, c) => s + c.positiveRate, 0) / clients.length)}%
                  </p>
                  <p className="font-saira text-xs uppercase tracking-[0.12em] text-zinc-300 mt-0.5">{t("coach.sidebarAvgPositive")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex-shrink-0 mx-4 mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="font-saira text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Search + sort */}
          {clients.length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 space-y-2.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("coach.searchPlaceholder")}
                className="w-full rounded-xl border border-zinc-700/70 bg-surface-section px-3 py-2 font-saira text-sm text-zinc-100 outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-saira text-xs text-zinc-400 mr-0.5 uppercase tracking-[0.1em]">{t("coach.sortLabel")}</span>
                {([
                  { key: "flag",     label: t("coach.sortPriority") },
                  { key: "positive", label: "+" },
                  { key: "entries",  label: t("coach.sortActivity") },
                  { key: "name",     label: "A–Z" },
                ] as { key: SortKey; label: string }[]).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSort(s.key)}
                    className={`rounded-full border px-2.5 py-0.5 font-saira text-xs uppercase tracking-[0.1em] transition ${
                      sort === s.key
                        ? "border-purple-400 bg-purple-500/20 text-white"
                        : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Roster list — grouped by flag */}
          <div className="flex-1 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-saira text-2xl mb-3">&#128101;</p>
                <p className="font-saira text-sm text-zinc-300 mb-1">{t("coach.noAthletesDesktop")}</p>
                <p className="font-saira text-xs text-zinc-500 leading-relaxed">
                  {t("coach.noAthletesDesktopHint")}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="font-saira text-sm text-zinc-400 text-center py-10">{t("coach.noSearchMatch")}</p>
            ) : (() => {
              const priorityRows = filtered.filter((c) => c.flag === "attention" || c.flag === "monitor");
              const stableRows   = filtered.filter((c) => c.flag === "stable");
              const renderRow = (client: Client) => (
                <CompactAthleteRow
                  key={client.id}
                  client={client}
                  selected={selectedId === client.id}
                  onClick={() => setSelectedId(selectedId === client.id ? null : client.id)}
                />
              );
              return (
                <>
                  {priorityRows.length > 0 && (
                    <>
                      <div className="px-4 pt-3 pb-1.5">
                        <span className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-rose-400/70">
                          Priority
                        </span>
                      </div>
                      {priorityRows.map(renderRow)}
                    </>
                  )}
                  {stableRows.length > 0 && (
                    <>
                      <div className={`px-4 pb-1.5 ${priorityRows.length > 0 ? "pt-3 border-t border-white/5 mt-1" : "pt-3"}`}>
                        <span className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Stable
                        </span>
                      </div>
                      {stableRows.map(renderRow)}
                    </>
                  )}
                </>
              );
            })()}
          </div>

        </aside>

        {/* ── Right panel ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-base">
          {selectedClient ? (
            <>
              {/* Sticky athlete header */}
              <div className="flex-shrink-0 sticky top-0 z-10 bg-surface-base/95 backdrop-blur-sm border-b border-white/6 px-8 py-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {selectedClient.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedClient.avatarUrl}
                      alt={selectedClient.name}
                      className={`w-12 h-12 rounded-full flex-shrink-0 border ${
                        selectedClient.flag === "attention" ? "border-rose-500/40" :
                        selectedClient.flag === "monitor"   ? "border-amber-500/40" :
                        "border-purple-500/30"
                      }`}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-saira text-base font-bold border ${
                      selectedClient.flag === "attention" ? "bg-rose-500/20 text-rose-200 border-rose-500/30" :
                      selectedClient.flag === "monitor"   ? "bg-amber-500/20 text-amber-200 border-amber-500/30" :
                      "bg-purple-500/20 text-purple-200 border-purple-500/30"
                    }`}>
                      {selectedClient.initials}
                    </div>
                  )}

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-saira text-lg font-bold text-white leading-none">{selectedClient.name}</h2>
                      {selectedClient.isCoach && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-emerald-400">
                          {t("coach.roleCoach")}
                        </span>
                      )}
                      {/* Flag badge */}
                      {(() => {
                        const fc = FLAG_CONFIG[selectedClient.flag];
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-saira text-[9px] uppercase tracking-[0.16em] ${fc.border} ${fc.bg} ${fc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${fc.dot}`} />
                            {t(fc.labelKey)}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="font-saira text-xs text-zinc-400 mt-1">
                      {(() => {
                        const la = selectedClient.lastActive;
                        const laStr = la.key === "never" ? t("coach.lastActiveNever")
                          : la.key === "justNow" ? t("coach.lastActiveJustNow")
                          : la.key === "yesterday" ? t("coach.lastActiveYesterday")
                          : la.key === "hoursAgo" ? t("coach.hoursAgo").replace("{h}", String(la.h))
                          : t("coach.lastActiveDaysAgo").replace("{n}", String((la as { key: "daysAgo"; d: number }).d));
                        return `${selectedClient.entriesThisWeek} entries this week · last active ${laStr}`;
                      })()}
                    </p>
                  </div>

                  {/* Right-side quick stats */}
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div title="7-day sentiment trend">
                      <SentimentSparkline data={selectedClient.sentimentWeek} />
                    </div>
                    <div className="text-right">
                      <p className={`font-saira text-xl font-extrabold tabular-nums ${
                        selectedClient.positiveRate >= 60 ? "text-emerald-300" :
                        selectedClient.positiveRate >= 40 ? "text-amber-300" : "text-rose-300"
                      }`}>{selectedClient.positiveRate}%</p>
                      <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-400">positive</p>
                    </div>
                    <span className={`font-saira text-xl font-bold ${TREND_COLOR[selectedClient.trend]}`}>
                      {TREND_ICON[selectedClient.trend]}
                    </span>
                    {selectedClient.flag === "attention" && (
                      <a
                        href={`mailto:?subject=Checking in — ${selectedClient.displayName}&body=Hi ${selectedClient.displayName.split(" ")[0]},%0A%0AI noticed you've had a tough week. Wanted to check in — how are you doing?%0A%0ABest`}
                        className="font-saira text-xs uppercase tracking-[0.12em] text-rose-400 border border-rose-500/20 rounded-xl px-4 py-2 hover:bg-rose-500/10 transition flex-shrink-0"
                      >
                        ⚠ {t("coach.emailBtn")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable detail body */}
              <div className="flex-1 overflow-y-auto p-8">
                <ClientCard
                  key={selectedClient.id}
                  client={selectedClient}
                  forceOpen={true}
                  coachNote={coachNotes[selectedClient.id] ?? ""}
                  noteSavedAt={notesSavedAt[selectedClient.id] ?? null}
                  noteSaving={notesSaving[selectedClient.id] ?? false}
                  onNoteChange={handleNoteChange}
                  feedbackByEntry={feedbackByAthlete[selectedClient.id] ?? {}}
                  onFeedbackSaved={handleFeedbackSaved}
                  trainingNoteByEntry={trainingNoteByAthlete[selectedClient.id] ?? {}}
                  onTrainingNoteSaved={handleTrainingNoteSaved}
                  sentimentWindow={sentimentWindows[selectedClient.id] ?? 7}
                  onSentimentWindowChange={handleSentimentWindowChange}
                />
              </div>
            </>
          ) : (
            <CoachHomePanel
              clients={clients}
              profile={profile}
              attentionCount={attentionAthletes.length}
              noCheckinCount={noCheckinThisWeek}
              silentCount={silentThisWeek}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
