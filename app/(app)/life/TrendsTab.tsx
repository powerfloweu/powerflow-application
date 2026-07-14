"use client";

import React from "react";
import {
  DEFAULT_THRESHOLD, movingAverage, sumMealMacros,
  progressionSeries, loggedExercises, weeklyAggregates, findInsights,
  type LifeConfig, type CheckinRow, type BodyLogRow, type WorkoutRow,
} from "@/lib/life";
import { Card } from "./shared";

interface Props {
  config: LifeConfig;
  checkins: CheckinRow[];
  body: BodyLogRow[];
  workouts: WorkoutRow[];
}

/** Line chart; optionally overlays a second (e.g. moving-average) series. */
function LineChart({ points, overlay, height = 44, unit }: {
  points: number[];
  overlay?: number[];
  height?: number;
  unit?: string;
}) {
  if (points.length < 2) return <p className="font-saira text-xs text-zinc-500">Not enough data yet.</p>;
  const w = 300;
  const all = overlay ? [...points, ...overlay] : points;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const toPath = (pts: number[]) => pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {overlay && (
          <path d={toPath(overlay)} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400/90" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <path d={toPath(points)} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400/70" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between font-saira text-[10px] text-zinc-500">
        <span>{min % 1 === 0 ? min : min.toFixed(1)}{unit}</span>
        <span>{max % 1 === 0 ? max : max.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
}

function ScoreBars({ scores, threshold }: { scores: number[]; threshold: number }) {
  if (!scores.length) return <p className="font-saira text-xs text-zinc-500">No scores yet.</p>;
  return (
    <div className="flex items-end gap-1 h-10">
      {scores.map((v, i) => (
        <div
          key={i}
          title={String(v)}
          className={`w-4 rounded-t ${v >= threshold ? "bg-emerald-400/80" : "bg-rose-400/80"}`}
          style={{ height: `${(v / 10) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function TrendsTab({ config, checkins, body, workouts }: Props) {
  // ── Weight (with 7-entry moving average) ──────────────────────────────────
  const weights = [...body]
    .filter((b) => b.weight_kg !== null)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));
  const weightVals = weights.map((b) => Number(b.weight_kg)).slice(-60);
  const weightMA = movingAverage(weightVals, 7);
  const latest = weightVals[weightVals.length - 1];

  // ── kcal vs target ────────────────────────────────────────────────────────
  const kcalTarget = config.macro_targets.kcal ?? null;
  const kcalDays = [...body]
    .filter((b) => b.meal_ids.length > 0 || b.macros)
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .slice(-30)
    .map((b) => b.macros?.kcal ?? sumMealMacros(b.meal_ids, config.meals).kcal)
    .filter((v) => v > 0);

  // ── Per-lift progression ──────────────────────────────────────────────────
  const exercises = loggedExercises(workouts);
  const [exId, setExId] = React.useState<string>("");
  const activeEx = exId || exercises[0]?.id || "";
  const series = activeEx ? progressionSeries(workouts, activeEx) : [];
  const e1rms = series.map((p) => p.e1rm);
  const bestE1rm = e1rms.length ? Math.max(...e1rms) : 0;
  const latestPoint = series[series.length - 1];

  // ── Sessions per trailing week ────────────────────────────────────────────
  const now = new Date();
  const buckets = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(now); start.setDate(now.getDate() - (i + 1) * 7);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    return workouts.filter((w) => w.completed && w.log_date > s && w.log_date <= e).length;
  }).reverse();

  // ── Insights ──────────────────────────────────────────────────────────────
  const weeks = weeklyAggregates(checkins, workouts, body);
  const insights = findInsights(weeks, config.dimensions);

  const weeklyDims = config.dimensions.filter((d) => d.cadence === "weekly");
  const dailyDims = config.dimensions.filter((d) => d.cadence === "daily");
  const scoresFor = (dimId: string, n: number): number[] =>
    [...checkins]
      .filter((c) => typeof c.scores?.[dimId] === "number")
      .sort((a, b) => a.checkin_date.localeCompare(b.checkin_date))
      .slice(-n)
      .map((c) => c.scores[dimId]);

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights.length > 0 && (
        <Card title="Patterns worth noticing">
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-sky-400 flex-shrink-0">›</span>
                <p className="font-saira text-sm text-zinc-200 leading-snug">{ins.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 font-saira text-[10px] text-zinc-500">
            Associations from your own data — exploratory, not proof of cause.
          </p>
        </Card>
      )}

      {/* Per-lift progression */}
      {exercises.length > 0 && (
        <Card
          title="Lift progression"
          action={
            <select
              value={activeEx}
              onChange={(e) => setExId(e.target.value)}
              className="rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1 font-saira text-xs text-zinc-200 outline-none max-w-[9rem]"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          }
        >
          {series.length < 2 ? (
            <p className="font-saira text-xs text-zinc-500">Log this lift on two sessions to see a trend.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-4 mb-2">
                <div>
                  <span className="font-saira text-xl font-bold text-sky-300 tabular-nums">{latestPoint.e1rm}</span>
                  <span className="font-saira text-xs text-zinc-500 ml-1">est. 1RM</span>
                </div>
                <div className="font-saira text-[11px] text-zinc-500">
                  latest {latestPoint.topWeight}kg × {latestPoint.topReps} · best {bestE1rm}
                </div>
              </div>
              <LineChart points={e1rms} unit="kg" />
            </>
          )}
        </Card>
      )}

      {/* Weight */}
      <Card title="Weight" action={latest ? (
        <span className="font-saira text-sm font-bold text-zinc-100 tabular-nums">{latest} kg</span>
      ) : undefined}>
        <LineChart points={weightVals} overlay={weightVals.length >= 4 ? weightMA : undefined} unit="kg" />
        {weightVals.length >= 4 && (
          <p className="mt-1 font-saira text-[10px] text-zinc-500">
            <span className="text-amber-400">━</span> 7-day average · <span className="text-sky-400/70">━</span> daily
          </p>
        )}
      </Card>

      {/* kcal vs target */}
      {kcalDays.length >= 2 && (
        <Card title="Calories" action={kcalTarget ? (
          <span className="font-saira text-xs text-zinc-400">target {kcalTarget}</span>
        ) : undefined}>
          <div className="flex items-end gap-1 h-24">
            {kcalDays.map((v, i) => {
              const ceiling = Math.max(kcalTarget ?? 0, ...kcalDays) * 1.05;
              const over = kcalTarget !== null && v > kcalTarget;
              return (
                <div
                  key={i}
                  title={`${Math.round(v)} kcal`}
                  className={`flex-1 rounded-t ${over ? "bg-amber-400/70" : "bg-sky-400/70"}`}
                  style={{ height: `${(v / ceiling) * 100}%` }}
                />
              );
            })}
          </div>
          {kcalTarget !== null && (
            <p className="mt-2 font-saira text-[10px] text-zinc-500">
              avg {Math.round(kcalDays.reduce((a, b) => a + b, 0) / kcalDays.length)} kcal ·
              {" "}{kcalDays.filter((v) => v <= kcalTarget).length}/{kcalDays.length} days at/under target
            </p>
          )}
        </Card>
      )}

      {/* Sessions per week */}
      <Card title="Training — completed sessions per week">
        <div className="flex items-end gap-3 h-20">
          {buckets.map((n, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="font-saira text-xs font-bold text-zinc-200 tabular-nums">{n}</span>
              <div className="w-full rounded-t bg-sky-400/70" style={{ height: `${Math.min(n / 5, 1) * 56}px` }} />
              <span className="font-saira text-[9px] text-zinc-500">{i === 3 ? "this wk" : `-${3 - i}wk`}</span>
            </div>
          ))}
        </div>
      </Card>

      {dailyDims.length > 0 && (
        <Card title="Daily pulse (last 14 answers)">
          <div className="space-y-3">
            {dailyDims.map((d) => (
              <div key={d.id}>
                <p className="font-saira text-xs text-zinc-300 mb-1">{d.label}</p>
                <ScoreBars scores={scoresFor(d.id, 14)} threshold={d.threshold ?? DEFAULT_THRESHOLD} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {weeklyDims.length > 0 && (
        <Card title="Life dimensions (last 10 answers)">
          <div className="space-y-3">
            {weeklyDims.map((d) => (
              <div key={d.id}>
                <p className="font-saira text-xs text-zinc-300 mb-1">{d.label}</p>
                <ScoreBars scores={scoresFor(d.id, 10)} threshold={d.threshold ?? DEFAULT_THRESHOLD} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
