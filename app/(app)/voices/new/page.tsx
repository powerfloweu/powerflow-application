"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function VoicesNewPage() {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#050608]">
      {/* Sticky back header */}
      <div className="sticky top-0 z-40 bg-[#050608]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400 hover:text-purple-300 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("voices.back")}
          </button>
          <span className="text-zinc-700">·</span>
          <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-600">{t("voices.title")}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Header */}
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-1">
          {t("voices.voicesBeta")}
        </p>
        <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white mb-6">
          {t("voices.mapTitle")}
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
          {t("voices.stepLabel", { n: 1 })}
        </p>

        {/* Placeholder card */}
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-6 text-center">
          <p className="font-saira text-sm text-zinc-400 leading-relaxed mb-2">
            {t("voices.wizardSoon")}
          </p>
          <p className="font-saira text-xs text-zinc-600">
            {t("voices.coachCreateNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
