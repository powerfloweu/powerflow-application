"use client";

/**
 * /demo — Public showcase route. No login required.
 *
 * Hardcoded demo data for 4 powerlifters. All dates are computed relative
 * to the visitor's current time so the feed always looks live.
 *
 * Used for TSG (and other) demos where you want a shareable URL.
 */

import React from "react";
import BottomSheet from "@/app/components/BottomSheet";

// ─── Types ─────────────────────────────────────────────────────────────────

type Sentiment = "positive" | "neutral" | "negative";
type FeedEntry = {
  daysBack: number;
  hour?: number;
  type: "journal" | "training";
  content: string;
  sentiment?: Sentiment;
  moodRating?: number;
  wentWell?: string;
};
type TestScores = {
  csai?: { cognitive: number; somatic: number; confidence: number };
  acsi?: { total: number; confidence: number; coping: number; concentration: number; goal_setting: number };
  das?: { total: number; perfectionism: number; achievement: number; depression_prone: boolean };
  sat?: { total: number };
};
type DemoAthlete = {
  id: string;
  name: string;
  initials: string;
  gender: "male" | "female";
  federation: string;
  bw: number;
  daysToMeet: number | null;
  squat: [number, number]; // [current, goal]
  bench: [number, number];
  deadlift: [number, number];
  checkin: { mood: number; quality: number; readiness: number; energy: number; sleep: number; win: string };
  feed: FeedEntry[];
  tests: TestScores;
};

// ─── Demo data ──────────────────────────────────────────────────────────────

const ATHLETES: DemoAthlete[] = [
  {
    id: "sofia",
    name: "Sofia Mäkinen",
    initials: "SM",
    gender: "female",
    federation: "IPF",
    bw: 62.8,
    daysToMeet: 21,
    squat: [165, 182.5],
    bench: [90, 102.5],
    deadlift: [200, 222.5],
    checkin: { mood: 9, quality: 9, readiness: 9, energy: 8, sleep: 9, win: "All three openers felt easy. Ready to compete." },
    feed: [
      { daysBack: 0, hour: 8, type: "journal", sentiment: "positive",
        content: "Visualization this morning — bench arch script twice, then 20 minutes of mental competition walkthrough. I've been to that platform a hundred times in my head already. When I step out there it will feel like home." },
      { daysBack: 1, type: "training", moodRating: 8, wentWell: "Bar speed excellent — taper is working.",
        content: "Light day. Staying sharp." },
      { daysBack: 3, type: "journal", sentiment: "positive",
        content: "Opener selection session. Locked in 160 / 87.5 / 195 — all conservative but all very makeable. Confident openers set the tone. 3 weeks feels short and exactly right." },
      { daysBack: 5, type: "training", moodRating: 8, wentWell: "Opener selection was spot on.",
        content: "All three openers hit. Easy. This is going to go well." },
    ],
    tests: {
      csai: { cognitive: 14, somatic: 12, confidence: 32 },
      acsi: { total: 92, confidence: 14, coping: 12, concentration: 13, goal_setting: 14 },
      das:  { total: 36, perfectionism: 7, achievement: 8, depression_prone: false },
      sat:  { total: 117 },
    },
  },
  {
    id: "marcus",
    name: "Marcus Webb",
    initials: "MW",
    gender: "male",
    federation: "IPF",
    bw: 92.8,
    daysToMeet: 42,
    squat: [240, 262.5],
    bench: [165, 182.5],
    deadlift: [295, 320],
    checkin: { mood: 8, quality: 9, readiness: 8, energy: 8, sleep: 7, win: "Best deadlift session of prep. Visualization is working." },
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive",
        content: "Did the visualization script before deadlifts today. 10 minutes, full focus on the pull. Pulled 285 for 5 and it felt like nothing. The mental prep actually made a tangible difference — this is what I want to feel like at the meet." },
      { daysBack: 1, type: "training", moodRating: 9, wentWell: "Full focus. Everything clicked.",
        content: "Deadlift PR in training. 285×5 easy. Ready." },
      { daysBack: 3, type: "journal", sentiment: "negative",
        content: "Squat session was heavy mentally today. Couldn't switch off the noise between sets. Kept replaying the red light from my last competition. Need to get out of my own head before the meet." },
      { daysBack: 5, type: "training", moodRating: 8, wentWell: "Bar path was perfect.",
        content: "Best squat session in weeks. Everything clicked." },
    ],
    tests: {
      csai: { cognitive: 24, somatic: 16, confidence: 26 },
      acsi: { total: 78, confidence: 12, coping: 10, concentration: 9, goal_setting: 12 },
      das:  { total: 54, perfectionism: 14, achievement: 12, depression_prone: false },
      sat:  { total: 98 },
    },
  },
  {
    id: "kayla",
    name: "Kayla Ström",
    initials: "KS",
    gender: "female",
    federation: "USAPL",
    bw: 71.2,
    daysToMeet: 70,
    squat: [148, 165],
    bench: [82.5, 92.5],
    deadlift: [185, 205],
    checkin: { mood: 7, quality: 7, readiness: 7, energy: 7, sleep: 7, win: "145 squat triple — best in months. The anchoring exercise worked." },
    feed: [
      { daysBack: 1, type: "journal", sentiment: "positive",
        content: "Coach had me do the confidence anchoring exercise before the heavy squat set. Something shifted. Hit 145 for a clean triple — best in a long time. I need to bottle that and bring it every session." },
      { daysBack: 2, type: "training", moodRating: 7, wentWell: "Confidence anchoring worked. Mental shift visible.",
        content: "Best squat session in months. 145×3. Mind quiet." },
      { daysBack: 4, type: "journal", sentiment: "negative",
        content: "Missed the 82.5 bench again. Setup was right, technique was there. My brain just went blank the moment the bar started moving. I know it's mental but knowing that doesn't fix it under the bar." },
    ],
    tests: {
      csai: { cognitive: 20, somatic: 18, confidence: 22 },
      acsi: { total: 69, confidence: 7, coping: 9, concentration: 10, goal_setting: 11 },
    },
  },
  {
    id: "jake",
    name: "Jake Hartley",
    initials: "JH",
    gender: "male",
    federation: "IPF",
    bw: 82.4,
    daysToMeet: null,
    squat: [210, 232.5],
    bench: [140, 155],
    deadlift: [252.5, 275],
    checkin: { mood: 8, quality: 8, readiness: 8, energy: 7, sleep: 7, win: "227.5 squat training PR. Mental routine is paying off." },
    feed: [
      { daysBack: 0, hour: 18, type: "journal", sentiment: "positive",
        content: "227.5 squat for 2. Never done that before in training. Whatever the mental routine is doing, it's working. Starting to actually believe the goal total is within reach. Big day." },
      { daysBack: 0, type: "training", moodRating: 9, wentWell: "Mental prep was on point. Clear head.",
        content: "227.5 squat for 2. New training PR. Everything clicked." },
      { daysBack: 2, type: "journal", sentiment: "negative",
        content: "Sleep was rough. Could feel it in the warmups. Cut the session short — not because I'm soft but because grinding through junk volume builds nothing. Took the evening relaxation script instead. Woke up feeling better." },
      { daysBack: 5, type: "journal", sentiment: "neutral",
        content: "Decent session. Hit all my numbers. Nothing exceptional but consistent and solid. Maybe boring and consistent beats exciting and inconsistent every time." },
    ],
    tests: {
      das: { total: 69, perfectionism: 17, achievement: 15, depression_prone: false },
      sat: { total: 112 },
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function relDate(daysBack: number, hour = 20): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function timeLabel(daysBack: number): string {
  if (daysBack === 0) return "Today";
  if (daysBack === 1) return "Yesterday";
  return `${daysBack} days ago`;
}

function pct(current: number, goal: number) {
  return Math.min(Math.round((current / goal) * 100), 100);
}

function meetColor(days: number | null) {
  if (days === null) return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
  if (days <= 28) return "text-rose-300 bg-rose-500/10 border-rose-500/20";
  if (days <= 56) return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  return "text-blue-300 bg-blue-500/10 border-blue-500/20";
}

function sentimentDot(s?: Sentiment) {
  if (s === "positive") return "bg-emerald-400";
  if (s === "negative") return "bg-rose-400";
  return "bg-zinc-500";
}

// Score bar for CSAI / ACSI subscores
function ScoreBar({ label, value, max, highlight = false }: { label: string; value: number; max: number; highlight?: boolean }) {
  const p = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-saira text-[10px] text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className={`font-saira text-[11px] font-semibold tabular-nums ${highlight ? "text-rose-400" : "text-zinc-300"}`}>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${highlight ? "bg-rose-400" : "bg-violet-400"}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

// ─── Athlete profile sheet ──────────────────────────────────────────────────

function AthleteSheet({ athlete }: { athlete: DemoAthlete }) {
  const [tab, setTab] = React.useState<"overview" | "activity" | "tests">("overview");

  const allFeed = [...athlete.feed].sort((a, b) => {
    const da = relDate(a.daysBack, a.hour).getTime();
    const db = relDate(b.daysBack, b.hour).getTime();
    return db - da;
  });

  return (
    <div className="space-y-4">
      {/* Lift summary */}
      <div className="grid grid-cols-3 gap-2">
        {(["squat", "bench", "deadlift"] as const).map((lift) => {
          const [cur, goal] = athlete[lift];
          const p = pct(cur, goal);
          return (
            <div key={lift} className="rounded-xl bg-white/[0.04] border border-white/6 p-3">
              <p className="font-saira text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{lift}</p>
              <p className="font-saira text-base font-bold text-white">{cur} <span className="text-zinc-500 text-xs font-normal">kg</span></p>
              <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full" style={{ width: `${p}%` }} />
              </div>
              <p className="font-saira text-[9px] text-zinc-500 mt-1">Goal {goal} kg</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
        {(["overview", "activity", "tests"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 font-saira text-[11px] font-semibold uppercase tracking-wider transition ${
              tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Athlete meta */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300 font-saira">
              {athlete.bw} kg · {athlete.gender}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300 font-saira">
              {athlete.federation}
            </span>
            {athlete.daysToMeet !== null && (
              <span className={`rounded-full border px-2.5 py-1 font-saira font-semibold ${meetColor(athlete.daysToMeet)}`}>
                Meet in {athlete.daysToMeet} days
              </span>
            )}
          </div>

          {/* Latest check-in */}
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
            <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Latest weekly check-in</p>
            <div className="grid grid-cols-5 gap-1 mb-3">
              {[
                { label: "Mood", val: athlete.checkin.mood },
                { label: "Quality", val: athlete.checkin.quality },
                { label: "Readiness", val: athlete.checkin.readiness },
                { label: "Energy", val: athlete.checkin.energy },
                { label: "Sleep", val: athlete.checkin.sleep },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <div className={`text-xl font-extrabold font-saira ${val >= 8 ? "text-emerald-300" : val >= 6 ? "text-zinc-200" : "text-rose-300"}`}>
                    {val}
                  </div>
                  <div className="font-saira text-[9px] text-zinc-500 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
            <p className="font-saira text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
              <span className="text-zinc-500 mr-1">Biggest win:</span>
              {athlete.checkin.win}
            </p>
          </div>

          {/* Latest journal */}
          {allFeed.filter(e => e.type === "journal")[0] && (() => {
            const e = allFeed.filter(e => e.type === "journal")[0]!;
            return (
              <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${sentimentDot(e.sentiment)}`} />
                  <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">{timeLabel(e.daysBack)}</p>
                </div>
                <p className="font-saira text-xs text-zinc-300 leading-relaxed">{e.content}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div className="space-y-2">
          {allFeed.map((entry, i) => (
            <div key={i} className={`rounded-xl border p-3 ${
              entry.type === "training"
                ? "border-sky-500/15 bg-sky-500/5"
                : "border-violet-500/15 bg-violet-500/5"
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-widest ${
                  entry.type === "training"
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/20"
                    : "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                }`}>
                  {entry.type}
                </span>
                {entry.sentiment && (
                  <span className={`rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-widest border ${
                    entry.sentiment === "positive"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : entry.sentiment === "negative"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-white/5 text-zinc-400 border-white/10"
                  }`}>
                    {entry.sentiment}
                  </span>
                )}
                {entry.moodRating && (
                  <span className="font-saira text-[10px] text-zinc-400">Mood {entry.moodRating}/10</span>
                )}
                <span className="font-saira text-[10px] text-zinc-500 ml-auto">{timeLabel(entry.daysBack)}</span>
              </div>
              <p className="font-saira text-xs text-zinc-300 leading-relaxed">{entry.content}</p>
              {entry.wentWell && (
                <p className="font-saira text-[10px] text-emerald-400 mt-1.5">✓ {entry.wentWell}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tests */}
      {tab === "tests" && (
        <div className="space-y-4">
          {athlete.tests.csai && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-1">CSAI-2 · Competitive Anxiety</p>
              <ScoreBar label="Cognitive Anxiety" value={athlete.tests.csai.cognitive} max={36} highlight={athlete.tests.csai.cognitive >= 22} />
              <ScoreBar label="Somatic Anxiety" value={athlete.tests.csai.somatic} max={36} />
              <ScoreBar label="Self-Confidence" value={athlete.tests.csai.confidence} max={36} />
            </div>
          )}
          {athlete.tests.acsi && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <div className="flex justify-between mb-1">
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">ACSI-28 · Coping Skills</p>
                <p className="font-saira text-[11px] font-semibold text-zinc-300 tabular-nums">{athlete.tests.acsi.total}/196</p>
              </div>
              <ScoreBar label="Confidence" value={athlete.tests.acsi.confidence} max={28} highlight={athlete.tests.acsi.confidence <= 8} />
              <ScoreBar label="Coping" value={athlete.tests.acsi.coping} max={28} />
              <ScoreBar label="Concentration" value={athlete.tests.acsi.concentration} max={28} />
              <ScoreBar label="Goal Setting" value={athlete.tests.acsi.goal_setting} max={28} />
            </div>
          )}
          {athlete.tests.das && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-2.5">
              <div className="flex justify-between mb-1">
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">DAS · Dysfunctional Attitudes</p>
                <p className="font-saira text-[11px] font-semibold text-zinc-300 tabular-nums">{athlete.tests.das.total}/100</p>
              </div>
              <ScoreBar label="Perfectionism" value={athlete.tests.das.perfectionism} max={24} highlight={athlete.tests.das.perfectionism >= 14} />
              <ScoreBar label="Achievement Dep." value={athlete.tests.das.achievement} max={24} highlight={athlete.tests.das.achievement >= 14} />
              {athlete.tests.das.depression_prone && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                  <p className="font-saira text-[11px] text-rose-300">Depression-prone pattern detected — review with athlete.</p>
                </div>
              )}
            </div>
          )}
          {athlete.tests.sat && (
            <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
              <div className="flex justify-between items-center">
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500">SAT · Achievement Motivation</p>
                <p className="font-saira text-[11px] font-semibold text-zinc-300 tabular-nums">{athlete.tests.sat.total}/165</p>
              </div>
            </div>
          )}
          {!athlete.tests.csai && !athlete.tests.acsi && !athlete.tests.das && !athlete.tests.sat && (
            <p className="text-center font-saira text-sm text-zinc-500 py-4">No tests completed yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Athlete card ────────────────────────────────────────────────────────────

function AthleteCard({ athlete, onClick }: { athlete: DemoAthlete; onClick: () => void }) {
  const lastEntry = [...athlete.feed].sort((a, b) => b.daysBack - a.daysBack || (b.hour ?? 20) - (a.hour ?? 20))[0];
  const latestJournal = athlete.feed.filter(e => e.type === "journal")[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.06] active:bg-white/[0.08] transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center font-saira text-xs font-bold text-violet-300 flex-shrink-0">
          {athlete.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-saira text-sm font-semibold text-white">{athlete.name}</span>
            <span className="font-saira text-[10px] text-zinc-500">{athlete.bw} kg · {athlete.federation}</span>
            {athlete.daysToMeet !== null && (
              <span className={`ml-auto rounded-full border px-2 py-0.5 font-saira text-[9px] font-semibold uppercase tracking-wider ${meetColor(athlete.daysToMeet)}`}>
                {athlete.daysToMeet}d
              </span>
            )}
          </div>
          {/* Lift row */}
          <div className="flex gap-2 mt-1.5 text-[10px] font-saira text-zinc-400">
            <span>S {athlete.squat[0]}</span>
            <span className="text-zinc-600">·</span>
            <span>B {athlete.bench[0]}</span>
            <span className="text-zinc-600">·</span>
            <span>D {athlete.deadlift[0]}</span>
          </div>
          {/* Latest entry snippet */}
          {lastEntry && (
            <div className="mt-2 flex items-start gap-1.5">
              {latestJournal?.sentiment && (
                <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sentimentDot(latestJournal.sentiment)}`} />
              )}
              <p className="font-saira text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {lastEntry.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Activity feed item ───────────────────────────────────────────────────────

function FeedCard({ entry, athlete, onClick }: { entry: FeedEntry; athlete: DemoAthlete; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center font-saira text-[9px] font-bold text-violet-300 flex-shrink-0">
          {athlete.initials}
        </div>
        <span className="font-saira text-xs font-semibold text-zinc-200 truncate">{athlete.name}</span>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider border ${
          entry.type === "training"
            ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
            : "bg-violet-500/10 text-violet-300 border-violet-500/20"
        }`}>
          {entry.type}
        </span>
        <span className="font-saira text-[10px] text-zinc-500 ml-auto flex-shrink-0">{timeLabel(entry.daysBack)}</span>
      </div>
      <p className="font-saira text-sm text-zinc-300 leading-relaxed line-clamp-3">{entry.content}</p>
      {entry.sentiment && (
        <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider border ${
          entry.sentiment === "positive"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : entry.sentiment === "negative"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : "bg-white/5 text-zinc-400 border-white/10"
        }`}>
          {entry.sentiment}
        </span>
      )}
    </button>
  );
}

// ─── Features tab ────────────────────────────────────────────────────────────

function FeaturesTab() {
  const features = [
    { icon: "📋", title: "Daily Training Log", body: "Athletes log training vs rest, mood rating, what went well, and frustrations. Coaches see all of it in real time." },
    { icon: "✏️", title: "Mental Performance Journal", body: "Quick thought entries with automatic sentiment analysis. Patterns and themes surface across weeks." },
    { icon: "📊", title: "Weekly Check-ins", body: "5 key ratings every week: mood, training quality, readiness, energy, sleep. Monthly deep-dives every 4th week." },
    { icon: "🧠", title: "4 Validated Tests", body: "CSAI-2 (competitive anxiety), ACSI-28 (coping skills), DAS (dysfunctional attitudes), SAT (achievement motivation). Assign from the dashboard, results appear instantly." },
    { icon: "🤖", title: "Coach AI", body: "Reads every journal entry and check-in before responding. Generates visualization scripts in the coach's voice. Flags rumination, outcome fixation, self-sabotage cycles." },
    { icon: "🎧", title: "Visualization & Audio", body: "Pre-built guided scripts for squat, bench, deadlift, and competition day. AI-generated personal scripts. Background playback on lock screen." },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {features.map((f) => (
        <div key={f.title} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
          <div className="text-2xl mb-2">{f.icon}</div>
          <p className="font-saira text-sm font-semibold text-white mb-1">{f.title}</p>
          <p className="font-saira text-xs text-zinc-400 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [tab, setTab] = React.useState<"athletes" | "activity" | "features">("athletes");
  const [openAthlete, setOpenAthlete] = React.useState<DemoAthlete | null>(null);

  // Build combined feed sorted by date descending
  const feedItems = ATHLETES.flatMap((a) =>
    a.feed.map((e) => ({ entry: e, athlete: a }))
  ).sort((a, b) => {
    const da = relDate(a.entry.daysBack, a.entry.hour).getTime();
    const db = relDate(b.entry.daysBack, b.entry.hour).getTime();
    return db - da;
  });

  const priority = ATHLETES.filter((a) => a.daysToMeet !== null && a.daysToMeet <= 56);
  const others   = ATHLETES.filter((a) => a.daysToMeet === null || a.daysToMeet > 56);

  return (
    <div className="min-h-screen bg-surface-base text-white pb-24 font-saira">
      {/* Gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.08),transparent_55%)]" />
      </div>

      {/* Demo banner */}
      <div className="relative z-20 bg-violet-600/20 border-b border-violet-500/20 px-4 py-2 text-center">
        <p className="font-saira text-[11px] font-semibold uppercase tracking-widest text-violet-300">
          Demo Mode · Sample data · Not a real athlete roster
        </p>
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 pt-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-400">
              PowerFlow · Coach
            </p>
            <h1 className="mt-1 font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
              Dashboard
            </h1>
          </div>
          <div className="text-right">
            <p className="font-saira text-xs text-zinc-400">{ATHLETES.length} athletes</p>
            <p className="font-saira text-[10px] text-zinc-500">{feedItems.length} entries this week</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1 mb-5">
          {(["athletes", "activity", "features"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 font-saira text-[11px] font-semibold uppercase tracking-wider transition ${
                tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Athletes tab */}
        {tab === "athletes" && (
          <div className="space-y-5">
            {priority.length > 0 && (
              <div>
                <p className="font-saira text-[10px] uppercase tracking-widest text-rose-400 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  Priority — Meet within 8 weeks
                </p>
                <div className="space-y-2">
                  {priority.map((a) => (
                    <AthleteCard key={a.id} athlete={a} onClick={() => setOpenAthlete(a)} />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="font-saira text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
                  Active
                </p>
                <div className="space-y-2">
                  {others.map((a) => (
                    <AthleteCard key={a.id} athlete={a} onClick={() => setOpenAthlete(a)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity tab */}
        {tab === "activity" && (
          <div className="space-y-3">
            {feedItems.map(({ entry, athlete }, i) => (
              <FeedCard
                key={i}
                entry={entry}
                athlete={athlete}
                onClick={() => setOpenAthlete(athlete)}
              />
            ))}
          </div>
        )}

        {/* Features tab */}
        {tab === "features" && <FeaturesTab />}

        {/* CTA footer */}
        <div className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
          <p className="font-saira text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">
            Want this for your athletes?
          </p>
          <p className="font-saira text-sm text-zinc-300 mb-4 leading-relaxed">
            PowerFlow gives every coach a real-time mental performance dashboard — check-ins, journals, tests, and AI coaching in one place.
          </p>
          <a
            href="mailto:trainer.pod@gmail.com?subject=PowerFlow%20demo%20request"
            className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 font-saira text-sm font-semibold uppercase tracking-wider text-white transition"
          >
            Get in Touch
          </a>
          <p className="mt-3 font-saira text-[10px] text-zinc-600">powerflow.training</p>
        </div>
      </div>

      {/* Athlete sheet */}
      <BottomSheet
        open={openAthlete !== null}
        onClose={() => setOpenAthlete(null)}
        title={openAthlete?.name ?? ""}
      >
        {openAthlete && <AthleteSheet athlete={openAthlete} />}
      </BottomSheet>
    </div>
  );
}
