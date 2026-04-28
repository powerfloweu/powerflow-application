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
  email: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_name: string | null;
  coach_code: string | null;
  plan_tier: "opener" | "second" | "pr" | null;
  course_access: boolean;
  test_access: boolean;
  ai_access: boolean;
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
    <div className="rounded-xl border border-white/5 bg-[#17131F] px-5 py-4 flex flex-col gap-1 min-w-[110px]">
      <span className={`font-saira text-2xl font-extrabold ${color}`}>{value}</span>
      <span className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
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

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
        {label}
      </p>
      <p className="font-saira text-xs text-zinc-300 leading-relaxed">{String(value)}</p>
    </div>
  );
}

function ScorePip({ value }: { value: number | null }) {
  if (!value) return <span className="text-zinc-600">—</span>;
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
      <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-16">
        {label}
      </span>
      <span className="font-saira text-xs text-zinc-300">
        {current ? `${current} kg` : "—"}
      </span>
      {goal && (
        <span className="font-saira text-[10px] text-zinc-500">→ {goal} kg goal</span>
      )}
    </div>
  );
}

// ── Expanded profile viewer ────────────────────────────────────────────────────

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
    <div className="border-t border-white/5 bg-[#0e0b15] px-5 py-5 space-y-5">
      {/* Personal */}
      <div>
        <p className="font-saira text-[9px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-2">
          Personal
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Email" value={user.email} />
          <Field label="Instagram" value={user.instagram ? `@${user.instagram}` : null} />
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
                <p className="font-saira text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
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
    <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5">
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
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5">
        <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400 mb-4">
          Coaches
        </p>
        {coaches.length === 0 ? (
          <p className="font-saira text-xs text-zinc-500">No coaches yet.</p>
        ) : (
          <div className="space-y-3">
            {coaches.map((coach) => {
              const myAthletes = athletes.filter((a) => a.coach_id === coach.id);
              return (
                <div key={coach.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-saira text-sm text-white">{coach.display_name}</p>
                    <p className="font-saira text-[10px] text-zinc-500">{coach.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-saira text-sm font-bold text-cyan-300">
                      {myAthletes.length}
                    </p>
                    <p className="font-saira text-[10px] text-zinc-500">athletes</p>
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
                  <p className="font-saira text-[10px] text-zinc-500">
                    {u.coach_name ? `Coach: ${u.coach_name}` : "No coach"}
                    {u.meet_date ? ` · Meet: ${u.meet_date}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-saira text-[10px] text-zinc-500">
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
                  <p className="font-saira text-[10px] text-zinc-500">
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
          className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-[#17131F] px-4 py-2 font-saira text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
        />
        <div className="flex rounded-xl border border-white/10 bg-[#17131F] overflow-hidden">
          {(["all", "athlete", "coach"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 font-saira text-xs font-semibold uppercase tracking-wider transition
                ${roleFilter === r ? "bg-purple-500/20 text-purple-300" : "text-zinc-500 hover:text-zinc-300"}`}
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
      <div className="rounded-2xl border border-white/5 bg-[#17131F] overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-2 px-5 py-3 border-b border-white/5">
          {["Name", "Email", "Role", "Coach / Athletes", "Access", "Activity (7d)", ""].map((h) => (
            <span
              key={h}
              className="font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <p className="font-saira text-sm text-zinc-500 text-center py-10">No users match.</p>
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
                      <p className="font-saira text-[10px] text-zinc-600">@{user.instagram}</p>
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
                    className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white hover:border-white/30 transition disabled:opacity-40"
                  >
                    {user.role === "athlete" ? "→ Coach" : "→ Athlete"}
                  </button>
                </div>

                {/* Coach / Athletes */}
                <div className="hidden sm:block">
                  {user.role === "athlete" ? (
                    <p className="font-saira text-xs text-zinc-400">
                      {user.coach_name ?? <span className="text-zinc-600">No coach</span>}
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
                        onChange={(e) => onPatchUser(user.id, { plan_tier: e.target.value })}
                        className="rounded border border-white/10 bg-[#0e0a16] px-1.5 py-0.5 font-saira text-[9px] text-purple-300 uppercase tracking-wider disabled:opacity-40 cursor-pointer focus:outline-none focus:border-purple-500/50"
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
                          <span className="font-saira text-[9px] text-zinc-500 w-10">{label}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <span className="font-saira text-[10px] text-zinc-600">—</span>
                  )}
                </div>

                {/* Activity */}
                <div className="hidden sm:block">
                  <p className="font-saira text-xs text-zinc-400">
                    {user.journal_count_7d}j · {user.checkin_count_7d}c
                  </p>
                  {user.last_active && (
                    <p className="font-saira text-[10px] text-zinc-600">
                      {new Date(user.last_active).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>

                {/* Actions: expand + delete */}
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user.email !== sessionEmail && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-zinc-700 hover:text-rose-400 transition text-xs"
                      title="Delete user"
                    >
                      ✕
                    </button>
                  )}
                  <span
                    className="font-saira text-zinc-500 text-xs cursor-pointer"
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
                <span className="font-saira text-[10px] text-zinc-500">
                  {user.journal_count_7d}j · {user.checkin_count_7d}c
                </span>
                {user.role === "athlete" && (
                  <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    {/* Mobile tier selector */}
                    <select
                      value={user.plan_tier ?? "opener"}
                      disabled={saving[user.id] ?? false}
                      onChange={(e) => onPatchUser(user.id, { plan_tier: e.target.value })}
                      className="rounded border border-white/10 bg-[#0e0a16] px-2 py-1 font-saira text-[10px] text-purple-300 uppercase tracking-wider disabled:opacity-40 cursor-pointer focus:outline-none"
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
                        <span className="font-saira text-[10px] text-zinc-500">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded profile */}
              {expandedId === user.id && (
                <div>
                  {/* Quick coach reassign for athletes */}
                  {user.role === "athlete" && coaches.length > 0 && (
                    <div
                      className="flex items-center gap-3 px-5 py-3 border-t border-white/5 bg-[#0e0b15]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-saira text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Coach:
                      </span>
                      <select
                        value={user.coach_id ?? ""}
                        disabled={saving[user.id] ?? false}
                        onChange={(e) =>
                          onRelinkCoach(user.id, e.target.value || null)
                        }
                        className="rounded-lg border border-white/10 bg-[#17131F] px-3 py-1.5 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="">No coach</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.display_name}
                          </option>
                        ))}
                      </select>
                      {saving[user.id] && (
                        <span className="font-saira text-[10px] text-zinc-500">Saving…</span>
                      )}
                    </div>
                  )}
                  <ExpandedProfile user={user} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="font-saira text-[10px] text-zinc-600 text-right">
        {filtered.length} of {users.length} users shown
      </p>
    </div>
  );
}

// ── Coach Links Tab ───────────────────────────────────────────────────────────

function CoachLinksTab({
  users,
  coaches,
  onRelinkCoach,
  saving,
}: {
  users: UserRow[];
  coaches: UserRow[];
  onRelinkCoach: (athleteId: string, coachId: string | null) => void;
  saving: Record<string, boolean>;
}) {
  const athletes = users.filter((u) => u.role === "athlete");
  const unlinked = athletes.filter((a) => !a.coach_id);
  const [pendingCoach, setPendingCoach] = React.useState<Record<string, string>>({});

  return (
    <div className="space-y-5">
      {coaches.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-6 text-center">
          <p className="font-saira text-sm text-zinc-500">No coaches in the system yet.</p>
        </div>
      )}

      {coaches.map((coach) => {
        const myAthletes = athletes.filter((a) => a.coach_id === coach.id);
        return (
          <div
            key={coach.id}
            className="rounded-2xl border border-white/5 bg-[#17131F] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-cyan-500/5">
              <div>
                <p className="font-saira text-sm font-bold text-cyan-300">
                  {coach.display_name}
                </p>
                <p className="font-saira text-[10px] text-zinc-500">
                  {coach.email}
                  {coach.coach_code && (
                    <span className="ml-2 font-mono text-zinc-600">
                      Code: {coach.coach_code}
                    </span>
                  )}
                </p>
              </div>
              <span className="font-saira text-xs text-zinc-500">
                {myAthletes.length} athlete{myAthletes.length !== 1 ? "s" : ""}
              </span>
            </div>

            {myAthletes.length === 0 ? (
              <p className="font-saira text-xs text-zinc-600 px-5 py-4">
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
                      <p className="font-saira text-[10px] text-zinc-500">
                        {athlete.email} · {athlete.journal_count_7d}j · {athlete.checkin_count_7d}c
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={athlete.coach_id ?? ""}
                      disabled={saving[athlete.id] ?? false}
                      onChange={(e) => onRelinkCoach(athlete.id, e.target.value || null)}
                      className="rounded-lg border border-white/10 bg-[#0e0b15] px-2.5 py-1 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">Unlink</option>
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name}
                        </option>
                      ))}
                    </select>
                    {saving[athlete.id] && (
                      <span className="font-saira text-[10px] text-zinc-500">Saving…</span>
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
                <p className="font-saira text-[10px] text-zinc-500">{athlete.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pendingCoach[athlete.id] ?? ""}
                  onChange={(e) =>
                    setPendingCoach((prev) => ({ ...prev, [athlete.id]: e.target.value }))
                  }
                  className="rounded-lg border border-white/10 bg-[#17131F] px-2.5 py-1 font-saira text-xs text-white focus:outline-none focus:border-purple-500/50"
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
    <span className="inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold bg-zinc-500/15 text-zinc-500">
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
                : "border-white/10 text-zinc-500 hover:text-zinc-300"}`}
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
        <div className="rounded-2xl border border-white/5 bg-[#17131F] overflow-hidden">
          {/* Common header */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400">
              {sub.toUpperCase()} Results
            </p>
            <span className="font-saira text-[10px] text-zinc-500">{counts[sub]} total</span>
          </div>

          <div className="overflow-x-auto">
            {sub === "sat" && (
              <table className="w-full text-left text-xs font-saira">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Name", "Email", "Submitted", "Paid", "Score", "Valid", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sat.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
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
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white hover:border-white/30 transition"
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
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">{h}</th>
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
                        <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                          {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                        <td className="px-4 py-2.5 font-bold text-white">{r.total_score}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{top[0]} ({top[1]})</td>
                        <td className="px-4 py-2.5">
                          {!r.paid && (
                            <button
                              onClick={() => handleUnlock("acsi_results", r.id)}
                              className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white hover:border-white/30 transition"
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
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.csai.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
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
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white hover:border-white/30 transition"
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
                      <th key={h} className="px-4 py-2.5 font-saira text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.das.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                      <td className="px-4 py-2.5 text-white">{r.first_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400 truncate max-w-[160px]">{r.email}</td>
                      <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                        {new Date(r.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5"><PaidChip paid={r.paid} /></td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.total_score}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-saira text-[9px] font-bold ${r.depression_prone ? "bg-rose-500/15 text-rose-400" : "bg-zinc-500/15 text-zinc-500"}`}>
                          {r.depression_prone ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {!r.paid && (
                          <button
                            onClick={() => handleUnlock("das_results", r.id)}
                            className="border border-white/10 rounded px-2 py-0.5 font-saira text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white hover:border-white/30 transition"
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
    <p className="font-saira text-sm text-zinc-600 py-4">No conversations yet.</p>
  );

  return (
    <div className="space-y-3 max-w-3xl">
      {stats.map((stat) => (
        <div key={stat.userId} className="rounded-2xl border border-white/5 bg-[#17131F] overflow-hidden">

          {/* Header row */}
          <button
            onClick={() => toggleThread(stat.userId)}
            className="w-full text-left px-4 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-saira text-sm font-semibold text-white">{stat.displayName}</p>
                <span className="font-saira text-[9px] uppercase tracking-wider border border-white/10 rounded-full px-1.5 py-0.5 text-zinc-500">
                  {stat.role}
                </span>
              </div>
              <p className="font-saira text-xs text-zinc-500 mt-0.5">
                {stat.messageCount} messages · {stat.sessionCount} session{stat.sessionCount !== 1 ? "s" : ""} · Last: {new Date(stat.lastMessageAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <span className="font-saira text-xs text-zinc-600 flex-shrink-0">
              {selectedId === stat.userId ? "▲ hide" : "▼ thread"}
            </span>
          </button>

          {/* Session summaries */}
          {stat.summaries.length > 0 && (
            <div className="border-t border-white/5 px-4 py-3 space-y-2">
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Session summaries
              </p>
              {stat.summaries.map((s) => (
                <div key={s.session_date} className="rounded-xl border border-white/5 bg-[#0D0B14] px-3 py-2.5">
                  <p className="font-saira text-[10px] text-purple-400 mb-1">{s.session_date} · {s.message_count} msgs</p>
                  <p className="font-saira text-xs text-zinc-300 leading-relaxed">{s.summary}</p>
                  {s.techniques_used?.length > 0 && (
                    <p className="font-saira text-[10px] text-zinc-600 mt-1">
                      Techniques: {s.techniques_used.join(", ")}
                    </p>
                  )}
                  {s.resonated && (
                    <p className="font-saira text-[10px] text-zinc-500 mt-1 italic">{s.resonated}</p>
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
                <p className="font-saira text-xs text-zinc-600 text-center py-2">No messages.</p>
              ) : thread.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl font-saira text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-500/10 border border-purple-500/15 text-zinc-300"
                      : "bg-white/[0.03] border border-white/5 text-zinc-400"
                  }`}>
                    <p>{msg.content.length > 600 ? msg.content.slice(0, 600) + "…" : msg.content}</p>
                    <p className="font-saira text-[9px] text-zinc-700 mt-1">
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
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 space-y-4">
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
                  : "border-white/10 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r === "all" ? "Everyone" : r === "athlete" ? "Athletes" : "Coaches"}
              <span className="ml-1.5 text-zinc-600">({emailMap[r].length})</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-4 py-2.5 font-saira text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
        />
        <div>
          <textarea
            placeholder={"Message body…\n\nTip: add links with [Link text](/path) — e.g. [Open the guide](/guide)"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-4 py-2.5 font-saira text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <p className="font-saira text-[10px] text-zinc-700 mt-1">
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
          <p className="font-saira text-[10px] text-zinc-600">
            {previewEmails.length} recipient{previewEmails.length !== 1 ? "s" : ""} · shown on next login
          </p>
        </div>
      </div>

      {/* ── Published broadcasts ─────────────────────────────────────────────── */}
      {broadcasts.length > 0 && (
        <div className="space-y-2">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            Published
          </p>
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 flex items-start gap-4 ${
                b.active ? "border-purple-500/20 bg-purple-500/5" : "border-white/5 bg-[#17131F] opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-saira text-sm font-semibold text-white truncate">{b.title}</p>
                  <span className="flex-shrink-0 font-saira text-[9px] uppercase tracking-[0.18em] text-zinc-500 border border-white/10 rounded-full px-1.5 py-0.5">
                    {b.target_role}
                  </span>
                </div>
                <p className="font-saira text-xs text-zinc-500 truncate">{b.body.slice(0, 80)}{b.body.length > 80 ? "…" : ""}</p>
                <p className="font-saira text-[10px] text-zinc-700 mt-1">
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

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "coaches" | "results" | "broadcast" | "conversations";

export default function MasterAdminPage() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<Tab>("overview");
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Derived
  const coaches = users.filter((u) => u.role === "coach");

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

  // ── Load users ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: UserRow[]) => setUsers(data))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

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

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-saira text-[10px] font-bold uppercase tracking-[0.3em] text-red-400 mb-3">
            Access Denied
          </p>
          <h1 className="font-saira text-2xl font-extrabold uppercase text-white mb-2">
            Not Authorized
          </h1>
          <p className="font-saira text-sm text-zinc-500 mb-6">
            This dashboard is restricted to the PowerFlow admin account.
            {sessionEmail && (
              <span className="block mt-1 font-mono text-xs text-zinc-600">
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
    ["coaches",        "Coach Links",     "⇄"],
    ["results",        "Test Results",    "✦"],
    ["broadcast",      "Broadcast",       "✉"],
    ["conversations",  "Conversations",   "💬"],
  ];

  return (
    <div className="flex h-screen bg-[#050608] text-white overflow-hidden">

      {/* ── Left sidebar ── */}
      <aside className="w-56 flex-shrink-0 border-r border-white/6 flex flex-col h-full bg-[#0D0B14]/90">

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
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <span className="text-sm leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Footer: admin email + back link */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-white/5 space-y-2">
          <p className="font-saira text-[10px] text-zinc-600 truncate">{sessionEmail}</p>
          <Link
            href="/you"
            className="font-saira text-xs text-zinc-500 hover:text-purple-300 transition"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Tab title bar */}
        <div className="sticky top-0 z-10 border-b border-white/5 bg-[#050608]/95 backdrop-blur-md px-8 py-4">
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
                  saving={saving}
                />
              )}
              {activeTab === "results" && <ResultsTab />}
              {activeTab === "broadcast" && <BroadcastTab users={users} />}
              {activeTab === "conversations" && <ConversationsTab />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
