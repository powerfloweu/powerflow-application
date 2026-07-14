"use client";

import React from "react";
import {
  schemeForWeek,
  type LifePlan, type PlanStructure, type PlanExercise, type WorkoutRow,
} from "@/lib/life";
import { Card, TextInput, PrimaryButton, GhostButton } from "./shared";

interface Props {
  plan: LifePlan | null;
  workouts: WorkoutRow[];
  patchPlan: (patch: { id: string; structure?: PlanStructure; current_week?: number; name?: string }) => Promise<boolean>;
  createPlan: (name: string, structure: PlanStructure) => Promise<boolean>;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `ex-${Math.random().toString(36).slice(2, 7)}`;
}

const EMPTY_STRUCTURE: PlanStructure = {
  weeks: 3,
  days: [{ key: "A", name: "Day A", exercises: [] }],
};

export default function PlanTab({ plan, workouts, patchPlan, createPlan }: Props) {
  const [draft, setDraft] = React.useState<PlanStructure | null>(null);
  const [saving, setSaving] = React.useState(false);
  const structure = draft ?? plan?.structure ?? null;
  const dirty = draft !== null;

  const edit = (fn: (s: PlanStructure) => PlanStructure) => {
    setDraft((prev) => fn(structuredClone(prev ?? plan!.structure)));
  };

  const editExercise = (dayIdx: number, exIdx: number, patch: Partial<PlanExercise>) => {
    edit((s) => {
      const ex = s.days[dayIdx].exercises[exIdx];
      s.days[dayIdx].exercises[exIdx] = { ...ex, ...patch };
      return s;
    });
  };

  const setSchemeWeek = (dayIdx: number, exIdx: number, week: number, text: string) => {
    edit((s) => {
      const ex = s.days[dayIdx].exercises[exIdx];
      const scheme: Record<string, string> =
        typeof ex.scheme === "string" ? { "1": ex.scheme } : { ...ex.scheme };
      scheme[String(week)] = text;
      ex.scheme = scheme;
      return s;
    });
  };

  const toggleWave = (dayIdx: number, exIdx: number) => {
    edit((s) => {
      const ex = s.days[dayIdx].exercises[exIdx];
      if (typeof ex.scheme === "string") {
        const base = ex.scheme;
        const map: Record<string, string> = {};
        for (let w = 1; w <= s.weeks; w++) map[String(w)] = base;
        ex.scheme = map;
      } else {
        ex.scheme = Object.values(ex.scheme)[0] ?? "";
      }
      return s;
    });
  };

  const save = async () => {
    if (!plan || !draft) return;
    setSaving(true);
    const ok = await patchPlan({ id: plan.id, structure: draft });
    setSaving(false);
    if (ok) setDraft(null);
  };

  const setWeek = async (w: number) => {
    if (!plan) return;
    await patchPlan({ id: plan.id, current_week: w });
  };

  // Adherence: completed sessions in the last 7 days.
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const cutoff = weekAgo.toISOString().slice(0, 10);
  const completedThisWeek = workouts.filter((w) => w.completed && w.log_date >= cutoff).length;

  if (!plan) {
    return (
      <Card title="No active plan">
        <p className="font-saira text-sm text-zinc-400 mb-3">Create a training block to start logging.</p>
        <PrimaryButton onClick={() => createPlan("New block", EMPTY_STRUCTURE)}>Create plan</PrimaryButton>
      </Card>
    );
  }

  // All days completed this week → offer to advance.
  const planDayKeys = (structure?.days ?? []).map((d) => d.key);
  const doneDayKeys = new Set(
    workouts.filter((w) => w.completed && w.week_number === plan.current_week).map((w) => w.day_key),
  );
  const allDaysDone = planDayKeys.length > 0 && planDayKeys.every((k) => doneDayKeys.has(k));
  const canAdvance = allDaysDone && plan.current_week < (structure?.weeks ?? 1);

  return (
    <div className="space-y-4">
      {/* Advance-week prompt */}
      {canAdvance && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] p-4 flex items-center justify-between gap-3">
          <p className="font-saira text-sm text-emerald-200">
            All {planDayKeys.length} sessions done for week {plan.current_week} 🎉
          </p>
          <PrimaryButton onClick={() => setWeek(plan.current_week + 1)} className="flex-shrink-0">
            Advance to week {plan.current_week + 1}
          </PrimaryButton>
        </div>
      )}

      {/* Week + adherence */}
      <Card title={plan.name}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-saira text-sm text-zinc-300">Week</p>
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setWeek(Math.max(1, plan.current_week - 1))}>−</GhostButton>
              <span className="font-saira text-lg font-bold text-sky-300 tabular-nums w-8 text-center">
                {plan.current_week}
              </span>
              <GhostButton onClick={() => setWeek(Math.min(structure?.weeks ?? 99, plan.current_week + 1))}>+</GhostButton>
              <span className="font-saira text-xs text-zinc-500">of {structure?.weeks}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-saira text-lg font-bold text-zinc-100 tabular-nums">{completedThisWeek}</p>
            <p className="font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-500">sessions last 7d</p>
          </div>
        </div>
      </Card>

      {/* Structure editor */}
      {structure && structure.days.map((day, di) => (
        <Card
          key={day.key}
          title={day.name}
          action={
            <button
              type="button"
              onClick={() => edit((s) => { s.days[di].exercises.push({ id: slugify(`new-${Date.now() % 10000}`), name: "", type: "accessory", scheme: "" }); return s; })}
              className="font-saira text-[11px] text-sky-300 hover:text-sky-200"
            >
              + exercise
            </button>
          }
        >
          <div className="space-y-3">
            {day.exercises.map((ex, ei) => {
              const isWave = typeof ex.scheme !== "string";
              return (
                <div key={ex.id} className="rounded-xl border border-white/8 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TextInput
                      value={ex.name}
                      onChange={(v) => editExercise(di, ei, { name: v, id: ex.id })}
                      placeholder="Exercise name"
                      className="flex-1"
                    />
                    <select
                      value={ex.type}
                      onChange={(e) => editExercise(di, ei, { type: e.target.value as "main" | "accessory" })}
                      className="rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1.5 font-saira text-xs text-zinc-300 outline-none"
                    >
                      <option value="main">main</option>
                      <option value="accessory">accessory</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => edit((s) => { s.days[di].exercises.splice(ei, 1); return s; })}
                      className="text-zinc-600 hover:text-rose-400 font-saira px-1"
                      aria-label="Remove exercise"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <label className="flex items-center gap-1.5 font-saira text-[10px] text-zinc-500 pt-2 flex-shrink-0 cursor-pointer">
                      <input type="checkbox" checked={isWave} onChange={() => toggleWave(di, ei)} className="accent-sky-400" />
                      per-week
                    </label>
                    {isWave ? (
                      <div className="flex-1 space-y-1.5">
                        {Array.from({ length: structure.weeks }, (_, i) => i + 1).map((w) => (
                          <div key={w} className="flex items-center gap-2">
                            <span className="font-saira text-[10px] text-zinc-500 w-8">Wk {w}</span>
                            <TextInput
                              value={schemeForWeek(ex.scheme, w)}
                              onChange={(v) => setSchemeWeek(di, ei, w, v)}
                              placeholder="e.g. 7 / 5 / 3"
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <TextInput
                        value={ex.scheme as string}
                        onChange={(v) => editExercise(di, ei, { scheme: v })}
                        placeholder="e.g. 4 x 8 @ RPE 7"
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex gap-2">
        <GhostButton onClick={() => edit((s) => {
          const key = String.fromCharCode(65 + s.days.length); // A, B, C, D…
          s.days.push({ key, name: `Day ${key}`, exercises: [] });
          return s;
        })}>
          + add day
        </GhostButton>
        {dirty && (
          <>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save plan"}
            </PrimaryButton>
            <GhostButton onClick={() => setDraft(null)}>Discard changes</GhostButton>
          </>
        )}
      </div>

      {/* Recent sessions */}
      <Card title="Recent sessions">
        {workouts.length === 0 ? (
          <p className="font-saira text-sm text-zinc-400">Nothing logged yet.</p>
        ) : (
          <div className="space-y-1.5">
            {workouts.slice(0, 12).map((w) => {
              const setCount = w.entries.reduce((n, e) => n + e.sets.filter((s) => s.reps).length, 0);
              return (
                <div key={w.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${w.completed ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    <span className="font-saira text-sm text-zinc-200">Day {w.day_key}</span>
                    {w.week_number && <span className="font-saira text-[10px] text-zinc-500">wk {w.week_number}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-saira text-[11px] text-zinc-500">{setCount} sets</span>
                    <span className="font-saira text-[11px] text-zinc-400 tabular-nums">{w.log_date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
