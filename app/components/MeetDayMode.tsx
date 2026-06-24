"use client";
import React from "react";
import MuxPlayer from "@mux/mux-player-react";
import VideoUpload from "@/app/components/VideoUpload";

// ── Types ────────────────────────────────────────────────────────────────────

type LiftMeetConfig = {
  training_best_kg?: number | null;
  goal_kg?: number | null;
  record_kg?: number | null;
  mental_cue?: string | null;
  flight_start?: string | null;   // "HH:MM" 24h
  flight_number?: number | null;
  opener_kg?: number | null;
  attempt2a?: number | null;
  attempt2b?: number | null;
  attempt2c?: number | null;
  attempt3a?: number | null;
  attempt3b?: number | null;
  attempt3c?: number | null;
};

type MeetConfig = {
  squat_opener?: number | null;
  bench_opener?: number | null;
  deadlift_opener?: number | null;
  flight_size?: number | null;
  seconds_per_person?: number | null;
  lifts?: Partial<Record<Lift, LiftMeetConfig>>;
  affirmations?: string[];
  show_attempt_options?: boolean;
};

type Attempt = {
  id?: string;
  lift: "squat" | "bench" | "deadlift";
  attempt_num: 1 | 2 | 3;
  planned_kg: number | null;
  actual_kg: number | null;
  result: "made" | "missed" | "red_light" | null;
};

type Profile = {
  display_name?: string;
  meet_date?: string | null;
  meet_config?: MeetConfig | null;
  affirmations?: string[] | null;
  viz_keywords?: Record<string, string[]> | null;
};

type PrepLift = {
  id: string; lift: string; weight_kg: number | null; title: string | null;
  video_url: string | null; mux_playback_id: string | null; lift_date: string | null;
  athlete_notes: string | null; coach_notes: string | null;
};

const LIFTS = ["squat", "bench", "deadlift"] as const;
type Lift = typeof LIFTS[number];

const LIFT_LABELS: Record<Lift, string> = { squat: "Squat", bench: "Bench Press", deadlift: "Deadlift" };
const LIFT_LABELS_SHORT: Record<Lift, string> = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };
const LIFT_COLORS: Record<Lift, string> = {
  squat:    "text-purple-400 border-purple-400/30 bg-purple-500/10",
  bench:    "text-sky-400    border-sky-400/30    bg-sky-500/10",
  deadlift: "text-amber-400  border-amber-400/30  bg-amber-500/10",
};
const LIFT_RING: Record<Lift, string> = {
  squat:    "border-purple-400/40 bg-purple-500/8",
  bench:    "border-sky-400/40    bg-sky-500/8",
  deadlift: "border-amber-400/40  bg-amber-500/8",
};
const LIFT_TEXT: Record<Lift, string> = {
  squat: "text-purple-300", bench: "text-sky-300", deadlift: "text-amber-300",
};
const LIFT_KEYWORD_KEY: Record<Lift, string> = {
  squat: "viz-squat", bench: "viz-bench", deadlift: "viz-deadlift",
};

// ── Warm-up schedule utilities ───────────────────────────────────────────────

const WARMUP_OFFSETS = [
  { label: "Activations", reps: "",    pct: 0,    minBefore: 40 },
  { label: "x8",          reps: "×8",  pct: 0.55, minBefore: 30 },
  { label: "x5",          reps: "×5",  pct: 0.65, minBefore: 26 },
  { label: "x3",          reps: "×3",  pct: 0.74, minBefore: 22 },
  { label: "x1",          reps: "×1",  pct: 0.83, minBefore: 17 },
  { label: "x1",          reps: "×1",  pct: 0.90, minBefore: 12 },
  { label: "x1",          reps: "×1",  pct: 0.96, minBefore:  6 },
];

type WarmupStep = {
  label: string;
  reps: string;
  loadKg: number | null;
  timeMin: number;   // minutes from midnight
  timeStr: string;   // "9:05 AM"
  isOpener: boolean;
};

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMin(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function r2_5(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}

function calcSchedule(flightStart: string, flightNumber: number, openerKg: number): WarmupStep[] {
  const openerMin = parseHHMM(flightStart) + flightNumber;
  const steps: WarmupStep[] = WARMUP_OFFSETS.map(o => ({
    label: o.label,
    reps:  o.reps,
    loadKg: o.pct > 0 ? r2_5(openerKg * o.pct) : null,
    timeMin: openerMin - o.minBefore,
    timeStr: formatMin(openerMin - o.minBefore),
    isOpener: false,
  }));
  steps.push({
    label: "Opener",
    reps:  "×1",
    loadKg: openerKg,
    timeMin: openerMin,
    timeStr: formatMin(openerMin),
    isOpener: true,
  });
  return steps;
}

function nowMin(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function getCurrentStepIdx(steps: WarmupStep[], now: number): number {
  let idx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (now >= steps[i].timeMin) idx = i;
  }
  return idx;
}

function getCurrentLift(attempts: Attempt[]): Lift | null {
  for (const lift of LIFTS) {
    if (attempts.some(a => a.lift === lift && a.result === null)) return lift;
  }
  return null;
}

// ── WarmupSchedule ────────────────────────────────────────────────────────────

function WarmupSchedule({
  liftConfig,
  lift,
  compact = false,
  currentStepIdx,
}: {
  liftConfig: LiftMeetConfig;
  lift: Lift;
  compact?: boolean;
  currentStepIdx?: number;
}) {
  const { flight_start, flight_number, opener_kg } = liftConfig;
  if (!flight_start || !flight_number || !opener_kg) {
    return (
      <p className="font-saira text-xs text-zinc-500">
        Set flight start, flight number, and opener to see the warm-up schedule.
      </p>
    );
  }
  const steps = calcSchedule(flight_start, flight_number, opener_kg);
  const now = currentStepIdx !== undefined ? currentStepIdx : getCurrentStepIdx(steps, nowMin());

  return (
    <div className="space-y-0.5">
      {steps.map((step, i) => {
        const isPast    = i < now;
        const isCurrent = i === now;
        const isNext    = i === now + 1;
        if (compact && isPast && !isCurrent) return null;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 ${
              isCurrent
                ? `border ${LIFT_RING[lift]} font-semibold`
                : isPast
                  ? "opacity-30"
                  : isNext
                    ? "opacity-75"
                    : ""
            }`}
          >
            <span className={`font-saira text-[10px] w-16 tabular-nums ${
              isCurrent ? LIFT_TEXT[lift] : "text-zinc-500"
            }`}>
              {step.timeStr}
            </span>
            <span className={`font-saira text-[11px] font-bold w-8 ${
              isCurrent ? "text-white" : "text-zinc-400"
            }`}>
              {step.reps || "—"}
            </span>
            <span className={`font-saira text-sm font-bold tabular-nums flex-1 ${
              isCurrent ? "text-white" : step.isOpener ? LIFT_TEXT[lift] : "text-zinc-300"
            }`}>
              {step.loadKg !== null ? `${step.loadKg} kg` : "Activations"}
            </span>
            {isCurrent && (
              <span className={`font-saira text-[9px] font-bold uppercase tracking-[0.14em] rounded-full px-2 py-0.5 ${LIFT_COLORS[lift]}`}>
                NOW
              </span>
            )}
            {step.isOpener && !isCurrent && (
              <span className="font-saira text-[9px] text-zinc-500 uppercase tracking-[0.12em]">opener</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Breathing Guide ───────────────────────────────────────────────────────────

function BreathingGuide() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  // 4-4-4-4 box breathing (16-step cycle)
  const step = tick % 16;
  const phase: "in" | "hold" | "out" | "hold2" = step < 4 ? "in" : step < 8 ? "hold" : step < 12 ? "out" : "hold2";
  const count = (step % 4) + 1;
  const expanded = phase === "in" ? 0.5 + (step % 4) * 0.125
    : phase === "hold"  ? 1.0
    : phase === "out"   ? 1.0 - (step % 4) * 0.125
    : 0.5;
  const labels = { in: "Breathe in", hold: "Hold", out: "Breathe out", hold2: "Hold" };
  const size = Math.round(40 + expanded * 56);
  return (
    <div className="flex flex-col items-center gap-4 py-6 select-none">
      <div
        style={{ width: size, height: size, transition: "width 1s ease-in-out, height 1s ease-in-out" }}
        className="rounded-full border-2 border-purple-400/50 bg-purple-500/15 flex items-center justify-center"
      >
        <span className="font-saira text-xl font-extrabold text-purple-300">{count}</span>
      </div>
      <p className={`font-saira text-sm font-semibold ${
        phase === "in" ? "text-purple-300" : phase === "out" ? "text-sky-300" : "text-zinc-400"
      }`}>
        {labels[phase]}
      </p>
      <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-[0.16em]">Box breathing · 4-4-4-4</p>
    </div>
  );
}

// ── Attempt Row ───────────────────────────────────────────────────────────────

function AttemptRow({
  lift, num, attempt, meetDate, locked, onChange, onSaved,
}: {
  lift: Lift; num: 1 | 2 | 3; attempt: Attempt; meetDate: string;
  locked?: boolean; onChange: (a: Attempt) => void; onSaved?: () => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [kg, setKg] = React.useState(String(attempt.actual_kg ?? attempt.planned_kg ?? ""));

  React.useEffect(() => {
    if (!editing && attempt.result === null) {
      setKg(String(attempt.actual_kg ?? attempt.planned_kg ?? ""));
    }
  }, [attempt.planned_kg, attempt.actual_kg, editing]);

  async function save(result: "made" | "missed" | "red_light") {
    if (locked) return;
    setSaving(true);
    const actualKg = parseFloat(kg) || attempt.planned_kg || null;
    const updated: Attempt = { ...attempt, result, actual_kg: actualKg };
    try {
      await fetch("/api/meet-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lift, attempt_num: num, meet_date: meetDate, result, actual_kg: actualKg, planned_kg: attempt.planned_kg }),
      });
      onChange(updated);
      onSaved?.();
    } finally { setSaving(false); setEditing(false); }
  }

  async function undo() {
    setSaving(true);
    try {
      await fetch("/api/meet-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lift, attempt_num: num, meet_date: meetDate, result: null, actual_kg: null, planned_kg: attempt.planned_kg }),
      });
      onChange({ ...attempt, result: null, actual_kg: null });
    } finally { setSaving(false); }
  }

  const labelNum = num === 1 ? "Opener" : num === 2 ? "2nd" : "3rd";
  const col = LIFT_COLORS[lift];

  if (locked) {
    return (
      <div className="rounded-xl border border-white/5 bg-surface-alt/40 px-4 py-3 opacity-40 select-none">
        <div className="flex items-center gap-2">
          <span className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] rounded px-1.5 py-0.5 border ${col}`}>{labelNum}</span>
          <span className="font-saira text-xs text-zinc-600">Complete previous attempt first</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${
      attempt.result === "made"      ? "border-emerald-400/30 bg-emerald-500/5"
      : attempt.result === "red_light" ? "border-amber-400/30 bg-amber-500/5"
      : attempt.result === "missed"    ? "border-rose-400/30 bg-rose-500/5"
      : "border-white/8 bg-surface-alt"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] rounded px-1.5 py-0.5 border ${col}`}>{labelNum}</span>
          {editing ? (
            <input
              type="number" value={kg} onChange={e => setKg(e.target.value)} step="0.5"
              autoFocus onBlur={() => setEditing(false)}
              className="w-20 rounded border border-white/20 bg-white/5 px-2 py-0.5 font-saira text-sm text-white outline-none focus:border-purple-400/40"
            />
          ) : (
            <button onClick={() => !attempt.result && setEditing(true)} className="font-saira text-lg font-extrabold text-white tabular-nums">
              {attempt.actual_kg ?? attempt.planned_kg ?? "—"} <span className="text-zinc-400 text-xs">kg</span>
            </button>
          )}
        </div>
        {attempt.result && (
          <span className={`font-saira text-xs font-bold ${
            attempt.result === "made" ? "text-emerald-400" : attempt.result === "red_light" ? "text-amber-400" : "text-rose-400"
          }`}>
            {attempt.result === "made" ? "✓ Made" : attempt.result === "red_light" ? "⚑ Red light" : "✗ Missed"}
          </span>
        )}
      </div>

      {!attempt.result && (
        <div className="flex gap-2">
          <button onClick={() => save("made")} disabled={saving} className="flex-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 py-1.5 font-saira text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50">
            ✓ Made
          </button>
          <button onClick={() => save("missed")} disabled={saving} className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/10 py-1.5 font-saira text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50">
            ✗ Missed
          </button>
          <button onClick={() => save("red_light")} disabled={saving} title="Red light (technical violation)" className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 font-saira text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition disabled:opacity-50">
            ⚑
          </button>
        </div>
      )}
      {attempt.result && (
        <button onClick={undo} disabled={saving} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition disabled:opacity-50">
          {saving ? "undoing…" : "undo"}
        </button>
      )}
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

function CompScoreboard({ attempts }: { attempts: Attempt[] }) {
  const best: Record<Lift, number | null> = { squat: null, bench: null, deadlift: null };
  for (const a of attempts) {
    if (a.result === "made" && a.actual_kg) {
      if (best[a.lift] === null || a.actual_kg > best[a.lift]!) best[a.lift] = a.actual_kg;
    }
  }
  const total = (best.squat ?? 0) + (best.bench ?? 0) + (best.deadlift ?? 0);
  const madeCount = attempts.filter(a => a.result === "made").length;
  const doneCount = attempts.filter(a => a.result !== null).length;

  return (
    <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/8 to-rose-500/8 p-4 space-y-3">
      <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-purple-400">Live total</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-saira text-3xl font-extrabold text-white tabular-nums">
            {total > 0 ? `${total} kg` : "—"}
          </p>
          <p className="font-saira text-[11px] text-zinc-400">{madeCount} made · {doneCount}/9 done</p>
        </div>
        <div className="text-right space-y-0.5">
          {LIFTS.map(lift => (
            <p key={lift} className={`font-saira text-xs tabular-nums ${LIFT_TEXT[lift]}`}>
              {LIFT_LABELS_SHORT[lift]}: {best[lift] !== null ? `${best[lift]} kg` : "—"}
            </p>
          ))}
        </div>
      </div>
      {doneCount > 0 && (
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${(doneCount / 9) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// ── PostMeetSummary ───────────────────────────────────────────────────────────

function PostMeetSummary({ attempts, onBack }: { attempts: Attempt[]; onBack: () => void }) {
  const best: Record<Lift, { kg: number; num: number } | null> = { squat: null, bench: null, deadlift: null };
  for (const a of attempts) {
    if (a.result === "made" && a.actual_kg) {
      if (!best[a.lift] || a.actual_kg > best[a.lift]!.kg) best[a.lift] = { kg: a.actual_kg, num: a.attempt_num };
    }
  }
  const total = (best.squat?.kg ?? 0) + (best.bench?.kg ?? 0) + (best.deadlift?.kg ?? 0);
  const madeCount = attempts.filter(a => a.result === "made").length;
  const al = (n: number) => n === 1 ? "opener" : n === 2 ? "2nd" : "3rd";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-purple-600/10 p-6 text-center">
        <p className="font-saira text-4xl mb-2">🏆</p>
        <h2 className="font-saira text-2xl font-extrabold text-white">Competition Complete</h2>
        <p className="font-saira text-sm text-zinc-400 mt-1">{madeCount}/9 attempts made</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-surface-alt p-5 space-y-4">
        {LIFTS.map(lift => {
          const b = best[lift];
          return (
            <div key={lift} className="flex items-center justify-between">
              <span className={`font-saira text-[10px] font-bold uppercase tracking-[0.16em] ${LIFT_TEXT[lift]}`}>{LIFT_LABELS[lift]}</span>
              {b ? (
                <span className="font-saira font-extrabold text-white tabular-nums">
                  {b.kg} kg <span className="text-zinc-500 font-normal text-xs">({al(b.num)})</span>
                </span>
              ) : <span className="font-saira text-zinc-500 text-sm">No good lift</span>}
            </div>
          );
        })}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="font-saira text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Total</span>
          <span className="font-saira text-2xl font-extrabold text-white tabular-nums">{total > 0 ? `${total} kg` : "—"}</span>
        </div>
      </div>
      <button onClick={onBack} className="w-full rounded-xl border border-white/10 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-300 hover:border-white/20 transition">
        ← View all attempts
      </button>
    </div>
  );
}

// ── PrepLiftGallery / PrepLiftCard ────────────────────────────────────────────

function PrepLiftCard({
  lift, isCoach, onCoachNote, onDelete,
}: {
  lift: PrepLift; isCoach?: boolean;
  onCoachNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
}) {
  const [coachNote, setCoachNote] = React.useState(lift.coach_notes ?? "");
  const [editingNote, setEditingNote] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showPlayer, setShowPlayer] = React.useState(false);
  const liftColor = LIFT_COLORS[(lift.lift as Lift)] ?? "text-zinc-400 border-zinc-400/30 bg-zinc-500/10";

  async function saveNote() {
    setSavingNote(true);
    await onCoachNote(lift.id, coachNote);
    setSavingNote(false); setEditingNote(false);
  }

  return (
    <div className="rounded-xl border border-white/8 bg-surface-alt p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`font-saira text-[9px] font-bold uppercase tracking-[0.18em] rounded px-1.5 py-0.5 border ${liftColor}`}>{lift.lift}</span>
            {lift.weight_kg && <span className="font-saira text-sm font-bold text-white">{lift.weight_kg} kg</span>}
            {lift.lift_date && (
              <span className="font-saira text-[10px] text-zinc-500">
                {new Date(lift.lift_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
          {lift.title && <p className="font-saira text-xs text-zinc-300">{lift.title}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lift.mux_playback_id && (
            <button onClick={() => setShowPlayer(v => !v)} className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1 font-saira text-[10px] text-purple-300 hover:bg-purple-500/20 transition">
              {showPlayer ? "▾ Hide" : "▶ Watch"}
            </button>
          )}
          {!lift.mux_playback_id && lift.video_url && (
            <a href={lift.video_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1 font-saira text-[10px] text-purple-300 hover:bg-purple-500/20 transition">
              ▶ Watch
            </a>
          )}
          {!isCoach && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={() => { setDeleting(true); onDelete(lift.id); }} disabled={deleting} className="rounded-lg bg-rose-600 hover:bg-rose-500 px-2 py-1 font-saira text-[10px] font-bold text-white disabled:opacity-50 transition">
                  {deleting ? "…" : "Delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition px-1">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="font-saira text-sm text-zinc-600 hover:text-rose-400 transition leading-none" title="Delete lift">×</button>
            )
          )}
        </div>
      </div>
      {lift.athlete_notes && <p className="font-saira text-xs text-zinc-400 italic">{lift.athlete_notes}</p>}
      {lift.mux_playback_id && showPlayer && (
        <div className="rounded-lg overflow-hidden">
          <MuxPlayer playbackId={lift.mux_playback_id} streamType="on-demand" style={{ width: "100%", aspectRatio: "16/9" }} />
        </div>
      )}
      {(lift.coach_notes || isCoach) && (
        <div className="border-t border-white/5 pt-2">
          {isCoach && editingNote ? (
            <div className="space-y-1.5">
              <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} rows={2} placeholder="Add a coaching note…" className="w-full rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={saveNote} disabled={savingNote} className="rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1 font-saira text-[10px] font-bold text-white disabled:opacity-50 transition">{savingNote ? "Saving…" : "Save note"}</button>
                <button onClick={() => setEditingNote(false)} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              {lift.coach_notes ? <p className="font-saira text-[11px] text-amber-300/80 italic">Coach: {lift.coach_notes}</p> : <span />}
              {isCoach && <button onClick={() => setEditingNote(true)} className="font-saira text-[10px] text-amber-400/60 hover:text-amber-300 transition flex-shrink-0">{lift.coach_notes ? "Edit note" : "+ Add note"}</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PrepLiftGallery({ isCoach, athleteId }: { isCoach?: boolean; athleteId?: string }) {
  const [lifts, setLifts] = React.useState<PrepLift[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ lift: "squat", weight_kg: "", title: "", video_url: "", mux_playback_id: "", lift_date: "", athlete_notes: "" });
  const [saving, setSaving] = React.useState(false);

  async function reload() {
    const url = athleteId ? `/api/prep-lifts?athlete_id=${athleteId}` : "/api/prep-lifts";
    const data = await fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);
    setLifts(data);
  }

  React.useEffect(() => { setLoading(true); reload().finally(() => setLoading(false)); }, [athleteId]);

  async function addLift() {
    setSaving(true);
    try {
      const res = await fetch("/api/prep-lifts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weight_kg: parseFloat(form.weight_kg) || undefined, mux_playback_id: form.mux_playback_id || undefined, video_url: form.video_url || undefined }),
      });
      if (res.ok) { await reload(); setAdding(false); setForm({ lift: "squat", weight_kg: "", title: "", video_url: "", mux_playback_id: "", lift_date: "", athlete_notes: "" }); }
    } finally { setSaving(false); }
  }

  async function saveCoachNote(id: string, note: string) {
    await fetch("/api/prep-lifts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, coach_notes: note }) });
    setLifts(prev => prev.map(l => l.id === id ? { ...l, coach_notes: note } : l));
  }

  async function deleteLift(id: string) {
    await fetch(`/api/prep-lifts?id=${id}`, { method: "DELETE" });
    setLifts(prev => prev.filter(l => l.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Prep highlights</p>
        {!isCoach && <button onClick={() => setAdding(v => !v)} className="font-saira text-[10px] text-purple-400 hover:text-purple-300 transition">{adding ? "Cancel" : "+ Add lift"}</button>}
      </div>

      {adding && (
        <div className="rounded-xl border border-white/10 bg-surface-alt p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.lift} onChange={e => setForm(f => ({ ...f, lift: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white outline-none">
              {["squat", "bench", "deadlift", "general"].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
            <input type="number" placeholder="Weight (kg)" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} step="0.5" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />
            <input type="text" placeholder="Title (optional)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />
            <div className="col-span-2 space-y-1.5">
              <VideoUpload existingPlaybackId={form.mux_playback_id || null} onUploadComplete={pid => setForm(f => ({ ...f, mux_playback_id: pid, video_url: "" }))} />
              {!form.mux_playback_id && <input type="url" placeholder="Or paste a URL (YouTube / Vimeo)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />}
            </div>
            <input type="date" value={form.lift_date} onChange={e => setForm(f => ({ ...f, lift_date: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white outline-none" />
            <textarea placeholder="Your notes…" value={form.athlete_notes} rows={2} onChange={e => setForm(f => ({ ...f, athlete_notes: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none resize-none" />
          </div>
          <button onClick={addLift} disabled={saving} className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50 transition">
            {saving ? "Saving…" : "Save lift"}
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-4"><div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" /></div>}
      {!loading && lifts.length === 0 && !adding && <p className="font-saira text-xs text-zinc-500 text-center py-3">No prep lifts added yet.</p>}
      {!loading && lifts.map(l => <PrepLiftCard key={l.id} lift={l} isCoach={isCoach} onCoachNote={saveCoachNote} onDelete={deleteLift} />)}
    </div>
  );
}

// ── Athlete: Focus tab ────────────────────────────────────────────────────────

function AthleteFocusTab({
  liftConfigs, attempts, affirmations, vizKeywords,
}: {
  liftConfigs: Partial<Record<Lift, LiftMeetConfig>>;
  attempts: Attempt[];
  affirmations: string[];
  vizKeywords: Record<string, string[]>;
}) {
  const [showBreathing, setShowBreathing] = React.useState(false);
  const currentLift = getCurrentLift(attempts);

  // Rotate affirmation every 30 seconds so it feels alive
  const [affIdx, setAffIdx] = React.useState(0);
  React.useEffect(() => {
    if (affirmations.length <= 1) return;
    const id = setInterval(() => setAffIdx(i => (i + 1) % affirmations.length), 30000);
    return () => clearInterval(id);
  }, [affirmations.length]);

  const aff = affirmations[affIdx] ?? null;

  return (
    <div className="space-y-4">
      {/* Affirmation card */}
      {aff && (
        <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5 text-center space-y-2">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-purple-400">Today&rsquo;s affirmation</p>
          <p className="font-saira text-lg font-semibold text-white leading-snug">&ldquo;{aff}&rdquo;</p>
          {affirmations.length > 1 && (
            <button onClick={() => setAffIdx(i => (i + 1) % affirmations.length)} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition">Next →</button>
          )}
        </div>
      )}

      {/* Mental cue for current lift */}
      {currentLift && liftConfigs[currentLift]?.mental_cue && (
        <div className={`rounded-2xl border p-5 ${LIFT_RING[currentLift]}`}>
          <p className={`font-saira text-[9px] font-bold uppercase tracking-[0.22em] mb-2 ${LIFT_TEXT[currentLift]}`}>
            {LIFT_LABELS[currentLift]} cue
          </p>
          <p className="font-saira text-xl font-bold text-white leading-snug">
            {liftConfigs[currentLift]!.mental_cue}
          </p>
        </div>
      )}

      {/* All lift cues */}
      <div className="rounded-2xl border border-white/8 bg-surface-alt p-4 space-y-3">
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Lift cues</p>
        {LIFTS.map(lift => {
          const cue = liftConfigs[lift]?.mental_cue;
          const vizCues = vizKeywords[LIFT_KEYWORD_KEY[lift]] ?? [];
          return (
            <div key={lift}>
              <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.16em] mb-1 ${LIFT_TEXT[lift]}`}>{LIFT_LABELS_SHORT[lift]}</p>
              {cue && <p className="font-saira text-sm text-zinc-200 mb-1.5">&ldquo;{cue}&rdquo;</p>}
              {vizCues.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {vizCues.map((c, i) => (
                    <span key={i} className={`rounded-full border px-2.5 py-0.5 font-saira text-xs font-semibold ${LIFT_COLORS[lift]}`}>{c}</span>
                  ))}
                </div>
              )}
              {!cue && vizCues.length === 0 && <p className="font-saira text-xs text-zinc-600">No cues set.</p>}
            </div>
          );
        })}
      </div>

      {/* Breathing guide */}
      <div className="rounded-2xl border border-white/8 bg-surface-alt p-4">
        <div className="flex items-center justify-between">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Box breathing</p>
          <button onClick={() => setShowBreathing(v => !v)} className="font-saira text-[10px] text-purple-400 hover:text-purple-300 transition">
            {showBreathing ? "Hide" : "Start"}
          </button>
        </div>
        {showBreathing && <BreathingGuide />}
        {!showBreathing && <p className="font-saira text-xs text-zinc-500 mt-1">4-4-4-4 breathing to activate calm focus.</p>}
      </div>

      {/* Visualization link */}
      <a href="/library" className="flex items-center justify-between rounded-xl border border-purple-400/25 bg-purple-500/10 px-4 py-3 hover:bg-purple-500/15 transition">
        <div>
          <p className="font-saira text-sm font-semibold text-purple-300">Competition Day Visualization</p>
          <p className="font-saira text-[11px] text-zinc-400">12-min guided audio · All 9 attempts</p>
        </div>
        <span className="text-purple-400 text-lg">▶</span>
      </a>
    </div>
  );
}

// ── Athlete: Timing tab ───────────────────────────────────────────────────────

function AthleteTimingTab({
  liftConfigs, attempts, showAttemptOptions,
}: {
  liftConfigs: Partial<Record<Lift, LiftMeetConfig>>;
  attempts: Attempt[];
  showAttemptOptions: boolean;
}) {
  const [now, setNow] = React.useState(nowMin());
  React.useEffect(() => {
    const id = setInterval(() => setNow(nowMin()), 30000);
    return () => clearInterval(id);
  }, []);

  const currentLift = getCurrentLift(attempts);
  const upcomingLifts = LIFTS.filter(l => attempts.some(a => a.lift === l && a.result === null));

  if (upcomingLifts.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="font-saira text-3xl">🏆</p>
        <p className="font-saira text-sm text-zinc-400">All lifts complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingLifts.map(lift => {
        const lc = liftConfigs[lift];
        const liftAttempts = attempts.filter(a => a.lift === lift);
        const madeCount = liftAttempts.filter(a => a.result === "made").length;
        const doneCount = liftAttempts.filter(a => a.result !== null).length;
        const isCurrent = lift === currentLift;
        const isCompleted = doneCount === 3;
        if (isCompleted) return null;

        const steps = (lc?.flight_start && lc.flight_number && lc.opener_kg)
          ? calcSchedule(lc.flight_start, lc.flight_number, lc.opener_kg)
          : null;
        const stepIdx = steps ? getCurrentStepIdx(steps, now) : -1;
        const currentStep = steps?.[stepIdx];
        const nextStep    = steps?.[stepIdx + 1];

        // Opener time
        const openerTimeStr = steps ? steps[steps.length - 1].timeStr : null;

        return (
          <div key={lift} className={`rounded-2xl border p-4 space-y-3 ${isCurrent ? LIFT_RING[lift] : "border-white/8 bg-surface-alt"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] ${LIFT_TEXT[lift]}`}>{LIFT_LABELS[lift]}</p>
                {isCurrent && <span className={`font-saira text-[9px] rounded-full px-2 py-0.5 font-bold uppercase tracking-[0.12em] ${LIFT_COLORS[lift]}`}>Active</span>}
              </div>
              <div className="flex items-center gap-3 text-right">
                {openerTimeStr && <span className="font-saira text-[11px] text-zinc-400">Opener: {openerTimeStr}</span>}
                {lc?.opener_kg && <span className="font-saira text-sm font-bold text-white">{lc.opener_kg} kg</span>}
              </div>
            </div>

            {/* What to do right now */}
            {currentStep && isCurrent && (
              <div className={`rounded-xl border p-3 ${LIFT_RING[lift]}`}>
                <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Do this now</p>
                <div className="flex items-center gap-3">
                  <span className="font-saira text-2xl font-extrabold text-white tabular-nums">
                    {currentStep.loadKg !== null ? `${currentStep.loadKg} kg` : "Activations"}
                  </span>
                  {currentStep.reps && <span className={`font-saira text-sm font-bold ${LIFT_TEXT[lift]}`}>{currentStep.reps}</span>}
                </div>
                <p className="font-saira text-[10px] text-zinc-500 mt-0.5">{currentStep.timeStr}</p>
              </div>
            )}

            {/* Next step */}
            {nextStep && isCurrent && (
              <p className="font-saira text-[11px] text-zinc-400">
                Next: {nextStep.reps} {nextStep.loadKg !== null ? `${nextStep.loadKg} kg` : ""} at {nextStep.timeStr}
              </p>
            )}

            {/* Warm-up schedule */}
            {steps && (
              <details className="group">
                <summary className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer select-none list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span> Full warm-up schedule
                </summary>
                <div className="mt-2">
                  <WarmupSchedule liftConfig={lc!} lift={lift} currentStepIdx={stepIdx} />
                </div>
              </details>
            )}

            {!lc?.flight_start && (
              <p className="font-saira text-xs text-zinc-600">Coach hasn&rsquo;t set flight info yet.</p>
            )}

            {/* Attempt options (if coach revealed them) */}
            {showAttemptOptions && doneCount < 3 && (
              <div className="border-t border-white/5 pt-3 space-y-1">
                <p className="font-saira text-[9px] text-zinc-500 uppercase tracking-[0.16em] mb-1.5">Attempt options</p>
                {doneCount === 0 && lc?.opener_kg && (
                  <p className="font-saira text-sm text-white"><span className="text-zinc-400 text-xs">Opener</span> {lc.opener_kg} kg</p>
                )}
                {doneCount >= 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {lc?.attempt2a && <span className="font-saira text-xs rounded px-2 py-0.5 border border-zinc-600 text-zinc-300">2a: {lc.attempt2a} kg</span>}
                    {lc?.attempt2b && <span className={`font-saira text-xs rounded px-2 py-0.5 border font-bold ${LIFT_COLORS[lift]}`}>2b: {lc.attempt2b} kg</span>}
                    {lc?.attempt2c && <span className="font-saira text-xs rounded px-2 py-0.5 border border-zinc-600 text-zinc-400 italic">2c: {lc.attempt2c} kg</span>}
                  </div>
                )}
                {doneCount >= 2 && (
                  <div className="flex gap-2 flex-wrap">
                    {lc?.attempt3a && <span className="font-saira text-xs rounded px-2 py-0.5 border border-zinc-600 text-zinc-300">3a: {lc.attempt3a} kg</span>}
                    {lc?.attempt3b && <span className={`font-saira text-xs rounded px-2 py-0.5 border font-bold ${LIFT_COLORS[lift]}`}>3b: {lc.attempt3b} kg</span>}
                    {lc?.attempt3c && <span className="font-saira text-xs rounded px-2 py-0.5 border border-zinc-600 text-zinc-400 italic">3c: {lc.attempt3c} kg</span>}
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            {doneCount > 0 && (
              <div className="flex items-center gap-2">
                {([1, 2, 3] as const).map(n => {
                  const a = liftAttempts.find(a => a.attempt_num === n);
                  return (
                    <div key={n} className={`flex-1 h-1.5 rounded-full ${
                      a?.result === "made" ? "bg-emerald-400"
                      : a?.result === "red_light" ? "bg-amber-400"
                      : a?.result === "missed" ? "bg-rose-400"
                      : "bg-white/10"
                    }`} />
                  );
                })}
                <span className="font-saira text-[10px] text-zinc-500">{madeCount}/3 made</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Coach: meet setup form ────────────────────────────────────────────────────

type LiftSetupForm = {
  training_best_kg: string; goal_kg: string; record_kg: string;
  mental_cue: string; flight_start: string; flight_number: string;
  opener_kg: string; attempt2a: string; attempt2b: string; attempt2c: string;
  attempt3a: string; attempt3b: string; attempt3c: string;
};

const EMPTY_FORM: LiftSetupForm = {
  training_best_kg: "", goal_kg: "", record_kg: "",
  mental_cue: "", flight_start: "", flight_number: "",
  opener_kg: "", attempt2a: "", attempt2b: "", attempt2c: "",
  attempt3a: "", attempt3b: "", attempt3c: "",
};

function configToForm(lc: LiftMeetConfig): LiftSetupForm {
  const s = (v: number | null | undefined) => (v != null ? String(v) : "");
  return {
    training_best_kg: s(lc.training_best_kg), goal_kg: s(lc.goal_kg), record_kg: s(lc.record_kg),
    mental_cue: lc.mental_cue ?? "", flight_start: lc.flight_start ?? "", flight_number: s(lc.flight_number),
    opener_kg: s(lc.opener_kg), attempt2a: s(lc.attempt2a), attempt2b: s(lc.attempt2b), attempt2c: s(lc.attempt2c),
    attempt3a: s(lc.attempt3a), attempt3b: s(lc.attempt3b), attempt3c: s(lc.attempt3c),
  };
}

function formToConfig(f: LiftSetupForm): LiftMeetConfig {
  const n = (v: string) => parseFloat(v) || null;
  return {
    training_best_kg: n(f.training_best_kg), goal_kg: n(f.goal_kg), record_kg: n(f.record_kg),
    mental_cue: f.mental_cue.trim() || null, flight_start: f.flight_start || null,
    flight_number: parseInt(f.flight_number) || null, opener_kg: n(f.opener_kg),
    attempt2a: n(f.attempt2a), attempt2b: n(f.attempt2b), attempt2c: n(f.attempt2c),
    attempt3a: n(f.attempt3a), attempt3b: n(f.attempt3b), attempt3c: n(f.attempt3c),
  };
}

function CoachLiftSetupForm({
  lift, athleteId, existing, onSaved,
}: {
  lift: Lift; athleteId: string; existing?: LiftMeetConfig; onSaved: (lc: LiftMeetConfig) => void;
}) {
  const [form, setForm] = React.useState<LiftSetupForm>(existing ? configToForm(existing) : EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const col = LIFT_TEXT[lift];
  const set = (k: keyof LiftSetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    const lc = formToConfig(form);
    try {
      const res = await fetch("/api/meet-config", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: athleteId, lifts: { [lift]: lc } }),
      });
      if (res.ok) onSaved(lc);
    } finally { setSaving(false); }
  }

  // Auto-suggest warmup loads when opener changes
  const openerKg = parseFloat(form.opener_kg) || null;
  function suggest2b() {
    if (!openerKg) return;
    setForm(f => ({ ...f, attempt2b: String(r2_5(openerKg * 1.03)) }));
  }

  const inputCls = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-400/30 transition";

  return (
    <div className="space-y-4">
      {/* Row 1: Training best / Goal / Record */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Performance goals</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">Training best</label><input type="number" step="0.5" placeholder="e.g. 127.5" value={form.training_best_kg} onChange={set("training_best_kg")} className={inputCls} /></div>
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">Goal</label><input type="number" step="0.5" placeholder="e.g. 130" value={form.goal_kg} onChange={set("goal_kg")} className={inputCls} /></div>
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">Record / PR</label><input type="number" step="0.5" placeholder="e.g. 157.5" value={form.record_kg} onChange={set("record_kg")} className={inputCls} /></div>
        </div>
      </div>

      {/* Mental cue */}
      <div>
        <label className={`font-saira text-[9px] font-bold uppercase tracking-[0.2em] mb-1 block ${col}`}>Mental cue</label>
        <textarea placeholder={`e.g. "${lift === "squat" ? "Drive the floor away. Chest up." : lift === "bench" ? "Leg drive. Touch and explode." : "Pull the floor apart. Hips through."}"`} value={form.mental_cue} onChange={set("mental_cue")} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none resize-none focus:border-purple-400/30 transition" />
      </div>

      {/* Flight info */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Flight info</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">Flight start (24h)</label><input type="time" value={form.flight_start} onChange={set("flight_start")} className={inputCls} /></div>
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">Flight number</label><input type="number" min="1" max="30" placeholder="e.g. 5" value={form.flight_number} onChange={set("flight_number")} className={inputCls} /></div>
        </div>
        {form.flight_start && form.flight_number && form.opener_kg && (
          <p className="font-saira text-[10px] text-zinc-500 mt-1.5">
            Est. opener: {formatMin(parseHHMM(form.flight_start) + (parseInt(form.flight_number) || 0))}
          </p>
        )}
      </div>

      {/* Opener */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Opener</p>
        <input type="number" step="0.5" placeholder="e.g. 122.5" value={form.opener_kg} onChange={set("opener_kg")} className={inputCls} />
      </div>

      {/* Attempt 2 options */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">2nd attempt options</p>
          {openerKg && <button type="button" onClick={suggest2b} className="font-saira text-[9px] text-purple-400 hover:text-purple-300 transition">Suggest 2b (+3%)</button>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">2a conservative</label><input type="number" step="0.5" value={form.attempt2a} onChange={set("attempt2a")} className={inputCls} /></div>
          <div><label className={`font-saira text-[10px] mb-0.5 block font-semibold ${col}`}>2b as planned</label><input type="number" step="0.5" value={form.attempt2b} onChange={set("attempt2b")} className={inputCls} /></div>
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block italic">2c ON*</label><input type="number" step="0.5" value={form.attempt2c} onChange={set("attempt2c")} className={inputCls} /></div>
        </div>
      </div>

      {/* Attempt 3 options */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">3rd attempt options</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block">3a conservative</label><input type="number" step="0.5" value={form.attempt3a} onChange={set("attempt3a")} className={inputCls} /></div>
          <div><label className={`font-saira text-[10px] mb-0.5 block font-semibold ${col}`}>3b as planned</label><input type="number" step="0.5" value={form.attempt3b} onChange={set("attempt3b")} className={inputCls} /></div>
          <div><label className="font-saira text-[10px] text-zinc-500 mb-0.5 block italic">3c ON*</label><input type="number" step="0.5" value={form.attempt3c} onChange={set("attempt3c")} className={inputCls} /></div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className={`w-full rounded-xl py-2.5 font-saira text-[11px] font-bold uppercase tracking-[0.18em] transition disabled:opacity-50 ${
        lift === "squat" ? "bg-purple-600 hover:bg-purple-500 text-white"
        : lift === "bench" ? "bg-sky-600 hover:bg-sky-500 text-white"
        : "bg-amber-600 hover:bg-amber-500 text-white"
      }`}>
        {saving ? "Saving…" : `Save ${LIFT_LABELS_SHORT[lift]}`}
      </button>
    </div>
  );
}

// ── Coach: Live lift card ─────────────────────────────────────────────────────

function CoachLiftCard({
  lift, liftConfig, attempts, meetDate, athleteId,
  onAttemptPush,
}: {
  lift: Lift; liftConfig: LiftMeetConfig; attempts: Attempt[]; meetDate: string; athleteId: string;
  onAttemptPush: (lift: Lift, num: 2 | 3, kg: number) => void;
}) {
  const [now, setNow] = React.useState(nowMin());
  const [pushing, setPushing] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = setInterval(() => setNow(nowMin()), 30000);
    return () => clearInterval(id);
  }, []);

  const liftAttempts = attempts.filter(a => a.lift === lift);
  const doneCount = liftAttempts.filter(a => a.result !== null).length;
  const madeCount = liftAttempts.filter(a => a.result === "made").length;
  const allDone = doneCount === 3;

  const steps = (liftConfig.flight_start && liftConfig.flight_number && liftConfig.opener_kg)
    ? calcSchedule(liftConfig.flight_start, liftConfig.flight_number, liftConfig.opener_kg)
    : null;
  const stepIdx = steps ? getCurrentStepIdx(steps, now) : -1;

  async function pushAttempt(num: 2 | 3, kg: number, label: string) {
    setPushing(label);
    try {
      await fetch("/api/meet-attempts", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: athleteId, lift, attempt_num: num, meet_date: meetDate, planned_kg: kg }),
      });
      onAttemptPush(lift, num, kg);
    } finally { setPushing(null); }
  }

  const col = LIFT_COLORS[lift];
  const txt = LIFT_TEXT[lift];

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${allDone ? "opacity-60" : LIFT_RING[lift]}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className={`font-saira text-sm font-bold uppercase tracking-[0.14em] ${txt}`}>{LIFT_LABELS[lift]}</p>
          {allDone && <span className="font-saira text-[9px] rounded-full px-2 py-0.5 border border-white/20 text-zinc-400">Done</span>}
        </div>
        <div className="flex items-center gap-3 text-right">
          {liftConfig.training_best_kg && <span className="font-saira text-[10px] text-zinc-500">Best: <span className="text-zinc-300 font-semibold">{liftConfig.training_best_kg} kg</span></span>}
          {liftConfig.goal_kg && <span className="font-saira text-[10px] text-zinc-500">Goal: <span className={`font-semibold ${txt}`}>{liftConfig.goal_kg} kg</span></span>}
          {liftConfig.record_kg && <span className="font-saira text-[10px] text-zinc-500">PR: <span className="text-emerald-300 font-semibold">{liftConfig.record_kg} kg</span></span>}
        </div>
      </div>

      {/* Mental cue */}
      {liftConfig.mental_cue && (
        <p className="font-saira text-xs text-zinc-400 italic">&ldquo;{liftConfig.mental_cue}&rdquo;</p>
      )}

      {/* Attempt results */}
      <div className="flex gap-2">
        {([1, 2, 3] as const).map(n => {
          const a = liftAttempts.find(x => x.attempt_num === n);
          return (
            <div key={n} className={`flex-1 rounded-lg border px-2 py-1.5 text-center ${
              a?.result === "made"       ? "border-emerald-400/30 bg-emerald-500/10"
              : a?.result === "red_light" ? "border-amber-400/30 bg-amber-500/10"
              : a?.result === "missed"    ? "border-rose-400/30 bg-rose-500/5"
              : "border-white/5 bg-white/3"
            }`}>
              <p className="font-saira text-[9px] text-zinc-500 uppercase">{n === 1 ? "Open" : n === 2 ? "2nd" : "3rd"}</p>
              <p className="font-saira text-sm font-bold text-white tabular-nums">{a?.actual_kg ?? a?.planned_kg ?? "—"}</p>
              <p className="font-saira text-[9px]">
                {a?.result === "made" ? "✓" : a?.result === "red_light" ? "⚑" : a?.result === "missed" ? "✗" : ""}
              </p>
            </div>
          );
        })}
        <div className="text-center">
          <p className="font-saira text-[9px] text-zinc-500">Made</p>
          <p className={`font-saira text-sm font-bold tabular-nums ${txt}`}>{madeCount}/3</p>
        </div>
      </div>

      {/* Warm-up schedule */}
      {steps && (
        <div>
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Warm-up schedule</p>
          <WarmupSchedule liftConfig={liftConfig} lift={lift} currentStepIdx={stepIdx} />
        </div>
      )}

      {/* Attempt options — shown after each attempt */}
      {!allDone && (
        <div className="border-t border-white/5 pt-3 space-y-2">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">Attempt options</p>

          {/* 2nd attempt selector */}
          {doneCount >= 1 && doneCount < 2 && (
            <div>
              <p className={`font-saira text-[10px] font-semibold mb-1.5 ${txt}`}>Select 2nd attempt</p>
              <div className="flex gap-2">
                {[
                  { label: "2a", kg: liftConfig.attempt2a, note: "conservative", dim: true },
                  { label: "2b", kg: liftConfig.attempt2b, note: "as planned", dim: false },
                  { label: "2c", kg: liftConfig.attempt2c, note: "ON*", dim: true },
                ].filter(o => o.kg != null).map(o => (
                  <button
                    key={o.label}
                    onClick={() => pushAttempt(2, o.kg!, o.label)}
                    disabled={pushing === o.label}
                    className={`flex-1 rounded-lg border py-2 font-saira text-xs transition disabled:opacity-50 ${
                      o.dim
                        ? "border-white/10 text-zinc-300 hover:border-white/20"
                        : `border ${col} font-bold hover:opacity-90`
                    }`}
                  >
                    <p>{o.label}</p>
                    <p className="font-bold text-sm">{o.kg} kg</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{pushing === o.label ? "…" : o.note}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3rd attempt selector */}
          {doneCount >= 2 && doneCount < 3 && (
            <div>
              <p className={`font-saira text-[10px] font-semibold mb-1.5 ${txt}`}>Select 3rd attempt</p>
              <div className="flex gap-2">
                {[
                  { label: "3a", kg: liftConfig.attempt3a, note: "conservative", dim: true },
                  { label: "3b", kg: liftConfig.attempt3b, note: "as planned", dim: false },
                  { label: "3c", kg: liftConfig.attempt3c, note: "ON*", dim: true },
                ].filter(o => o.kg != null).map(o => (
                  <button
                    key={o.label}
                    onClick={() => pushAttempt(3, o.kg!, o.label)}
                    disabled={pushing === o.label}
                    className={`flex-1 rounded-lg border py-2 font-saira text-xs transition disabled:opacity-50 ${
                      o.dim
                        ? "border-white/10 text-zinc-300 hover:border-white/20"
                        : `border ${col} font-bold hover:opacity-90`
                    }`}
                  >
                    <p>{o.label}</p>
                    <p className="font-bold text-sm">{o.kg} kg</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{pushing === o.label ? "…" : o.note}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coach: full meet dashboard (EXPORT) ───────────────────────────────────────

export function CoachMeetDashboard({ athleteId, meetDate }: { athleteId: string; meetDate: string }) {
  const [liftConfigs, setLiftConfigs] = React.useState<Partial<Record<Lift, LiftMeetConfig>>>({});
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingLift, setEditingLift] = React.useState<Lift | null>(null);
  const [showSetup, setShowSetup] = React.useState(false);
  const [showAthleteOptions, setShowAthleteOptions] = React.useState(false);
  const [savingToggle, setSavingToggle] = React.useState(false);

  async function load() {
    const [cfgRaw, att] = await Promise.all([
      fetch(`/api/meet-config?athlete_id=${athleteId}`).then(r => r.ok ? r.json() : {}),
      fetch(`/api/meet-attempts?athlete_id=${athleteId}&meet_date=${meetDate}`).then(r => r.ok ? r.json() : []),
    ]);
    const cfg = cfgRaw as MeetConfig;
    setLiftConfigs(cfg.lifts ?? {});
    setShowAthleteOptions(cfg.show_attempt_options ?? false);
    setAttempts(att);
    setLoading(false);
  }

  React.useEffect(() => { load(); }, [athleteId, meetDate]);

  async function toggleAthleteOptions() {
    setSavingToggle(true);
    const next = !showAthleteOptions;
    setShowAthleteOptions(next);
    await fetch("/api/meet-config", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athlete_id: athleteId, show_attempt_options: next }),
    });
    setSavingToggle(false);
  }

  function handleAttemptPush(lift: Lift, num: 2 | 3, kg: number) {
    setAttempts(prev => prev.map(a =>
      a.lift === lift && a.attempt_num === num ? { ...a, planned_kg: kg } : a
    ));
  }

  function handleLiftSaved(lift: Lift, lc: LiftMeetConfig) {
    setLiftConfigs(prev => ({ ...prev, [lift]: lc }));
    setEditingLift(null);
  }

  const best: Record<Lift, number | null> = { squat: null, bench: null, deadlift: null };
  for (const a of attempts) {
    if (a.result === "made" && a.actual_kg) {
      if (best[a.lift] === null || a.actual_kg > best[a.lift]!) best[a.lift] = a.actual_kg;
    }
  }
  const total = (best.squat ?? 0) + (best.bench ?? 0) + (best.deadlift ?? 0);

  const hasAnyConfig = LIFTS.some(l => liftConfigs[l]);

  if (loading) return <div className="flex justify-center py-4"><div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Total + controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {total > 0 && (
            <p className="font-saira text-xl font-extrabold text-white tabular-nums">
              {total} kg total
            </p>
          )}
          <p className="font-saira text-[10px] text-zinc-500">{attempts.filter(a => a.result === "made").length} made · {attempts.filter(a => a.result !== null).length}/9 done</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleAthleteOptions} disabled={savingToggle} className={`rounded-lg border px-3 py-1.5 font-saira text-[10px] transition disabled:opacity-50 ${showAthleteOptions ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-zinc-400 hover:text-zinc-300"}`}>
            {showAthleteOptions ? "✓ Athlete sees options" : "Show options to athlete"}
          </button>
          <button onClick={() => setShowSetup(v => !v)} className="rounded-lg border border-white/10 px-3 py-1.5 font-saira text-[10px] text-zinc-400 hover:text-zinc-300 transition">
            {showSetup ? "Hide setup" : "Edit setup"}
          </button>
        </div>
      </div>

      {/* Setup panel */}
      {showSetup && (
        <div className="rounded-2xl border border-white/10 bg-surface-alt p-4 space-y-4">
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Game Day Setup</p>
          <div className="flex gap-2">
            {LIFTS.map(lift => (
              <button
                key={lift}
                onClick={() => setEditingLift(editingLift === lift ? null : lift)}
                className={`flex-1 rounded-xl border py-2 font-saira text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  editingLift === lift ? `${LIFT_COLORS[lift]} border-current` : "border-white/10 text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {LIFT_LABELS_SHORT[lift]}
                {liftConfigs[lift]?.opener_kg && (
                  <span className="block text-[9px] font-normal text-zinc-500">{liftConfigs[lift]!.opener_kg} kg</span>
                )}
              </button>
            ))}
          </div>
          {editingLift && (
            <CoachLiftSetupForm
              key={editingLift}
              lift={editingLift}
              athleteId={athleteId}
              existing={liftConfigs[editingLift]}
              onSaved={lc => handleLiftSaved(editingLift, lc)}
            />
          )}
        </div>
      )}

      {/* No config hint */}
      {!hasAnyConfig && !showSetup && (
        <div className="rounded-xl border border-white/10 bg-surface-alt px-4 py-3 text-center">
          <p className="font-saira text-xs text-zinc-400">No meet data set yet.</p>
          <button onClick={() => setShowSetup(true)} className="font-saira text-xs text-purple-400 hover:text-purple-300 transition mt-1">Set up Game Day Sheet →</button>
        </div>
      )}

      {/* Live lift cards */}
      {LIFTS.map(lift => {
        const lc = liftConfigs[lift];
        if (!lc) return null;
        return (
          <CoachLiftCard
            key={lift}
            lift={lift}
            liftConfig={lc}
            attempts={attempts}
            meetDate={meetDate}
            athleteId={athleteId}
            onAttemptPush={handleAttemptPush}
          />
        );
      })}
    </div>
  );
}

// ── Backwards-compat export ───────────────────────────────────────────────────

export function CoachAttemptViewer({ athleteId, meetDate }: { athleteId: string; meetDate: string }) {
  return <CoachMeetDashboard athleteId={athleteId} meetDate={meetDate} />;
}

// ── Main MeetDayMode (athlete) ────────────────────────────────────────────────

export default function MeetDayMode({ profile }: { profile: Profile }) {
  const meetDate = profile.meet_date ?? new Date().toISOString().slice(0, 10);
  const cfg: MeetConfig = profile.meet_config ?? {};
  const liftConfigs: Partial<Record<Lift, LiftMeetConfig>> = cfg.lifts ?? {};
  const affirmations = cfg.affirmations ?? profile.affirmations ?? [];
  const showAttemptOptions = cfg.show_attempt_options ?? false;
  const vizKeywords = profile.viz_keywords ?? {};

  function buildAttempts(): Attempt[] {
    const rows: Attempt[] = [];
    for (const lift of LIFTS) {
      const opener = liftConfigs[lift]?.opener_kg ?? (cfg[`${lift}_opener` as keyof MeetConfig] as number | null | undefined) ?? null;
      for (const n of [1, 2, 3] as const) {
        rows.push({ lift, attempt_num: n, planned_kg: n === 1 ? opener : null, actual_kg: null, result: null });
      }
    }
    return rows;
  }

  const [attempts, setAttempts] = React.useState<Attempt[]>(buildAttempts);
  const [loaded, setLoaded] = React.useState(false);
  const [section, setSection] = React.useState<"focus" | "timing" | "attempts">("focus");
  const [showSummary, setShowSummary] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/meet-attempts?meet_date=${meetDate}`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: Attempt[]) => {
        if (rows.length > 0) {
          setAttempts(prev => prev.map(a => {
            const found = rows.find(r => r.lift === a.lift && r.attempt_num === a.attempt_num);
            return found ? { ...a, ...found } : a;
          }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [meetDate]);

  function updateAttempt(lift: Lift, num: number, updated: Attempt) {
    setAttempts(prev => {
      const next = prev.map(a => (a.lift === lift && a.attempt_num === num) ? updated : a);
      if (updated.result && updated.actual_kg && num < 3) {
        const nextNum = (num + 1) as 2 | 3;
        const nextAttempt = next.find(a => a.lift === lift && a.attempt_num === nextNum);
        if (nextAttempt && nextAttempt.planned_kg === null && nextAttempt.result === null) {
          return next.map(a =>
            a.lift === lift && a.attempt_num === nextNum
              ? { ...a, planned_kg: (updated.actual_kg as number) + 2.5 }
              : a
          );
        }
      }
      return next;
    });
  }

  const allDone = loaded && attempts.length === 9 && attempts.every(a => a.result !== null);

  const tabs = [
    { key: "focus",    label: "Focus" },
    { key: "timing",   label: "Timing" },
    { key: "attempts", label: "Attempts" },
  ] as const;

  return (
    <div className="space-y-5 pb-10">
      {/* Hero */}
      <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-purple-600/10 p-5 text-center">
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.28em] text-rose-400 mb-1">Today</p>
        <h1 className="font-saira text-3xl font-extrabold text-white tracking-tight">🏆 Meet Day</h1>
        <p className="font-saira text-sm text-zinc-400 mt-1">
          {new Date(meetDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        {profile.display_name && (
          <p className="font-saira text-xs text-zinc-500 mt-0.5">
            Go get it, {profile.display_name.split(" ")[0]}. Trust the work.
          </p>
        )}
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setSection(t.key); setShowSummary(false); }}
            className={`flex-1 rounded-xl py-2 font-saira text-[11px] font-bold uppercase tracking-[0.14em] border transition ${
              section === t.key
                ? "border-purple-400/40 bg-purple-500/15 text-purple-300"
                : "border-white/10 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Focus ── */}
      {section === "focus" && (
        <AthleteFocusTab
          liftConfigs={liftConfigs}
          attempts={attempts}
          affirmations={affirmations}
          vizKeywords={vizKeywords}
        />
      )}

      {/* ── Timing ── */}
      {section === "timing" && (
        <AthleteTimingTab
          liftConfigs={liftConfigs}
          attempts={attempts}
          showAttemptOptions={showAttemptOptions}
        />
      )}

      {/* ── Attempts ── */}
      {section === "attempts" && (
        <div className="space-y-4">
          <CompScoreboard attempts={attempts} />

          {allDone && !showSummary && (
            <button
              onClick={() => setShowSummary(true)}
              className="w-full rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              🏆 View competition summary
            </button>
          )}

          {showSummary ? (
            <PostMeetSummary attempts={attempts} onBack={() => setShowSummary(false)} />
          ) : (
            <>
              {!loaded && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
                </div>
              )}

              {loaded && LIFTS.map(lift => (
                <div key={lift} className="space-y-2">
                  <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] ${LIFT_TEXT[lift]}`}>
                    {LIFT_LABELS[lift]}
                  </p>
                  {([1, 2, 3] as const).map(num => {
                    const attempt = attempts.find(a => a.lift === lift && a.attempt_num === num)!;
                    const prev = num > 1 ? attempts.find(a => a.lift === lift && a.attempt_num === (num - 1) as 1 | 2) : undefined;
                    const locked = num > 1 && prev?.result === null;
                    return (
                      <AttemptRow
                        key={num} lift={lift} num={num} attempt={attempt}
                        meetDate={meetDate} locked={locked}
                        onChange={a => updateAttempt(lift, num, a)}
                      />
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
