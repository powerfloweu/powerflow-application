"use client";

import React from "react";
import {
  computeDimStatuses, schemeForWeek, sumMealMacros, todayYmd, detectPRs, loggedExercises,
  type LifeConfig, type LifePlan, type CheckinRow, type BodyLogRow,
  type WorkoutRow, type WorkoutEntry, type SetEntry, type PlanStructure,
} from "@/lib/life";
import { Card, RatingSlider, NumInput, PrimaryButton, GhostButton, ModeBadge } from "./shared";

interface Props {
  config: LifeConfig;
  plan: LifePlan | null;
  checkins: CheckinRow[];
  body: BodyLogRow[];
  workouts: WorkoutRow[];
  saveCheckin: (scores: Record<string, number>) => Promise<boolean>;
  saveBody: (patch: { weight_kg?: number | null; meal_ids?: string[] }, date?: string) => Promise<boolean>;
  saveWorkout: (w: {
    log_date: string; day_key: string; week_number: number | null;
    entries: WorkoutEntry[]; completed: boolean; note?: string; plan_id: string | null;
  }) => Promise<boolean>;
  patchPlan: (patch: { id: string; structure?: PlanStructure; current_week?: number; name?: string }) => Promise<boolean>;
}

function slugifyExercise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `ex-${Math.random().toString(36).slice(2, 7)}`;
}

function emptySet(): SetEntry {
  return { weight: null, reps: null, rpe: null };
}

function buildEntries(plan: LifePlan, dayKey: string, week: number): WorkoutEntry[] {
  const day = plan.structure.days.find((d) => d.key === dayKey);
  if (!day) return [];
  return day.exercises.map((ex) => ({
    exercise_id: ex.id,
    name: ex.name,
    prescription: schemeForWeek(ex.scheme, week),
    sets: [emptySet()],
    done: false,
  }));
}

export default function TodayTab({
  config, plan, checkins, body, workouts, saveCheckin, saveBody, saveWorkout, patchPlan,
}: Props) {
  const today = todayYmd();
  // Workout + body can be backfilled to an earlier day; the check-in below
  // always reflects real "today" (it's about how you are right now).
  const [logDate, setLogDate] = React.useState(today);
  const isBackfill = logDate !== today;

  // ── Check-in quick log ────────────────────────────────────────────────────
  const statuses = computeDimStatuses(config.dimensions, checkins, today);
  const due = statuses.filter((s) => s.due);
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [savingDim, setSavingDim] = React.useState<string | null>(null);

  const logDim = async (dimId: string) => {
    setSavingDim(dimId);
    await saveCheckin({ [dimId]: scores[dimId] ?? 5 });
    setSavingDim(null);
  };

  // ── Workout ──────────────────────────────────────────────────────────────
  const dayKeys = plan?.structure.days.map((d) => d.key) ?? [];
  const lastLoggedDay = workouts[0]?.day_key ?? null;
  const defaultDay = React.useMemo(() => {
    if (!dayKeys.length) return null;
    if (!lastLoggedDay) return dayKeys[0];
    const idx = dayKeys.indexOf(lastLoggedDay);
    return dayKeys[(idx + 1) % dayKeys.length];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, lastLoggedDay]);

  const [dayKey, setDayKey] = React.useState<string | null>(null);
  const activeDay = dayKey ?? defaultDay;
  const week = plan?.current_week ?? 1;

  const existing = workouts.find((w) => w.log_date === logDate && w.day_key === activeDay);
  const [entries, setEntries] = React.useState<WorkoutEntry[]>([]);
  const [note, setNote] = React.useState("");
  const [savingWorkout, setSavingWorkout] = React.useState(false);

  React.useEffect(() => {
    if (!plan || !activeDay) { setEntries([]); return; }
    if (existing) {
      setEntries(existing.entries);
      setNote(existing.note ?? "");
    } else {
      setEntries(buildEntries(plan, activeDay, week));
      setNote("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, activeDay, week, existing?.id, logDate]);

  const updateSet = (ei: number, si: number, field: keyof SetEntry, v: number | null) => {
    setEntries((prev) => prev.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, [field]: v }),
    }));
  };

  // Live PR detection — exercises whose best set beats their previous best.
  const prHits = activeDay ? detectPRs(entries, workouts, logDate, activeDay) : [];
  const prById = new Map(prHits.map((h) => [h.exercise_id, h]));

  // ── Add exercise (ad-hoc, or push into the plan) ──────────────────────────
  // Suggestions: everything in the plan + everything ever logged, so picking a
  // known exercise reuses its id and keeps progression continuous.
  const exerciseSuggestions = React.useMemo(() => {
    const map = new Map<string, string>();
    plan?.structure.days.forEach((d) => d.exercises.forEach((ex) => map.set(ex.id, ex.name)));
    loggedExercises(workouts).forEach((e) => { if (!map.has(e.id)) map.set(e.id, e.name); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [plan, workouts]);

  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newScheme, setNewScheme] = React.useState("");
  const [alsoToPlan, setAlsoToPlan] = React.useState(false);
  const [addingPlan, setAddingPlan] = React.useState(false);

  const addExercise = async () => {
    const name = newName.trim();
    if (!name) return;
    const match = exerciseSuggestions.find((s) => s.name.toLowerCase() === name.toLowerCase());
    const id = match?.id ?? slugifyExercise(name);
    const prescription = newScheme.trim();

    // Don't duplicate an exercise already in today's session.
    if (!entries.some((e) => e.exercise_id === id)) {
      setEntries((prev) => [...prev, { exercise_id: id, name, prescription, sets: [emptySet()], done: false }]);
    }

    // Optionally persist to the plan for this day, going forward.
    if (alsoToPlan && plan && activeDay) {
      const day = plan.structure.days.find((d) => d.key === activeDay);
      if (day && !day.exercises.some((e) => e.id === id)) {
        setAddingPlan(true);
        const structure = structuredClone(plan.structure) as PlanStructure;
        structure.days.find((d) => d.key === activeDay)!.exercises.push({
          id, name, type: "accessory", scheme: prescription,
        });
        await patchPlan({ id: plan.id, structure });
        setAddingPlan(false);
      }
    }

    setNewName(""); setNewScheme(""); setAlsoToPlan(false); setShowAdd(false);
  };

  const submitWorkout = async (completed: boolean) => {
    if (!activeDay) return;
    setSavingWorkout(true);
    await saveWorkout({
      log_date: logDate, day_key: activeDay, week_number: week,
      entries, completed, note: note || undefined, plan_id: plan?.id ?? null,
    });
    setSavingWorkout(false);
  };

  // ── Body: weight + meals ─────────────────────────────────────────────────
  const todayBody = body.find((b) => b.log_date === logDate) ?? null;
  const [weight, setWeight] = React.useState<number | null>(todayBody?.weight_kg ?? null);
  const [mealIds, setMealIds] = React.useState<string[]>(todayBody?.meal_ids ?? []);
  const [savingBody, setSavingBody] = React.useState(false);

  React.useEffect(() => {
    setWeight(todayBody?.weight_kg ?? null);
    setMealIds(todayBody?.meal_ids ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayBody?.id]);

  const macros = sumMealMacros(mealIds, config.meals);
  const targets = config.macro_targets;

  // Meal quantity: a meal can appear multiple times in mealIds; sumMealMacros
  // counts duplicates, so "eat it twice" is just two entries.
  const mealCount = (id: string) => mealIds.filter((m) => m === id).length;
  const addMeal = (id: string) => setMealIds((prev) => [...prev, id]);
  const removeMeal = (id: string) => setMealIds((prev) => {
    const i = prev.indexOf(id);
    if (i === -1) return prev;
    return [...prev.slice(0, i), ...prev.slice(i + 1)];
  });

  const submitBody = async () => {
    setSavingBody(true);
    await saveBody({ weight_kg: weight, meal_ids: mealIds }, logDate);
    setSavingBody(false);
  };

  return (
    <div className="space-y-4">
      {/* Values strip */}
      {config.values_list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.values_list.map((v) => (
            <span key={v} className="rounded-full border border-sky-500/25 bg-sky-500/[0.07] px-3 py-1 font-saira text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
              {v}
            </span>
          ))}
        </div>
      )}

      {/* Due check-in items */}
      <Card title={due.length ? "Check-in — due now" : "Check-in"}>
        {due.length === 0 ? (
          <p className="font-saira text-sm text-zinc-400">All caught up ✓</p>
        ) : (
          <div className="space-y-3">
            {due.map((s) => (
              <div key={s.dim.id} className="flex items-center gap-3">
                <div className="w-36 flex-shrink-0">
                  <p className="font-saira text-sm text-zinc-100 leading-tight">{s.dim.label}</p>
                  <ModeBadge mode={s.mode} />
                </div>
                <RatingSlider
                  value={scores[s.dim.id] ?? s.lastScore ?? 5}
                  onChange={(v) => setScores((p) => ({ ...p, [s.dim.id]: v }))}
                />
                <GhostButton onClick={() => logDim(s.dim.id)}>
                  {savingDim === s.dim.id ? "…" : "Log"}
                </GhostButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Workout */}
      <Card
        title={`Workout — week ${week}`}
        action={
          <div className="flex items-center gap-2">
            {existing?.completed && (
              <span className="font-saira text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Completed ✓</span>
            )}
            <input
              type="date"
              value={logDate}
              max={today}
              onChange={(e) => setLogDate(e.target.value || today)}
              className="rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1 font-saira text-[11px] text-zinc-300 outline-none focus:border-sky-500/60"
              aria-label="Log date"
            />
          </div>
        }
      >
        {isBackfill && (
          <p className="mb-3 font-saira text-[11px] text-amber-300">
            Logging for {logDate} (not today)
          </p>
        )}
        {!plan ? (
          <p className="font-saira text-sm text-zinc-400">No active plan — create one in the Plan tab.</p>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {plan.structure.days.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDayKey(d.key)}
                  className={`rounded-xl px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.14em] border transition ${
                    activeDay === d.key
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                      : "border-white/10 text-zinc-400 hover:border-white/25"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {entries.map((e, ei) => (
                <div key={e.exercise_id} className={`rounded-xl border p-3 ${e.done ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-white/8"}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-saira text-sm font-semibold text-zinc-100 truncate">{e.name}</p>
                        {prById.has(e.exercise_id) && (
                          <span
                            title={prById.get(e.exercise_id)!.prevBest
                              ? `est. 1RM ${prById.get(e.exercise_id)!.e1rm} — beats ${prById.get(e.exercise_id)!.prevBest}`
                              : `est. 1RM ${prById.get(e.exercise_id)!.e1rm} — first logged`}
                            className="flex-shrink-0 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 font-saira text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300"
                          >
                            PR ★
                          </span>
                        )}
                      </div>
                      {e.prescription && (
                        <p className="font-saira text-[11px] text-sky-300/90">{e.prescription}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntries((prev) => prev.map((x, i) => i === ei ? { ...x, done: !x.done } : x))}
                      className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition ${
                        e.done ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-zinc-600 text-transparent hover:border-zinc-400"
                      }`}
                      aria-label={e.done ? "Mark not done" : "Mark done"}
                    >
                      ✓
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {e.sets.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="w-5 font-saira text-[10px] text-zinc-500 tabular-nums">{si + 1}</span>
                        <NumInput value={s.weight} onChange={(v) => updateSet(ei, si, "weight", v)} placeholder="kg" className="w-20" step="0.5" />
                        <span className="font-saira text-xs text-zinc-500">×</span>
                        <NumInput value={s.reps} onChange={(v) => updateSet(ei, si, "reps", v)} placeholder="reps" className="w-16" />
                        <span className="font-saira text-xs text-zinc-500">@</span>
                        <NumInput value={s.rpe} onChange={(v) => updateSet(ei, si, "rpe", v)} placeholder="RPE" className="w-16" step="0.5" />
                        {e.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEntries((prev) => prev.map((x, i) => i === ei ? { ...x, sets: x.sets.filter((_, j) => j !== si) } : x))}
                            className="text-zinc-600 hover:text-rose-400 font-saira text-sm px-1"
                            aria-label="Remove set"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEntries((prev) => prev.map((x, i) => i === ei ? { ...x, sets: [...x.sets, emptySet()] } : x))}
                    className="mt-2 font-saira text-[11px] text-sky-300 hover:text-sky-200"
                  >
                    + add set
                  </button>
                </div>
              ))}
            </div>

            {/* Add exercise (ad-hoc / modify program) */}
            <datalist id="life-exercise-suggestions">
              {exerciseSuggestions.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
            {showAdd ? (
              <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-500/[0.05] p-3 space-y-2">
                <input
                  type="text"
                  list="life-exercise-suggestions"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Exercise — pick one or type a new name"
                  autoFocus
                  className="w-full rounded-lg border border-zinc-700/60 bg-surface-input px-3 py-2 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60"
                />
                <input
                  type="text"
                  value={newScheme}
                  onChange={(e) => setNewScheme(e.target.value)}
                  placeholder="Set/rep scheme (optional) — e.g. 3 x 10 @ RPE 8"
                  className="w-full rounded-lg border border-zinc-700/60 bg-surface-input px-3 py-2 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60"
                />
                {plan && activeDay && (
                  <label className="flex items-center gap-2 font-saira text-[11px] text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={alsoToPlan} onChange={(e) => setAlsoToPlan(e.target.checked)} className="accent-sky-400" />
                    Also add to {plan.structure.days.find((d) => d.key === activeDay)?.name ?? `Day ${activeDay}`} in my plan
                  </label>
                )}
                <div className="flex gap-2 pt-0.5">
                  <PrimaryButton onClick={addExercise} disabled={!newName.trim() || addingPlan}>
                    {addingPlan ? "Adding…" : "Add exercise"}
                  </PrimaryButton>
                  <GhostButton onClick={() => { setShowAdd(false); setNewName(""); setNewScheme(""); setAlsoToPlan(false); }}>
                    Cancel
                  </GhostButton>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-3 w-full rounded-xl border border-dashed border-white/15 py-2.5 font-saira text-xs font-semibold text-sky-300 hover:border-sky-500/40 hover:text-sky-200 transition"
              >
                + Add exercise
              </button>
            )}

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Session note (optional)"
              className="mt-4 w-full rounded-xl border border-zinc-700/60 bg-surface-input px-3 py-2 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60"
            />

            <div className="mt-3 flex gap-2">
              <GhostButton onClick={() => submitWorkout(false)}>
                {savingWorkout ? "Saving…" : "Save progress"}
              </GhostButton>
              <PrimaryButton onClick={() => submitWorkout(true)} disabled={savingWorkout}>
                {savingWorkout ? "Saving…" : "Save & complete session"}
              </PrimaryButton>
            </div>
          </>
        )}
      </Card>

      {/* Body: weight + meals */}
      <Card title={isBackfill ? `Body — ${logDate}` : "Body — today"}>
        <div className="flex items-center gap-3 mb-4">
          <p className="font-saira text-sm text-zinc-300 w-16">Weight</p>
          <NumInput value={weight} onChange={setWeight} placeholder="kg" className="w-24" step="0.1" />
          <span className="font-saira text-xs text-zinc-500">kg</span>
        </div>

        {config.meals.length === 0 ? (
          <p className="font-saira text-xs text-zinc-500 mb-3">
            Add your meals in Setup to log macros with one tap.
          </p>
        ) : (
          <>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-2">Meals eaten</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.meals.map((m) => {
                const count = mealCount(m.id);
                const on = count > 0;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center rounded-xl border font-saira text-xs transition ${
                      on
                        ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                        : "border-white/10 text-zinc-400"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => addMeal(m.id)}
                      className="pl-3 pr-2 py-1.5 hover:text-sky-100"
                      title="Add one"
                    >
                      {m.name}
                      <span className="ml-1.5 text-[10px] text-zinc-500">{m.kcal} kcal</span>
                    </button>
                    {on && (
                      <span className="flex items-center gap-1 pr-1.5">
                        <button
                          type="button"
                          onClick={() => removeMeal(m.id)}
                          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400"
                          aria-label={`Remove one ${m.name}`}
                        >
                          −
                        </button>
                        <span className="w-4 text-center font-bold tabular-nums text-sky-200">×{count}</span>
                        <button
                          type="button"
                          onClick={() => addMeal(m.id)}
                          className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400"
                          aria-label={`Add one ${m.name}`}
                        >
                          +
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {([
                ["kcal", macros.kcal, targets.kcal],
                ["P", macros.protein, targets.protein],
                ["C", macros.carbs, targets.carbs],
                ["F", macros.fat, targets.fat],
              ] as const).map(([label, actual, target]) => (
                <div key={label} className="rounded-xl border border-white/8 p-2 text-center">
                  <p className="font-saira text-sm font-bold text-zinc-100 tabular-nums">{Math.round(actual)}</p>
                  <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                    {label}{target ? ` / ${target}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <PrimaryButton onClick={submitBody} disabled={savingBody}>
          {savingBody ? "Saving…" : "Save body log"}
        </PrimaryButton>
      </Card>
    </div>
  );
}
