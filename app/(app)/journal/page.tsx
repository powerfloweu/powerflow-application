"use client";

import React from "react";
import Link from "next/link";
import EntryCard from "@/app/components/EntryCard";
import TagChip from "@/app/components/TagChip";
import {
  type Sentiment,
  type JournalEntry,
  SENT_CONFIG,
  THEME_DEFS,
  detectThemesWithCount,
} from "@/lib/journal";
import { TRAINING_QUESTIONS, type TrainingEntry } from "@/lib/training";
import { ymdLocal } from "@/lib/date";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectThemesForEntry(text: string, sentiment: Sentiment): string[] {
  return THEME_DEFS
    .filter((def) => def.keywords.some((kw) => text.toLowerCase().includes(kw)))
    .map((def) => def.label);
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function groupByDay(entries: JournalEntry[]): [string, JournalEntry[]][] {
  const map = new Map<string, JournalEntry[]>();
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  for (const e of sorted) {
    const key = new Date(e.created_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
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
      setError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-fuchsia-500/5 to-transparent p-5 sm:p-6 shadow-[0_16px_40px_rgba(126,34,206,0.15)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🏋️</span>
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-300">
          Training Day
        </p>
      </div>

      <div className="space-y-4">
        {TRAINING_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="block font-saira text-xs text-zinc-400 mb-1.5">
              {q.label}
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
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 font-saira text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Quick entry form ───────────────────────────────────────────────────────────

function QuickEntry({ onAdd }: { onAdd: (e: JournalEntry) => void }) {
  const [text, setText]         = React.useState("");
  const [sentiment, setSentiment] = React.useState<Sentiment>("neutral");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted]   = React.useState(false);
  const [error, setError]           = React.useState<string | null>(null);

  const canSubmit = text.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const themes = detectThemesForEntry(text, sentiment);
    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), sentiment, context: "general", themes }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json() as { id: string };
      onAdd({ id: saved.id, content: text.trim(), sentiment, context: "general", themes, created_at: new Date().toISOString() });
      setText(""); setSentiment("neutral");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 1800);
    } catch {
      setError("Couldn't save — please try again.");
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
        placeholder="What's on your mind right now? Log a thought, a doubt, a win…"
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-saira text-base sm:text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["positive", "neutral", "negative"] as Sentiment[]).map((s) => {
            const cfg = SENT_CONFIG[s];
            return (
              <button key={s} type="button" onClick={() => setSentiment(s)}
                className={`rounded-full border px-3 py-2 sm:py-1 font-saira text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  sentiment === s
                    ? `${cfg.ring} ${cfg.bg} ${cfg.text}`
                    : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-400"
                }`}>
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={handleSubmit} disabled={!canSubmit}
          className={`ml-auto rounded-full px-5 py-2.5 sm:py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
            submitted ? "bg-emerald-500 text-white"
            : canSubmit ? "bg-purple-500 text-white hover:bg-purple-400"
            : "bg-purple-500/20 text-purple-500/50 cursor-not-allowed"
          }`}>
          {submitted ? "✓ Logged" : submitting ? "Saving…" : "Log thought"}
        </button>
      </div>

      {error && <p className="mt-2 font-saira text-[11px] text-red-400">{error}</p>}
      <p className="mt-2 font-saira text-[10px] text-zinc-700 hidden sm:block">⌘ + Enter to submit quickly</p>
    </div>
  );
}

// ── Weekly digest sidebar ──────────────────────────────────────────────────────

function WeeklyDigest({ entries }: { entries: JournalEntry[] }) {
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
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300">This week</p>
          <p className="font-saira text-[11px] text-zinc-600 mt-0.5">
            {new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            {" — "}
            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <SentimentDonut pos={pos} neg={neg} neu={neu} />
          <div className="space-y-2 flex-1">
            <StatRow dot="bg-emerald-400" label="Positive" value={pos} />
            <StatRow dot="bg-rose-400"    label="Negative" value={neg} />
            <StatRow dot="bg-sky-400"     label="Neutral"  value={neu} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
          <StatPill label="Entries" value={String(week.length)} />
          <StatPill label="Positive" value={`${posRate}%`} highlight={posRate >= 50} />
          <StatPill label="Streak" value={`${str}d`} highlight={str >= 3} />
        </div>

        <div>
          <p className="font-saira text-[10px] text-zinc-600 mb-2 uppercase tracking-[0.18em]">Daily volume</p>
          <WeekBar entries={entries} />
        </div>
      </div>

      {themes.length > 0 && (
        <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300 mb-3">
            Themes detected
          </p>
          <div className="flex flex-wrap gap-2">
            {themes.map(({ def, count }) => (
              <TagChip key={def.label} label={def.label} color={def.color} count={count} />
            ))}
          </div>
          <p className="mt-3 font-saira text-[10px] text-zinc-600 leading-relaxed">
            AI-powered theme analysis and reframes coming in a future update.
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-purple-500/15 bg-purple-500/5 p-5">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-2">Coming soon</p>
        <p className="font-saira text-xs text-zinc-400 leading-relaxed">
          Connect your journal to your test results — see how your self-talk patterns relate to your DAS and SAT scores over time.
        </p>
        <Link href="/tests" className="mt-3 inline-block font-saira text-[11px] text-purple-300 underline underline-offset-2 hover:text-purple-200 transition">
          Take a test →
        </Link>
      </div>
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
  return (
    <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.07] px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">🧠</div>
        <div className="min-w-0">
          <p className="font-saira text-xs font-semibold text-purple-200">Working with a coach?</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
            You've built a solid journaling streak. Share your data with your coach — ask them to send you an invite link.
          </p>
        </div>
      </div>
      <button onClick={onDismiss} className="font-saira text-[11px] text-zinc-700 hover:text-zinc-400 transition flex-shrink-0">✕</button>
    </div>
  );
}

// ── User header ────────────────────────────────────────────────────────────────

function UserHeader({ profile }: { profile: UserProfile }) {
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
        Sign out
      </a>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries]         = React.useState<JournalEntry[]>([]);
  const [profile, setProfile]         = React.useState<UserProfile | null>(null);
  const [todayTraining, setTodayTraining] = React.useState<TrainingEntry | null | undefined>(undefined);
  const [ready, setReady]             = React.useState(false);
  const [coachPromptDismissed, setCoachPromptDismissed] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [profileRes, entriesRes, trainingRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/journal/entries"),
        fetch(`/api/training/entries?date=${ymdLocal()}`),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (trainingRes.ok) {
        const t = await trainingRes.json();
        setTodayTraining(t?.id ? (t as TrainingEntry) : null);
      } else {
        setTodayTraining(null);
      }
      setReady(true);
    })();
  }, []);

  const handleAdd = (entry: JournalEntry) => setEntries((prev) => [entry, ...prev]);
  const handleDelete = async (id: string) => {
    await fetch(`/api/journal/entries?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const grouped = React.useMemo(() => groupByDay(entries), [entries]);
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
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">PowerFlow · Journal</p>
          <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">Self-Talk Log</h1>
          <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
            Track what your inner voice says during training, competition, and recovery. Patterns surface, beliefs shift.
          </p>
        </div>

        {profile && <UserHeader profile={profile} />}
        {showCoachPrompt && <CoachPromptBanner onDismiss={() => setCoachPromptDismissed(true)} />}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-6">
            {todayTraining?.is_training_day ? (
              <TrainingJournalForm
                entry={todayTraining}
                onSave={(updated) => setTodayTraining(updated)}
              />
            ) : (
              <QuickEntry onAdd={handleAdd} />
            )}

            {grouped.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#0F1117] p-10 text-center">
                <p className="font-saira text-sm text-zinc-600">No entries yet — log your first thought above.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map(([dateKey, dayEntries]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        {dayLabel(dayEntries[0].created_at)}
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="font-saira text-[10px] text-zinc-700">
                        {dayEntries.length} entr{dayEntries.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {dayEntries.map((e) => (
                        <EntryCard key={e.id} entry={e} onDelete={handleDelete} />
                      ))}
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
            ← Back to tests
          </Link>
          <span className="text-zinc-800">·</span>
          {profile?.role === "coach" && (
            <Link href="/coach" className="font-saira text-[11px] text-purple-500/70 underline decoration-purple-500/30 hover:text-purple-300 transition">
              Coach dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
