"use client";

import React from "react";

/** Section card with the Life (sky) accent. */
export function Card({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-alt p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300">
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

/** 1–10 slider with live value bubble. */
export function RatingSlider({ value, onChange }: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <input
        type="range" min={1} max={10} step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-sky-400"
      />
      <span className={`w-7 text-center font-saira text-sm font-bold tabular-nums ${
        value >= 7 ? "text-emerald-300" : value >= 5 ? "text-amber-300" : "text-rose-300"
      }`}>
        {value}
      </span>
    </div>
  );
}

/** Numeric input that maps "" ↔ null. */
export function NumInput({ value, onChange, placeholder, className = "", step }: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step ?? "any"}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={`rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60 ${className}`}
    />
  );
}

export function TextInput({ value, onChange, placeholder, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-zinc-700/60 bg-surface-input px-2 py-1.5 font-saira text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-500/60 ${className}`}
    />
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-saira text-xs font-semibold text-white transition ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-white/10 hover:border-white/25 px-3 py-1.5 font-saira text-xs text-zinc-300 transition ${className}`}
    >
      {children}
    </button>
  );
}

/** Badge for a check-in dimension's current cadence mode. */
export function ModeBadge({ mode }: { mode: "daily" | "weekly" | "focus" }) {
  const styles = {
    daily:  "text-sky-300 border-sky-500/30 bg-sky-500/10",
    weekly: "text-zinc-400 border-zinc-600/40 bg-white/5",
    focus:  "text-rose-300 border-rose-500/30 bg-rose-500/10",
  }[mode];
  const label = mode === "focus" ? "focus · every 3d" : mode;
  return (
    <span className={`rounded-full border px-2 py-0.5 font-saira text-[9px] font-semibold uppercase tracking-[0.14em] ${styles}`}>
      {label}
    </span>
  );
}
