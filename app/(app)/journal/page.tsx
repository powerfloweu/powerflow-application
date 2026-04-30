"use client";

import React from "react";
import Link from "next/link";
import EntryCard from "@/app/components/EntryCard";
import TagChip from "@/app/components/TagChip";
import {
  type Sentiment,
  type JournalEntry,
  THEME_DEFS,
  detectThemesWithCount,
  detectSentiment,
} from "@/lib/journal";
import { TRAINING_QUESTIONS, type TrainingEntry } from "@/lib/training";
import { ymdLocal } from "@/lib/date";
import { DateTabs, offsetDate } from "@/app/components/DateTabs";
import { useT } from "@/lib/i18n";
import WeeklyCheckinModal from "@/app/components/WeeklyCheckinModal";
import { weekLabel, type WeeklyCheckin } from "@/lib/weeklyCheckin";

/** Map TRAINING_QUESTIONS keys to journal-dict translation keys */
const TRAINING_QKEY: Record<string, string> = {
  thoughts_before: "journal.qThoughtsBefore",
  thoughts_after: "journal.qThoughtsAfter",
  what_went_well: "journal.qWentWell",
  frustrations: "journal.qFrustrations",
  next_session: "journal.qNextSession",
};

// ── Types ─────────────────────────────────────────────────────────────────────

/** Unified feed item — either a quick journal entry or a training day log */
type FeedItem =
  | { kind: "journal";  entry: JournalEntry }
  | { kind: "training"; entry: TrainingEntry };

type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  ai_access?: boolean;
  self_talk_mode?: string;
};

type CoachFeedbackItem = {
  content: string;
  created_at: string;
  coach_name: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectThemesForEntry(text: string, sentiment: Sentiment): string[] {
  return THEME_DEFS
    .filter((def) => def.keywords.some((kw) => text.toLowerCase().includes(kw)))
    .map((def) => def.label);
}

function timeSinceJournal(
  iso: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return t("journal.justNow");
  if (diffMin < 60) return t("journal.minAgo", { n: diffMin });
  if (diffH   < 24) return t("journal.hAgo", { n: diffH });
  return t("journal.dAgo", { n: diffD });
}

function localeForDate(loc: string): string {
  if (loc === "de") return "de-DE";
  if (loc === "hu") return "hu-HU";
  return "en-GB";
}

function dayLabel(
  d: Date,
  t: (key: string) => string,
  loc: string,
) {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return t("journal.today");
  if (d.toDateString() === yesterday.toDateString()) return t("journal.yesterday");
  return d.toLocaleDateString(localeForDate(loc), { weekday: "long", day: "numeric", month: "short" });
}

/** Returns a date string for a feed item — used for grouping by day */
function feedItemDate(item: FeedItem): Date {
  if (item.kind === "journal") return new Date(item.entry.created_at);
  // entry_date is YYYY-MM-DD local — parse at noon to avoid timezone edge cases
  return new Date(item.entry.entry_date + "T12:00:00");
}

function groupByDay(items: FeedItem[]): [string, FeedItem[]][] {
  const map = new Map<string, FeedItem[]>();
  const sorted = [...items].sort(
    (a, b) => feedItemDate(b).getTime() - feedItemDate(a).getTime(),
  );
  for (const item of sorted) {
    const key = feedItemDate(item).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}

function weekEntries(entries: JournalEntry[]) {
  const cut = new Date(); cut.setDate(cut.getDate() - 7);
  return entries.filter((e) => new Date(e.created_at) >= cut);
}

function streak(entries: JournalEntry[]) {
  if (!entries.length) return 0;
  let s = 0;
  const d = new Date();
  while (true) {
    if (entries.some((e) => new Date(e.created_at).toDateString() === d.toDateString())) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

function shouldPromptCoach(entries: JournalEntry[], profile: UserProfile | null): boolean {
  if (!profile || profile.role !== "athlete" || profile.coach_id) return false;
  if (entries.length < 5) return false;
  const oldest = new Date(entries[entries.length - 1].created_at);
  const daysSinceFirst = (Date.now() - oldest.getTime()) / 86400000;
  return daysSinceFirst >= 14;
}

// ── Sentiment donut ────────────────────────────────────────────────────────────

function SentimentDonut({ pos, neg, neu }: { pos: number; neg: number; neu: number }) {
  const total = pos + neg + neu;
  const r = 28;
  const circ = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <svg viewBox="0 0 72 72" className="w-[72px] h-[72px]">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <text x="36" y="40" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="sans-serif">–</text>
      </svg>
    );
  }

  const segs = [
    { ratio: pos / total, stroke: "rgb(52,211,153)"  },
    { ratio: neg / total, stroke: "rgb(251,113,133)" },
    { ratio: neu / total, stroke: "rgb(125,211,252)" },
  ];

  let cum = 0;
  return (
    <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
      {segs.map((s, i) => {
        if (s.ratio === 0) { cum += s.ratio * circ; return null; }
        const dash = s.ratio * circ;
        const el = (
          <circle key={i} cx="36" cy="36" r={r} fill="none" stroke={s.stroke}
            strokeWidth="9" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-cum} />
        );
        cum += dash;
        return el;
      })}
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold"
        fontFamily="sans-serif" transform="rotate(90 36 36)">
        {Math.round((pos / total) * 100)}%
      </text>
    </svg>
  );
}

// ── 7-day bar chart ────────────────────────────────────────────────────────────

function WeekBar({ entries }: { entries: JournalEntry[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const dayEntries = entries.filter((e) => new Date(e.created_at).toDateString() === key);
    const pos = dayEntries.filter((e) => e.sentiment === "positive").length;
    const neg = dayEntries.filter((e) => e.sentiment === "negative").length;
    const neu = dayEntries.filter((e) => e.sentiment === "neutral").length;
    return {
      label: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 1),
      total: dayEntries.length, pos, neg, neu,
    };
  });
  const maxTotal = Math.max(...days.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-[5px] h-14 w-full">
      {days.map((d, i) => {
        const h = (d.total / maxTotal) * 48;
        const isToday = i === 6;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {d.total > 0 ? (
              <div className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                style={{ height: `${Math.max(h, 4)}px` }} title={`${d.total} entries`}>
                {d.pos > 0 && <div className="bg-emerald-400/70" style={{ height: `${(d.pos / d.total) * 100}%` }} />}
                {d.neg > 0 && <div className="bg-rose-400/70"    style={{ height: `${(d.neg / d.total) * 100}%` }} />}
                {d.neu > 0 && <div className="bg-sky-400/50"     style={{ height: `${(d.neu / d.total) * 100}%` }} />}
              </div>
            ) : (
              <div className="w-full rounded-sm bg-white/5" style={{ height: "4px" }} />
            )}
            <span className={`font-saira text-[9px] uppercase tracking-wide ${isToday ? "text-purple-300" : "text-zinc-600"}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Training journal form (shown when today is a training day) ────────────────

function TrainingJournalForm({
  entry,
  onSave,
}: {
  entry: TrainingEntry;
  onSave: (updated: TrainingEntry) => void;
}) {
  const { t } = useT();
  const [answers, setAnswers] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of TRAINING_QUESTIONS) {
      init[q.key] = (entry[q.key] as string | null) ?? "";
    }
    return init;
  });
  const [saving, setSaving]   = React.useState(false);
  const [saved, setSaved]     = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  const hasAny = TRAINING_QUESTIONS.some((q) => answers[q.key].trim().length > 0);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        entry_date: entry.entry_date,
        is_training_day: true,
        mood_rating: entry.mood_rating ?? null,
      };
      for (const q of TRAINING_QUESTIONS) {
        body[q.key] = answers[q.key].trim() || null;
      }
      const res = await fetch("/api/training/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      onSave({ ...entry, ...body } as TrainingEntry);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t("journal.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-fuchsia-500/5 to-transparent p-5 sm:p-6 shadow-[0_16px_40px_rgba(126,34,206,0.15)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🏋️</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-300">
          {t("journal.trainingDay")}
        </p>
      </div>

      <div className="space-y-4">
        {TRAINING_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="block font-saira text-xs text-zinc-400 mb-1.5">
              {t(TRAINING_QKEY[q.key] ?? "")}
            </label>
            <textarea
              rows={2}
              value={answers[q.key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
              placeholder="…"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasAny || saving}
          className={`ml-auto rounded-full px-5 py-2.5 sm:py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
            saved ? "bg-emerald-500 text-white"
            : hasAny && !saving ? "bg-purple-500 text-white hover:bg-purple-400"
            : "bg-purple-500/20 text-purple-500/50 cursor-not-allowed"
          }`}
        >
          {saved ? t("common.saved") : saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
      {error && <p className="mt-2 font-saira text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Quick entry form ───────────────────────────────────────────────────────────

function QuickEntry({ onAdd }: { onAdd: (e: JournalEntry) => void }) {
  const { t } = useT();
  const [text, setText]             = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted]   = React.useState(false);
  const [error, setError]           = React.useState<string | null>(null);

  const canSubmit = text.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const trimmed = text.trim();
    const sentiment = detectSentiment(trimmed);
    const themes = detectThemesForEntry(trimmed, sentiment);
    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, sentiment, context: "general", themes }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json() as { id: string };
      onAdd({ id: saved.id, content: trimmed, sentiment, context: "general", themes, created_at: new Date().toISOString() });
      setText("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 1800);
    } catch {
      setError(t("journal.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-fuchsia-500/5 to-transparent p-5 sm:p-6 shadow-[0_16px_40px_rgba(126,34,206,0.15)]">
      <textarea
        value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKey}
        placeholder={t("journal.writePlaceholder")}
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-saira text-base sm:text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
      />

      <div className="mt-4 flex items-center">
        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          className={`ml-auto rounded-full px-5 py-2.5 sm:py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
            submitted ? "bg-emerald-500 text-white"
            : canSubmit ? "bg-purple-500 text-white hover:bg-purple-400"
            : "bg-purple-500/20 text-purple-500/50 cursor-not-allowed"
          }`}>
          {submitted ? t("journal.logged") : submitting ? t("common.saving") : t("journal.logThought")}
        </button>
      </div>

      {error && <p className="mt-2 font-saira text-[11px] text-red-400">{error}</p>}
      <p className="mt-2 font-saira text-[10px] text-zinc-700 hidden sm:block">{t("journal.quickSubmit")}</p>
    </div>
  );
}

// ── Training day card (feed) ───────────────────────────────────────────────────

function TrainingDayCard({ entry }: { entry: TrainingEntry }) {
  const { t } = useT();
  const fields = [
    { label: t("journal.fieldThoughtsBefore"), value: entry.thoughts_before },
    { label: t("journal.fieldThoughtsAfter"),  value: entry.thoughts_after },
    { label: t("journal.fieldWentWell"),       value: entry.what_went_well },
    { label: t("journal.fieldFrustrations"),   value: entry.frustrations },
    { label: t("journal.fieldNextSession"),    value: entry.next_session },
  ].filter((f) => f.value);

  if (!fields.length) return null;

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🏋️</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300">
          {t("journal.trainingDayLog")}
        </p>
        {entry.mood_rating != null && (
          <span className="ml-auto font-saira text-[10px] text-zinc-500">
            {t("journal.moodOf", { value: entry.mood_rating })}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="font-saira text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">{f.label}</p>
            <p className="font-saira text-sm text-zinc-300 leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>
      {entry.coach_note && (
        <div className="mt-3 pl-3 border-l-2 border-purple-500/20">
          <p className="font-saira text-xs text-zinc-400 italic leading-relaxed">
            &ldquo;{entry.coach_note}&rdquo;
          </p>
          <p className="font-saira text-[10px] text-zinc-600 mt-0.5">{t("journal.coachNote")}</p>
        </div>
      )}
    </div>
  );
}

// ── Weekly digest sidebar ──────────────────────────────────────────────────────

function WeeklyDigest({ entries }: { entries: JournalEntry[] }) {
  const { t, locale } = useT();
  const week    = weekEntries(entries);
  const pos     = week.filter((e) => e.sentiment === "positive").length;
  const neg     = week.filter((e) => e.sentiment === "negative").length;
  const neu     = week.filter((e) => e.sentiment === "neutral").length;
  const str     = streak(entries);
  const themes  = detectThemesWithCount(week);
  const posRate = week.length ? Math.round((pos / week.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5 space-y-5">
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300">{t("journal.digestThisWeek")}</p>
          <p className="font-saira text-[11px] text-zinc-600 mt-0.5">
            {new Date(Date.now() - 6 * 86400000).toLocaleDateString(localeForDate(locale), { day: "numeric", month: "short" })}
            {" — "}
            {new Date().toLocaleDateString(localeForDate(locale), { day: "numeric", month: "short" })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <SentimentDonut pos={pos} neg={neg} neu={neu} />
          <div className="space-y-2 flex-1">
            <StatRow dot="bg-emerald-400" label={t("journal.digestPositive")} value={pos} />
            <StatRow dot="bg-rose-400"    label={t("journal.digestNegative")} value={neg} />
            <StatRow dot="bg-sky-400"     label={t("journal.digestNeutral")}  value={neu} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
          <StatPill label={t("journal.digestEntries")} value={String(week.length)} />
          <StatPill label={t("journal.digestPositive")} value={`${posRate}%`} highlight={posRate >= 50} />
          <StatPill label={t("journal.digestStreak")} value={`${str}d`} highlight={str >= 3} />
        </div>

        <div>
          <p className="font-saira text-[10px] text-zinc-600 mb-2 uppercase tracking-[0.18em]">{t("journal.digestDailyVolume")}</p>
          <WeekBar entries={entries} />
        </div>
      </div>

      {themes.length > 0 && (
        <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300 mb-3">
            {t("journal.digestThemes")}
          </p>
          <div className="flex flex-wrap gap-2">
            {themes.map(({ def, count }) => (
              <TagChip key={def.label} label={def.label} color={def.color} count={count} />
            ))}
          </div>
          <p className="mt-3 font-saira text-[10px] text-zinc-600 leading-relaxed">
            {t("journal.digestThemesNote")}
          </p>
        </div>
      )}

    </div>
  );
}

function StatRow({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className="font-saira text-[11px] text-zinc-500 flex-1">{label}</span>
      <span className="font-saira text-[11px] font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

function StatPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
      <p className={`font-saira text-sm font-bold ${highlight ? "text-purple-300" : "text-zinc-100"}`}>{value}</p>
      <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mt-0.5">{label}</p>
    </div>
  );
}

// ── Coach prompt banner ────────────────────────────────────────────────────────

function CoachPromptBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useT();
  return (
    <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.07] px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">🧠</div>
        <div className="min-w-0">
          <p className="font-saira text-xs font-semibold text-purple-200">{t("journal.coachBannerTitle")}</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
            {t("journal.coachBannerBody")}
          </p>
        </div>
      </div>
      <button onClick={onDismiss} className="font-saira text-[11px] text-zinc-700 hover:text-zinc-400 transition flex-shrink-0">✕</button>
    </div>
  );
}

// ── Past-date form ────────────────────────────────────────────────────────────

/**
 * Shown in the form area when the athlete selects a past date on the journal
 * page. Handles three states:
 *   null     → day not logged yet → show mini day-type buttons
 *   rest     → rest day message
 *   training → defer to TrainingJournalForm (handled in parent)
 */
function PastDateForm({
  dateLabel,
  entry,
  onMark,
  marking,
  onSave,
}: {
  dateLabel: string;
  entry: TrainingEntry | null;
  onMark: (mode: "training" | "rest") => void;
  marking: boolean;
  onSave: (updated: TrainingEntry) => void;
}) {
  const { t } = useT();

  if (entry === null) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5 sm:p-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 mb-1">
          {dateLabel}
        </p>
        <p className="font-saira text-sm text-zinc-400 mb-5">
          {t("journal.pastNoEntry")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={marking}
            onClick={() => onMark("training")}
            className="flex-1 rounded-xl border border-purple-500/30 bg-purple-500/10 py-3 font-saira text-sm font-semibold text-purple-200 hover:bg-purple-500/20 transition disabled:opacity-50"
          >
            {t("journal.markAsTraining")}
          </button>
          <button
            type="button"
            disabled={marking}
            onClick={() => onMark("rest")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-saira text-sm font-semibold text-zinc-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            {t("journal.markAsRest")}
          </button>
        </div>
      </div>
    );
  }

  if (!entry.is_training_day) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5 sm:p-6">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 mb-1">
          {dateLabel}
        </p>
        <p className="font-saira text-sm text-zinc-500">{t("journal.pastRestDay")}</p>
      </div>
    );
  }

  // Training day → show the journal form
  return (
    <div>
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 mb-3">
        {t("journal.logForDate").replace("{date}", dateLabel.toLowerCase())}
      </p>
      <TrainingJournalForm entry={entry} onSave={onSave} />
    </div>
  );
}

// ── User header ────────────────────────────────────────────────────────────────

function UserHeader({ profile }: { profile: UserProfile }) {
  const { t } = useT();
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.display_name} className="w-8 h-8 rounded-full border border-white/10" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-saira text-xs font-bold text-purple-300">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-saira text-xs font-semibold text-zinc-200">{profile.display_name}</p>
          <p className="font-saira text-[10px] text-zinc-600 capitalize">{profile.role}</p>
        </div>
      </div>
      <a href="/auth/sign-out" className="font-saira text-[10px] text-zinc-700 hover:text-zinc-400 transition underline underline-offset-2">
        {t("auth.signOut")}
      </a>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { t, locale } = useT();
  const [entries, setEntries]             = React.useState<JournalEntry[]>([]);
  const [allTraining, setAllTraining]     = React.useState<TrainingEntry[]>([]);
  const [profile, setProfile]             = React.useState<UserProfile | null>(null);
  const [todayTraining, setTodayTraining] = React.useState<TrainingEntry | null | undefined>(undefined);
  const [ready, setReady]                 = React.useState(false);
  const [coachPromptDismissed, setCoachPromptDismissed] = React.useState(false);
  const [coachFeedback, setCoachFeedback] = React.useState<Record<string, CoachFeedbackItem>>({});

  // ── Weekly check-ins ────────────────────────────────────────────────────────
  const [weeklyCheckins,    setWeeklyCheckins]    = React.useState<WeeklyCheckin[]>([]);
  const [checkinWindowOpen, setCheckinWindowOpen] = React.useState(false);
  const [checkinSubmitted,  setCheckinSubmitted]  = React.useState(false);
  const [checkinTarget,     setCheckinTarget]     = React.useState<{ week: number; year: number; weekStart: string } | null>(null);
  const [showCheckinModal,  setShowCheckinModal]  = React.useState(false);
  const [expandedWeeks,     setExpandedWeeks]     = React.useState<Set<string>>(new Set());

  // ── Date navigation ─────────────────────────────────────────────────────────
  const todayStr = React.useMemo(() => ymdLocal(), []);
  const [selectedDate, setSelectedDate] = React.useState<string>(() => ymdLocal());
  const [pastDayMarking, setPastDayMarking] = React.useState(false);

  // Derived: training entry for the currently-selected date
  const selectedEntry = React.useMemo(
    () => allTraining.find((e) => e.entry_date === selectedDate) ?? null,
    [allTraining, selectedDate],
  );

  // Label for the selected date tab
  const dateLabel = selectedDate === todayStr
    ? t("today.tabToday")
    : selectedDate === offsetDate(1)
    ? t("today.tabYesterday")
    : t("today.tabDayBefore");

  const tabLabels = {
    today: t("today.tabToday"),
    yesterday: t("today.tabYesterday"),
    dayBefore: t("today.tabDayBefore"),
  };

  /** Mark a past date as training or rest (updates allTraining optimistically). */
  const markPastDay = async (date: string, mode: "training" | "rest") => {
    if (pastDayMarking) return;
    setPastDayMarking(true);
    try {
      await fetch("/api/training/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_date: date, is_training_day: mode === "training" }),
      });
      const newEntry: TrainingEntry = {
        id: `past-${date}`,
        user_id: "",
        entry_date: date,
        is_training_day: mode === "training",
        mood_rating: null,
        thoughts_before: null,
        thoughts_after: null,
        what_went_well: null,
        frustrations: null,
        next_session: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAllTraining((prev) => [
        ...prev.filter((e) => e.entry_date !== date),
        newEntry,
      ]);
    } finally {
      setPastDayMarking(false);
    }
  };

  React.useEffect(() => {
    (async () => {
      const [profileRes, entriesRes, trainingRes, feedbackRes, checkinRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/journal/entries"),
        fetch("/api/training/entries?all=true"),
        fetch("/api/journal/entry-feedback"),
        fetch("/api/weekly-checkin"),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (trainingRes.ok) {
        const all = (await trainingRes.json()) as TrainingEntry[];
        setAllTraining(Array.isArray(all) ? all : []);
        const today = ymdLocal();
        const todayT = Array.isArray(all) ? all.find((e) => e.entry_date === today) : undefined;
        setTodayTraining(todayT ?? null);
      } else {
        setTodayTraining(null);
      }
      if (feedbackRes.ok) {
        setCoachFeedback(await feedbackRes.json());
      }
      if (checkinRes.ok) {
        const data = await checkinRes.json();
        setWeeklyCheckins(data.checkins ?? []);
        setCheckinWindowOpen(data.windowOpen ?? false);
        setCheckinSubmitted(data.currentSubmitted ?? false);
        setCheckinTarget(data.targetWeek ?? null);
      }
      setReady(true);
    })();
  }, []);

  const handleAdd = (entry: JournalEntry) => setEntries((prev) => [entry, ...prev]);
  const handleDelete = async (id: string) => {
    await fetch(`/api/journal/entries?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Merge journal entries + training logs into one unified feed
  const feedItems = React.useMemo((): FeedItem[] => {
    const items: FeedItem[] = [
      ...entries.map((e) => ({ kind: "journal" as const, entry: e })),
      // Only include training entries that have at least one field filled in
      ...allTraining
        .filter((e) =>
          e.thoughts_before || e.thoughts_after || e.what_went_well || e.frustrations || e.next_session,
        )
        .map((e) => ({ kind: "training" as const, entry: e })),
    ];
    return items.sort((a, b) => feedItemDate(b).getTime() - feedItemDate(a).getTime());
  }, [entries, allTraining]);

  const grouped = React.useMemo(() => groupByDay(feedItems), [feedItems]);
  const showCoachPrompt = !coachPromptDismissed && shouldPromptCoach(entries, profile);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050608] pt-8 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.13),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">{t("brand.name")} · {t("journal.pageLabel")}</p>
          <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">{t("journal.title")}</h1>
          <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
            {t("journal.subtitle")}
          </p>
        </div>

        {profile && <UserHeader profile={profile} />}

        {/* Voice work banner — shown when user is in beta_voice_work mode */}
        {profile?.ai_access && profile.self_talk_mode === "beta_voice_work" && (
          <a
            href="/voices"
            className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-2.5 font-saira text-xs text-purple-300 hover:border-purple-500/40 hover:text-purple-200 transition"
          >
            <span>{t("journal.voiceModeBanner")}</span>
            <span>→</span>
          </a>
        )}

        {showCoachPrompt && <CoachPromptBanner onDismiss={() => setCoachPromptDismissed(true)} />}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── Date tabs ──────────────────────────────────────── */}
            <DateTabs selected={selectedDate} onChange={setSelectedDate} labels={tabLabels} />

            {/* ── Form area: switches based on selected date ──────── */}
            {selectedDate === todayStr ? (
              // Today — existing behaviour
              todayTraining?.is_training_day ? (
                <TrainingJournalForm
                  entry={todayTraining}
                  onSave={(updated) => {
                    setTodayTraining(updated);
                    setAllTraining((prev) =>
                      prev.map((e) => e.entry_date === updated.entry_date ? updated : e),
                    );
                  }}
                />
              ) : (
                <QuickEntry onAdd={handleAdd} />
              )
            ) : (
              // Past date
              <PastDateForm
                dateLabel={dateLabel}
                entry={selectedEntry}
                onMark={(mode) => markPastDay(selectedDate, mode)}
                marking={pastDayMarking}
                onSave={(updated) => {
                  setAllTraining((prev) =>
                    prev.map((e) => e.entry_date === updated.entry_date ? updated : e),
                  );
                }}
              />
            )}

            {/* ── Weekly Check-ins section ────────────────────────── */}
            {(weeklyCheckins.length > 0 || checkinWindowOpen) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.24em] text-purple-400">
                    Weekly Check-Ins
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* CTA when window is open and not yet submitted */}
                {checkinWindowOpen && !checkinSubmitted && checkinTarget && (
                  <button
                    type="button"
                    onClick={() => setShowCheckinModal(true)}
                    className="w-full mb-3 flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/8 px-4 py-3.5 hover:border-purple-400/50 hover:bg-purple-500/12 transition group"
                  >
                    <div className="text-left">
                      <p className="font-saira text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400 mb-0.5">
                        {weekLabel(checkinTarget.week, checkinTarget.weekStart)} · Due now
                      </p>
                      <p className="font-saira text-xs text-zinc-400">
                        Take 2 minutes to reflect on your week
                      </p>
                    </div>
                    <span className="font-saira text-xs text-purple-400 group-hover:text-purple-300 transition">
                      Start →
                    </span>
                  </button>
                )}

                {/* Past check-ins list */}
                <div className="space-y-2">
                  {weeklyCheckins.map((ci) => {
                    const key = `${ci.year}-${ci.week_number}`;
                    const isExpanded = expandedWeeks.has(key);
                    const label = weekLabel(ci.week_number, ci.week_start);
                    const avg = Math.round(
                      ((ci.mood_rating + ci.training_quality + ci.readiness_rating + ci.energy_rating + ci.sleep_rating) / 5) * 10,
                    ) / 10;
                    const avgColor = avg >= 7.5 ? "text-emerald-400" : avg >= 5 ? "text-purple-300" : "text-rose-400";
                    return (
                      <div key={key} className="rounded-2xl border border-white/6 bg-[#0F1117] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedWeeks((prev) => {
                            const next = new Set(prev);
                            isExpanded ? next.delete(key) : next.add(key);
                            return next;
                          })}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition"
                        >
                          <span className="font-saira text-[11px] font-semibold text-zinc-300">{label}</span>
                          <div className="flex items-center gap-3">
                            <span className={`font-saira text-sm font-bold tabular-nums ${avgColor}`}>{avg.toFixed(1)}</span>
                            <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none">
                              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                            {/* Ratings grid */}
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { label: "Mood",     v: ci.mood_rating },
                                { label: "Training", v: ci.training_quality },
                                { label: "Energy",   v: ci.energy_rating },
                                { label: "Sleep",    v: ci.sleep_rating },
                                { label: "Readiness",v: ci.readiness_rating },
                              ].map(({ label: rl, v }) => (
                                <div key={rl} className="text-center">
                                  <p className={`font-saira text-lg font-extrabold tabular-nums ${v >= 8 ? "text-emerald-400" : v >= 5 ? "text-purple-300" : "text-rose-400"}`}>{v}</p>
                                  <p className="font-saira text-[9px] uppercase tracking-[0.14em] text-zinc-600 leading-tight">{rl}</p>
                                </div>
                              ))}
                            </div>
                            {/* Text responses */}
                            {ci.biggest_win && (
                              <div>
                                <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-1">Biggest win</p>
                                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.biggest_win}</p>
                              </div>
                            )}
                            {ci.biggest_challenge && (
                              <div>
                                <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-1">Main challenge</p>
                                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.biggest_challenge}</p>
                              </div>
                            )}
                            {ci.focus_next_week && (
                              <div>
                                <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-1">Focus next week</p>
                                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{ci.focus_next_week}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Modal (also triggered from AppShell, but can open here too) ── */}
            {showCheckinModal && checkinTarget && (
              <WeeklyCheckinModal
                targetWeek={checkinTarget}
                onDone={async () => {
                  setShowCheckinModal(false);
                  setCheckinSubmitted(true);
                  // Refresh the list
                  const res = await fetch("/api/weekly-checkin");
                  if (res.ok) {
                    const data = await res.json();
                    setWeeklyCheckins(data.checkins ?? []);
                  }
                }}
                onSkip={() => setShowCheckinModal(false)}
              />
            )}

            {grouped.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#0F1117] p-10 text-center">
                <p className="font-saira text-sm text-zinc-600">{t("journal.empty")}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map(([dateKey, dayItems]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        {dayLabel(feedItemDate(dayItems[0]), t, locale)}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="font-saira text-[10px] text-zinc-700">
                        {t(dayItems.length === 1 ? "journal.entryCountSingular" : "journal.entryCountPlural", { n: dayItems.length })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {dayItems.map((item) =>
                        item.kind === "training" ? (
                          <TrainingDayCard key={item.entry.id} entry={item.entry} />
                        ) : (
                          <div key={item.entry.id}>
                            <EntryCard entry={item.entry} onDelete={handleDelete} />
                            {coachFeedback[item.entry.id] && (
                              <div className="mt-1.5 ml-2 pl-3 border-l-2 border-purple-500/20">
                                <p className="font-saira text-xs text-zinc-400 italic leading-relaxed">
                                  &ldquo;{coachFeedback[item.entry.id].content}&rdquo;
                                </p>
                                <p className="font-saira text-[10px] text-zinc-600 mt-0.5">
                                  — {coachFeedback[item.entry.id].coach_name} (coach) · {timeSinceJournal(coachFeedback[item.entry.id].created_at, t)}
                                </p>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 flex-shrink-0">
            <WeeklyDigest entries={entries} />
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-6">
          <Link href="/tests" className="font-saira text-[11px] text-zinc-700 underline decoration-zinc-700 hover:text-zinc-400 transition">
            {t("journal.backToTests")}
          </Link>
          <span className="text-zinc-800">·</span>
          {profile?.role === "coach" && (
            <Link href="/coach" className="font-saira text-[11px] text-purple-500/70 underline decoration-purple-500/30 hover:text-purple-300 transition">
              {t("journal.coachDashboard")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
