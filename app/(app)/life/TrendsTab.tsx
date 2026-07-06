"use client";

import React from "react";
import {
  DEFAULT_THRESHOLD,
  type LifeConfig, type CheckinRow, type BodyLogRow, type WorkoutRow,
} from "@/lib/life";
import { Card } from "./shared";

interface Props {
  config: LifeConfig;
  checkins: CheckinRow[];
  body: BodyLogRow[];
  workouts: WorkoutRow[];
}

function Sparkline({ points, height = 40 }: { points: number[]; height?: number }) {
  if (points.length < 2) return <p className="font-saira text-xs text-zinc-500">Not enough data yet.</p>;
  const w = 260;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const path = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = height - ((v - min) / span) * (height - 6) - 3;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400" strokeLinecap="round" />
    </svg>
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
  // Weight — oldest → newest for the line.
  const weights = [...body]
    .filter((b) => b.weight_kg !== null)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));
  const weightVals = weights.map((b) => Number(b.weight_kg));
  const latest = weightVals[weightVals.length - 1];

  // Sessions per trailing week (4 buckets of 7 days).
  const now = new Date();
  const buckets = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(now); end.setDate(now.getDate() - i * 7);
    const start = new Date(now); start.setDate(now.getDate() - (i + 1) * 7);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    return workouts.filter((w) => w.completed && w.log_date > s && w.log_date <= e).length;
  }).reverse();

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
      <Card title="Weight" action={latest ? (
        <span className="font-saira text-sm font-bold text-zinc-100 tabular-nums">{latest} kg</span>
      ) : undefined}>
        <Sparkline points={weightVals.slice(-60)} />
        {weightVals.length >= 2 && (
          <p className="mt-1 font-saira text-[10px] text-zinc-500">
            min {Math.min(...weightVals)} · max {Math.max(...weightVals)} · {weightVals.length} entries
          </p>
        )}
      </Card>

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
