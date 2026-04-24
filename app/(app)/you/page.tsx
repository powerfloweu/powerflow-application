"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computePhase } from "@/lib/phase";
import { WEIGHT_CATEGORIES } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";

// ── Helpers ───────────────────────────────────────────────────────────────────

function kgField(val: number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function YouPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<AthleteProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // ── Section save state ─────────────────────────────────────
  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [savedSection, setSavedSection]   = React.useState<string | null>(null);

  // ── Local form state ───────────────────────────────────────
  const [meetDate, setMeetDate]           = React.useState("");
  const [gender, setGender]               = React.useState<"male" | "female" | "">("");
  const [bodyweight, setBodyweight]       = React.useState("");
  const [weightCat, setWeightCat]         = React.useState("");
  const [squatCurrent, setSquatCurrent]   = React.useState("");
  const [squatGoal, setSquatGoal]         = React.useState("");
  const [benchCurrent, setBenchCurrent]   = React.useState("");
  const [benchGoal, setBenchGoal]         = React.useState("");
  const [dlCurrent, setDlCurrent]         = React.useState("");
  const [dlGoal, setDlGoal]               = React.useState("");
  const [mentalGoals, setMentalGoals]     = React.useState(["", "", ""]);
  const [trainingDays, setTrainingDays]   = React.useState<number | null>(null);

  // ── Load profile ───────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((p: AthleteProfile) => {
        if (!p?.id) return;
        setProfile(p);
        setMeetDate(p.meet_date ?? "");
        setGender((p.gender ?? "") as "male" | "female" | "");
        setBodyweight(p.bodyweight_kg ? String(p.bodyweight_kg) : "");
        setWeightCat(p.weight_category ?? "");
        setSquatCurrent(kgField(p.squat_current_kg));
        setSquatGoal(kgField(p.squat_goal_kg));
        setBenchCurrent(kgField(p.bench_current_kg));
        setBenchGoal(kgField(p.bench_goal_kg));
        setDlCurrent(kgField(p.deadlift_current_kg));
        setDlGoal(kgField(p.deadlift_goal_kg));
        const mg = Array.isArray(p.mental_goals) ? p.mental_goals : [];
        setMentalGoals([mg[0] ?? "", mg[1] ?? "", mg[2] ?? ""]);
        setTrainingDays(p.training_days_per_week ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Save helper ────────────────────────────────────────────
  const save = async (section: string, body: Record<string, unknown>) => {
    setSavingSection(section);
    setSavedSection(null);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setProfile((p) => p ? { ...p, ...body } as AthleteProfile : p);
    setSavingSection(null);
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const btnLabel = (section: string) =>
    savingSection === section ? "…" : savedSection === section ? "Saved ✓" : "Save";

  const phase = profile ? computePhase(profile.meet_date) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto">

      {/* ── Back ────────────────────────────────────────────── */}
      <Link
        href="/today"
        className="inline-block mb-5 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
      >
        ← Today
      </Link>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · YOU
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white">
          Profile
        </h1>
      </div>

      {/* ── Identity card ───────────────────────────────────── */}
      {profile && (
        <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name}
              className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <span className="font-saira text-lg font-bold text-purple-300">
                {(profile.display_name?.[0] ?? "?").toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-saira text-base font-semibold text-white">{profile.display_name}</p>
            <span className="inline-block mt-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] text-purple-300">
              {profile.role}
            </span>
          </div>
        </div>
      )}

      {/* ── Meet date ───────────────────────────────────────── */}
      <Section label="Next competition">
        {phase && <p className="font-saira text-xs text-purple-300 mb-3">{phase.label}</p>}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
          />
          <SaveButton
            label={btnLabel("meet")}
            disabled={!!savingSection}
            onClick={async () => {
              await save("meet", { meet_date: meetDate || null });
              setTimeout(() => router.push("/today"), 900);
            }}
          />
        </div>
        {meetDate && (
          <button type="button"
            onClick={() => { setMeetDate(""); save("meet", { meet_date: null }); }}
            className="mt-2 font-saira text-[10px] text-zinc-600 hover:text-zinc-400 underline transition">
            Clear date
          </button>
        )}
      </Section>

      {/* ── Body ────────────────────────────────────────────── */}
      <Section label="Body">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Gender */}
          <div>
            <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
              className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          {/* Bodyweight */}
          <div>
            <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
              Bodyweight (kg)
            </label>
            <input
              type="number" step="0.1" min="30" max="300"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              placeholder="e.g. 93.4"
              className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            />
          </div>
        </div>
        {/* Weight category */}
        <div className="mb-3">
          <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
            Weight category (next meet)
          </label>
          <select
            value={weightCat}
            onChange={(e) => setWeightCat(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
          >
            <option value="">— select —</option>
            {(gender ? WEIGHT_CATEGORIES[gender] : [...WEIGHT_CATEGORIES.male, ...WEIGHT_CATEGORIES.female]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <SaveButton
          label={btnLabel("body")}
          disabled={!!savingSection}
          onClick={() => save("body", {
            gender: gender || null,
            bodyweight_kg: bodyweight ? parseFloat(bodyweight) : null,
            weight_category: weightCat || null,
          })}
        />
      </Section>

      {/* ── Strength goals ──────────────────────────────────── */}
      <Section label="Strength goals">
        <div className="space-y-3 mb-3">
          {([
            ["Squat",    squatCurrent,  setSquatCurrent,  squatGoal,  setSquatGoal  ],
            ["Bench",    benchCurrent,  setBenchCurrent,  benchGoal,  setBenchGoal  ],
            ["Deadlift", dlCurrent,     setDlCurrent,     dlGoal,     setDlGoal     ],
          ] as [string, string, React.Dispatch<React.SetStateAction<string>>, string, React.Dispatch<React.SetStateAction<string>>][]).map(
            ([label, cur, setCur, goal, setGoal]) => (
              <div key={label}>
                <p className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
                  {label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" step="0.5" min="0" max="1000"
                    value={cur}
                    onChange={(e) => setCur(e.target.value)}
                    placeholder="Current (kg)"
                    className="rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                  />
                  <input
                    type="number" step="0.5" min="0" max="1000"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Goal (kg)"
                    className="rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            )
          )}
        </div>
        <SaveButton
          label={btnLabel("strength")}
          disabled={!!savingSection}
          onClick={() => save("strength", {
            squat_current_kg:    squatCurrent  ? parseFloat(squatCurrent)  : null,
            squat_goal_kg:       squatGoal     ? parseFloat(squatGoal)     : null,
            bench_current_kg:    benchCurrent  ? parseFloat(benchCurrent)  : null,
            bench_goal_kg:       benchGoal     ? parseFloat(benchGoal)     : null,
            deadlift_current_kg: dlCurrent     ? parseFloat(dlCurrent)     : null,
            deadlift_goal_kg:    dlGoal        ? parseFloat(dlGoal)        : null,
          })}
        />
      </Section>

      {/* ── Mental goals ────────────────────────────────────── */}
      <Section label="Mental goals (1–3)">
        <div className="space-y-2 mb-3">
          {mentalGoals.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-saira text-[10px] text-purple-400 font-bold mt-3 flex-shrink-0 w-4">
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                type="text"
                value={g}
                onChange={(e) => {
                  const next = [...mentalGoals];
                  next[i] = e.target.value;
                  setMentalGoals(next);
                }}
                placeholder={`Goal ${i + 1}${i === 0 ? " (required)" : " (optional)"}`}
                maxLength={200}
                className="flex-1 rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
              />
            </div>
          ))}
        </div>
        <SaveButton
          label={btnLabel("mental")}
          disabled={!!savingSection}
          onClick={() => save("mental", {
            mental_goals: mentalGoals.filter(Boolean),
          })}
        />
      </Section>

      {/* ── Training schedule ───────────────────────────────── */}
      <Section label="Training schedule">
        <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-2">
          Training days per week
        </label>
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTrainingDays(n)}
              className={`flex-1 rounded-xl border py-2 font-saira text-xs font-semibold transition ${
                trainingDays === n
                  ? "border-purple-500 bg-purple-600 text-white"
                  : "border-white/10 bg-[#0D0B14] text-zinc-400 hover:border-purple-500/40 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <SaveButton
          label={btnLabel("training")}
          disabled={!!savingSection}
          onClick={() => save("training", { training_days_per_week: trainingDays })}
        />
      </Section>

      {/* ── Coach status ─────────────────────────────────────── */}
      <Section label="Coach">
        {profile?.coach_id ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className="font-saira text-sm text-emerald-300">Connected to your coach</p>
          </div>
        ) : (
          <p className="font-saira text-sm text-zinc-500">
            Not connected.{" "}
            <span className="text-zinc-400">Ask your coach for an invite link.</span>
          </p>
        )}
      </Section>

      {/* ── Sign out ─────────────────────────────────────────── */}
      <button
        onClick={async () => {
          await fetch("/auth/sign-out", { method: "POST" });
          router.replace("/auth/sign-in");
        }}
        className="w-full mt-2 rounded-2xl border border-white/5 bg-[#17131F] py-4 font-saira text-sm text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 transition"
      >
        Sign out
      </button>
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}

function SaveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
    >
      {label}
    </button>
  );
}
