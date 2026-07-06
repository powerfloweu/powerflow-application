"use client";

import React from "react";
import type { LifeConfig, LifeDimension, Meal, MacroTargets, Cadence } from "@/lib/life";
import { Card, TextInput, NumInput, PrimaryButton } from "./shared";

interface Props {
  config: LifeConfig;
  patchConfig: (patch: Partial<LifeConfig>) => Promise<boolean>;
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SetupTab({ config, patchConfig }: Props) {
  // ── Values ────────────────────────────────────────────────────────────────
  const [valuesText, setValuesText] = React.useState(config.values_list.join("\n"));
  const [savingValues, setSavingValues] = React.useState(false);

  const saveValues = async () => {
    setSavingValues(true);
    await patchConfig({
      values_list: valuesText.split("\n").map((v) => v.trim()).filter(Boolean),
    });
    setSavingValues(false);
  };

  // ── Dimensions ────────────────────────────────────────────────────────────
  const [dims, setDims] = React.useState<LifeDimension[]>(config.dimensions);
  const [savingDims, setSavingDims] = React.useState(false);

  const saveDims = async () => {
    setSavingDims(true);
    await patchConfig({ dimensions: dims.filter((d) => d.label.trim()) });
    setSavingDims(false);
  };

  // ── Meals ─────────────────────────────────────────────────────────────────
  const [meals, setMeals] = React.useState<Meal[]>(config.meals);
  const [savingMeals, setSavingMeals] = React.useState(false);

  const editMeal = (i: number, patch: Partial<Meal>) => {
    setMeals((prev) => prev.map((m, j) => j === i ? { ...m, ...patch } : m));
  };

  const saveMeals = async () => {
    setSavingMeals(true);
    await patchConfig({ meals: meals.filter((m) => m.name.trim()) });
    setSavingMeals(false);
  };

  // ── Macro targets ─────────────────────────────────────────────────────────
  const [targets, setTargets] = React.useState<MacroTargets>(config.macro_targets);
  const [savingTargets, setSavingTargets] = React.useState(false);

  const saveTargets = async () => {
    setSavingTargets(true);
    await patchConfig({ macro_targets: targets });
    setSavingTargets(false);
  };

  return (
    <div className="space-y-4">
      <Card title="My values">
        <p className="font-saira text-xs text-zinc-500 mb-2">One per line — shown at the top of Today.</p>
        <textarea
          value={valuesText}
          onChange={(e) => setValuesText(e.target.value)}
          rows={5}
          placeholder={"e.g.\nDiscipline over motivation\nStrong body, calm mind\nShow up for my people"}
          className="w-full rounded-xl border border-zinc-700/60 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60 resize-none"
        />
        <PrimaryButton onClick={saveValues} disabled={savingValues} className="mt-2">
          {savingValues ? "Saving…" : "Save values"}
        </PrimaryButton>
      </Card>

      <Card title="Check-in dimensions" action={
        <button
          type="button"
          onClick={() => setDims((p) => [...p, { id: newId("dim"), label: "", cadence: "weekly", threshold: 6 }])}
          className="font-saira text-[11px] text-sky-300 hover:text-sky-200"
        >
          + dimension
        </button>
      }>
        <div className="space-y-2">
          {dims.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2">
              <TextInput
                value={d.label}
                onChange={(v) => setDims((p) => p.map((x, j) => j === i ? { ...x, label: v } : x))}
                placeholder="Label"
                className="flex-1"
              />
              <select
                value={d.cadence}
                onChange={(e) => setDims((p) => p.map((x, j) => j === i ? { ...x, cadence: e.target.value as Cadence } : x))}
                className="rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1.5 font-saira text-xs text-zinc-300 outline-none"
              >
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
              </select>
              {d.cadence === "weekly" && (
                <NumInput
                  value={d.threshold ?? 6}
                  onChange={(v) => setDims((p) => p.map((x, j) => j === i ? { ...x, threshold: v ?? 6 } : x))}
                  className="w-14"
                  placeholder="thr"
                />
              )}
              <button
                type="button"
                onClick={() => setDims((p) => p.filter((_, j) => j !== i))}
                className="text-zinc-600 hover:text-rose-400 font-saira px-1"
                aria-label="Remove dimension"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <p className="font-saira text-[10px] text-zinc-500 mt-2">
          Threshold: weekly items scoring below it twice in a row switch to every-3-days until they recover.
        </p>
        <PrimaryButton onClick={saveDims} disabled={savingDims} className="mt-2">
          {savingDims ? "Saving…" : "Save dimensions"}
        </PrimaryButton>
      </Card>

      <Card title="Meal library" action={
        <button
          type="button"
          onClick={() => setMeals((p) => [...p, { id: newId("meal"), name: "", kcal: 0, protein: 0, carbs: 0, fat: 0 }])}
          className="font-saira text-[11px] text-sky-300 hover:text-sky-200"
        >
          + meal
        </button>
      }>
        {meals.length > 0 && (
          <div className="grid grid-cols-[1fr_3.5rem_3rem_3rem_3rem_1rem] gap-2 mb-1 px-1">
            {["Meal", "kcal", "P", "C", "F", ""].map((h) => (
              <span key={h} className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500">{h}</span>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={m.id} className="grid grid-cols-[1fr_3.5rem_3rem_3rem_3rem_1rem] gap-2 items-center">
              <TextInput value={m.name} onChange={(v) => editMeal(i, { name: v })} placeholder="Name" />
              <NumInput value={m.kcal || null} onChange={(v) => editMeal(i, { kcal: v ?? 0 })} />
              <NumInput value={m.protein || null} onChange={(v) => editMeal(i, { protein: v ?? 0 })} />
              <NumInput value={m.carbs || null} onChange={(v) => editMeal(i, { carbs: v ?? 0 })} />
              <NumInput value={m.fat || null} onChange={(v) => editMeal(i, { fat: v ?? 0 })} />
              <button
                type="button"
                onClick={() => setMeals((p) => p.filter((_, j) => j !== i))}
                className="text-zinc-600 hover:text-rose-400 font-saira"
                aria-label="Remove meal"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {meals.length === 0 && (
          <p className="font-saira text-xs text-zinc-500">Add the 20–30 meals you cycle — logging a day becomes a few taps.</p>
        )}
        <PrimaryButton onClick={saveMeals} disabled={savingMeals} className="mt-3">
          {savingMeals ? "Saving…" : "Save meals"}
        </PrimaryButton>
      </Card>

      <Card title="Macro targets (optional)">
        <div className="flex items-center gap-2">
          {([["kcal", "kcal"], ["protein", "P (g)"], ["carbs", "C (g)"], ["fat", "F (g)"]] as const).map(([key, label]) => (
            <div key={key} className="flex-1">
              <p className="font-saira text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1">{label}</p>
              <NumInput
                value={targets[key] ?? null}
                onChange={(v) => setTargets((p) => ({ ...p, [key]: v ?? undefined }))}
                className="w-full"
              />
            </div>
          ))}
        </div>
        <PrimaryButton onClick={saveTargets} disabled={savingTargets} className="mt-3">
          {savingTargets ? "Saving…" : "Save targets"}
        </PrimaryButton>
      </Card>
    </div>
  );
}
