"use client";

import React from "react";
import {
  computeDimStatuses, todayYmd,
  type LifeConfig, type CheckinRow,
} from "@/lib/life";
import { Card, RatingSlider, PrimaryButton, ModeBadge } from "./shared";

interface Props {
  config: LifeConfig;
  checkins: CheckinRow[];
  saveCheckin: (scores: Record<string, number>, note?: string) => Promise<boolean>;
}

export default function CheckinTab({ config, checkins, saveCheckin }: Props) {
  const today = todayYmd();
  const statuses = computeDimStatuses(config.dimensions, checkins, today);
  const todayRow = checkins.find((c) => c.checkin_date === today);

  // Only touched dims get saved — untouched sliders don't fabricate scores.
  const [touched, setTouched] = React.useState<Record<string, number>>({});
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const submit = async () => {
    if (!Object.keys(touched).length && !note.trim()) return;
    setSaving(true);
    const ok = await saveCheckin(touched, note.trim() || undefined);
    setSaving(false);
    if (ok) {
      setTouched({});
      setNote("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Full check-in">
        {config.dimensions.length === 0 ? (
          <p className="font-saira text-sm text-zinc-400">Add dimensions in Setup.</p>
        ) : (
          <div className="space-y-4">
            {statuses.map((s) => {
              const loggedToday = typeof todayRow?.scores?.[s.dim.id] === "number" && !(s.dim.id in touched);
              return (
                <div key={s.dim.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-saira text-sm text-zinc-100">{s.dim.label}</p>
                      <ModeBadge mode={s.mode} />
                      {s.due && !loggedToday && (
                        <span className="font-saira text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300">due</span>
                      )}
                      {loggedToday && (
                        <span className="font-saira text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-400">logged today ✓</span>
                      )}
                    </div>
                    {s.lastScore !== null && (
                      <span className="font-saira text-[10px] text-zinc-500">
                        last: {s.lastScore}{s.lastDate ? ` · ${s.lastDate}` : ""}
                      </span>
                    )}
                  </div>
                  <RatingSlider
                    value={touched[s.dim.id] ?? todayRow?.scores?.[s.dim.id] ?? s.lastScore ?? 5}
                    onChange={(v) => setTouched((p) => ({ ...p, [s.dim.id]: v }))}
                  />
                </div>
              );
            })}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth noting about how you're doing?"
              rows={3}
              className="w-full rounded-xl border border-zinc-700/60 bg-surface-input px-3 py-2.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60 resize-none"
            />

            <div className="flex items-center gap-3">
              <PrimaryButton onClick={submit} disabled={saving || (!Object.keys(touched).length && !note.trim())}>
                {saving ? "Saving…" : `Save check-in${Object.keys(touched).length ? ` (${Object.keys(touched).length})` : ""}`}
              </PrimaryButton>
              {savedFlash && <span className="font-saira text-xs text-emerald-400">Saved ✓</span>}
            </div>
          </div>
        )}
      </Card>

      <Card title="How the adaptive cadence works">
        <p className="font-saira text-xs text-zinc-400 leading-relaxed">
          Daily items ask every day. Weekly items ask every 7 days — but if an item scores
          below its threshold twice in a row, it switches to <span className="text-rose-300">focus mode</span> and
          asks every 3 days until one good score sends it back to weekly.
        </p>
      </Card>
    </div>
  );
}
