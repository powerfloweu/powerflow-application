"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceGlyph from "@/app/components/VoiceGlyph";
import type { AthleteProfile } from "@/lib/athlete";
import type { Voice } from "@/lib/voices";
import { DISTANCE_LABELS } from "@/lib/voices";

// ── Types ─────────────────────────────────────────────────────────────────────

type VoiceWithCount = Voice & { thought_count: number };

type EntryRow = {
  id: string;
  content: string;
  voice_id: string | null;
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeSince(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH   < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoicesCastPage() {
  const router = useRouter();
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
      <div className="flex items-center justify-center min-h-screen bg-[#050608]">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (voices.length === 0) {
    return (
      <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-12 flex flex-col max-w-lg mx-auto">
        <Link
          href="/journal"
          className="inline-block mb-8 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
        >
          ← Journal
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-6">
            ✦ VOICE WORK · BETA
          </p>

          <blockquote className="font-saira text-sm text-zinc-400 leading-relaxed mb-2 max-w-xs italic">
            &ldquo;It&rsquo;s part of you and you need it in order to function well. You created it, so you must need it. The task is to not be over-active &mdash; only come when I need you.&rdquo;
          </blockquote>
          <p className="font-saira text-[10px] text-zinc-600 mb-10">&mdash; Coach</p>

          <button
            type="button"
            onClick={handleNewVoice}
            disabled={newingVoice}
            className="rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 px-6 py-3 font-saira text-sm font-semibold uppercase tracking-[0.18em] text-white transition"
          >
            {newingVoice ? "…" : "+ Map your first voice"}
          </button>
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
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-12 max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/journal"
        className="inline-block mb-6 font-saira text-[11px] text-zinc-500 hover:text-purple-300 uppercase tracking-[0.18em] transition"
      >
        ← Journal
      </Link>

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-400 mb-0.5">
            ✦ VOICE WORK · BETA
          </p>
          <h1 className="font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
            Your Voices{" "}
            <span className="text-zinc-600 text-lg font-semibold">({voices.length})</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={handleNewVoice}
          disabled={newingVoice}
          className="rounded-full border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-60 px-4 py-2 font-saira text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-300 hover:text-white transition"
        >
          {newingVoice ? "…" : "+ New voice"}
        </button>
      </div>

      {/* Voice cards */}
      <div className="space-y-3 mb-8">
        {voices.map((voice) => (
          <Link
            key={voice.id}
            href={`/voices/${voice.id}`}
            className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#17131F] px-4 py-4 hover:border-purple-500/20 hover:bg-[#1e1830] transition group"
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
              <p className="font-saira text-[11px] text-zinc-500 mt-0.5">
                {voice.shape} · {DISTANCE_LABELS[voice.current_distance]}
              </p>
              <p className="font-saira text-[10px] text-zinc-600 mt-0.5">
                {voice.thought_count} thought{voice.thought_count !== 1 ? "s" : ""}
                {voice.body_locations.length > 0
                  ? ` · ${voice.body_locations.join(", ").replace(/_/g, " ")}`
                  : ""}
              </p>
            </div>

            {/* Chevron */}
            <span className="flex-shrink-0 font-saira text-zinc-600 group-hover:text-purple-400 transition">
              →
            </span>
          </Link>
        ))}
      </div>

      {/* Recent thoughts rail */}
      {recentThoughts.length > 0 && (
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-3">
            Recent Thoughts
          </p>
          <div className="space-y-2">
            {recentThoughts.map((entry) => {
              const voice = entry.voice_id ? voiceMap.get(entry.voice_id) : undefined;
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#0e0b15] px-4 py-3"
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
                  <span className="flex-shrink-0 font-saira text-[10px] text-zinc-600 whitespace-nowrap">
                    {timeSince(entry.created_at)}
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
  );
}
