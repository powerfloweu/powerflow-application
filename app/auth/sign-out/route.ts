import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /auth/sign-out — called by the client button.
 * Signs the user out and returns JSON so the client can redirect.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

/**
 * GET /auth/sign-out — fallback for plain <a href> links.
 * Signs out and redirects to sign-in using the request's own origin.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
