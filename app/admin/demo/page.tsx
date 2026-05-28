"use client";

/**
 * /admin/demo — Demo data management for live presentations.
 *
 * Seeds 4 realistic powerlifter profiles (Marcus, Kayla, Jake, Sofia) linked
 * to the logged-in coach account.  Each athlete has journal entries, training
 * logs, weekly check-ins, and test scores (CSAI, ACSI, DAS, SAT) that tell a
 * convincing mental-performance story.
 *
 * Hit "Remove" before or after the demo to keep the dashboard clean.
 */

import React from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "done" | "error";

export default function AdminDemoPage() {
  const [seedStatus, setSeedStatus] = React.useState<Status>("idle");
  const [removeStatus, setRemoveStatus] = React.useState<Status>("idle");
  const [seedResult, setSeedResult] = React.useState<string[] | null>(null);
  const [removeCount, setRemoveCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function seed() {
    setSeedStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${res.status}`);
      setSeedResult(data.created ?? []);
      setSeedStatus("done");
      setRemoveCount(null);
    } catch (e) {
      setError((e as Error).message);
      setSeedStatus("error");
    }
  }

  async function remove() {
    setRemoveStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${res.status}`);
      setRemoveCount(data.removed ?? 0);
      setRemoveStatus("done");
      setSeedResult(null);
    } catch (e) {
      setError((e as Error).message);
      setRemoveStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white px-6 py-12 font-saira">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <Link
            href="/admin/master"
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition mb-4 inline-block"
          >
            ← Admin
          </Link>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white">
            Demo Setup
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Populate your coach dashboard with 4 realistic demo powerlifters for
            live presentations. Seeding replaces any previous demo athletes automatically.
          </p>
        </div>

        {/* Athletes preview */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
            Demo athletes included
          </p>
          {[
            { name: "Marcus Webb",   detail: "93 kg · IPF · 6 weeks out · high cognitive anxiety" },
            { name: "Kayla Ström",   detail: "72 kg · USAPL · 10 weeks out · confidence block on bench" },
            { name: "Jake Hartley",  detail: "83 kg · IPF · no meet date · perfectionism pattern (DAS)" },
            { name: "Sofia Mäkinen",detail: "63 kg · IPF · 3 weeks out · peaking · strongest mental scores" },
          ].map((a) => (
            <div key={a.name} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-300 flex-shrink-0 mt-0.5">
                {a.name.split(" ").map((p) => p[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{a.name}</p>
                <p className="text-[11px] text-zinc-400">{a.detail}</p>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-zinc-500 pt-2 border-t border-white/5">
            Each athlete has journal entries, training logs, 3 weekly check-ins, and
            test scores (CSAI · ACSI · DAS · SAT).
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={seed}
            disabled={seedStatus === "loading"}
            className="flex-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-emerald-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seedStatus === "loading" ? "Seeding…" : "Seed Demo Athletes"}
          </button>

          <button
            type="button"
            onClick={remove}
            disabled={removeStatus === "loading"}
            className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removeStatus === "loading" ? "Removing…" : "Remove Demo Athletes"}
          </button>
        </div>

        {/* Results */}
        {seedStatus === "done" && seedResult && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-300 mb-1">
              ✓ {seedResult.length} demo athletes created
            </p>
            <p className="text-xs text-emerald-400/70">{seedResult.join(" · ")}</p>
            <Link
              href="/coach/athletes"
              className="mt-3 inline-block rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 transition"
            >
              Open Coach Dashboard →
            </Link>
          </div>
        )}

        {removeStatus === "done" && removeCount !== null && (
          <div className="rounded-xl border border-zinc-500/20 bg-zinc-500/5 p-4">
            <p className="text-sm text-zinc-300">
              ✓ {removeCount} demo athlete{removeCount !== 1 ? "s" : ""} removed.
            </p>
          </div>
        )}

        {(seedStatus === "error" || removeStatus === "error") && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-2 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px] mb-2">
            Demo tips
          </p>
          <p>• Seed → open <strong className="text-zinc-300">/coach/athletes</strong> → show the athlete cards</p>
          <p>• Marcus Webb (6 weeks out) has anxiety signals — good for showing coach alerts</p>
          <p>• Sofia Mäkinen has all 4 tests + strong check-ins — best for the full profile view</p>
          <p>• Jake Hartley has a DAS perfectionism flag — highlight the mental health screening angle</p>
          <p>• After the demo, hit Remove to keep your dashboard clean</p>
        </div>

      </div>
    </div>
  );
}
