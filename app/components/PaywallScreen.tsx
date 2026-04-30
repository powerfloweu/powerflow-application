"use client";

import Link from "next/link";
import { type PlanTier } from "@/lib/plan";
import { useT } from "@/lib/i18n";

interface Props {
  required: PlanTier;
  current?: PlanTier;
}

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

const DESC_KEY: Record<PlanTier, string> = {
  opener: "paywall.descOpener",
  second: "paywall.descSecond",
  pr: "paywall.descPR",
};

const TIER_KEY: Record<PlanTier, string> = {
  opener: "tier.opener",
  second: "tier.second",
  pr: "tier.pr",
};

export default function PaywallScreen({ required, current }: Props) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Lock icon */}
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-400" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2"
            stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <p className="font-saira text-[10px] uppercase tracking-[0.2em] text-purple-400 mb-2">
        {t(TIER_KEY[required])}
      </p>
      <h2 className="text-xl font-bold text-white mb-2">
        {t("paywall.title")}
      </h2>
      <p className="text-sm text-zinc-400 mb-7 max-w-xs">
        {t(DESC_KEY[required])}
      </p>

      {/* Feature list */}
      <ul className="text-left space-y-2 mb-8 max-w-xs w-full">
        {FEATURE_KEYS[required].map((k) => (
          <li key={k} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <span className="text-purple-400 mt-0.5 flex-shrink-0">✓</span>
            {t(k)}
          </li>
        ))}
      </ul>

      <Link
        href="/upgrade"
        className="bg-purple-600 hover:bg-purple-500 text-white font-saira text-xs uppercase tracking-[0.2em] px-7 py-3 rounded-xl transition-colors"
      >
        {t("paywall.seePlans")}
      </Link>

      {current && (
        <p className="mt-5 text-xs text-zinc-400">
          {t("paywall.currentPlan")}: {t(TIER_KEY[current])}
        </p>
      )}
    </div>
  );
}
