"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import VoiceGlyph from "@/app/components/VoiceGlyph";
import type { Voice } from "@/lib/voices";
import { DISTANCE_LABELS, levelLabel } from "@/lib/voices";
import { useT } from "@/lib/i18n";

// ── Helpers ───────────────────────────────────────────────────────────────────

function SliderDisplay({ label, value }: { label: string; value: number }) {
  const lv = levelLabel(value);
  const filled = Math.round((value / 100) * 12);
  const track = Array.from({ length: 12 }, (_, i) => i < filled);
  return (
    <div className="flex items-center gap-3">
      <span className="font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-500 w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center gap-0.5">
        {track.map((on, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${on ? "bg-purple-400" : "bg-white/8"}`}
          />
        ))}
      </div>
      <span className="font-saira text-[10px] text-zinc-500 w-16 text-right flex-shrink-0">
        {value} / {lv}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoiceDetailPage() {
  const router = useRouter();
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [voice, setVoice] = React.useState<(Voice & { thought_count?: number }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [showEditToast, setShowEditToast] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/voices/${id}`);
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        const data = await res.json();
        setVoice(data);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050608]">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !voice) {
    return (
      <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-saira text-zinc-500 text-sm">{t("voices.notFound")}</p>
        <Link
          href="/voices"
          className="font-saira text-[11px] text-purple-400 hover:text-purple-300 uppercase tracking-[0.14em] transition"
        >
          ← {t("voices.yourVoices")}
        </Link>
      </div>
    );
  }

  const placementChanged =
    voice.current_distance !== voice.desired_distance ||
    voice.current_side !== voice.desired_side;

  const sideLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
          <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-600 truncate">{voice.name}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-12">
        {/* Hero glyph */}
        <div className="flex flex-col items-center text-center mb-8">
          <VoiceGlyph
            shape={voice.shape}
            color={voice.color}
            size={voice.size as 1|2|3|4|5}
            className="w-20 h-20 mb-4"
          />
          <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
            {voice.name}
          </h1>
          <p className="font-saira text-xs text-zinc-500">
            {voice.shape}
            {voice.shape === "custom" && voice.shape_custom_description
              ? ` · ${voice.shape_custom_description}`
              : ""}
            {" · "}
            {DISTANCE_LABELS[voice.current_distance]}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 py-4 mb-6 border-t border-b border-white/5">
          <div className="text-center">
            <p className="font-saira text-lg font-bold text-white">{voice.thought_count ?? 0}</p>
            <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-[0.14em]">{t("voices.statsThoughts")}</p>
          </div>
          {voice.body_locations.length > 0 && (
            <>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <p className="font-saira text-sm font-semibold text-white">
                  {voice.body_locations.map((l) => l.replace(/_/g, " ")).join(", ")}
                </p>
                <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-[0.14em]">{t("voices.statsBody")}</p>
              </div>
            </>
          )}
          {voice.helps_when.length > 0 && (
            <>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <p className="font-saira text-lg font-bold text-white">{voice.helps_when.length}</p>
                <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-[0.14em]">{t("voices.statsWhenHelps")}</p>
              </div>
            </>
          )}
        </div>

        {/* Placement */}
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
            {t("voices.placement")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-saira text-[10px] text-zinc-600 uppercase tracking-[0.12em] mb-0.5">{t("voices.placementNow")}</p>
              <p className="font-saira text-sm text-white font-semibold">
                {DISTANCE_LABELS[voice.current_distance]} · {sideLabel(voice.current_side)}
              </p>
            </div>
            {placementChanged && (
              <>
                <span className="text-purple-400 font-saira text-sm">→</span>
                <div className="flex-1 text-right">
                  <p className="font-saira text-[10px] text-purple-400/70 uppercase tracking-[0.12em] mb-0.5">{t("voices.placementWant")}</p>
                  <p className="font-saira text-sm text-purple-300 font-semibold">
                    {DISTANCE_LABELS[voice.desired_distance]} · {sideLabel(voice.desired_side)}
                  </p>
                </div>
              </>
            )}
            {!placementChanged && (
              <p className="font-saira text-[10px] text-zinc-700 italic">{t("voices.placementFeelsRight")}</p>
            )}
          </div>
        </div>

        {/* Physical profile */}
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-4">
            {t("voices.physicalProfile")}
          </p>
          <div className="space-y-3 mb-4">
            <SliderDisplay label={t("voices.sliderTone")} value={voice.tone} />
            <SliderDisplay label={t("voices.sliderVolume")} value={voice.volume} />
          </div>
          {voice.body_locations.length > 0 && (
            <p className="font-saira text-xs text-zinc-400">
              <span className="text-zinc-600">{t("voices.bodyLabel")} </span>
              {voice.body_locations.map((l) => l.replace(/_/g, " ")).join(", ")}
            </p>
          )}
        </div>

        {/* When it helps */}
        {(voice.helps_when.length > 0 || voice.helps_note) && (
          <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
              {t("voices.whenItHelps")}
            </p>
            {voice.helps_when.length > 0 && (
              <ul className="space-y-2 mb-3">
                {voice.helps_when.map((tag) => (
                  <li key={tag} className="flex items-start gap-2">
                    <span className="text-purple-400 flex-shrink-0 mt-0.5 text-xs">✓</span>
                    <span className="font-saira text-sm text-zinc-300">{tag}</span>
                  </li>
                ))}
              </ul>
            )}
            {voice.helps_note && (
              <blockquote className="border-l-2 border-purple-500/30 pl-3 font-saira text-sm text-zinc-400 italic leading-relaxed">
                &ldquo;{voice.helps_note}&rdquo;
              </blockquote>
            )}
          </div>
        )}

        {/* Edit button */}
        <button
          type="button"
          onClick={() => {
            setShowEditToast(true);
            setTimeout(() => setShowEditToast(false), 3000);
          }}
          className="w-full rounded-2xl border border-white/5 bg-[#17131F] py-4 font-saira text-sm font-semibold text-zinc-400 hover:text-purple-300 hover:border-purple-500/20 transition"
        >
          {t("voices.editBtn")}
        </button>

        {showEditToast && (
          <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-center">
            <p className="font-saira text-xs text-purple-300">
              {t("voices.editSoon")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
