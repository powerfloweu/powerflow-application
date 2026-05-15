"use client";

import React from "react";
import Link from "next/link";
import type { Sentiment } from "@/lib/journal";
import type { TrainingEntry } from "@/lib/training";

type EntryRow = {
  id: string;
  content: string;
  sentiment: Sentiment;
  created_at: string;
};

type AthleteRaw = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  entries: EntryRow[];
  all_training_entries: TrainingEntry[];
};

type FeedItem = {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteInitials: string;
  type: "journal" | "training";
  date: Date;
  preview: string;
  sentiment: Sentiment | null;
};

function buildFeed(athletes: AthleteRaw[]): FeedItem[] {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const items: FeedItem[] = [];

  for (const a of athletes) {
    const initials = a.display_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

    for (const e of a.entries) {
      const d = new Date(e.created_at);
      if (d >= cutoff) {
        items.push({
          id: e.id,
          athleteId: a.id,
          athleteName: a.display_name,
          athleteInitials: initials,
          type: "journal",
          date: d,
          preview: e.content.slice(0, 120),
          sentiment: e.sentiment,
        });
      }
    }

    for (const e of a.all_training_entries) {
      const d = new Date(e.entry_date + "T12:00:00");
      if (d >= cutoff) {
        const text = [e.thoughts_after, e.what_went_well, e.frustrations]
          .filter(Boolean).join(" · ");
        if (!text) continue; // skip empty training entries
        items.push({
          id: e.id,
          athleteId: a.id,
          athleteName: a.display_name,
          athleteInitials: initials,
          type: "training",
          date: d,
          preview: text.slice(0, 120),
          sentiment: null,
        });
      }
    }
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default function CoachActivityPage() {
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [athleteCount, setAthleteCount] = React.useState(0);

  React.useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteRaw[]) => {
        setAthleteCount(data.length);
        setFeed(buildFeed(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-500/40 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative bg-surface-base text-white min-h-screen pb-24 pt-16">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.07),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-5 pt-4 flex items-center justify-between">
          <div>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              PowerFlow · Coach
            </p>
            <h1 className="mt-1 font-saira text-2xl font-extrabold uppercase tracking-tight text-white">
              Activity
            </h1>
          </div>
          <div className="text-right">
            <p className="font-saira text-xs text-zinc-400">{feed.length} entries</p>
            <p className="font-saira text-[10px] text-zinc-500">past 7 days</p>
          </div>
        </div>

        {/* Empty state */}
        {feed.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-surface-alt p-10 text-center mt-4">
            <p className="font-saira text-2xl mb-3">🤫</p>
            <p className="font-saira text-sm font-semibold text-zinc-300 mb-1">
              {athleteCount === 0 ? "No athletes yet" : "No activity this week"}
            </p>
            <p className="font-saira text-xs text-zinc-400 max-w-xs mx-auto">
              {athleteCount === 0
                ? "Share your invite link to get started."
                : "Your athletes haven't logged anything in the past 7 days."}
            </p>
          </div>
        )}

        {/* Feed */}
        {feed.length > 0 && (
          <div className="space-y-3">
            {feed.map((item) => (
              <Link
                key={item.type + item.id}
                href={`/coach/athletes?open=${item.athleteId}`}
                className="block rounded-2xl border border-white/6 bg-surface-alt p-4 hover:bg-white/[0.04] active:bg-white/[0.06] transition"
              >
                {/* Athlete + type row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center font-saira text-[9px] font-bold text-emerald-300 flex-shrink-0">
                    {item.athleteInitials}
                  </div>
                  <span className="font-saira text-xs font-semibold text-zinc-200 truncate">
                    {item.athleteName}
                  </span>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-[0.14em] ${
                    item.type === "journal"
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                      : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  }`}>
                    {item.type}
                  </span>
                  <span className="font-saira text-[10px] text-zinc-400 ml-auto flex-shrink-0">
                    {item.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {/* Content preview */}
                <p className="font-saira text-sm text-zinc-300 leading-relaxed line-clamp-3">
                  {item.preview}
                  {item.preview.length === 120 && "…"}
                </p>

                {/* Sentiment indicator */}
                {item.sentiment && (
                  <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-saira text-[9px] uppercase tracking-[0.14em] ${
                    item.sentiment === "positive"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : item.sentiment === "negative"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-white/5 text-zinc-400 border border-white/10"
                  }`}>
                    {item.sentiment}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
