"use client";

import React from "react";
import Link from "next/link";

const UNLOCK_KEYS = [
  "powerflow.selfAwareness.unlocked.v1",
  "powerflow.acsi.unlocked.v1",
  "powerflow.csai.unlocked.v1",
  "powerflow.bundle.unlocked.v1",
];

const TESTS = [
  {
    label: "Self-Awareness Test",
    href: "/tests/self-awareness",
    color: "text-fuchsia-300",
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/10",
  },
  {
    label: "Coping Skills Inventory",
    href: "/tests/acsi",
    color: "text-purple-300",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
  },
  {
    label: "Competitive Anxiety Inventory",
    href: "/tests/csai",
    color: "text-sky-300",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
  },
];

type Status = "verifying" | "success" | "already" | "error";

export default function BundleCompletePage() {
  const [status, setStatus] = React.useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    // Check if already unlocked via bundle (e.g. page refresh)
    try {
      if (localStorage.getItem("powerflow.bundle.unlocked.v1") === "1") {
        setStatus("already");
        return;
      }
    } catch {}

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId?.startsWith("cs_")) {
      setStatus("error");
      setErrorMsg("No valid payment session found.");
      return;
    }

    fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: { paid: boolean; error?: string }) => {
        if (data.paid) {
          try {
            for (const key of UNLOCK_KEYS) {
              localStorage.setItem(key, "1");
            }
          } catch {}
          // Clean the session_id out of the URL
          window.history.replaceState(null, "", "/tests/bundle/complete");
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Payment could not be verified.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Could not reach the verification server.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] pt-24 pb-20 text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(168,85,247,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-16 text-center">
        {/* ── Verifying ── */}
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="font-saira text-sm text-zinc-400 uppercase tracking-[0.2em]">
              Verifying your payment…
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {(status === "success" || status === "already") && (
          <div className="space-y-8">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/15">
              <svg className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm-6 0h12a2 2 0 002-2v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <p className="font-saira text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
                PowerFlow · Bundle
              </p>
              <h1 className="mt-3 font-saira text-2xl font-extrabold uppercase tracking-[0.12em]">
                All three reports unlocked
              </h1>
              <p className="mx-auto mt-4 max-w-sm font-saira text-sm text-zinc-400">
                Every full written report is now unlocked on this device. Take the tests whenever you're ready — your reports will be waiting.
              </p>
            </div>

            {/* Test links */}
            <div className="space-y-3 text-left">
              {TESTS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`flex items-center justify-between rounded-2xl border ${t.border} ${t.bg} px-5 py-4 transition hover:opacity-90`}
                >
                  <span className={`font-saira text-sm font-semibold uppercase tracking-[0.1em] ${t.color}`}>
                    {t.label}
                  </span>
                  <span className="font-saira text-xs text-zinc-400">Start →</span>
                </Link>
              ))}
            </div>

            <Link
              href="/tests"
              className="inline-block font-saira text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300 transition"
            >
              ← Back to all tests
            </Link>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h1 className="font-saira text-xl font-extrabold uppercase tracking-[0.12em]">
                Payment not verified
              </h1>
              <p className="mt-3 font-saira text-sm text-zinc-400">{errorMsg}</p>
              <p className="mt-2 font-saira text-sm text-zinc-500">
                If you completed payment, please contact us with your Stripe receipt.
              </p>
            </div>
            <Link
              href="/tests"
              className="inline-block font-saira text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300 transition"
            >
              ← Back to tests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
