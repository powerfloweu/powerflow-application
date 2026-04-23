"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { computePhase } from "@/lib/phase";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "athlete" | "coach";
  coach_id: string | null;
  coach_code: string | null;
  meet_date: string | null;
};

export default function YouPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Meet date form state
  const [meetDate, setMeetDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setMeetDate(p.meet_date ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meet_date: meetDate || null }),
    });
    setSaving(false);
    setSaved(true);
    // Update local state
    setProfile((p) => p ? { ...p, meet_date: meetDate || null } : p);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await fetch("/auth/sign-out", { method: "POST" });
    router.replace("/auth/sign-in");
  };

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

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · YOU
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white">
          Profile
        </h1>
      </div>

      {/* ── Identity card ─────────────────────────────────────── */}
      {profile && (
        <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <span className="font-saira text-lg font-bold text-purple-300">
                {profile.display_name[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-saira text-base font-semibold text-white">{profile.display_name}</p>
            <span className="inline-block mt-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-saira text-[10px] uppercase tracking-[0.16em] text-purple-300">
              {profile.role}
            </span>
          </div>
        </div>
      )}

      {/* ── Next competition ──────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-1">
          Next competition
        </p>
        {phase && (
          <p className="font-saira text-xs text-purple-300 mb-3">{phase.label}</p>
        )}
        <form onSubmit={handleSaveMeet} className="flex items-center gap-3">
          <input
            type="date"
            value={meetDate}
            onChange={(e) => setMeetDate(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-2 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
          >
            {saving ? "…" : saved ? "Saved ✓" : "Save"}
          </button>
        </form>
        {meetDate && (
          <button
            type="button"
            onClick={async () => {
              setMeetDate("");
              setSaving(true);
              await fetch("/api/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meet_date: null }),
              });
              setProfile((p) => p ? { ...p, meet_date: null } : p);
              setSaving(false);
            }}
            className="mt-2 font-saira text-[10px] text-zinc-600 hover:text-zinc-400 underline transition"
          >
            Clear date
          </button>
        )}
      </div>

      {/* ── Coach status ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5 mb-4">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 mb-2">
          Coach
        </p>
        {profile?.coach_id ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className="font-saira text-sm text-emerald-300">Connected to your coach</p>
          </div>
        ) : (
          <p className="font-saira text-sm text-zinc-500">
            Not connected.{" "}
            <span className="text-zinc-400">Ask your coach for an invite link.</span>
          </p>
        )}
      </div>

      {/* ── Sign out ──────────────────────────────────────────── */}
      <button
        onClick={handleSignOut}
        className="w-full mt-2 rounded-2xl border border-white/5 bg-[#17131F] py-4 font-saira text-sm text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 transition"
      >
        Sign out
      </button>
    </div>
  );
}
