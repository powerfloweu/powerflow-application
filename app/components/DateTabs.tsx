"use client";

import { ymdLocal } from "@/lib/date";

/** Returns the local YYYY-MM-DD string for `daysBack` days ago. */
export function offsetDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return ymdLocal(d);
}

interface DateTabsProps {
  selected: string;
  onChange: (date: string) => void;
  labels: { today: string; yesterday: string; dayBefore: string };
}

/**
 * Three-tab date switcher: "2 days ago | Yesterday | Today"
 *
 * Props:
 *   selected   — YYYY-MM-DD currently active
 *   onChange   — called when the user taps a tab
 *   labels     — localised button text (pass from `t(...)`)
 */
export function DateTabs({ selected, onChange, labels }: DateTabsProps) {
  const today     = ymdLocal();
  const yesterday = offsetDate(1);
  const dayBefore = offsetDate(2);

  const tabs = [
    { date: dayBefore, label: labels.dayBefore },
    { date: yesterday, label: labels.yesterday },
    { date: today,     label: labels.today },
  ];

  return (
    <div className="flex gap-1 mb-6 rounded-xl bg-white/[0.04] border border-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.date}
          type="button"
          onClick={() => onChange(tab.date)}
          className={`flex-1 rounded-lg py-1.5 font-saira text-[11px] font-semibold uppercase tracking-wider transition ${
            selected === tab.date
              ? "bg-purple-600/80 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
