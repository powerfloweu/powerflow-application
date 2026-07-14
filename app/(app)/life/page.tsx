"use client";

/**
 * /life — Lifestyle guide (beta). Personal operating system: values, training
 * plan with tick-off + progress, weight & meal-based macros, and an adaptive
 * life check-in. Gated by profiles.lifestyle_beta; everyone else is redirected.
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  todayYmd,
  type LifeConfig, type LifePlan, type CheckinRow, type BodyLogRow,
  type WorkoutRow, type WorkoutEntry, type PlanStructure,
} from "@/lib/life";
import TodayTab from "./TodayTab";
import PlanTab from "./PlanTab";
import CheckinTab from "./CheckinTab";
import TrendsTab from "./TrendsTab";
import SetupTab from "./SetupTab";

type Tab = "today" | "plan" | "checkin" | "trends" | "setup";

const TABS: { key: Tab; label: string }[] = [
  { key: "today",   label: "Today" },
  { key: "plan",    label: "Plan" },
  { key: "checkin", label: "Check-in" },
  { key: "trends",  label: "Trends" },
  { key: "setup",   label: "Setup" },
];

export default function LifePage() {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const [tab, setTab] = React.useState<Tab>("today");
  const [flash, setFlash] = React.useState<string | null>(null);

  const [config, setConfig] = React.useState<LifeConfig | null>(null);
  const [plan, setPlan] = React.useState<LifePlan | null>(null);
  const [checkins, setCheckins] = React.useState<CheckinRow[]>([]);
  const [body, setBody] = React.useState<BodyLogRow[]>([]);
  const [workouts, setWorkouts] = React.useState<WorkoutRow[]>([]);

  const showError = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  };

  const loadAll = React.useCallback(async () => {
    const [cfg, pl, ci, bd, wo] = await Promise.all([
      fetch("/api/life/config").then((r) => r.ok ? r.json() : null),
      fetch("/api/life/plan").then((r) => r.ok ? r.json() : null),
      fetch("/api/life/checkins").then((r) => r.ok ? r.json() : []),
      fetch("/api/life/body").then((r) => r.ok ? r.json() : []),
      fetch("/api/life/workouts").then((r) => r.ok ? r.json() : []),
    ]);
    if (cfg) setConfig(cfg);
    setPlan(pl);
    if (Array.isArray(ci)) setCheckins(ci);
    if (Array.isArray(bd)) setBody(bd);
    if (Array.isArray(wo)) setWorkouts(wo);
  }, []);

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then(async (me) => {
        if (!me?.lifestyle_beta) {
          router.replace(me?.role === "coach" ? "/coach" : "/today");
          return;
        }
        setAllowed(true);
        await loadAll();
      })
      .catch((err) => {
        console.error("[life] load failed", err);
        showError("Could not load — check your connection.");
      });
  }, [router, loadAll]);

  // ── Mutation helpers (each refetches its slice on success) ────────────────
  const saveCheckin = async (scores: Record<string, number>, note?: string): Promise<boolean> => {
    const res = await fetch("/api/life/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkin_date: todayYmd(), scores, note }),
    }).catch(() => null);
    if (!res?.ok) { showError("Check-in save failed — try again."); return false; }
    const rows = await fetch("/api/life/checkins").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (Array.isArray(rows)) setCheckins(rows);
    return true;
  };

  const saveBody = async (patch: { weight_kg?: number | null; meal_ids?: string[] }, date = todayYmd()): Promise<boolean> => {
    const res = await fetch("/api/life/body", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log_date: date, ...patch }),
    }).catch(() => null);
    if (!res?.ok) { showError("Body log save failed — try again."); return false; }
    const rows = await fetch("/api/life/body").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (Array.isArray(rows)) setBody(rows);
    return true;
  };

  const saveWorkout = async (w: {
    log_date: string; day_key: string; week_number: number | null;
    entries: WorkoutEntry[]; completed: boolean; note?: string; plan_id: string | null;
  }): Promise<boolean> => {
    const res = await fetch("/api/life/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(w),
    }).catch(() => null);
    if (!res?.ok) { showError("Workout save failed — try again."); return false; }
    const rows = await fetch("/api/life/workouts").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (Array.isArray(rows)) setWorkouts(rows);
    return true;
  };

  const patchPlan = async (patch: {
    id: string; structure?: PlanStructure; current_week?: number; name?: string;
  }): Promise<boolean> => {
    const res = await fetch("/api/life/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) { showError("Plan save failed — try again."); return false; }
    const pl = await fetch("/api/life/plan").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (pl) setPlan(pl);
    return true;
  };

  const createPlan = async (name: string, structure: PlanStructure): Promise<boolean> => {
    const res = await fetch("/api/life/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, structure }),
    }).catch(() => null);
    if (!res?.ok) { showError("Plan create failed — try again."); return false; }
    const pl = await fetch("/api/life/plan").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (pl) setPlan(pl);
    return true;
  };

  const patchConfig = async (patch: Partial<LifeConfig>): Promise<boolean> => {
    const res = await fetch("/api/life/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) { showError("Settings save failed — try again."); return false; }
    const cfg = await fetch("/api/life/config").then((r) => r.ok ? r.json() : null).catch(() => null);
    if (cfg) setConfig(cfg);
    return true;
  };

  if (allowed === null || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/40 border-t-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-400 mb-1">
          Life · Beta
        </p>
        <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.06em] text-white">
          Lifestyle Guide
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap border transition ${
              tab === key
                ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                : "border-white/8 text-zinc-400 hover:border-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Flash error */}
      {flash && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 font-saira text-sm text-rose-200">
          {flash}
        </div>
      )}

      {tab === "today" && (
        <TodayTab
          config={config} plan={plan} checkins={checkins} body={body} workouts={workouts}
          saveCheckin={saveCheckin} saveBody={saveBody} saveWorkout={saveWorkout}
        />
      )}
      {tab === "plan" && (
        <PlanTab plan={plan} workouts={workouts} patchPlan={patchPlan} createPlan={createPlan} />
      )}
      {tab === "checkin" && (
        <CheckinTab config={config} checkins={checkins} saveCheckin={saveCheckin} />
      )}
      {tab === "trends" && (
        <TrendsTab config={config} checkins={checkins} body={body} workouts={workouts} />
      )}
      {tab === "setup" && (
        <SetupTab config={config} patchConfig={patchConfig} />
      )}
    </div>
  );
}
