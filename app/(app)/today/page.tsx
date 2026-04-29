"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhaseBadge from "@/app/components/PhaseBadge";
import { DateTabs, offsetDate } from "@/app/components/DateTabs";
import { computePhase } from "@/lib/phase";
import { computeGLPoints, currentTotal, goalTotal } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";
import { type TrainingEntry } from "@/lib/training";
import { ymdLocal } from "@/lib/date";
import { markCheckinDone } from "@/lib/checkinReminder";
import { useT } from "@/lib/i18n";

// ── Helpers ───────────────────────────────────────────────────────────────────

function greetingKey(): "today.greetingMorning" | "today.greetingAfternoon" | "today.greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "today.greetingMorning";
  if (h < 17) return "today.greetingAfternoon";
  return "today.greetingEvening";
}

function localeForDate(loc: string): string {
  if (loc === "de") return "de-DE";
  if (loc === "hu") return "hu-HU";
  return "en-GB";
}

/** Format a YYYY-MM-DD string for display (avoids UTC off-by-one). */
function formatDateForYmd(ymd: string, loc: string): string {
  const d = new Date(ymd + "T12:00:00");
  return d.toLocaleDateString(localeForDate(loc), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function firstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.split(" ")[0];
}

function todayKey(): string {
  return ymdLocal();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const router = useRouter();
  const { t, locale } = useT();
  const [profile, setProfile]           = React.useState<AthleteProfile | null>(null);
  const [loading, setLoading]           = React.useState(true);

  // ── Selected date (today by default) ───────────────────────────────────────
  const [selectedDate, setSelectedDate] = React.useState<string>(() => todayKey());
  /** "loading" = fetching, null = no entry for this date, TrainingEntry = found */
  const [entry, setEntry]               = React.useState<TrainingEntry | null | "loading">("loading");
  const [dayTypeSaving, setDayTypeSaving] = React.useState(false);
  const isFirstMount = React.useRef(true);

  // Initial load — profile + entry for selected (today) date in parallel
  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch(`/api/training/entries?date=${selectedDate}`).then((r) => r.json()),
    ])
      .then(([prof, trainingData]) => {
        if (prof?.id) {
          setProfile(prof);
          if (prof.role === "athlete" && prof.onboarding_complete === false) {
            router.replace("/onboarding");
            return;
          }
        }
        const e = trainingData?.id ? (trainingData as TrainingEntry) : null;
        setEntry(e);
        if (selectedDate === todayKey() && e) markCheckinDone();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch entry whenever the date tab changes (skip initial mount)
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setEntry("loading");
    fetch(`/api/training/entries?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        const e = data?.id ? (data as TrainingEntry) : null;
        setEntry(e);
        if (selectedDate === todayKey() && e) markCheckinDone();
      })
      .catch(() => setEntry(null));
  }, [selectedDate]);

  // Coaches go to their dashboard
  React.useEffect(() => {
    if (profile?.role === "coach") router.replace("/coach");
  }, [profile, router]);

  // ── Select day type — saves immediately ─────────────────────────────────────
  const selectDayType = async (mode: "training" | "rest") => {
    if (dayTypeSaving) return;
    setDayTypeSaving(true);
    try {
      const res = await fetch("/api/training/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: selectedDate,
          is_training_day: mode === "training",
          mood_rating: null,
        }),
      });
      const saved = res.ok ? await res.json() : {};
      setEntry({
        id: saved.id ?? "",
        user_id: "",
        entry_date: selectedDate,
        is_training_day: mode === "training",
        mood_rating: null,
        thoughts_before: null,
        thoughts_after: null,
        what_went_well: null,
        frustrations: null,
        next_session: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (selectedDate === todayKey()) markCheckinDone();
    } finally {
      setDayTypeSaving(false);
    }
  };

  const phase = profile ? computePhase(profile.meet_date) : null;

  // GL points
  const total    = profile ? currentTotal(profile) : null;
  const glPoints = (total && profile?.bodyweight_kg && profile?.gender)
    ? computeGLPoints(total, profile.bodyweight_kg, profile.gender)
    : null;

  // Date-tab derived values
  const isToday = selectedDate === todayKey();
  const dateLabel = isToday
    ? t("today.tabToday")
    : selectedDate === offsetDate(1)
    ? t("today.tabYesterday")
    : t("today.tabDayBefore");

  const tabLabels = {
    today: t("today.tabToday"),
    yesterday: t("today.tabYesterday"),
    dayBefore: t("today.tabDayBefore"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── No entry for selected date (or loading a different date) ────────────────
  if (entry === "loading" || entry === null) {
    return (
      <div className="min-h-screen bg-[#050608]">
        {/* Date tabs always visible */}
        <div className="pt-10 px-4 sm:px-6 max-w-lg mx-auto md:max-w-2xl">
          <DateTabs selected={selectedDate} onChange={setSelectedDate} labels={tabLabels} />
        </div>

        {entry === "loading" ? (
          <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 100px)" }}>
            <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        ) : (
          <DayPickerScreen
            onSelect={selectDayType}
            saving={dayTypeSaving}
            dateLabel={dateLabel}
            isToday={isToday}
            locale={locale}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto md:max-w-2xl">

      {/* ── Date tabs ─────────────────────────────────────────── */}
      <DateTabs selected={selectedDate} onChange={setSelectedDate} labels={tabLabels} />

      {/* ── Greeting / date header ────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          {t("brand.name").toUpperCase()} · {t("today.pageLabel")}
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {isToday
            ? `${t(greetingKey())}${profile ? `, ${firstName(profile.display_name)}` : ""}`
            : dateLabel}
        </h1>
        <p className="font-saira text-sm text-zinc-500">{formatDateForYmd(selectedDate, locale)}</p>
      </div>

      {/* ── Entry ✓ card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-saira text-xs font-semibold text-emerald-300">
            {dateLabel} ✓
          </span>
          <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.14em] ${
            entry.is_training_day
              ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
              : "border-zinc-600/40 bg-zinc-600/10 text-zinc-400"
          }`}>
            {entry.is_training_day ? t("today.training") : t("today.rest")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEntry(null)}
          className="flex-shrink-0 font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
        >
          {t("today.change")}
        </button>
      </div>

      {/* ── Past training day → link to journal for details ───── */}
      {!isToday && entry.is_training_day && (
        <Link
          href="/journal"
          className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/[0.08] p-4 mb-5 group hover:border-purple-400/50 transition"
        >
          <div>
            <p className="font-saira text-sm font-semibold text-purple-300 group-hover:text-white transition mb-0.5">
              {t("journal.logForDate").replace("{date}", dateLabel.toLowerCase())}
            </p>
            <p className="font-saira text-xs text-zinc-500">
              {t("journal.trainingDay")} · {t("journal.pageLabel")}
            </p>
          </div>
          <span className="text-purple-400 text-lg">→</span>
        </Link>
      )}

      {/* ── Phase block ───────────────────────────────────────── */}
      {phase ? (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-2">
                {t("today.trainingPhase")}
              </p>
              <PhaseBadge phase={phase.phase} />
            </div>
            <div className="text-right">
              <p className="font-saira text-2xl font-bold text-white tabular-nums">
                {phase.daysUntil}
              </p>
              <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.14em]">
                {t("today.daysToGo")}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="font-saira text-xs text-zinc-400">{phase.label}</p>
            {profile?.weight_category && (
              <span className="font-saira text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400">
                {profile.weight_category}
              </span>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/you"
          className="flex items-center justify-between rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 p-5 mb-5 group hover:border-purple-400/50 transition"
        >
          <div>
            <p className="font-saira text-sm font-semibold text-purple-300 group-hover:text-white transition mb-0.5">
              {t("today.setNextCompetition")}
            </p>
            <p className="font-saira text-xs text-zinc-500">
              {t("today.unlockPhaseTracking")}
            </p>
          </div>
          <span className="text-purple-400 text-lg">→</span>
        </Link>
      )}

      {/* ── Strength goals + GL ───────────────────────────────── */}
      <StrengthCard profile={profile} glPoints={glPoints} />

      {/* ── Mental goals ─────────────────────────────────────── */}
      <MentalGoalsCard goals={profile?.mental_goals ?? []} />

      {/* ── Affirmations ──────────────────────────────────────── */}
      {(profile?.affirmations ?? []).length > 0 ? (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-5 py-4 mb-6">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-3">
            {t("today.yourAffirmations")}
          </p>
          <ul className="space-y-2">
            {profile!.affirmations.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5 flex-shrink-0 text-xs">✦</span>
                <p className="font-saira text-sm text-zinc-200 leading-relaxed">{a}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : profile && (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] px-5 py-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-saira text-xs font-semibold text-zinc-400 mb-0.5">{t("today.noAffirmations")}</p>
            <p className="font-saira text-[11px] text-zinc-600 leading-relaxed">
              {t("today.selfTalkAppears")}
            </p>
          </div>
          <Link
            href="/library#affirmations"
            className="flex-shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-saira text-[10px] uppercase tracking-[0.14em] text-purple-300 hover:bg-purple-500/20 transition"
          >
            {t("today.setUpArrow")}
          </Link>
        </div>
      )}

      {/* ── Coach badge ───────────────────────────────────────── */}
      {profile?.coach_id && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="font-saira text-xs text-emerald-300">{t("today.connectedToCoach")}</p>
        </div>
      )}

    </div>
  );
}

// ── Day picker (full centred view, used when no entry for selected date) ───────

function DayPickerScreen({
  onSelect,
  saving,
  dateLabel,
  isToday,
  locale,
}: {
  onSelect: (mode: "training" | "rest") => void;
  saving: boolean;
  dateLabel: string;
  isToday: boolean;
  locale: string;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center px-6 pb-10" style={{ minHeight: "calc(100vh - 100px)" }}>
      <div className="w-full max-w-sm">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-2 text-center">
          {t("brand.name").toUpperCase()} · {t("today.pageLabel")}
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2 text-center">
          {isToday
            ? new Date().toLocaleDateString(localeForDate(locale), { weekday: "long" })
            : dateLabel}
        </h1>
        <p className="font-saira text-sm text-zinc-500 mb-10 text-center">
          {t("today.howsTodayLooking")}
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelect("training")}
            disabled={saving}
            className="w-full rounded-2xl border border-purple-500/40 bg-purple-600/15 hover:bg-purple-600/25 disabled:opacity-50 py-5 font-saira text-base font-bold text-white transition"
          >
            {saving ? t("common.saving") : t("today.trainingDayBtn")}
          </button>
          <button
            type="button"
            onClick={() => onSelect("rest")}
            disabled={saving}
            className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-5 font-saira text-base font-bold text-zinc-300 transition"
          >
            {saving ? "…" : t("today.restDayBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Strength card ─────────────────────────────────────────────────────────────

function StrengthCard({
  profile,
  glPoints,
}: {
  profile: AthleteProfile | null;
  glPoints: number | null;
}) {
  const { t } = useT();
  const hasAnyLift =
    profile?.squat_current_kg ||
    profile?.bench_current_kg ||
    profile?.deadlift_current_kg;

  const ct = profile ? currentTotal(profile) : null;
  const gt = profile ? goalTotal(profile) : null;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          {t("today.strengthGoals")}
        </p>
        {glPoints !== null ? (
          <div className="text-right">
            <p className="font-saira text-lg font-bold text-purple-300 tabular-nums leading-none">
              {glPoints}
            </p>
            <p className="font-saira text-[9px] uppercase tracking-[0.14em] text-zinc-600">{t("today.glPts")}</p>
          </div>
        ) : (
          <Link
            href="/you"
            className="font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
          >
            {t("today.addWeight")}
          </Link>
        )}
      </div>

      {hasAnyLift ? (
        <div className="space-y-3">
          {(
            [
              [t("you.squat"),     profile?.squat_current_kg,     profile?.squat_goal_kg     ],
              [t("you.bench"),     profile?.bench_current_kg,     profile?.bench_goal_kg     ],
              [t("you.deadlift"),  profile?.deadlift_current_kg,  profile?.deadlift_goal_kg  ],
            ] as [string, number | null | undefined, number | null | undefined][]
          ).map(([label, current, goal]) => (
            <LiftRow key={label} label={label} current={current ?? null} goal={goal ?? null} />
          ))}
          {(ct || gt) && (
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
              <span className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                {t("today.total")}
              </span>
              <div className="flex items-center gap-2">
                {ct !== null && (
                  <span className="font-saira text-sm font-bold text-white tabular-nums">
                    {ct} kg
                  </span>
                )}
                {gt !== null && (
                  <span className="font-saira text-xs text-zinc-500 tabular-nums">
                    → {gt} kg
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="font-saira text-sm text-zinc-500">{t("today.noLiftsYet")}</p>
          <Link
            href="/you"
            className="font-saira text-xs text-purple-300 hover:text-purple-200 transition"
          >
            {t("today.setGoalsArrow")}
          </Link>
        </div>
      )}
    </div>
  );
}

function LiftRow({
  label,
  current,
  goal,
}: {
  label: string;
  current: number | null;
  goal: number | null;
}) {
  if (!current && !goal) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-saira text-[11px] uppercase tracking-[0.14em] text-zinc-500 w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center gap-2 justify-end">
        {current !== null && (
          <span className="font-saira text-sm font-semibold text-white tabular-nums">
            {current} kg
          </span>
        )}
        {goal !== null && (
          <>
            <span className="text-zinc-600 text-xs">→</span>
            <span className="font-saira text-sm text-purple-300 tabular-nums">{goal} kg</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mental goals card ─────────────────────────────────────────────────────────

function MentalGoalsCard({ goals }: { goals: string[] }) {
  const { t } = useT();
  const filtered = goals.filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          {t("today.mentalGoals")}
        </p>
        <Link
          href="/you"
          className="font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
        >
          {filtered.length ? t("common.edit") : t("today.setGoals")}
        </Link>
      </div>
      {filtered.length ? (
        <ul className="space-y-2">
          {filtered.slice(0, 3).map((g, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="font-saira text-[10px] text-purple-400 font-bold mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-saira text-sm text-zinc-200 leading-snug">{g}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-saira text-sm text-zinc-500">
          {t("today.setMentalGoalsHint")}{" "}
          <Link href="/you" className="text-purple-300 hover:text-purple-200 transition underline">
            {t("today.addNowArrow")}
          </Link>
        </p>
      )}
    </div>
  );
}
