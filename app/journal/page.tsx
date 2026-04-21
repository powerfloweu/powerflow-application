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
  text: string;
  sentiment: Sentiment;
  context: Context;
  createdAt: string;
};

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "powerflow.journal.entries.v1";
const SEEDED_KEY  = "powerflow.journal.seeded.v1";

// ── Mock seed data ─────────────────────────────────────────────────────────────

function ago(days: number, h = 10, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const SEED: JournalEntry[] = [
  { id: "s1",  text: "Felt completely off today. My timing was late on everything and I kept overthinking every single move. The coach noticed too, which made it worse.", sentiment: "negative", context: "post-competition", createdAt: ago(6, 19, 15) },
  { id: "s2",  text: "Had a solid warm-up, felt loose and ready. Performance in the session itself didn't match that energy though. Hard to explain.", sentiment: "neutral",  context: "post-competition", createdAt: ago(6, 21, 0)  },
  { id: "s3",  text: "Woke up early and actually looked forward to training. That hasn't happened in a while. Maybe the rest day did more than I thought.", sentiment: "positive", context: "pre-training",    createdAt: ago(5, 7, 30)  },
  { id: "s4",  text: "Should have done better in the drill. I know the technique, I just can't execute it under pressure. It's like my brain shuts down.", sentiment: "negative", context: "during-session",  createdAt: ago(5, 10, 45) },
  { id: "s5",  text: "Really solid session today. I was in the zone for most of it. Think the visualisation work before bed is starting to pay off.", sentiment: "positive", context: "during-session",  createdAt: ago(4, 17, 0)  },
  { id: "s6",  text: "Keeping imagining worst case scenarios ahead of next week instead of what I can control. Need to stop this.", sentiment: "negative", context: "rest-day",         createdAt: ago(3, 20, 30) },
  { id: "s7",  text: "Had a really honest conversation with my coach about where I'm heading. Felt genuinely motivated for the first time in weeks.", sentiment: "positive", context: "general",           createdAt: ago(3, 16, 0)  },
  { id: "s8",  text: "Nailed the movement pattern we've been drilling. Repetition finally clicked. I can feel my confidence coming back.", sentiment: "positive", context: "during-session",  createdAt: ago(2, 11, 15) },
  { id: "s9",  text: "Rest day but couldn't stop thinking about training. Not sure if that's dedication or anxiety.", sentiment: "neutral",  context: "rest-day",         createdAt: ago(2, 18, 0)  },
  { id: "s10", text: "Pre-session nerves bad again. Kept telling myself I'm not ready, haven't done enough. Tried to reframe but slipped back in.", sentiment: "negative", context: "pre-training",    createdAt: ago(1, 9, 0)   },
  { id: "s11", text: "Told myself before the session: just compete, don't judge. And it actually worked. Best performance in three weeks.", sentiment: "positive", context: "post-competition", createdAt: ago(1, 17, 30) },
  { id: "s12", text: "Woke up feeling strong. Competition is in two days and I finally feel like I belong here.", sentiment: "positive", context: "pre-training",    createdAt: ago(0, 8, 0)   },
];

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

function detectThemes(entries: JournalEntry[]) {
  return THEME_DEFS
    .map((def) => ({
      def,
      count: entries.filter((e) =>
        def.keywords.some((kw) => e.text.toLowerCase().includes(kw)),
      ).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
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
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const e of sorted) {
    const key = new Date(e.createdAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

function weekEntries(entries: JournalEntry[]) {
  const cut = new Date(); cut.setDate(cut.getDate() - 7);
  return entries.filter((e) => new Date(e.createdAt) >= cut);
}

function streak(entries: JournalEntry[]) {
  if (!entries.length) return 0;
  let s = 0;
  const d = new Date();
  while (true) {
    if (entries.some((e) => new Date(e.createdAt).toDateString() === d.toDateString())) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

// ── Config maps ────────────────────────────────────────────────────────────────

const SENT: Record<Sentiment, { label: string; icon: string; ring: string; bg: string; text: string; dot: string }> = {
  positive: { label: "Positive", icon: "↑", ring: "border-emerald-500/60", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
  negative: { label: "Negative", icon: "↓", ring: "border-rose-500/60",    bg: "bg-rose-500/15",    text: "text-rose-300",    dot: "bg-rose-400"    },
  neutral:  { label: "Neutral",  icon: "→", ring: "border-sky-500/60",     bg: "bg-sky-500/15",     text: "text-sky-300",     dot: "bg-sky-400"     },
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
    const dayEntries = entries.filter((e) => new Date(e.createdAt).toDateString() === key);
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
  const s = SENT[entry.sentiment];
  const c = CTX[entry.context];

  return (
    <div className={`rounded-2xl border ${s.ring} ${s.bg} p-4 group transition hover:brightness-110`}>
      <div className="flex items-start gap-3">
        {/* Sentiment icon */}
        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${s.text} bg-white/5`}>
          {s.icon}
        </div>
        {/* Text */}
        <p className="flex-1 font-saira text-sm leading-relaxed text-zinc-200">{entry.text}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`rounded-full border px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] ${s.ring} ${s.text}`}>
          {s.label}
        </span>
        <span className="font-saira text-[10px] text-zinc-500">
          {c.icon} {c.label}
        </span>
        <span className="ml-auto font-saira text-[10px] text-zinc-600">
          {timeLabel(entry.createdAt)}
        </span>

        {/* Delete */}
        {confirm ? (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="font-saira text-[10px] text-red-400">Remove?</span>
            <button onClick={() => onDelete(entry.id)} className="font-saira text-[10px] text-red-300 hover:text-red-200 underline">Yes</button>
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const canSubmit = text.trim().length >= 3 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const entry: JournalEntry = {
      id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      sentiment,
      context,
      createdAt: new Date().toISOString(),
    };
    setTimeout(() => {
      onAdd(entry);
      setText("");
      setSentiment("neutral");
      setContext("general");
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 1800);
    }, 350);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600/10 via-fuchsia-500/5 to-transparent p-5 sm:p-6 shadow-[0_16px_40px_rgba(126,34,206,0.15)]">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="What's on your mind right now? Log a thought, a doubt, a win…"
        rows={3}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-saira text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-purple-400/50 focus:ring-1 focus:ring-purple-500/30"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Sentiment selector */}
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

        {/* Context selector */}
        <select
          value={context}
          onChange={(e) => setContext(e.target.value as Context)}
          className="rounded-full border border-white/10 bg-[#13151A] px-3 py-1 font-saira text-[10px] text-zinc-400 outline-none transition focus:border-purple-400/50 cursor-pointer"
        >
          {(Object.entries(CTX) as [Context, { label: string; icon: string }][]).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        {/* Submit */}
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
  const themes = detectThemes(week);
  const posRate = week.length ? Math.round((pos / week.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Weekly card */}
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

        {/* Donut + stats */}
        <div className="flex items-center gap-4">
          <SentimentDonut pos={pos} neg={neg} neu={neu} />
          <div className="space-y-2 flex-1">
            <StatRow dot="bg-emerald-400" label="Positive" value={pos} />
            <StatRow dot="bg-rose-400"    label="Negative" value={neg} />
            <StatRow dot="bg-sky-400"     label="Neutral"  value={neu} />
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
          <StatPill label="Entries" value={String(week.length)} />
          <StatPill label="Positive" value={`${posRate}%`} highlight={posRate >= 50} />
          <StatPill label="Streak" value={`${str}d`} highlight={str >= 3} />
        </div>

        {/* 7-day bar */}
        <div>
          <p className="font-saira text-[10px] text-zinc-600 mb-2 uppercase tracking-[0.18em]">Daily volume</p>
          <WeekBar entries={entries} />
        </div>
      </div>

      {/* Themes */}
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
            AI-powered theme analysis and reframes will be available in the full version.
          </p>
        </div>
      )}

      {/* Teaser: connect to test results */}
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

// ── Auth placeholder banner ────────────────────────────────────────────────────

function AuthBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-white/8 bg-[#0F1117] px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Google icon placeholder */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-saira text-xs font-semibold text-zinc-200">You're in preview mode</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
            Entries save to this device only. Sign in with Google to sync across devices and unlock weekly AI reports.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          className="relative rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-saira text-[11px] font-semibold text-zinc-300 transition hover:bg-white/[0.08] cursor-default"
          title="Authentication coming soon"
        >
          Sign in with Google
          <span className="absolute -top-2 -right-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-px font-saira text-[8px] uppercase tracking-[0.15em] text-amber-300">
            Soon
          </span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="font-saira text-[11px] text-zinc-700 hover:text-zinc-400 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [ready, setReady] = React.useState(false);

  // Load from localStorage + seed once
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: JournalEntry[] = raw ? JSON.parse(raw) : [];
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "1";

      if (!alreadySeeded) {
        const merged = [...SEED, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(SEEDED_KEY, "1");
        setEntries(merged);
      } else {
        setEntries(existing);
      }
    } catch {
      setEntries(SEED);
    }
    setReady(true);
  }, []);

  const save = (updated: JournalEntry[]) => {
    setEntries(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const handleAdd = (entry: JournalEntry) => save([entry, ...entries]);
  const handleDelete = (id: string) => save(entries.filter((e) => e.id !== id));

  const grouped = React.useMemo(() => groupByDay(entries), [entries]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      {/* Background glow */}
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

        {/* Auth banner */}
        <AuthBanner />

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: entry + feed ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Quick entry */}
            <QuickEntry onAdd={handleAdd} />

            {/* Feed */}
            {grouped.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-[#0F1117] p-10 text-center">
                <p className="font-saira text-sm text-zinc-600">No entries yet — log your first thought above.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {grouped.map(([dateKey, dayEntries]) => (
                  <div key={dateKey}>
                    {/* Day label */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-saira text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        {dayLabel(dayEntries[0].createdAt)}
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
        <p className="mt-14 text-center font-saira text-[11px] text-zinc-700">
          Entries are private and stored on this device.{" "}
          <Link href="/tests" className="underline decoration-zinc-700 hover:text-zinc-400">
            ← Back to tests
          </Link>
        </p>
      </div>
    </div>
  );
}
