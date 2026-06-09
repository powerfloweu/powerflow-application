"use client";
import React from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type MeetConfig = {
  squat_opener?: number | null;
  bench_opener?: number | null;
  deadlift_opener?: number | null;
  flight_size?: number | null;
  seconds_per_person?: number | null;
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

const LIFTS = ["squat", "bench", "deadlift"] as const;
type Lift = typeof LIFTS[number];

const LIFT_LABELS: Record<Lift, string> = { squat: "Squat", bench: "Bench Press", deadlift: "Deadlift" };
const LIFT_COLORS: Record<Lift, string> = {
  squat:     "text-purple-400 border-purple-400/30 bg-purple-500/10",
  bench:     "text-sky-400    border-sky-400/30    bg-sky-500/10",
  deadlift:  "text-amber-400  border-amber-400/30  bg-amber-500/10",
};
const LIFT_KEYWORD_KEY: Record<Lift, string> = {
  squat: "viz-squat", bench: "viz-bench", deadlift: "viz-deadlift",
};

// ── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ flightSize, secPerPerson }: { flightSize: number; secPerPerson: number }) {
  const totalSec = (flightSize - 1) * secPerPerson;
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [running, setRunning] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  function start() {
    setRemaining(totalSec);
    setRunning(true);
  }
  function reset() {
    setRunning(false);
    setRemaining(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  React.useEffect(() => {
    if (running && remaining !== null) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r === null || r <= 1) { setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins = remaining !== null ? Math.floor(remaining / 60) : Math.floor(totalSec / 60);
  const secs = remaining !== null ? remaining % 60 : totalSec % 60;
  const pct  = remaining !== null ? (remaining / totalSec) * 100 : 100;
  const warn = remaining !== null && remaining <= 120;
  const done = remaining === 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-surface-alt p-4 space-y-3">
      <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Rest timer</p>
      <div className="flex items-center gap-4">
        <div className={`font-saira text-4xl font-extrabold tabular-nums tracking-tight ${done ? "text-emerald-400" : warn ? "text-rose-400 animate-pulse" : "text-white"}`}>
          {done ? "GO!" : `${mins}:${String(secs).padStart(2, "0")}`}
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${done ? "bg-emerald-400" : warn ? "bg-rose-400" : "bg-purple-400"}`}
                 style={{ width: `${pct}%` }} />
          </div>
          <p className="font-saira text-[10px] text-zinc-500">
            {flightSize - 1} athletes × {secPerPerson}s = {Math.floor(totalSec / 60)}:{String(totalSec % 60).padStart(2,"0")} total
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {!running && !done && (
          <button onClick={start}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-white transition">
            ▶ Start after my attempt
          </button>
        )}
        {(running || done) && (
          <button onClick={reset}
            className="flex-1 rounded-xl border border-white/10 hover:border-white/20 px-4 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300 transition">
            Reset
          </button>
        )}
      </div>
      {warn && !done && remaining !== null && (
        <p className="font-saira text-xs text-rose-400 font-semibold">⚡ Start your warm-up now!</p>
      )}
    </div>
  );
}

// ── Attempt Row ──────────────────────────────────────────────────────────────

function AttemptRow({ lift, num, attempt, meetDate, onChange }: {
  lift: Lift; num: 1 | 2 | 3; attempt: Attempt;
  meetDate: string; onChange: (a: Attempt) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [kg, setKg] = React.useState(String(attempt.actual_kg ?? attempt.planned_kg ?? ""));

  async function save(result: "made" | "missed") {
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
    } finally { setSaving(false); setEditing(false); }
  }

  const labelNum = num === 1 ? "Opener" : num === 2 ? "2nd" : "3rd";
  const col = LIFT_COLORS[lift];

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${attempt.result === "made" ? "border-emerald-400/30 bg-emerald-500/5" : attempt.result ? "border-rose-400/30 bg-rose-500/5" : "border-white/8 bg-surface-alt"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] rounded px-1.5 py-0.5 border ${col}`}>{labelNum}</span>
          {editing ? (
            <input type="number" value={kg} onChange={(e) => setKg(e.target.value)} step="0.5"
              className="w-20 rounded border border-white/20 bg-white/5 px-2 py-0.5 font-saira text-sm text-white outline-none focus:border-purple-400/40" />
          ) : (
            <button onClick={() => setEditing(true)} className="font-saira text-lg font-extrabold text-white tabular-nums">
              {attempt.actual_kg ?? attempt.planned_kg ?? "—"} <span className="text-zinc-400 text-xs">kg</span>
            </button>
          )}
        </div>
        {attempt.result && (
          <span className={`font-saira text-xs font-bold ${attempt.result === "made" ? "text-emerald-400" : "text-rose-400"}`}>
            {attempt.result === "made" ? "✓ Made" : "✗ Missed"}
          </span>
        )}
      </div>
      {!attempt.result && (
        <div className="flex gap-2">
          <button onClick={() => save("made")} disabled={saving}
            className="flex-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 py-1.5 font-saira text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50">
            ✓ Made
          </button>
          <button onClick={() => save("missed")} disabled={saving}
            className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/10 py-1.5 font-saira text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50">
            ✗ Missed
          </button>
        </div>
      )}
      {attempt.result && (
        <button onClick={() => { onChange({ ...attempt, result: null, actual_kg: null }); }}
          className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition">
          undo
        </button>
      )}
    </div>
  );
}

// ── Prep Lift Gallery ────────────────────────────────────────────────────────

type PrepLift = {
  id: string; lift: string; weight_kg: number | null; title: string | null;
  video_url: string | null; lift_date: string | null;
  athlete_notes: string | null; coach_notes: string | null;
};

function PrepLiftGallery({ isCoach, athleteId }: { isCoach?: boolean; athleteId?: string }) {
  const [lifts, setLifts] = React.useState<PrepLift[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ lift: "squat", weight_kg: "", title: "", video_url: "", lift_date: "", athlete_notes: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const url = athleteId ? `/api/prep-lifts?athlete_id=${athleteId}` : "/api/prep-lifts";
    fetch(url).then(r => r.ok ? r.json() : []).then(setLifts).catch(() => {});
  }, [athleteId]);

  async function addLift() {
    setSaving(true);
    try {
      const res = await fetch("/api/prep-lifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weight_kg: parseFloat(form.weight_kg) || undefined }),
      });
      if (res.ok) {
        const url = athleteId ? `/api/prep-lifts?athlete_id=${athleteId}` : "/api/prep-lifts";
        const updated = await fetch(url).then(r => r.json());
        setLifts(updated);
        setAdding(false);
        setForm({ lift: "squat", weight_kg: "", title: "", video_url: "", lift_date: "", athlete_notes: "" });
      }
    } finally { setSaving(false); }
  }

  async function saveCoachNote(id: string, note: string) {
    await fetch("/api/prep-lifts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, coach_notes: note }),
    });
    setLifts(prev => prev.map(l => l.id === id ? { ...l, coach_notes: note } : l));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Prep highlights</p>
        {!isCoach && (
          <button onClick={() => setAdding(v => !v)}
            className="font-saira text-[10px] text-purple-400 hover:text-purple-300 transition">
            {adding ? "Cancel" : "+ Add lift"}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-xl border border-white/10 bg-surface-alt p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.lift} onChange={e => setForm(f => ({ ...f, lift: e.target.value }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white outline-none">
              {["squat","bench","deadlift","general"].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
            </select>
            <input type="number" placeholder="Weight (kg)" value={form.weight_kg}
              onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} step="0.5"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />
            <input type="text" placeholder="Title (optional)" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />
            <input type="url" placeholder="Video URL (YouTube / Vimeo)" value={form.video_url}
              onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none" />
            <input type="date" value={form.lift_date}
              onChange={e => setForm(f => ({ ...f, lift_date: e.target.value }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white outline-none" />
            <textarea placeholder="Your notes…" value={form.athlete_notes} rows={2}
              onChange={e => setForm(f => ({ ...f, athlete_notes: e.target.value }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none resize-none" />
          </div>
          <button onClick={addLift} disabled={saving}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-white disabled:opacity-50 transition">
            {saving ? "Saving…" : "Save lift"}
          </button>
        </div>
      )}

      {lifts.length === 0 && !adding && (
        <p className="font-saira text-xs text-zinc-500 text-center py-3">No prep lifts added yet.</p>
      )}

      {lifts.map(l => (
        <PrepLiftCard key={l.id} lift={l} isCoach={isCoach} onCoachNote={saveCoachNote} />
      ))}
    </div>
  );
}

function PrepLiftCard({ lift, isCoach, onCoachNote }: {
  lift: PrepLift; isCoach?: boolean;
  onCoachNote: (id: string, note: string) => void;
}) {
  const [coachNote, setCoachNote] = React.useState(lift.coach_notes ?? "");
  const [editingNote, setEditingNote] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);
  const liftColor = LIFT_COLORS[(lift.lift as Lift) ?? "squat"] ?? "text-zinc-400 border-zinc-400/30 bg-zinc-500/10";

  async function saveNote() {
    setSavingNote(true);
    await onCoachNote(lift.id, coachNote);
    setSavingNote(false);
    setEditingNote(false);
  }

  return (
    <div className="rounded-xl border border-white/8 bg-surface-alt p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`font-saira text-[9px] font-bold uppercase tracking-[0.18em] rounded px-1.5 py-0.5 border ${LIFT_COLORS[(lift.lift as Lift)] ?? liftColor}`}>
              {lift.lift}
            </span>
            {lift.weight_kg && <span className="font-saira text-sm font-bold text-white">{lift.weight_kg} kg</span>}
            {lift.lift_date && <span className="font-saira text-[10px] text-zinc-500">{new Date(lift.lift_date).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span>}
          </div>
          {lift.title && <p className="font-saira text-xs text-zinc-300">{lift.title}</p>}
        </div>
        {lift.video_url && (
          <a href={lift.video_url} target="_blank" rel="noopener"
            className="flex-shrink-0 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-1 font-saira text-[10px] text-purple-300 hover:bg-purple-500/20 transition">
            ▶ Watch
          </a>
        )}
      </div>
      {lift.athlete_notes && <p className="font-saira text-xs text-zinc-400 italic">{lift.athlete_notes}</p>}

      {/* Coach note */}
      {(lift.coach_notes || isCoach) && (
        <div className="border-t border-white/5 pt-2">
          {isCoach && editingNote ? (
            <div className="space-y-1.5">
              <textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} rows={2} placeholder="Add a coaching note…"
                className="w-full rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-1.5 font-saira text-xs text-white placeholder-zinc-500 outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={saveNote} disabled={savingNote}
                  className="rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1 font-saira text-[10px] font-bold text-white disabled:opacity-50 transition">
                  {savingNote ? "Saving…" : "Save note"}
                </button>
                <button onClick={() => setEditingNote(false)} className="font-saira text-[10px] text-zinc-500 hover:text-zinc-300 transition">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              {lift.coach_notes
                ? <p className="font-saira text-[11px] text-amber-300/80 italic">Coach: {lift.coach_notes}</p>
                : <span />}
              {isCoach && (
                <button onClick={() => setEditingNote(true)}
                  className="font-saira text-[10px] text-amber-400/60 hover:text-amber-300 transition flex-shrink-0">
                  {lift.coach_notes ? "Edit note" : "+ Add note"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main MeetDayMode ─────────────────────────────────────────────────────────

export default function MeetDayMode({ profile }: { profile: Profile }) {
  const meetDate = profile.meet_date ?? new Date().toISOString().slice(0, 10);
  const cfg = profile.meet_config ?? {};
  const flightSize = cfg.flight_size ?? 8;
  const secPerPerson = cfg.seconds_per_person ?? 90;
  const kw = profile.viz_keywords ?? {};
  const affirmations = profile.affirmations ?? [];

  const buildAttempts = (): Attempt[] => {
    const rows: Attempt[] = [];
    for (const lift of LIFTS) {
      const opener = cfg[`${lift}_opener` as keyof MeetConfig] as number | null | undefined ?? null;
      for (const n of [1, 2, 3] as const) {
        rows.push({ lift, attempt_num: n, planned_kg: opener, actual_kg: null, result: null });
      }
    }
    return rows;
  };

  const [attempts, setAttempts] = React.useState<Attempt[]>(buildAttempts);
  const [loaded, setLoaded] = React.useState(false);
  const [section, setSection] = React.useState<"mental" | "attempts" | "prep">("mental");

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
    setAttempts(prev => prev.map(a => (a.lift === lift && a.attempt_num === num) ? updated : a));
  }

  const tabs = [
    { key: "mental",  label: "Mental prep" },
    { key: "attempts",label: "Attempts" },
    { key: "prep",    label: "Prep lifts" },
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
          <p className="font-saira text-xs text-zinc-500 mt-0.5">Good luck, {profile.display_name.split(" ")[0]}. Trust the work.</p>
        )}
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className={`flex-1 rounded-xl py-2 font-saira text-[11px] font-bold uppercase tracking-[0.14em] border transition ${section === t.key ? "border-purple-400/40 bg-purple-500/15 text-purple-300" : "border-white/10 text-zinc-400 hover:text-zinc-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mental prep */}
      {section === "mental" && (
        <div className="space-y-4">
          {/* Comp day visualization */}
          <div className="rounded-2xl border border-white/8 bg-surface-alt p-4">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400 mb-2">Competition visualization</p>
            <a href="/library" className="flex items-center justify-between rounded-xl border border-purple-400/25 bg-purple-500/10 px-4 py-3 hover:bg-purple-500/15 transition">
              <div>
                <p className="font-saira text-sm font-semibold text-purple-300">Competition Day Visualization</p>
                <p className="font-saira text-[11px] text-zinc-400">12-min guided audio · All 9 attempts</p>
              </div>
              <span className="text-purple-400 text-lg">▶</span>
            </a>
          </div>

          {/* Affirmations */}
          {affirmations.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-surface-alt p-4 space-y-2">
              <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Affirmations</p>
              {affirmations.map((a, i) => (
                <p key={i} className="font-saira text-sm text-zinc-200 leading-relaxed">&ldquo;{a}&rdquo;</p>
              ))}
            </div>
          )}

          {/* Lift cues */}
          <div className="rounded-2xl border border-white/8 bg-surface-alt p-4 space-y-3">
            <p className="font-saira text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-400">Lift cues</p>
            {LIFTS.map(lift => {
              const cues = kw[LIFT_KEYWORD_KEY[lift]] ?? [];
              return (
                <div key={lift}>
                  <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5 ${lift === "squat" ? "text-purple-400" : lift === "bench" ? "text-sky-400" : "text-amber-400"}`}>
                    {LIFT_LABELS[lift]}
                  </p>
                  {cues.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cues.map((c, i) => (
                        <span key={i} className={`rounded-full border px-2.5 py-0.5 font-saira text-xs font-semibold ${LIFT_COLORS[lift]}`}>{c}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-saira text-xs text-zinc-500">No cues set — add them in the visualization tools.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempt tracker */}
      {section === "attempts" && (
        <div className="space-y-4">
          <CountdownTimer flightSize={flightSize} secPerPerson={secPerPerson} />

          {!loaded && <div className="flex justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" /></div>}

          {loaded && LIFTS.map(lift => (
            <div key={lift} className="space-y-2">
              <p className={`font-saira text-[10px] font-bold uppercase tracking-[0.18em] ${lift === "squat" ? "text-purple-400" : lift === "bench" ? "text-sky-400" : "text-amber-400"}`}>
                {LIFT_LABELS[lift]}
              </p>
              {([1, 2, 3] as const).map(num => {
                const attempt = attempts.find(a => a.lift === lift && a.attempt_num === num)!;
                return (
                  <AttemptRow key={num} lift={lift} num={num} attempt={attempt}
                    meetDate={meetDate} onChange={a => updateAttempt(lift, num, a)} />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Prep lifts */}
      {section === "prep" && <PrepLiftGallery />}
    </div>
  );
}

export { PrepLiftGallery };
