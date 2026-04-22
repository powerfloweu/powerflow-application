"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [state, setState] = React.useState<
    "loading" | "found" | "invalid" | "joining" | "done" | "error"
  >("loading");
  const [coachName, setCoachName] = React.useState<string>("");
  const [authLoading, setAuthLoading] = React.useState(false);

  // Verify the coach code is real
  React.useEffect(() => {
    if (!code) { setState("invalid"); return; }
    (async () => {
      const res = await fetch(`/api/join/verify?code=${encodeURIComponent(code)}`);
      if (!res.ok) { setState("invalid"); return; }
      const data = await res.json();
      if (!data.valid) { setState("invalid"); return; }
      setCoachName(data.coachName ?? "your coach");
      setState("found");
    })();
  }, [code]);

  // After OAuth, link athlete to coach
  React.useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setState("joining");
        const res = await fetch("/api/join/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, userId: session.user.id }),
        });
        if (res.ok) {
          setState("done");
          setTimeout(() => router.push("/journal"), 1500);
        } else {
          setState("error");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [code, router]);

  async function handleJoin() {
    setAuthLoading(true);
    const supabase = createClient();

    // Store role cookie so callback knows this is an athlete joining via invite
    document.cookie = `pf_auth_role=athlete; path=/; max-age=300; SameSite=Lax`;
    document.cookie = `pf_auth_next=${encodeURIComponent("/journal")}; path=/; max-age=300; SameSite=Lax`;
    document.cookie = `pf_join_code=${encodeURIComponent(code)}; path=/; max-age=300; SameSite=Lax`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) setAuthLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-[#050608] flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.13),transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.36em] text-purple-300 mb-2">
          PowerFlow
        </p>

        {state === "loading" && (
          <div className="mt-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
          </div>
        )}

        {state === "invalid" && (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
            <p className="font-saira text-lg font-bold text-red-300 mb-2">Invalid link</p>
            <p className="font-saira text-sm text-zinc-500">
              This invite link is invalid or has expired. Ask your coach to resend it.
            </p>
          </div>
        )}

        {(state === "found" || authLoading) && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.1em] text-white mt-4">
              You've been invited
            </h1>
            <p className="mt-3 font-saira text-sm text-zinc-400">
              <span className="text-purple-300 font-semibold">{coachName}</span> has invited you to share
              your self-talk journal.
            </p>
            <div className="mt-8 rounded-3xl border border-white/8 bg-[#0F1117] p-8">
              <p className="font-saira text-xs text-zinc-500 mb-5">
                Sign in with Google to join. Your coach will be able to see your journal entries and test results.
              </p>
              <button
                type="button"
                onClick={handleJoin}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3.5 font-saira text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {authLoading ? "Redirecting…" : "Accept with Google"}
              </button>
            </div>
          </>
        )}

        {state === "joining" && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
            </div>
            <p className="font-saira text-sm text-zinc-400">Linking your account…</p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <p className="font-saira text-2xl mb-2">✓</p>
            <p className="font-saira text-lg font-bold text-emerald-300 mb-2">You're connected!</p>
            <p className="font-saira text-sm text-zinc-500">
              Redirecting to your journal…
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
            <p className="font-saira text-lg font-bold text-red-300 mb-2">Something went wrong</p>
            <p className="font-saira text-sm text-zinc-500">
              Couldn't link your account. Please try the invite link again or contact your coach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
