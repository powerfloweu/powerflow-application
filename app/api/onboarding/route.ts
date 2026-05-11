/**
 * POST /api/onboarding — submits all onboarding fields at once and marks the
 * athlete's profile as onboarding_complete = true.
 *
 * This endpoint is separate from PATCH /api/me because:
 *  1. It sets coach_id, which is not normally user-patchable via /api/me.
 *  2. It atomically marks onboarding_complete in the same write.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbPatch, dbInsert, dbSelect } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

interface OnboardingBody {
  // Step 1 — About you
  display_name?: string;
  instagram?: string | null;
  gender?: "male" | "female" | null;
  // Step 2 — Powerlifting profile
  years_powerlifting?: string | null;
  federation?: string | null;
  bodyweight_kg?: number | null;
  weight_category?: string | null;
  meet_date?: string | null;
  training_days_per_week?: number | null;
  // Step 3 — Lifts
  squat_current_kg?: number | null;
  squat_goal_kg?: number | null;
  bench_current_kg?: number | null;
  bench_goal_kg?: number | null;
  deadlift_current_kg?: number | null;
  deadlift_goal_kg?: number | null;
  // Step 4 — Mindset
  main_barrier?: string | null;
  confidence_break?: string | null;
  overthinking_focus?: string | null;
  previous_mental_work?: string | null;
  self_confidence_reg?: number | null;
  self_focus_fatigue?: number | null;
  self_handling_pressure?: number | null;
  self_competition_anxiety?: number | null;
  self_emotional_recovery?: number | null;
  // Step 5 — Goals
  mental_goals?: string[];
  expectations?: string | null;
  previous_tools?: string | null;
  anything_else?: string | null;
  // Step 6 — Coach
  coach_id?: string | null;
}

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: OnboardingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Build the patch payload, normalising empty strings to null
  const patch: Record<string, unknown> = {
    onboarding_complete: true,
  };

  const textFields: Array<keyof OnboardingBody> = [
    "display_name", "instagram", "gender", "weight_category", "meet_date",
    "years_powerlifting", "federation",
    "main_barrier", "confidence_break", "overthinking_focus", "previous_mental_work",
    "expectations", "previous_tools", "anything_else",
  ];
  for (const key of textFields) {
    if (key in body) {
      const val = body[key];
      patch[key] = val === "" ? null : (val ?? null);
    }
  }

  // Trim display_name
  if (typeof patch.display_name === "string") {
    patch.display_name = (patch.display_name as string).trim() || null;
  }
  // Trim instagram (strip leading @)
  if (typeof patch.instagram === "string") {
    patch.instagram = (patch.instagram as string).trim().replace(/^@/, "") || null;
  }

  const numericFields: Array<keyof OnboardingBody> = [
    "bodyweight_kg",
    "squat_current_kg", "squat_goal_kg",
    "bench_current_kg", "bench_goal_kg",
    "deadlift_current_kg", "deadlift_goal_kg",
    "training_days_per_week",
  ];
  for (const key of numericFields) {
    if (key in body) {
      const val = body[key];
      if (val === null || val === undefined || val === (0 as unknown)) {
        patch[key] = null;
      } else {
        patch[key] = Number(val) > 0 ? Number(val) : null;
      }
    }
  }

  // Self-assessment scales (1-10, integer)
  const scaleFields: Array<keyof OnboardingBody> = [
    "self_confidence_reg", "self_focus_fatigue", "self_handling_pressure",
    "self_competition_anxiety", "self_emotional_recovery",
  ];
  for (const key of scaleFields) {
    if (key in body) {
      const val = body[key];
      if (val === null || val === undefined) {
        patch[key] = null;
      } else {
        const n = Number(val);
        patch[key] = n >= 1 && n <= 10 ? Math.round(n) : null;
      }
    }
  }

  // mental_goals — keep as-is (array of strings)
  if ("mental_goals" in body) {
    patch.mental_goals = Array.isArray(body.mental_goals) ? body.mental_goals : [];
  }

  // coach_id — allow setting (including null = "no coach")
  // Must refer to an actual coach if non-null. Self-links rejected.
  if ("coach_id" in body) {
    const cid = body.coach_id ?? null;
    if (cid !== null) {
      if (cid === user.id) {
        return NextResponse.json(
          { error: "Cannot set yourself as your coach." },
          { status: 400 },
        );
      }
      const coachRows = await dbSelect<{ id: string }>("profiles", {
        id: `eq.${cid}`,
        role: "eq.coach",
        select: "id",
      });
      if (!coachRows.length) {
        return NextResponse.json(
          { error: "Selected coach does not exist." },
          { status: 400 },
        );
      }
    }
    patch.coach_id = cid;
  }

  // Check whether the profile row exists
  const existing = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    select: "id",
  });

  let ok: boolean;
  if (existing.length > 0) {
    ok = await dbPatch("profiles", { id: user.id }, patch);
  } else {
    // Profile row was never created — insert with required defaults
    const inserted = await dbInsert("profiles", {
      id: user.id,
      display_name:
        (patch.display_name as string | null) ??
        user.user_metadata?.full_name ??
        user.email ??
        "Athlete",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "athlete",
      ...patch,
    });
    ok = !!inserted;
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Database write failed — check server logs or run missing migrations." },
      { status: 500 },
    );
  }

  // Notify admin that a new athlete has completed onboarding
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  if (adminEmail) {
    const athleteName  = (patch.display_name as string | null) ?? user.user_metadata?.full_name ?? "Unknown";
    const athleteEmail = user.email ?? "no email";
    const instagram    = (patch.instagram as string | null);
    const coachId      = (patch.coach_id as string | null);
    const goals        = Array.isArray(patch.mental_goals) && patch.mental_goals.length
      ? (patch.mental_goals as string[]).join(", ")
      : null;

    sendEmail({
      to:      adminEmail,
      subject: `🏋️ New athlete onboarded: ${athleteName}`,
      html: `
        <p>A new athlete just completed onboarding on PowerFlow.</p>
        <table cellpadding="6" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#888;padding-right:12px">Name</td><td><strong>${athleteName}</strong></td></tr>
          <tr><td style="color:#888">Email</td><td>${athleteEmail}</td></tr>
          ${instagram ? `<tr><td style="color:#888">Instagram</td><td>@${instagram}</td></tr>` : ""}
          ${coachId   ? `<tr><td style="color:#888">Linked coach</td><td>${coachId}</td></tr>` : "<tr><td style='color:#888'>Coach</td><td>No coach linked</td></tr>"}
          ${goals     ? `<tr><td style="color:#888">Mental goals</td><td>${goals}</td></tr>` : ""}
        </table>
        <p style="margin-top:20px">
          <a href="https://app.power-flow.eu/admin/master" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Go to Master Admin → Users
          </a>
        </p>
      `,
      text: `New athlete onboarded: ${athleteName} (${athleteEmail}).`,
    }).catch(() => {}); // fire-and-forget
  }

  return NextResponse.json({ ok: true });
}
