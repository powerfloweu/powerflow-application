"use client";

/**
 * Daily nutrition card — shows today's meals, macro progress bars, and a
 * button to log a new meal via the FoodModal.
 */

import React from "react";
import { computeTargets, mealTotals, type MealRow, type NutritionConfig, type MacroTargets } from "@/lib/nutrition";

const FoodModal = React.lazy(() => import("./FoodModal"));

interface Props {
  meals: MealRow[];
  currentWeightKg: number | null;
  nutritionConfig: NutritionConfig;
  onMealSaved: () => void;
  onMealDeleted: (id: string) => void;
}

function MacroBar({ label, current, target, color, unit = "g" }: {
  label: string; current: number; target: number; color: string; unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const over = current > target && target > 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${over ? "text-red-400" : "text-zinc-300"}`}>
          {Math.round(current)}{unit !== "kcal" ? unit : ""} <span className="text-zinc-500">/ {Math.round(target)}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionCard({
  meals, currentWeightKg, nutritionConfig, onMealSaved, onMealDeleted,
}: Props) {
  const [showModal, setShowModal] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const targets = computeTargets(currentWeightKg, nutritionConfig);
  const totals = mealTotals(meals);

  const handleSave = async (meal: {
    description: string;
    items: { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[];
    kcal: number; protein: number; carbs: number; fat: number;
    source: "photo" | "photo+text" | "text" | "barcode";
  }) => {
    setShowModal(false);
    const today = new Date();
    const mealDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    try {
      const r = await fetch("/api/life/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_date: mealDate, ...meal }),
      });
      if (r.ok) onMealSaved();
    } catch { /* will retry on refresh */ }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/life/meals?id=${id}`, { method: "DELETE" });
      if (r.ok) onMealDeleted(id);
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const defaultTargets: MacroTargets = targets ?? { kcal: 2200, protein: 140, carbs: 250, fat: 70 };

  return (
    <>
      <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-saira text-sm font-semibold text-white">Nutrition</p>
            <p className="text-[10px] text-zinc-500">
              {meals.length} meal{meals.length !== 1 ? "s" : ""} logged today
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
          >
            + Log food
          </button>
        </div>

        {/* Macro progress bars */}
        <div className="mb-4 space-y-2">
          <MacroBar label="Protein" current={totals.protein} target={defaultTargets.protein} color="bg-emerald-500" />
          <MacroBar label="Calories" current={totals.kcal} target={defaultTargets.kcal} color="bg-violet-500" unit="kcal" />
          <MacroBar label="Carbs" current={totals.carbs} target={defaultTargets.carbs} color="bg-blue-500" />
          <MacroBar label="Fat" current={totals.fat} target={defaultTargets.fat} color="bg-amber-500" />
        </div>

        {/* Meal list */}
        {meals.length > 0 && (
          <div className="space-y-1.5">
            {meals.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-200">{m.description}</p>
                  <p className="text-[10px] text-zinc-500">
                    <span className="text-emerald-400">{Math.round(m.protein)}g P</span>
                    {" · "}
                    {Math.round(m.kcal)} kcal
                    {" · "}
                    {Math.round(m.carbs)}g C · {Math.round(m.fat)}g F
                    {m.source === "barcode" && " · 📊"}
                    {(m.source === "photo" || m.source === "photo+text") && " · 📷"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="ml-2 text-zinc-600 hover:text-red-400 disabled:opacity-30"
                  aria-label="Delete meal"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary when targets exist */}
        {targets && (
          <div className="mt-3 rounded-lg bg-white/5 px-3 py-2">
            <p className="text-[10px] text-zinc-500">
              Auto targets: {Math.round(targets.kcal)} kcal · {Math.round(targets.protein)}g P · {Math.round(targets.carbs)}g C · {Math.round(targets.fat)}g F
              {Object.keys(targets.fromManual).length > 0 && (
                <span className="text-violet-400"> (some overridden)</span>
              )}
            </p>
            <p className="text-[10px] text-zinc-600">
              Based on {Math.round(targets.kg)} kg · BMR {targets.bmr} · TDEE {targets.tdee}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <React.Suspense fallback={null}>
          <FoodModal
            onSave={handleSave}
            onClose={() => setShowModal(false)}
            hand={nutritionConfig.hand}
            plateCm={nutritionConfig.plateDiameterCm}
          />
        </React.Suspense>
      )}
    </>
  );
}
