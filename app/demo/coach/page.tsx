"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import BottomSheet from "@/app/components/BottomSheet";

// ─── Theme ────────────────────────────────────────────────────────────────────

const DarkCtx = React.createContext(true);
const useD = () => React.useContext(DarkCtx);

function pal(d: boolean) {
  return {
    screen:    d ? "#060606"  : "#EBEBEB",
    phone:     d ? "#0A0A0A"  : "#FFFFFF",
    t1:        d ? "text-white"    : "text-gray-900",
    t2:        d ? "text-zinc-200" : "text-gray-700",
    t3:        d ? "text-zinc-400" : "text-gray-500",
    t4:        d ? "text-zinc-500" : "text-gray-400",
    c1:        d ? "bg-white/[0.05] border-white/10" : "bg-gray-50 border-gray-200",
    c2:        d ? "bg-white/[0.03] border-white/8"  : "bg-gray-50 border-gray-200",
    c3:        d ? "bg-white/[0.02] border-white/6"  : "bg-white border-gray-100",
    sidebar:   d ? "border-white/[0.06] bg-[#0A0A0A]" : "border-gray-200 bg-white",
    progress:  d ? "bg-white/[0.08]" : "bg-gray-200",
    tabOn:     d ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm",
    tabOff:    d ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600",
    navOn:     d ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700",
    navOff:    d ? "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    // violet
    vt:        d ? "text-violet-400" : "text-violet-600",
    vtl:       d ? "text-violet-300" : "text-violet-700",
    vbg:       d ? "bg-violet-500/[0.07] border-violet-500/20"  : "bg-violet-50 border-violet-200",
    vbg2:      d ? "bg-violet-500/[0.12] border-violet-500/30"  : "bg-violet-100 border-violet-300",
    vic:       d ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-700",
    // amber (attention / meet proximity)
    at:        d ? "text-amber-300" : "text-amber-700",
    abg:       d ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200",
    // rose
    rt:        d ? "text-rose-300" : "text-rose-700",
    rbg:       d ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200",
    // sky (training entries)
    skt:       d ? "text-sky-300" : "text-sky-700",
    skb:       d ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : "bg-sky-50 text-sky-700 border-sky-200",
    // input
    input:     d ? "bg-white/[0.04] border-white/10 text-zinc-200 placeholder-zinc-600 focus:border-violet-500/40" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-violet-400",
  } as const;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "neutral" | "negative";
type FeedEntry = { daysBack: number; hour?: number; type: "journal" | "training"; content: string; sentiment?: Sentiment; moodRating?: number; wentWell?: string; coachComment?: string };
type DemoAthlete = {
  id: string; name: string; initials: string; gender: "male" | "female";
  federation: string; bw: number; wc: string; daysToMeet: number | null;
  squat: [number, number]; bench: [number, number]; deadlift: [number, number];
  mentalGoals: string[]; trainingDays: number;
  checkin: { mood: number; quality: number; readiness: number; energy: number; sleep: number; win: string };
  feed: FeedEntry[];
  affirmations: string[];
  vizKeywords: { squat: string[]; bench: string[]; deadlift: string[] };
  coachNote: string; topics: string[];
  tests: { csai?: { cognitive: number; somatic: number; confidence: number }; acsi?: { total: number; confidence: number; coping: number; concentration: number; goal_setting: number }; das?: { total: number; perfectionism: number; achievement: number; depression_prone: boolean }; sat?: { total: number }; assigned?: string[] };
};

// ─── Demo data ────────────────────────────────────────────────────────────────

const ATHLETES: DemoAthlete[] = [
  {
    id: "sofia", name: "Sofia Mäkinen", initials: "SM", gender: "female", federation: "IPF", bw: 62.8, wc: "63 kg", daysToMeet: 21,
    squat: [165, 182.5], bench: [90, 102.5], deadlift: [200, 222.5],
    mentalGoals: ["Stay calm under meet-day pressure", "Consistent pre-set routine", "Trust the process on heavy singles"],
    trainingDays: 5,
    checkin: { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 9, win: "All three openers felt easy. Ready to compete." },
    affirmations: ["I belong on this platform.", "My preparation is complete.", "I compete for myself."],
    vizKeywords: { squat: ["deep", "tight", "explode"], bench: ["arch", "leg drive", "locked"], deadlift: ["patient", "hips through", "finish"] },
    coachNote: "Sofia is peaking perfectly. Mental game is her strength. Focus on keeping arousal controlled — she can over-activate. Opener day went flawlessly.",
    topics: ["Arousal regulation on meet day", "Handling crowd noise", "Second attempt selection strategy"],
    feed: [
      { daysBack: 0, hour: 8, type: "journal", sentiment: "positive", content: "Visualization this morning — bench arch script twice, then 20 min mental walkthrough. When I step out there it will feel like home." },
      { daysBack: 1, type: "training", moodRating: 8, wentWell: "Bar speed excellent — taper working.", content: "Light day. Staying sharp." },
      { daysBack: 3, type: "journal", sentiment: "positive", content: "Opener selection locked. 160/87.5/195 — conservative and very makeable. 3 weeks feels short and exactly right.", coachComment: "Perfect approach. Confidence is your edge right now." },
    ],
    tests: { csai: { cognitive: 14, somatic: 12, confidence: 32 }, acsi: { total: 92, confidence: 14, coping: 12, concentration: 13, goal_setting: 14 }, das: { total: 36, perfectionism: 7, achievement: 8, depression_prone: false }, sat: { total: 117 } },
  },
  {
    id: "marcus", name: "Marcus Webb", initials: "MW", gender: "male", federation: "IPF", bw: 92.8, wc: "93 kg", daysToMeet: 42,
    squat: [240, 262.5], bench: [165, 182.5], deadlift: [295, 320],
    mentalGoals: ["Manage competition anxiety", "Reframe past red light as learning", "Build consistent pre-set cues"],
    trainingDays: 4,
    checkin: { mood: 8, quality: 9, readiness: 8, energy: 8, sleep: 7, win: "Best deadlift session of prep. Visualization is working." },
    affirmations: ["The bar is mine.", "I trust my training completely.", "I thrive under pressure."],
    vizKeywords: { squat: ["braced", "vertical", "drive"], bench: ["pause", "explode", "lockout"], deadlift: ["lat spread", "hips hinge", "pull through"] },
    coachNote: "Marcus has high cognitive anxiety pre-competition — CSAI confirms it (24/36). Visualization is helping. Watch for red-light rumination as meet gets closer.",
    topics: ["Competition anxiety — 3 negative entries this week", "Pre-set routine for squat", "Reframing past red light as learning"],
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive", content: "Did the visualization script before deadlifts. 10 min, full focus on the pull. 285×5 and it felt like nothing. The mental prep made a tangible difference." },
      { daysBack: 3, type: "journal", sentiment: "negative", content: "Squat session was heavy mentally. Kept replaying the red light from my last competition. Need to get out of my own head.", coachComment: "Let's work on a reframe script for this. Your technique was correct — that call was wrong. Don't carry it forward." },
    ],
    tests: { csai: { cognitive: 24, somatic: 16, confidence: 26 }, acsi: { total: 78, confidence: 12, coping: 10, concentration: 9, goal_setting: 12 }, das: { total: 54, perfectionism: 14, achievement: 12, depression_prone: false }, sat: { total: 98 }, assigned: ["CSAI-2"] },
  },
  {
    id: "alex", name: "Alex Morrison", initials: "AM", gender: "male", federation: "IPF", bw: 82.6, wc: "83 kg", daysToMeet: 56,
    squat: [220, 247.5], bench: [152.5, 170], deadlift: [272.5, 300],
    mentalGoals: ["Stay process-focused under pressure", "Manage opener fixation", "Build deadlift activation anchor"],
    trainingDays: 4,
    checkin: { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 8, win: "237.5 squat. Visualization script working. Feeling ready." },
    affirmations: ["I am strong and prepared.", "I trust my training.", "The platform is where I belong."],
    vizKeywords: { squat: ["strong", "explosive", "locked in"], bench: ["smooth", "confident"], deadlift: ["strong", "explosive", "patient"] },
    coachNote: "Alex responds well to process-focused cues. Tendency to outcome-fixate pre-competition. Visualization (deadlift) is working — PR in training this week.",
    topics: ["Opener fixation — journal entry today", "Process vs outcome framing", "Deadlift activation anchor"],
    feed: [
      { daysBack: 0, type: "journal", sentiment: "neutral", content: "Been fixating on opener numbers. Trying to remind myself — I pick the number, the number doesn't pick me." },
      { daysBack: 1, type: "journal", sentiment: "positive", content: "237.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working." },
      { daysBack: 2, type: "training", moodRating: 9, wentWell: "Mental prep on point.", content: "237.5 squat × 2. New training PR. Everything clicked." },
    ],
    tests: { csai: { cognitive: 18, somatic: 14, confidence: 29 }, acsi: { total: 86, confidence: 13, coping: 11, concentration: 12, goal_setting: 13 }, das: { total: 44, perfectionism: 11, achievement: 10, depression_prone: false }, sat: { total: 113 } },
  },
  {
    id: "kayla", name: "Kayla Ström", initials: "KS", gender: "female", federation: "USAPL", bw: 74.6, wc: "76 kg", daysToMeet: 70,
    squat: [148, 165], bench: [82.5, 92.5], deadlift: [185, 205],
    mentalGoals: ["Build bench confidence", "Apply anchoring to all lifts", "Reduce performance anxiety"],
    trainingDays: 4,
    checkin: { mood: 7, quality: 7, readiness: 7, energy: 7, sleep: 7, win: "145 squat triple — best in months. Anchoring exercise worked." },
    affirmations: ["I am capable of more than I think.", "Confidence is a skill I am building.", "Every session makes me stronger."],
    vizKeywords: { squat: ["confident", "depth", "drive"], bench: ["set up", "own it", "press"], deadlift: ["strong", "smooth pull"] },
    coachNote: "Kayla has a confidence block on bench that's psychological, not technical. ACSI confidence subscale is low (7/28). Anchoring exercise showed real progress on squat.",
    topics: ["Bench confidence block — apply anchoring protocol", "ACSI confidence subscale (7/28 — flag)", "Progress on squat anchoring to build on"],
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive", content: "Coach had me do the confidence anchoring before the heavy squat. Something shifted. Hit 145 for a clean triple. Need to bottle that." },
      { daysBack: 4, type: "journal", sentiment: "negative", content: "Missed the 82.5 bench again. Brain just went blank the moment the bar started moving.", coachComment: "This is the confidence anchor we need to work on. Book a call this week." },
    ],
    tests: { csai: { cognitive: 20, somatic: 18, confidence: 22 }, acsi: { total: 69, confidence: 7, coping: 9, concentration: 10, goal_setting: 11 }, assigned: ["SAT", "DAS"] },
  },
  {
    id: "jake", name: "Jake Hartley", initials: "JH", gender: "male", federation: "IPF", bw: 82.4, wc: "83 kg", daysToMeet: null,
    squat: [210, 232.5], bench: [140, 155], deadlift: [252.5, 275],
    mentalGoals: ["Address perfectionism pattern", "Set a meet date", "Separate identity from training outcome"],
    trainingDays: 5,
    checkin: { mood: 8, quality: 8, readiness: 8, energy: 7, sleep: 7, win: "227.5 squat training PR. Mental routine paying off." },
    affirmations: ["Progress over perfection.", "I show up and do the work.", "Good enough today builds great tomorrow."],
    vizKeywords: { squat: ["process", "consistent", "trust"], bench: ["simple", "controlled", "finish"], deadlift: ["grounded", "pull hard"] },
    coachNote: "Jake has a perfectionism pattern (DAS: 17/24). Needs to separate performance from self-worth. Set a meet date — he's ready.",
    topics: ["DAS perfectionism flag (17/24) — needs addressing", "Set a meet date — performance is there", "Separating identity from training outcome"],
    feed: [
      { daysBack: 0, hour: 18, type: "journal", sentiment: "positive", content: "227.5 squat for 2. Never done that before. The mental routine is working. Starting to believe the goal total is within reach." },
      { daysBack: 2, type: "journal", sentiment: "negative", content: "Sleep was rough. Cut the session short. Evening relaxation script. Woke up better." },
    ],
    tests: { das: { total: 69, perfectionism: 17, achievement: 15, depression_prone: false }, sat: { total: 112 }, assigned: ["ACSI-28", "CSAI-2"] },
  },
];

const INVITE_CODE = "DEMOSHOW";
const ALL_TESTS = ["SAT", "ACSI-28", "CSAI-2", "DAS"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relDate(d: number, h = 20) { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x; }
function timeLabel(d: number) { return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`; }
function pct(c: number, g: number) { return Math.min(Math.round((c / g) * 100), 100); }
function meetColor(d: boolean, days: number | null): string {
  if (days === null) return d ? "text-zinc-400 border-zinc-600/30 bg-zinc-500/10" : "text-gray-500 border-gray-300 bg-gray-100";
  if (days <= 28)   return d ? "text-rose-300 border-rose-500/30 bg-rose-500/10"   : "text-rose-700 border-rose-300 bg-rose-50";
  if (days <= 56)   return d ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-amber-700 border-amber-300 bg-amber-50";
  return d ? "text-blue-300 border-blue-500/30 bg-blue-500/10" : "text-blue-700 border-blue-300 bg-blue-50";
}
function sentimentDot(s?: Sentiment) { return s === "positive" ? "bg-violet-400" : s === "negative" ? "bg-rose-400" : "bg-zinc-400"; }
function hasFlag(a: DemoAthlete) { return a.topics.some(t => /flag|block|anxiety|fixat|perfectionism/i.test(t)); }

// ─── Phone chrome ─────────────────────────────────────────────────────────────

function StatusBar({ dark }: { dark: boolean }) {
  const [time, setTime] = React.useState(() => {
    const n = new Date();
    return `${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}`;
  });
  React.useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTime(`${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}`);
    }, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={`flex items-center justify-between px-6 pt-3 pb-1 flex-shrink-0 ${dark ? "text-white" : "text-gray-900"}`}>
      <span className="text-[13px] font-semibold tabular-nums">{time}</span>
      <div className="flex items-center gap-[5px]">
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.4"/>
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" opacity="0.6"/>
          <rect x="9" y="3" width="3" height="9" rx="0.5" opacity="0.8"/>
          <rect x="13.5" y="0" width="3" height="12" rx="0.5"/>
        </svg>
        {/* Wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
          <path d="M3.5 6.5a6.5 6.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M1 4A9.5 9.5 0 0 1 15 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35"/>
          <rect x="2" y="2" width="16" height="8" rx="1.5"/>
          <path d="M22.5 4v4a2 2 0 0 0 0-4z" opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

function HomeIndicator({ dark }: { dark: boolean }) {
  return (
    <div className="flex justify-center pt-2 pb-2 flex-shrink-0">
      <div className="w-32 h-[5px] rounded-full" style={{ background: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)" }} />
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, max, hi = false }: { label: string; value: number; max: number; hi?: boolean }) {
  const d = useD(); const p = pal(d);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`font-saira text-[10px] ${p.t3} uppercase tracking-wider`}>{label}</span>
        <span className={`font-saira text-[11px] font-semibold tabular-nums ${hi ? p.rt : p.t2}`}>{value}/{max}</span>
      </div>
      <div className={`h-1.5 ${p.progress} rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full ${hi ? "bg-rose-400" : "bg-violet-400"}`} style={{ width: `${pct(value, max)}%` }} />
      </div>
    </div>
  );
}

// ─── Athlete sheet (5 tabs) ───────────────────────────────────────────────────

function AthleteSheet({ a }: { a: DemoAthlete }) {
  const d = useD(); const p = pal(d);
  const [tab, setTab] = React.useState<"overview" | "profile" | "activity" | "tests" | "tools">("overview");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [commenting, setCommenting] = React.useState<number | null>(null);
  const [commentDraft, setCommentDraft] = React.useState("");
  const feed = [...a.feed].sort((x, y) => relDate(y.daysBack, y.hour).getTime() - relDate(x.daysBack, x.hour).getTime());

  return (
    <div className="space-y-4">
      {/* Lift bars */}
      <div className="grid grid-cols-3 gap-2">
        {(["squat", "bench", "deadlift"] as const).map(lift => {
          const [cur, goal] = a[lift];
          return (
            <div key={lift} className={`rounded-xl border ${p.c1} p-3`}>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.t4} mb-1`}>{lift}</p>
              <p className={`font-saira text-base font-bold ${p.t1}`}>{cur} <span className={`${p.t4} text-xs font-normal`}>kg</span></p>
              <div className={`mt-2 h-1 ${p.progress} rounded-full overflow-hidden`}>
                <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct(cur, goal)}%` }} />
              </div>
              <p className={`font-saira text-[9px] ${p.t4} mt-1`}>Goal {goal} kg</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className={`flex gap-0.5 ${d ? "bg-white/[0.03]" : "bg-gray-100"} rounded-xl p-1 overflow-x-auto`}>
        {(["overview", "profile", "activity", "tests", "tools"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 min-w-[52px] rounded-lg py-1.5 font-saira text-[9px] font-semibold uppercase tracking-wider transition whitespace-nowrap ${tab === t ? p.tabOn : p.tabOff}`}>
            {t === "tools" ? "Coach" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border ${p.c1} px-2.5 py-1 font-saira text-[11px] ${p.t2}`}>{a.bw} kg · {a.gender}</span>
            <span className={`rounded-full border ${p.c1} px-2.5 py-1 font-saira text-[11px] ${p.t2}`}>{a.federation} · {a.wc}</span>
            {a.daysToMeet !== null && <span className={`rounded-full border px-2.5 py-1 font-saira text-[11px] font-semibold ${meetColor(d, a.daysToMeet)}`}>Meet in {a.daysToMeet} days</span>}
          </div>
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-3`}>Latest weekly check-in</p>
            <div className="grid grid-cols-5 gap-1 mb-3">
              {[["Mood",a.checkin.mood],["Quality",a.checkin.quality],["Ready",a.checkin.readiness],["Energy",a.checkin.energy],["Sleep",a.checkin.sleep]].map(([l,v]) => (
                <div key={l as string} className="text-center">
                  <div className={`text-xl font-extrabold font-saira ${Number(v)>=8 ? p.vtl : Number(v)>=6 ? p.t2 : p.rt}`}>{v}</div>
                  <div className={`font-saira text-[9px] ${p.t4} uppercase`}>{l}</div>
                </div>
              ))}
            </div>
            <p className={`font-saira text-xs ${p.t2} leading-relaxed border-t ${d ? "border-white/5" : "border-gray-100"} pt-3`}>
              <span className={`${p.t4} mr-1`}>Win:</span>{a.checkin.win}
            </p>
          </div>
          {feed.filter(e => e.type === "journal")[0] && (() => {
            const e = feed.filter(e => e.type === "journal")[0]!;
            return (
              <div className={`rounded-xl border ${p.c2} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${sentimentDot(e.sentiment)}`} />
                  <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4}`}>{timeLabel(e.daysBack)}</p>
                </div>
                <p className={`font-saira text-xs ${p.t2} leading-relaxed`}>{e.content}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* PROFILE */}
      {tab === "profile" && (
        <div className="space-y-3">
          <div className={`rounded-xl border ${p.c2} p-4 space-y-2.5`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-1`}>Athlete profile</p>
            {[["Name", a.name], ["Federation", a.federation], ["Weight class", a.wc], ["Bodyweight", `${a.bw} kg`], ["Gender", a.gender], ["Training days/week", String(a.trainingDays)]].map(([k,v]) => (
              <div key={k} className={`flex justify-between py-1 border-b ${d ? "border-white/[0.04]" : "border-gray-100"} last:border-0`}>
                <span className={`font-saira text-[10px] ${p.t4}`}>{k}</span>
                <span className={`font-saira text-[10px] ${p.t2} font-medium`}>{v}</span>
              </div>
            ))}
          </div>
          {a.daysToMeet !== null && (
            <div className={`rounded-xl border px-4 py-3 flex justify-between items-center ${meetColor(d, a.daysToMeet)}`}>
              <p className="font-saira text-[10px] uppercase tracking-widest">Next competition</p>
              <p className="font-saira text-sm font-bold">{a.daysToMeet} days</p>
            </div>
          )}
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-3`}>Competition goals</p>
            {(["squat","bench","deadlift"] as const).map(lift => {
              const [c,g] = a[lift];
              return (
                <div key={lift} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className={`font-saira text-[10px] uppercase ${p.t3}`}>{lift}</span>
                    <span className={`font-saira text-[10px] ${p.t2} tabular-nums`}>{c} <span className={p.t4}>/ {g} kg</span></span>
                  </div>
                  <div className={`h-1 ${p.progress} rounded-full overflow-hidden`}>
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct(c,g)}%` }} />
                  </div>
                </div>
              );
            })}
            <p className={`font-saira text-[9px] ${p.t4} mt-2`}>Goal total: {a.squat[1]+a.bench[1]+a.deadlift[1]} kg</p>
          </div>
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-2`}>Mental goals</p>
            {a.mentalGoals.map((g,i) => (
              <div key={i} className="flex gap-2 mb-1.5 last:mb-0">
                <span className={`${p.vt} text-[10px] flex-shrink-0 mt-0.5`}>·</span>
                <p className={`font-saira text-xs ${p.t2}`}>{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITY */}
      {tab === "activity" && (
        <div className="space-y-2">
          {feed.map((e, i) => (
            <div key={i} className={`rounded-xl border p-3 ${e.type === "training" ? p.skb.replace(/text-\S+/, "").trim() + (d ? " bg-sky-500/5" : " bg-sky-50") : p.vbg}`}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-widest border ${e.type === "training" ? p.skb : (d ? "bg-violet-500/15 text-violet-300 border-violet-500/20" : "bg-violet-50 text-violet-700 border-violet-200")}`}>{e.type}</span>
                {e.sentiment && <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] border ${e.sentiment === "positive" ? (d ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-violet-50 text-violet-600 border-violet-200") : e.sentiment === "negative" ? (d ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200") : (d ? "bg-white/5 text-zinc-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-200")}`}>{e.sentiment}</span>}
                {e.moodRating && <span className={`font-saira text-[10px] ${p.t3}`}>Mood {e.moodRating}/10</span>}
                <span className={`font-saira text-[10px] ${p.t4} ml-auto`}>{timeLabel(e.daysBack)}</span>
              </div>
              <p className={`font-saira text-xs ${p.t2} leading-relaxed`}>{e.content}</p>
              {e.wentWell && <p className={`font-saira text-[10px] ${p.vt} mt-1.5`}>✓ {e.wentWell}</p>}
              {e.coachComment && (
                <div className={`mt-2 rounded-lg border ${p.vbg2} px-3 py-2`}>
                  <p className={`font-saira text-[9px] uppercase tracking-widest ${p.vt} mb-0.5`}>Coach comment</p>
                  <p className={`font-saira text-[11px] ${p.t2} leading-relaxed`}>{e.coachComment}</p>
                </div>
              )}
              {!e.coachComment && (
                commenting === i ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={commentDraft}
                      onChange={ev => setCommentDraft(ev.target.value)}
                      placeholder="Add a comment for this athlete…"
                      className={`w-full rounded-lg border px-3 py-2 font-saira text-xs resize-none focus:outline-none ${p.input}`}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setCommenting(null); setCommentDraft(""); }} className={`font-saira text-[10px] ${p.t4} hover:${p.t2} transition`}>Cancel</button>
                      <button type="button" onClick={() => { setCommenting(null); setCommentDraft(""); }} className={`rounded-lg border ${p.vbg2} px-3 py-1 font-saira text-[10px] font-bold ${p.vtl} transition`}>Post comment</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCommenting(i)} className={`mt-2 font-saira text-[10px] ${p.t4} hover:${p.vt} transition flex items-center gap-1`}>
                    <span>+</span> Leave a comment
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* TESTS */}
      {tab === "tests" && (
        <div className="space-y-3">
          {!assignOpen ? (
            <button type="button" onClick={() => setAssignOpen(true)} className={`w-full rounded-xl border border-dashed ${d ? "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10" : "border-violet-300 bg-violet-50 hover:bg-violet-100"} px-4 py-3 text-center transition`}>
              <p className={`font-saira text-xs font-bold ${p.vtl}`}>+ Assign a test</p>
              <p className={`font-saira text-[10px] ${p.t4} mt-0.5`}>SAT · ACSI-28 · CSAI-2 · DAS</p>
            </button>
          ) : (
            <div className={`rounded-xl border ${p.vbg2} p-4`}>
              <p className={`font-saira text-[10px] uppercase tracking-widest ${p.vt} mb-2`}>Assign test to {a.name.split(" ")[0]}</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ALL_TESTS.map(test => (
                  <div key={test} className={`rounded-lg border px-3 py-2.5 text-center font-saira text-xs font-bold uppercase cursor-pointer transition ${a.tests.assigned?.includes(test)
                    ? (d ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-amber-300 bg-amber-50 text-amber-700")
                    : (d ? "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-500/25 hover:text-violet-300" : "border-gray-200 bg-white text-gray-400 hover:border-violet-300 hover:text-violet-600")}`}>
                    {test}
                    {a.tests.assigned?.includes(test) && <p className={`font-saira text-[8px] normal-case tracking-normal ${d ? "text-amber-400" : "text-amber-600"} mt-0.5`}>Assigned · pending</p>}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setAssignOpen(false)} className={`font-saira text-[10px] ${p.t4} hover:${p.t2} transition`}>← Back</button>
            </div>
          )}
          {a.tests.assigned && a.tests.assigned.length > 0 && !assignOpen && (
            <div className={`rounded-xl border ${p.abg} p-3`}>
              <p className={`font-saira text-[9px] uppercase tracking-widest ${p.at} mb-2`}>Assigned · awaiting completion</p>
              <div className="flex gap-2 flex-wrap">
                {a.tests.assigned.map(t => <span key={t} className={`rounded-full border ${p.abg} px-2.5 py-1 font-saira text-[10px] font-bold ${p.at}`}>{t}</span>)}
              </div>
            </div>
          )}
          {a.tests.csai && (
            <div className={`rounded-xl border ${p.c2} p-4 space-y-2.5`}>
              <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-1`}>CSAI-2 · Competitive Anxiety</p>
              <ScoreBar label="Cognitive Anxiety" value={a.tests.csai.cognitive} max={36} hi={a.tests.csai.cognitive >= 22} />
              <ScoreBar label="Somatic Anxiety"   value={a.tests.csai.somatic}   max={36} />
              <ScoreBar label="Self-Confidence"   value={a.tests.csai.confidence} max={36} />
            </div>
          )}
          {a.tests.acsi && (
            <div className={`rounded-xl border ${p.c2} p-4 space-y-2.5`}>
              <div className="flex justify-between mb-1">
                <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4}`}>ACSI-28 · Coping Skills</p>
                <p className={`font-saira text-[11px] font-semibold ${p.t2}`}>{a.tests.acsi.total}/196</p>
              </div>
              <ScoreBar label="Confidence"    value={a.tests.acsi.confidence}    max={28} hi={a.tests.acsi.confidence <= 8} />
              <ScoreBar label="Coping"        value={a.tests.acsi.coping}        max={28} />
              <ScoreBar label="Concentration" value={a.tests.acsi.concentration} max={28} />
              <ScoreBar label="Goal Setting"  value={a.tests.acsi.goal_setting}  max={28} />
            </div>
          )}
          {a.tests.das && (
            <div className={`rounded-xl border ${p.c2} p-4 space-y-2.5`}>
              <div className="flex justify-between mb-1">
                <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4}`}>DAS · Dysfunctional Attitudes</p>
                <p className={`font-saira text-[11px] font-semibold ${p.t2}`}>{a.tests.das.total}/100</p>
              </div>
              <ScoreBar label="Perfectionism"    value={a.tests.das.perfectionism} max={24} hi={a.tests.das.perfectionism >= 14} />
              <ScoreBar label="Achievement Dep." value={a.tests.das.achievement}   max={24} hi={a.tests.das.achievement >= 14} />
              {a.tests.das.depression_prone && (
                <div className={`rounded-lg border ${p.rbg} px-3 py-2`}>
                  <p className={`font-saira text-[11px] ${p.rt}`}>Depression-prone pattern — review with athlete.</p>
                </div>
              )}
            </div>
          )}
          {a.tests.sat && (
            <div className={`rounded-xl border ${p.c2} p-3 flex justify-between items-center`}>
              <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4}`}>SAT · Achievement Motivation</p>
              <p className={`font-saira text-[11px] font-semibold ${p.t2}`}>{a.tests.sat.total}/165</p>
            </div>
          )}
          {!a.tests.csai && !a.tests.acsi && !a.tests.das && !a.tests.sat && (
            <p className={`text-center font-saira text-sm ${p.t4} py-4`}>No test results yet — assign a test above.</p>
          )}
        </div>
      )}

      {/* COACH TOOLS */}
      {tab === "tools" && (
        <div className="space-y-3">
          <div className={`rounded-xl border ${p.abg} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.at} mb-2`}>Topics to discuss</p>
            <div className="space-y-1.5">
              {a.topics.map((t,i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`${p.at} text-[10px] mt-0.5 flex-shrink-0`}>◆</span>
                  <p className={`font-saira text-xs ${p.t2}`}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-2`}>Private coach notes</p>
            <p className={`font-saira text-xs ${p.t2} leading-relaxed italic`}>&quot;{a.coachNote}&quot;</p>
          </div>
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-2`}>Affirmations</p>
            <div className="space-y-1.5">
              {a.affirmations.map((aff,i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`${p.vt} font-bold text-[11px] flex-shrink-0`}>{i+1}.</span>
                  <p className={`font-saira text-xs ${p.t2}`}>{aff}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-xl border ${p.c2} p-4`}>
            <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-3`}>Visualization keywords</p>
            {(["squat","bench","deadlift"] as const).map(lift => (
              <div key={lift} className="flex items-start gap-2 mb-2">
                <span className={`font-saira text-[10px] ${p.t4} uppercase w-14 flex-shrink-0 mt-0.5`}>{lift}</span>
                <div className="flex flex-wrap gap-1">
                  {a.vizKeywords[lift].map(kw => (
                    <span key={kw} className={`rounded-full border ${p.vbg} px-2 py-0.5 font-saira text-[10px] ${p.vtl}`}>{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onSelectAthlete }: { onSelectAthlete: (a: DemoAthlete) => void }) {
  const d = useD(); const p = pal(d);
  const attention = ATHLETES.filter(a => hasFlag(a));
  const allFeed = ATHLETES.flatMap(a => a.feed.map(e => ({ e, a })))
    .sort((x, y) => relDate(y.e.daysBack, y.e.hour).getTime() - relDate(x.e.daysBack, x.e.hour).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Athletes",       value: ATHLETES.length, cls: p.t1 },
          { label: "Need attention", value: attention.length, cls: d ? "text-amber-300" : "text-amber-700" },
          { label: "Entries today",  value: 3,               cls: p.vtl },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border ${p.c1} p-3 text-center`}>
            <p className={`font-saira text-2xl font-extrabold ${cls}`}>{value}</p>
            <p className={`font-saira text-[9px] ${p.t4} uppercase tracking-wide mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Invite code */}
      <div className={`rounded-xl border ${p.vbg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className={`font-saira text-[9px] uppercase tracking-widest ${p.vt} mb-0.5`}>Athlete invite code</p>
          <p className={`font-saira text-lg font-extrabold ${p.t1} tracking-widest`}>{INVITE_CODE}</p>
        </div>
        <div className="text-right">
          <p className={`font-saira text-[9px] ${p.t4}`}>Share this code</p>
          <button type="button" className={`font-saira text-[10px] ${p.vt} hover:${p.vtl} transition`}>Copy link →</button>
        </div>
      </div>

      {/* Needs attention */}
      {attention.length > 0 && (
        <div>
          <p className={`font-saira text-[10px] uppercase tracking-widest ${d ? "text-amber-400" : "text-amber-700"} mb-2 flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${d ? "bg-amber-400" : "bg-amber-600"} inline-block`} />Needs attention
          </p>
          <div className="space-y-2">
            {attention.map(a => (
              <button key={a.id} type="button" onClick={() => onSelectAthlete(a)} className={`w-full text-left rounded-xl border ${p.abg} hover:opacity-90 p-3 transition`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${p.abg} flex items-center justify-center font-saira text-xs font-bold ${p.at} flex-shrink-0`}>{a.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-saira text-xs font-semibold ${p.t1}`}>{a.name}</p>
                    <p className={`font-saira text-[10px] ${p.t4} truncate`}>{a.topics[0]}</p>
                  </div>
                  <span className={`font-saira text-[9px] ${p.at} flex-shrink-0`}>View →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-2`}>Recent activity</p>
        <div className="space-y-2">
          {allFeed.map(({ e, a }, i) => (
            <button key={i} type="button" onClick={() => onSelectAthlete(a)} className={`w-full text-left rounded-xl border ${p.c2} hover:${p.c1.split(" ")[0]} p-3 transition`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full ${p.vic} flex items-center justify-center font-saira text-[8px] font-bold flex-shrink-0`}>{a.initials}</div>
                <span className={`font-saira text-[10px] ${p.t3} truncate`}>{a.name}</span>
                <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 font-saira text-[8px] uppercase border ${e.type === "training" ? p.skb : (d ? "bg-violet-500/10 text-violet-400 border-violet-500/15" : "bg-violet-50 text-violet-600 border-violet-200")}`}>{e.type}</span>
                {e.sentiment && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sentimentDot(e.sentiment)}`} />}
                <span className={`font-saira text-[9px] ${p.t4} ml-auto`}>{timeLabel(e.daysBack)}</span>
              </div>
              <p className={`font-saira text-xs ${p.t3} line-clamp-1`}>{e.content}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Athlete card ─────────────────────────────────────────────────────────────

function AthleteCard({ a, onClick }: { a: DemoAthlete; onClick: () => void }) {
  const d = useD(); const p = pal(d);
  const latest = a.feed.filter(e => e.type === "journal")[0];
  const flag = hasFlag(a);
  return (
    <button type="button" onClick={onClick} className={`w-full text-left rounded-2xl border ${p.c1} p-4 hover:opacity-90 active:scale-[0.99] transition-all`}>
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className={`w-9 h-9 rounded-full ${p.vic} border ${d ? "border-violet-500/20" : "border-violet-200"} flex items-center justify-center font-saira text-xs font-bold`}>{a.initials}</div>
          {flag && <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${d ? "bg-amber-400" : "bg-amber-500"} border-2 ${d ? "border-[#0A0A0A]" : "border-white"}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-saira text-sm font-semibold ${p.t1}`}>{a.name}</span>
            <span className={`font-saira text-[10px] ${p.t4}`}>{a.bw} kg · {a.wc} · {a.federation}</span>
            {a.daysToMeet !== null && <span className={`ml-auto rounded-full border px-2 py-0.5 font-saira text-[9px] font-semibold uppercase ${meetColor(d, a.daysToMeet)}`}>{a.daysToMeet}d</span>}
          </div>
          <div className={`flex gap-2 mt-1 text-[10px] font-saira ${p.t3}`}>
            <span>S {a.squat[0]}</span><span className={p.t4}>·</span><span>B {a.bench[0]}</span><span className={p.t4}>·</span><span>D {a.deadlift[0]}</span>
          </div>
          {latest && (
            <div className="mt-1.5 flex items-start gap-1.5">
              <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sentimentDot(latest.sentiment)}`} />
              <p className={`font-saira text-[11px] ${p.t3} line-clamp-1 leading-relaxed`}>{latest.content}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileView({ onSelectAthlete, tab, setTab }: {
  onSelectAthlete: (a: DemoAthlete) => void;
  tab: "home" | "athletes" | "activity";
  setTab: (t: "home" | "athletes" | "activity") => void;
}) {
  const d = useD(); const p = pal(d);
  const allFeed = ATHLETES.flatMap(a => a.feed.map(e => ({ e, a })))
    .sort((x, y) => relDate(y.e.daysBack, y.e.hour).getTime() - relDate(x.e.daysBack, x.e.hour).getTime());
  const priority = ATHLETES.filter(a => a.daysToMeet !== null && a.daysToMeet <= 56);
  const others   = ATHLETES.filter(a => a.daysToMeet === null || a.daysToMeet > 56);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 pb-3 flex-shrink-0">
        <div className={`flex gap-1 ${d ? "bg-white/[0.03] border-white/5" : "bg-gray-100 border-gray-200"} border rounded-xl p-1`}>
          {(["home","athletes","activity"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 font-saira text-[11px] font-semibold uppercase tracking-wider transition ${tab === t ? p.tabOn : p.tabOff}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {tab === "home" && <Dashboard onSelectAthlete={onSelectAthlete} />}
        {tab === "athletes" && (
          <div className="space-y-5">
            {priority.length > 0 && (
              <div>
                <p className={`font-saira text-[10px] uppercase tracking-widest ${p.rt} mb-2 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${d ? "bg-rose-400" : "bg-rose-500"} inline-block`} />Priority — meet within 8 weeks
                </p>
                <div className="space-y-2">{priority.map(a => <AthleteCard key={a.id} a={a} onClick={() => onSelectAthlete(a)} />)}</div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className={`font-saira text-[10px] uppercase tracking-widest ${p.t4} mb-2 flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${d ? "bg-zinc-500" : "bg-gray-400"} inline-block`} />Active
                </p>
                <div className="space-y-2">{others.map(a => <AthleteCard key={a.id} a={a} onClick={() => onSelectAthlete(a)} />)}</div>
              </div>
            )}
          </div>
        )}
        {tab === "activity" && (
          <div className="space-y-3">
            {allFeed.map(({ e, a }, i) => (
              <button key={i} type="button" onClick={() => onSelectAthlete(a)} className={`w-full text-left rounded-2xl border ${p.c1} p-4 hover:opacity-90 transition`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full ${p.vic} flex items-center justify-center font-saira text-[9px] font-bold flex-shrink-0`}>{a.initials}</div>
                  <span className={`font-saira text-xs font-semibold ${p.t2} truncate`}>{a.name}</span>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase border ${e.type === "training" ? p.skb : (d ? "bg-violet-500/10 text-violet-300 border-violet-500/20" : "bg-violet-50 text-violet-700 border-violet-200")}`}>{e.type}</span>
                  {e.sentiment && <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] border ${e.sentiment === "positive" ? (d ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-violet-50 text-violet-600 border-violet-200") : e.sentiment === "negative" ? (d ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200") : (d ? "bg-white/5 text-zinc-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-200")}`}>{e.sentiment}</span>}
                  <span className={`font-saira text-[10px] ${p.t4} ml-auto`}>{timeLabel(e.daysBack)}</span>
                </div>
                <p className={`font-saira text-sm ${p.t2} leading-relaxed line-clamp-2`}>{e.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopView({ onSelectAthlete }: { onSelectAthlete: (a: DemoAthlete) => void }) {
  const d = useD(); const p = pal(d);
  const [tab, setTab] = React.useState<"home" | "athletes" | "activity">("home");
  const allFeed = ATHLETES.flatMap(a => a.feed.map(e => ({ e, a })))
    .sort((x, y) => relDate(y.e.daysBack, y.e.hour).getTime() - relDate(x.e.daysBack, x.e.hour).getTime());

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`w-[200px] border-r ${d ? "border-white/[0.06]" : "border-gray-200"} flex flex-col p-4 flex-shrink-0`} style={{ background: p.phone }}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-0.5">
            <Image
              src="/fm_powerflow_logo_verziok_01_negative.png"
              alt="PowerFlow" width={16} height={16}
              className="h-4 w-4"
              style={d ? { opacity: 0.7 } : { opacity: 0.6, filter: "invert(1)" }}
            />
            <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.28em] ${p.vt}`}>PowerFlow</p>
          </div>
          <p className={`font-saira text-xs ${p.t4}`}>Coach Dashboard</p>
        </div>
        <nav className="space-y-1 flex-1">
          {(["home","athletes","activity"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`w-full text-left rounded-lg px-3 py-2.5 font-saira text-xs font-semibold uppercase tracking-wider transition ${tab === t ? p.navOn : p.navOff}`}>
              {t === "home" ? "🏠 Home" : t === "athletes" ? "👥 Athletes" : "📊 Activity"}
            </button>
          ))}
        </nav>
        <div className={`rounded-xl border ${p.vbg} p-3 mt-4`}>
          <p className={`font-saira text-[8px] uppercase tracking-widest ${p.vt} mb-1`}>Invite code</p>
          <p className={`font-saira text-sm font-extrabold ${p.t1} tracking-widest`}>{INVITE_CODE}</p>
          <button type="button" className={`font-saira text-[9px] ${p.vt} hover:${p.vtl} transition mt-1`}>Copy link →</button>
        </div>
        <div className={`mt-3 pt-3 border-t ${d ? "border-white/5" : "border-gray-200"}`}>
          <p className={`font-saira text-[10px] ${p.t3}`}>Demo Coach</p>
          <p className={`font-saira text-[9px] ${p.t4}`}>{ATHLETES.length} athletes</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "home" && <Dashboard onSelectAthlete={onSelectAthlete} />}
        {tab === "athletes" && (
          <div className="grid grid-cols-2 gap-3">
            {ATHLETES.map(a => <AthleteCard key={a.id} a={a} onClick={() => onSelectAthlete(a)} />)}
          </div>
        )}
        {tab === "activity" && (
          <div className="space-y-3">
            {allFeed.map(({ e, a }, i) => (
              <button key={i} type="button" onClick={() => onSelectAthlete(a)} className={`w-full text-left rounded-xl border ${p.c2} hover:${p.c1.split(" ")[0]} p-4 transition`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full ${p.vic} flex items-center justify-center font-saira text-xs font-bold flex-shrink-0`}>{a.initials}</div>
                  <span className={`font-saira text-sm font-semibold ${p.t2}`}>{a.name}</span>
                  <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase border ${e.type === "training" ? p.skb : (d ? "bg-violet-500/10 text-violet-300 border-violet-500/20" : "bg-violet-50 text-violet-700 border-violet-200")}`}>{e.type}</span>
                  {e.sentiment && <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] border ${e.sentiment === "positive" ? (d ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-violet-50 text-violet-600 border-violet-200") : e.sentiment === "negative" ? (d ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200") : (d ? "bg-white/5 text-zinc-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-200")}`}>{e.sentiment}</span>}
                  <span className={`font-saira text-[10px] ${p.t4} ml-auto`}>{timeLabel(e.daysBack)}</span>
                </div>
                <p className={`font-saira text-sm ${p.t2} leading-relaxed line-clamp-2`}>{e.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoCoach() {
  const [viewMode, setViewMode] = React.useState<"mobile" | "desktop">("mobile");
  const [mobileTab, setMobileTab] = React.useState<"home" | "athletes" | "activity">("home");
  const [open, setOpen] = React.useState<DemoAthlete | null>(null);
  const [isDark, setIsDark] = React.useState(true);

  const isDesktop = viewMode === "desktop";
  const p = pal(isDark);

  return (
    <DarkCtx.Provider value={isDark}>
      <div className={`min-h-screen font-saira ${isDesktop ? "flex flex-col items-center py-8 px-4" : "sm:flex sm:items-start sm:justify-center sm:py-10"}`} style={{ background: p.screen }}>

        {/* Top bar — above frame */}
        <div className={`flex items-center gap-3 mb-4 ${isDesktop ? "w-full max-w-[960px]" : "sm:mb-3 px-4 pt-4 sm:px-0 sm:pt-0"}`}>
          <div className="flex items-center gap-2">
            <Image
              src="/fm_powerflow_logo_verziok_01_negative.png"
              alt="PowerFlow" width={20} height={20}
              className="h-5 w-5"
              style={isDark ? { opacity: 0.8 } : { opacity: 0.6, filter: "invert(1)" }}
            />
            <Link href="/demo" className={`font-saira text-[10px] ${isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-700"} transition`}>← Demo</Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsDark(d => !d)}
              title={isDark ? "Light mode" : "Dark mode"}
              className={`text-sm leading-none px-1.5 py-1 rounded-lg transition ${isDark ? "text-zinc-400 hover:text-zinc-100" : "text-gray-400 hover:text-gray-700"}`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <div className={`flex items-center gap-1 rounded-xl border ${isDark ? "border-white/8 bg-white/[0.03]" : "border-gray-200 bg-white"} p-1`}>
              {(["mobile","desktop"] as const).map(m => (
                <button key={m} type="button" onClick={() => setViewMode(m)}
                  className={`rounded-lg px-3 py-1.5 font-saira text-[10px] font-bold uppercase tracking-wider transition ${viewMode === m ? (isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm") : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")}`}>
                  {m === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE frame */}
        {!isDesktop && (
          <div
            className="w-full sm:w-[390px] sm:rounded-[44px] sm:border-[7px] sm:border-zinc-800 sm:shadow-[0_32px_120px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden relative flex flex-col"
            style={{ minHeight: "820px", background: p.phone }}
          >
            <StatusBar dark={isDark} />
            {/* Header */}
            <div className="px-4 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Image
                    src="/fm_powerflow_logo_verziok_01_negative.png"
                    alt="PowerFlow" width={14} height={14}
                    className="h-3.5 w-3.5"
                    style={isDark ? { opacity: 0.7 } : { opacity: 0.6, filter: "invert(1)" }}
                  />
                  <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.28em] ${p.vt}`}>PowerFlow · Coach</p>
                </div>
                <h1 className={`font-saira text-2xl font-extrabold uppercase tracking-tight ${p.t1} mt-0.5`}>Dashboard</h1>
              </div>
              <div className="text-right">
                <p className={`font-saira text-xs ${p.t3}`}>{ATHLETES.length} athletes</p>
              </div>
            </div>
            <MobileView onSelectAthlete={a => setOpen(a)} tab={mobileTab} setTab={setMobileTab} />
            <HomeIndicator dark={isDark} />
          </div>
        )}

        {/* DESKTOP frame */}
        {isDesktop && (
          <div
            className="w-full max-w-[960px] rounded-2xl border border-zinc-800 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            style={{ minHeight: "680px", background: p.phone }}
          >
            <div className={`border-b ${isDark ? "bg-violet-600/15 border-violet-500/15" : "bg-violet-50 border-violet-200"} px-5 py-2 flex items-center gap-3`}>
              <p className={`font-saira text-[10px] font-semibold uppercase tracking-widest ${isDark ? "text-violet-300" : "text-violet-700"}`}>Demo · Coach Dashboard · Desktop View</p>
            </div>
            <div className="flex" style={{ minHeight: "640px" }}>
              <DesktopView onSelectAthlete={a => setOpen(a)} />
            </div>
          </div>
        )}

        {/* Coach pricing */}
        <div className={`mt-4 ${isDesktop ? "w-full max-w-[960px]" : "w-full sm:w-[390px] px-4 sm:px-0"}`}>
          <div className={`rounded-2xl border p-5 ${isDark ? "border-white/[0.07] bg-white/[0.02]" : "border-gray-200 bg-white"}`}>
            <p className={`font-saira text-[9px] font-bold uppercase tracking-[0.22em] mb-4 ${isDark ? "text-violet-400" : "text-violet-600"}`}>
              Coach pricing
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Base plan */}
              <div className={`flex-1 rounded-xl border p-4 ${isDark ? "border-violet-500/25 bg-violet-500/[0.07]" : "border-violet-200 bg-violet-50"}`}>
                <p className={`font-saira text-[9px] uppercase tracking-widest mb-1 ${isDark ? "text-violet-400" : "text-violet-600"}`}>Base plan</p>
                <div className="flex items-baseline gap-1">
                  <span className={`font-saira text-3xl font-extrabold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>€29</span>
                  <span className={`font-saira text-xs ${isDark ? "text-zinc-400" : "text-gray-500"}`}>/month</span>
                </div>
                <p className={`font-saira text-[10px] leading-relaxed mt-2 ${isDark ? "text-zinc-300" : "text-gray-700"}`}>
                  Full coach dashboard. Includes all <span className={`font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}>PR tier</span> features for you as an athlete.
                </p>
              </div>
              {/* Per-athlete */}
              <div className={`flex-1 rounded-xl border p-4 ${isDark ? "border-white/8 bg-white/[0.02]" : "border-gray-100 bg-white"}`}>
                <p className={`font-saira text-[9px] uppercase tracking-widest mb-1 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>Dashboard visibility</p>
                <div className="flex items-baseline gap-1">
                  <span className={`font-saira text-3xl font-extrabold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>+€5</span>
                  <span className={`font-saira text-xs ${isDark ? "text-zinc-400" : "text-gray-500"}`}>/athlete/month</span>
                </div>
                <p className={`font-saira text-[10px] leading-relaxed mt-2 ${isDark ? "text-zinc-400" : "text-gray-600"}`}>
                  Full profiles, activity feed, test results & AI context — per athlete you coach.
                </p>
              </div>
            </div>
            <p className={`font-saira text-[10px] mb-4 ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
              Example: 10 athletes → €29 + 10×€5 = <span className={`font-semibold ${isDark ? "text-zinc-300" : "text-gray-700"}`}>€79/month</span> for the whole team.
            </p>
            <a
              href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20Coach%20Plan"
              className={`block w-full rounded-xl border px-4 py-3 font-saira text-[11px] font-bold uppercase tracking-wider text-center transition ${isDark ? "border-violet-500/35 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20" : "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
            >
              Get in touch →
            </a>
          </div>
        </div>

        {/* Athlete sheet */}
        <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ""}>
          {open && <AthleteSheet a={open} />}
        </BottomSheet>
      </div>
    </DarkCtx.Provider>
  );
}
