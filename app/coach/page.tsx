"use client";

import React from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "negative" | "neutral";
type Context = "pre-training" | "during-session" | "post-competition" | "rest-day" | "general";
type Flag = "attention" | "monitor" | "stable";
type Trend = "up" | "down" | "stable";

type Entry = {
  text: string;
  sentiment: Sentiment;
  context: Context;
  daysAgo: number;
  hoursAgo?: number;
};

type TestScores = {
  das?: { total: number; perfectionism: number; externalApproval: number; achievement: number };
  sat?: { total: number; topHigh: string[]; topLow: string[] };
  acsi?: { total: number; weakest: string; strongest: string };
  csai?: { cognitive: number; somatic: number; confidence: number };
};

type ThemeSignal = {
  label: string;
  count: number;
  trend: Trend;
  color: string;
  linked?: string; // linked test subscale
};

type Client = {
  id: string;
  name: string;
  initials: string;
  sport: string;
  level: string;
  flag: Flag;
  entriesThisWeek: number;
  sentimentWeek: number[]; // 7-day % positive (0–100)
  themes: ThemeSignal[];
  recentEntries: Entry[];
  testScores: TestScores;
  aiInsight: string;
  sessionFocus: string;
  lastActive: string;
  positiveRate: number;
  trend: Trend;
};

// ── Mock clients ───────────────────────────────────────────────────────────────

const CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Anna Kovács",
    initials: "AK",
    sport: "Gymnastics",
    level: "National level",
    flag: "attention",
    entriesThisWeek: 9,
    positiveRate: 28,
    trend: "down",
    lastActive: "2 hours ago",
    sentimentWeek: [60, 45, 30, 20, 25, 30, 28],
    themes: [
      { label: "Perfectionism",   count: 6, trend: "up",   color: "rose",    linked: "DAS · Perfectionism +8" },
      { label: "Self-doubt",      count: 4, trend: "up",   color: "orange",  linked: "DAS · Achievement +6"   },
      { label: "Pre-comp anxiety",count: 3, trend: "stable", color: "amber"  },
      { label: "Confidence",      count: 1, trend: "down", color: "emerald"  },
    ],
    recentEntries: [
      { text: "Fell off the beam again in practice. I should be past this by now — same mistake for three weeks. I'm genuinely starting to wonder if I'm cut out for this level.",  sentiment: "negative", context: "post-competition", daysAgo: 0, hoursAgo: 2  },
      { text: "Tried the new routine element and it went ok but not perfect. My coach said it was good but I know it wasn't. I can't perform something 'ok'.",                        sentiment: "negative", context: "during-session",  daysAgo: 1  },
      { text: "Had a decent warm-up. Felt loose. Then overthought everything in the second half and it fell apart.",                                                                   sentiment: "negative", context: "pre-training",    daysAgo: 2  },
    ],
    testScores: {
      das: { total: 28, perfectionism: 8, externalApproval: 7, achievement: 6 },
      acsi: { total: 54, weakest: "Freedom from worry", strongest: "Coachability" },
    },
    aiInsight: "Anna's self-talk has shown a consistent and worsening perfectionist pattern over the past 10 days — 6 of 9 entries this week contain language like 'should be past this', 'not perfect', or 'cut out for'. This directly mirrors her DAS Perfectionism score of +8 (dysfunctional range) and DAS External Approval at +7. The core belief driving the negative self-talk appears to be: performance errors = personal inadequacy. Confidence-related language has declined sharply (1 positive entry vs. 4 last week). There is no evidence of burnout language yet, but the trajectory warrants early intervention.",
    sessionFocus: "Challenge the 'errors = inadequacy' link. Use a brief thought-record exercise before the next session: identify the thought, rate belief strength, find counter-evidence. Reinforce the distinction between performance standards and self-worth.",
  },

  {
    id: "c2",
    name: "Liam O'Brien",
    initials: "LO",
    sport: "Swimming",
    level: "Club elite",
    flag: "monitor",
    entriesThisWeek: 7,
    positiveRate: 57,
    trend: "up",
    lastActive: "Yesterday",
    sentimentWeek: [30, 25, 40, 55, 70, 65, 57],
    themes: [
      { label: "Pre-comp anxiety", count: 4, trend: "down",   color: "amber",   linked: "CSAI · Cognitive 24" },
      { label: "Confidence",       count: 3, trend: "up",     color: "emerald", linked: "ACSI · Confidence ↑"  },
      { label: "Focus & flow",     count: 2, trend: "up",     color: "purple"   },
      { label: "Perfectionism",    count: 1, trend: "stable", color: "rose"     },
    ],
    recentEntries: [
      { text: "Best split time in four months today. Didn't overthink it for once — just swam. I want more of that feeling.",              sentiment: "positive", context: "post-competition", daysAgo: 1  },
      { text: "Morning session felt like flow. Everything clicked. Coach noticed and pulled me aside after — that meant a lot.",           sentiment: "positive", context: "during-session",  daysAgo: 2  },
      { text: "Night before the time trial I couldn't sleep. Kept running through worst case scenarios. Managed to reframe by morning.", sentiment: "neutral",  context: "pre-training",    daysAgo: 4  },
    ],
    testScores: {
      csai:  { cognitive: 24, somatic: 18, confidence: 28 },
      acsi:  { total: 78, weakest: "Freedom from worry", strongest: "Peaking under pressure" },
      das:   { total: 11, perfectionism: 4, externalApproval: 3, achievement: 2 },
    },
    aiInsight: "Máté shows a clear positive trend this week — positive entry rate has risen from 30% (Monday) to 65%+ by Thursday, coinciding with a strong training result on day 2. Pre-competition anxiety language is present but declining and he's demonstrating active reframing ('managed to reframe by morning'). The CSAI cognitive anxiety score (24) is in the borderline range but his ACSI Peaking score is a genuine strength. The self-talk pattern suggests he responds well to performance confirmation — good results reinforce his internal narrative quickly.",
    sessionFocus: "Reinforce the reframing skill he's already using. Help him build a pre-competition routine (3–5 minutes) that anchors the 'just swim' state he described. The goal is to make that state accessible without needing a confidence-building result first.",
  },

  {
    id: "c3",
    name: "Sara Blackwell",
    initials: "SB",
    sport: "Tennis",
    level: "National junior",
    flag: "stable",
    entriesThisWeek: 6,
    positiveRate: 72,
    trend: "stable",
    lastActive: "Today",
    sentimentWeek: [65, 70, 75, 65, 80, 70, 72],
    themes: [
      { label: "Confidence",     count: 4, trend: "stable", color: "emerald" },
      { label: "Focus & flow",   count: 3, trend: "up",     color: "purple"  },
      { label: "Motivation",     count: 2, trend: "stable", color: "sky"     },
      { label: "Self-doubt",     count: 1, trend: "stable", color: "orange"  },
    ],
    recentEntries: [
      { text: "Serve is coming together. I trust it now — that took months. There's something satisfying about a technique finally clicking.",  sentiment: "positive", context: "during-session",   daysAgo: 0, hoursAgo: 5 },
      { text: "Lost the second set badly but kept myself in it mentally. Year ago that would have spiralled. Didn't today.",                   sentiment: "positive", context: "post-competition", daysAgo: 1 },
      { text: "Rest day and suddenly doubt everything. Weird how not training switches something off. Fine when I'm in the gym.",             sentiment: "neutral",  context: "rest-day",          daysAgo: 3 },
    ],
    testScores: {
      das:  { total: 4, perfectionism: 1, externalApproval: 0, achievement: 1 },
      sat:  { total: 142, topHigh: ["Performance", "Consciousness", "Dominance"], topLow: ["Helplessness", "Aggression"] },
      acsi: { total: 88, weakest: "Goal setting", strongest: "Coping with adversity" },
    },
    aiInsight: "Sara's self-talk pattern is one of the healthiest in the group — 72% positive entries with a consistent distribution across the week (no spike/crash pattern). Notably, she demonstrates active resilience language ('kept myself in it', 'didn't spiral') rather than just reporting absence of negativity. The only consistent flag is rest-day self-doubt (3 of 4 rest-day entries this month contain doubt language) — this is a structural, low-structure-day vulnerability rather than a general confidence issue. DAS total score of +4 is well within normal range.",
    sessionFocus: "No urgent intervention. Explore the rest-day doubt pattern — is there a identity-sport fusion ('I am what I train') worth examining? A low-key rest-day ritual or short journalling prompt could bridge the gap. Continue reinforcing her adversity-coping language.",
  },

  {
    id: "c4",
    name: "Réka Molnár",
    initials: "RM",
    sport: "Athletics (400m)",
    level: "Club elite",
    flag: "attention",
    entriesThisWeek: 5,
    positiveRate: 22,
    trend: "down",
    lastActive: "3 days ago",
    sentimentWeek: [60, 50, 35, 28, 22, 18, 22],
    themes: [
      { label: "Motivation",       count: 4, trend: "down", color: "sky",    linked: "ACSI · Motivation ↓" },
      { label: "Self-doubt",       count: 4, trend: "up",   color: "orange", linked: "DAS · Achievement +6" },
      { label: "Perfectionism",    count: 2, trend: "stable", color: "rose"  },
      { label: "Pre-comp anxiety", count: 1, trend: "stable", color: "amber" },
    ],
    recentEntries: [
      { text: "Don't even know why I'm training right now. Going through the motions. Coach is great but I just feel empty when I run.",  sentiment: "negative", context: "post-competition", daysAgo: 3  },
      { text: "What's the point of any of this. Even when I run a good time it feels like nothing.",                                    sentiment: "negative", context: "general",           daysAgo: 4  },
      { text: "Hard session but I got through it. Didn't feel anything though. Like being on autopilot.",                              sentiment: "negative", context: "during-session",   daysAgo: 5  },
    ],
    testScores: {
      das:  { total: 22, perfectionism: 5, externalApproval: 4, achievement: 6 },
      acsi: { total: 61, weakest: "Peaking under pressure", strongest: "Goal setting" },
      sat:  { total: 118, topHigh: ["Order", "Conscientiousness"], topLow: ["Performance", "Exhibition"] },
    },
    aiInsight: "Réka's journal shows a two-week declining trend in motivational language with language patterns consistent with early-stage burnout or anhedonia ('going through the motions', 'feel empty', 'what's the point'). This is distinct from the performance-anxiety or perfectionism patterns seen in other athletes — this is a values/meaning disconnection. Her ACSI Peaking score is the weakest subscale, and the SAT shows low Performance and Exhibition motivation. The declining log frequency (last entry 3 days ago) is itself a signal worth noting.",
    sessionFocus: "Priority: values reconnection before any performance work. Ask: 'What originally made you want to run 400m?' Use a brief motivational interviewing approach — explore intrinsic vs extrinsic motivation. Avoid adding training load or technique goals until engagement recovers. Consider whether a short planned break would help.",
  },

  {
    id: "c5",
    name: "Tobias Schneider",
    initials: "TS",
    sport: "Football",
    level: "Academy",
    flag: "monitor",
    entriesThisWeek: 3,
    positiveRate: 67,
    trend: "stable",
    lastActive: "Yesterday",
    sentimentWeek: [0, 0, 0, 50, 80, 70, 67],
    themes: [
      { label: "Confidence",   count: 2, trend: "stable", color: "emerald" },
      { label: "Self-doubt",   count: 1, trend: "stable", color: "orange"  },
    ],
    recentEntries: [
      { text: "First time using this. Scored twice in training — coach said I played with confidence. Felt good.",                             sentiment: "positive", context: "during-session", daysAgo: 1  },
      { text: "Lost my position for the weekend game. Frustrated but trying to use it as fuel.",                                              sentiment: "neutral",  context: "general",        daysAgo: 2  },
      { text: "Good session. Felt sharp. Not sure how to describe it exactly — just everything working the way it should.",                   sentiment: "positive", context: "during-session", daysAgo: 3  },
    ],
    testScores: {
      acsi: { total: 72, weakest: "Freedom from worry", strongest: "Concentration" },
    },
    aiInsight: "Bence joined the journal system 4 days ago — too early for reliable pattern detection. Three entries provide a positive initial baseline (67% positive) and he's already using the journal constructively (reframing a setback as 'fuel'). The ACSI profile is solid overall with concentration as a clear strength. No flags beyond the limited data.",
    sessionFocus: "Encourage consistent daily logging — especially before and after matches. Establish the habit before the data becomes analytically useful. A simple prompt ('one thing on your mind before training') may help lower the barrier to entry.",
  },
];

// ── Visual helpers ─────────────────────────────────────────────────────────────

const FLAG_CONFIG: Record<Flag, { label: string; dot: string; text: string; bg: string; border: string }> = {
  attention: { label: "Needs attention", dot: "bg-rose-400",    text: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
  monitor:   { label: "Monitor",         dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  stable:    { label: "On track",        dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

const SENT_CFG: Record<Sentiment, { icon: string; ring: string; bg: string; text: string }> = {
  positive: { icon: "↑", ring: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-300" },
  negative: { icon: "↓", ring: "border-rose-500/50",    bg: "bg-rose-500/10",    text: "text-rose-300"    },
  neutral:  { icon: "→", ring: "border-sky-500/50",     bg: "bg-sky-500/10",     text: "text-sky-300"     },
};

const CTX_ICON: Record<Context, string> = {
  "pre-training":     "⚡",
  "during-session":   "🎯",
  "post-competition": "🏆",
  "rest-day":         "💤",
  "general":          "💭",
};

const THEME_CLS: Record<string, string> = {
  rose:    "border-rose-500/30 bg-rose-500/10 text-rose-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber:   "border-amber-500/30 bg-amber-500/10 text-amber-300",
  purple:  "border-purple-500/30 bg-purple-500/10 text-purple-300",
  sky:     "border-sky-500/30 bg-sky-500/10 text-sky-300",
  orange:  "border-orange-500/30 bg-orange-500/10 text-orange-300",
};

const TREND_ICON: Record<Trend, string> = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR: Record<Trend, string> = { up: "text-emerald-400", down: "text-rose-400", stable: "text-zinc-500" };

// ── Sentiment sparkline ────────────────────────────────────────────────────────

function SentimentSparkline({ data }: { data: number[] }) {
  const w = 80; const h = 28;
  const max = 100; const min = 0;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = data[data.length - 1];
  const color = last >= 60 ? "rgb(52,211,153)" : last >= 40 ? "rgb(251,191,36)" : "rgb(251,113,133)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7" aria-hidden>
      <defs>
        <linearGradient id={`sg_${data[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── DAS subscale mini-badge ────────────────────────────────────────────────────

function DasScoreBadge({ label, score }: { label: string; score: number }) {
  const dysfunctional = Math.abs(score) > 5;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-saira text-[10px] text-zinc-500">{label}</span>
      <span className={`font-saira text-[11px] font-bold ${dysfunctional ? "text-rose-300" : "text-emerald-300"}`}>
        {score > 0 ? "+" : ""}{score}
      </span>
      {dysfunctional && <span className="text-[9px] text-rose-400">●</span>}
    </div>
  );
}

// ── Client card ────────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const [expanded, setExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"analysis" | "entries" | "scores">("analysis");
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
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-saira text-sm font-bold ${
          client.flag === "attention" ? "bg-rose-500/20 text-rose-200 border border-rose-500/30" :
          client.flag === "monitor"   ? "bg-amber-500/20 text-amber-200 border border-amber-500/30" :
          "bg-purple-500/20 text-purple-200 border border-purple-500/30"
        }`}>
          {client.initials}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-saira text-sm font-semibold text-zinc-100">{client.name}</p>
            <span className="font-saira text-[10px] text-zinc-500">{client.sport} · {client.level}</span>
          </div>
          <p className="font-saira text-[11px] text-zinc-600 mt-0.5">
            Last active {client.lastActive} · {client.entriesThisWeek} entries this week
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Sparkline */}
          <div title="7-day positive sentiment %">
            <SentimentSparkline data={client.sentimentWeek} />
          </div>

          {/* Positive rate */}
          <div className="text-center hidden sm:block">
            <p className={`font-saira text-base font-bold ${
              client.positiveRate >= 60 ? "text-emerald-300" :
              client.positiveRate >= 40 ? "text-amber-300" : "text-rose-300"
            }`}>{client.positiveRate}%</p>
            <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-600">positive</p>
          </div>

          {/* Trend */}
          <span className={`font-saira text-lg font-bold ${TREND_COLOR[client.trend]}`}>
            {TREND_ICON[client.trend]}
          </span>

          {/* Flag chip */}
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
              { key: "analysis", label: "Analysis" },
              { key: "entries",  label: "Recent entries" },
              { key: "scores",   label: "Test scores" },
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
                {/* Theme signals */}
                <div>
                  <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-300 mb-3">
                    Detected themes this week
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {client.themes.map((t) => (
                      <div key={t.label} className="flex flex-col gap-0.5">
                        <span className={`rounded-full border px-3 py-1 font-saira text-[10px] uppercase tracking-[0.13em] ${THEME_CLS[t.color]}`}>
                          <span className={`mr-1 ${TREND_COLOR[t.trend]} font-bold`}>{TREND_ICON[t.trend]}</span>
                          {t.label}
                          <span className="ml-1.5 opacity-50">×{t.count}</span>
                        </span>
                        {t.linked && (
                          <span className="font-saira text-[9px] text-zinc-600 pl-3">
                            ↳ {t.linked}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insight */}
                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-purple-300">✦</span>
                    </div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300">
                      Pattern analysis
                    </p>
                    <span className="ml-auto rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-saira text-[9px] text-purple-400 uppercase tracking-[0.14em]">
                      AI · Preview
                    </span>
                  </div>
                  <p className="font-saira text-xs leading-relaxed text-zinc-300">
                    {client.aiInsight}
                  </p>
                </div>

                {/* Session focus */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300 mb-2">
                    Suggested session focus
                  </p>
                  <p className="font-saira text-xs leading-relaxed text-zinc-300">
                    {client.sessionFocus}
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Recent entries ── */}
            {activeTab === "entries" && (
              <div className="space-y-3">
                {client.recentEntries.map((e, i) => {
                  const s = SENT_CFG[e.sentiment];
                  const when = e.daysAgo === 0
                    ? (e.hoursAgo ? `${e.hoursAgo}h ago` : "Today")
                    : e.daysAgo === 1 ? "Yesterday"
                    : `${e.daysAgo} days ago`;
                  return (
                    <div key={i} className={`rounded-2xl border ${s.ring} ${s.bg} p-4`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.text} bg-white/5`}>
                          {s.icon}
                        </span>
                        <p className="font-saira text-sm leading-relaxed text-zinc-200 flex-1">{e.text}</p>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="font-saira text-[10px] text-zinc-600">{CTX_ICON[e.context]} {e.context.replace(/-/g, " ")}</span>
                        <span className="ml-auto font-saira text-[10px] text-zinc-600">{when}</span>
                      </div>
                    </div>
                  );
                })}
                <p className="font-saira text-[11px] text-zinc-700 text-center pt-1">
                  Showing 3 most recent · Full journal visible in authenticated version
                </p>
              </div>
            )}

            {/* ── Tab: Test scores ── */}
            {activeTab === "scores" && (
              <div className="space-y-5">
                {/* DAS */}
                {client.testScores.das && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300 mb-3">
                      Attitude Scale (DAS)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <ScoreCard label="Total" value={`${client.testScores.das.total > 0 ? "+" : ""}${client.testScores.das.total}`} sub="of 70" flag={client.testScores.das.total >= 18 ? "rose" : "emerald"} />
                      <ScoreCard label="Perfectionism" value={`+${client.testScores.das.perfectionism}`} sub="of 10" flag={client.testScores.das.perfectionism > 5 ? "rose" : "emerald"} />
                      <ScoreCard label="Ext. Approval" value={`+${client.testScores.das.externalApproval}`} sub="of 10" flag={client.testScores.das.externalApproval > 5 ? "rose" : "emerald"} />
                      <ScoreCard label="Achievement" value={`+${client.testScores.das.achievement}`} sub="of 10" flag={client.testScores.das.achievement > 5 ? "rose" : "emerald"} />
                    </div>
                  </div>
                )}

                {/* ACSI */}
                {client.testScores.acsi && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-300 mb-3">
                      Coping Skills (ACSI)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <ScoreCard label="Total" value={String(client.testScores.acsi.total)} sub="of 112" flag={client.testScores.acsi.total >= 75 ? "emerald" : client.testScores.acsi.total >= 50 ? "amber" : "rose"} />
                      <ScoreCard label="Weakest" value={client.testScores.acsi.weakest} sub="" flag="rose" small />
                      <ScoreCard label="Strongest" value={client.testScores.acsi.strongest} sub="" flag="emerald" small />
                    </div>
                  </div>
                )}

                {/* CSAI */}
                {client.testScores.csai && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300 mb-3">
                      Competitive Anxiety (CSAI)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreCard label="Cognitive" value={String(client.testScores.csai.cognitive)} sub="of 36" flag={client.testScores.csai.cognitive <= 18 ? "emerald" : "rose"} />
                      <ScoreCard label="Somatic" value={String(client.testScores.csai.somatic)} sub="of 36" flag={client.testScores.csai.somatic <= 18 ? "emerald" : "rose"} />
                      <ScoreCard label="Confidence" value={String(client.testScores.csai.confidence)} sub="of 36" flag={client.testScores.csai.confidence >= 22 ? "emerald" : "rose"} />
                    </div>
                  </div>
                )}

                {/* SAT */}
                {client.testScores.sat && (
                  <div>
                    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300 mb-3">
                      Self-Awareness (SAT)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <ScoreCard label="Total" value={String(client.testScores.sat.total)} sub="of 165" flag="emerald" />
                      <div className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                        <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">High factors</p>
                        <div className="flex flex-wrap gap-1">
                          {client.testScores.sat.topHigh.map((f) => (
                            <span key={f} className="rounded-full bg-fuchsia-500/15 border border-fuchsia-500/20 px-2 py-0.5 font-saira text-[9px] text-fuchsia-300">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-[#0D0F14] p-3">
                        <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Low factors</p>
                        <div className="flex flex-wrap gap-1">
                          {client.testScores.sat.topLow.map((f) => (
                            <span key={f} className="rounded-full bg-zinc-800 border border-white/5 px-2 py-0.5 font-saira text-[9px] text-zinc-400">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(client.testScores).length === 0 && (
                  <p className="font-saira text-sm text-zinc-600 py-4 text-center">No tests completed yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, sub, flag, small = false }: {
  label: string; value: string; sub: string; flag: string; small?: boolean;
}) {
  const color = flag === "emerald" ? "text-emerald-300" : flag === "rose" ? "text-rose-300" : flag === "amber" ? "text-amber-300" : "text-sky-300";
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

// ── Roster summary bar ─────────────────────────────────────────────────────────

function RosterSummary({ clients }: { clients: Client[] }) {
  const attention = clients.filter((c) => c.flag === "attention").length;
  const monitor   = clients.filter((c) => c.flag === "monitor").length;
  const stable    = clients.filter((c) => c.flag === "stable").length;
  const avgPositive = Math.round(clients.reduce((s, c) => s + c.positiveRate, 0) / clients.length);
  const totalEntries = clients.reduce((s, c) => s + c.entriesThisWeek, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
      <SummaryTile value={String(clients.length)} label="Athletes"   color="text-zinc-100" />
      <SummaryTile value={String(attention)}       label="Attention"  color="text-rose-300"    dot="bg-rose-400"    />
      <SummaryTile value={String(monitor)}         label="Monitor"    color="text-amber-300"   dot="bg-amber-400"   />
      <SummaryTile value={String(stable)}          label="On track"   color="text-emerald-300" dot="bg-emerald-400" />
      <SummaryTile value={`${avgPositive}%`}       label="Avg positive · 7d" color="text-purple-300" />
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

// ── Auth banner ────────────────────────────────────────────────────────────────

function CoachAuthBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-8 rounded-2xl border border-white/8 bg-[#0F1117] px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <span className="text-purple-300 text-sm">⚑</span>
        </div>
        <div>
          <p className="font-saira text-xs font-semibold text-zinc-200">Coach view — preview mode</p>
          <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
            Showing mock client data. In the full version, your athletes connect their accounts and you see live journal entries, real-time flags, and session notes here.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          className="relative rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-saira text-[11px] font-semibold text-zinc-300 cursor-default"
        >
          Sign in as coach
          <span className="absolute -top-2 -right-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-px font-saira text-[8px] uppercase tracking-[0.15em] text-amber-300">
            Soon
          </span>
        </button>
        <button onClick={() => setDismissed(true)} className="font-saira text-[11px] text-zinc-700 hover:text-zinc-400 transition">✕</button>
      </div>
    </div>
  );
}

// ── Sort & filter ──────────────────────────────────────────────────────────────

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
  const [sort, setSort] = React.useState<SortKey>("flag");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? CLIENTS.filter((c) => c.name.toLowerCase().includes(q) || c.sport.toLowerCase().includes(q))
      : CLIENTS;
    return sortClients(base, sort);
  }, [sort, search]);

  return (
    <div className="relative min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.11),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
              PowerFlow · Coach
            </p>
            <h1 className="mt-2 font-saira text-3xl font-extrabold uppercase tracking-[0.12em] sm:text-4xl">
              Athlete Overview
            </h1>
            <p className="mt-3 font-saira text-sm text-zinc-400 max-w-xl">
              Monitor your athletes' mental state, self-talk patterns, and test results in one place — updated as they log.
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

        {/* Auth banner */}
        <CoachAuthBanner />

        {/* Roster summary */}
        <RosterSummary clients={CLIENTS} />

        {/* Controls */}
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

        {/* Client list */}
        <div className="space-y-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
          {filtered.length === 0 && (
            <p className="font-saira text-sm text-zinc-600 text-center py-10">No athletes match your search.</p>
          )}
        </div>

        <p className="mt-12 text-center font-saira text-[11px] text-zinc-700">
          In the full version, athletes invite you as their coach and their data syncs here automatically.{" "}
          <Link href="/journal" className="underline decoration-zinc-700 hover:text-zinc-400">Open your own journal →</Link>
        </p>
      </div>
    </div>
  );
}
