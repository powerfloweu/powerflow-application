"use client";

/**
 * /reflections — index of the reflection sets this athlete's coach has sent.
 * Used when a coach sends several sets at once; the Today card links here
 * when there's more than one to show. Each row deep-links to
 * /reflections/[setId], the actual answering view.
 */

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { ReflectionSetRow } from "@/lib/reflections";

type SetWithProgress = ReflectionSetRow & { answeredCount: number };

export default function ReflectionsIndexPage() {
  const { t } = useT();
  const [sets, setSets] = React.useState<SetWithProgress[] | null>(null);

  React.useEffect(() => {
    fetch("/api/reflections")
      .then((r) => (r.ok ? r.json() : []))
      .then(async (rows: ReflectionSetRow[]) => {
        if (!Array.isArray(rows)) { setSets([]); return; }
        // The list endpoint doesn't include answers — fetch each set's detail
        // in parallel to compute an informational progress count. Set counts
        // per athlete are small (a handful at most), so this fan-out is cheap.
        const withProgress = await Promise.all(
          rows.map(async (row) => {
            try {
              const res = await fetch(`/api/reflections/${row.id}`);
              if (!res.ok) return { ...row, answeredCount: 0 };
              const detail = await res.json() as { answers: Record<string, string> | null };
              const answered = row.questions.filter((q) => (detail.answers?.[q.id] ?? "").trim().length > 0).length;
              return { ...row, answeredCount: answered };
            } catch {
              return { ...row, answeredCount: 0 };
            }
          }),
        );
        setSets(withProgress);
      })
      .catch((err) => {
        console.error("[reflections] list load failed", err);
        setSets([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-24">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          {t("reflections.pageLabel")}
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-6">
          {t("reflections.title")}
        </h1>

        {sets === null && (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-purple-400/40 border-t-purple-400 animate-spin" />
          </div>
        )}

        {sets !== null && sets.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-surface-card p-6 text-center">
            <p className="font-saira text-sm font-semibold text-zinc-200 mb-1">{t("reflections.emptyTitle")}</p>
            <p className="font-saira text-xs text-zinc-400">{t("reflections.emptyBody")}</p>
          </div>
        )}

        {sets !== null && sets.length > 0 && (
          <div className="space-y-3">
            {sets.map((s) => (
              <Link
                key={s.id}
                href={`/reflections/${s.id}`}
                className="block rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 hover:border-purple-400/40 hover:bg-purple-500/[0.08] transition"
              >
                <p className="font-saira text-sm font-semibold text-zinc-100 mb-1">{s.title}</p>
                {s.intro && (
                  <p className="font-saira text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-2">{s.intro}</p>
                )}
                <p className="font-saira text-[11px] text-purple-300">
                  {t("reflections.progress", { done: s.answeredCount, total: s.questions.length })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
