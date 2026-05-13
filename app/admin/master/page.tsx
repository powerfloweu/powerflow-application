"use client";

/**
 * /admin/master — PowerFlow Master Admin Dashboard
 * Accessible only to the authenticated user whose email matches ADMIN_EMAIL.
 *
 * Tabs:
 *   Overview   — stat cards + growth chart + dormant athletes list
 *   Users      — searchable table with expandable profile viewer + course/role/delete
 *   Coach Links — coach → athlete linking UI
 *   Results    — SAT / ACSI / CSAI / DAS test results
 *   Broadcast  — compose email to filtered user segments
 */

import React from "react";
import Link from "next/link";
import type { SatRow, AcsiRow, CsaiRow, DasRow } from "@/app/api/admin/test-results/route";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActivityStatus = "active" | "monitor" | "dormant";

type UserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_name: string | null;
  coach_code: string | null;
  coach_status: "pending" | "approved" | "rejected" | null;
  coach_notes: string | null;
  coach_application: {
    athletes_count: string;
    instagram: string;
    sports: string;
    background: string;
    why_powerflow: string;
  } | null;
  plan_tier: "opener" | "second" | "pr" | null;
  course_access: boolean;
  test_access: boolean;
  ai_access: boolean;
  translator_access: boolean;
  onboarding_complete: boolean;
  meet_date: string | null;
  created_at: string | null;
  // physical
  gender: string | null;
  bodyweight_kg: number | null;
  weight_category: string | null;
  // lifts
  squat_current_kg: number | null;
  squat_goal_kg: number | null;
  bench_current_kg: number | null;
  bench_goal_kg: number | null;
  deadlift_current_kg: number | null;
  deadlift_goal_kg: number | null;
  // profile
  instagram: string | null;
  years_powerlifting: string | null;
  federation: string | null;
  training_days_per_week: number | null;
  // mental
  mental_goals: string[];
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  previous_mental_work: string | null;
  self_confidence_reg: number | null;
  self_focus_fatigue: number | null;
  self_handling_pressure: number | null;
  self_competition_anxiety: number | null;
  self_emotional_recovery: number | null;
  expectations: string | null;
  previous_tools: string | null;
  anything_else: string | null;
  // activity
  journal_count_7d: number;
  checkin_count_7d: number;
  last_active: string | null;
  activity_status: ActivityStatus;
  // push
  push_subscribed: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function exportCsv(users: UserRow[]) {
  const headers = [
    "Name", "Email", "Role", "Coach", "Tier", "Course", "Tests", "AI", "Activity",
    "Entries7d", "Checkins7d", "LastActive", "Onboarded",
    "MeetDate", "Gender", "BW_kg", "WeightCat", "Fed",
    "Squat", "Bench", "Deadlift",
  ];
  const rows = users.map((u) =>
    [
      u.display_name, u.email ?? "", u.role, u.coach_name ?? "",
      u.plan_tier ?? "opener",
      u.course_access ? "yes" : "no",
      u.test_access ? "yes" : "no",
      u.ai_access ? "yes" : "no",
      u.activity_status,
      u.journal_count_7d, u.checkin_count_7d, u.last_active ?? "",
      u.onboarding_complete ? "yes" : "no", u.meet_date ?? "",
      u.gender ?? "", u.bodyweight_kg ?? "", u.weight_category ?? "",
      u.federation ?? "", u.squat_current_kg ?? "", u.bench_current_kg ?? "", u.deadlift_current_kg ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `powerflow-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Tiny sub-components ───────────────────────────────────────────────────────

function Stat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-card px-5 py-4 flex flex-col gap-1 min-w-[110px]">
      <span className={`font-saira text-2xl font-extrabold ${color}`}>{value}</span>
      <span className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
        {label}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: "athlete" | "coach" }) {
  return role === "coach" ? (
    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
      Coach
    </span>
  ) : (
    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/20">
      Athlete
    </span>
  );
}

function ActivityDot({ status }: { status: ActivityStatus }) {
  const map: Record<ActivityStatus, string> = {
    active: "bg-green-400",
    monitor: "bg-yellow-400",
    dormant: "bg-red-400",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${map[status]} flex-shrink-0`} />
  );
}

function Toggle({
  on,
  disabled,
  onToggle,
}: {
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        ${on ? "bg-purple-500" : "bg-zinc-700"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform
          ${on ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Field({ label, value, href }: { label: string; value: string | number | null | undefined; href?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-0.5">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-saira text-xs text-purple-400 hover:text-purple-300 transition"
        >
          {String(value)}
        </a>
      ) : (
        <p className="font-saira text-xs text-zinc-300 leading-relaxed">{String(value)}</p>
      )}
    </div>
  );
}

function ScorePip({ value }: { value: number | null }) {
  if (!value) return <span className="text-zinc-400">—</span>;
  const color =
    value >= 8 ? "text-green-400" : value >= 5 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-saira text-sm font-bold ${color}`}>{value}/10</span>;
}

function LiftPair({
  label,
  current,
  goal,
}: {
  label: string;
  current: number | null;
  goal: number | null;
}) {
  if (!current && !goal) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-300 w-16">
        {label}
      </span>
      <span className="font-saira text-xs text-zinc-300">
        {current ? `${current} kg` : "—"}
      </span>
      {goal && (
        <span className="font-saira text-[10px] text-zinc-300">→ {goal} kg goal</span>
      )}
    </div>
  );
}

// ── Expanded profile viewer ────────────────────────────────────────────────────

// ── Coach Notes Editor ────────────────────────────────────────────────────────

function CoachNotesEditor({
  user,
  saving,
  onSave,
}: {
  user: UserRow;
  saving: boolean;
  onSave: (notes: string) => void;
}) {
  const [notes, setNotes] = React.useState(user.coach_notes ?? "");
  const [dirty, setDirty] = React.useState(false);

  // Sync if the user row updates (e.g. after save)
  React.useEffect(() => {
    setNotes(user.coach_notes ?? "");
    setDirty(false);
  }, [user.coach_notes]);

  return (
    <div
      className="border-t border-white/5 bg-purple-500/5 px-5 py-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400">
          Coach notes → injected into AI
        </p>
        {dirty && (
          <button
            disabled={saving}
            onClick={() => { onSave(notes); setDirty(false); }}
            className="rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-3 py-1 font-saira text-[10px] font-bold uppercase tracking-[0.14em] text-white transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
        {!dirty && user.coach_notes && (
          <span className="font-saira text-[10px] text-green-400">✓ Saved</span>
        )}
      </div>
      <textarea
        rows={4}
        placeholder={`Notes about ${user.display_name} — e.g. recurring themes from your real sessions, what's been working, what to watch out for. The AI will see this every time they chat.`}
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setDirty(true); }}
        className="w-full rounded-xl border border-purple-500/20 bg-surface-base px-3 py-2.5 font-saira text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
      />
    </div>
  );
}

function ExpandedProfile({ user }: { user: UserRow }) {
  const hasMindset =
    user.main_barrier ||
    user.confidence_break ||
    user.overthinking_focus ||
    user.previous_mental_work;

  const hasSelfRatings =
    user.self_confidence_reg ||
    user.self_focus_fatigue ||
    user.self_handling_pressure ||
    user.self_competition_anxiety ||
    user.self_emotional_recovery;

  const hasLifts =
    user.squat_current_kg ||
    user.bench_current_kg ||
    user.deadlift_current_kg ||
    user.squat_goal_kg ||
    user.bench_goal_kg ||
    user.deadlift_goal_kg;

  return (
    <div className="border-t border-white/5 bg-surface-panel px-5 py-5 space-y-5">
      {/* Personal */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
          Personal
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Email" value={user.email} />
          <Field
            label="Instagram"
            value={user.instagram ? `@${user.instagram.replace(/^@/, "")}` : null}
            href={user.instagram ? `https://instagram.com/${user.instagram.replace(/^@/, "")}` : undefined}
          />
          <Field label="Gender" value={user.gender} />
          <Field label="Onboarding" value={user.onboarding_complete ? "Complete" : "Incomplete"} />
          <Field
            label="Joined"
            value={
              user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null
            }
          />
          {user.role === "coach" && user.coach_code && (
            <Field label="Coach Code" value={user.coach_code} />
          )}
        </div>
      </div>

      {/* Powerlifting profile */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
          Powerlifting
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Federation" value={user.federation} />
          <Field label="Years in sport" value={user.years_powerlifting} />
          <Field label="Bodyweight" value={user.bodyweight_kg ? `${user.bodyweight_kg} kg` : null} />
          <Field label="Weight class" value={user.weight_category} />
          <Field label="Next meet" value={user.meet_date} />
          <Field label="Training days/week" value={user.training_days_per_week} />
        </div>
      </div>

      {/* Lifts */}
      {hasLifts && (
        <div>
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
            Lifts
          </p>
          <div className="space-y-1.5">
            <LiftPair label="Squat" current={user.squat_current_kg} goal={user.squat_goal_kg} />
            <LiftPair label="Bench" current={user.bench_current_kg} goal={user.bench_goal_kg} />
            <LiftPair label="Deadlift" current={user.deadlift_current_kg} goal={user.deadlift_goal_kg} />
          </div>
        </div>
      )}

      {/* Mental */}
      {hasMindset && (
        <div>
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
            Mindset
          </p>
          <div className="space-y-3">
            <Field label="Main barrier" value={user.main_barrier} />
            <Field label="Confidence break" value={user.confidence_break} />
            <Field label="Overthinking / focus" value={user.overthinking_focus} />
            <Field label="Previous mental work" value={user.previous_mental_work} />
          </div>
        </div>
      )}

      {/* Self-ratings */}
      {hasSelfRatings && (
        <div>
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
            Self-ratings (1–10)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              ["Confidence regulation", user.self_confidence_reg],
              ["Focus under fatigue", user.self_focus_fatigue],
              ["Handling pressure", user.self_handling_pressure],
              ["Competition anxiety", user.self_competition_anxiety],
              ["Emotional recovery", user.self_emotional_recovery],
            ] as [string, number | null][]).map(([label, val]) => (
              <div key={label}>
                <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-300 mb-0.5">
                  {label}
                </p>
                <ScorePip value={val} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {(user.mental_goals?.length > 0 || user.expectations || user.previous_tools || user.anything_else) && (
        <div>
          <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
            Goals & Commitment
          </p>
          <div className="space-y-3">
            {user.mental_goals?.map((g, i) => (
              <Field key={i} label={`Goal ${i + 1}`} value={g} />
            ))}
            <Field label="Expectations from coaching" value={user.expectations} />
            <Field label="Mental tools tried" value={user.previous_tools} />
            <Field label="Anything else" value={user.anything_else} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function WeeklySignupsChart({ users }: { users: UserRow[] }) {
  // Build 10-week buckets (Mon–Sun), most recent last
  const buckets: { label: string; count: number; isCurrent: boolean }[] = [];
  const now = new Date();
  // Find Monday of current week
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() + mondayOffset);

  for (let i = 9; i >= 0; i--) {
    const weekStart = new Date(thisMonday);
    weekStart.setDate(thisMonday.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = users.filter((u) => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;

    buckets.push({
      label: i === 0 ? "This wk" : `W-${i}`,
      count,
      isCurrent: i === 0,
    });
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const chartH = 80;
  const barW = 28;
  const gap = 8;
  const totalW = buckets.length * (barW + gap) - gap;

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-card p-5">
      <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-4">
        Weekly signups — last 10 weeks
      </p>
      <div className="overflow-x-auto">
        <svg
          width={totalW}
          height={chartH + 32}
          className="block"
          style={{ minWidth: totalW }}
        >
          {buckets.map((b, i) => {
            const barH = Math.max(2, Math.round((b.count / maxCount) * chartH));
            const x = i * (barW + gap);
            const y = chartH - barH;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={3}
                  className={b.isCurrent ? "fill-purple-400" : "fill-purple-500/60"}
                />
                {b.count > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className="fill-zinc-300 font-saira"
                    style={{ fontSize: 9, fontFamily: "inherit" }}
                  >
                    {b.count}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  className="fill-zinc-500 font-saira"
                  style={{ fontSize: 8, fontFamily: "inherit" }}
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function OverviewTab({ users }: { users: UserRow[] }) {
  const athletes = users.filter((u) => u.role === "athlete");
  const coaches = users.filter((u) => u.role === "coach");
  const active = users.filter((u) => u.activity_status === "active");
  const dormantAthletes = athletes.filter((u) => u.activity_status === "dormant");
  const courseAccess = athletes.filter((u) => u.course_access);
  const testAccess = athletes.filter((u) => u.test_access);
  const aiAccess = athletes.filter((u) => u.ai_access);
  const onboarded = athletes.filter((u) => u.onboarding_complete);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="flex flex-wrap gap-3">
        <Stat label="Total users" value={users.length} />
        <Stat label="Athletes" value={athletes.length} color="text-purple-300" />
        <Stat label="Coaches" value={coaches.length} color="text-cyan-300" />
        <Stat label="Active 7d" value={active.length} color="text-green-400" />
        <Stat label="Dormant" value={dormantAthletes.length} color={dormantAthletes.length > 0 ? "text-red-400" : "text-white"} />
        <Stat label="Course" value={courseAccess.length} color="text-yellow-400" />
        <Stat label="Tests" value={testAccess.length} color="text-sky-400" />
        <Stat label="AI" value={aiAccess.length} color="text-emerald-400" />
        <Stat label="Onboarded" value={`${onboarded.length}/${athletes.length}`} />
      </div>

      {/* Growth chart */}
      <WeeklySignupsChart users={users} />

      {/* Coach summary */}
      <div className="rounded-2xl border border-white/5 bg-surface-card p-5">
        <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400 mb-4">
          Coaches
        </p>
        {coaches.length === 0 ? (
          <p className="font-saira text-xs text-zinc-300">No coaches yet.</p>
        ) : (
          <div className="space-y-3">
            {coaches.map((coach) => {
              const myAthletes = athletes.filter((a) => a.coach_id === coach.id);
              return (
                <div key={coach.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-saira text-sm text-white">{coach.display_name}</p>
                    <p className="font-saira text-[10px] text-zinc-300">{coach.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-saira text-sm font-bold text-cyan-300">
                      {myAthletes.length}
                    </p>
                    <p className="font-saira text-[10px] text-zinc-300">athletes</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dormant athletes */}
      {dormantAthletes.length > 0 && (
        <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-red-400 mb-4">
            Dormant athletes — no activity in 7 days
          </p>
          <div className="space-y-2">
            {dormantAthletes.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <p className="font-saira text-sm text-white">{u.display_name}</p>
                  <p className="font-saira text-[10px] text-zinc-300">
                    {u.coach_name ? `Coach: ${u.coach_name}` : "No coach"}
                    {u.meet_date ? ` · Meet: ${u.meet_date}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-saira text-[10px] text-zinc-300">
                    {u.last_active
                      ? `Last: ${new Date(u.last_active).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                      : "Never logged"}
                  </p>
                  {!u.onboarding_complete && (
                    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 mt-0.5">
                      Onboarding incomplete
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitor athletes */}
      {(() => {
        const monitorAthletes = athletes.filter((u) => u.activity_status === "monitor");
        if (monitorAthletes.length === 0) return null;
        return (
          <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/5 p-5">
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-400 mb-4">
              Monitor — low activity
            </p>
            <div className="space-y-2">
              {monitorAthletes.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <p className="font-saira text-sm text-white">{u.display_name}</p>
                  <p className="font-saira text-[10px] text-zinc-300">
                    {u.journal_count_7d}j · {u.checkin_count_7d}c
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  coaches,
  sessionEmail,
  onRelinkCoach,
  onPatchUser,
  onDeleteUser,
  saving,
}: {
  users: UserRow[];
  coaches: UserRow[];
  sessionEmail: string | null;
  onRelinkCoach: (userId: string, coachId: string | null) => void;
  onPatchUser: (userId: string, patch: Record<string, unknown>) => void;
  onDeleteUser: (userId: string) => void;
  saving: Record<string, boolean>;
}) {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "athlete" | "coach">("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [pushTarget, setPushTarget] = React.useState<UserRow | null>(null);

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.display_name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.federation ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleFlipRole(user: UserRow) {
    const newRole = user.role === "athlete" ? "coach" : "athlete";
    const ok = window.confirm(
      `Change ${user.display_name} to ${newRole}? This affects their access and visibility.`,
    );
    if (!ok) return;
    if (newRole === "coach") {
      onPatchUser(user.id, { role: "coach", coach_code: generateCode() });
    } else {
      onPatchUser(user.id, { role: "athlete" });
    }
  }

  function handleDelete(user: UserRow) {
    const ok = window.confirm(
      `Permanently delete ${user.display_name}? This cannot be undone.`,
    );
    if (!ok) return;
    onDeleteUser(user.id);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search by name, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-surface-card px-4 py-2 font-saira text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-purple-500/50"
        />
        <div className="flex rounded-xl border border-white/10 bg-surface-card overflow-hidden">
          {(["all", "athlete", "coach"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 font-saira text-xs font-semibold uppercase tracking-wider transition
                ${roleFilter === r ? "bg-purple-500/20 text-purple-300" : "text-zinc-300 hover:text-zinc-300"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="border border-white/10 rounded-xl px-4 py-2 font-saira text-xs text-zinc-400 hover:text-white hover:border-white/30 transition"
        >
          Export CSV ↓
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-surface-card overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-2 px-5 py-3 border-b border-white/5">
          {["Name", "Email", "Role", "Coach / Athletes", "Access", "Activity (7d)", ""].map((h) => (
            <span
              key={h}
              className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <p className="font-saira text-sm text-zinc-300 text-center py-10">No users match.</p>
        ) : (
          filtered.map((user) => (
            <div key={user.id} className="border-b border-white/5 last:border-0">
              {/* Main row */}
              <div
                className="grid sm:grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-5 py-3.5 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
              >
                {/* Name */}
                <div className="flex items-center gap-2.5">
                  <ActivityDot status={user.activity_status} />
                  <div>
                    <p className="font-saira text-sm font-semibold text-white leading-none">
                      {user.display_name}
                    </p>
                    {user.instagram && (
                      <a
                        href={`https://instagram.com/${user.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-saira text-[10px] text-zinc-400 hover:text-purple-400 transition"
                      >@{user.instagram.replace(/^@/, "")}</a>
                    )}
                  </div>
                </div>

                {/* Email */}
                <p className="font-saira text-xs text-zinc-400 truncate hidden sm:block">
                  {user.email ?? "—"}
                </p>

                {/* Role + flip button */}
                <div
                  className="hidden sm:flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RoleBadge role={user.role} />
                  <button
                    onClick={() => handleFlipRole(user)}
                    disabled={saving[user.id] ?? false}
                    className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/30 transition disabled:opacity-40"
                  >
                    {user.role === "athlete" ? "→ Coach" : "→ Athlete"}
                  </button>
                </div>

                {/* Coach / Athletes */}
                <div className="hidden sm:block">
                  {user.role === "athlete" ? (
                    <p className="font-saira text-xs text-zinc-400">
                      {user.coach_name ?? <span className="text-zinc-400">No coach</span>}
                    </p>
                  ) : (
                    <p className="font-saira text-xs text-zinc-400">
                      {users.filter((u) => u.coach_id === user.id).length} athletes
                    </p>
                  )}
                </div>

                {/* Access: tier selector + legacy toggles */}
                <div
                  className="hidden sm:flex flex-col gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.role === "athlete" ? (
                    <>
                      {/* Tier selector */}
                      <select
                        value={user.plan_tier ?? "opener"}
                        disabled={saving[user.id] ?? false}
                        onChange={(e) => {
                          const tier = e.target.value;
                          const accessPatch =
                            tier === "pr"
                              ? { course_access: true,  test_access: true,  ai_access: true  }
                              : tier === "second"
                              ? { course_access: false, test_access: true,  ai_access: false }
                              : { course_access: false, test_access: false, ai_access: false };
                          onPatchUser(user.id, { plan_tier: tier, ...accessPatch });
                        }}
                        className="rounded border border-white/10 bg-surface-section px-1.5 py-0.5 font-saira text-[9px] text-purple-300 uppercase tracking-wider disabled:opacity-40 cursor-pointer focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="opener">Opener</option>
                        <option value="second">Second</option>
                        <option value="pr">PR</option>
                      </select>
                      {/* Legacy access toggles */}
                      {(
                        [
                          ["course_access", "Course", user.course_access],
                          ["test_access",   "Tests",  user.test_access],
                          ["ai_access",     "AI",     user.ai_access],
                        ] as [string, string, boolean][]
                      ).map(([field, label, val]) => (
                        <div key={field} className="flex items-center gap-1.5">
                          <Toggle
                            on={val}
                            disabled={saving[user.id] ?? false}
                            onToggle={() => onPatchUser(user.id, { [field]: !val })}
                          />
                          <span className="font-saira text-[9px] text-zinc-300 w-10">{label}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <span className="font-saira text-[10px] text-zinc-400">—</span>
                  )}
                  {/* Translator toggle — available for any role */}
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 ml-1">
                    <Toggle
                      on={user.translator_access}
                      disabled={saving[user.id] ?? false}
                      onToggle={() => onPatchUser(user.id, { translator_access: !user.translator_access })}
                    />
                    <span className="font-saira text-[9px] text-amber-400/80 w-12">Translate</span>
                  </div>
                </div>

                {/* Activity */}
                <div className="hidden sm:block">
                  <p className="font-saira text-xs text-zinc-400">
                    {user.journal_count_7d}j · {user.checkin_count_7d}c
                  </p>
                  {user.last_active && (
                    <p className="font-saira text-[10px] text-zinc-400">
                      {new Date(user.last_active).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>

                {/* Actions: push + expand + delete */}
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setPushTarget(user)}
                    className={`transition ${user.push_subscribed ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-600 hover:text-zinc-400"}`}
                    title={user.push_subscribed ? `Send push to ${user.display_name} (subscribed)` : `${user.display_name} hasn't enabled notifications`}
                    aria-label={`Send push notification to ${user.display_name}`}
                  >
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" aria-hidden>
                      <path
                        d="M10 2a6 6 0 0 0-6 6v2.586l-1.707 1.707A1 1 0 0 0 3 14h14a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6z"
                        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
                      />
                      <path
                        d="M8 14a2 2 0 0 0 4 0"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {user.email !== sessionEmail && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-zinc-500 hover:text-rose-400 transition text-xs"
                      title="Delete user"
                    >
                      ✕
                    </button>
                  )}
                  <span
                    className="font-saira text-zinc-300 text-xs cursor-pointer"
                    onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  >
                    {expandedId === user.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Mobile extras */}
              <div className="sm:hidden flex flex-wrap gap-2 px-5 pb-3 -mt-1">
                <RoleBadge role={user.role} />
                {user.email && (
                  <span className="font-saira text-[10px] text-zinc-400">{user.email}</span>
                )}
                <span className="font-saira text-[10px] text-zinc-300">
                  {user.journal_count_7d}j · {user.checkin_count_7d}c
                </span>
                {user.role === "athlete" && (
                  <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {/* Mobile tier selector */}
                    <select
                      value={user.plan_tier ?? "opener"}
                      disabled={saving[user.id] ?? false}
                      onChange={(e) => onPatchUser(user.id, { plan_tier: e.target.value })}
                      className="rounded border border-white/10 bg-surface-section px-2 py-1 font-saira text-[10px] text-purple-300 uppercase tracking-wider disabled:opacity-40 cursor-pointer focus:outline-none"
                    >
                      <option value="opener">Opener</option>
                      <option value="second">Second</option>
                      <option value="pr">PR</option>
                    </select>
                    {(
                      [
                        ["course_access", "Course", user.course_access],
                        ["test_access",   "Tests",  user.test_access],
                        ["ai_access",     "AI",     user.ai_access],
                      ] as [string, string, boolean][]
                    ).map(([field, label, val]) => (
                      <div key={field} className="flex items-center gap-1.5">
                        <Toggle
                          on={val}
                          disabled={saving[user.id] ?? false}
                          onToggle={() => onPatchUser(user.id, { [field]: !val })}
                        />
                        <span className="font-saira text-[10px] text-zinc-300">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Translator toggle — any role */}
                <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    on={user.translator_access}
                    disabled={saving[user.id] ?? false}
                    onToggle={() => onPatchUser(user.id, { translator_access: !user.translator_access })}
                  />
                  <span className="font-saira text-[10px] text-amber-400/80">Translate</span>
                </div>
              </div>

              {/* Expanded profile */}
              {expandedId === user.id && (
                <div>
                  {/* Quick coach reassign for athletes */}
                  {user.role === "athlete" && coaches.length > 0 && (
                    <div
                      className="flex items-center gap-3 px-5 py-3 border-t border-white/5 bg-surface-panel"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                        Coach:
                      </span>
                      <select
                        value={user.coach_id ?? ""}
                        disabled={saving[user.id] ?? false}
                        onChange={(e) =>
                          onRelinkCoach(user.id, e.target.value || null)
                        }
                        className="rounded-lg border border-white/10 bg-surface-card px-3 py-1.5 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="">No coach</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.display_name}
                          </option>
                        ))}
                      </select>
                      {saving[user.id] && (
                        <span className="font-saira text-[10px] text-zinc-300">Saving…</span>
                      )}
                    </div>
                  )}
                  {/* Coach notes — injected into AI system prompt */}
                  <CoachNotesEditor
                    user={user}
                    saving={saving[user.id] ?? false}
                    onSave={(notes) => onPatchUser(user.id, { coach_notes: notes })}
                  />
                  <ExpandedProfile user={user} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="font-saira text-[10px] text-zinc-400 text-right">
        {filtered.length} of {users.length} users shown
      </p>

      {pushTarget && (
        <PushComposer
          target={pushTarget}
          onClose={() => setPushTarget(null)}
        />
      )}
    </div>
  );
}

// ── Push Composer ─────────────────────────────────────────────────────────────

function PushComposer({ target, onClose }: { target: UserRow; onClose: () => void }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<{
    sent: number;
    failed: number;
    expired: number;
    total: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
          userIds: [target.id],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-purple-500/25 bg-surface-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400">
              Send push to
            </p>
            <h3 className="font-saira text-lg font-extrabold uppercase text-white mt-0.5">
              {target.display_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-500 hover:text-zinc-200 transition text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="e.g. Great work today 💪"
              className="w-full rounded-lg border border-white/10 bg-surface-base/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1 block">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Don't forget to log your session today."
              className="w-full rounded-lg border border-white/10 bg-surface-base/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <div>
            <label className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1 block">
              Open URL on click (optional)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/journal"
              className="w-full rounded-lg border border-white/10 bg-surface-base/60 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {result && (
          <div className={`mt-4 rounded-lg border px-3 py-2 font-saira text-xs ${
            result.sent > 0
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}>
            {result.sent > 0
              ? `Sent to ${result.sent} device${result.sent === 1 ? "" : "s"}.`
              : result.total === 0
                ? "This user has no active subscriptions — they haven't enabled notifications yet."
                : `Delivery failed (${result.failed} failed, ${result.expired} expired).`}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-saira text-xs text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 font-saira text-xs uppercase tracking-[0.15em] transition"
          >
            Close
          </button>
          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-saira text-xs font-semibold uppercase tracking-[0.15em] transition"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Coach Links Tab ───────────────────────────────────────────────────────────

function CoachLinksTab({
  users,
  coaches,
  onRelinkCoach,
  onPatchUser,
  saving,
}: {
  users: UserRow[];
  coaches: UserRow[];
  onRelinkCoach: (athleteId: string, coachId: string | null) => void;
  onPatchUser: (userId: string, patch: Record<string, unknown>) => Promise<void>;
  saving: Record<string, boolean>;
}) {
  const athletes       = users.filter((u) => u.role === "athlete");
  const unlinked        = athletes.filter((a) => !a.coach_id);
  const pendingCoaches  = coaches.filter((c) => c.coach_status === "pending");
  const approvedCoaches = coaches.filter((c) => c.coach_status === "approved" || c.coach_status == null);
  const rejectedCoaches = coaches.filter((c) => c.coach_status === "rejected");
  const [pendingCoach, setPendingCoach] = React.useState<Record<string, string>>({});

  return (
    <div className="space-y-5">

      {/* ── Pending approval queue ── */}
      {pendingCoaches.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-500/15">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
              {pendingCoaches.length}
            </span>
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
              Pending coach approval
            </p>
          </div>
          {pendingCoaches.map((coach) => {
            const app = coach.coach_application;
            return (
              <div key={coach.id} className="border-b border-white/5 last:border-0">
                {/* Header row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    {coach.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coach.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover opacity-90" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center font-saira text-sm font-bold text-amber-300">
                        {coach.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-saira text-sm font-semibold text-white">{coach.display_name}</p>
                      <p className="font-saira text-[10px] text-zinc-400">
                        {coach.email}
                        {coach.created_at && (
                          <span className="ml-2 text-zinc-500">
                            signed up {new Date(coach.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={saving[coach.id] ?? false}
                      onClick={() => onPatchUser(coach.id, { coach_status: "rejected" })}
                      className="rounded-lg border border-red-500/25 bg-red-500/8 px-3 py-1.5 font-saira text-xs font-bold text-red-400 hover:bg-red-500/18 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ✕ Reject
                    </button>
                    <button
                      disabled={saving[coach.id] ?? false}
                      onClick={() => onPatchUser(coach.id, { coach_status: "approved" })}
                      className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-1.5 font-saira text-xs font-bold text-green-400 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {saving[coach.id] ? "Saving…" : "✓ Approve"}
                    </button>
                  </div>
                </div>

                {/* Application answers */}
                {app ? (
                  <div className="mx-5 mb-4 rounded-xl border border-white/5 bg-black/20 divide-y divide-white/5">
                    {[
                      ["Athletes coached", app.athletes_count],
                      ["Instagram",        app.instagram],
                      ["Background",       app.background],
                      ["Main goal",        app.why_powerflow],
                    ].map(([label, value]) => value ? (
                      <div key={label} className="flex gap-3 px-4 py-2.5">
                        <span className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
                        <span className="font-saira text-xs text-zinc-300 leading-relaxed">{value}</span>
                      </div>
                    ) : null)}
                  </div>
                ) : (
                  <p className="font-saira text-[10px] text-zinc-600 italic px-5 pb-4">
                    No application submitted yet — coach hasn&apos;t filled in the questionnaire.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {approvedCoaches.length === 0 && pendingCoaches.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-card p-6 text-center">
          <p className="font-saira text-sm text-zinc-300">No coaches in the system yet.</p>
        </div>
      )}

      {approvedCoaches.map((coach) => {
        const myAthletes = athletes.filter((a) => a.coach_id === coach.id);
        return (
          <div
            key={coach.id}
            className="rounded-2xl border border-white/5 bg-surface-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-cyan-500/5">
              <div>
                <p className="font-saira text-sm font-bold text-cyan-300">
                  {coach.display_name}
                </p>
                <p className="font-saira text-[10px] text-zinc-300">
                  {coach.email}
                  {coach.coach_code && (
                    <span className="ml-2 font-mono text-zinc-400">
                      Code: {coach.coach_code}
                    </span>
                  )}
                </p>
              </div>
              <span className="font-saira text-xs text-zinc-300">
                {myAthletes.length} athlete{myAthletes.length !== 1 ? "s" : ""}
              </span>
            </div>

            {myAthletes.length === 0 ? (
              <p className="font-saira text-xs text-zinc-400 px-5 py-4">
                No athletes linked yet.
              </p>
            ) : (
              myAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <ActivityDot status={athlete.activity_status} />
                    <div>
                      <p className="font-saira text-sm text-white">{athlete.display_name}</p>
                      <p className="font-saira text-[10px] text-zinc-300">
                        {athlete.email} · {athlete.journal_count_7d}j · {athlete.checkin_count_7d}c
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={athlete.coach_id ?? ""}
                      disabled={saving[athlete.id] ?? false}
                      onChange={(e) => onRelinkCoach(athlete.id, e.target.value || null)}
                      className="rounded-lg border border-white/10 bg-surface-panel px-2.5 py-1 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">Unlink</option>
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name}
                        </option>
                      ))}
                    </select>
                    {saving[athlete.id] && (
                      <span className="font-saira text-[10px] text-zinc-300">Saving…</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}

      {unlinked.length > 0 && (
        <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-orange-400">
              Unlinked athletes ({unlinked.length})
            </p>
          </div>
          {unlinked.map((athlete) => (
            <div
              key={athlete.id}
              className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="font-saira text-sm text-white">{athlete.display_name}</p>
                <p className="font-saira text-[10px] text-zinc-300">{athlete.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pendingCoach[athlete.id] ?? ""}
                  onChange={(e) =>
                    setPendingCoach((prev) => ({ ...prev, [athlete.id]: e.target.value }))
                  }
                  className="rounded-lg border border-white/10 bg-surface-card px-2.5 py-1 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select coach…</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!pendingCoach[athlete.id] || (saving[athlete.id] ?? false)}
                  onClick={() => {
                    const coachId = pendingCoach[athlete.id];
                    if (coachId) onRelinkCoach(athlete.id, coachId);
                  }}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-saira text-xs font-semibold text-purple-300 hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {saving[athlete.id] ? "Saving…" : "Link"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rejected coaches ── */}
      {rejectedCoaches.length > 0 && (
        <div className="rounded-2xl border border-red-500/15 bg-red-500/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/10">
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">
              Rejected ({rejectedCoaches.length})
            </p>
          </div>
          {rejectedCoaches.map((coach) => (
            <div key={coach.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="font-saira text-sm text-zinc-400">{coach.display_name}</p>
                <p className="font-saira text-[10px] text-zinc-600">{coach.email}</p>
              </div>
              <button
                disabled={saving[coach.id] ?? false}
                onClick={() => onPatchUser(coach.id, { coach_status: "approved" })}
                className="rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-1 font-saira text-xs text-green-500 hover:text-green-400 hover:bg-green-500/15 disabled:opacity-40 transition"
              >
                Approve anyway
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Results Tab ───────────────────────────────────────────────────────────────

type TestResultsData = {
  sat: SatRow[];
  acsi: AcsiRow[];
  csai: CsaiRow[];
  das: DasRow[];
};

type ResultSubTab = "sat" | "acsi" | "csai" | "das";

function PaidChip({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold bg-green-500/15 text-green-400">
      Paid
    </span>
  ) : (
    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold bg-zinc-500/15 text-zinc-300">
      Unpaid
    </span>
  );
}

function ResultsTab() {
  const [data, setData] = React.useState<TestResultsData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sub, setSub] = React.useState<ResultSubTab>("sat");
  const fetched = React.useRef(false);

  React.useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    fetch("/api/admin/test-results")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<TestResultsData>;
      })
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnlock(table: string, id: string) {
    await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: id,
        table,
        password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "",
      }),
    });
    // Update local state
    setData((prev) => {
      if (!prev) return prev;
      const key = table.replace("_results", "") as ResultSubTab;
      const updated = { ...prev };
      if (key === "sat") updated.sat = prev.sat.map((r) => r.id === id ? { ...r, paid: true } : r);
      else if (key === "acsi") updated.acsi = prev.acsi.map((r) => r.id === id ? { ...r, paid: true } : r);
      else if (key === "csai") updated.csai = prev.csai.map((r) => r.id === id ? { ...r, paid: true } : r);
      else if (key === "das") updated.das = prev.das.map((r) => r.id === id ? { ...r, paid: true } : r);
      return updated;
    });
  }

  const subTabs: { key: ResultSubTab; label: string }[] = [
    { key: "sat", label: "SAT" },
    { key: "acsi", label: "ACSI" },
    { key: "csai", label: "CSAI" },
    { key: "das", label: "DAS" },
  ];

  const counts = data
    ? { sat: data.sat.length, acsi: data.acsi.length, csai: data.csai.length, das: data.das.length }
    : { sat: 0, acsi: 0, csai: 0, das: 0 };

  return (
    <div className="space-y-5">
      {/* Sub-tab pills */}
      <div className="flex gap-2 flex-wrap">
        {subTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`px-3 py-1.5 rounded-lg font-saira text-[11px] font-bold uppercase tracking-wider border transition
              ${sub === key
                ? "border-purple-400/40 bg-purple-500/15 text-purple-300"
                : "border-white/10 text-zinc-300 hover:text-zinc-300"}`}
          >
            {label} {data ? `(${counts[key]})` : ""}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
        </div>
      )}

      {error && (
        <p className="font-saira text-sm text-red-400">{error}</p>
      )}

      {data && (
        <div className="rounded-2xl border border-white/5 bg-surface-card overflow-hidden">
          {/* Common header */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400">
              {sub.toUpperCase()} Results
            </p>
            <span className="font-saira text-[10px] text-zinc-300">{counts[sub]} total</span>
          </div>

          <div className="overflow-x-auto">
            {sub === "sat" && (
              <table className="w-full text-left text-xs font-saira">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Name", "Email", "Submitted", "Paid", "Score", "Valid", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sat.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.sum_yes}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold ${r.validity_reliable ? "bg-green-500/15 text-green-400" : "bg-rose-500/15 text-rose-400"}`}>
                          {r.validity_reliable ? "Reliable" : "Unreliable"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {!r.paid && (
                          <button
                            onClick={() => handleUnlock("sat_results", r.id)}
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/30 transition"
                          >
                            Unlock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {sub === "acsi" && (
              <table className="w-full text-left text-xs font-saira">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Name", "Email", "Submitted", "Paid", "Total", "Top subscale", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.acsi.map((r) => {
                    const subscales: [string, number][] = [
                      ["Coping", r.score_coping],
                      ["Peaking", r.score_peaking],
                      ["Goals", r.score_goal_setting],
                      ["Concentration", r.score_concentration],
                      ["Freedom", r.score_freedom],
                      ["Confidence", r.score_confidence],
                      ["Coachability", r.score_coachability],
                    ];
                    const top = subscales.reduce((a, b) => (b[1] > a[1] ? b : a));
                    return (
                      <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                        <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                        <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                        <td className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                          {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                        <td className="px-4 py-2.5 font-bold text-white">{r.total_score}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{top[0]} ({top[1]})</td>
                        <td className="px-4 py-2.5">
                          {!r.paid && (
                            <button
                              onClick={() => handleUnlock("acsi_results", r.id)}
                              className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/30 transition"
                            >
                              Unlock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {sub === "csai" && (
              <table className="w-full text-left text-xs font-saira">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Name", "Email", "Submitted", "Paid", "Cog", "Som", "Conf", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.csai.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.score_cognitive}</td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.score_somatic}</td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.score_confidence}</td>
                      <td className="px-4 py-2.5">
                        {!r.paid && (
                          <button
                            onClick={() => handleUnlock("csai_results", r.id)}
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/30 transition"
                          >
                            Unlock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {sub === "das" && (
              <table className="w-full text-left text-xs font-saira">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Name", "Email", "Submitted", "Paid", "Total", "Depr-prone", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.das.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.total_score}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold ${r.depression_prone ? "bg-rose-500/15 text-rose-400" : "bg-zinc-500/15 text-zinc-300"}`}>
                          {r.depression_prone ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {!r.paid && (
                          <button
                            onClick={() => handleUnlock("das_results", r.id)}
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/30 transition"
                          >
                            Unlock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Insights Tab ───────────────────────────────────────────────────────────

type AiFeedbackData = {
  feedback: {
    total: number;
    uniqueRaters: number;
    lengthCounts: { shorter: number; perfect: number; more_detail: number };
    styleCounts:  { direct: number; good: number; warmer: number };
    avgHelpfulness: number | null;
    notes: Array<{ note: string; rated_on: string }>;
  };
  techniques: Array<{
    technique: string;
    total: number;
    resonated: number;
    resonanceRate: number;
  }>;
  messages: {
    thumbsUp: number;
    thumbsDown: number;
    total: number;
    upRate: number | null;
  };
  sessions: {
    total: number;
    uniqueUsers: number;
    avgMsgPerSession: number;
  };
};

function AiInsightsTab({ users }: { users: UserRow[] }) {
  const [data, setData]       = React.useState<AiFeedbackData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);
  const [batching, setBatching]       = React.useState(false);
  const [batchResult, setBatchResult] = React.useState<{ processed: number; errors: number } | null>(null);
  const [debugUserId, setDebugUserId] = React.useState("");
  const [debugResult, setDebugResult] = React.useState<Record<string, unknown> | null>(null);
  const [debugging, setDebugging]     = React.useState(false);

  function loadData() {
    setLoading(true);
    fetch("/api/admin/feedback")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: AiFeedbackData) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { loadData(); }, []);

  async function runDebugPrompt() {
    if (!debugUserId.trim()) return;
    setDebugging(true);
    setDebugResult(null);
    try {
      const r = await fetch(`/api/admin/debug-prompt?userId=${debugUserId.trim()}`);
      setDebugResult(await r.json());
    } catch (e) {
      setDebugResult({ error: String(e) });
    } finally {
      setDebugging(false);
    }
  }

  async function runBatchSummarizer() {
    setBatching(true);
    setBatchResult(null);
    try {
      const r = await fetch("/api/admin/summarize-batch", { method: "POST" });
      const d = await r.json() as { processed: number; errors: number };
      setBatchResult(d);
      loadData(); // refresh stats after batch
    } catch (e) {
      setBatchResult({ processed: 0, errors: 1 });
      console.error(e);
    } finally {
      setBatching(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
    </div>
  );
  if (error) return <p className="text-red-400 font-saira text-sm">{error}</p>;
  if (!data)  return null;

  const { feedback, techniques, messages, sessions } = data;
  const totalLength = feedback.lengthCounts.shorter + feedback.lengthCounts.perfect + feedback.lengthCounts.more_detail;
  const totalStyle  = feedback.styleCounts.direct + feedback.styleCounts.good + feedback.styleCounts.warmer;

  function pct(n: number, total: number) {
    return total > 0 ? Math.round((n / total) * 100) : 0;
  }

  return (
    <div className="space-y-8">

      {/* ── Batch summarizer ── */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/6 bg-surface-panel/60 px-5 py-4">
        <div className="flex-1">
          <p className="font-saira text-sm font-semibold text-white">Batch summarize historical sessions</p>
          <p className="font-saira text-xs text-zinc-400 mt-0.5">
            Finds every session in chat_messages without a summary and processes them all. Skips sessions with fewer than 4 messages and today&apos;s open sessions.
          </p>
          {batchResult && (
            <p className={`font-saira text-xs mt-1.5 font-semibold ${batchResult.errors > 0 ? "text-yellow-400" : "text-green-400"}`}>
              Done — {batchResult.processed} summarized{batchResult.errors > 0 ? `, ${batchResult.errors} errors` : ""}
            </p>
          )}
        </div>
        <button
          onClick={runBatchSummarizer}
          disabled={batching}
          className="flex-shrink-0 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-saira text-xs font-bold uppercase tracking-[0.12em] text-white transition"
        >
          {batching ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin" />
              Running…
            </span>
          ) : "Run now"}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total sessions",    value: sessions.total,                         sub: `${sessions.uniqueUsers} athletes` },
          { label: "Avg helpfulness",   value: feedback.avgHelpfulness != null ? `${feedback.avgHelpfulness}/5` : "—", sub: `${feedback.total} ratings` },
          { label: "Thumbs up rate",    value: messages.upRate != null ? `${messages.upRate}%` : "—", sub: `${messages.thumbsUp}↑  ${messages.thumbsDown}↓` },
          { label: "Avg msgs/session",  value: sessions.avgMsgPerSession,              sub: `${feedback.uniqueRaters} users gave feedback` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5">
            <p className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-1">{label}</p>
            <p className="font-saira text-3xl font-extrabold text-white leading-none">{value}</p>
            <p className="font-saira text-[11px] text-zinc-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Length preference ── */}
        <div className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5 space-y-4">
          <h3 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Response length</h3>
          {[
            { key: "shorter",     label: "Too long",       count: feedback.lengthCounts.shorter },
            { key: "perfect",     label: "Perfect",        count: feedback.lengthCounts.perfect },
            { key: "more_detail", label: "More detail",    count: feedback.lengthCounts.more_detail },
          ].map(({ key, label, count }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between font-saira text-xs text-zinc-300">
                <span>{label}</span>
                <span className="text-zinc-400">{count} ({pct(count, totalLength)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct(count, totalLength)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Style preference ── */}
        <div className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5 space-y-4">
          <h3 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Tone preference</h3>
          {[
            { key: "direct", label: "More direct",   count: feedback.styleCounts.direct },
            { key: "good",   label: "Good as is",    count: feedback.styleCounts.good },
            { key: "warmer", label: "More warmth",   count: feedback.styleCounts.warmer },
          ].map(({ key, label, count }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between font-saira text-xs text-zinc-300">
                <span>{label}</span>
                <span className="text-zinc-400">{count} ({pct(count, totalStyle)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct(count, totalStyle)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Technique effectiveness ── */}
      {(() => {
        const established = techniques.filter((t) => t.total >= 3);
        const emerging    = techniques.filter((t) => t.total < 3);
        return (
          <div className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5 space-y-6">
            <h3 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Technique resonance (across all athletes)
            </h3>

            {/* Established — 3+ sessions */}
            {established.length === 0 ? (
              <p className="font-saira text-xs text-zinc-500">No techniques with 3+ sessions yet — run the batch summarizer first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-saira text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400">
                      <th className="py-2 pr-4 font-semibold uppercase tracking-[0.12em]">Technique</th>
                      <th className="py-2 pr-4 font-semibold uppercase tracking-[0.12em]">Sessions</th>
                      <th className="py-2 pr-4 font-semibold uppercase tracking-[0.12em]">Resonated</th>
                      <th className="py-2 font-semibold uppercase tracking-[0.12em]">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {established.map((t) => (
                      <tr key={t.technique} className="border-b border-white/3 hover:bg-white/3">
                        <td className="py-2.5 pr-4 text-white capitalize">{t.technique}</td>
                        <td className="py-2.5 pr-4 text-zinc-400">{t.total}</td>
                        <td className="py-2.5 pr-4 text-zinc-400">{t.resonated}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-white/8 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${t.resonanceRate >= 70 ? "bg-green-500" : t.resonanceRate >= 40 ? "bg-yellow-500" : "bg-red-500/60"}`}
                                style={{ width: `${t.resonanceRate}%` }}
                              />
                            </div>
                            <span className={`font-bold ${t.resonanceRate >= 70 ? "text-green-400" : t.resonanceRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                              {t.resonanceRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Emerging — fewer than 3 sessions */}
            {emerging.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <p className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Seen but not yet established (fewer than 3 sessions)
                </p>
                <div className="flex flex-wrap gap-2">
                  {emerging.map((t) => (
                    <span
                      key={t.technique}
                      className="rounded-lg bg-white/5 border border-white/8 px-2.5 py-1 font-saira text-[11px] text-zinc-400 capitalize"
                    >
                      {t.technique} <span className="text-zinc-600">×{t.total}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Athlete notes ── */}
      {feedback.notes.length > 0 && (
        <div className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5">
          <h3 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300 mb-4">
            Athlete notes ({feedback.notes.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {feedback.notes.map((n, i) => (
              <div key={i} className="rounded-xl bg-white/4 px-4 py-3">
                <p className="font-saira text-xs text-zinc-400 mb-1">{n.rated_on}</p>
                <p className="font-saira text-sm text-zinc-200">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prompt debugger ── */}
      <div className="rounded-2xl border border-white/6 bg-surface-panel/60 p-5 space-y-4">
        <div>
          <h3 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Prompt debugger</h3>
          <p className="font-saira text-xs text-zinc-400 mt-0.5">Paste a user ID to see exactly what the AI will receive — feedback adaptation, global patterns, session memory.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={debugUserId}
            onChange={(e) => setDebugUserId(e.target.value)}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 font-saira text-xs text-white focus:outline-none focus:border-purple-400"
          >
            <option value="">— select athlete —</option>
            {users.filter(u => u.ai_access).map(u => (
              <option key={u.id} value={u.id}>
                {u.display_name || u.email || u.id} {u.role === "coach" ? "(coach)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={runDebugPrompt}
            disabled={debugging || !debugUserId.trim()}
            className="rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 px-4 py-2 font-saira text-xs font-bold uppercase tracking-[0.12em] text-white transition"
          >
            {debugging ? "Loading…" : "Inspect"}
          </button>
        </div>
        {debugResult && (() => {
          const r = debugResult as {
            athlete: { name: string; ai_access: boolean; plan_tier: string };
            context: { journal_entries: number; ego_states: number; training_entries: number; session_summaries: number };
            will_inject: { feedback_section: boolean; patterns_section: boolean; coach_notes: boolean };
            coach_notes: string | null;
            feedback_aggregate: Record<string, unknown>;
          };
          const injectRow = (label: string, on: boolean) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
              <span className="font-saira text-xs text-zinc-400">{label}</span>
              <span className={`font-saira text-xs font-bold ${on ? "text-green-400" : "text-zinc-600"}`}>
                {on ? "✓ injected" : "✗ not injected"}
              </span>
            </div>
          );
          return (
            <div className="space-y-4 mt-2">
              {/* Header */}
              <div className="rounded-xl bg-black/30 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-saira text-sm font-bold text-white">{r.athlete.name}</p>
                  <p className="font-saira text-[10px] text-zinc-500">{r.athlete.plan_tier} · ai_access: {String(r.athlete.ai_access)}</p>
                </div>
                <div className="text-right font-saira text-[10px] text-zinc-500 space-y-0.5">
                  <p>{r.context.journal_entries} journal entries</p>
                  <p>{r.context.ego_states} ego states</p>
                  <p>{r.context.training_entries} training entries</p>
                  <p>{r.context.session_summaries} session summaries</p>
                </div>
              </div>

              {/* Will inject */}
              <div className="rounded-xl bg-black/30 px-4 py-2">
                <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">Sections injected into system prompt</p>
                {injectRow("Feedback / communication prefs", r.will_inject.feedback_section)}
                {injectRow("Global technique patterns", r.will_inject.patterns_section)}
                {injectRow("Coach briefing notes", r.will_inject.coach_notes)}
              </div>

              {/* Coach notes preview */}
              {r.coach_notes ? (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                  <p className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">Coach notes (sent verbatim to AI)</p>
                  <p className="font-saira text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{r.coach_notes}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                  <p className="font-saira text-xs text-zinc-600 italic">No coach notes written for this athlete yet.</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Conversations Tab ─────────────────────────────────────────────────────────

type ConvStat = {
  userId: string;
  displayName: string;
  role: string;
  messageCount: number;
  sessionCount: number;
  lastMessageAt: string;
  summaries: Array<{
    session_date: string;
    summary: string;
    techniques_used: string[];
    themes: string[];
    resonated: string | null;
    message_count: number;
  }>;
};

type ThreadMsg = { id: string; role: string; content: string; created_at: string };

function ConversationsTab() {
  const [stats, setStats]             = React.useState<ConvStat[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [selectedId, setSelectedId]   = React.useState<string | null>(null);
  const [thread, setThread]           = React.useState<ThreadMsg[]>([]);
  const [loadingThread, setLoadingThread] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/conversations")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setStats(data) : setStats([]))
      .catch(() => setStats([]))
      .finally(() => setLoadingStats(false));
  }, []);

  const toggleThread = async (userId: string) => {
    if (selectedId === userId) { setSelectedId(null); setThread([]); return; }
    setSelectedId(userId);
    setLoadingThread(true);
    try {
      const data = await fetch(`/api/admin/conversations?athlete_id=${userId}`).then((r) => r.json());
      setThread(Array.isArray(data) ? data : []);
    } finally {
      setLoadingThread(false);
    }
  };

  if (loadingStats) return (
    <div className="flex justify-center py-10">
      <div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
    </div>
  );

  if (!stats.length) return (
    <p className="font-saira text-sm text-zinc-400 py-4">No conversations yet.</p>
  );

  return (
    <div className="space-y-3 max-w-3xl">
      {stats.map((stat) => (
        <div key={stat.userId} className="rounded-2xl border border-white/5 bg-surface-card overflow-hidden">

          {/* Header row */}
          <button
            onClick={() => toggleThread(stat.userId)}
            className="w-full text-left px-4 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-saira text-sm font-semibold text-white">{stat.displayName}</p>
                <span className="font-saira text-[9px] uppercase tracking-wider border border-white/10 rounded-full px-1.5 py-0.5 text-zinc-300">
                  {stat.role}
                </span>
              </div>
              <p className="font-saira text-xs text-zinc-300 mt-0.5">
                {stat.messageCount} messages · {stat.sessionCount} session{stat.sessionCount !== 1 ? "s" : ""} · Last: {new Date(stat.lastMessageAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <span className="font-saira text-xs text-zinc-400 flex-shrink-0">
              {selectedId === stat.userId ? "▲ hide" : "▼ thread"}
            </span>
          </button>

          {/* Session summaries */}
          {stat.summaries.length > 0 && (
            <div className="border-t border-white/5 px-4 py-3 space-y-2">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Session summaries
              </p>
              {stat.summaries.map((s) => (
                <div key={s.session_date} className="rounded-xl border border-white/5 bg-surface-panel px-3 py-2.5">
                  <p className="font-saira text-[10px] text-purple-400 mb-1">{s.session_date} · {s.message_count} msgs</p>
                  <p className="font-saira text-xs text-zinc-300 leading-relaxed">{s.summary}</p>
                  {s.techniques_used?.length > 0 && (
                    <p className="font-saira text-[10px] text-zinc-400 mt-1">
                      Techniques: {s.techniques_used.join(", ")}
                    </p>
                  )}
                  {s.resonated && (
                    <p className="font-saira text-[10px] text-zinc-300 mt-1 italic">{s.resonated}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thread */}
          {selectedId === stat.userId && (
            <div className="border-t border-white/5 px-4 py-4 max-h-[480px] overflow-y-auto space-y-2.5">
              {loadingThread ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
                </div>
              ) : thread.length === 0 ? (
                <p className="font-saira text-xs text-zinc-400 text-center py-2">No messages.</p>
              ) : thread.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl font-saira text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-500/10 border border-purple-500/15 text-zinc-300"
                      : "bg-white/[0.03] border border-white/5 text-zinc-400"
                  }`}>
                    <p>{msg.content.length > 600 ? msg.content.slice(0, 600) + "…" : msg.content}</p>
                    <p className="font-saira text-[9px] text-zinc-500 mt-1">
                      {new Date(msg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} {new Date(msg.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────

type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  target_role: string;
  active: boolean;
  created_at: string;
};

function BroadcastTab({ users }: { users: UserRow[] }) {
  const [broadcasts, setBroadcasts]   = React.useState<BroadcastRow[]>([]);
  const [title, setTitle]             = React.useState("");
  const [body, setBody]               = React.useState("");
  const [targetRole, setTargetRole]   = React.useState<"all" | "athlete" | "coach">("all");
  const [sending, setSending]         = React.useState(false);
  const [sent, setSent]               = React.useState(false);

  // ── Email segment helpers (kept for email copy) ──────────────────────────
  const allWithEmail = users.filter((u) => !!u.email);
  const athletes     = allWithEmail.filter((u) => u.role === "athlete");
  const coaches      = allWithEmail.filter((u) => u.role === "coach");

  const emailMap: Record<string, string[]> = {
    all:     allWithEmail.map((u) => u.email as string),
    athlete: athletes.map((u) => u.email as string),
    coach:   coaches.map((u) => u.email as string),
  };
  const previewEmails = emailMap[targetRole];

  React.useEffect(() => {
    fetch("/api/admin/broadcasts")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => Array.isArray(data) ? setBroadcasts(data) : setBroadcasts([]));
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), target_role: targetRole }),
    });
    if (res.ok) {
      const newBcast = await res.json() as BroadcastRow;
      setBroadcasts((prev) => [newBcast, ...prev]);
      setTitle(""); setBody("");
      setSent(true); setTimeout(() => setSent(false), 2500);
    }
    setSending(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/broadcasts?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBroadcasts((prev) => prev.map((b) => b.id === id ? { ...b, active: !active } : b));
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Compose ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-surface-card p-5 space-y-4">
        <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400">
          New broadcast
        </p>

        {/* Target */}
        <div className="flex gap-2">
          {(["all", "athlete", "coach"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTargetRole(r)}
              className={`rounded-full px-3 py-1 font-saira text-[11px] uppercase tracking-[0.14em] border transition ${
                targetRole === r
                  ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                  : "border-white/10 text-zinc-300 hover:text-zinc-300"
              }`}
            >
              {r === "all" ? "Everyone" : r === "athlete" ? "Athletes" : "Coaches"}
              <span className="ml-1.5 text-zinc-400">({emailMap[r].length})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-surface-panel px-4 py-2.5 font-saira text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-purple-500/50"
        />
        <div>
          <textarea
            placeholder={"Message body…\n\nTip: add links with [Link text](/path) — e.g. [Open the guide](/guide)"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-surface-panel px-4 py-2.5 font-saira text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <p className="font-saira text-[10px] text-zinc-500 mt-1">
            Links: [Guide →](/guide) · [Course →](/course) · any /path works
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 font-saira text-sm font-semibold uppercase tracking-[0.14em] text-white transition"
          >
            {sent ? "✓ Published" : sending ? "Publishing…" : "Publish broadcast →"}
          </button>
          <p className="font-saira text-[10px] text-zinc-400">
            {previewEmails.length} recipient{previewEmails.length !== 1 ? "s" : ""} · push + in-app on next login
          </p>
        </div>
      </div>

      {/* ── Published broadcasts ─────────────────────────────────────────────── */}
      {broadcasts.length > 0 && (
        <div className="space-y-2">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300">
            Published
          </p>
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 flex items-start gap-4 ${
                b.active ? "border-purple-500/20 bg-purple-500/5" : "border-white/5 bg-surface-card opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-saira text-sm font-semibold text-white truncate">{b.title}</p>
                  <span className="flex-shrink-0 font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-300 border border-white/10 rounded-full px-1.5 py-0.5">
                    {b.target_role}
                  </span>
                </div>
                <p className="font-saira text-xs text-zinc-300 truncate">{b.body.slice(0, 80)}{b.body.length > 80 ? "…" : ""}</p>
                <p className="font-saira text-[10px] text-zinc-500 mt-1">
                  {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => toggleActive(b.id, b.active)}
                className={`flex-shrink-0 rounded-full px-3 py-1 font-saira text-[10px] uppercase tracking-[0.14em] border transition ${
                  b.active
                    ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                {b.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dev Tools Tab ─────────────────────────────────────────────────────────────

function DevToolsTab({ users }: { users: UserRow[] }) {
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [checkinResult, setCheckinResult]   = React.useState<Record<string, unknown> | null>(null);
  const [checkinLoading, setCheckinLoading] = React.useState(false);
  const [checkinMsg, setCheckinMsg]         = React.useState<string | null>(null);
  const [popupForced, setPopupForced]       = React.useState(false);
  const [forcingPopup, setForcingPopup]     = React.useState(false);

  const triggerCheckin = async () => {
    setCheckinLoading(true);
    setCheckinResult(null);
    setCheckinMsg(null);
    setPopupForced(false);
    try {
      const res = await fetch("/api/admin/weekly-checkin-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId || undefined }),
      });
      const data = await res.json();
      setCheckinResult(data);
      if (data.targetWeek) {
        setCheckinMsg(`Week ${data.targetWeek.week} — ${data.currentSubmitted ? "already submitted" : "not yet submitted"}`);
      }
    } catch {
      setCheckinMsg("Error calling API");
    } finally {
      setCheckinLoading(false);
    }
  };

  const forcePopup = async () => {
    if (forcingPopup || !checkinResult?.targetWeek) return;
    setForcingPopup(true);
    try {
      if (!selectedUserId) {
        // Own account — localStorage is fastest (no page reload needed)
        localStorage.setItem("pf-force-checkin", JSON.stringify(checkinResult.targetWeek));
      } else {
        // Another user — set server-side flag; modal fires on their next app load
        await fetch("/api/admin/weekly-checkin-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId, forceModal: true }),
        });
      }
      setPopupForced(true);
    } finally {
      setForcingPopup(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-saira text-sm font-bold uppercase tracking-[0.22em] text-zinc-300 mb-1">Dev Tools</h2>
        <p className="font-saira text-xs text-zinc-400">
          Admin-only overrides for testing features before they go live in production.
        </p>
      </div>

      {/* ── Weekly Check-in Test ── */}
      <div className="rounded-2xl border border-white/8 bg-surface-alt p-5">
        <p className="font-saira text-[11px] font-bold uppercase tracking-[0.22em] text-purple-400 mb-1">
          Weekly Check-in
        </p>
        <p className="font-saira text-xs text-zinc-300 mb-4">
          Forces the check-in window open regardless of day. Use this to test the modal and submission on any day of the week.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block font-saira text-[10px] text-zinc-300 mb-1.5 uppercase tracking-wider">
              Target user (optional — leave blank to use your own account)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-saira text-sm text-zinc-100 outline-none focus:border-purple-400/50"
            >
              <option value="">My account</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} ({u.role}{u.email ? ` · ${u.email}` : ""})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={triggerCheckin}
            disabled={checkinLoading}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-white transition"
          >
            {checkinLoading ? "Checking…" : "Check window status"}
          </button>

          {checkinMsg && (
            <p className={`font-saira text-xs ${checkinResult?.currentSubmitted ? "text-emerald-400" : "text-amber-400"}`}>
              {checkinMsg}
            </p>
          )}

          {/* Force popup — works for any user via server-side flag */}
          {!!checkinResult?.targetWeek && !checkinResult?.currentSubmitted && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={forcePopup}
                disabled={popupForced || forcingPopup}
                className="rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-4 py-2 font-saira text-[11px] font-bold uppercase tracking-[0.18em] text-white transition"
              >
                {forcingPopup ? "Setting…" : popupForced ? "✓ Modal queued" : selectedUserId ? "Force modal on their next load" : "Force modal on my next visit"}
              </button>
              {popupForced && (
                <p className="font-saira text-xs text-amber-400">
                  {selectedUserId ? "They'll see it next time they open the app." : "Reload any athlete page — modal appears once."}
                </p>
              )}
            </div>
          )}

          {checkinResult && (
            <div className="rounded-xl border border-white/5 bg-surface-section px-4 py-3">
              <p className="font-saira text-[10px] text-zinc-300 mb-2 uppercase tracking-wider">API response</p>
              <pre className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(checkinResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Roadmap Tab ───────────────────────────────────────────────────────────────

type RoadmapStatus = "todo" | "in_progress" | "done";
type RoadmapItem = { status: RoadmapStatus; text: string };
type RoadmapSection = { name: string; items: RoadmapItem[] };
type RoadmapData = {
  sections: RoadmapSection[];
  totals: { total: number; done: number; in_progress: number; todo: number };
  error?: string;
};

const NEXT_STATUS: Record<RoadmapStatus, RoadmapStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

function RoadmapTab() {
  const [data, setData] = React.useState<RoadmapData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [patching, setPatching] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/roadmap")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: RoadmapData) => setData(d))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function toggleItem(text: string, current: RoadmapStatus) {
    const next = NEXT_STATUS[current];

    // Optimistic update — instant feedback, no waiting for GitHub API
    setData((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.text === text ? { ...i, status: next } : i)),
      }));
      const totals = { total: 0, done: 0, in_progress: 0, todo: 0 };
      for (const s of sections) for (const i of s.items) {
        totals.total++;
        if (i.status === "done") totals.done++;
        else if (i.status === "in_progress") totals.in_progress++;
        else totals.todo++;
      }
      return { ...prev, sections, totals };
    });

    setPatching(text);
    try {
      const res = await fetch("/api/admin/roadmap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; cwd?: string; path?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Replace with authoritative server state
      const updated = await res.json() as RoadmapData;
      setData(updated);
    } catch (e) {
      // Revert optimistic update on failure
      setData((prev) => {
        if (!prev) return prev;
        const sections = prev.sections.map((s) => ({
          ...s,
          items: s.items.map((i) => (i.text === text ? { ...i, status: current } : i)),
        }));
        const totals = { total: 0, done: 0, in_progress: 0, todo: 0 };
        for (const s of sections) for (const i of s.items) {
          totals.total++;
          if (i.status === "done") totals.done++;
          else if (i.status === "in_progress") totals.in_progress++;
          else totals.todo++;
        }
        return { ...prev, sections, totals };
      });
      alert(`Failed to update: ${e}`);
    } finally {
      setPatching(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <p className="font-saira text-sm text-red-400">
        Failed to load roadmap: {err ?? "unknown error"}
      </p>
    );
  }

  if (data.error) {
    return (
      <p className="font-saira text-sm text-zinc-400">
        {data.error}. Create a <code className="text-purple-300">CLAUDE.md</code> file at the repo root with a <code className="text-purple-300">## Roadmap</code> section.
      </p>
    );
  }

  const { total, done, in_progress, todo } = data.totals;
  const donePct = total ? Math.round((done / total) * 100) : 0;
  const wipPct = total ? Math.round((in_progress / total) * 100) : 0;

  const statusGlyph = (s: RoadmapStatus) =>
    s === "done" ? "✓" : s === "in_progress" ? "◐" : "○";
  const statusColor = (s: RoadmapStatus) =>
    s === "done"
      ? "text-emerald-400"
      : s === "in_progress"
        ? "text-amber-300"
        : "text-zinc-500";

  const q = search.trim().toLowerCase();
  const visibleSections = q
    ? data.sections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.text.toLowerCase().includes(q)) }))
        .filter((s) => s.items.length > 0)
    : data.sections;
  const matchCount = q ? visibleSections.reduce((n, s) => n + s.items.length, 0) : null;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-2xl border border-white/8 bg-surface-panel/60 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-saira text-sm font-bold uppercase tracking-[0.22em] text-zinc-200">
            Overall progress
          </h3>
          <span className="font-saira text-xs text-zinc-400">
            {done}/{total} done · {in_progress} in progress · {todo} todo
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5 flex">
          <div className="h-full bg-emerald-400/80" style={{ width: `${donePct}%` }} />
          <div className="h-full bg-amber-300/70" style={{ width: `${wipPct}%` }} />
        </div>
        <p className="mt-3 font-saira text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          {donePct}% complete
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roadmap items…"
            className="w-full rounded-xl border border-white/8 bg-surface-section pl-9 pr-4 py-2 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            >
              ✕
            </button>
          )}
        </div>
        {matchCount !== null && (
          <span className="font-saira text-xs text-zinc-400">
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="grid gap-5 md:grid-cols-2">
        {visibleSections.length === 0 ? (
          <p className="font-saira text-sm text-zinc-500 col-span-2 py-4">No items match &ldquo;{search}&rdquo;.</p>
        ) : null}
        {visibleSections.map((section) => {
          const total = section.items.length;
          const doneCount = section.items.filter((i) => i.status === "done").length;
          const wipCount = section.items.filter((i) => i.status === "in_progress").length;
          return (
            <div
              key={section.name}
              className="rounded-2xl border border-white/8 bg-surface-panel/60 p-5"
            >
              <div className="flex items-baseline justify-between mb-4">
                <h4 className="font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                  {section.name}
                </h4>
                <span className="font-saira text-[10px] text-zinc-400">
                  {doneCount}/{total}
                  {wipCount > 0 && <span className="text-amber-300"> · {wipCount} wip</span>}
                </span>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, idx) => {
                  const isPending = patching === item.text;
                  return (
                    <li key={`${section.name}-${idx}`}>
                      <button
                        onClick={() => toggleItem(item.text, item.status)}
                        disabled={patching !== null}
                        title={`Click to mark as ${NEXT_STATUS[item.status].replace("_", " ")}`}
                        className="flex items-start gap-3 text-sm w-full text-left group rounded-lg px-2 py-1 -mx-2 hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-wait"
                      >
                        <span className={`mt-0.5 font-mono text-sm shrink-0 ${statusColor(item.status)} group-hover:scale-110 transition-transform`}>
                          {isPending ? "…" : statusGlyph(item.status)}
                        </span>
                        <span
                          className={
                            item.status === "done"
                              ? "text-zinc-500 line-through group-hover:text-zinc-300 group-hover:no-underline transition-colors"
                              : item.status === "in_progress"
                                ? "text-amber-100"
                                : "text-zinc-200"
                          }
                        >
                          {item.text}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {section.items.length === 0 && (
                  <li className="font-saira text-xs text-zinc-500">No items.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="font-saira text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Source: <code className="text-zinc-400">CLAUDE.md</code> · edit checklist items to update this view.
      </p>
    </div>
  );
}

// ── TOTP gate ─────────────────────────────────────────────────────────────────

function TotpGate({
  configured,
  onVerified,
}: {
  configured: boolean;
  onVerified: () => void;
}) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Setup screen state
  const [setupData, setSetupData] = React.useState<{
    secret: string;
    qrDataUrl: string;
    configured: boolean;
  } | null>(null);
  const [loadingSetup, setLoadingSetup] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // If not configured, fetch the setup QR code
  React.useEffect(() => {
    if (configured) return;
    setLoadingSetup(true);
    fetch("/api/admin/totp/setup")
      .then((r) => r.json())
      .then((d) => setSetupData(d))
      .catch(() => {})
      .finally(() => setLoadingSetup(false));
  }, [configured]);

  async function submit(code: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        onVerified();
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Incorrect code");
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDigitChange(idx: number, val: string) {
    // Support paste of full code into first box
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const next = val.split("");
      setDigits(next);
      inputRefs.current[5]?.focus();
      void submit(val);
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d !== "")) void submit(next.join(""));
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Setup screen (TOTP not yet configured) ────────────────────────────────
  if (!configured) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400 mb-1 text-center">
            Setup Required
          </p>
          <h1 className="font-saira text-2xl font-extrabold uppercase text-white mb-2 text-center">
            Enable 2FA
          </h1>
          <p className="font-saira text-xs text-zinc-400 text-center mb-6 leading-relaxed">
            Scan the QR code with <span className="text-white">Google Authenticator</span>,
            then copy the secret into your Vercel env vars as{" "}
            <code className="text-purple-300 bg-purple-500/10 px-1 rounded">TOTP_SECRET</code>.
            Also add a random string as{" "}
            <code className="text-purple-300 bg-purple-500/10 px-1 rounded">TOTP_SESSION_SECRET</code>.
            Redeploy to activate the gate.
          </p>

          {loadingSetup && (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
            </div>
          )}

          {setupData && (
            <div className="space-y-4">
              {/* QR code */}
              <div className="flex justify-center">
                <img
                  src={setupData.qrDataUrl}
                  alt="TOTP QR code"
                  className="rounded-xl"
                  width={200}
                  height={200}
                />
              </div>

              {/* Secret */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                <code className="font-mono text-xs text-purple-300 break-all flex-1 select-all">
                  {setupData.secret}
                </code>
                <button
                  onClick={copySecret}
                  className="font-saira text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition flex-shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <p className="font-saira text-[10px] text-zinc-500 text-center leading-relaxed">
                After adding the env vars and redeploying, return here to
                enter your 6-digit code.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Verification screen ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-6">
      <div className="w-full max-w-xs text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400 mb-1">
          Two-Factor Auth
        </p>
        <h1 className="font-saira text-2xl font-extrabold uppercase text-white mb-1">
          Verify Identity
        </h1>
        <p className="font-saira text-xs text-zinc-400 mb-7">
          Enter the 6-digit code from Google Authenticator
        </p>

        {/* 6-digit boxes */}
        <div className="flex justify-center gap-2 mb-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={i === 0 ? 6 : 1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={submitting}
              className={`w-10 h-12 rounded-xl border text-center font-mono text-lg font-bold bg-white/5 text-white transition
                focus:outline-none focus:ring-1 focus:ring-purple-400
                disabled:opacity-50
                ${error ? "border-red-500/60" : "border-white/10 focus:border-purple-500/60"}`}
            />
          ))}
        </div>

        {submitting && (
          <div className="flex justify-center mb-4">
            <div className="w-4 h-4 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        )}

        {error && (
          <p className="font-saira text-xs text-red-400 mb-4">{error}</p>
        )}

        <p className="font-saira text-[10px] text-zinc-600">
          Session valid for 4 hours after verification
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "coaches" | "results" | "broadcast" | "conversations" | "ai-insights" | "roadmap" | "devtools";

export default function MasterAdminPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  // null = still checking, false = gate shown, true = verified
  const [totpVerified, setTotpVerified] = React.useState<boolean | null>(null);
  const [totpConfigured, setTotpConfigured] = React.useState(false);
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>("overview");
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Derived
  const coaches         = users.filter((u) => u.role === "coach");
  const pendingCoaches  = coaches.filter((c) => c.coach_status === "pending");
  const rejectedCoaches = coaches.filter((c) => c.coach_status === "rejected");

  // ── Auth check ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/admin/verify")
      .then((r) => r.json())
      .then((d: { isAdmin: boolean; email: string | null }) => {
        setIsAdmin(d.isAdmin);
        setSessionEmail(d.email);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  // ── TOTP status (runs after admin identity is confirmed) ────────────────────
  React.useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/totp/status")
      .then((r) => r.json())
      .then((d: { configured: boolean; verified: boolean }) => {
        setTotpConfigured(d.configured);
        // If TOTP isn't configured yet, skip the gate so the admin can still
        // reach the setup screen and add the env var.
        setTotpVerified(d.configured ? d.verified : true);
      })
      .catch(() => setTotpVerified(true)); // fail-open only if the endpoint errors
  }, [isAdmin]);

  // ── Load users ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isAdmin || !totpVerified) return;
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: UserRow[]) => setUsers(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [isAdmin, totpVerified]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function patchUser(userId: string, patch: Record<string, unknown>) {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
      );
    } catch (e) {
      alert(`Save failed: ${e}`);
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }


  function handleRelinkCoach(athleteId: string, coachId: string | null) {
    patchUser(athleteId, { coach_id: coachId });
    const coachName = coachId
      ? (users.find((u) => u.id === coachId)?.display_name ?? null)
      : null;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === athleteId ? { ...u, coach_id: coachId, coach_name: coachName } : u,
      ),
    );
  }

  async function handleDeleteUser(userId: string) {
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  }

  // ── Render gates ─────────────────────────────────────────────────────────────

  if (isAdmin === null || (isAdmin && totpVerified === null)) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── TOTP gate ───────────────────────────────────────────────────────────────
  if (isAdmin && totpVerified === false) {
    return (
      <TotpGate
        configured={totpConfigured}
        onVerified={() => setTotpVerified(true)}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-red-400 mb-3">
            Access Denied
          </p>
          <h1 className="font-saira text-2xl font-extrabold uppercase text-white mb-2">
            Not Authorized
          </h1>
          <p className="font-saira text-sm text-zinc-300 mb-6">
            This dashboard is restricted to the PowerFlow admin account.
            {sessionEmail && (
              <span className="block mt-1 font-mono text-xs text-zinc-400">
                Signed in as: {sessionEmail}
              </span>
            )}
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-full border border-purple-500/40 bg-purple-500/10 px-6 py-2.5 font-saira text-xs font-bold uppercase tracking-[0.2em] text-purple-300 hover:bg-purple-500/20 transition"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    );
  }

  // ── Main admin layout ────────────────────────────────────────────────────────

  const NAV_TABS: [Tab, string, string][] = [
    ["overview",       "Overview",        "◎"],
    ["users",          `Users (${users.length})`, "◻"],
    ["coaches",        pendingCoaches.length > 0 ? `Coaches (${pendingCoaches.length} pending)` : "Coaches", "⇄"],
    ["results",        "Test Results",    "✦"],
    ["broadcast",      "Broadcast",       "✉"],
    ["conversations",  "Conversations",   "💬"],
    ["ai-insights",    "AI Insights",     "✦"],
    ["roadmap",        "Roadmap",         "▸"],
    ["devtools",       "Dev Tools",       "⚙"],
  ];

  return (
    <div className="flex h-screen bg-surface-base text-white overflow-hidden">

      {/* ── Left sidebar ── */}
      <aside className="w-56 flex-shrink-0 border-r border-white/6 flex flex-col h-full bg-surface-panel/90">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400 mb-0.5">
            PowerFlow
          </p>
          <h1 className="font-saira text-lg font-extrabold uppercase tracking-tight text-white leading-none">
            Master Admin
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_TABS.map(([tab, label, icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl font-saira text-xs uppercase tracking-[0.14em] transition ${
                activeTab === tab
                  ? "bg-purple-500/15 text-purple-300 font-semibold"
                  : "text-zinc-300 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <span className="text-sm leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Footer: admin email + back link */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/5 space-y-2">
          <p className="font-saira text-[10px] text-zinc-400 truncate">{sessionEmail}</p>
          <Link
            href="/you"
            className="font-saira text-xs text-zinc-300 hover:text-purple-300 transition"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Tab title bar */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-surface-base/95 backdrop-blur-md px-8 py-4">
          <h2 className="font-saira text-sm font-bold uppercase tracking-[0.22em] text-white">
            {NAV_TABS.find(([t]) => t === activeTab)?.[1] ?? ""}
          </h2>
        </div>

        <div className="px-8 py-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="font-saira text-sm text-red-400">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && <OverviewTab users={users} />}
              {activeTab === "users" && (
                <UsersTab
                  users={users}
                  coaches={coaches}
                  sessionEmail={sessionEmail}
                  onRelinkCoach={handleRelinkCoach}
                  onPatchUser={patchUser}
                  onDeleteUser={handleDeleteUser}
                  saving={saving}
                />
              )}
              {activeTab === "coaches" && (
                <CoachLinksTab
                  users={users}
                  coaches={coaches}
                  onRelinkCoach={handleRelinkCoach}
                  onPatchUser={patchUser}
                  saving={saving}
                />
              )}
              {activeTab === "results" && <ResultsTab />}
              {activeTab === "broadcast" && <BroadcastTab users={users} />}
              {activeTab === "conversations" && <ConversationsTab />}
              {activeTab === "ai-insights" && <AiInsightsTab users={users} />}
              {activeTab === "roadmap" && <RoadmapTab />}
              {activeTab === "devtools" && <DevToolsTab users={users} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
