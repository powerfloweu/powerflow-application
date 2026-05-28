"use client";

/**
 * /auth/confirm
 *
 * Handles Supabase's implicit-flow auth redirect — the access_token and
 * refresh_token land in the URL hash fragment (e.g. after an admin-generated
 * magic link).  This page reads them, calls setSession, then forwards the
 * user to the `next` query param (default: /today).
 *
 * Used by the demo-sign-in flow to avoid needing a Google account for the
 * demo coach.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirm() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    const hash   = window.location.hash.slice(1);           // strip leading #
    const params = new URLSearchParams(hash);
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const next = new URLSearchParams(window.location.search).get("next") ?? "/today";

    if (!accessToken || !refreshToken) {
      setStatus("error");
      setMsg("No session token found. Try signing in again.");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setMsg(error.message);
        } else {
          router.replace(next);
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      {status === "loading" ? (
        <p className="font-saira text-sm text-zinc-400 animate-pulse">Signing in…</p>
      ) : (
        <div className="text-center space-y-3">
          <p className="font-saira text-sm text-red-400">{msg}</p>
          <a
            href="/auth/sign-in"
            className="font-saira text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Back to sign in
          </a>
        </div>
      )}
    </div>
  );
}
