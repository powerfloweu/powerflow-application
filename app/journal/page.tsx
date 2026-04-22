"use client";

import React from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "negative" | "neutral";
type Context =
  | "pre-training"
  | "during-session"
  | "post-competition"
  | "rest-day"
  | "general";

type JournalEntry = {
  id: string;
  content: string;
  sentiment: Sentiment;
  context: Context;
  themes: string[];
  created_at: string;
};

type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
};

// ── Theme engine ──────────────────────────────────────────────────────────────

type ThemeDef = { label: string; keywords: string[]; color: string };

const THEME_DEFS: ThemeDef[] = [
  { label: "Perfectionism",     keywords: ["should have", "not good enough", "perfect", "mistake", "wrong", "failed", "can't execute", "better"], color: "rose"    },
  { label: "Confidence",        keywords: ["believe", "can do", "strong", "confident", "trust", "coming back", "nailed", "belong"],                color: "emerald" },
  { label: "Pre-comp anxiety",  keywords: ["nervous", "worried", "anxious", "scared", "fear", "worst case", "not ready", "imagin"],                color: "amber"   },
  { label: "Focus & flow",      keywords: ["zone", "clicked", "in the zone", "focused", "concentrate", "flow", "sharp", "locked"],                 color: "purple"  },
  { label: "Motivation",        keywords: ["motivated", "excited", "look forward", "pay off", "progress", "great session", "solid"],               color: "sky"     },
  { label: "Self-doubt",        keywords: ["can't", "unable", "brain shuts", "doubt", "overthinking", "not sure"],                                 color: "orange"  },
];

function detectThemes(entries: JournalEntry[]): string[] {
  return THEME_DEFS
    .filter((def) =>
      entries.some((e) =>
        def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
      )
    )
    .map((def) => def.label);
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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

/** Returns true if athlete has been journaling ≥14 days and has no coach */
function shouldPromptCoach(entries: JournalEntry[], profile: UserProfile | null): boolean {
  if (!profile || profile.role !== "athlete" || profile.coach_id) return false;
  if (entries.length < 5) return false;
  const oldest = new Date(entries[entries.length - 1].created_at);
  const daysSinceFirst = (Date.now() - oldest.getTime()) / 86400000;
  return daysSinceFirst >= 14;
}

// ── Config maps ────────────────────────────────────────────────────────────────

const SENT: Record<Sentiment, { label: string; icon: string; ring: string; bg: string; text: string }> = {
  positive: { label: "Positive", icon: "↑", ring: "border-emerald-500/60", bg: "bg-emerald-500/15", text: "text-emerald-300" },
  negative: { label: "Negative", icon: "↓", ring: "border-rose-500/60",    bg: "bg-rose-500/15",    text: "text-rose-300"    },
  neutral:  { label: "Neutral",  icon: "→", ring: "border-sky-500/60",     bg: "bg-sky-500/15",     text: "text-sky-300"     },
};

const CTX: Record<Context, { label: string; icon: string }> = {
  "pre-training":    { label: "Pre-training",    icon: "⚡" },
  "during-session":  { label: "During session",  icon: "🎯" },
  "post-competition":{ label: "Post-competition", icon: "🏆" },
  "rest-day":        { label: "Rest day",         icon: "💤" },
  "general":         { label: "General",          icon: "💭" },
};

const THEME_CLS: Record<string, string> = {
  rose:    "border-rose-500/30 bg-rose-500/10 text-rose-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  purple:  "border-purple-500/30 bg-purple-500/10 text-purple-300",
  sky:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
  orange:  "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

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
          <circle
            key={i}
            cx="36" cy="36" r={r}
            fill="none"
            stroke={s.stroke}
            strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-cum}
          />
        );
        cum += dash;
        return el;
      })}
      <text
        x="36" y="40"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="bold"
        fontFamily="sans-serif"
        transform="rotate(90 36 36)"
      >
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
      total: dayEntries.length,
      pos, neg, neu,
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
              <div
                className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                style={{ height: `${Math.max(h, 4)}px` }}
                title={`${d.total} entries`}
              >
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

// ── Entry card ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: JournalEntry; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const s = SENT[entry.sentiment];
  const c = CTX[entry.context];

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(entry.id);
  };

  return (
    <div className={`rounded-2xl border ${s.ring} ${s.bg} p-4 group transition hover:brightness-110`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${s.text} bg-white/5`}>
          {s.icon}
        </div>
        <p className="flex-1 font-saira text-sm leading-relaxed text-zinc-200">{entry.content}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] ${s.ring} ${s.text}`}>
          {s.label}
        </span>
        <span className="font-saira text-[10px] text-zinc-500">
          {c.icon} {c.label}
        </span>
        <span className="ml-auto font-saira text-[10px] text-zinc-600">
          {timeLabel(entry.created_at)}
        </span>

        {confirm ? (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-saira text-[10px] text-red-400">Remove?</span>
            <button onClick={handleDelete} disabled={deleting} className="font-saira text-[10px] text-red-300 hover:text-red-200 underline disabled:opacity-50">
              {deleting ? "…" : "Yes"}
            </button>
            <button onClick={() => setConfirm(false)} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 underline">No</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="ml-1 font-saira text-[10px] text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── Quick entry form ───────────────────────────────────────────────────────────

function QuickEntry({ onAdd }: { onAdd: (e: JournalEntry) => void }) {
  const [text, setText] = React.useState("");
  const [sentiment, setSentiment] = React.useState<Sentiment>("neutral");
  const [context, setContext] = React.useState<Context>("general");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = text.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const themes = detectThemes([{
      id: "", content: text, sentiment, context, themes: [], created_at: new Date().toISOString()
    }]);

    try {
      const res = await fetch("/api/journal/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), sentiment, context, themes }),
      });

      if (!res.ok) throw new Error("Save failed");

      const saved = await res.json() as { id: string };
      const entry: JournalEntry = {
        id: saved.id,
        content: text.trim(),
        sentiment,
        context,
        themes,
        created_at: new Date().toISOString(),
      };

      onAdd(entry);
      setText("");
      setSentiment("neutral");
      setContext("general");
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
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="What's on your mind right now? Log a thought, a doubt, a win…"
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["positive", "neutral", "negative"] as Sentiment[]).map((s) => {
            const cfg = SENT[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSentiment(s)}
                className={`rounded-full border px-3 py-1 font-saira text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  sentiment === s
                    ? `${cfg.ring} ${cfg.bg} ${cfg.text}`
                    : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-400"
                }`}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        <select
          value={context}
          onChange={(e) => setContext(e.target.value as Context)}
          className="rounded-full border border-white/10 bg-[#13151A] px-3 py-1 font-saira text-[10px] text-zinc-400 outline-none transition focus:border-purple-400/50 cursor-pointer"
        >
          {(Object.entries(CTX) as [Context, { label: string; icon: string }][]).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`ml-auto rounded-full px-5 py-1.5 font-saira text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
            submitted
              ? "bg-emerald-500 text-white"
              : canSubmit
              ? "bg-purple-500 text-white hover:bg-purple-400"
              : "bg-purple-500/20 text-purple-500/50 cursor-not-allowed"
          }`}
        >
          {submitted ? "✓ Logged" : submitting ? "Saving…" : "Log thought"}
        </button>
      </div>

      {error && (
        <p className="mt-2 font-saira text-[11px] text-red-400">{error}</p>
      )}

      <p className="mt-2 font-saira text-[10px] text-zinc-700">
        ⌘ + Enter to submit quickly
      </p>
    </div>
  );
}

// ── Weekly digest sidebar ──────────────────────────────────────────────────────

function WeeklyDigest({ entries }: { entries: JournalEntry[] }) {
  const week = weekEntries(entries);
  const pos = week.filter((e) => e.sentiment === "positive").length;
  const neg = week.filter((e) => e.sentiment === "negative").length;
  const neu = week.filter((e) => e.sentiment === "neutral").length;
  const str = streak(entries);
  const themes = THEME_DEFS
    .map((def) => ({
      def,
      count: week.filter((e) =>
        def.keywords.some((kw) => e.content.toLowerCase().includes(kw))
      ).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const posRate = week.length ? Math.round((pos / week.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/8 bg-[#0F1117] p-5 space-y-5">
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-300">
            This week
          </p>
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
              <span
                key={def.label}
                className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.14em] ${THEME_CLS[def.color]}`}
              >
                {def.label}
                <span className="ml-1.5 opacity-60">×{count}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 font-saira text-[10px] text-zinc-600 leading-relaxed">
            AI-powered theme analysis and reframes coming in a future update.
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-purple-500/15 bg-purple-500/5 p-5">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-2">
          Coming soon
        </p>
        <p className="font-saira text-xs text-zinc-400 leading-relaxed">
          Connect your journal to your test results — see how your self-talk patterns relate to your DAS and SAT scores over time.
        </p>
        <Link
          href="/tests"
          className="mt-3 inline-block font-saira text-[11px] text-purple-300 underline underline-offset-2 hover:text-purple-200 transition"
        >
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

// ── Coach prompt banner (contextual, after 14 days) ────────────────────────────

function CoachPromptBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.07] px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">
          🧠
        </div>
        <div className="min-w-0">
          <p className="font-saira text-xs font-semibold text-purple-200">Working with a coach?</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
            You've built a solid journaling streak. Share your data with your coach — ask them to send you an invite link.
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="font-saira text-[11px] text-zinc-700 hover:text-zinc-400 transition flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

// ── User header bar ────────────────────────────────────────────────────────────

function UserHeader({ profile }: { profile: UserProfile }) {
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
          <p className="font-saira text-[10px] text-zinc-600 capitalize">{profile.role}</p>
        </div>
      </div>

      <a
        href="/auth/sign-out"
        className="font-saira text-[10px] text-zinc-700 hover:text-zinc-400 transition underline underline-offset-2"
      >
        Sign out
      </a>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [ready, setReady] = React.useState(false);
  const [coachPromptDismissed, setCoachPromptDismissed] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [profileRes, entriesRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/journal/entries"),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());

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
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.13),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8">
          <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
            PowerFlow · Journal
          </p>
          <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
            Self-Talk Log
          </h1>
          <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
            Track what your inner voice says during training, competition, and recovery. Patterns surface, beliefs shift.
          </p>
        </div>

        {/* User header */}
        {profile && <UserHeader profile={profile} />}

        {/* Contextual coach prompt */}
        {showCoachPrompt && (
          <CoachPromptBanner onDismiss={() => setCoachPromptDismissed(true)} />
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: entry + feed ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            <QuickEntry onAdd={handleAdd} />

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
                      <span className="font-saira text-[10px] text-zinc-700">{dayEntries.length} entr{dayEntries.length === 1 ? "y" : "ies"}</span>
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

          {/* ── Right: digest sidebar ─────────────────────────────────── */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <WeeklyDigest entries={entries} />
          </div>
        </div>

        {/* Footer */}
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
