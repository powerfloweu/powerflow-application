"use client";

import React from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

export default function CoachPendingPage() {
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => { if (p?.display_name) setName(p.display_name.split(" ")[0]); })
      .catch(() => {});
  }, []);

  const signOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center px-6 text-center">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.09),transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-sm w-full">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/fm_powerflow_logo_verziok_01_negative.png"
            alt="PowerFlow"
            width={72}
            height={72}
            className="opacity-90"
            priority
          />
        </div>

        {/* Eyebrow */}
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-400 mb-4">
          PowerFlow · Coach
        </p>

        {/* Heading */}
        <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-4">
          {name ? `Thanks, ${name}.` : "You're on the list."}
        </h1>

        {/* Body */}
        <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-3">
          Your coach account is pending approval. We review every coach application manually to keep the platform quality high.
        </p>
        <p className="font-saira text-sm text-zinc-500 leading-relaxed mb-10">
          You'll receive an email at your Google address once you're approved — usually within 1–2 business days.
        </p>

        {/* Contact */}
        <div className="rounded-2xl border border-white/5 bg-surface-card px-5 py-4 mb-8">
          <p className="font-saira text-xs text-zinc-400 mb-1">Questions? Reach out directly.</p>
          <a
            href="mailto:david@power-flow.eu"
            className="font-saira text-sm font-semibold text-purple-300 hover:text-purple-200 transition"
          >
            david@power-flow.eu
          </a>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={signOut}
          className="font-saira text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
