"use client";

import React from "react";
import Link from "next/link";
import { type PlanTier } from "@/lib/plan";
import { useT } from "@/lib/i18n";

const TIERS: PlanTier[] = ["opener", "second", "pr"];

const TIER_KEY: Record<PlanTier, string> = {
  opener: "tier.opener",
  second: "tier.second",
  pr: "tier.pr",
};

const TIER_DESC_KEY: Record<PlanTier, string> = {
  opener: "paywall.descOpener",
  second: "paywall.descSecond",
  pr: "paywall.descPR",
};

const TIER_PRICE_KEY: Record<PlanTier, string> = {
  opener: "upgrade.priceFree",
  second: "upgrade.priceSecond",
  pr: "upgrade.pricePR",
};

const TIER_SUBTITLE_KEY: Record<PlanTier, string> = {
  opener: "upgrade.priceFree",
  second: "library.title",          // "Tools"
  pr: "paywall.title",              // "Upgrade to unlock this" — repurpose subtitle
};

const FEATURE_KEYS: Record<PlanTier, string[]> = {
  opener: [
    "paywall.featuresOpener_1",
    "paywall.featuresOpener_2",
    "paywall.featuresOpener_3",
  ],
  second: [
    "paywall.featuresSecond_1",
    "paywall.featuresSecond_2",
    "paywall.featuresSecond_3",
    "paywall.featuresSecond_4",
    "paywall.featuresSecond_5",
  ],
  pr: [
    "paywall.featuresPR_1",
    "paywall.featuresPR_2",
    "paywall.featuresPR_3",
    "paywall.featuresPR_4",
  ],
};

export default function UpgradePage() {
  const { t } = useT();
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

  const ctaForTier = (tier: PlanTier): string =>
    tier === "second" ? t("upgrade.upgradeToSecond") : t("upgrade.upgradeToPR");

  return (
    <div className="min-h-screen bg-surface-base px-4 pt-12 pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="font-saira text-[10px] uppercase tracking-[0.3em] text-purple-400 mb-3">
          {t("upgrade.pageLabel")}
        </p>
        <h1 className="text-3xl font-bold text-white mb-3">
          {t("upgrade.title")}
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          {t("upgrade.subtitle")}
        </p>
      </div>

      {/* Tier cards */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const isCurrent = tier === current;
          const isHigher = TIERS.indexOf(tier) > TIERS.indexOf(current);
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
                    {t("upgrade.bestValue")}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className="mb-4">
                <p className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-300 mb-1">
                  {t(TIER_SUBTITLE_KEY[tier])}
                </p>
                <h2 className="text-lg font-bold text-white">{t(TIER_KEY[tier])}</h2>
                <p className="text-2xl font-bold text-white mt-1">{t(TIER_PRICE_KEY[tier])}</p>
                <p className="text-xs text-zinc-300 mt-1">{t(TIER_DESC_KEY[tier])}</p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2 mb-6">
                {FEATURE_KEYS[tier].map((k) => (
                  <li key={k} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="text-purple-400 mt-0.5 flex-shrink-0">✓</span>
                    {t(k)}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="text-center py-2.5 rounded-xl border border-white/10 text-zinc-300 font-saira text-[10px] uppercase tracking-[0.2em]">
                  {t("upgrade.currentPlan")}
                </div>
              ) : isHigher ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-purple-600/80 text-white font-saira text-[10px] uppercase tracking-[0.2em] opacity-60 cursor-not-allowed"
                >
                  {ctaForTier(tier)}
                </button>
              ) : (
                <div className="text-center py-2.5 rounded-xl border border-white/10 text-zinc-400 font-saira text-[10px] uppercase tracking-[0.2em]">
                  {t("upgrade.downgrade")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Coach billing note */}
      <div className="max-w-2xl mx-auto mt-8 text-center">
        <p className="text-xs text-zinc-400">
          {t("upgrade.coachQuestion")}{" "}
          <Link href="/coach" className="text-zinc-400 underline underline-offset-2">
            {t("upgrade.coachLink")}
          </Link>
          {" "}{t("upgrade.coachNote")}
        </p>
      </div>

      {/* Back */}
      <div className="text-center mt-6">
        <Link href="/today" className="text-xs text-zinc-400 hover:text-zinc-400 transition-colors">
          {t("upgrade.backToApp")}
        </Link>
      </div>
    </div>
  );
}
