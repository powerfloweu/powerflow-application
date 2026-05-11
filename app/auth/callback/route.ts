import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  const cookieStore = await cookies();

  // Read one-time cookies set before OAuth redirect
  const role     = (request.cookies.get("pf_auth_role")?.value ?? "athlete") as "athlete" | "coach";
  const nextRaw  = request.cookies.get("pf_auth_next")?.value ?? "";
  const joinCode = request.cookies.get("pf_join_code")?.value
    ? decodeURIComponent(request.cookies.get("pf_join_code")!.value)
    : null;

  const next = nextRaw ? decodeURIComponent(nextRaw) : role === "coach" ? "/coach" : "/today";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange code for session
  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError || !data.user) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_failed`);
  }

  const user = data.user;

  // Upsert profile (no-op if already exists); returns the role if brand-new, null if existing
  const newProfileRole = await ensureProfile(user.id, role, {
    display_name: user.user_metadata?.full_name ?? user.email ?? "User",
    avatar_url:   user.user_metadata?.avatar_url ?? null,
  });
  const isNewCoach   = newProfileRole === "coach";
  const isNewAthlete = newProfileRole === "athlete";

  // Notify admin on every new sign-up
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim();
  if (adminEmail && (isNewCoach || isNewAthlete)) {
    const userName  = user.user_metadata?.full_name ?? "Unknown";
    const userEmail = user.email ?? "no email";
    if (isNewCoach) {
      sendEmail({
        to:      adminEmail,
        subject: `🆕 New coach sign-up: ${userName}`,
        html: `
          <p>A new coach just signed up on PowerFlow and is waiting for approval.</p>
          <table cellpadding="6" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
            <tr><td style="color:#888;padding-right:12px">Name</td><td><strong>${userName}</strong></td></tr>
            <tr><td style="color:#888">Email</td><td>${userEmail}</td></tr>
            <tr><td style="color:#888">Status</td><td>Pending approval</td></tr>
          </table>
          <p style="margin-top:20px">
            <a href="https://www.power-flow.eu/admin/master" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Go to Master Admin → Coaches
            </a>
          </p>
        `,
        text: `New coach sign-up: ${userName} (${userEmail}) — go to /admin/master to approve.`,
      }).catch(() => {});
    } else {
      sendEmail({
        to:      adminEmail,
        subject: `🏋️ New athlete sign-up: ${userName}`,
        html: `
          <p>A new athlete just joined PowerFlow.</p>
          <table cellpadding="6" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
            <tr><td style="color:#888;padding-right:12px">Name</td><td><strong>${userName}</strong></td></tr>
            <tr><td style="color:#888">Email</td><td>${userEmail}</td></tr>
          </table>
          <p style="margin-top:20px">
            <a href="https://www.power-flow.eu/admin/master" style="background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Go to Master Admin → Users
            </a>
          </p>
        `,
        text: `New athlete sign-up: ${userName} (${userEmail}).`,
      }).catch(() => {});
    }
  }

  // Link athlete to coach if a join code was present before the OAuth redirect
  if (joinCode) {
    await linkAthleteToCoach(user.id, joinCode);
  }

  // ── Fetch the actual profile to inform routing decisions ───────────────────
  const profileData = await fetchProfileData(user.id);

  // ── Coach signed in via "Sign in as Athlete" button ────────────────────────
  // Detect mismatch: pf_auth_role cookie = "athlete" but actual profile = "coach".
  // In this case activate athlete view-mode client-side via a short-lived hint cookie.
  if (role === "athlete" && profileData?.role === "coach") {
    const response = NextResponse.redirect(`${origin}/today`);
    response.cookies.set("pf_mode_hint", "athlete", { maxAge: 60, path: "/" });
    response.cookies.set("pf_auth_role", "", { maxAge: 0, path: "/" });
    response.cookies.set("pf_auth_next", "", { maxAge: 0, path: "/" });
    response.cookies.set("pf_join_code", "", { maxAge: 0, path: "/" });
    return response;
  }

  // ── Coach-specific post-login logic ────────────────────────────────────────
  let redirectTo = next;
  if (profileData?.role === "coach") {
    // Ensure coaches always have PR-tier access to athlete features
    await dbPatch("profiles", { id: user.id }, { plan_tier: "pr" });

    if (profileData.coach_status === "pending") {
      redirectTo = "/coach/pending";
    }
  }

  // Clear all one-time cookies
  const response = NextResponse.redirect(`${origin}${redirectTo}`);
  response.cookies.set("pf_auth_role",  "", { maxAge: 0, path: "/" });
  response.cookies.set("pf_auth_next",  "", { maxAge: 0, path: "/" });
  response.cookies.set("pf_join_code",  "", { maxAge: 0, path: "/" });

  return response;
}

// ── Profile data helper ───────────────────────────────────────────────────────

async function fetchProfileData(userId: string): Promise<{ role: string | null; coach_status: string | null } | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role,coach_status`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const rows = res.ok ? await res.json() : [];
  return rows[0] ?? null;
}

// ── Link athlete to coach ─────────────────────────────────────────────────────

async function linkAthleteToCoach(userId: string, code: string) {
  const coaches = await dbSelect<{ id: string }>("profiles", {
    coach_code: `eq.${code.toUpperCase()}`,
    role:       "eq.coach",
    select:     "id",
  });
  if (!coaches.length) return;
  // Refuse to link a coach to themselves (which can happen if a coach clicks
  // their own invite link while signed in)
  if (coaches[0].id === userId) {
    console.warn(`[linkAthleteToCoach] refused self-link for user ${userId}`);
    return;
  }
  await dbPatch("profiles", { id: userId }, { coach_id: coaches[0].id });
}

// ── Profile upsert via service-role REST ──────────────────────────────────────

/**
 * Creates a profile row if one doesn't already exist.
 * Returns the role string when a brand-new profile was inserted, null if it already existed.
 * Used to trigger admin notification emails.
 */
async function ensureProfile(
  userId: string,
  role: "athlete" | "coach",
  meta: { display_name: string; avatar_url: string | null }
): Promise<"athlete" | "coach" | null> {
  const SUPABASE_URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[ensureProfile] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars — profile NOT created");
    return null;
  }

  const authHeaders: HeadersInit = {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };

  // Check if profile already exists
  const checkRes  = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,role`, {
    headers: { ...authHeaders, Prefer: "" },
  });
  if (!checkRes.ok) {
    const txt = await checkRes.text().catch(() => "");
    console.error(`[ensureProfile] check failed ${checkRes.status}`, txt);
  }
  const existing  = checkRes.ok ? await checkRes.json() : [];
  if (existing.length > 0) return null; // Don't overwrite role

  // Generate coach_code for coaches (random 8-char alphanumeric)
  const coach_code =
    role === "coach"
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)))
          .map((b) => b.toString(36).padStart(2, "0"))
          .join("")
          .toUpperCase()
          .slice(0, 8)
      : null;

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method:  "POST",
    headers: { ...authHeaders, Prefer: "resolution=ignore-duplicates,return=representation" },
    body:    JSON.stringify({
      id: userId,
      role,
      display_name:  meta.display_name,
      avatar_url:    meta.avatar_url,
      coach_code,
      plan_tier:     role === "coach" ? "pr" : "opener",
      coach_status:  role === "coach" ? "pending" : null,
    }),
  });
  if (!insertRes.ok) {
    const txt = await insertRes.text().catch(() => "");
    console.error(`[ensureProfile] insert failed ${insertRes.status} for user ${userId} role ${role}`, txt);
    return null;
  }

  return role;
}
