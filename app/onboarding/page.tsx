"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { WEIGHT_CATEGORIES } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";
import { useT } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoachOption {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// ── Shared style helpers ──────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// text-base (16px) on mobile prevents iOS Safari from auto-zooming when the
// input is focused. We drop to text-sm at sm: breakpoint where the keyboard
// behaviour doesn't apply.
const inputCls =
  "w-full rounded-xl border border-purple-500/25 bg-[#0D0B14] px-3 py-3 font-saira text-base sm:text-sm text-white focus:outline-none focus:border-purple-500/60 placeholder-zinc-600 [color-scheme:dark]";

const textareaCls =
  "w-full rounded-xl border border-purple-500/25 bg-[#0D0B14] px-3 py-3 font-saira text-base sm:text-sm text-white focus:outline-none focus:border-purple-500/60 placeholder-zinc-600 resize-none [color-scheme:dark]";

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

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const { t } = useT();
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400">
          {t("onboarding.stepOf", { step, total })}
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
    <p className="font-saira text-sm font-semibold text-purple-300 mb-2">
      {children}
    </p>
  );
}

function ScaleSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      {/* grid-cols-10 forces all 10 buttons onto a single row that scales
          with the container — no wrap, no horizontal overflow on small phones */}
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg sm:rounded-xl border font-saira text-xs sm:text-sm font-semibold transition ${
              value === n
                ? "border-purple-500 bg-purple-600 text-white"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between font-saira text-[9px] text-zinc-600 px-0.5">
        <span>Very low</span>
        <span>Very high</span>
      </div>
    </div>
  );
}

// ── Step 1 — About you ────────────────────────────────────────────────────────

function Step1({
  displayName, setDisplayName,
  instagram, setInstagram,
  gender, setGender,
}: {
  displayName: string; setDisplayName: (v: string) => void;
  instagram: string; setInstagram: (v: string) => void;
  gender: "male" | "female" | ""; setGender: (v: "male" | "female") => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step1Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Tell us the basics so we can personalise your experience.
        </p>
      </div>

      <div>
        <SectionLabel>Your name *</SectionLabel>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full name"
          className={inputCls}
        />
      </div>

      <div>
        <SectionLabel>Instagram (optional)</SectionLabel>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-saira text-sm text-zinc-500">@</span>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
            placeholder="yourhandle"
            className={`${inputCls} pl-7`}
          />
        </div>
      </div>

      <div>
        <SectionLabel>Gender *</SectionLabel>
        <div className="flex gap-3">
          <button type="button" onClick={() => setGender("male")} className={pillCls(gender === "male")}>
            Male
          </button>
          <button type="button" onClick={() => setGender("female")} className={pillCls(gender === "female")}>
            Female
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Powerlifting profile ─────────────────────────────────────────────

function Step2({
  yearsPl, setYearsPl,
  federation, setFederation,
  bodyweight, setBodyweight,
  weightCat, setWeightCat,
  gender,
  meetDate, setMeetDate,
  trainingDays, setTrainingDays,
}: {
  yearsPl: string; setYearsPl: (v: string) => void;
  federation: string; setFederation: (v: string) => void;
  bodyweight: string; setBodyweight: (v: string) => void;
  weightCat: string; setWeightCat: (v: string) => void;
  gender: "male" | "female" | "";
  meetDate: string; setMeetDate: (v: string) => void;
  trainingDays: number | null; setTrainingDays: (v: number) => void;
}) {
  const { t } = useT();
  const cats = gender ? WEIGHT_CATEGORIES[gender] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step2Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Your experience and competition details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>Years in powerlifting</SectionLabel>
          <input
            type="text"
            value={yearsPl}
            onChange={(e) => setYearsPl(e.target.value)}
            placeholder="e.g. 3 years"
            className={inputCls}
          />
        </div>
        <div>
          <SectionLabel>Federation</SectionLabel>
          <input
            type="text"
            value={federation}
            onChange={(e) => setFederation(e.target.value)}
            placeholder="e.g. IPF, GPC"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <SectionLabel>Weight category</SectionLabel>
          <select
            value={weightCat}
            onChange={(e) => setWeightCat(e.target.value)}
            disabled={!gender}
            className={`${inputCls} disabled:opacity-40 appearance-none`}
          >
            <option value="">{gender ? "Select" : "Gender first"}</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <SectionLabel>Next competition date (optional)</SectionLabel>
        <input
          type="date"
          value={meetDate}
          onChange={(e) => setMeetDate(e.target.value)}
          className={`${inputCls} [color-scheme:dark]`}
        />
      </div>

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
    </div>
  );
}

// ── Step 3 — Your lifts ───────────────────────────────────────────────────────

function Step3({
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
  const { t } = useT();
  const rows = [
    { label: t("you.squat"),    current: squatCurrent, setCurrent: setSquatCurrent, goal: squatGoal, setGoal: setSquatGoal },
    { label: t("you.bench"),    current: benchCurrent, setCurrent: setBenchCurrent, goal: benchGoal, setGoal: setBenchGoal },
    { label: t("you.deadlift"), current: dlCurrent,    setCurrent: setDlCurrent,    goal: dlGoal,    setGoal: setDlGoal    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step3Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Current bests and competition goals. All optional.
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

// ── Step 4 — Mindset & self-assessment ────────────────────────────────────────

function Step4({
  mainBarrier, setMainBarrier,
  confidenceBreak, setConfidenceBreak,
  overthinkingFocus, setOverthinkingFocus,
  previousMentalWork, setPreviousMentalWork,
  selfConfidenceReg, setSelfConfidenceReg,
  selfFocusFatigue, setSelfFocusFatigue,
  selfHandlingPressure, setSelfHandlingPressure,
  selfCompetitionAnxiety, setSelfCompetitionAnxiety,
  selfEmotionalRecovery, setSelfEmotionalRecovery,
}: {
  mainBarrier: string; setMainBarrier: (v: string) => void;
  confidenceBreak: string; setConfidenceBreak: (v: string) => void;
  overthinkingFocus: string; setOverthinkingFocus: (v: string) => void;
  previousMentalWork: string; setPreviousMentalWork: (v: string) => void;
  selfConfidenceReg: number | null; setSelfConfidenceReg: (v: number) => void;
  selfFocusFatigue: number | null; setSelfFocusFatigue: (v: number) => void;
  selfHandlingPressure: number | null; setSelfHandlingPressure: (v: number) => void;
  selfCompetitionAnxiety: number | null; setSelfCompetitionAnxiety: (v: number) => void;
  selfEmotionalRecovery: number | null; setSelfEmotionalRecovery: (v: number) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step4Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Help us understand where you are mentally right now.
        </p>
      </div>

      <div>
        <SectionLabel>What holds your performance back the most right now? *</SectionLabel>
        <textarea
          rows={3}
          value={mainBarrier}
          onChange={(e) => setMainBarrier(e.target.value)}
          placeholder="Describe your biggest mental barrier…"
          className={textareaCls}
        />
      </div>

      <div>
        <SectionLabel>In which situations does your confidence break?</SectionLabel>
        <textarea
          rows={3}
          value={confidenceBreak}
          onChange={(e) => setConfidenceBreak(e.target.value)}
          placeholder="e.g. Heavy attempts, meets, training slumps…"
          className={textareaCls}
        />
      </div>

      <div>
        <SectionLabel>When do you start to overthink or lose focus?</SectionLabel>
        <textarea
          rows={3}
          value={overthinkingFocus}
          onChange={(e) => setOverthinkingFocus(e.target.value)}
          placeholder="e.g. Before big sets, during warm-up, competition day…"
          className={textareaCls}
        />
      </div>

      <div>
        <SectionLabel>Have you worked with a mental coach or sports psychologist before?</SectionLabel>
        <textarea
          rows={3}
          value={previousMentalWork}
          onChange={(e) => setPreviousMentalWork(e.target.value)}
          placeholder="What helped, what didn't…"
          className={textareaCls}
        />
      </div>

      {/* Self-assessment scales */}
      <div className="pt-2 border-t border-white/5">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-4">
          Self-assessment (1 = very low · 10 = very high)
        </p>
        <div className="space-y-5">
          <ScaleSelector label="Confidence regulation" value={selfConfidenceReg} onChange={setSelfConfidenceReg} />
          <ScaleSelector label="Focus under fatigue" value={selfFocusFatigue} onChange={setSelfFocusFatigue} />
          <ScaleSelector label="Handling pressure" value={selfHandlingPressure} onChange={setSelfHandlingPressure} />
          <ScaleSelector label="Competition anxiety" value={selfCompetitionAnxiety} onChange={setSelfCompetitionAnxiety} />
          <ScaleSelector label="Emotional recovery after bad sessions or meets" value={selfEmotionalRecovery} onChange={setSelfEmotionalRecovery} />
        </div>
      </div>
    </div>
  );
}

// ── Step 5 — Goals & commitment ───────────────────────────────────────────────

function Step5({
  mentalGoals, setMentalGoals,
  expectations, setExpectations,
  previousTools, setPreviousTools,
  anythingElse, setAnythingElse,
}: {
  mentalGoals: string[]; setMentalGoals: (v: string[]) => void;
  expectations: string; setExpectations: (v: string) => void;
  previousTools: string; setPreviousTools: (v: string) => void;
  anythingElse: string; setAnythingElse: (v: string) => void;
}) {
  const { t } = useT();
  const updateGoal = (i: number, val: string) => {
    const next = [...mentalGoals];
    next[i] = val;
    setMentalGoals(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step5Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          What you want to achieve in the next 3 months.
        </p>
      </div>

      <div>
        <SectionLabel>Three mental goals for the next 3 months *</SectionLabel>
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

      <div>
        <SectionLabel>What do you expect from the coaching process?</SectionLabel>
        <textarea
          rows={3}
          value={expectations}
          onChange={(e) => setExpectations(e.target.value)}
          placeholder="What you expect from us as a team…"
          className={textareaCls}
        />
      </div>

      <div>
        <SectionLabel>What mental strategies have you used so far?</SectionLabel>
        <textarea
          rows={3}
          value={previousTools}
          onChange={(e) => setPreviousTools(e.target.value)}
          placeholder="How did they work for you…"
          className={textareaCls}
        />
      </div>

      <div>
        <SectionLabel>Anything else you&apos;d like us to know?</SectionLabel>
        <textarea
          rows={3}
          value={anythingElse}
          onChange={(e) => setAnythingElse(e.target.value)}
          placeholder="Optional — anything important we should know…"
          className={textareaCls}
        />
      </div>
    </div>
  );
}

// ── Step 6 — Your coach ───────────────────────────────────────────────────────

function Step6({
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
  const { t } = useT();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-1">
          {t("onboarding.step6Title")}
        </h2>
        <p className="font-saira text-sm text-zinc-500">
          Is your coach on PowerFlow? Select them below. If not — or if you train solo — just skip.
        </p>
      </div>

      {loadingCoaches ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
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
              <span className="font-saira text-lg text-zinc-400">–</span>
            </div>
            <div>
              <p className="font-saira text-sm font-semibold text-white">No coach / skip for now</p>
              <p className="font-saira text-xs text-zinc-500">Training solo, or your coach isn&apos;t on PowerFlow yet</p>
            </div>
            {selectedCoachId === null && (
              <span className="ml-auto text-purple-400 text-sm">✓</span>
            )}
          </button>

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
  const { t } = useT();
  const [authChecked, setAuthChecked] = React.useState(false);

  const TOTAL_STEPS = 6;
  const [step, setStep] = React.useState(1);

  // Step 1 — About you
  const [displayName, setDisplayName]   = React.useState("");
  const [instagram, setInstagram]       = React.useState("");
  const [gender, setGender]             = React.useState<"male" | "female" | "">("");

  // Step 2 — Powerlifting profile
  const [yearsPl, setYearsPl]           = React.useState("");
  const [federation, setFederation]     = React.useState("");
  const [bodyweight, setBodyweight]     = React.useState("");
  const [weightCat, setWeightCat]       = React.useState("");
  const [meetDate, setMeetDate]         = React.useState("");
  const [trainingDays, setTrainingDays] = React.useState<number | null>(null);

  // Step 3 — Lifts
  const [squatCurrent, setSquatCurrent] = React.useState("");
  const [squatGoal, setSquatGoal]       = React.useState("");
  const [benchCurrent, setBenchCurrent] = React.useState("");
  const [benchGoal, setBenchGoal]       = React.useState("");
  const [dlCurrent, setDlCurrent]       = React.useState("");
  const [dlGoal, setDlGoal]             = React.useState("");

  // Step 4 — Mindset
  const [mainBarrier, setMainBarrier]           = React.useState("");
  const [confidenceBreak, setConfidenceBreak]   = React.useState("");
  const [overthinkingFocus, setOverthinkingFocus] = React.useState("");
  const [previousMentalWork, setPreviousMentalWork] = React.useState("");
  const [selfConfidenceReg, setSelfConfidenceReg]       = React.useState<number | null>(null);
  const [selfFocusFatigue, setSelfFocusFatigue]         = React.useState<number | null>(null);
  const [selfHandlingPressure, setSelfHandlingPressure] = React.useState<number | null>(null);
  const [selfCompetitionAnxiety, setSelfCompetitionAnxiety] = React.useState<number | null>(null);
  const [selfEmotionalRecovery, setSelfEmotionalRecovery]   = React.useState<number | null>(null);

  // Step 5 — Goals
  const [mentalGoals, setMentalGoals]     = React.useState(["", "", ""]);
  const [expectations, setExpectations]   = React.useState("");
  const [previousTools, setPreviousTools] = React.useState("");
  const [anythingElse, setAnythingElse]   = React.useState("");

  // Step 6 — Coach
  const [coaches, setCoaches]           = React.useState<CoachOption[]>([]);
  const [loadingCoaches, setLoadingCoaches] = React.useState(false);
  const [selectedCoachId, setSelectedCoachId] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);

  // ── Auth check + pre-fill ────────────────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.replace("/auth/sign-in"); return null; }
        return r.json();
      })
      .then((prof: AthleteProfile | null) => {
        if (!prof) return;
        if (prof.role === "coach") { router.replace("/coach"); return; }
        if (prof.onboarding_complete) { router.replace("/today"); return; }
        if (prof.display_name) setDisplayName(prof.display_name);
        setAuthChecked(true);
      })
      .catch(() => router.replace("/auth/sign-in"));
  }, [router]);

  // ── Load coaches when reaching step 6 ───────────────────────────────────────
  React.useEffect(() => {
    if (step !== 6) return;
    setLoadingCoaches(true);
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((data: CoachOption[]) => setCoaches(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingCoaches(false));
  }, [step]);

  // ── Validation ───────────────────────────────────────────────────────────────
  const canNext = React.useMemo(() => {
    if (step === 1) return displayName.trim().length > 0 && gender !== "";
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return mainBarrier.trim().length > 0;
    if (step === 5) return mentalGoals[0].trim().length > 0;
    if (step === 6) return true;
    return false;
  }, [step, displayName, gender, mainBarrier, mentalGoals]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const toNum = (s: string): number | null => {
      const n = parseFloat(s);
      return isNaN(n) || n <= 0 ? null : n;
    };

    const body = {
      // Step 1
      display_name: displayName.trim(),
      instagram: instagram.trim() || null,
      gender: gender || null,
      // Step 2
      years_powerlifting: yearsPl.trim() || null,
      federation: federation.trim() || null,
      bodyweight_kg: toNum(bodyweight),
      weight_category: weightCat || null,
      meet_date: meetDate || null,
      training_days_per_week: trainingDays,
      // Step 3
      squat_current_kg: toNum(squatCurrent),
      squat_goal_kg: toNum(squatGoal),
      bench_current_kg: toNum(benchCurrent),
      bench_goal_kg: toNum(benchGoal),
      deadlift_current_kg: toNum(dlCurrent),
      deadlift_goal_kg: toNum(dlGoal),
      // Step 4
      main_barrier: mainBarrier.trim() || null,
      confidence_break: confidenceBreak.trim() || null,
      overthinking_focus: overthinkingFocus.trim() || null,
      previous_mental_work: previousMentalWork.trim() || null,
      self_confidence_reg: selfConfidenceReg,
      self_focus_fatigue: selfFocusFatigue,
      self_handling_pressure: selfHandlingPressure,
      self_competition_anxiety: selfCompetitionAnxiety,
      self_emotional_recovery: selfEmotionalRecovery,
      // Step 5
      mental_goals: mentalGoals.filter(Boolean),
      expectations: expectations.trim() || null,
      previous_tools: previousTools.trim() || null,
      anything_else: anythingElse.trim() || null,
      // Step 6
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

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050608]">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    /*
     * Layout strategy (mobile-first):
     *   - Outer div uses normal page scroll (NO `flex flex-col` + internal
     *     `overflow-y-auto`). Internal-scroll patterns fight iOS Safari's
     *     keyboard-aware scroll-into-view, which caused two symptoms before:
     *       1. Tapping any field jumped the scroll position to the last input.
     *       2. The keyboard covered focused fields without auto-correcting.
     *   - Footer is `fixed` at bottom-0 with safe-area inset padding so it
     *     stays glued to the bottom across iOS notch / Android nav bar.
     *   - Content gets `pb-32` to leave room above the fixed footer.
     */
    <div
      className="min-h-screen bg-[#050608]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-8 sm:pt-12 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 truncate">
            {t("brand.name").toUpperCase()} · {t("onboarding.pageLabel")}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="font-saira text-xs font-semibold text-zinc-300 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition disabled:opacity-40 flex-shrink-0"
          >
            {t("onboarding.skipSetup")}
          </button>
        </div>
        <ProgressBar step={step} total={TOTAL_STEPS} />
      </div>

      {/* Step content — `pb-32` keeps the last field clear of the fixed footer */}
      <div className="px-5 pb-32 max-w-lg mx-auto w-full">
        {step === 1 && (
          <Step1
            displayName={displayName} setDisplayName={setDisplayName}
            instagram={instagram}     setInstagram={setInstagram}
            gender={gender}           setGender={setGender}
          />
        )}
        {step === 2 && (
          <Step2
            yearsPl={yearsPl}         setYearsPl={setYearsPl}
            federation={federation}   setFederation={setFederation}
            bodyweight={bodyweight}   setBodyweight={setBodyweight}
            weightCat={weightCat}     setWeightCat={setWeightCat}
            gender={gender}
            meetDate={meetDate}       setMeetDate={setMeetDate}
            trainingDays={trainingDays} setTrainingDays={setTrainingDays}
          />
        )}
        {step === 3 && (
          <Step3
            squatCurrent={squatCurrent} setSquatCurrent={setSquatCurrent}
            squatGoal={squatGoal}       setSquatGoal={setSquatGoal}
            benchCurrent={benchCurrent} setBenchCurrent={setBenchCurrent}
            benchGoal={benchGoal}       setBenchGoal={setBenchGoal}
            dlCurrent={dlCurrent}       setDlCurrent={setDlCurrent}
            dlGoal={dlGoal}             setDlGoal={setDlGoal}
          />
        )}
        {step === 4 && (
          <Step4
            mainBarrier={mainBarrier}               setMainBarrier={setMainBarrier}
            confidenceBreak={confidenceBreak}       setConfidenceBreak={setConfidenceBreak}
            overthinkingFocus={overthinkingFocus}   setOverthinkingFocus={setOverthinkingFocus}
            previousMentalWork={previousMentalWork} setPreviousMentalWork={setPreviousMentalWork}
            selfConfidenceReg={selfConfidenceReg}           setSelfConfidenceReg={setSelfConfidenceReg}
            selfFocusFatigue={selfFocusFatigue}             setSelfFocusFatigue={setSelfFocusFatigue}
            selfHandlingPressure={selfHandlingPressure}     setSelfHandlingPressure={setSelfHandlingPressure}
            selfCompetitionAnxiety={selfCompetitionAnxiety} setSelfCompetitionAnxiety={setSelfCompetitionAnxiety}
            selfEmotionalRecovery={selfEmotionalRecovery}   setSelfEmotionalRecovery={setSelfEmotionalRecovery}
          />
        )}
        {step === 5 && (
          <Step5
            mentalGoals={mentalGoals}     setMentalGoals={setMentalGoals}
            expectations={expectations}   setExpectations={setExpectations}
            previousTools={previousTools} setPreviousTools={setPreviousTools}
            anythingElse={anythingElse}   setAnythingElse={setAnythingElse}
          />
        )}
        {step === 6 && (
          <Step6
            coaches={coaches}
            loadingCoaches={loadingCoaches}
            selectedCoachId={selectedCoachId}
            setSelectedCoachId={setSelectedCoachId}
          />
        )}
      </div>

      {/* Footer buttons — fixed to viewport bottom so the user always knows
          where to tap "next". Safe-area inset accounts for the iPhone home
          indicator. The translucent backdrop + blur keeps content readable
          when scrolling under it. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 bg-[#050608]/90 backdrop-blur-md border-t border-white/5 px-5 pt-4"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
        }}
      >
        <div className="max-w-lg mx-auto w-full flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/40 hover:text-white py-3.5 px-5 font-saira text-sm font-semibold text-zinc-400 transition"
            >
              {t("onboarding.backArrow")}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition"
            >
              {t("onboarding.continueArrow")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 py-3.5 font-saira text-sm font-semibold uppercase tracking-[0.16em] text-white transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("onboarding.submitting")}
                </>
              ) : (
                t("onboarding.completeSetup")
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
