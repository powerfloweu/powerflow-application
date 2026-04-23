"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhaseBadge from "@/app/components/PhaseBadge";
import EntryCard from "@/app/components/EntryCard";
import { computePhase } from "@/lib/phase";
import type { JournalEntry } from "@/lib/journal";

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  meet_date: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function firstName(name: string | null | undefined): string {
  if (!name) return "";
  return name.split(" ")[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/journal/entries?limit=3").then((r) => r.json()),
    ])
      .then(([prof, ents]) => {
        if (prof?.id) setProfile(prof);   // only set if it's a real profile row
        setEntries(Array.isArray(ents) ? ents.slice(0, 3) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Redirect coaches to their dashboard
  React.useEffect(() => {
    if (profile?.role === "coach") router.replace("/coach");
  }, [profile, router]);

  const phase = profile ? computePhase(profile.meet_date) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-6 sm:px-6 max-w-lg mx-auto">

      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · TODAY
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-1">
          {greeting()}{profile ? `, ${firstName(profile.display_name)}` : ""}
        </h1>
        <p className="font-saira text-sm text-zinc-500">{formatDate()}</p>
      </div>

      {/* ── Phase block ───────────────────────────────────────── */}
      {phase ? (
        <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 mb-2">
                Training phase
              </p>
              <PhaseBadge phase={phase.phase} />
            </div>
            <div className="text-right">
              <p className="font-saira text-2xl font-bold text-white tabular-nums">
                {phase.daysUntil}
              </p>
              <p className="font-saira text-[10px] text-zinc-500 uppercase tracking-[0.14em]">
                days to go
              </p>
            </div>
          </div>
          <p className="font-saira text-xs text-zinc-400">{phase.label}</p>
        </div>
      ) : (
        <Link
          href="/you"
          className="flex items-center justify-between rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 p-5 mb-5 group hover:border-purple-400/50 transition"
        >
          <div>
            <p className="font-saira text-sm font-semibold text-purple-300 group-hover:text-white transition mb-0.5">
              Set your next competition
            </p>
            <p className="font-saira text-xs text-zinc-500">
              Unlock phase tracking and periodisation
            </p>
          </div>
          <span className="text-purple-400 text-lg">→</span>
        </Link>
      )}

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/journal"
          className="flex flex-col items-start gap-2 rounded-2xl border border-white/5 bg-[#17131F] p-4 hover:bg-[#1e1828] transition group"
        >
          <span className="text-xl">✏️</span>
          <div>
            <p className="font-saira text-sm font-semibold text-white group-hover:text-purple-300 transition">
              Log entry
            </p>
            <p className="font-saira text-[10px] text-zinc-500">Capture your mindset</p>
          </div>
        </Link>

        <Link
          href="/you"
          className="flex flex-col items-start gap-2 rounded-2xl border border-white/5 bg-[#17131F] p-4 hover:bg-[#1e1828] transition group"
        >
          <span className="text-xl">⚙️</span>
          <div>
            <p className="font-saira text-sm font-semibold text-white group-hover:text-purple-300 transition">
              Profile
            </p>
            <p className="font-saira text-[10px] text-zinc-500">Settings &amp; meet date</p>
          </div>
        </Link>
      </div>

      {/* ── Coach badge ───────────────────────────────────────── */}
      {profile?.coach_id && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="font-saira text-xs text-emerald-300">Connected to your coach</p>
        </div>
      )}

      {/* ── Recent entries ────────────────────────────────────── */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Recent entries
            </p>
            <Link
              href="/journal"
              className="font-saira text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-[0.16em]"
            >
              See all →
            </Link>
          </div>
          <div className="space-y-3">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="font-saira text-sm text-zinc-600 mb-3">No journal entries yet.</p>
          <Link
            href="/journal"
            className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 font-saira text-xs text-purple-300 hover:bg-purple-500/20 transition"
          >
            Write your first entry →
          </Link>
        </div>
      )}
    </div>
  );
}
