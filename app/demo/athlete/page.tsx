"use client";

import React from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "neutral" | "negative";
type JournalEntry = {
  daysBack: number;
  hour?: number;
  type: "journal" | "training";
  content: string;
  sentiment?: Sentiment;
  moodRating?: number;
  wentWell?: string;
  sessionType?: string;
};
type Message = {
  role: "user" | "coach";
  text: string;
  ts?: string;
};

// ─── Demo data — Alex Morrison ───────────────────────────────────────────────

const ATHLETE = {
  name: "Alex Morrison",
  initials: "AM",
  federation: "IPF",
  bw: 82.6,
  weightClass: "83",
  daysToMeet: 56,
  squat:    { current: 220,   goal: 247.5 },
  bench:    { current: 152.5, goal: 170   },
  deadlift: { current: 272.5, goal: 300   },
  checkin: {
    mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 8,
    win: "237.5 squat. Visualization script working. Feeling ready.",
  },
  affirmations: [
    "I am strong and prepared.",
    "I trust my training.",
    "The platform is where I belong.",
  ],
};

const FEED: JournalEntry[] = [
  {
    daysBack: 0, hour: 9, type: "journal", sentiment: "neutral",
    content: "Been fixating on opener numbers. Trying to remind myself — I pick the number, the number doesn't pick me. Coach says trust the process. Working on it.",
  },
  {
    daysBack: 1, hour: 16, type: "training", moodRating: 9,
    sessionType: "Squat · Heavy",
    wentWell: "Mental prep on point. Clear head.",
    content: "237.5 squat × 2. New training PR. Everything clicked — the visualization script before the set made the bar feel lighter. Trust the process.",
  },
  {
    daysBack: 1, hour: 7, type: "journal", sentiment: "positive",
    content: "237.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to believe the goal total is within reach.",
  },
  {
    daysBack: 4, hour: 17, type: "training", moodRating: 8,
    sessionType: "Deadlift · Volume",
    wentWell: "Lat spread cue clicked — bar path was perfect.",
    content: "5 × 3 @ 245. Pulled the last set from visualization — saw the rep before it happened. New cue is working.",
  },
  {
    daysBack: 5, hour: 8, type: "journal", sentiment: "positive",
    content: "Ran through the deadlift visualization script twice this morning. The 'lat spread, patient hips, pull through' sequence is starting to feel automatic. Ready for tomorrow's pull session.",
  },
  {
    daysBack: 7, hour: 18, type: "journal", sentiment: "neutral",
    content: "Week check-in done. Sleep has been good, energy is consistent. Mood is high. 8 weeks feels like a long time and exactly enough time at once.",
  },
  {
    daysBack: 10, hour: 20, type: "journal", sentiment: "negative",
    content: "Bad bench session mentally. Weight was fine but I was in my head the whole time. Kept thinking about the competition instead of the rep. Coach sent a note — going to work on process cues next session.",
  },
];

const CHAT: Message[] = [
  {
    role: "user",
    text: "I keep fixating on my opener weights. Can't stop thinking about numbers.",
    ts: "Today, 9:14",
  },
  {
    role: "coach",
    text: "I saw your journal entry this morning — 'I pick the number, the number doesn't pick me.' That's actually a great frame you've already found yourself.\n\nHere's what I'm noticing: this is a control pattern. Your brain is trying to manage uncertainty by rehearsing numbers. It's not weakness, it's just misdirected focus.\n\nTry this today: any time an opener thought comes up, replace it with a process cue. For squat that's 'strong, explosive, locked in.' Don't fight the thought — just redirect it.",
    ts: "Today, 9:15",
  },
  {
    role: "user",
    text: "That makes sense. What about yesterday's squat PR — should I revise my goal?",
    ts: "Today, 9:18",
  },
  {
    role: "coach",
    text: "That 237.5 × 2 is a strong data point — and you noted the visualization was a factor. That's exactly the connection we've been building.\n\nOn the goal revision: I'd hold 247.5 for now. You're 8 weeks out, still in prep. What matters more is that yesterday showed you the mental routine is working. Build on that consistency.\n\nYour squat confidence is clearly growing. Let that carry into your bench and deadlift prep this week.",
    ts: "Today, 9:19",
  },
  {
    role: "user",
    text: "Any visualization script for deadlift today?",
    ts: "Today, 9:21",
  },
  {
    role: "coach",
    text: "Yes — here's a short one tailored to your cues:\n\n\"Stand behind the bar. Feel the floor under your feet. Reach down — lat spread wide, lats locked in. Take a breath. See the bar leave the floor. Patient hips. Strong. Explosive. Pull through the top. Done.\"\n\nRun through it 2–3 times before your first heavy set. The keywords that have been working for you: strong · explosive · patient.\n\nGood luck today.",
    ts: "Today, 9:22",
  },
];

const SCRIPTS = [
  {
    id: "squat",
    title: "Pre-Squat Activation",
    duration: "4 min",
    color: "violet",
    keywords: ["strong", "explosive", "locked in"],
    preview: "Stand behind the bar. Feel the floor. Take a breath and let your body settle. Picture the bar across your back — tight, controlled. See yourself walk out with authority. Brace. Sit back into the hole. Explode. Locked at the top. You've done this a thousand times.",
  },
  {
    id: "bench",
    title: "Bench Focus Reset",
    duration: "3 min",
    color: "sky",
    keywords: ["smooth", "confident"],
    preview: "You're under the bar. Your setup is perfect — arch set, lats packed, leg drive ready. Take the bar. Smooth descent. Pause. Explode off the chest. Lockout. The weight is yours. You own this bench.",
  },
  {
    id: "deadlift",
    title: "Deadlift Intent",
    duration: "5 min",
    color: "emerald",
    keywords: ["strong", "explosive", "patient"],
    preview: "Stand behind the bar. Lat spread. Hips hinge back. See the bar leave the floor before it does. Patient off the ground. Explode through the hip. Pull through the top. Done. The bar had no choice.",
  },
  {
    id: "competition",
    title: "Competition Day Walk-In",
    duration: "8 min",
    color: "amber",
    keywords: ["calm", "ready", "mine"],
    preview: "You've been to this platform a hundred times in your mind. Today it's just another rep. The crowd doesn't change the weight. The weight doesn't care who's watching. Chalk up. Breathe. Walk out.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(c: number, g: number) { return Math.min(Math.round((c / g) * 100), 100); }
function sdot(s?: Sentiment) { return s === "positive" ? "bg-emerald-400" : s === "negative" ? "bg-rose-400" : "bg-zinc-400"; }
function relLabel(d: number) { return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`; }
function scoreColor(v: number) { return v >= 8 ? "text-emerald-300" : v >= 6 ? "text-zinc-200" : "text-rose-300"; }

function scriptColor(c: string) {
  switch (c) {
    case "violet":  return { border: "border-violet-500/20", bg: "bg-violet-500/8", badge: "bg-violet-500/15 text-violet-300 border-violet-500/25", play: "bg-violet-500/20 hover:bg-violet-500/35 text-violet-200", kwbg: "bg-violet-500/10 text-violet-300 border-violet-500/20" };
    case "sky":     return { border: "border-sky-500/20",    bg: "bg-sky-500/8",    badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",       play: "bg-sky-500/20 hover:bg-sky-500/35 text-sky-200",     kwbg: "bg-sky-500/10 text-sky-300 border-sky-500/20" };
    case "emerald": return { border: "border-emerald-500/20", bg: "bg-emerald-500/8", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", play: "bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-200", kwbg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" };
    case "amber":   return { border: "border-amber-500/20",  bg: "bg-amber-500/8",  badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",   play: "bg-amber-500/20 hover:bg-amber-500/35 text-amber-200",   kwbg: "bg-amber-500/10 text-amber-300 border-amber-500/20" };
    default:        return { border: "border-white/10",      bg: "bg-white/5",      badge: "bg-white/10 text-zinc-300 border-white/10",           play: "bg-white/10 hover:bg-white/20 text-zinc-200",           kwbg: "bg-white/8 text-zinc-300 border-white/10" };
  }
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab() {
  const c = ATHLETE.checkin;
  return (
    <div className="space-y-4">
      {/* Meet countdown */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="font-saira text-[10px] uppercase tracking-widest text-amber-400 mb-0.5">Next meet</p>
          <p className="font-saira text-lg font-extrabold text-white">{ATHLETE.daysToMeet} days</p>
        </div>
        <div className="text-right">
          <p className="font-saira text-[10px] text-zinc-500">IPF · 83 kg class</p>
          <p className="font-saira text-[10px] text-zinc-500">{ATHLETE.bw} kg bodyweight</p>
        </div>
      </div>

      {/* Strength targets */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
        <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Strength targets</p>
        <div className="space-y-3">
          {(["squat", "bench", "deadlift"] as const).map(lift => {
            const d = ATHLETE[lift];
            return (
              <div key={lift}>
                <div className="flex justify-between mb-1">
                  <span className="font-saira text-[10px] uppercase tracking-wider text-zinc-400">{lift}</span>
                  <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{d.current} <span className="text-zinc-600">/ {d.goal} kg</span></span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct(d.current, d.goal)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest check-in */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
        <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Last weekly check-in</p>
        <div className="grid grid-cols-5 gap-1 mb-3">
          {[["Mood", c.mood], ["Quality", c.quality], ["Ready", c.readiness], ["Energy", c.energy], ["Sleep", c.sleep]].map(([l, v]) => (
            <div key={l as string} className="text-center">
              <div className={`text-xl font-extrabold font-saira ${scoreColor(Number(v))}`}>{v}</div>
              <div className="font-saira text-[9px] text-zinc-500 uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
        <p className="font-saira text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
          <span className="text-zinc-500 mr-1">Biggest win:</span>{c.win}
        </p>
      </div>

      {/* Affirmations */}
      <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
        <p className="font-saira text-[10px] uppercase tracking-widest text-violet-400 mb-2.5">Today's affirmations</p>
        <div className="space-y-2">
          {ATHLETE.affirmations.map((aff, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="font-saira text-[10px] font-bold text-violet-400 flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="font-saira text-sm text-zinc-200 leading-relaxed">{aff}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest journal */}
      {FEED.filter(e => e.type === "journal")[0] && (() => {
        const e = FEED.filter(e => e.type === "journal")[0]!;
        return (
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${sdot(e.sentiment)}`} />
              <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">Latest journal · {relLabel(e.daysBack)}</p>
            </div>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed">{e.content}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Journal Tab ──────────────────────────────────────────────────────────────

function JournalTab() {
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const sorted = [...FEED].sort((a, b) => {
    const ta = a.daysBack * 24 - (a.hour ?? 12);
    const tb = b.daysBack * 24 - (b.hour ?? 12);
    return ta - tb;
  });
  return (
    <div className="space-y-2">
      {sorted.map((e, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setExpanded(expanded === i ? null : i)}
          className={`w-full text-left rounded-2xl border p-4 transition-all ${e.type === "training" ? "border-sky-500/15 bg-sky-500/[0.04] hover:bg-sky-500/[0.07]" : "border-violet-500/15 bg-violet-500/[0.04] hover:bg-violet-500/[0.07]"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {e.sentiment && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sdot(e.sentiment)}`} />}
            <span className={`rounded-full border px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider ${e.type === "training" ? "bg-sky-500/15 text-sky-300 border-sky-500/20" : "bg-violet-500/15 text-violet-300 border-violet-500/20"}`}>
              {e.type === "training" ? (e.sessionType ?? "Training") : "Journal"}
            </span>
            {e.moodRating && <span className="font-saira text-[10px] text-zinc-400">Mood {e.moodRating}/10</span>}
            <span className="font-saira text-[10px] text-zinc-500 ml-auto">{relLabel(e.daysBack)}</span>
          </div>
          <p className={`font-saira text-xs text-zinc-300 leading-relaxed ${expanded === i ? "" : "line-clamp-2"}`}>{e.content}</p>
          {e.wentWell && (
            <p className="font-saira text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
              <span>✓</span>{e.wentWell}
            </p>
          )}
          {expanded !== i && e.content.length > 100 && (
            <p className="font-saira text-[10px] text-zinc-600 mt-1">Tap to expand</p>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab() {
  return (
    <div className="space-y-3">
      {/* Context chip */}
      <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <p className="font-saira text-[10px] text-zinc-400">Coach AI · knows your training history</p>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {CHAT.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-emerald-500/20 border border-emerald-500/20 rounded-tr-sm" : "bg-white/[0.05] border border-white/8 rounded-tl-sm"}`}>
              {msg.role === "coach" && (
                <p className="font-saira text-[9px] uppercase tracking-wider text-violet-400 mb-1.5">Coach AI</p>
              )}
              <p className="font-saira text-xs text-zinc-200 leading-relaxed whitespace-pre-line">{msg.text}</p>
              {msg.ts && (
                <p className="font-saira text-[9px] text-zinc-600 mt-1.5 text-right">{msg.ts}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input hint */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 flex items-center gap-2">
        <p className="flex-1 font-saira text-xs text-zinc-600">Ask about your training, mindset, prep…</p>
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-emerald-400 text-xs">↑</span>
        </div>
      </div>

      {/* Demo note */}
      <p className="text-center font-saira text-[10px] text-zinc-600 px-4">
        Demo only — the live Coach AI reads your actual journals, check-ins, and training logs
      </p>
    </div>
  );
}

// ─── Scripts Tab ─────────────────────────────────────────────────────────────

function ScriptsTab() {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-2.5">
        <p className="font-saira text-[10px] text-zinc-400">4 scripts · personalized with your keywords · available in 3 languages</p>
      </div>
      {SCRIPTS.map(script => {
        const colors = scriptColor(script.color);
        const isOpen = expanded === script.id;
        return (
          <div key={script.id} className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : script.id)}
              className="w-full text-left px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-saira text-sm font-bold text-white">{script.title}</p>
                  <p className="font-saira text-[10px] text-zinc-500 mt-0.5">{script.duration}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <div className={`rounded-xl border px-3 py-1 font-saira text-[10px] font-bold uppercase tracking-wider transition ${colors.play}`}>
                    {isOpen ? "Collapse" : "▶ Play"}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {script.keywords.map(kw => (
                  <span key={kw} className={`rounded-full border px-2 py-0.5 font-saira text-[9px] ${colors.kwbg}`}>{kw}</span>
                ))}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                <p className="font-saira text-xs text-zinc-300 leading-relaxed italic">"{script.preview}"</p>
                <div className="flex gap-2">
                  <button type="button" className={`flex-1 rounded-xl border py-2.5 font-saira text-[11px] font-bold uppercase tracking-wider transition ${colors.play}`}>
                    ▶  Listen (TTS)
                  </button>
                  <button type="button" className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 font-saira text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:bg-white/10 transition">
                    ⊕ Save
                  </button>
                </div>
                <p className="font-saira text-[9px] text-zinc-600 text-center">Audio works on lock screen in the live app</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoAthlete() {
  const [tab, setTab] = React.useState<"today" | "journal" | "chat" | "scripts">("today");

  const navItems: { id: "today" | "journal" | "chat" | "scripts"; label: string; icon: string }[] = [
    { id: "today",   label: "Today",   icon: "◉" },
    { id: "journal", label: "Journal", icon: "✦" },
    { id: "chat",    label: "Coach AI",icon: "✧" },
    { id: "scripts", label: "Scripts", icon: "▶" },
  ];

  return (
    /* Outer shell — dark desktop backdrop */
    <div className="min-h-screen bg-[#060606] sm:flex sm:items-start sm:justify-center sm:py-10 font-saira">
      {/* Phone frame */}
      <div className="w-full sm:w-[390px] sm:min-h-[820px] sm:rounded-[44px] sm:border-[7px] sm:border-zinc-800 sm:shadow-[0_32px_120px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] bg-[#0A0A0A] overflow-hidden relative flex flex-col">

        {/* Demo banner */}
        <div className="bg-emerald-600/20 border-b border-emerald-500/20 px-4 py-1.5 text-center flex-shrink-0">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Demo · Athlete View</p>
        </div>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400">PowerFlow · Athlete</p>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
              {tab === "today" ? "Today" : tab === "journal" ? "Journal" : tab === "chat" ? "Coach AI" : "Scripts"}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-saira text-xs font-semibold text-zinc-300">{ATHLETE.name}</p>
            <Link href="/demo" className="font-saira text-[10px] text-zinc-600 hover:text-zinc-400 transition">← Overview</Link>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {tab === "today"   && <TodayTab />}
          {tab === "journal" && <JournalTab />}
          {tab === "chat"    && <ChatTab />}
          {tab === "scripts" && <ScriptsTab />}
        </div>

        {/* Bottom navigation */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0A0A0A] border-t border-white/5 px-2 pb-safe sm:pb-2 pt-2 flex-shrink-0">
          <div className="flex">
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${tab === item.id ? "text-emerald-300" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                <span className={`text-base transition ${tab === item.id ? "text-emerald-400" : ""}`}>{item.icon}</span>
                <span className="font-saira text-[9px] uppercase tracking-wider font-semibold leading-none">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className="inline-block rounded-xl bg-emerald-600/80 hover:bg-emerald-600 px-6 py-2.5 font-saira text-xs font-bold uppercase tracking-widest text-white transition">
          Get in touch →
        </a>
      </div>
    </div>
  );
}
