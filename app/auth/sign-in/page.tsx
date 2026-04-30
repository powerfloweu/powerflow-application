"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

function SignInContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/today";
  const role = searchParams.get("role") ?? (next.startsWith("/coach") ? "coach" : "athlete");

  const [loading, setLoading] = React.useState<"athlete" | "coach" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function signInWith(chosenRole: "athlete" | "coach") {
    setLoading(chosenRole);
    setError(null);
    const supabase = createClient();

    // Store intended role and destination in a cookie so the callback can read it
    document.cookie = `pf_auth_role=${chosenRole}; path=/; max-age=300; SameSite=Lax`;
    document.cookie = `pf_auth_next=${encodeURIComponent(
      chosenRole === "coach" ? "/coach" : next
    )}; path=/; max-age=300; SameSite=Lax`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // On success the browser navigates to Google — nothing more to do here.
  }

  return (
    <div className="relative min-h-screen bg-surface-base flex items-center justify-center px-4 py-[env(safe-area-inset-top)]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.13),transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.36em] text-purple-300 mb-2">
            {t("brand.name")}
          </p>
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-[0.1em] text-white">
            {t("auth.welcomeBack")}
          </h1>
          <p className="mt-2 font-saira text-sm text-zinc-300">
            {t("auth.welcomeSubtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/8 bg-surface-alt p-6 sm:p-8 space-y-4">

          {/* Athlete sign-in */}
          <button
            type="button"
            onClick={() => signInWith("athlete")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 font-saira text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "athlete" ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading === "athlete" ? t("auth.redirecting") : t("auth.signInAsAthlete")}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.2em]">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Coach sign-in */}
          <button
            type="button"
            onClick={() => signInWith("coach")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/[0.08] px-5 py-3.5 font-saira text-sm font-semibold text-purple-200 transition hover:bg-purple-500/[0.15] hover:border-purple-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "coach" ? (
              <span className="w-4 h-4 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading === "coach" ? t("auth.redirecting") : t("auth.signInAsCoach")}
          </button>

          {error && (
            <p className="font-saira text-xs text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center font-saira text-[11px] text-zinc-500 leading-relaxed">
          {t("auth.privacyNote")}
          <br />
          {t("auth.privacyNote2")}
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
      </div>
    }>
      <SignInContent />
    </React.Suspense>
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
