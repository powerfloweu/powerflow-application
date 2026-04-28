"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computePhase } from "@/lib/phase";
import { WEIGHT_CATEGORIES } from "@/lib/athlete";
import type { AthleteProfile } from "@/lib/athlete";
import type { SelfTalkMode } from "@/lib/voices";
import { DevLogViewer } from "@/app/components/NotificationModal";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

function localeForDate(loc: string): string {
  if (loc === "de") return "de-DE";
  if (loc === "hu") return "hu-HU";
  return "en-GB";
}

interface CoachOption {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function kgField(val: number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function YouPage() {
  const router = useRouter();
  const { t, locale } = useT();
  const [profile, setProfile] = React.useState<AthleteProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // ── Section save state ─────────────────────────────────────
  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [savedSection, setSavedSection]   = React.useState<string | null>(null);
  const [saveError, setSaveError]         = React.useState<string | null>(null);

  // ── Local form state ───────────────────────────────────────
  const [displayName, setDisplayName]     = React.useState("");
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
  const [coachId, setCoachId]             = React.useState<string | null>(null);

  // ── Practice mode (voice work) ─────────────────────────────
  const [selfTalkMode, setSelfTalkMode]     = React.useState<SelfTalkMode>("classic");
  const [savingMode, setSavingMode]         = React.useState(false);

  // ── Coach picker state ─────────────────────────────────────
  const [coaches, setCoaches]               = React.useState<CoachOption[]>([]);
  const [loadingCoaches, setLoadingCoaches] = React.useState(false);
  const [coachesLoaded, setCoachesLoaded]   = React.useState(false);
  const [showCoachPicker, setShowCoachPicker] = React.useState(false);

  // ── Load profile ───────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((p: AthleteProfile) => {
        if (!p?.id) return;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
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
        setCoachId(p.coach_id ?? null);
        setSelfTalkMode(p.self_talk_mode ?? "classic");
        // If user already has a coach, fetch the coach list now so we can
        // display the coach's name in the static view (without making them
        // open the picker).
        if (p.coach_id) {
          setLoadingCoaches(true);
          fetch("/api/coaches")
            .then((r) => r.json())
            .then((data: CoachOption[]) => setCoaches(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => {
              setCoachesLoaded(true);
              setLoadingCoaches(false);
            });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Save helper ────────────────────────────────────────────
  const save = async (section: string, body: Record<string, unknown>) => {
    setSavingSection(section);
    setSavedSection(null);
    setSaveError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingSection(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? t("you.saveFailed"));
      setTimeout(() => setSaveError(null), 5000);
      return;
    }
    setProfile((p) => p ? { ...p, ...body } as AthleteProfile : p);
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const btnLabel = (section: string) =>
    savingSection === section ? "…" : savedSection === section ? t("common.saved") : t("common.save");

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
        ← {t("nav.home")}
      </Link>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          {t("brand.name").toUpperCase()} · {t("you.pageLabel")}
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white">
          {t("you.profileSection")}
        </h1>
      </div>

      {/* ── Save error banner ───────────────────────────────── */}
      {saveError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 mb-4 flex items-start gap-2">
          <span className="text-red-400 flex-shrink-0 mt-0.5">!</span>
          <p className="font-saira text-xs text-red-300">{saveError}</p>
        </div>
      )}

      {/* ── Identity card ───────────────────────────────────── */}
      {profile && (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name}
                className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <span className="font-saira text-lg font-bold text-purple-300">
                  {(displayName?.[0] ?? profile.display_name?.[0] ?? "?").toUpperCase()}
                </span>
              </div>
            )}
            <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] text-purple-300">
              {profile.role}
            </span>
          </div>
          <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
            {t("you.name")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              placeholder={t("you.namePlaceholder")}
              className="flex-1 rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
            />
            <SaveButton
              label={btnLabel("name")}
              disabled={!!savingSection || !displayName.trim()}
              onClick={() => save("name", { display_name: displayName.trim() })}
            />
          </div>
        </div>
      )}

      {/* ── Meet date ───────────────────────────────────────── */}
      <Section
        label={t("you.sectionNextCompetition")}
        summary={meetDate ? new Date(meetDate).toLocaleDateString(localeForDate(locale), { day: "numeric", month: "short", year: "numeric" }) : t("you.notSet")}
      >
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
            onClick={() => save("meet", { meet_date: meetDate || null })}
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
      <Section
        label={t("you.sectionBody")}
        summary={[gender, bodyweight ? `${bodyweight} kg` : null, weightCat].filter(Boolean).join(" · ") || t("you.notSet")}
      >
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Gender */}
          <div>
            <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
              {t("you.gender")}
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
              className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-sm text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            >
              <option value="">—</option>
              <option value="male">{t("you.male")}</option>
              <option value="female">{t("you.female")}</option>
            </select>
          </div>
          {/* Bodyweight */}
          <div>
            <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-1.5">
              {t("you.bodyweight")} (kg)
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
            {t("you.weightCategory")}
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
      <Section
        label={t("you.sectionStrengthGoals")}
        summary={[squatCurrent, benchCurrent, dlCurrent].some(Boolean)
          ? [squatCurrent, benchCurrent, dlCurrent].map((v) => v ? `${v} kg` : "—").join(" / ")
          : t("you.notSet")}
      >
        <div className="space-y-3 mb-3">
          {([
            [t("you.squat"),    squatCurrent,  setSquatCurrent,  squatGoal,  setSquatGoal  ],
            [t("you.bench"),    benchCurrent,  setBenchCurrent,  benchGoal,  setBenchGoal  ],
            [t("you.deadlift"), dlCurrent,     setDlCurrent,     dlGoal,     setDlGoal     ],
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
                    placeholder={t("you.currentKg")}
                    className="rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                  />
                  <input
                    type="number" step="0.5" min="0" max="1000"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={t("you.goalKg")}
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
      <Section
        label={t("you.sectionMentalGoals")}
        summary={(() => {
          const n = mentalGoals.filter(Boolean).length;
          if (!n) return t("you.notSet");
          return t(n === 1 ? "you.goalsCount" : "you.goalsCountPlural", { n });
        })()}
      >
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
      <Section
        label={t("you.sectionTrainingSchedule")}
        summary={trainingDays ? `${trainingDays}${t("you.timesPerWeek")}` : t("you.notSet")}
      >
        <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-2">
          {t("you.trainingDaysWeek")}
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

      {/* ── Coach picker ─────────────────────────────────────── */}
      <Section
        label={t("you.sectionCoach")}
        summary={coachId ? (coaches.find((c) => c.id === coachId)?.display_name ?? t("you.connected")) : t("you.notConnected")}
      >
        {(() => {
          const currentCoach = coaches.find((c) => c.id === coachId);
          const showStatic = !showCoachPicker;

          const openPicker = () => {
            setShowCoachPicker(true);
            if (coachesLoaded) return;
            setLoadingCoaches(true);
            fetch("/api/coaches")
              .then((r) => r.json())
              .then((data: CoachOption[]) => setCoaches(Array.isArray(data) ? data : []))
              .catch(() => {})
              .finally(() => {
                setCoachesLoaded(true);
                setLoadingCoaches(false);
              });
          };

          const pickCoach = (id: string | null) => {
            setCoachId(id);
            save("coach", { coach_id: id });
            setShowCoachPicker(false);
          };

          if (showStatic) {
            return (
              <>
                {coachId ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <p className="font-saira text-sm text-emerald-300">
                      {currentCoach
                        ? `Connected to ${currentCoach.display_name}`
                        : "Connected to your coach"}
                    </p>
                  </div>
                ) : (
                  <p className="font-saira text-sm text-zinc-500 mb-3">Not connected.</p>
                )}
                <button
                  type="button"
                  onClick={openPicker}
                  className="rounded-xl border border-white/10 bg-[#0D0B14] hover:border-purple-500/40 hover:text-white px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 transition"
                >
                  {coachId ? t("you.changeCoach") : t("you.chooseCoach")}
                </button>
              </>
            );
          }

          return (
            <>
              {loadingCoaches ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => pickCoach(null)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                      coachId === null
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 bg-[#0D0B14] hover:border-white/20"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <span className="font-saira text-xs text-zinc-400">–</span>
                    </div>
                    <p className="font-saira text-sm font-semibold text-white">No coach</p>
                    {coachId === null && (
                      <span className="ml-auto text-purple-400 text-sm">✓</span>
                    )}
                  </button>
                  {coaches.map((coach) => (
                    <button
                      key={coach.id}
                      type="button"
                      onClick={() => pickCoach(coach.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        coachId === coach.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 bg-[#0D0B14] hover:border-white/20"
                      }`}
                    >
                      {coach.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coach.avatar_url}
                          alt={coach.display_name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-900 flex items-center justify-center flex-shrink-0">
                          <span className="font-saira text-[10px] font-bold text-purple-300">
                            {initials(coach.display_name)}
                          </span>
                        </div>
                      )}
                      <p className="font-saira text-sm font-semibold text-white">
                        {coach.display_name}
                      </p>
                      {coachId === coach.id && (
                        <span className="ml-auto text-purple-400 text-sm">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowCoachPicker(false)}
                className="mt-3 font-saira text-[10px] text-zinc-600 hover:text-zinc-400 underline transition"
              >
                {t("common.cancel")}
              </button>
            </>
          );
        })()}
      </Section>

      {/* ── Practice mode (ai_access gate) ─────────────────── */}
      {profile?.ai_access && (
        <Section
          label={t("you.sectionPracticeMode")}
          summary={selfTalkMode === "beta_voice_work" ? t("you.voiceWorkLabel") : t("you.classicLabel")}
        >
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-1">
            Self-Talk Log
          </p>
          <p className="font-saira text-xs text-zinc-500 leading-relaxed mb-4">
            Classic mode uses the standard journal for your thoughts.
            Voice work maps the recurring voices in your head &mdash; naming
            them, locating them, and giving each one a purpose.
          </p>

          {/* Segmented control */}
          <div className="flex gap-2 mb-4">
            {(["classic", "beta_voice_work"] as SelfTalkMode[]).map((mode) => {
              const isActive = selfTalkMode === mode;
              const label = mode === "classic" ? t("you.classicLabel") : t("you.voiceWorkLabel");
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={savingMode}
                  onClick={async () => {
                    if (isActive) return;
                    setSavingMode(true);
                    setSelfTalkMode(mode);
                    setProfile((p) => p ? { ...p, self_talk_mode: mode } : p);
                    await fetch("/api/me", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ self_talk_mode: mode }),
                    }).catch(() => {});
                    setSavingMode(false);
                  }}
                  className={`flex-1 rounded-xl border py-2 font-saira text-xs font-semibold transition ${
                    isActive
                      ? "border-purple-500 bg-purple-600 text-white"
                      : "border-white/10 bg-[#0D0B14] text-zinc-400 hover:border-purple-500/40 hover:text-white"
                  } disabled:opacity-60`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Open log link */}
          <Link
            href={selfTalkMode === "beta_voice_work" ? "/voices" : "/journal"}
            className="font-saira text-[11px] text-purple-400 hover:text-purple-300 underline underline-offset-2 transition"
          >
            Open log →
          </Link>
        </Section>
      )}

      {/* ── Guide link ───────────────────────────────────────── */}
      <Link
        href="/guide"
        className="flex items-center justify-between w-full mt-2 rounded-2xl border border-white/5 bg-[#17131F] px-5 py-4 font-saira text-sm text-zinc-400 hover:text-purple-300 hover:border-purple-500/20 transition group"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📖</span>
          <div>
            <p className="font-saira text-sm font-semibold text-zinc-300 group-hover:text-purple-300 transition">
              User guide
            </p>
            <p className="font-saira text-[10px] text-zinc-600">
              How to use PowerFlow · includes printable PDF
            </p>
          </div>
        </div>
        <span className="text-zinc-600 group-hover:text-purple-400 transition">→</span>
      </Link>

      {/* ── Language ─────────────────────────────────────────── */}
      <LanguageSwitcher />

      {/* ── What's new ───────────────────────────────────────── */}
      <Section label={t("you.sectionWhatsNew")}>
        <DevLogViewer />
      </Section>

      {/* ── Sign out ─────────────────────────────────────────── */}
      <SignOutButton />
    </div>
  );
}

function SignOutButton() {
  const router = useRouter();
  const { t } = useT();
  return (
    <button
      onClick={async () => {
        await fetch("/auth/sign-out", { method: "POST" });
        router.replace("/auth/sign-in");
      }}
      className="w-full mt-2 rounded-2xl border border-white/5 bg-[#17131F] py-4 font-saira text-sm text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 transition"
    >
      {t("auth.signOut")}
    </button>
  );
}

// ── Small shared components ───────────────────────────────────────────────────

function Section({
  label,
  summary,
  children,
  defaultOpen = false,
}: {
  label: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/5 bg-[#17131F] mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 flex-shrink-0">
            {label}
          </p>
          {!open && summary && (
            <span className="font-saira text-xs text-zinc-600 truncate">{summary}</span>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-4 h-4 flex-shrink-0 text-zinc-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
