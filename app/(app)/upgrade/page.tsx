"use client";

import React from "react";
import Link from "next/link";
import {
  TIER_LABELS,
  TIER_SUBTITLES,
  TIER_DESCRIPTIONS,
  TIER_FEATURES,
  type PlanTier,
} from "@/lib/plan";

const TIERS: PlanTier[] = ["opener", "second", "pr"];

const TIER_PRICES: Record<PlanTier, string> = {
  opener: "Free",
  second: "€9 / mo",
  pr: "€19 / mo",
};

const TIER_CTA: Record<PlanTier, string> = {
  opener: "Current plan",
  second: "Upgrade to Second",
  pr: "Upgrade to PR",
};

export default function UpgradePage() {
  const [current, setCurrent] = React.useState<PlanTier>("opener");

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        if (p?.plan_tier) setCurrent(p.plan_tier as PlanTier);
        if (p?.role === "coach") setCurrent("pr");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-12 pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="font-saira text-[10px] uppercase tracking-[0.3em] text-purple-400 mb-3">
          Plans
        </p>
        <h1 className="text-3xl font-bold text-white mb-3">
          Train your mind like you train your body
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          Start free. Unlock your tools when you're ready. Go all-in when you want the full programme.
        </p>
      </div>

      {/* Tier cards */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const isCurrent = tier === current;
          const isHigher = ["opener", "second", "pr"].indexOf(tier) >
            ["opener", "second", "pr"].indexOf(current);
          return (
            <div
              key={tier}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                tier === "pr"
                  ? "border-purple-500/50 bg-purple-500/5"
                  : "border-white/8 bg-white/3"
              }`}
            >
              {tier === "pr" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white font-saira text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                    Best value
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className="mb-4">
                <p className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
                  {TIER_SUBTITLES[tier]}
                </p>
                <h2 className="text-lg font-bold text-white">{TIER_LABELS[tier]}</h2>
                <p className="text-2xl font-bold text-white mt-1">{TIER_PRICES[tier]}</p>
                <p className="text-xs text-zinc-500 mt-1">{TIER_DESCRIPTIONS[tier]}</p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2 mb-6">
                {TIER_FEATURES[tier].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center py-2.5 rounded-xl border border-white/10 text-zinc-500 font-saira text-[10px] uppercase tracking-[0.2em]">
                  Current plan
                </div>
              ) : isHigher ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-purple-600/80 text-white font-saira text-[10px] uppercase tracking-[0.2em] opacity-60 cursor-not-allowed"
                >
                  {TIER_CTA[tier]}
                </button>
              ) : (
                <div className="text-center py-2.5 rounded-xl border border-white/10 text-zinc-600 font-saira text-[10px] uppercase tracking-[0.2em]">
                  Downgrade
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Coach billing note */}
      <div className="max-w-2xl mx-auto mt-8 text-center">
        <p className="text-xs text-zinc-600">
          Are you a coach?{" "}
          <Link href="/coach" className="text-zinc-400 underline underline-offset-2">
            Coaches are billed per active athlete
          </Link>
          {" "}and have full access to all features.
        </p>
      </div>

      {/* Back */}
      <div className="text-center mt-6">
        <Link href="/today" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Back to app
        </Link>
      </div>
    </div>
  );
}
