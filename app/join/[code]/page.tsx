"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "found" | "found-loggedin" | "invalid" | "joining" | "done" | "error";

export default function JoinPage() {
  const { code }  = useParams<{ code: string }>();
  const router    = useRouter();
  const [state, setState]       = React.useState<State>("loading");
  const [coachName, setCoachName] = React.useState("");
  const [userId, setUserId]     = React.useState<string | null>(null);
  const [busy, setBusy]         = React.useState(false);

  // ── 1. Verify code + check for existing session ───────────────
  React.useEffect(() => {
    if (!code) { setState("invalid"); return; }

    (async () => {
      // Verify the code is real
      const verifyRes = await fetch(`/api/join/verify?code=${encodeURIComponent(code)}`);
      if (!verifyRes.ok) { setState("invalid"); return; }
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) { setState("invalid"); return; }
      setCoachName(verifyData.coachName ?? "your coach");

      // Check if the user is already signed in
      const supabase  = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setState("found-loggedin");
      } else {
        setState("found");
      }
    })();
  }, [code]);

  // ── 2a. Already logged in — link directly, no OAuth needed ────
  async function handleDirectConnect() {
    if (!userId) return;
    setBusy(true);
    setState("joining");
    const res = await fetch("/api/join/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, userId }),
    });
    if (res.ok) {
      setState("done");
      setTimeout(() => router.push("/today"), 1500);
    } else {
      setState("error");
    }
    setBusy(false);
  }

  // ── 2b. Not logged in — OAuth flow; callback handles the link ─
  async function handleOAuth() {
    setBusy(true);
    const supabase = createClient();
    // Store code so /auth/callback can do the linking after OAuth completes
    document.cookie = `pf_auth_role=athlete;  path=/; max-age=300; SameSite=Lax`;
    document.cookie = `pf_auth_next=${encodeURIComponent("/today")}; path=/; max-age=300; SameSite=Lax`;
    document.cookie = `pf_join_code=${encodeURIComponent(code)}; path=/; max-age=300; SameSite=Lax`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) setBusy(false);
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#050608] flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.13),transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.36em] text-purple-300 mb-2">
          PowerFlow
        </p>

        {/* Loading */}
        {state === "loading" && (
          <div className="mt-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
          </div>
        )}

        {/* Invalid */}
        {state === "invalid" && (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
            <p className="font-saira text-lg font-bold text-red-300 mb-2">Invalid link</p>
            <p className="font-saira text-sm text-zinc-500">
              This invite link is invalid or has expired. Ask your coach for a new one.
            </p>
          </div>
        )}

        {/* Found — not logged in → OAuth */}
        {(state === "found" || (state === "loading" && busy)) && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.1em] text-white mt-4">
              You've been invited
            </h1>
            <p className="mt-3 font-saira text-sm text-zinc-400">
              <span className="text-purple-300 font-semibold">{coachName}</span> has invited you
              to join PowerFlow.
            </p>
            <div className="mt-8 rounded-3xl border border-white/8 bg-[#0F1117] p-8">
              <p className="font-saira text-xs text-zinc-500 mb-5">
                Sign in with Google to connect. Your coach will be able to see your journal and test results.
              </p>
              <button
                type="button"
                onClick={handleOAuth}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3.5 font-saira text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy
                  ? <span className="w-4 h-4 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
                  : <GoogleIcon />}
                {busy ? "Redirecting…" : "Accept with Google"}
              </button>
            </div>
          </>
        )}

        {/* Found — already logged in → direct connect */}
        {state === "found-loggedin" && (
          <>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.1em] text-white mt-4">
              You've been invited
            </h1>
            <p className="mt-3 font-saira text-sm text-zinc-400">
              <span className="text-purple-300 font-semibold">{coachName}</span> has invited you
              to join PowerFlow.
            </p>
            <div className="mt-8 rounded-3xl border border-white/8 bg-[#0F1117] p-8">
              <p className="font-saira text-xs text-zinc-500 mb-5">
                You're already signed in. Tap below to connect your account to {coachName}.
              </p>
              <button
                type="button"
                onClick={handleDirectConnect}
                disabled={busy}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-3.5 font-saira text-sm font-semibold text-white transition"
              >
                {busy ? "Connecting…" : `Connect to ${coachName}`}
              </button>
            </div>
          </>
        )}

        {/* Joining */}
        {state === "joining" && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
            </div>
            <p className="font-saira text-sm text-zinc-400">Linking your account…</p>
          </div>
        )}

        {/* Done */}
        {state === "done" && (
          <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <p className="font-saira text-2xl mb-2">✓</p>
            <p className="font-saira text-lg font-bold text-emerald-300 mb-2">You're connected!</p>
            <p className="font-saira text-sm text-zinc-500">Redirecting you now…</p>
          </div>
        )}

        {/* Error */}
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
