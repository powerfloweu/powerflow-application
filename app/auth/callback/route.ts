import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  // Read role + next destination stored before the OAuth redirect
  const role = (request.cookies.get("pf_auth_role")?.value ?? "athlete") as "athlete" | "coach";
  const nextRaw = request.cookies.get("pf_auth_next")?.value ?? "";
  const next = nextRaw ? decodeURIComponent(nextRaw) : role === "coach" ? "/coach" : "/journal";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
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

  // Upsert profile row (using service role key via supabaseAdmin for bypassing RLS on insert)
  await ensureProfile(user.id, role, {
    display_name: user.user_metadata?.full_name ?? user.email ?? "User",
    avatar_url: user.user_metadata?.avatar_url ?? null,
  });

  // Clear the one-time cookies
  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.set("pf_auth_role", "", { maxAge: 0, path: "/" });
  response.cookies.set("pf_auth_next", "", { maxAge: 0, path: "/" });

  return response;
}

// ── Profile upsert via service-role REST ──────────────────────────────────────

async function ensureProfile(
  userId: string,
  role: "athlete" | "coach",
  meta: { display_name: string; avatar_url: string | null }
) {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL || !SERVICE_KEY) return;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: "resolution=ignore-duplicates,return=representation",
  };

  // Check if profile already exists
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,role`,
    { headers: { ...headers, Prefer: "" } }
  );
  const existing = checkRes.ok ? await checkRes.json() : [];

  if (existing.length > 0) {
    // Profile already exists — don't overwrite role
    return;
  }

  // Generate coach_code for coaches (random 8-char alphanumeric)
  const coach_code =
    role === "coach"
      ? Array.from(crypto.getRandomValues(new Uint8Array(6)))
          .map((b) => b.toString(36).padStart(2, "0"))
          .join("")
          .toUpperCase()
          .slice(0, 8)
      : null;

  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: userId,
      role,
      display_name: meta.display_name,
      avatar_url: meta.avatar_url,
      coach_code,
    }),
  });
}
