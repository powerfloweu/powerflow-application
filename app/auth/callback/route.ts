import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { dbSelect, dbPatch } from "@/lib/supabaseAdmin";

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

  // Upsert profile (no-op if already exists)
  await ensureProfile(user.id, role, {
    display_name: user.user_metadata?.full_name ?? user.email ?? "User",
    avatar_url:   user.user_metadata?.avatar_url ?? null,
  });

  // Link athlete to coach if a join code was present before the OAuth redirect
  if (joinCode) {
    await linkAthleteToCoach(user.id, joinCode);
  }

  // ── Coach-specific post-login logic ────────────────────────────────────────
  let redirectTo = next;
  if (role === "coach") {
    // Ensure coaches always have PR-tier access to athlete features
    await dbPatch("profiles", { id: user.id }, { plan_tier: "pr" });

    // Read coach_status to decide where to send them
    const coachProfile = await fetchCoachStatus(user.id);
    if (coachProfile?.coach_status === "pending") {
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

// ── Coach status helper ───────────────────────────────────────────────────────

async function fetchCoachStatus(userId: string): Promise<{ coach_status: string | null } | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=coach_status`,
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

async function ensureProfile(
  userId: string,
  role: "athlete" | "coach",
  meta: { display_name: string; avatar_url: string | null }
) {
  const SUPABASE_URL  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[ensureProfile] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars — profile NOT created");
    return;
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
  if (existing.length > 0) return; // Don't overwrite role

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
  }
}
