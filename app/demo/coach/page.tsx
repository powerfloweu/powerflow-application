"use client";

import React from "react";
import Link from "next/link";
import BottomSheet from "@/app/components/BottomSheet";

// ─── Types ──────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "neutral" | "negative";
type FeedEntry = {
  daysBack: number; hour?: number;
  type: "journal" | "training";
  content: string;
  sentiment?: Sentiment;
  moodRating?: number;
  wentWell?: string;
};
type DemoAthlete = {
  id: string; name: string; initials: string;
  gender: "male" | "female"; federation: string; bw: number;
  daysToMeet: number | null;
  squat: [number, number]; bench: [number, number]; deadlift: [number, number];
  checkin: { mood: number; quality: number; readiness: number; energy: number; sleep: number; win: string };
  feed: FeedEntry[];
  affirmations: string[];
  vizKeywords: { squat: string[]; bench: string[]; deadlift: string[] };
  coachNote: string;
  topics: string[];
  tests: {
    csai?: { cognitive: number; somatic: number; confidence: number };
    acsi?: { total: number; confidence: number; coping: number; concentration: number; goal_setting: number };
    das?:  { total: number; perfectionism: number; achievement: number; depression_prone: boolean };
    sat?:  { total: number };
  };
};

// ─── Demo data ───────────────────────────────────────────────────────────────

const ATHLETES: DemoAthlete[] = [
  {
    id: "sofia", name: "Sofia Mäkinen", initials: "SM", gender: "female", federation: "IPF", bw: 62.8, daysToMeet: 21,
    squat: [165, 182.5], bench: [90, 102.5], deadlift: [200, 222.5],
    checkin: { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 9, win: "All three openers felt easy. Ready to compete." },
    affirmations: ["I belong on this platform.", "My preparation is complete.", "I compete for myself."],
    vizKeywords: { squat: ["deep", "tight", "explode"], bench: ["arch", "leg drive", "locked"], deadlift: ["patient", "hips through", "finish"] },
    coachNote: "Sofia is peaking perfectly. Mental game is her strength. Focus on keeping arousal controlled — she can over-activate. Opener day went flawlessly.",
    topics: ["Arousal regulation on meet day", "Handling crowd noise", "Second attempt selection strategy"],
    feed: [
      { daysBack: 0, hour: 8, type: "journal", sentiment: "positive", content: "Visualization this morning — bench arch script twice, then 20 min mental competition walkthrough. I've been to that platform a hundred times in my head. When I step out there it will feel like home." },
      { daysBack: 1, type: "training", moodRating: 8, wentWell: "Bar speed excellent — taper working.", content: "Light day. Staying sharp." },
      { daysBack: 3, type: "journal", sentiment: "positive", content: "Opener selection locked in. 160/87.5/195 — conservative and very makeable. 3 weeks feels short and exactly right." },
    ],
    tests: {
      csai: { cognitive: 14, somatic: 12, confidence: 32 },
      acsi: { total: 92, confidence: 14, coping: 12, concentration: 13, goal_setting: 14 },
      das:  { total: 36, perfectionism: 7, achievement: 8, depression_prone: false },
      sat:  { total: 117 },
    },
  },
  {
    id: "marcus", name: "Marcus Webb", initials: "MW", gender: "male", federation: "IPF", bw: 92.8, daysToMeet: 42,
    squat: [240, 262.5], bench: [165, 182.5], deadlift: [295, 320],
    checkin: { mood: 8, quality: 9, readiness: 8, energy: 8, sleep: 7, win: "Best deadlift session of prep. Visualization is working." },
    affirmations: ["The bar is mine.", "I trust my training completely.", "I thrive under pressure."],
    vizKeywords: { squat: ["braced", "vertical", "drive"], bench: ["pause", "explode", "lockout"], deadlift: ["lat spread", "hips hinge", "pull through"] },
    coachNote: "Marcus has high cognitive anxiety pre-competition — CSAI confirms it (24/36). Visualization is helping. Watch for red-light rumination as meet gets closer. Keep pre-set routine consistent.",
    topics: ["Competition anxiety management — 3 negative journal entries", "Pre-set routine for squat", "Reframing past red light as learning"],
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive", content: "Did the visualization script before deadlifts. 10 min, full focus on the pull. 285×5 and it felt like nothing. The mental prep made a tangible difference." },
      { daysBack: 3, type: "journal", sentiment: "negative", content: "Squat session was heavy mentally. Kept replaying the red light from my last competition. Need to get out of my own head." },
    ],
    tests: {
      csai: { cognitive: 24, somatic: 16, confidence: 26 },
      acsi: { total: 78, confidence: 12, coping: 10, concentration: 9, goal_setting: 12 },
      das:  { total: 54, perfectionism: 14, achievement: 12, depression_prone: false },
      sat:  { total: 98 },
    },
  },
  {
    id: "alex", name: "Alex Morrison", initials: "AM", gender: "male", federation: "IPF", bw: 82.6, daysToMeet: 56,
    squat: [220, 247.5], bench: [152.5, 170], deadlift: [272.5, 300],
    checkin: { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 8, win: "237.5 squat. Visualization script working. Feeling ready." },
    affirmations: ["I am strong and prepared.", "I trust my training.", "The platform is where I belong."],
    vizKeywords: { squat: ["strong", "explosive", "locked in"], bench: ["smooth", "confident"], deadlift: ["strong", "explosive", "patient"] },
    coachNote: "Alex responds well to process-focused cues. Tendency to outcome-fixate pre-competition. Visualization (deadlift) is working — PR in training this week. Watch for anxiety spike as meet approaches.",
    topics: ["Opener fixation — journal entry today", "Process vs outcome framing", "Deadlift activation anchor"],
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive", content: "237.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to believe the goal total is within reach." },
      { daysBack: 2, type: "training", moodRating: 9, wentWell: "Mental prep on point. Clear head.", content: "237.5 squat × 2. New training PR. Everything clicked." },
      { daysBack: 0, type: "journal", sentiment: "neutral", content: "Been fixating on opener numbers. Trying to remind myself — I pick the number, the number doesn't pick me." },
    ],
    tests: {
      csai: { cognitive: 18, somatic: 14, confidence: 29 },
      acsi: { total: 86, confidence: 13, coping: 11, concentration: 12, goal_setting: 13 },
      das:  { total: 44, perfectionism: 11, achievement: 10, depression_prone: false },
      sat:  { total: 113 },
    },
  },
  {
    id: "kayla", name: "Kayla Ström", initials: "KS", gender: "female", federation: "USAPL", bw: 74.6, daysToMeet: 70,
    squat: [148, 165], bench: [82.5, 92.5], deadlift: [185, 205],
    checkin: { mood: 7, quality: 7, readiness: 7, energy: 7, sleep: 7, win: "145 squat triple — best in months. Anchoring exercise worked." },
    affirmations: ["I am capable of more than I think.", "Confidence is a skill I am building.", "Every session makes me stronger."],
    vizKeywords: { squat: ["confident", "depth", "drive"], bench: ["set up", "own it", "press"], deadlift: ["strong", "smooth pull"] },
    coachNote: "Kayla has a confidence block on bench that's psychological, not technical. ACSI confidence subscale is low (7/28). Anchoring exercise showed real progress on squat. Apply same approach to bench next block.",
    topics: ["Bench confidence block — try anchoring protocol", "ACSI confidence subscale (7/28 — flag)", "Progress on squat anchoring to build on"],
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive", content: "Coach had me do the confidence anchoring before the heavy squat. Something shifted. Hit 145 for a clean triple. Need to bottle that." },
      { daysBack: 4, type: "journal", sentiment: "negative", content: "Missed the 82.5 bench again. Setup was right, technique was there. My brain just went blank the moment the bar started moving." },
    ],
    tests: {
      csai: { cognitive: 20, somatic: 18, confidence: 22 },
      acsi: { total: 69, confidence: 7, coping: 9, concentration: 10, goal_setting: 11 },
    },
  },
  {
    id: "jake", name: "Jake Hartley", initials: "JH", gender: "male", federation: "IPF", bw: 82.4, daysToMeet: null,
    squat: [210, 232.5], bench: [140, 155], deadlift: [252.5, 275],
    checkin: { mood: 8, quality: 8, readiness: 8, energy: 7, sleep: 7, win: "227.5 squat training PR. Mental routine paying off." },
    affirmations: ["Progress over perfection.", "I show up and do the work.", "Good enough today builds great tomorrow."],
    vizKeywords: { squat: ["process", "consistent", "trust"], bench: ["simple", "controlled", "finish"], deadlift: ["grounded", "pull hard"] },
    coachNote: "Jake has a perfectionism pattern (DAS score: 17/24 on perfectionism). Needs to separate performance from self-worth. Respond well to 'process over outcome' framing. Set a meet date — he's ready.",
    topics: ["DAS perfectionism flag (17/24) — needs addressing", "Set a meet date — performance is there", "Separating identity from training outcome"],
    feed: [
      { daysBack: 0, hour: 18, type: "journal", sentiment: "positive", content: "227.5 squat for 2. Never done that before. The mental routine is working. Starting to believe the goal total is within reach." },
      { daysBack: 2, type: "journal", sentiment: "negative", content: "Sleep was rough. Cut the session short — not because I'm soft but because junk volume builds nothing. Evening relaxation script. Woke up better." },
    ],
    tests: {
      das: { total: 69, perfectionism: 17, achievement: 15, depression_prone: false },
      sat: { total: 112 },
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relDate(d: number, h = 20) { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x; }
function timeLabel(d: number) { return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`; }
function pct(c: number, g: number) { return Math.min(Math.round((c / g) * 100), 100); }
function meetColor(d: number | null) {
  if (d === null) return "text-zinc-500 border-zinc-600/30 bg-zinc-500/10";
  if (d <= 28)   return "text-rose-300 border-rose-500/30 bg-rose-500/10";
  if (d <= 56)   return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-blue-300 border-blue-500/30 bg-blue-500/10";
}
function sdot(s?: Sentiment) { return s === "positive" ? "bg-emerald-400" : s === "negative" ? "bg-rose-400" : "bg-zinc-500"; }

function ScoreBar({ label, value, max, hi = false }: { label: string; value: number; max: number; hi?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-saira text-[10px] text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className={`font-saira text-[11px] font-semibold tabular-nums ${hi ? "text-rose-400" : "text-zinc-300"}`}>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${hi ? "bg-rose-400" : "bg-violet-400"}`} style={{ width: `${pct(value, max)}%` }} />
      </div>
    </div>
  );
}

// ─── Athlete sheet ────────────────────────────────────────────────────────────

function AthleteSheet({ a }: { a: DemoAthlete }) {
  const [tab, setTab] = React.useState<"overview" | "tools" | "activity" | "tests">("overview");
  const feed = [...a.feed].sort((x, y) => relDate(y.daysBack, y.hour).getTime() - relDate(x.daysBack, x.hour).getTime());

  return (
    <div className="space-y-4">
      {/* Lifts */}
      <div className="grid grid-cols-3 gap-2">
        {(["squat", "bench", "deadlift"] as const).map((lift) => {
          const [cur, goal] = a[lift];
          return (
            <div key={lift} className="rounded-xl bg-white/[0.04] border border-white/6 p-3">
              <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{lift}</p>
              <p className="font-saira text-base font-bold text-white">{cur} <span className="text-zinc-500 text-xs font-normal">kg</span></p>
              <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct(cur, goal)}%` }} />
              </div>
              <p className="font-saira text-[9px] text-zinc-500 mt-1">Goal {goal} kg</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white/[0.03] rounded-xl p-1">
        {(["overview", "tools", "activity", "tests"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 font-saira text-[10px] font-semibold uppercase tracking-wider transition ${tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {t === "tools" ? "Coach" : t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-saira text-[11px] text-zinc-300">{a.bw} kg · {a.gender}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-saira text-[11px] text-zinc-300">{a.federation}</span>
            {a.daysToMeet !== null && (
              <span className={`rounded-full border px-2.5 py-1 font-saira text-[11px] font-semibold ${meetColor(a.daysToMeet)}`}>Meet in {a.daysToMeet} days</span>
            )}
          </div>
          {/* Check-in */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Latest weekly check-in</p>
            <div className="grid grid-cols-5 gap-1 mb-3">
              {[["Mood", a.checkin.mood], ["Quality", a.checkin.quality], ["Ready", a.checkin.readiness], ["Energy", a.checkin.energy], ["Sleep", a.checkin.sleep]].map(([l, v]) => (
                <div key={l as string} className="text-center">
                  <div className={`text-xl font-extrabold font-saira ${Number(v) >= 8 ? "text-emerald-300" : Number(v) >= 6 ? "text-zinc-200" : "text-rose-300"}`}>{v}</div>
                  <div className="font-saira text-[9px] text-zinc-500 uppercase tracking-wide">{l}</div>
                </div>
              ))}
            </div>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
              <span className="text-zinc-500 mr-1">Biggest win:</span>{a.checkin.win}
            </p>
          </div>
          {/* Latest journal */}
          {feed.filter(e => e.type === "journal")[0] && (() => {
            const e = feed.filter(e => e.type === "journal")[0]!;
            return (
              <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${sdot(e.sentiment)}`} />
                  <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">{timeLabel(e.daysBack)}</p>
                </div>
                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{e.content}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Coach tools */}
      {tab === "tools" && (
        <div className="space-y-3">
          {/* Topics to discuss */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-amber-400 mb-2">Topics to discuss</p>
            <div className="space-y-1.5">
              {a.topics.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 text-[10px] mt-0.5 flex-shrink-0">◆</span>
                  <p className="font-saira text-xs text-zinc-300">{t}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Coach note */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Private coach notes</p>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed italic">"{a.coachNote}"</p>
          </div>
          {/* Affirmations */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Affirmations</p>
            <div className="space-y-1.5">
              {a.affirmations.map((aff, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold text-[11px] flex-shrink-0">{i + 1}.</span>
                  <p className="font-saira text-xs text-zinc-200">{aff}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Viz keywords */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Visualization keywords</p>
            {(["squat", "bench", "deadlift"] as const).map((lift) => (
              <div key={lift} className="flex items-start gap-2 mb-2">
                <span className="font-saira text-[10px] text-zinc-500 uppercase w-14 flex-shrink-0 mt-0.5">{lift}</span>
                <div className="flex flex-wrap gap-1">
                  {a.vizKeywords[lift].map((kw) => (
                    <span key={kw} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-saira text-[10px] text-violet-300">{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div className="space-y-2">
          {feed.map((e, i) => (
            <div key={i} className={`rounded-xl border p-3 ${e.type === "training" ? "border-sky-500/15 bg-sky-500/5" : "border-violet-500/15 bg-violet-500/5"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-widest border ${e.type === "training" ? "bg-sky-500/15 text-sky-300 border-sky-500/20" : "bg-violet-500/15 text-violet-300 border-violet-500/20"}`}>{e.type}</span>
                {e.sentiment && <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] border ${e.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : e.sentiment === "negative" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-white/5 text-zinc-400 border-white/10"}`}>{e.sentiment}</span>}
                {e.moodRating && <span className="font-saira text-[10px] text-zinc-400">Mood {e.moodRating}/10</span>}
                <span className="font-saira text-[10px] text-zinc-500 ml-auto">{timeLabel(e.daysBack)}</span>
              </div>
              <p className="font-saira text-xs text-zinc-300 leading-relaxed">{e.content}</p>
              {e.wentWell && <p className="font-saira text-[10px] text-emerald-400 mt-1.5">✓ {e.wentWell}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Tests */}
      {tab === "tests" && (
        <div className="space-y-3">
          {a.tests.csai && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-1">CSAI-2 · Competitive Anxiety</p>
              <ScoreBar label="Cognitive Anxiety" value={a.tests.csai.cognitive} max={36} hi={a.tests.csai.cognitive >= 22} />
              <ScoreBar label="Somatic Anxiety"   value={a.tests.csai.somatic}   max={36} />
              <ScoreBar label="Self-Confidence"   value={a.tests.csai.confidence} max={36} />
            </div>
          )}
          {a.tests.acsi && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <div className="flex justify-between mb-1">
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">ACSI-28 · Coping Skills</p>
                <p className="font-saira text-[11px] font-semibold text-zinc-300">{a.tests.acsi.total}/196</p>
              </div>
              <ScoreBar label="Confidence"  value={a.tests.acsi.confidence}  max={28} hi={a.tests.acsi.confidence <= 8} />
              <ScoreBar label="Coping"      value={a.tests.acsi.coping}      max={28} />
              <ScoreBar label="Concentration" value={a.tests.acsi.concentration} max={28} />
              <ScoreBar label="Goal Setting" value={a.tests.acsi.goal_setting} max={28} />
            </div>
          )}
          {a.tests.das && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <div className="flex justify-between mb-1">
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">DAS · Dysfunctional Attitudes</p>
                <p className="font-saira text-[11px] font-semibold text-zinc-300">{a.tests.das.total}/100</p>
              </div>
              <ScoreBar label="Perfectionism"    value={a.tests.das.perfectionism} max={24} hi={a.tests.das.perfectionism >= 14} />
              <ScoreBar label="Achievement Dep." value={a.tests.das.achievement}   max={24} hi={a.tests.das.achievement >= 14} />
              {a.tests.das.depression_prone && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                  <p className="font-saira text-[11px] text-rose-300">Depression-prone pattern — review with athlete.</p>
                </div>
              )}
            </div>
          )}
          {a.tests.sat && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3 flex justify-between items-center">
              <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">SAT · Achievement Motivation</p>
              <p className="font-saira text-[11px] font-semibold text-zinc-300">{a.tests.sat.total}/165</p>
            </div>
          )}
          {!a.tests.csai && !a.tests.acsi && !a.tests.das && !a.tests.sat && (
            <p className="text-center font-saira text-sm text-zinc-500 py-4">No tests completed yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Athlete card ─────────────────────────────────────────────────────────────

function AthleteCard({ a, onClick }: { a: DemoAthlete; onClick: () => void }) {
  const latest = a.feed.filter(e => e.type === "journal")[0];
  const hasFlag = a.topics.some(t => t.toLowerCase().includes("flag") || t.toLowerCase().includes("block") || t.toLowerCase().includes("anxiety") || t.toLowerCase().includes("fixat"));
  return (
    <button type="button" onClick={onClick} className="w-full text-left rounded-2xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.06] active:scale-[0.99] transition-all">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center font-saira text-xs font-bold text-violet-300">
            {a.initials}
          </div>
          {hasFlag && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0A0A0A]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-saira text-sm font-semibold text-white">{a.name}</span>
            <span className="font-saira text-[10px] text-zinc-500">{a.bw} kg · {a.federation}</span>
            {a.daysToMeet !== null && (
              <span className={`ml-auto rounded-full border px-2 py-0.5 font-saira text-[9px] font-semibold uppercase tracking-wider ${meetColor(a.daysToMeet)}`}>{a.daysToMeet}d</span>
            )}
          </div>
          <div className="flex gap-2 mt-1 text-[10px] font-saira text-zinc-400">
            <span>S {a.squat[0]}</span><span className="text-zinc-600">·</span>
            <span>B {a.bench[0]}</span><span className="text-zinc-600">·</span>
            <span>D {a.deadlift[0]}</span>
          </div>
          {latest && (
            <div className="mt-1.5 flex items-start gap-1.5">
              <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sdot(latest.sentiment)}`} />
              <p className="font-saira text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{latest.content}</p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function FeedCard({ entry: e, athlete: a, onClick }: { entry: FeedEntry; athlete: DemoAthlete; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left rounded-2xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center font-saira text-[9px] font-bold text-violet-300 flex-shrink-0">{a.initials}</div>
        <span className="font-saira text-xs font-semibold text-zinc-200 truncate">{a.name}</span>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider border ${e.type === "training" ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : "bg-violet-500/10 text-violet-300 border-violet-500/20"}`}>{e.type}</span>
        <span className="font-saira text-[10px] text-zinc-500 ml-auto">{timeLabel(e.daysBack)}</span>
      </div>
      <p className="font-saira text-sm text-zinc-300 leading-relaxed line-clamp-3">{e.content}</p>
      {e.sentiment && <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-saira text-[9px] border ${e.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : e.sentiment === "negative" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-white/5 text-zinc-400 border-white/10"}`}>{e.sentiment}</span>}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoCoach() {
  const [tab, setTab]             = React.useState<"athletes" | "activity">("athletes");
  const [open, setOpen]           = React.useState<DemoAthlete | null>(null);

  const allFeed = ATHLETES.flatMap(a => a.feed.map(e => ({ entry: e, athlete: a })))
    .sort((x, y) => relDate(y.entry.daysBack, y.entry.hour).getTime() - relDate(x.entry.daysBack, x.entry.hour).getTime());

  const priority = ATHLETES.filter(a => a.daysToMeet !== null && a.daysToMeet <= 56);
  const others   = ATHLETES.filter(a => a.daysToMeet === null || a.daysToMeet > 56);

  return (
    /* Outer shell — dark desktop backdrop */
    <div className="min-h-screen bg-[#060606] sm:flex sm:items-start sm:justify-center sm:py-10 font-saira">
      {/* Phone frame */}
      <div className="w-full sm:w-[390px] sm:min-h-[820px] sm:rounded-[44px] sm:border-[7px] sm:border-zinc-800 sm:shadow-[0_32px_120px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] bg-[#0A0A0A] overflow-hidden relative flex flex-col">

        {/* Demo banner */}
        <div className="bg-violet-600/20 border-b border-violet-500/20 px-4 py-1.5 text-center flex-shrink-0">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-widest text-violet-300">Demo · Coach View</p>
        </div>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.28em] text-violet-400">PowerFlow · Coach</p>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">Dashboard</h1>
          </div>
          <div className="text-right">
            <p className="font-saira text-xs text-zinc-400">{ATHLETES.length} athletes</p>
            <Link href="/demo" className="font-saira text-[10px] text-zinc-600 hover:text-zinc-400 transition">← Overview</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1">
            {(["athletes", "activity"] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 font-saira text-[11px] font-semibold uppercase tracking-wider transition ${tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">

          {/* Athletes */}
          {tab === "athletes" && (
            <div className="space-y-5">
              {priority.length > 0 && (
                <div>
                  <p className="font-saira text-[10px] uppercase tracking-widest text-rose-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                    Priority — Meet within 8 weeks
                  </p>
                  <div className="space-y-2">{priority.map(a => <AthleteCard key={a.id} a={a} onClick={() => setOpen(a)} />)}</div>
                </div>
              )}
              {others.length > 0 && (
                <div>
                  <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
                    Active
                  </p>
                  <div className="space-y-2">{others.map(a => <AthleteCard key={a.id} a={a} onClick={() => setOpen(a)} />)}</div>
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          {tab === "activity" && (
            <div className="space-y-3">
              {allFeed.map(({ entry: e, athlete: a }, i) => <FeedCard key={i} entry={e} athlete={a} onClick={() => setOpen(a)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA — desktop only */}
      <div className="hidden sm:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <a href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20enquiry" className="inline-block rounded-xl bg-violet-600/80 hover:bg-violet-600 px-6 py-2.5 font-saira text-xs font-bold uppercase tracking-widest text-white transition">
          Get in touch →
        </a>
      </div>

      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && <AthleteSheet a={open} />}
      </BottomSheet>
    </div>
  );
}
