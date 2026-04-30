"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VoiceGlyph from "@/app/components/VoiceGlyph";
import type { AthleteProfile } from "@/lib/athlete";
import type { Voice } from "@/lib/voices";
import { DISTANCE_LABELS } from "@/lib/voices";
import { useT } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

type VoiceWithCount = Voice & { thought_count: number };

type EntryRow = {
  id: string;
  content: string;
  voice_id: string | null;
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeSince(iso: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return t("voices.justNow");
  if (diffMin < 60) return t("voices.mAgo", { n: diffMin });
  if (diffH   < 24) return t("voices.hAgo", { n: diffH });
  return t("voices.dAgo", { n: diffD });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoicesCastPage() {
  const router = useRouter();
  const { t } = useT();
  const [voices, setVoices]   = React.useState<VoiceWithCount[]>([]);
  const [entries, setEntries] = React.useState<EntryRow[]>([]);
  const [profile, setProfile] = React.useState<AthleteProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [newingVoice, setNewingVoice] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [meRes, voicesRes, entriesRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/voices"),
        fetch("/api/journal/entries"),
      ]);

      if (meRes.ok) {
        const p: AthleteProfile = await meRes.json();
        // Gate: require Second tier (or above) + beta_voice_work mode enabled
        const tier = p?.plan_tier ?? "opener";
        const tierOk = tier === "second" || tier === "pr";
        if (!tierOk || p.self_talk_mode !== "beta_voice_work") {
          router.replace(!tierOk ? "/upgrade" : "/you");
          return;
        }
        setProfile(p);
      } else {
        router.replace("/you");
        return;
      }

      if (voicesRes.ok) {
        const data = await voicesRes.json();
        setVoices(Array.isArray(data.voices) ? data.voices : []);
      }

      if (entriesRes.ok) {
        const data: EntryRow[] = await entriesRes.json();
        setEntries(Array.isArray(data) ? data.filter((e) => e.voice_id) : []);
      }

      setLoading(false);
    })();
  }, [router]);

  const handleNewVoice = async () => {
    setNewingVoice(true);
    try {
      const res = await fetch("/api/voice-drafts", { method: "POST" });
      if (res.ok) {
        router.push("/voices/new");
      } else {
        router.push("/voices/new");
      }
    } catch {
      router.push("/voices/new");
    } finally {
      setNewingVoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-base">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (voices.length === 0) {
    return (
      <div className="min-h-screen bg-surface-base">
        {/* Sticky back header */}
        <div className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-white/5">
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
            <span className="text-zinc-500">·</span>
            <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400">{t("voices.title")}</span>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-12 pt-10 flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center text-center px-4">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-6">
              {t("voices.beta")}
            </p>

            <blockquote className="font-saira text-sm text-zinc-400 leading-relaxed mb-2 max-w-xs italic">
              &ldquo;It&rsquo;s part of you and you need it in order to function well. You created it, so you must need it. The task is to not be over-active &mdash; only come when I need you.&rdquo;
            </blockquote>
            <p className="font-saira text-[10px] text-zinc-400 mb-10">&mdash; Coach</p>

            <button
              type="button"
              onClick={handleNewVoice}
              disabled={newingVoice}
              className="rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 px-6 py-3 font-saira text-sm font-semibold uppercase tracking-[0.18em] text-white transition"
            >
              {newingVoice ? "…" : t("voices.mapFirst")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Populated state ────────────────────────────────────────────────────────

  // Recent voiced thoughts (last 5)
  const recentThoughts = entries
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const voiceMap = new Map(voices.map((v) => [v.id, v]));

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Sticky back header */}
      <div className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-white/5">
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
          <span className="text-zinc-500">·</span>
          <span className="font-saira text-[11px] uppercase tracking-[0.18em] text-zinc-400">{t("voices.title")}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 pb-12 sm:px-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-0.5">
              {t("voices.beta")}
            </p>
            <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
              {t("voices.title")}{" "}
              <span className="text-zinc-400 text-lg font-semibold">({voices.length})</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={handleNewVoice}
            disabled={newingVoice}
            className="rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-60 px-4 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-300 hover:text-white transition"
          >
            {newingVoice ? "…" : t("voices.newVoice")}
          </button>
        </div>

        {/* Voice cards */}
        <div className="space-y-3 mb-8">
          {voices.map((voice) => (
            <Link
              key={voice.id}
              href={`/voices/${voice.id}`}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-card px-4 py-4 hover:border-purple-500/20 hover:bg-[#1e1830] transition group"
            >
              {/* Glyph */}
              <div className="flex-shrink-0">
                <VoiceGlyph
                  shape={voice.shape}
                  color={voice.color}
                  size={voice.size as 1|2|3|4|5}
                  className="w-10 h-10"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-saira text-sm font-bold text-white truncate">{voice.name}</p>
                <p className="font-saira text-[11px] text-zinc-300 mt-0.5">
                  {voice.shape} · {DISTANCE_LABELS[voice.current_distance]}
                </p>
                <p className="font-saira text-[10px] text-zinc-400 mt-0.5">
                  {voice.thought_count} {voice.thought_count !== 1 ? t("voices.thoughts") : t("voices.thought")}
                  {voice.body_locations.length > 0
                    ? ` · ${voice.body_locations.join(", ").replace(/_/g, " ")}`
                    : ""}
                </p>
              </div>

              {/* Chevron */}
              <span className="flex-shrink-0 font-saira text-zinc-400 group-hover:text-purple-400 transition">
                →
              </span>
            </Link>
          ))}
        </div>

        {/* Recent thoughts rail */}
        {recentThoughts.length > 0 && (
          <div>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-300 mb-3">
              {t("voices.recentThoughts")}
            </p>
            <div className="space-y-2">
              {recentThoughts.map((entry) => {
                const voice = entry.voice_id ? voiceMap.get(entry.voice_id) : undefined;
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-surface-panel px-4 py-3"
                  >
                    {voice && (
                      <div className="flex-shrink-0 mt-0.5">
                        <VoiceGlyph
                          shape={voice.shape}
                          color={voice.color}
                          size={voice.size as 1|2|3|4|5}
                          className="w-5 h-5"
                        />
                      </div>
                    )}
                    <p className="flex-1 font-saira text-xs text-zinc-300 leading-relaxed truncate">
                      &ldquo;{entry.content.slice(0, 80)}{entry.content.length > 80 ? "…" : ""}&rdquo;
                    </p>
                    <span className="flex-shrink-0 font-saira text-[10px] text-zinc-400 whitespace-nowrap">
                      {timeSince(entry.created_at, t)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unused profile reference (prevents TS unused var warning) */}
        <span className="sr-only">{profile?.display_name}</span>
      </div>
    </div>
  );
}
