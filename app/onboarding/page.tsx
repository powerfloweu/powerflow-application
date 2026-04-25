"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { WEIGHT_CATEGORIES } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoachOption {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">
          Step {step} of {total}
        </p>
        <p className="font-saira text-[10px] text-zinc-500">
          {Math.round((step / total) * 100)}%
        </p>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-purple-600 transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-1.5">
      {children}
    </p>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2.5 font-saira text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder-zinc-600";

const pillCls = (active: boolean) =>
  `flex-1 rounded-xl border py-3 font-saira text-sm font-semibold transition ${
    active
      ? "border-purple-500 bg-purple-600 text-white"
      : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
  }`;

const dayBtnCls = (active: boolean) =>
  `w-9 h-9 rounded-xl border font-saira text-sm font-semibold transition ${
    active
      ? "border-purple-500 bg-purple-600 text-white"
      : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
  }`;

// ── Step 1 — About you ────────────────────────────────────────────────────────

function Step1({
  displayName,
  setDisplayName,
  gender,
  setGender,
  bodyweight,
  setBodyweight,
  weightCat,
  setWeightCat,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  gender: "male" | "female" | "";
  setGender: (v: "male" | "female") => void;
  bodyweight: string;
  setBodyweight: (v: string) => void;
  weightCat: string;
  setWeightCat: (v: string) => void;
}) {
  const cats = gender ? WEIGHT_CATEGORIES[gender] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          About you
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Tell us the basics so we can personalise your experience.
        </p>
      </div>

      {/* Display name */}
      <div>
        <SectionLabel>Your name</SectionLabel>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full name"
          className={inputCls}
        />
      </div>

      {/* Gender */}
      <div>
        <SectionLabel>Gender</SectionLabel>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setGender("male"); setWeightCat(""); }}
            className={pillCls(gender === "male")}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => { setGender("female"); setWeightCat(""); }}
            className={pillCls(gender === "female")}
          >
            Female
          </button>
        </div>
      </div>

      {/* Bodyweight */}
      <div>
        <SectionLabel>Bodyweight (kg)</SectionLabel>
        <input
          type="number"
          inputMode="decimal"
          value={bodyweight}
          onChange={(e) => setBodyweight(e.target.value)}
          placeholder="e.g. 82.5"
          min={0}
          className={inputCls}
        />
      </div>

      {/* Weight category */}
      <div>
        <SectionLabel>Weight category</SectionLabel>
        <select
          value={weightCat}
          onChange={(e) => setWeightCat(e.target.value)}
          disabled={!gender}
          className={`${inputCls} disabled:opacity-40 appearance-none`}
        >
          <option value="">
            {gender ? "Select category" : "Select gender first"}
          </option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Step 2 — Your lifts ───────────────────────────────────────────────────────

function Step2({
  squatCurrent, setSquatCurrent,
  squatGoal, setSquatGoal,
  benchCurrent, setBenchCurrent,
  benchGoal, setBenchGoal,
  dlCurrent, setDlCurrent,
  dlGoal, setDlGoal,
}: {
  squatCurrent: string; setSquatCurrent: (v: string) => void;
  squatGoal: string; setSquatGoal: (v: string) => void;
  benchCurrent: string; setBenchCurrent: (v: string) => void;
  benchGoal: string; setBenchGoal: (v: string) => void;
  dlCurrent: string; setDlCurrent: (v: string) => void;
  dlGoal: string; setDlGoal: (v: string) => void;
}) {
  const rows: Array<{
    label: string;
    current: string;
    setCurrent: (v: string) => void;
    goal: string;
    setGoal: (v: string) => void;
  }> = [
    { label: "Squat",    current: squatCurrent, setCurrent: setSquatCurrent, goal: squatGoal, setGoal: setSquatGoal },
    { label: "Bench",    current: benchCurrent, setCurrent: setBenchCurrent, goal: benchGoal, setGoal: setBenchGoal },
    { label: "Deadlift", current: dlCurrent,    setCurrent: setDlCurrent,    goal: dlGoal,    setGoal: setDlGoal    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          Your lifts
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Enter your current bests and competition goals. All optional.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map(({ label, current, setCurrent, goal, setGoal }) => (
          <div key={label}>
            <SectionLabel>{label}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-saira text-[10px] text-zinc-600 mb-1">Current (kg)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="0"
                  min={0}
                  className={inputCls}
                />
              </div>
              <div>
                <p className="font-saira text-[10px] text-zinc-600 mb-1">Goal (kg)</p>
                <input
                  type="number"
                  inputMode="decimal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="0"
                  min={0}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3 — Season & mindset ─────────────────────────────────────────────────

function Step3({
  meetDate, setMeetDate,
  trainingDays, setTrainingDays,
  mentalGoals, setMentalGoals,
}: {
  meetDate: string; setMeetDate: (v: string) => void;
  trainingDays: number | null; setTrainingDays: (v: number) => void;
  mentalGoals: string[]; setMentalGoals: (v: string[]) => void;
}) {
  const updateGoal = (i: number, val: string) => {
    const next = [...mentalGoals];
    next[i] = val;
    setMentalGoals(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          Your season &amp; mindset
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Set your competition timeline and mental targets.
        </p>
      </div>

      {/* Meet date */}
      <div>
        <SectionLabel>Next competition date (optional)</SectionLabel>
        <input
          type="date"
          value={meetDate}
          onChange={(e) => setMeetDate(e.target.value)}
          className={`${inputCls} [color-scheme:dark]`}
        />
      </div>

      {/* Training days */}
      <div>
        <SectionLabel>Training days per week</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setTrainingDays(d)}
              className={dayBtnCls(trainingDays === d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Mental goals */}
      <div>
        <SectionLabel>Mental goals</SectionLabel>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <p className="font-saira text-[10px] text-zinc-600 mb-1">
                Goal {i + 1} {i === 0 ? "(required)" : "(optional)"}
              </p>
              <input
                type="text"
                value={mentalGoals[i] ?? ""}
                onChange={(e) => updateGoal(i, e.target.value)}
                placeholder={
                  i === 0
                    ? "e.g. Stay composed under heavy loads"
                    : i === 1
                    ? "e.g. Trust my training on meet day"
                    : "e.g. Visualise each lift beforehand"
                }
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4 — Your coach ───────────────────────────────────────────────────────

function Step4({
  coaches,
  loadingCoaches,
  selectedCoachId,
  setSelectedCoachId,
}: {
  coaches: CoachOption[];
  loadingCoaches: boolean;
  selectedCoachId: string | null;
  setSelectedCoachId: (v: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          Your coach
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Select your PowerFlow coach, or continue without one for now.
        </p>
      </div>

      {loadingCoaches ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* No coach option */}
          <button
            type="button"
            onClick={() => setSelectedCoachId(null)}
            className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
              selectedCoachId === null
                ? "border-purple-500 bg-purple-500/10"
                : "border-white/5 bg-[#17131F] hover:border-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <span className="font-saira text-xs text-zinc-400">–</span>
            </div>
            <div>
              <p className="font-saira text-sm font-semibold text-white">No coach yet</p>
              <p className="font-saira text-[10px] text-zinc-500">You can connect later</p>
            </div>
            {selectedCoachId === null && (
              <span className="ml-auto text-purple-400 text-sm">✓</span>
            )}
          </button>

          {/* Coach options */}
          {coaches.map((coach) => (
            <button
              key={coach.id}
              type="button"
              onClick={() => setSelectedCoachId(coach.id)}
              className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                selectedCoachId === coach.id
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/5 bg-[#17131F] hover:border-white/10"
              }`}
            >
              {coach.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coach.avatar_url}
                  alt={coach.display_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <span className="font-saira text-xs font-bold text-purple-300">
                    {initials(coach.display_name)}
                  </span>
                </div>
              )}
              <p className="font-saira text-sm font-semibold text-white">
                {coach.display_name}
              </p>
              {selectedCoachId === coach.id && (
                <span className="ml-auto text-purple-400 text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Auth / profile loading
  const [authChecked, setAuthChecked] = React.useState(false);

  // Wizard step
  const [step, setStep] = React.useState(1);
  const TOTAL_STEPS = 4;

  // Step 1 fields
  const [displayName, setDisplayName] = React.useState("");
  const [gender, setGender]           = React.useState<"male" | "female" | "">("");
  const [bodyweight, setBodyweight]   = React.useState("");
  const [weightCat, setWeightCat]     = React.useState("");

  // Step 2 fields
  const [squatCurrent, setSquatCurrent]   = React.useState("");
  const [squatGoal, setSquatGoal]         = React.useState("");
  const [benchCurrent, setBenchCurrent]   = React.useState("");
  const [benchGoal, setBenchGoal]         = React.useState("");
  const [dlCurrent, setDlCurrent]         = React.useState("");
  const [dlGoal, setDlGoal]               = React.useState("");

  // Step 3 fields
  const [meetDate, setMeetDate]         = React.useState("");
  const [trainingDays, setTrainingDays] = React.useState<number | null>(null);
  const [mentalGoals, setMentalGoals]   = React.useState(["", "", ""]);

  // Step 4 fields
  const [coaches, setCoaches]             = React.useState<CoachOption[]>([]);
  const [loadingCoaches, setLoadingCoaches] = React.useState(false);
  const [selectedCoachId, setSelectedCoachId] = React.useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = React.useState(false);

  // ── Auth check + pre-fill ────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/auth/sign-in");
          return null;
        }
        return r.json();
      })
      .then((prof: AthleteProfile | null) => {
        if (!prof) return;
        // Coaches don't onboard via this wizard
        if (prof.role === "coach") {
          router.replace("/coach");
          return;
        }
        if (prof.onboarding_complete) {
          router.replace("/today");
          return;
        }
        // Pre-fill name from Google
        if (prof.display_name) setDisplayName(prof.display_name);
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace("/auth/sign-in");
      });
  }, [router]);

  // ── Load coaches when reaching step 4 ────────────────────────
  React.useEffect(() => {
    if (step !== 4) return;
    setLoadingCoaches(true);
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((data: CoachOption[]) => setCoaches(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingCoaches(false));
  }, [step]);

  // ── Validation ───────────────────────────────────────────────
  const canNext = React.useMemo(() => {
    if (step === 1) return displayName.trim().length > 0 && gender !== "";
    if (step === 2) return true; // all optional, but numbers must be > 0 if entered
    if (step === 3) return trainingDays !== null;
    if (step === 4) return true; // "No coach" is a valid selection
    return false;
  }, [step, displayName, gender, trainingDays]);

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const toNum = (s: string): number | null => {
      const n = parseFloat(s);
      return isNaN(n) || n <= 0 ? null : n;
    };

    const body = {
      display_name: displayName.trim(),
      gender: gender || null,
      bodyweight_kg: toNum(bodyweight),
      weight_category: weightCat || null,
      squat_current_kg: toNum(squatCurrent),
      squat_goal_kg: toNum(squatGoal),
      bench_current_kg: toNum(benchCurrent),
      bench_goal_kg: toNum(benchGoal),
      deadlift_current_kg: toNum(dlCurrent),
      deadlift_goal_kg: toNum(dlGoal),
      meet_date: meetDate || null,
      training_days_per_week: trainingDays,
      mental_goals: mentalGoals.filter(Boolean),
      coach_id: selectedCoachId,
    };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/today");
    } catch {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050608]">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-0 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400">
            POWERFLOW · SETUP
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition"
          >
            Skip setup
          </button>
        </div>
        <ProgressBar step={step} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 pb-4 max-w-lg mx-auto w-full overflow-y-auto">
        {step === 1 && (
          <Step1
            displayName={displayName}
            setDisplayName={setDisplayName}
            gender={gender}
            setGender={setGender}
            bodyweight={bodyweight}
            setBodyweight={setBodyweight}
            weightCat={weightCat}
            setWeightCat={setWeightCat}
          />
        )}
        {step === 2 && (
          <Step2
            squatCurrent={squatCurrent} setSquatCurrent={setSquatCurrent}
            squatGoal={squatGoal}       setSquatGoal={setSquatGoal}
            benchCurrent={benchCurrent} setBenchCurrent={setBenchCurrent}
            benchGoal={benchGoal}       setBenchGoal={setBenchGoal}
            dlCurrent={dlCurrent}       setDlCurrent={setDlCurrent}
            dlGoal={dlGoal}             setDlGoal={setDlGoal}
          />
        )}
        {step === 3 && (
          <Step3
            meetDate={meetDate}           setMeetDate={setMeetDate}
            trainingDays={trainingDays}   setTrainingDays={setTrainingDays}
            mentalGoals={mentalGoals}     setMentalGoals={setMentalGoals}
          />
        )}
        {step === 4 && (
          <Step4
            coaches={coaches}
            loadingCoaches={loadingCoaches}
            selectedCoachId={selectedCoachId}
            setSelectedCoachId={setSelectedCoachId}
          />
        )}
      </div>

      {/* Footer button */}
      <div className="px-5 pb-10 pt-4 max-w-lg mx-auto w-full">
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Setting up…
              </>
            ) : (
              "Complete setup →"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
