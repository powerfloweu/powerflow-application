"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

const TIER_SUBTITLE_KEY: Record<PlanTier, string> = {
  opener: "upgrade.subtitleOpener",
  second: "upgrade.subtitleSecond",
  pr:     "upgrade.subtitlePR",
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

/** Price labels shown on cards. */
const TIER_PRICE: Record<PlanTier, string> = {
  opener: "Free",
  second: "€9 / month",
  pr: "€19 / month",
};

function UpgradePageInner() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const [current, setCurrent] = React.useState<PlanTier>("opener");
  const [hasSubscription, setHasSubscription] = React.useState(false);
  const [loading, setLoading] = React.useState<PlanTier | "portal" | null>(null);
  const [toast, setToast] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Show success / cancelled toasts from Stripe redirect
  React.useEffect(() => {
    if (searchParams.get("success") === "1") {
      setToast({ type: "success", msg: "Welcome to your new plan! Your access has been unlocked." });
    } else if (searchParams.get("cancelled") === "1") {
      setToast({ type: "error", msg: "Checkout cancelled — no charge was made." });
    }
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [searchParams]);

  // Load current profile
  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        if (!p) return;
        if (p.plan_tier) setCurrent(p.plan_tier as PlanTier);
        if (p.role === "coach") setCurrent("pr");
        setHasSubscription(!!p.stripe_subscription_id);
      })
      .catch(() => {});
  }, []);

  /** Start Stripe Checkout for the given tier. */
  async function startCheckout(tier: PlanTier) {
    if (tier === "opener") return;
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setToast({ type: "error", msg: err instanceof Error ? err.message : "Something went wrong" });
      setLoading(null);
    }
  }

  /** Open Stripe Billing Portal (manage / cancel subscription). */
  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not open billing portal");
      window.location.href = data.url;
    } catch (err) {
      setToast({ type: "error", msg: err instanceof Error ? err.message : "Something went wrong" });
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base px-4 pt-12 pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

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
          const isLoadingThis = loading === tier;

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

              {/* Tier name + price */}
              <div className="mb-4">
                <p className="font-saira text-[9px] uppercase tracking-[0.2em] text-zinc-300 mb-1">
                  {t(TIER_SUBTITLE_KEY[tier])}
                </p>
                <h2 className="text-lg font-bold text-white">{t(TIER_KEY[tier])}</h2>
                <p className="text-purple-300 font-semibold text-sm mt-0.5">{TIER_PRICE[tier]}</p>
                <p className="text-xs text-zinc-400 mt-1">{t(TIER_DESC_KEY[tier])}</p>
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
                <div className="text-center py-2.5 rounded-xl border-2 border-purple-500/60 bg-purple-500/10 text-purple-300 font-saira text-[10px] uppercase tracking-[0.2em] font-semibold">
                  ✓ {t("upgrade.currentPlan")}
                </div>
              ) : isHigher ? (
                <button
                  onClick={() => startCheckout(tier)}
                  disabled={loading !== null}
                  className="block w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-wait text-white font-saira text-[10px] uppercase tracking-[0.2em] text-center transition"
                >
                  {isLoadingThis
                    ? "Loading…"
                    : tier === "second"
                      ? t("upgrade.upgradeToSecond")
                      : t("upgrade.upgradeToPR")}
                </button>
              ) : (
                <div className="text-center py-2.5 rounded-xl border border-white/10 text-zinc-500 font-saira text-[10px] uppercase tracking-[0.2em]">
                  {t("upgrade.downgrade")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage subscription link */}
      {hasSubscription && current !== "opener" && (
        <div className="text-center mt-8">
          <button
            onClick={openPortal}
            disabled={loading !== null}
            className="text-xs text-zinc-400 hover:text-zinc-300 underline underline-offset-2 transition disabled:opacity-60 disabled:cursor-wait"
          >
            {loading === "portal" ? "Opening…" : "Manage or cancel subscription"}
          </button>
        </div>
      )}

      {/* Back */}
      <div className="text-center mt-4">
        <Link href="/today" className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
          {t("upgrade.backToApp")}
        </Link>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageInner />
    </Suspense>
  );
}
