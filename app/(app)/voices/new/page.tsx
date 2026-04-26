"use client";

import React from "react";
import Link from "next/link";

export default function VoicesNewPage() {
  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-12 max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/voices"
        className="inline-block mb-8 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
      >
        ← Your voices
      </Link>

      {/* Header */}
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-1">
        Voice Work · Beta
      </p>
      <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-6">
        Map a New Voice
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((n) => (
          <React.Fragment key={n}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-saira text-[10px] font-bold ${
                n === 1
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 border border-white/10 text-zinc-600"
              }`}
            >
              {n}
            </div>
            {n < 5 && <div className="flex-1 h-px bg-white/5" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 label */}
      <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 mb-6">
        Step 1 of 5 — Name the voice
      </p>

      {/* Placeholder card */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-6 text-center">
        <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-2">
          Wizard coming soon.
        </p>
        <p className="font-saira text-xs text-zinc-600">
          For now, voices can be created by your coach.
        </p>
      </div>
    </div>
  );
}
