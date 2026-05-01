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
  onDone: () => void;   // called after successful submit or skip
  onSkip?: () => void;  // dismiss without submitting
}

// ── Rating row ────────────────────────────────────────────────────────────────

function RatingRow({
  label,
  tapToRate,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  tapToRate: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {label}
        </span>
        {value === null && (
          <span className="font-saira text-[9px] text-zinc-500 uppercase tracking-[0.14em]">{tapToRate}</span>
        )}
      </div>
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg sm:rounded-xl border font-saira text-xs sm:text-sm font-semibold transition ${
              value === n
                ? "border-purple-500 bg-purple-600 text-white"
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

// ── Main modal ────────────────────────────────────────────────────────────────

export default function WeeklyCheckinModal({ targetWeek, onDone, onSkip }: Props) {
  const { t } = useT();
  const label = weekLabel(targetWeek.week, targetWeek.weekStart);

  const [mood,      setMood]      = React.useState<number | null>(null);
  const [training,  setTraining]  = React.useState<number | null>(null);
  const [readiness, setReadiness] = React.useState<number | null>(null);
  const [energy,    setEnergy]    = React.useState<number | null>(null);
  const [sleep,     setSleep]     = React.useState<number | null>(null);

  const [biggestWin,       setBiggestWin]       = React.useState("");
  const [biggestChallenge, setBiggestChallenge] = React.useState("");
  const [focusNextWeek,    setFocusNextWeek]    = React.useState("");

  const [saving,  setSaving]  = React.useState(false);
  const [error,   setError]   = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_rating:      mood ?? 5,
          training_quality: training ?? 5,
          readiness_rating: readiness ?? 5,
          energy_rating:    energy ?? 5,
          sleep_rating:     sleep ?? 5,
          biggest_win:      biggestWin,
          biggest_challenge: biggestChallenge,
          focus_next_week:  focusNextWeek,
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
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-purple-400 mb-1">
              {t("checkin.weeklyTitle")}
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

        <div className="px-6 py-5 space-y-6">

          {/* Ratings */}
          <div className="space-y-5">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-300">
              {t("checkin.rateYourWeek")}
            </p>
            <RatingRow label={t("checkin.labelMood")}      tapToRate={t("checkin.tapToRate")} value={mood}      onChange={setMood}      lowLabel={t("checkin.lowMood")}      highLabel={t("checkin.highMood")} />
            <RatingRow label={t("checkin.labelTraining")}  tapToRate={t("checkin.tapToRate")} value={training}  onChange={setTraining}  lowLabel={t("checkin.lowTraining")}  highLabel={t("checkin.highTraining")} />
            <RatingRow label={t("checkin.labelEnergy")}    tapToRate={t("checkin.tapToRate")} value={energy}    onChange={setEnergy}    lowLabel={t("checkin.lowEnergy")}    highLabel={t("checkin.highEnergy")} />
            <RatingRow label={t("checkin.labelSleep")}     tapToRate={t("checkin.tapToRate")} value={sleep}     onChange={setSleep}     lowLabel={t("checkin.lowSleep")}     highLabel={t("checkin.highSleep")} />
            <RatingRow label={t("checkin.labelReadiness")} tapToRate={t("checkin.tapToRate")} value={readiness} onChange={setReadiness} lowLabel={t("checkin.lowReadiness")} highLabel={t("checkin.highReadiness")} />
          </div>

          {/* Text questions */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <p className="font-saira text-base font-extrabold uppercase tracking-[0.12em] text-white">
                {t("checkin.reflect")}
              </p>
              <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
                {t("common.optional")}
              </p>
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                {t("checkin.qBiggestWin")}
              </label>
              <textarea
                value={biggestWin}
                onChange={(e) => setBiggestWin(e.target.value)}
                placeholder={t("checkin.placeholderWin")}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                {t("checkin.qMainChallenge")}
              </label>
              <textarea
                value={biggestChallenge}
                onChange={(e) => setBiggestChallenge(e.target.value)}
                placeholder={t("checkin.placeholderChallenge")}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>

            <div>
              <label className="block font-saira text-[11px] text-zinc-400 mb-1.5">
                {t("checkin.qFocusNext")}
              </label>
              <textarea
                value={focusNextWeek}
                onChange={(e) => setFocusNextWeek(e.target.value)}
                placeholder={t("checkin.placeholderFocus")}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-700 outline-none focus:border-purple-400/50 resize-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center gap-3">
              <span className="text-rose-400 flex-shrink-0">!</span>
              <p className="font-saira text-xs text-rose-300">{error}</p>
              <button type="button" onClick={handleSubmit} disabled={saving} className="ml-auto font-saira text-xs text-rose-300 underline hover:text-rose-200 transition flex-shrink-0">
                {t("common.retry")}
              </button>
            </div>
          )}

          {/* Actions */}
          {[mood, training, readiness, energy, sleep].some((v) => v === null) && (
            <p className="font-saira text-[10px] text-zinc-500 text-center">{t("checkin.rateAllToSubmit")}</p>
          )}
          <div className="flex gap-3 pb-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || [mood, training, readiness, energy, sleep].some((v) => v === null)}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
            >
              {saving ? t("common.saving") : t("checkin.submitCheckin")}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-xl border border-white/10 px-4 py-3 font-saira text-[11px] text-zinc-300 hover:text-zinc-300 hover:border-white/20 transition"
              >
                {t("checkin.later")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
