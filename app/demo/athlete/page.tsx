"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Theme ────────────────────────────────────────────────────────────────────

const DarkCtx = React.createContext(true);
const useD = () => React.useContext(DarkCtx);

function pal(d: boolean) {
  return {
    screen:   d ? "#060606" : "#EBEBEB",
    phone:    d ? "#0A0A0A" : "#FFFFFF",
    t1:       d ? "text-white"    : "text-gray-900",
    t2:       d ? "text-zinc-200" : "text-gray-700",
    t3:       d ? "text-zinc-400" : "text-gray-500",
    t4:       d ? "text-zinc-500" : "text-gray-400",
    c1:       d ? "bg-white/[0.05] border-white/10" : "bg-gray-50 border-gray-200",
    c2:       d ? "bg-white/[0.04] border-white/8"  : "bg-gray-50 border-gray-200",
    c3:       d ? "bg-white/[0.02] border-white/6"  : "bg-white border-gray-100",
    progress: d ? "bg-white/[0.10]" : "bg-gray-200",
    navBg:    d ? "#0A0A0A" : "#FFFFFF",
    navBorder:d ? "border-white/[0.08]" : "border-gray-200",
    barBg:    d ? "#0A0A0A" : "#F8F8F8",
    barBorder:d ? "border-white/[0.08]" : "border-gray-200",
    // violet
    vt:       d ? "text-violet-400"  : "text-violet-600",
    vtl:      d ? "text-violet-300"  : "text-violet-700",
    vbg:      d ? "bg-violet-500/[0.07] border-violet-500/25"  : "bg-violet-50 border-violet-200",
    vbg2:     d ? "bg-violet-500/[0.12] border-violet-500/35"  : "bg-violet-100 border-violet-300",
    vic:      d ? "bg-violet-500/15 text-violet-300"  : "bg-violet-100 text-violet-700",
    // amber
    at:       d ? "text-amber-400"  : "text-amber-700",
    abg:      d ? "bg-amber-500/[0.07] border-amber-500/25" : "bg-amber-50 border-amber-200",
    // rose
    rt:       d ? "text-rose-400"   : "text-rose-600",
    // sky (training entries)
    skl:      d ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : "bg-sky-50 text-sky-700 border-sky-200",
    // selections (picked option)
    selOn:    d ? "border-violet-500/40 bg-violet-500/[0.14] text-violet-200" : "border-violet-400 bg-violet-100 text-violet-700",
    selOff:   d ? "border-white/8 bg-white/[0.03] text-zinc-500" : "border-gray-200 bg-white text-gray-400",
  } as const;
}

// ─── Sequence ─────────────────────────────────────────────────────────────────

const STEPS = [
  { phase: "Onboarding", label: "Welcome",          duration: 4000  }, // 0
  { phase: "Onboarding", label: "Your name",        duration: 5200  }, // 1
  { phase: "Onboarding", label: "Sport & class",    duration: 4500  }, // 2
  { phase: "Onboarding", label: "Current lifts",    duration: 5000  }, // 3
  { phase: "Onboarding", label: "Goals",            duration: 5000  }, // 4
  { phase: "Onboarding", label: "Meet date",        duration: 4000  }, // 5
  { phase: "Onboarding", label: "All set!",         duration: 3500  }, // 6
  { phase: "Home",       label: "Good morning",     duration: 4000  }, // 7
  { phase: "Home",       label: "Log training day", duration: 3500  }, // 8
  { phase: "Home",       label: "Weekly check-in",  duration: 6000  }, // 9
  { phase: "Home",       label: "Journal entry",    duration: 7000  }, // 10
  { phase: "Home",       label: "Today overview",   duration: 5500  }, // 11
  { phase: "Home",       label: "Chat — question",  duration: 5500  }, // 12
  { phase: "Home",       label: "Chat — AI reply",  duration: 9000  }, // 13
  { phase: "Journal",    label: "Your history",     duration: 5000  }, // 14
  { phase: "Course",     label: "Your program",     duration: 5000  }, // 15
  { phase: "Tools",      label: "Script library",   duration: 5000  }, // 16
  { phase: "You",        label: "Your profile",     duration: 5000  }, // 17
  { phase: "Tools",      label: "Now playing",      duration: 86400000 }, // 18
] as const;

const TOTAL = STEPS.length;
const APP_START = 7;

const TAB_STEPS: Record<string, number> = {
  home: 7, journal: 14, course: 15, tools: 16, you: 17,
};

function getActiveTab(s: number): "home" | "journal" | "course" | "tools" | "you" {
  if (s <= 13) return "home";
  if (s === 14) return "journal";
  if (s === 15) return "course";
  if (s === 17) return "you";
  return "tools";
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const ALEX = {
  name: "Alex Morrison", federation: "IPF", wc: "83 kg", bw: 82.6, daysToMeet: 56,
  squat:    { c: 220,   g: 247.5 },
  bench:    { c: 152.5, g: 170   },
  deadlift: { c: 272.5, g: 300   },
  checkin:  { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 8,
              win: "237.5 squat. Visualization script working. Feeling ready." },
  affirmations: ["I am strong and prepared.", "I trust my training.", "The platform is where I belong."],
  mentalGoals:  ["Stay process-focused under pressure", "Manage competition anxiety", "Build consistent pre-set routines"],
  tier: "PR" as const,
};

type JEntry = { day: string; type: "journal" | "training"; sentiment: "positive" | "neutral" | "negative"; text: string; session?: string };
const JOURNAL: JEntry[] = [
  { day: "Today",     type: "journal",  sentiment: "neutral",  text: "Been fixating on opener numbers. Trying to remind myself — I pick the number, the number doesn't pick me." },
  { day: "Yesterday", type: "training", sentiment: "positive", text: "237.5 squat × 2. New training PR. Visualization script made a real difference today.", session: "Squat · Heavy" },
  { day: "Yesterday", type: "journal",  sentiment: "positive", text: "237.5 for 2. Never done that in training. The mental routine is working. Goal total is within reach." },
  { day: "4d ago",    type: "training", sentiment: "positive", text: "5 × 3 @ 245 deadlift. Lat spread cue clicked — bar path was perfect.", session: "Deadlift · Volume" },
  { day: "5d ago",    type: "journal",  sentiment: "positive", text: "Ran the deadlift visualization script twice this morning. The sequence is starting to feel automatic." },
  { day: "10d ago",   type: "journal",  sentiment: "negative", text: "Bad bench session mentally. Weight was fine but I was in my head the whole time. Need to work on process cues." },
];

const AI_Q = "I keep fixating on my opener weights. Can't stop thinking about the numbers.";
const AI_A = `I saw your journal this morning — "I pick the number, the number doesn't pick me." That's already the right frame.

What's happening is a control pattern. Your brain is managing uncertainty by rehearsing numbers. It's not weakness — it's misdirected focus.

When an opener thought comes up today, replace it with a process cue. For your squat: strong · explosive · locked in. Redirect, don't fight it.

Your 237.5 × 2 yesterday? That's the data that matters. The opener will feel easy.`;

const COURSE_WEEKS = [
  { n: 1,  title: "Me and Powerlifting",   done: true  },
  { n: 2,  title: "My Mental Strengths",   done: true  },
  { n: 3,  title: "Goal Setting",          done: false, current: true },
  { n: 4,  title: "Pressure & Arousal",    done: false },
  { n: 5,  title: "Building Confidence",   done: false },
  { n: 9,  title: "Visualization Basics",  done: false, anchor: true },
  { n: 10, title: "Mental Rehearsal",      done: false, anchor: true },
  { n: 15, title: "Meet Day",              done: false, anchor: true },
];

type ToolTier = "free" | "second" | "pr";
const TOOLS: { cat: string; tier: ToolTier; items: { name: string; dur: string }[] }[] = [
  { cat: "Relaxation",     tier: "free",   items: [{ name: "Progressive Muscle Relaxation", dur: "12 min" }, { name: "Autogenic Training", dur: "10 min" }] },
  { cat: "Visualizations", tier: "second", items: [{ name: "Squat Visualization", dur: "6 min" }, { name: "Bench Visualization", dur: "6 min" }, { name: "Deadlift Visualization", dur: "6 min" }] },
  { cat: "Activation",     tier: "second", items: [{ name: "Resource Activation", dur: "8 min" }] },
  { cat: "Affirmations",   tier: "second", items: [{ name: "Custom affirmations", dur: "daily" }] },
  { cat: "Focus",          tier: "pr",     items: [{ name: "Barrier Work", dur: "8 min" }] },
];

const SQUAT_SCRIPT = `Stand behind the bar.

Feel the floor — solid, steady. Take one breath and let your body settle.

Picture the bar across your back. Tight. Controlled. Walk out with authority.

Brace deep. Sit back and down. Explode through the floor.

Strong. Locked at the top. You belong here.`;

// ─── Animation helpers ────────────────────────────────────────────────────────

function TypedText({ text, speed = 22, className }: { text: string; speed?: number; className?: string }) {
  const [shown, setShown] = React.useState("");
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    setShown(""); setDone(false);
    let i = 0;
    const t = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) { clearInterval(t); setDone(true); } }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <span className={className}>{shown}{!done && <span className="opacity-50 animate-pulse">|</span>}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [vis, setVis] = React.useState(delay === 0);
  React.useEffect(() => {
    if (delay === 0) { setVis(true); return; }
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div className={`transition-all duration-500 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${className}`}>{children}</div>;
}

function CountUp({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    setVal(0); const n = 30; let i = 0;
    const t = setInterval(() => { i++; const e = 1 - Math.pow(1 - i / n, 3); setVal(Math.round(to * e * 2) / 2); if (i >= n) { clearInterval(t); setVal(to); } }, duration / n);
    return () => clearInterval(t);
  }, [to, duration]);
  return <>{val}</>;
}

function pct(c: number, g: number) { return Math.min(Math.round((c / g) * 100), 100); }

// ─── Chrome ───────────────────────────────────────────────────────────────────

function AppHeader({ title }: { title: string }) {
  const d = useD(); const p = pal(d);
  return (
    <div className="px-4 pt-4 pb-2 flex-shrink-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Image
          src="/fm_powerflow_logo_verziok_01_negative.png"
          alt="PowerFlow"
          width={14} height={14}
          className="h-3.5 w-3.5"
          style={d ? { opacity: 0.7 } : { opacity: 0.6, filter: "invert(1)" }}
        />
        <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.28em] ${p.vt}`}>PowerFlow · Athlete</p>
      </div>
      <h1 className={`font-saira text-xl font-extrabold uppercase tracking-tight ${p.t1} mt-0.5`}>{title}</h1>
    </div>
  );
}

function OBDots({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center py-3 flex-shrink-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i <= active ? "w-4 h-1.5 bg-violet-400" : "w-1.5 h-1.5 bg-white/15"}`} />
      ))}
    </div>
  );
}

function BottomNav({ active, onNav }: {
  active: "home" | "journal" | "course" | "tools" | "you";
  onNav: (tab: "home" | "journal" | "course" | "tools" | "you") => void;
}) {
  const d = useD(); const p = pal(d);
  const tabs = [
    { id: "home",    label: "Home",    icon: "◉" },
    { id: "journal", label: "Journal", icon: "✦" },
    { id: "course",  label: "Course",  icon: "◈" },
    { id: "tools",   label: "Tools",   icon: "▶" },
    { id: "you",     label: "You",     icon: "○" },
  ] as const;
  return (
    <div className={`border-t ${p.navBorder} px-1 pb-4 pt-2 flex flex-shrink-0`} style={{ background: p.navBg }}>
      {tabs.map(t => (
        <button key={t.id} type="button" onClick={() => onNav(t.id)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${t.id === active ? p.vtl : p.t4} hover:opacity-80`}>
          <span className="text-sm leading-none">{t.icon}</span>
          <span className="font-saira text-[9px] uppercase tracking-wider font-semibold leading-none">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: "free" | "second" | "pr" }) {
  const d = useD();
  const map: Record<ToolTier, [string, string]> = {
    free:   ["Opener", d ? "text-zinc-400 border-zinc-600/40 bg-zinc-600/10" : "text-gray-500 border-gray-300 bg-gray-100"],
    second: ["Second", d ? "text-violet-300 border-violet-500/30 bg-violet-500/10" : "text-violet-700 border-violet-300 bg-violet-50"],
    pr:     ["PR",     d ? "text-violet-200 border-violet-400/30 bg-violet-500/15" : "text-violet-800 border-violet-400 bg-violet-100"],
  };
  const [label, cls] = map[tier];
  return <span className={`rounded-full border px-1.5 py-0.5 font-saira text-[8px] font-bold uppercase ${cls}`}>{label}</span>;
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

function S0() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={0} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        <FadeIn>
          <Image
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow" width={52} height={52}
            className="mx-auto mb-5"
            style={d ? {} : { filter: "invert(1)", opacity: 0.8 }}
          />
        </FadeIn>
        <FadeIn delay={350}>
          <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.3em] ${p.vt} mb-2`}>PowerFlow</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} leading-tight mb-4`}>Mental Performance<br />Infrastructure</h2>
          <p className={`font-saira text-sm ${p.t3} leading-relaxed`}>Built for strength athletes.<br />Used daily. Visible to coaches.</p>
        </FadeIn>
        <FadeIn delay={1200} className="mt-10">
          <div className={`rounded-xl border ${p.c2} px-5 py-3`}>
            <p className={`font-saira text-[10px] ${p.t4}`}>Setting up your profile…</p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S1() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={1} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>Step 1 of 6</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-1`}>What should<br />we call you?</h2>
        </FadeIn>
        <FadeIn delay={700} className="mt-7">
          <div className={`rounded-2xl border ${p.vbg2} p-5`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Full name</p>
            <p className={`font-saira text-2xl font-bold ${p.t1}`}><TypedText text="Alex Morrison" speed={70} /></p>
          </div>
        </FadeIn>
        <FadeIn delay={2500} className="mt-4">
          <div className={`rounded-2xl border ${p.c3} p-4`}>
            <p className={`font-saira text-xs ${p.t3} leading-relaxed`}>Your coach sees your name on their dashboard. Your data is visible only to you and the coach who invited you.</p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S2() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={2} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>Step 2 of 6</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-1`}>Sport &amp; weight class</h2>
        </FadeIn>
        <div className="mt-7 space-y-5">
          <FadeIn delay={500}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Federation</p>
            <div className="flex gap-2 flex-wrap">
              {["IPF", "USAPL", "WRPF", "RPS"].map(f => (
                <div key={f} className={`rounded-xl border px-4 py-2.5 font-saira text-sm font-bold uppercase ${f === "IPF" ? p.selOn : p.selOff}`}>{f}</div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={1000}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Weight class</p>
            <div className="flex gap-2 flex-wrap">
              {["66 kg", "74 kg", "83 kg", "93 kg"].map(w => (
                <div key={w} className={`rounded-xl border px-4 py-2.5 font-saira text-sm font-bold ${w === "83 kg" ? p.selOn : p.selOff}`}>{w}</div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={1800}>
            <div className={`rounded-xl border ${p.vbg} px-4 py-3 flex items-center gap-3`}>
              <span className={p.vt}>✓</span>
              <p className={`font-saira text-xs ${p.t2}`}>IPF · 83 kg class · Alex Morrison</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S3() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={3} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>Step 3 of 6</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-1`}>Current best lifts</h2>
          <p className={`font-saira text-[11px] ${p.t3} mt-1`}>What are you moving in training right now?</p>
        </FadeIn>
        <div className="mt-7 space-y-3">
          {[{ lift: "Squat", val: ALEX.squat.c, delay: 400 }, { lift: "Bench", val: ALEX.bench.c, delay: 700 }, { lift: "Deadlift", val: ALEX.deadlift.c, delay: 1000 }].map(({ lift, val, delay }) => (
            <FadeIn key={lift} delay={delay}>
              <div className={`rounded-xl border ${p.c1} px-4 py-3.5 flex items-center justify-between`}>
                <p className={`font-saira text-[11px] uppercase tracking-widest ${p.t3}`}>{lift}</p>
                <p className={`font-saira text-2xl font-extrabold ${p.t1} tabular-nums`}>
                  <CountUp to={val} duration={900} /> <span className={`${p.t4} text-xs font-normal`}>kg</span>
                </p>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={2000}>
            <p className={`font-saira text-[10px] ${p.t4} text-center pt-1`}>Current total: {ALEX.squat.c + ALEX.bench.c + ALEX.deadlift.c} kg</p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S4() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={4} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>Step 4 of 6</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-1`}>Competition goals</h2>
          <p className={`font-saira text-[11px] ${p.t3} mt-1`}>What do you want to hit on the platform?</p>
        </FadeIn>
        <div className="mt-7 space-y-3">
          {[{ lift: "Squat", c: ALEX.squat.c, g: ALEX.squat.g, delay: 400 }, { lift: "Bench", c: ALEX.bench.c, g: ALEX.bench.g, delay: 700 }, { lift: "Deadlift", c: ALEX.deadlift.c, g: ALEX.deadlift.g, delay: 1000 }].map(({ lift, c, g, delay }) => (
            <FadeIn key={lift} delay={delay}>
              <div className={`rounded-xl border ${p.vbg} px-4 py-3`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-saira text-[11px] uppercase tracking-widest ${p.t3}`}>{lift}</p>
                  <p className={`font-saira text-lg font-extrabold ${p.t1} tabular-nums`}>
                    <CountUp to={g} duration={900} /> <span className={`${p.t4} text-xs font-normal`}>kg</span>
                  </p>
                </div>
                <div className={`h-1.5 ${p.progress} rounded-full overflow-hidden`}>
                  <div className="h-full bg-violet-400 rounded-full transition-all duration-1000" style={{ width: `${pct(c, g)}%` }} />
                </div>
                <p className={`font-saira text-[9px] ${p.t4} mt-1`}>{pct(c, g)}% of goal</p>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={1900}>
            <div className={`rounded-xl border ${p.vbg} px-4 py-2.5 flex justify-between items-center`}>
              <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4}`}>Goal total</p>
              <p className={`font-saira text-sm font-bold ${p.vt} tabular-nums`}>
                <CountUp to={ALEX.squat.g + ALEX.bench.g + ALEX.deadlift.g} duration={900} /> kg
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S5() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={5} />
      <div className="flex-1 flex flex-col px-5 pt-6">
        <FadeIn>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>Step 5 of 6</p>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-1`}>Your next competition</h2>
        </FadeIn>
        <div className="mt-7 space-y-4">
          <FadeIn delay={500}>
            <div className={`rounded-2xl border ${p.abg} p-6 text-center`}>
              <p className={`font-saira text-[10px] uppercase tracking-widest ${p.at} mb-2`}>Days until meet</p>
              <p className={`font-saira text-6xl font-extrabold ${p.t1} tabular-nums mb-2`}><CountUp to={56} duration={1000} /></p>
              <p className={`font-saira text-xs ${p.t3}`}>IPF · 83 kg class</p>
            </div>
          </FadeIn>
          <FadeIn delay={1600}>
            <div className={`rounded-2xl border ${p.c3} p-4`}>
              <p className={`font-saira text-xs ${p.t3} leading-relaxed`}>PowerFlow tracks your mental performance across the full prep cycle. Meet day is the finish line we&apos;re building toward.</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function S6() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <OBDots active={6} />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
        <FadeIn>
          <div className={`w-16 h-16 rounded-full ${p.vbg2} flex items-center justify-center mx-auto mb-5`}>
            <span className={`${p.vt} text-2xl font-bold`}>✓</span>
          </div>
        </FadeIn>
        <FadeIn delay={450}>
          <h2 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mb-3`}>You&apos;re all set, Alex.</h2>
          <p className={`font-saira text-sm ${p.t3} leading-relaxed max-w-[280px]`}>Your baseline is saved. Your coach can see your profile. Let&apos;s start your first training day.</p>
        </FadeIn>
        <FadeIn delay={1100} className="mt-8 w-full">
          <div className="space-y-2 text-left">
            {["Profile — IPF · 83 kg · Alex Morrison", "Strength targets — 717.5 kg goal total", "Meet countdown — 56 days", "Mental goals set — 3 objectives"].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border ${p.vbg} px-4 py-2.5`}>
                <span className={`${p.vt} text-xs flex-shrink-0`}>✓</span>
                <p className={`font-saira text-xs ${p.t2}`}>{item}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function S7() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn>
          <div className={`rounded-2xl border ${p.abg} p-4 flex justify-between items-center`}>
            <div>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.at} mb-0.5`}>Next meet</p>
              <p className={`font-saira text-2xl font-extrabold ${p.t1}`}>56 days</p>
            </div>
            <p className={`font-saira text-[10px] ${p.t4}`}>IPF · 83 kg</p>
          </div>
        </FadeIn>
        <FadeIn delay={600}>
          <p className={`font-saira text-lg font-extrabold ${p.t1}`}>Good morning, Alex.</p>
          <p className={`font-saira text-sm ${p.t3} mt-0.5`}>How are you training today?</p>
        </FadeIn>
        <FadeIn delay={1100}>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border ${p.c2} p-5 text-center opacity-40`}>
              <p className={`font-saira text-sm font-bold uppercase ${p.t3} mt-1`}>Rest day</p>
            </div>
            <div className={`rounded-2xl border ${p.vbg2} p-5 text-center`}>
              <p className={`font-saira text-sm font-bold uppercase ${p.vtl}`}>Training</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S8() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn>
          <div className={`rounded-xl border ${p.vbg2} px-4 py-3 flex items-center gap-3`}>
            <span className={p.vt}>✓</span>
            <p className={`font-saira text-sm font-bold ${p.vtl}`}>Training day</p>
          </div>
        </FadeIn>
        <FadeIn delay={500}>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Session type</p>
          <div className="flex gap-2 flex-wrap">
            {["Squat", "Bench", "Deadlift", "Full body"].map(t => (
              <div key={t} className={`rounded-xl border px-4 py-2.5 font-saira text-xs font-bold uppercase ${t === "Squat" ? p.selOn : p.selOff}`}>{t}</div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={1000}>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>How&apos;s your body today?</p>
          <div className="grid grid-cols-3 gap-2">
            {["Fresh", "Normal", "Tired"].map(f => (
              <div key={f} className={`rounded-xl border p-3 text-center font-saira text-xs font-bold uppercase ${f === "Normal" ? p.selOn : p.selOff}`}>{f}</div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S9() {
  const d = useD(); const p = pal(d);
  const m = [{ l: "Mood", v: 9, delay: 500 }, { l: "Quality", v: 9, delay: 800 }, { l: "Readiness", v: 9, delay: 1100 }, { l: "Energy", v: 8, delay: 1400 }, { l: "Sleep", v: 8, delay: 1700 }];
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn>
          <p className={`font-saira text-sm font-bold ${p.t1}`}>Weekly check-in</p>
          <p className={`font-saira text-xs ${p.t3} mt-0.5`}>Rate your week · 1–10</p>
        </FadeIn>
        <div className="grid grid-cols-5 gap-2">
          {m.map(({ l, v, delay }) => (
            <FadeIn key={l} delay={delay}>
              <div className={`text-center rounded-xl border ${p.c1} py-3`}>
                <p className={`font-saira text-2xl font-extrabold ${v >= 8 ? p.vtl : p.t2}`}>{v}</p>
                <p className={`font-saira text-[8px] uppercase tracking-wide ${p.t4} mt-0.5`}>{l}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={2300}>
          <div className={`rounded-2xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Biggest win this week?</p>
            <p className={`font-saira text-sm ${p.t2} leading-relaxed`}><TypedText text={ALEX.checkin.win} speed={32} /></p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S10() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn>
          <p className={`font-saira text-sm font-bold ${p.t1}`}>Post-session reflection</p>
          <p className={`font-saira text-xs ${p.t3} mt-0.5`}>Optional — what&apos;s on your mind?</p>
        </FadeIn>
        <FadeIn delay={600}>
          <div className={`rounded-2xl border ${p.vbg} p-4 min-h-[120px]`}>
            <p className={`font-saira text-sm ${p.t2} leading-relaxed`}>
              <TypedText text="237.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to believe the goal total is within reach." speed={22} />
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={800}>
          <div className="flex gap-2 items-center">
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mr-1`}>Mood:</p>
            {["Positive", "Neutral", "Negative"].map(s => (
              <div key={s} className={`rounded-full border px-3 py-1 font-saira text-[10px] font-bold uppercase ${s === "Positive" ? p.selOn : p.selOff}`}>{s}</div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S11() {
  const d = useD(); const p = pal(d);
  const c = ALEX.checkin;
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn>
          <div className={`rounded-xl border ${p.vbg2} px-4 py-2.5 flex items-center gap-2`}>
            <span className={`${p.vt} text-sm`}>✓</span>
            <p className={`font-saira text-xs font-bold ${p.vtl}`}>Logged · Squat day · Check-in complete · Journal saved</p>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className={`rounded-2xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2.5`}>This week</p>
            <div className="grid grid-cols-5 gap-1">
              {[["Mood",c.mood],["Quality",c.quality],["Ready",c.readiness],["Energy",c.energy],["Sleep",c.sleep]].map(([l,v]) => (
                <div key={l as string} className="text-center">
                  <div className={`font-saira text-xl font-extrabold ${Number(v)>=8 ? p.vtl : p.t2}`}>{v}</div>
                  <div className={`font-saira text-[8px] ${p.t4} uppercase`}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={800}>
          <div className={`rounded-2xl border ${p.vbg} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.vt} mb-2.5`}>Affirmations</p>
            {ALEX.affirmations.map((a, i) => (
              <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                <span className={`font-saira text-[10px] ${p.vt} font-bold flex-shrink-0 mt-0.5`}>{i+1}.</span>
                <p className={`font-saira text-xs ${p.t2}`}>{a}</p>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={1200}>
          <div className={`rounded-2xl border ${p.abg} p-4 flex justify-between items-center`}>
            <div>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.at} mb-0.5`}>Next meet</p>
              <p className={`font-saira text-xl font-extrabold ${p.t1}`}>56 days</p>
            </div>
            <p className={`font-saira text-[10px] ${p.t4} text-right`}>IPF · 83 kg<br /><span className={p.t4}>S 220 · B 152.5 · D 272.5</span></p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S12() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn>
          <div className={`flex items-center gap-2 rounded-xl border ${p.c2} px-3 py-2`}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <p className={`font-saira text-[10px] ${p.t3}`}>AI Coach · knows your journals, check-ins & training logs</p>
          </div>
        </FadeIn>
        <FadeIn delay={700}>
          <div className="flex justify-end">
            <div className={`max-w-[85%] rounded-2xl rounded-tr-sm ${p.vbg2} px-4 py-3`}>
              <p className={`font-saira text-xs ${p.t2} leading-relaxed`}><TypedText text={AI_Q} speed={32} /></p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={1000}>
          <div className="flex justify-start">
            <div className={`max-w-[85%] rounded-2xl rounded-tl-sm border ${p.c1} px-4 py-3`}>
              <p className={`font-saira text-[9px] uppercase tracking-wider ${p.vt} mb-1`}>AI Coach</p>
              <p className={`font-saira text-xs ${p.t3} animate-pulse`}>Thinking…</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

function S13() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Home" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn>
          <div className={`flex items-center gap-2 rounded-xl border ${p.c2} px-3 py-2`}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <p className={`font-saira text-[10px] ${p.t3}`}>AI Coach · knows your journals, check-ins & training logs</p>
          </div>
        </FadeIn>
        <FadeIn>
          <div className="flex justify-end">
            <div className={`max-w-[85%] rounded-2xl rounded-tr-sm ${p.vbg2} px-4 py-3`}>
              <p className={`font-saira text-xs ${p.t2} leading-relaxed`}>{AI_Q}</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className="flex justify-start">
            <div className={`max-w-[90%] rounded-2xl rounded-tl-sm border ${p.c1} px-4 py-3`}>
              <p className={`font-saira text-[9px] uppercase tracking-wider ${p.vt} mb-1.5`}>AI Coach</p>
              <p className={`font-saira text-xs ${p.t2} leading-relaxed whitespace-pre-line`}><TypedText text={AI_A} speed={12} /></p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── JOURNAL ──────────────────────────────────────────────────────────────────

function S14() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Journal" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {JOURNAL.map((e, i) => (
          <FadeIn key={i} delay={i * 300}>
            <div className={`rounded-2xl border p-4 ${e.type === "training" ? p.skl.replace(/text-\S+\s?/g,"").trim() + " " + (d ? "border-sky-500/15 bg-sky-500/[0.04]" : "border-sky-200 bg-sky-50") : p.vbg}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.sentiment === "positive" ? "bg-violet-400" : e.sentiment === "negative" ? "bg-rose-400" : "bg-zinc-400"}`} />
                <span className={`rounded-full border px-2 py-0.5 font-saira text-[9px] uppercase ${e.type === "training" ? p.skl : (d ? "bg-violet-500/12 text-violet-300 border-violet-500/20" : "bg-violet-50 text-violet-700 border-violet-200")}`}>{e.session ?? "Journal"}</span>
                <span className={`font-saira text-[10px] ${p.t4} ml-auto`}>{e.day}</span>
              </div>
              <p className={`font-saira text-xs ${p.t2} leading-relaxed line-clamp-2`}>{e.text}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

// ─── COURSE ───────────────────────────────────────────────────────────────────

function S15() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Course" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn>
          <div className={`rounded-2xl border ${p.c2} p-4 flex items-start justify-between`}>
            <div>
              <p className={`font-saira text-sm font-bold ${p.t1}`}>16-Week Mental Performance Program</p>
              <p className={`font-saira text-[10px] ${p.t4} mt-0.5`}>Week 3 of 16 · 2 weeks completed</p>
            </div>
            <span className={`rounded-full border ${p.vbg2} px-2.5 py-1 font-saira text-[9px] font-bold uppercase ${p.vtl} flex-shrink-0 ml-2`}>PR tier</span>
          </div>
        </FadeIn>
        <FadeIn delay={300}>
          <div className={`h-1.5 ${p.progress} rounded-full overflow-hidden`}>
            <div className="h-full bg-violet-400 rounded-full" style={{ width: "13%" }} />
          </div>
          <p className={`font-saira text-[9px] ${p.t4} mt-1`}>13% complete</p>
        </FadeIn>
        <FadeIn delay={500}>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2`}>Your program</p>
          <div className="space-y-2">
            {COURSE_WEEKS.map((w, i) => (
              <FadeIn key={w.n} delay={500 + i * 200}>
                <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${w.current ? p.vbg2 : w.done ? (d ? "border-white/5 bg-white/[0.02] opacity-70" : "border-gray-100 bg-white opacity-70") : (d ? "border-white/5 bg-white/[0.02]" : "border-gray-100 bg-white")}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-saira text-[9px] font-bold ${w.done ? p.vic : w.current ? p.vic : (d ? "bg-white/5 text-zinc-500" : "bg-gray-100 text-gray-400")}`}>
                    {w.done ? "✓" : w.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-saira text-xs font-semibold ${w.current ? p.t1 : w.done ? p.t4 : p.t2}`}>{w.title}</p>
                    {w.anchor && !w.done && <p className={`font-saira text-[9px] ${p.at} mt-0.5`}>Anchor week</p>}
                  </div>
                  {w.current && <span className={`font-saira text-[9px] ${p.vt} font-bold uppercase flex-shrink-0`}>Current →</span>}
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── TOOLS ────────────────────────────────────────────────────────────────────

function S16() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Tools" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn><p className={`font-saira text-[10px] ${p.t4}`}>Guided audio · personalized keywords · available in 3 languages</p></FadeIn>
        {TOOLS.map((cat, ci) => (
          <FadeIn key={cat.cat} delay={ci * 300}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4}`}>{cat.cat}</p>
                <TierBadge tier={cat.tier} />
              </div>
              <div className="space-y-2">
                {cat.items.map((item, ii) => (
                  <FadeIn key={item.name} delay={ci * 300 + ii * 150}>
                    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${cat.tier === "pr" || cat.tier === "second" ? p.vbg : p.c2}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${cat.tier !== "free" ? p.vic : (d ? "bg-white/8 text-zinc-400" : "bg-gray-100 text-gray-500")}`}>▶</div>
                        <div>
                          <p className={`font-saira text-xs font-semibold ${p.t2}`}>{item.name}</p>
                          <p className={`font-saira text-[9px] ${p.t4}`}>{item.dur}</p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

// ─── YOU ─────────────────────────────────────────────────────────────────────

function S17() {
  const d = useD(); const p = pal(d);
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="You" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <FadeIn>
          <div className={`flex items-center gap-4 rounded-2xl border ${p.c2} p-4`}>
            <div className={`w-12 h-12 rounded-full ${p.vic} border ${d ? "border-violet-500/25" : "border-violet-200"} flex items-center justify-center font-saira text-sm font-bold flex-shrink-0`}>AM</div>
            <div>
              <p className={`font-saira text-base font-bold ${p.t1}`}>Alex Morrison</p>
              <p className={`font-saira text-xs ${p.t3}`}>Athlete · <span className={p.vt}>PR tier</span></p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={350}>
          <div className={`rounded-2xl border ${p.abg} p-4 flex justify-between`}>
            <div>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.at} mb-0.5`}>Next competition</p>
              <p className={`font-saira text-lg font-extrabold ${p.t1}`}>56 days</p>
              <p className={`font-saira text-[10px] ${p.t4}`}>IPF · 83 kg class</p>
            </div>
            <div className="text-right">
              <p className={`font-saira text-[9px] ${p.t4} mb-1`}>Bodyweight</p>
              <p className={`font-saira text-lg font-bold ${p.t2}`}>82.6 kg</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={650}>
          <div className={`rounded-2xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-3`}>Strength goals</p>
            <div className="space-y-2.5">
              {[{ l: "Squat", c: ALEX.squat.c, g: ALEX.squat.g }, { l: "Bench", c: ALEX.bench.c, g: ALEX.bench.g }, { l: "Deadlift", c: ALEX.deadlift.c, g: ALEX.deadlift.g }].map(({ l, c, g }) => (
                <div key={l}>
                  <div className="flex justify-between mb-1">
                    <span className={`font-saira text-[10px] uppercase ${p.t3}`}>{l}</span>
                    <span className={`font-saira text-[10px] ${p.t3} tabular-nums`}>{c} <span className={p.t4}>/ {g} kg</span></span>
                  </div>
                  <div className={`h-1.5 ${p.progress} rounded-full overflow-hidden`}>
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct(c, g)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={950}>
          <div className={`rounded-2xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-2.5`}>Mental goals</p>
            {ALEX.mentalGoals.map((g, i) => (
              <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                <span className={`${p.vt} text-xs flex-shrink-0 mt-0.5`}>·</span>
                <p className={`font-saira text-xs ${p.t2}`}>{g}</p>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={1200}>
          <div className={`rounded-2xl border ${p.vbg} p-4 flex justify-between items-center`}>
            <div>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-0.5`}>Coach</p>
              <p className={`font-saira text-xs font-semibold ${p.vt}`}>Connected · Demo Coach</p>
            </div>
            <span className={`font-saira text-[9px] ${p.t4} border ${d ? "border-white/8" : "border-gray-200"} rounded-full px-3 py-1`}>Change</span>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── NOW PLAYING ─────────────────────────────────────────────────────────────

function S18() {
  const d = useD(); const p = pal(d);
  const [secs, setSecs] = React.useState(0);
  React.useEffect(() => { const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  const prog = Math.min(secs / 240, 1) * 100;
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Tools" />
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <FadeIn>
          <div className={`rounded-2xl border ${p.vbg} p-5`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`font-saira text-[9px] uppercase tracking-widest ${p.vt} mb-0.5`}>Now playing</p>
                <p className={`font-saira text-base font-extrabold ${p.t1}`}>Squat Visualization</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <p className={`font-saira text-[10px] ${p.vtl} tabular-nums`}>{m}:{String(s).padStart(2,"0")}</p>
              </div>
            </div>
            <div className={`h-1.5 ${p.progress} rounded-full overflow-hidden mb-4`}>
              <div className="h-full bg-violet-400 rounded-full transition-all duration-1000" style={{ width: `${prog}%` }} />
            </div>
            <div className="flex gap-2 justify-center">
              <div className={`rounded-full ${d ? "bg-white/[0.07] border-white/10" : "bg-gray-100 border-gray-200"} border w-10 h-10 flex items-center justify-center ${p.t4} text-sm`}>⏮</div>
              <div className={`rounded-full ${p.vbg2} w-12 h-12 flex items-center justify-center ${p.vtl} text-lg`}>⏸</div>
              <div className={`rounded-full ${d ? "bg-white/[0.07] border-white/10" : "bg-gray-100 border-gray-200"} border w-10 h-10 flex items-center justify-center ${p.t4} text-sm`}>⏭</div>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={400}>
          <div className={`rounded-2xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-3`}>Script · plays on lock screen</p>
            <p className={`font-saira text-xs ${p.t2} leading-relaxed italic whitespace-pre-line`}>{SQUAT_SCRIPT}</p>
          </div>
        </FadeIn>
        <FadeIn delay={700}>
          <div className="flex flex-wrap gap-1">
            {["strong","explosive","locked in"].map(kw => (
              <span key={kw} className={`rounded-full border ${p.vbg} px-2.5 py-1 font-saira text-[10px] ${p.vtl}`}>{kw}</span>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── Control bar ──────────────────────────────────────────────────────────────

function ControlBar({ step, auto, isDark, onToggle, onRestart, onPrev, onNext, onThemeToggle }: {
  step: number; auto: boolean; isDark: boolean;
  onToggle: () => void; onRestart: () => void; onPrev: () => void; onNext: () => void;
  onThemeToggle: () => void;
}) {
  const { phase, label } = STEPS[step];
  const progress = Math.round(((step + 1) / TOTAL) * 100);
  const d = isDark;
  return (
    <div className={`flex-shrink-0 border-b ${d ? "border-white/[0.08] bg-[#0A0A0A]" : "border-gray-200 bg-gray-50"}`}>
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        {/* Logo + back */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/demo" className={`font-saira text-[9px] ${d ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-700"} transition`}>← Demo</Link>
        </div>

        {/* Phase label */}
        <div className="flex-1 text-center truncate">
          <span className={`font-saira text-[10px] font-bold uppercase tracking-widest ${d ? "text-violet-400" : "text-violet-600"}`}>{phase}</span>
          <span className={`font-saira text-[10px] ${d ? "text-zinc-600" : "text-gray-400"} mx-1`}>·</span>
          <span className={`font-saira text-[10px] ${d ? "text-zinc-400" : "text-gray-500"}`}>{label}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onThemeToggle}
            title={d ? "Switch to light mode" : "Switch to dark mode"}
            className={`text-sm leading-none px-1 transition ${d ? "text-zinc-500 hover:text-zinc-200" : "text-gray-400 hover:text-gray-700"}`}
          >
            {d ? "☀️" : "🌙"}
          </button>
          <button
            onClick={onToggle}
            className={`rounded-lg border px-3 py-1 font-saira text-[10px] font-bold uppercase tracking-wider transition ${auto
              ? (d ? "bg-violet-500/20 border-violet-500/35 text-violet-300 hover:bg-violet-500/30" : "bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200")
              : (d ? "bg-white/8 border-white/12 text-zinc-300 hover:bg-white/12" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100")}`}
          >
            {auto ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={onRestart} title="Restart" className={`text-[17px] ${d ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-700"} transition leading-none px-0.5`}>↺</button>
        </div>
      </div>
      <div className="px-3 pb-2 flex items-center gap-2">
        <button onClick={onPrev} disabled={step === 0} className={`text-base leading-none w-5 text-center transition ${!auto ? (d ? "text-zinc-400 hover:text-white disabled:opacity-25" : "text-gray-400 hover:text-gray-800 disabled:opacity-25") : "text-transparent pointer-events-none"}`}>‹</button>
        <div className={`flex-1 h-1 ${d ? "bg-white/[0.08]" : "bg-gray-200"} rounded-full overflow-hidden`}>
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={onNext} disabled={step >= TOTAL - 1} className={`text-base leading-none w-5 text-center transition ${!auto ? (d ? "text-zinc-400 hover:text-white disabled:opacity-25" : "text-gray-400 hover:text-gray-800 disabled:opacity-25") : "text-transparent pointer-events-none"}`}>›</button>
        <span className={`font-saira text-[9px] ${d ? "text-zinc-500" : "text-gray-400"} w-7 text-right shrink-0 tabular-nums`}>{step+1}/{TOTAL}</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoAthlete() {
  const [step, setStep]     = React.useState(0);
  const [auto, setAuto]     = React.useState(true);
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    if (!auto || step >= TOTAL - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), STEPS[step].duration);
    return () => clearTimeout(t);
  }, [step, auto]);

  function prev()    { setAuto(false); setStep(s => Math.max(0, s - 1)); }
  function next()    { setAuto(false); setStep(s => Math.min(TOTAL - 1, s + 1)); }
  function restart() { setStep(0); setAuto(true); }
  function handleNav(tab: "home" | "journal" | "course" | "tools" | "you") {
    setAuto(false);
    setStep(TAB_STEPS[tab]);
  }

  const isApp = step >= APP_START;
  const p = pal(isDark);

  return (
    <DarkCtx.Provider value={isDark}>
      <div className="min-h-screen sm:flex sm:items-start sm:justify-center sm:py-10 font-saira" style={{ background: p.screen }}>
        <div
          className="w-full sm:w-[390px] sm:rounded-[44px] sm:border-[7px] sm:border-zinc-800 sm:shadow-[0_32px_120px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden relative flex flex-col"
          style={{ minHeight: "820px", background: p.phone }}
        >
          <ControlBar
            step={step} auto={auto} isDark={isDark}
            onToggle={() => setAuto(a => !a)} onRestart={restart}
            onPrev={prev} onNext={next} onThemeToggle={() => setIsDark(d => !d)}
          />
          <div key={step} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {step === 0  && <S0 />}
              {step === 1  && <S1 />}
              {step === 2  && <S2 />}
              {step === 3  && <S3 />}
              {step === 4  && <S4 />}
              {step === 5  && <S5 />}
              {step === 6  && <S6 />}
              {step === 7  && <S7 />}
              {step === 8  && <S8 />}
              {step === 9  && <S9 />}
              {step === 10 && <S10 />}
              {step === 11 && <S11 />}
              {step === 12 && <S12 />}
              {step === 13 && <S13 />}
              {step === 14 && <S14 />}
              {step === 15 && <S15 />}
              {step === 16 && <S16 />}
              {step === 17 && <S17 />}
              {step === 18 && <S18 />}
            </div>
            {isApp && <BottomNav active={getActiveTab(step)} onNav={handleNav} />}
          </div>
        </div>
        <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className="inline-block rounded-xl bg-violet-600/80 hover:bg-violet-600 px-6 py-2.5 font-saira text-xs font-bold uppercase tracking-widest text-white transition">Get in touch →</a>
        </div>
      </div>
    </DarkCtx.Provider>
  );
}
