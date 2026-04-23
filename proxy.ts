import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Auth is only enforced when both Supabase env vars are present. */
const AUTH_ENABLED =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.startsWith("REPLACE_");

export async function proxy(request: NextRequest) {
  // If Supabase isn't configured yet, pass all requests through unguarded.
  if (!AUTH_ENABLED) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    // Refresh the session — do not remove this
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Protect app routes — redirect to sign-in if unauthenticated
    const APP_ROUTES = ["/today", "/journal", "/library", "/course", "/you", "/coach"];
    if (!user && APP_ROUTES.some((r) => pathname.startsWith(r))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/sign-in";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    // Auth check failed (e.g. misconfigured keys) — let the request through
    // rather than returning a 500.
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
