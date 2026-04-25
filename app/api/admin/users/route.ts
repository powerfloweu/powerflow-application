/**
 * GET  /api/admin/users — Returns all profiles enriched with auth emails + activity stats.
 * PATCH /api/admin/users — Admin-patch a profile field (course_access, coach_id).
 *
 * Security: both endpoints require the Supabase session email to match ADMIN_EMAIL env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// ── Supabase credentials (server-only) ────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Verify the incoming request session is the admin email. */
async function verifyAdmin(): Promise<boolean> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user && (user.email ?? "").toLowerCase() === adminEmail;
}

/** Fetch all auth users from Supabase's GoTrue admin endpoint. */
async function fetchAuthEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!SUPABASE_URL || !SERVICE_KEY) return map;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return map;
    const data = (await res.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    for (const u of data.users ?? []) {
      if (u.id && u.email) map.set(u.id, u.email);
    }
  } catch {
    // best-effort
  }
  return map;
}

// ── Profile SELECT columns ────────────────────────────────────────────────────

const PROFILE_SELECT = [
  "id", "display_name", "avatar_url", "role",
  "coach_id", "coach_code", "meet_date",
  "course_access", "onboarding_complete", "created_at",
  "gender", "bodyweight_kg", "weight_category",
  "squat_current_kg", "squat_goal_kg",
  "bench_current_kg", "bench_goal_kg",
  "deadlift_current_kg", "deadlift_goal_kg",
  "mental_goals", "training_days_per_week",
  "instagram", "years_powerlifting", "federation",
  "main_barrier", "confidence_break", "overthinking_focus", "previous_mental_work",
  "self_confidence_reg", "self_focus_fatigue", "self_handling_pressure",
  "self_competition_anxiety", "self_emotional_recovery",
  "expectations", "previous_tools", "anything_else",
].join(",");

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Date 7 days ago in UTC (ISO string truncated to date for training_entries)
  const now = Date.now();
  const since7dISO = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since7dDate = since7dISO.slice(0, 10); // YYYY-MM-DD for training_entries

  // Fetch everything in parallel
  const [profiles, emailMap, recentJournals, recentCheckins] = await Promise.all([
    dbSelect<Record<string, unknown>>("profiles", {
      select: PROFILE_SELECT,
      order: "created_at.asc",
    }),
    fetchAuthEmails(),
    dbSelect<{ user_id: string; created_at: string }>("journal_entries", {
      created_at: `gte.${since7dISO}`,
      select: "user_id,created_at",
      limit: "2000",
    }),
    dbSelect<{ user_id: string; entry_date: string }>("training_entries", {
      entry_date: `gte.${since7dDate}`,
      select: "user_id,entry_date",
      limit: "2000",
    }),
  ]);

  // Build coach name map (id → display_name) for fast lookup
  const coachNameMap = new Map<string, string>();
  for (const p of profiles) {
    if (p.role === "coach") {
      coachNameMap.set(p.id as string, (p.display_name as string) ?? "Coach");
    }
  }

  // Aggregate journal counts + last-active per user
  const journalCounts = new Map<string, number>();
  const lastJournalAt = new Map<string, string>();
  for (const e of recentJournals) {
    journalCounts.set(e.user_id, (journalCounts.get(e.user_id) ?? 0) + 1);
    const prev = lastJournalAt.get(e.user_id);
    if (!prev || e.created_at > prev) lastJournalAt.set(e.user_id, e.created_at);
  }

  // Aggregate training (check-in) counts + last-active per user
  const checkinCounts = new Map<string, number>();
  const lastCheckinAt = new Map<string, string>();
  for (const e of recentCheckins) {
    checkinCounts.set(e.user_id, (checkinCounts.get(e.user_id) ?? 0) + 1);
    const prev = lastCheckinAt.get(e.user_id);
    if (!prev || e.entry_date > prev) lastCheckinAt.set(e.user_id, e.entry_date);
  }

  // Merge into enriched user rows
  const result = profiles.map((p) => {
    const id = p.id as string;
    const journalCount = journalCounts.get(id) ?? 0;
    const checkinCount = checkinCounts.get(id) ?? 0;

    // last_active: latest of last journal or last check-in
    const lj = lastJournalAt.get(id) ?? null;
    const lc = lastCheckinAt.get(id) ?? null;
    let lastActive: string | null = null;
    if (lj && lc) lastActive = lj > lc ? lj : lc;
    else lastActive = lj ?? lc;

    // Activity status (athletes only; coaches marked "n/a" conceptually via role)
    let activity_status: "active" | "monitor" | "dormant";
    if (journalCount >= 3 || checkinCount >= 3) activity_status = "active";
    else if (journalCount >= 1 || checkinCount >= 1) activity_status = "monitor";
    else activity_status = "dormant";

    return {
      ...p,
      email: emailMap.get(id) ?? null,
      coach_name: p.coach_id
        ? (coachNameMap.get(p.coach_id as string) ?? null)
        : null,
      mental_goals: (p.mental_goals as string[] | null) ?? [],
      journal_count_7d: journalCount,
      checkin_count_7d: checkinCount,
      last_active: lastActive,
      activity_status,
    };
  });

  return NextResponse.json(result);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const ADMIN_PATCHABLE = ["course_access", "coach_id"] as const;
type AdminPatchableKey = (typeof ADMIN_PATCHABLE)[number];

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, ...fields } = body;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const key of ADMIN_PATCHABLE as readonly AdminPatchableKey[]) {
    if (key in fields) {
      // Allow explicit null (to clear coach_id)
      patch[key] = fields[key] === undefined ? null : fields[key];
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const ok = await dbPatch("profiles", { id: userId }, patch);
  if (!ok) {
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
