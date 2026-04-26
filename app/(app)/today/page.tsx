"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhaseBadge from "@/app/components/PhaseBadge";
import EntryCard from "@/app/components/EntryCard";
import { computePhase } from "@/lib/phase";
import { computeGLPoints, currentTotal, goalTotal } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";
import type { JournalEntry } from "@/lib/journal";
import { type TrainingEntry } from "@/lib/training";
import { ymdLocal } from "@/lib/date";
import { markCheckinDone } from "@/lib/checkinReminder";

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function firstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.split(" ")[0];
}

function todayKey() {
  return ymdLocal(); // local YYYY-MM-DD (avoids UTC off-by-one)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const router = useRouter();
  const [profile, setProfile]           = React.useState<AthleteProfile | null>(null);
  const [entries, setEntries]           = React.useState<JournalEntry[]>([]);
  const [loading, setLoading]           = React.useState(true);

  // ── Day type state ─────────────────────────────────────────
  const [todayEntry, setTodayEntry]     = React.useState<TrainingEntry | null>(null);
  const [dayTypeSaving, setDayTypeSaving] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/journal/entries?limit=3").then((r) => r.json()),
      fetch(`/api/training/entries?date=${todayKey()}`).then((r) => r.json()),
    ])
      .then(([prof, ents, trainingEntry]) => {
        if (prof?.id) {
          setProfile(prof);
          if (prof.role === "athlete" && prof.onboarding_complete === false) {
            router.replace("/onboarding");
            return;
          }
        }
        setEntries(Array.isArray(ents) ? ents.slice(0, 3) : []);
        if (trainingEntry?.id) {
          setTodayEntry(trainingEntry as TrainingEntry);
          markCheckinDone();
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Coaches go to their dashboard
  React.useEffect(() => {
    if (profile?.role === "coach") router.replace("/coach");
  }, [profile, router]);

  // ── Select day type — saves immediately, no questions sheet ─────────────────
  const selectDayType = async (mode: "training" | "rest") => {
    if (dayTypeSaving) return;
    setDayTypeSaving(true);
    try {
      const res = await fetch("/api/training/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: todayKey(),
          is_training_day: mode === "training",
          mood_rating: null,
        }),
      });
      const saved = res.ok ? await res.json() : {};
      setTodayEntry({
        id: saved.id ?? "",
        user_id: "",
        entry_date: todayKey(),
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
      markCheckinDone();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Full-screen day picker (no entry yet for today) ──────────────────────────
  if (todayEntry === null) {
    return (
      <div className="min-h-screen bg-[#050608]">
        <DayPickerScreen onSelect={selectDayType} saving={dayTypeSaving} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto">

      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · HOME
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {greeting()}{profile ? `, ${firstName(profile.display_name)}` : ""}
        </h1>
        <p className="font-saira text-sm text-zinc-500">{formatDate()}</p>
      </div>

      {/* ── Today ✓ card ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-saira text-xs font-semibold text-emerald-300">Today ✓</span>
          <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.14em] ${
            todayEntry.is_training_day
              ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
              : "border-zinc-600/40 bg-zinc-600/10 text-zinc-400"
          }`}>
            {todayEntry.is_training_day ? "Training" : "Rest"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTodayEntry(null)}
          className="flex-shrink-0 font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
        >
          Change
        </button>
      </div>

      {/* ── Phase block ───────────────────────────────────────── */}
      {phase ? (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-2">
                Training phase
              </p>
              <PhaseBadge phase={phase.phase} />
            </div>
            <div className="text-right">
              <p className="font-saira text-2xl font-bold text-white tabular-nums">
                {phase.daysUntil}
              </p>
              <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.14em]">
                days to go
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
              Set your next competition
            </p>
            <p className="font-saira text-xs text-zinc-500">
              Unlock phase tracking and periodisation
            </p>
          </div>
          <span className="text-purple-400 text-lg">→</span>
        </Link>
      )}

      {/* ── Strength goals + GL ───────────────────────────────── */}
      <StrengthCard profile={profile} glPoints={glPoints} />

      {/* ── Mental goals ─────────────────────────────────────── */}
      <MentalGoalsCard goals={profile?.mental_goals ?? []} />

      {/* ── Coach badge ───────────────────────────────────────── */}
      {profile?.coach_id && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="font-saira text-xs text-emerald-300">Connected to your coach</p>
        </div>
      )}

      {/* ── Recent entries ────────────────────────────────────── */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Recent entries
            </p>
            <Link
              href="/journal"
              className="font-saira text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-[0.16em]"
            >
              See all →
            </Link>
          </div>
          <div className="space-y-3">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-10">
          <p className="font-saira text-sm text-zinc-600 mb-3">No journal entries yet.</p>
          <Link
            href="/journal"
            className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-saira text-xs text-purple-300 hover:bg-purple-500/20 transition"
          >
            Write your first entry →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Day picker full-screen ────────────────────────────────────────────────────

function DayPickerScreen({
  onSelect,
  saving,
}: {
  onSelect: (mode: "training" | "rest") => void;
  saving: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-2 text-center">
          POWERFLOW · HOME
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2 text-center">
          {new Date().toLocaleDateString("en-GB", { weekday: "long" })}
        </h1>
        <p className="font-saira text-sm text-zinc-500 mb-10 text-center">
          How&apos;s today looking?
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelect("training")}
            disabled={saving}
            className="w-full rounded-2xl border border-purple-500/40 bg-purple-600/15 hover:bg-purple-600/25 disabled:opacity-50 py-5 font-saira text-base font-bold text-white transition"
          >
            {saving ? "Saving…" : "🏋️ Training Day"}
          </button>
          <button
            type="button"
            onClick={() => onSelect("rest")}
            disabled={saving}
            className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 py-5 font-saira text-base font-bold text-zinc-300 transition"
          >
            {saving ? "…" : "😴 Rest Day"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reminder permission button ────────────────────────────────────────────────

/**
 * Small inline button shown on the check-in card.
 * Disappears once notifications are granted (or if unsupported).
 */
function ReminderPermissionButton() {
  const [permission, setPermission] = React.useState<NotificationPermission | null>(null);

  React.useEffect(() => {
    if (!("Notification" in window)) { setPermission("denied"); return; }
    setPermission(Notification.permission);
  }, []);

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // Don't render until we know the permission state, or if already granted/unsupported
  if (!permission || permission === "granted" || permission === "denied") return null;

  return (
    <button
      type="button"
      onClick={handleEnable}
      className="font-saira text-[9px] uppercase tracking-[0.14em] text-zinc-600 hover:text-purple-400 transition flex items-center gap-1"
    >
      🔔 Reminders
    </button>
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
          Strength goals
        </p>
        {glPoints !== null ? (
          <div className="text-right">
            <p className="font-saira text-lg font-bold text-purple-300 tabular-nums leading-none">
              {glPoints}
            </p>
            <p className="font-saira text-[9px] uppercase tracking-[0.14em] text-zinc-600">GL pts</p>
          </div>
        ) : (
          <Link
            href="/you"
            className="font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
          >
            + add weight
          </Link>
        )}
      </div>

      {hasAnyLift ? (
        <div className="space-y-3">
          {(
            [
              ["Squat",     profile?.squat_current_kg,     profile?.squat_goal_kg     ],
              ["Bench",     profile?.bench_current_kg,     profile?.bench_goal_kg     ],
              ["Deadlift",  profile?.deadlift_current_kg,  profile?.deadlift_goal_kg  ],
            ] as [string, number | null | undefined, number | null | undefined][]
          ).map(([label, current, goal]) => (
            <LiftRow key={label} label={label} current={current ?? null} goal={goal ?? null} />
          ))}
          {(ct || gt) && (
            <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between">
              <span className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Total
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
          <p className="font-saira text-sm text-zinc-500">No lifts recorded yet.</p>
          <Link
            href="/you"
            className="font-saira text-xs text-purple-300 hover:text-purple-200 transition"
          >
            Set goals →
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
  const filtered = goals.filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
          Mental goals
        </p>
        <Link
          href="/you"
          className="font-saira text-[10px] text-zinc-500 hover:text-purple-300 transition underline"
        >
          {filtered.length ? "Edit" : "Set goals"}
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
          Set 1–3 mental goals for your next meet.{" "}
          <Link href="/you" className="text-purple-300 hover:text-purple-200 transition underline">
            Add now →
          </Link>
        </p>
      )}
    </div>
  );
}
