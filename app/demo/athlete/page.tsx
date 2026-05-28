"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Demo sequence ────────────────────────────────────────────────────────────

const STEPS = [
  { phase: "Onboarding", label: "Welcome",           duration: 3200  }, // 0
  { phase: "Onboarding", label: "Your name",         duration: 3800  }, // 1
  { phase: "Onboarding", label: "Sport & class",     duration: 2800  }, // 2
  { phase: "Onboarding", label: "Current lifts",     duration: 3500  }, // 3
  { phase: "Onboarding", label: "Competition goals", duration: 3200  }, // 4
  { phase: "Onboarding", label: "Meet date",         duration: 2800  }, // 5
  { phase: "Onboarding", label: "All set!",          duration: 2800  }, // 6
  { phase: "Today",      label: "Good morning",      duration: 2800  }, // 7
  { phase: "Today",      label: "Log training day",  duration: 2200  }, // 8
  { phase: "Today",      label: "Weekly check-in",   duration: 3800  }, // 9
  { phase: "Today",      label: "Journal entry",     duration: 4500  }, // 10
  { phase: "Today",      label: "Today summary",     duration: 4000  }, // 11
  { phase: "Journal",    label: "Your history",      duration: 3500  }, // 12
  { phase: "Coach AI",   label: "Your question",     duration: 3500  }, // 13
  { phase: "Coach AI",   label: "AI response",       duration: 6000  }, // 14
  { phase: "Scripts",    label: "Script library",    duration: 3500  }, // 15
  { phase: "Scripts",    label: "Now playing",       duration: 86400000 }, // 16 — final
] as const;

type StepPhase = typeof STEPS[number]["phase"];
const TOTAL = STEPS.length;
const APP_START = 7; // steps ≥ 7 show app chrome

function activeTab(s: number): "today" | "journal" | "chat" | "scripts" {
  if (s <= 11) return "today";
  if (s === 12) return "journal";
  if (s <= 14) return "chat";
  return "scripts";
}

// ─── Demo data (Alex Morrison) ────────────────────────────────────────────────

const ALEX = {
  name:        "Alex Morrison",
  federation:  "IPF",
  wc:          "83 kg",
  bw:          82.6,
  daysToMeet:  56,
  squat:    { c: 220,   g: 247.5 },
  bench:    { c: 152.5, g: 170   },
  deadlift: { c: 272.5, g: 300   },
  checkin:  { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 8,
              win: "237.5 squat. Visualization script working. Feeling ready." },
  affirmations: [
    "I am strong and prepared.",
    "I trust my training.",
    "The platform is where I belong.",
  ],
};

type JEntry = { day: string; type: "journal" | "training"; sentiment: "positive" | "neutral" | "negative"; text: string; session?: string };
const JOURNAL: JEntry[] = [
  { day: "Today",     type: "journal"  as const, sentiment: "neutral"  as const,
    text: "Been fixating on opener numbers. Trying to remind myself — I pick the number, the number doesn't pick me.",
    session: undefined },
  { day: "Yesterday", type: "training" as const, sentiment: "positive" as const,
    text: "237.5 squat × 2. New training PR. Visualization script made a real difference today.",
    session: "Squat · Heavy" },
  { day: "Yesterday", type: "journal"  as const, sentiment: "positive" as const,
    text: "237.5 for 2. Never done that in training. The mental routine is working. Goal total is within reach.",
    session: undefined },
  { day: "4d ago",    type: "training" as const, sentiment: "positive" as const,
    text: "5 × 3 @ 245 deadlift. Lat spread cue clicked — bar path was perfect.",
    session: "Deadlift · Volume" },
  { day: "5d ago",    type: "journal"  as const, sentiment: "positive" as const,
    text: "Ran the deadlift visualization script twice this morning. The sequence is starting to feel automatic.",
    session: undefined },
];

const AI_Q = "I keep fixating on my opener weights. Can't stop thinking about the numbers.";
const AI_A = `I saw your journal this morning — "I pick the number, the number doesn't pick me." That's already the right frame.

What's happening is a control pattern. Your brain is managing uncertainty by rehearsing numbers. It's not weakness — it's misdirected focus.

When an opener thought comes up today, replace it with a process cue. For your squat: strong · explosive · locked in. Redirect, don't fight it.

Your 237.5 × 2 yesterday? That's the data that matters. The opener will feel easy.`;

const SQUAT_SCRIPT = `Stand behind the bar.

Feel the floor — solid, steady. Take one breath and let your body settle into the moment.

Picture the bar across your back. Tight. Controlled. Walk out with authority.

Brace deep. Sit back and down. Explode through the floor.

Strong. Locked at the top. You belong here.`;

// ─── Animation components ─────────────────────────────────────────────────────

function TypedText({ text, speed = 22, className }: { text: string; speed?: number; className?: string }) {
  const [shown, setShown] = React.useState("");
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    setShown(""); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return (
    <span className={className}>
      {shown}
      {!done && <span className="opacity-50 animate-pulse">|</span>}
    </span>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [vis, setVis] = React.useState(delay === 0);
  React.useEffect(() => {
    if (delay === 0) { setVis(true); return; }
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`transition-all duration-500 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}>
      {children}
    </div>
  );
}

function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    setVal(0);
    const n = 30;
    let i = 0;
    const t = setInterval(() => {
      i++;
      const ease = 1 - Math.pow(1 - i / n, 3);
      setVal(Math.round(to * ease * 2) / 2);
      if (i >= n) { clearInterval(t); setVal(to); }
    }, duration / n);
    return () => clearInterval(t);
  }, [to, duration]);
  return <>{val}</>;
}

function pct(c: number, g: number) { return Math.min(Math.round((c / g) * 100), 100); }

// ─── Shared chrome ────────────────────────────────────────────────────────────

function AppHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-2 flex-shrink-0">
      <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400">PowerFlow · Athlete</p>
      <h1 className="font-saira text-xl font-extrabold uppercase tracking-tight text-white mt-0.5">{title}</h1>
    </div>
  );
}

function OBDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center py-3 flex-shrink-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i <= step ? "w-4 h-1.5 bg-emerald-400" : "w-1.5 h-1.5 bg-white/15"}`} />
      ))}
    </div>
  );
}

function BottomNav({ active }: { active: "today" | "journal" | "chat" | "scripts" }) {
  const tabs = [
    { id: "today",   label: "Today",    icon: "◉" },
    { id: "journal", label: "Journal",  icon: "✦" },
    { id: "chat",    label: "Coach AI", icon: "✧" },
    { id: "scripts", label: "Scripts",  icon: "▶" },
  ] as const;
  return (
    <div className="border-t border-white/5 px-2 pb-4 pt-2 flex flex-shrink-0 bg-[#0A0A0A]">
      {tabs.map(t => (
        <div key={t.id} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl ${t.id === active ? "text-emerald-300" : "text-zinc-600"}`}>
          <span className="text-base leading-none">{t.icon}</span>
          <span className="font-saira text-[9px] uppercase tracking-wider font-semibold leading-none">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ONBOARDING SCREENS ───────────────────────────────────────────────────────

function S0_Welcome() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={0} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        <FadeIn delay={0}>
          <Image src="/fm_powerflow_logo_verziok_01_negative.png" alt="PowerFlow" width={52} height={52} className="mx-auto mb-5" />
        </FadeIn>
        <FadeIn delay={350}>
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-2">PowerFlow</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white leading-tight mb-4">
            Mental Performance<br />Infrastructure
          </h2>
          <p className="font-saira text-sm text-zinc-400 leading-relaxed">
            Built for strength athletes.<br />Used daily. Visible to coaches.
          </p>
        </FadeIn>
        <FadeIn delay={1100} className="mt-10">
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-5 py-3">
            <p className="font-saira text-[10px] text-zinc-500">Setting up your profile…</p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S1_Name() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={1} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn delay={0}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Step 1 of 6</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">What should<br />we call you?</h2>
        </FadeIn>
        <FadeIn delay={600} className="mt-7">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Full name</p>
            <p className="font-saira text-2xl font-bold text-white">
              <TypedText text="Alex Morrison" speed={60} />
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={2000} className="mt-4">
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-xs text-zinc-400 leading-relaxed">
              Your coach sees your name on their dashboard. Your data is visible only to you and the coach who invited you.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S2_Sport() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={2} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn delay={0}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Step 2 of 6</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">Your sport<br />&amp; weight class</h2>
        </FadeIn>
        <div className="mt-7 space-y-5">
          <FadeIn delay={400}>
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Federation</p>
            <div className="flex gap-2 flex-wrap">
              {["IPF", "USAPL", "WRPF", "RPS"].map(f => (
                <div key={f} className={`rounded-xl border px-4 py-2.5 font-saira text-sm font-bold uppercase transition ${f === "IPF" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/8 bg-white/[0.03] text-zinc-600"}`}>{f}</div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={900}>
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Weight class</p>
            <div className="flex gap-2 flex-wrap">
              {["66 kg", "74 kg", "83 kg", "93 kg"].map(w => (
                <div key={w} className={`rounded-xl border px-4 py-2.5 font-saira text-sm font-bold transition ${w === "83 kg" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/8 bg-white/[0.03] text-zinc-600"}`}>{w}</div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={1500}>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
              <span className="text-emerald-400">✓</span>
              <p className="font-saira text-xs text-zinc-300">IPF · 83 kg class · Alex Morrison</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S3_Lifts() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={3} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn delay={0}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Step 3 of 6</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">Current<br />best lifts</h2>
          <p className="font-saira text-[11px] text-zinc-500 mt-1">What are you moving in training right now?</p>
        </FadeIn>
        <div className="mt-7 space-y-3">
          {[
            { lift: "Squat",    val: ALEX.squat.c,    delay: 350  },
            { lift: "Bench",    val: ALEX.bench.c,    delay: 650  },
            { lift: "Deadlift", val: ALEX.deadlift.c, delay: 950  },
          ].map(({ lift, val, delay }) => (
            <FadeIn key={lift} delay={delay}>
              <div className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3.5 flex items-center justify-between">
                <p className="font-saira text-[11px] uppercase tracking-widest text-zinc-400">{lift}</p>
                <p className="font-saira text-2xl font-extrabold text-white tabular-nums">
                  <CountUp to={val} duration={900} /> <span className="text-zinc-600 text-xs font-normal">kg</span>
                </p>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={1800}>
            <p className="font-saira text-[10px] text-zinc-600 text-center pt-1">Current total: {ALEX.squat.c + ALEX.bench.c + ALEX.deadlift.c} kg</p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S4_Goals() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={4} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn delay={0}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Step 4 of 6</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">Competition<br />goals</h2>
          <p className="font-saira text-[11px] text-zinc-500 mt-1">What do you want to hit on the platform?</p>
        </FadeIn>
        <div className="mt-7 space-y-3">
          {[
            { lift: "Squat",    c: ALEX.squat.c,    g: ALEX.squat.g,    delay: 350  },
            { lift: "Bench",    c: ALEX.bench.c,    g: ALEX.bench.g,    delay: 650  },
            { lift: "Deadlift", c: ALEX.deadlift.c, g: ALEX.deadlift.g, delay: 950  },
          ].map(({ lift, c, g, delay }) => (
            <FadeIn key={lift} delay={delay}>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-saira text-[11px] uppercase tracking-widest text-zinc-400">{lift}</p>
                  <p className="font-saira text-lg font-extrabold text-white tabular-nums">
                    <CountUp to={g} duration={900} /> <span className="text-zinc-600 text-xs font-normal">kg</span>
                  </p>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${pct(c, g)}%` }} />
                </div>
                <p className="font-saira text-[9px] text-zinc-600 mt-1">{pct(c, g)}% of goal</p>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={1700}>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 flex justify-between items-center">
              <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">Goal total</p>
              <p className="font-saira text-sm font-bold text-emerald-300 tabular-nums">
                <CountUp to={ALEX.squat.g + ALEX.bench.g + ALEX.deadlift.g} duration={900} /> kg
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S5_Meet() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={5} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn delay={0}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Step 5 of 6</p>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">Your next<br />competition</h2>
        </FadeIn>
        <div className="mt-7 space-y-4">
          <FadeIn delay={450}>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-6 text-center">
              <p className="font-saira text-[10px] uppercase tracking-widest text-amber-400 mb-2">Days until meet</p>
              <p className="font-saira text-6xl font-extrabold text-white tabular-nums mb-2">
                <CountUp to={56} duration={1000} />
              </p>
              <p className="font-saira text-xs text-zinc-400">IPF · 83 kg class</p>
            </div>
          </FadeIn>
          <FadeIn delay={1400}>
            <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
              <p className="font-saira text-xs text-zinc-400 leading-relaxed">
                PowerFlow tracks your mental performance across the full prep cycle. Meet day is the finish line we&apos;re building toward.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S6_Done() {
  return (
    <div className="flex flex-col h-full">
      <OBDots step={6} />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
        <FadeIn delay={0}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-emerald-400 text-2xl font-bold">✓</span>
          </div>
        </FadeIn>
        <FadeIn delay={450}>
          <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-3">You&apos;re all set,<br />Alex.</h2>
          <p className="font-saira text-sm text-zinc-400 leading-relaxed max-w-[280px]">
            Your baseline is saved. Your coach can see your profile. Let&apos;s start your first training day.
          </p>
        </FadeIn>
        <FadeIn delay={1100} className="mt-8 w-full">
          <div className="space-y-2 text-left">
            {[
              "Profile — IPF · 83 kg · Alex Morrison",
              "Strength targets — 717.5 kg goal total",
              "Meet countdown — 56 days",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-2.5">
                <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
                <p className="font-saira text-xs text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── APP SCREENS ──────────────────────────────────────────────────────────────

function S7_GoodMorning() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Today" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn delay={0}>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 flex justify-between items-center">
            <div>
              <p className="font-saira text-[9px] uppercase tracking-widest text-amber-400 mb-0.5">Next meet</p>
              <p className="font-saira text-2xl font-extrabold text-white">56 days</p>
            </div>
            <p className="font-saira text-[10px] text-zinc-500">IPF · 83 kg</p>
          </div>
        </FadeIn>
        <FadeIn delay={500}>
          <p className="font-saira text-lg font-extrabold text-white">Good morning, Alex.</p>
          <p className="font-saira text-sm text-zinc-400 mt-0.5">How are you training today?</p>
        </FadeIn>
        <FadeIn delay={950}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center opacity-40">
              <p className="font-saira text-sm font-bold uppercase text-zinc-400 mt-1">Rest day</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
              <p className="font-saira text-sm font-bold uppercase text-emerald-300 mt-1">Training</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={1500}>
          <p className="font-saira text-[10px] text-zinc-600 text-center">Training selected — tap to confirm</p>
        </FadeIn>
      </div>
    </div>
  );
}

function S8_Training() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Today" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn delay={0}>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
            <span className="text-emerald-400">✓</span>
            <p className="font-saira text-sm font-bold text-emerald-300">Training day</p>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Session type</p>
          <div className="flex gap-2 flex-wrap">
            {["Squat", "Bench", "Deadlift", "Full body"].map(t => (
              <div key={t} className={`rounded-xl border px-4 py-2.5 font-saira text-xs font-bold uppercase ${t === "Squat" ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300" : "border-white/8 bg-white/[0.03] text-zinc-600"}`}>{t}</div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={850}>
          <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">How&apos;s your body today?</p>
          <div className="grid grid-cols-3 gap-2">
            {["Fresh", "Normal", "Tired"].map(f => (
              <div key={f} className={`rounded-xl border p-3 text-center font-saira text-xs font-bold uppercase ${f === "Normal" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/8 bg-white/[0.03] text-zinc-600"}`}>{f}</div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={1300}>
          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3">
            <p className="font-saira text-xs text-zinc-500">Squat · Normal · logged for today</p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S9_Checkin() {
  const metrics = [
    { l: "Mood",    v: 9, d: 400  },
    { l: "Quality", v: 9, d: 650  },
    { l: "Ready",   v: 9, d: 900  },
    { l: "Energy",  v: 8, d: 1150 },
    { l: "Sleep",   v: 8, d: 1400 },
  ];
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Today" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn delay={0}>
          <p className="font-saira text-sm font-bold text-white">Weekly check-in</p>
          <p className="font-saira text-xs text-zinc-400 mt-0.5">Rate your week · 1–10</p>
        </FadeIn>
        <div className="grid grid-cols-5 gap-2">
          {metrics.map(({ l, v, d }) => (
            <FadeIn key={l} delay={d}>
              <div className="text-center rounded-xl border border-white/8 bg-white/[0.04] py-3">
                <p className={`font-saira text-2xl font-extrabold ${v >= 8 ? "text-emerald-300" : "text-zinc-200"}`}>{v}</p>
                <p className="font-saira text-[8px] uppercase tracking-wide text-zinc-500 mt-0.5">{l}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={1900}>
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Biggest win this week?</p>
            <p className="font-saira text-sm text-zinc-200 leading-relaxed">
              <TypedText text={ALEX.checkin.win} speed={32} />
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S10_JournalEntry() {
  const journalText = "237.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to believe the goal total is within reach.";
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Today" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn delay={0}>
          <p className="font-saira text-sm font-bold text-white">Post-session reflection</p>
          <p className="font-saira text-xs text-zinc-400 mt-0.5">Optional — what&apos;s on your mind?</p>
        </FadeIn>
        <FadeIn delay={500}>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4 min-h-[120px]">
            <p className="font-saira text-sm text-zinc-200 leading-relaxed">
              <TypedText text={journalText} speed={22} />
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={700}>
          <div className="flex gap-2 items-center">
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mr-1">Mood:</p>
            {["Positive", "Neutral", "Negative"].map(s => (
              <div key={s} className={`rounded-full border px-3 py-1 font-saira text-[10px] font-bold uppercase ${s === "Positive" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/8 text-zinc-600"}`}>{s}</div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S11_TodayFull() {
  const c = ALEX.checkin;
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Today" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn delay={0}>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-2.5 flex items-center gap-2">
            <span className="text-emerald-400 text-sm">✓</span>
            <p className="font-saira text-xs font-bold text-emerald-300">Logged · Squat day · Check-in complete · Journal saved</p>
          </div>
        </FadeIn>
        <FadeIn delay={350}>
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-2.5">This week</p>
            <div className="grid grid-cols-5 gap-1">
              {[["Mood",c.mood],["Quality",c.quality],["Ready",c.readiness],["Energy",c.energy],["Sleep",c.sleep]].map(([l,v]) => (
                <div key={l as string} className="text-center">
                  <div className={`font-saira text-xl font-extrabold ${Number(v)>=8?"text-emerald-300":"text-zinc-200"}`}>{v}</div>
                  <div className="font-saira text-[8px] text-zinc-500 uppercase">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={700}>
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
            <p className="font-saira text-[9px] uppercase tracking-widest text-violet-400 mb-2.5">Affirmations</p>
            {ALEX.affirmations.map((a, i) => (
              <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                <span className="font-saira text-[10px] text-violet-400 font-bold flex-shrink-0 mt-0.5">{i+1}.</span>
                <p className="font-saira text-xs text-zinc-200">{a}</p>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={1100}>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex justify-between items-center">
            <div>
              <p className="font-saira text-[9px] uppercase tracking-widest text-amber-400 mb-0.5">Next meet</p>
              <p className="font-saira text-xl font-extrabold text-white">56 days</p>
            </div>
            <div className="text-right">
              <p className="font-saira text-[10px] text-zinc-500">IPF · 83 kg</p>
              <p className="font-saira text-[10px] text-zinc-600">S 220 · B 152.5 · D 272.5</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S12_JournalTab() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Journal" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {JOURNAL.map((e, i) => (
          <FadeIn key={i} delay={i * 280}>
            <div className={`rounded-2xl border p-4 ${e.type === "training" ? "border-sky-500/15 bg-sky-500/[0.04]" : "border-violet-500/15 bg-violet-500/[0.04]"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.sentiment === "positive" ? "bg-emerald-400" : e.sentiment === "negative" ? "bg-rose-400" : "bg-zinc-400"}`} />
                <span className={`rounded-full border px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider ${e.type === "training" ? "bg-sky-500/12 text-sky-300 border-sky-500/20" : "bg-violet-500/12 text-violet-300 border-violet-500/20"}`}>
                  {e.session ?? "Journal"}
                </span>
                <span className="font-saira text-[10px] text-zinc-500 ml-auto">{e.day}</span>
              </div>
              <p className="font-saira text-xs text-zinc-300 leading-relaxed line-clamp-2">{e.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

function S13_ChatQuestion() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Coach AI" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn delay={0}>
          <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-saira text-[10px] text-zinc-400">Coach AI · reads your journals, check-ins & training logs</p>
          </div>
        </FadeIn>
        <FadeIn delay={650}>
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-500/20 border border-emerald-500/20 px-4 py-3">
              <p className="font-saira text-xs text-zinc-200 leading-relaxed">
                <TypedText text={AI_Q} speed={30} />
              </p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={900}>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="font-saira text-[9px] uppercase tracking-wider text-violet-400 mb-1">Coach AI</p>
              <p className="font-saira text-xs text-zinc-500 leading-relaxed animate-pulse">Thinking…</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S14_ChatResponse() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Coach AI" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn delay={0}>
          <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="font-saira text-[10px] text-zinc-400">Coach AI · reads your journals, check-ins & training logs</p>
          </div>
        </FadeIn>
        <FadeIn delay={0}>
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-500/20 border border-emerald-500/20 px-4 py-3">
              <p className="font-saira text-xs text-zinc-200 leading-relaxed">{AI_Q}</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={350}>
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/8 px-4 py-3">
              <p className="font-saira text-[9px] uppercase tracking-wider text-violet-400 mb-1.5">Coach AI</p>
              <p className="font-saira text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
                <TypedText text={AI_A} speed={13} />
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S15_Scripts() {
  const scripts = [
    { t: "Pre-Squat Activation", d: "4 min", col: "violet", kw: ["strong","explosive","locked in"] },
    { t: "Bench Focus Reset",     d: "3 min", col: "sky",    kw: ["smooth","confident"] },
    { t: "Deadlift Intent",       d: "5 min", col: "emerald",kw: ["patient","explosive","strong"] },
    { t: "Competition Day",       d: "8 min", col: "amber",  kw: ["calm","ready","mine"] },
  ];
  const colors: Record<string, { border: string; bg: string; kw: string; btn: string }> = {
    violet:  { border: "border-violet-500/20",  bg: "bg-violet-500/[0.07]",  kw: "bg-violet-500/10 text-violet-300 border-violet-500/20",  btn: "bg-violet-500/20 text-violet-200 border-violet-500/25" },
    sky:     { border: "border-sky-500/20",     bg: "bg-sky-500/[0.07]",     kw: "bg-sky-500/10 text-sky-300 border-sky-500/20",           btn: "bg-sky-500/20 text-sky-200 border-sky-500/25" },
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.07]", kw: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",btn: "bg-emerald-500/20 text-emerald-200 border-emerald-500/25" },
    amber:   { border: "border-amber-500/20",   bg: "bg-amber-500/[0.07]",   kw: "bg-amber-500/10 text-amber-300 border-amber-500/20",     btn: "bg-amber-500/20 text-amber-200 border-amber-500/25" },
  };
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Scripts" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn delay={0}>
          <p className="font-saira text-[10px] text-zinc-500">Visualization scripts · personalized to your cue keywords</p>
        </FadeIn>
        {scripts.map((s, i) => {
          const c = colors[s.col];
          return (
            <FadeIn key={s.t} delay={220 + i * 220}>
              <div className={`rounded-2xl border ${c.border} ${c.bg} px-4 py-3.5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-saira text-sm font-bold text-white">{s.t}</p>
                    <p className="font-saira text-[10px] text-zinc-500 mt-0.5">{s.d}</p>
                  </div>
                  <div className={`rounded-xl border px-3 py-1.5 font-saira text-[10px] font-bold uppercase flex-shrink-0 ${c.btn}`}>▶ Play</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {s.kw.map(kw => <span key={kw} className={`rounded-full border px-2 py-0.5 font-saira text-[9px] ${c.kw}`}>{kw}</span>)}
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}

function S16_Playing() {
  const [secs, setSecs] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const prog = Math.min(secs / (4 * 60), 1) * 100;
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Scripts" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn delay={0}>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-saira text-[9px] uppercase tracking-widest text-violet-400 mb-0.5">Now playing</p>
                <p className="font-saira text-base font-extrabold text-white">Pre-Squat Activation</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="font-saira text-[10px] text-emerald-300 tabular-nums">{m}:{String(s).padStart(2,"0")}</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-violet-400 rounded-full transition-all duration-1000" style={{ width: `${prog}%` }} />
            </div>
            <div className="flex gap-2 justify-center">
              <div className="rounded-full bg-white/[0.07] border border-white/10 w-10 h-10 flex items-center justify-center text-zinc-500 text-sm">⏮</div>
              <div className="rounded-full bg-violet-500/30 border border-violet-500/30 w-12 h-12 flex items-center justify-center text-violet-200 text-lg">⏸</div>
              <div className="rounded-full bg-white/[0.07] border border-white/10 w-10 h-10 flex items-center justify-center text-zinc-500 text-sm">⏭</div>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={450}>
          <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Script · plays on lock screen in the live app</p>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed italic whitespace-pre-line">{SQUAT_SCRIPT}</p>
          </div>
        </FadeIn>
        <FadeIn delay={700}>
          <div className="flex flex-wrap gap-1">
            {["strong","explosive","locked in"].map(kw => (
              <span key={kw} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 font-saira text-[10px] text-violet-300">{kw}</span>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── Control bar ──────────────────────────────────────────────────────────────

function ControlBar({
  step, auto,
  onToggle, onRestart, onPrev, onNext,
}: {
  step: number; auto: boolean;
  onToggle: () => void; onRestart: () => void;
  onPrev: () => void;   onNext: () => void;
}) {
  const { phase, label } = STEPS[step];
  const progress = Math.round(((step + 1) / TOTAL) * 100);
  return (
    <div className="flex-shrink-0 border-b border-white/[0.07] bg-[#0A0A0A]">
      {/* Row 1: phase label + mode + restart */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <Link href="/demo" className="font-saira text-[9px] text-zinc-600 hover:text-zinc-400 transition shrink-0">← Demo</Link>
        <div className="flex-1 text-center truncate">
          <span className="font-saira text-[10px] font-bold uppercase tracking-widest text-emerald-400">{phase}</span>
          <span className="font-saira text-[10px] text-zinc-600 mx-1">·</span>
          <span className="font-saira text-[10px] text-zinc-500">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggle}
            className={`rounded-full border px-2.5 py-0.5 font-saira text-[9px] font-bold uppercase tracking-widest transition ${auto ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-white/[0.08] border-white/10 text-zinc-500"}`}
          >
            {auto ? "AUTO" : "MANUAL"}
          </button>
          <button onClick={onRestart} title="Restart demo" className="font-saira text-[17px] text-zinc-600 hover:text-zinc-300 transition leading-none px-0.5">↺</button>
        </div>
      </div>
      {/* Row 2: progress bar + step nav */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={step === 0}
          className={`font-saira text-base leading-none w-5 text-center transition ${!auto ? "text-zinc-400 hover:text-white disabled:opacity-25" : "text-transparent pointer-events-none"}`}
        >‹</button>
        <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <button
          onClick={onNext}
          disabled={step >= TOTAL - 1}
          className={`font-saira text-base leading-none w-5 text-center transition ${!auto ? "text-zinc-400 hover:text-white disabled:opacity-25" : "text-transparent pointer-events-none"}`}
        >›</button>
        <span className="font-saira text-[9px] text-zinc-600 w-7 text-right shrink-0 tabular-nums">{step+1}/{TOTAL}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoAthlete() {
  const [step, setStep] = React.useState(0);
  const [auto, setAuto] = React.useState(true);

  // Auto-advance
  React.useEffect(() => {
    if (!auto || step >= TOTAL - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), STEPS[step].duration);
    return () => clearTimeout(t);
  }, [step, auto]);

  function prev()     { setAuto(false); setStep(s => Math.max(0, s - 1)); }
  function next()     { setAuto(false); setStep(s => Math.min(TOTAL - 1, s + 1)); }
  function restart()  { setStep(0); setAuto(true); }
  function takeover() { setAuto(false); }

  const isApp = step >= APP_START;

  return (
    <div className="min-h-screen bg-[#060606] sm:flex sm:items-start sm:justify-center sm:py-10 font-saira">
      <div
        className="w-full sm:w-[390px] sm:rounded-[44px] sm:border-[7px] sm:border-zinc-800 sm:shadow-[0_32px_120px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] bg-[#0A0A0A] overflow-hidden relative flex flex-col"
        style={{ minHeight: "820px" }}
      >
        {/* Control bar */}
        <ControlBar
          step={step} auto={auto}
          onToggle={() => setAuto(a => !a)}
          onRestart={restart}
          onPrev={prev}
          onNext={next}
        />

        {/* Step content — key resets all animations */}
        <div
          key={step}
          className="flex flex-col flex-1 overflow-hidden"
          onClick={auto ? takeover : undefined}
        >
          <div className="flex-1 overflow-y-auto">
            {step === 0  && <S0_Welcome />}
            {step === 1  && <S1_Name />}
            {step === 2  && <S2_Sport />}
            {step === 3  && <S3_Lifts />}
            {step === 4  && <S4_Goals />}
            {step === 5  && <S5_Meet />}
            {step === 6  && <S6_Done />}
            {step === 7  && <S7_GoodMorning />}
            {step === 8  && <S8_Training />}
            {step === 9  && <S9_Checkin />}
            {step === 10 && <S10_JournalEntry />}
            {step === 11 && <S11_TodayFull />}
            {step === 12 && <S12_JournalTab />}
            {step === 13 && <S13_ChatQuestion />}
            {step === 14 && <S14_ChatResponse />}
            {step === 15 && <S15_Scripts />}
            {step === 16 && <S16_Playing />}
          </div>

          {/* App-phase bottom nav */}
          {isApp && <BottomNav active={activeTab(step)} />}
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry"
          className="inline-block rounded-xl bg-emerald-600/80 hover:bg-emerald-600 px-6 py-2.5 font-saira text-xs font-bold uppercase tracking-widest text-white transition">
          Get in touch →
        </a>
      </div>
    </div>
  );
}
