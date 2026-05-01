"use client";

import React from "react";
import { weekLabel } from "@/lib/weeklyCheckin";
import { useT } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TargetWeek {
  week: number;
  year: number;
  weekStart: string;
}

interface Props {
  targetWeek: TargetWeek;
  onDone: () => void;
  onSkip?: () => void;
}

// ── Shared rating row (identical style to WeeklyCheckinModal) ─────────────────

function RatingRow({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  accent = "purple",
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
  accent?: "purple" | "amber";
}) {
  const selected =
    accent === "amber"
      ? "border-amber-500 bg-amber-500/80 text-white"
      : "border-purple-500 bg-purple-600 text-white";

  return (
    <div className="space-y-2">
      <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </span>
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg sm:rounded-xl border font-saira text-xs sm:text-sm font-semibold transition ${
              value === n
                ? selected
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between font-saira text-[9px] text-zinc-500 px-0.5">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionHeading({
  title,
  sub,
  accent = false,
}: {
  title: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <p
        className={`font-saira text-base font-extrabold uppercase tracking-[0.12em] ${
          accent ? "text-amber-400" : "text-white"
        }`}
      >
        {title}
      </p>
      {sub && (
        <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.18em]">{sub}</p>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function MonthlyCheckinModal({ targetWeek, onDone, onSkip }: Props) {
  const { t } = useT();
  const label = weekLabel(targetWeek.week, targetWeek.weekStart);

  // Step 1 = weekly ratings + reflections, Step 2 = monthly deep dive
  const [step, setStep] = React.useState(1);

  // ── Weekly ratings ──────────────────────────────────────────────────────────
  const [mood,      setMood]      = React.useState<number | null>(null);
  const [training,  setTraining]  = React.useState<number | null>(null);
  const [readiness, setReadiness] = React.useState<number | null>(null);
  const [energy,    setEnergy]    = React.useState<number | null>(null);
  const [sleep,     setSleep]     = React.useState<number | null>(null);

  // ── Weekly reflection ───────────────────────────────────────────────────────
  const [biggestWin,       setBiggestWin]       = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState("");
  const [focusNextWeek,    setFocusNextWeek]    = React.useState("");

  // ── Monthly-specific ────────────────────────────────────────────────────────
  const [overallProgress,      setOverallProgress]      = React.useState<number | null>(null);
  const [biggestBreakthrough,  setBiggestBreakthrough]  = React.useState("");
  const [keyLesson,            setKeyLesson]            = React.useState("");
  const [nextMonthIntention,   setNextMonthIntention]   = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error,  setError]  = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/monthly-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_rating:          mood ?? 5,
          training_quality:     training ?? 5,
          readiness_rating:     readiness ?? 5,
          energy_rating:        energy ?? 5,
          sleep_rating:         sleep ?? 5,
          overall_progress:     overallProgress ?? 5,
          biggest_win:          biggestWin,
          biggest_challenge:    biggestChallenge,
          focus_next_week:      focusNextWeek,
          biggest_breakthrough: biggestBreakthrough,
          key_lesson:           keyLesson,
          next_month_intention: nextMonthIntention,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onDone();
    } catch {
      setError("Couldn't save — please try again.");
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-alt border border-white/8 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between px-6 pt-6 pb-4 bg-surface-alt border-b border-white/5">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400 mb-1">
              {t("checkin.monthlyTitle")}
            </p>
            <h2 className="font-saira text-lg font-extrabold uppercase tracking-[0.08em]">
              {label}
            </h2>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-300 hover:bg-white/5 transition"
              aria-label="Skip for now"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Step progress */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
              style={{ width: `${step === 1 ? 50 : 100}%` }}
            />
          </div>
          <span className="font-saira text-[10px] text-zinc-500 flex-shrink-0">{t("checkin.stepOf").replace("{n}", String(step))}</span>
        </div>

        <div className="px-6 py-5 space-y-6">

          {step === 1 ? (
            <>
              {/* ── Weekly ratings ───────────────────────────────────────────── */}
              <div className="space-y-5">
                <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
                  {t("checkin.rateYourWeek")}
                </p>
                <RatingRow label={t("checkin.labelMood")}      value={mood}      onChange={setMood}      lowLabel={t("checkin.lowMood")}      highLabel={t("checkin.highMood")} />
                <RatingRow label={t("checkin.labelTraining")}  value={training}  onChange={setTraining}  lowLabel={t("checkin.lowTraining")}  highLabel={t("checkin.highTraining")} />
                <RatingRow label={t("checkin.labelEnergy")}    value={energy}    onChange={setEnergy}    lowLabel={t("checkin.lowEnergy")}    highLabel={t("checkin.highEnergy")} />
                <RatingRow label={t("checkin.labelSleep")}     value={sleep}     onChange={setSleep}     lowLabel={t("checkin.lowSleep")}     highLabel={t("checkin.highSleep")} />
                <RatingRow label={t("checkin.labelReadiness")} value={readiness} onChange={setReadiness} lowLabel={t("checkin.lowReadiness")} highLabel={t("checkin.highReadiness")} />
              </div>

              {/* ── Weekly reflection ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <SectionHeading title={t("checkin.reflect")} sub={t("common.optional")} />
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qBiggestWin")}</label>
                  <textarea value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)} placeholder={t("checkin.placeholderWin")} rows={2} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition" />
                </div>
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qMainChallenge")}</label>
                  <textarea value={biggestChallenge} onChange={(e) => setBiggestChallenge(e.target.value)} placeholder={t("checkin.placeholderChallenge")} rows={2} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition" />
                </div>
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qFocusNext")}</label>
                  <textarea value={focusNextWeek} onChange={(e) => setFocusNextWeek(e.target.value)} placeholder={t("checkin.placeholderFocus")} rows={2} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition" />
                </div>
              </div>

              {[mood, training, readiness, energy, sleep].some((v) => v === null) && (
                <p className="font-saira text-[10px] text-zinc-500 text-center">{t("checkin.rateAllToContinue")}</p>
              )}
              <div className="flex gap-3 pb-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={[mood, training, readiness, energy, sleep].some((v) => v === null)}
                  className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
                >
                  {t("checkin.nextMonthlyStep")}
                </button>
                {onSkip && (
                  <button type="button" onClick={onSkip} className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-300 hover:border-white/20 transition">
                    {t("checkin.later")}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* ── Monthly-specific section ──────────────────────────────────── */}
              <div className="space-y-5">
                <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
                  {t("checkin.rateYourMonth")}
                </p>
                <RatingRow label={t("checkin.labelMonthlyProgress")} value={overallProgress} onChange={setOverallProgress} lowLabel={t("checkin.lowMonthly")} highLabel={t("checkin.highMonthly")} accent="amber" />
              </div>

              <div className="space-y-4">
                <SectionHeading title={t("checkin.lookBack")} sub={t("common.optional")} accent />
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qBreakthrough")}</label>
                  <textarea value={biggestBreakthrough} onChange={(e) => setBiggestBreakthrough(e.target.value)} placeholder={t("checkin.placeholderBreakthrough")} rows={2} className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition" />
                </div>
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qKeyLesson")}</label>
                  <textarea value={keyLesson} onChange={(e) => setKeyLesson(e.target.value)} placeholder={t("checkin.placeholderKeyLesson")} rows={2} className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition" />
                </div>
                <div>
                  <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">{t("checkin.qNextMonthIntention")}</label>
                  <textarea value={nextMonthIntention} onChange={(e) => setNextMonthIntention(e.target.value)} placeholder={t("checkin.placeholderNextMonth")} rows={2} className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-400/40 resize-none transition" />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center gap-3">
                  <span className="text-rose-400 flex-shrink-0">!</span>
                  <p className="font-saira text-xs text-rose-300">{error}</p>
                  <button type="button" onClick={handleSubmit} disabled={saving} className="ml-auto font-saira text-xs text-rose-300 underline hover:text-rose-200 transition flex-shrink-0">{t("common.retry")}</button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pb-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-400 hover:text-zinc-300 hover:border-white/20 transition">← {t("common.back")}</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
                >
                  {saving ? t("common.saving") : t("checkin.submitCheckin")}
                </button>
                {onSkip && (
                  <button type="button" onClick={onSkip} className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-300 hover:border-white/20 transition">
                    {t("checkin.later")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
