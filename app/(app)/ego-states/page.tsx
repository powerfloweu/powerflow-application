"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import type { EgoState } from "@/lib/egoStates";
import { EGO_STATE_COLORS } from "@/lib/egoStates";

// ── Field textarea that PATCHes on blur ───────────────────────────────────────

function FieldTextarea({
  label,
  value,
  onSave,
  placeholder,
}: {
  label: string;
  value: string | null;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = React.useState(value ?? "");

  React.useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  return (
    <div className="mb-3">
      <label className="block font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-1">
        {label}
      </label>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onSave(local)}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-2 font-saira text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
      />
    </div>
  );
}

// ── Colour picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {EGO_STATE_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          onClick={() => onChange(c.hex)}
          title={c.label}
          className={`w-7 h-7 rounded-full border-2 transition ${
            value === c.hex
              ? "border-white scale-110"
              : "border-transparent hover:border-white/40"
          }`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}

// ── Ego State Card ────────────────────────────────────────────────────────────

function EgoStateCard({
  state,
  onUpdate,
  onDelete,
}: {
  state: EgoState;
  onUpdate: (id: string, patch: Partial<EgoState>) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const patch = async (fields: Partial<EgoState>) => {
    const res = await fetch(`/api/ego-states/${state.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      onUpdate(state.id, fields);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/ego-states/${state.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }
    onDelete(state.id);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-card mb-3 overflow-hidden">
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Color dot */}
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: state.color }}
        />

        <div className="flex-1 min-w-0">
          <p className="font-saira text-base font-bold text-white truncate">
            {state.name}
          </p>
          {state.domain && (
            <p className="font-saira text-[11px] text-zinc-400 truncate mt-0.5">
              {state.domain}
            </p>
          )}
          {state.body_feeling && (
            <p className="font-saira text-[10px] text-zinc-500 truncate mt-0.5">
              {state.body_feeling}
            </p>
          )}
        </div>

        {savedFlash && (
          <span className="font-saira text-[10px] text-emerald-400 flex-shrink-0">
            {t("egoStates.saveChanges")}
          </span>
        )}

        {/* Chevron */}
        <svg
          viewBox="0 0 16 16"
          className={`w-4 h-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded edit panel */}
      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          {/* Name */}
          <div className="mb-3 mt-4">
            <label className="block font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-1">
              {t("egoStates.fieldName")}
            </label>
            <input
              type="text"
              defaultValue={state.name}
              maxLength={80}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== state.name) patch({ name: v });
              }}
              className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-2 font-saira text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Colour */}
          <div className="mb-3">
            <label className="block font-saira text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-2">
              {t("egoStates.fieldColor")}
            </label>
            <ColorPicker
              value={state.color}
              onChange={(hex) => patch({ color: hex })}
            />
          </div>

          <FieldTextarea
            label={t("egoStates.fieldPosture")}
            value={state.posture}
            onSave={(v) => patch({ posture: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldBodyFeeling")}
            value={state.body_feeling}
            onSave={(v) => patch({ body_feeling: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldVoiceTone")}
            value={state.voice_tone}
            onSave={(v) => patch({ voice_tone: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldOrigin")}
            value={state.origin_story}
            onSave={(v) => patch({ origin_story: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldDomain")}
            value={state.domain}
            onSave={(v) => patch({ domain: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldShadow")}
            value={state.shadow_side}
            onSave={(v) => patch({ shadow_side: v || null })}
          />
          <FieldTextarea
            label={t("egoStates.fieldRitual")}
            value={state.activation_ritual}
            onSave={(v) => patch({ activation_ritual: v || null })}
          />

          {/* Delete */}
          <div className="mt-4 border-t border-white/5 pt-4">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="font-saira text-[11px] text-zinc-500 hover:text-rose-400 underline transition"
              >
                {t("common.delete")}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="font-saira text-[11px] text-zinc-400 flex-1">
                  {t("egoStates.deleteConfirm").replace("{name}", state.name)}
                </p>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="font-saira text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition disabled:opacity-50"
                >
                  {deleting ? "…" : t("common.delete")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="font-saira text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coach AI prompt dialog ────────────────────────────────────────────────────

function CoachPromptDialog({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-card p-6 mb-4">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-400 mb-2">
          Coach AI
        </p>
        <p className="font-saira text-base font-bold text-white mb-3">
          {t("egoStates.addNew")}
        </p>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 mb-5">
          <p className="font-saira text-sm text-purple-200">
            {t("egoStates.coachPrompt")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="flex-1 rounded-xl border border-purple-500 bg-purple-600 py-3 text-center font-saira text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            {t("egoStates.openCoachAI")}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-surface-panel py-3 font-saira text-sm text-zinc-400 hover:text-white transition"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EgoStatesPage() {
  const { t } = useT();
  const [states, setStates] = React.useState<EgoState[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/ego-states")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStates(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (id: string, patch: Partial<EgoState>) => {
    setStates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleDelete = (id: string) => {
    setStates((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-surface-base pb-10">
      {/* ── Sticky header ────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-surface-base border-b border-white/5 px-4 pt-10 pb-3 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/you"
            className="font-saira text-[11px] text-zinc-300 hover:text-purple-300 uppercase tracking-[0.18em] transition"
          >
            ← {t("common.back")}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrompt(true)}
            className="w-8 h-8 rounded-full border border-purple-500/40 bg-purple-600/20 flex items-center justify-center hover:bg-purple-600/40 transition text-purple-300 font-saira font-bold text-lg"
            aria-label={t("egoStates.addNew")}
          >
            +
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* ── Title ────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
            PowerFlow
          </p>
          <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white">
            {t("egoStates.title")}
          </h1>
          <p className="font-saira text-xs text-zinc-400 mt-1">
            {t("egoStates.subtitle")}
          </p>
        </div>

        {/* ── Loading skeleton ────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-surface-card h-20 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────── */}
        {!loading && states.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 px-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full border border-purple-500/20 bg-purple-500/10 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <h2 className="font-saira text-xl font-bold text-white mb-2">
              {t("egoStates.emptyTitle")}
            </h2>
            <p className="font-saira text-sm text-zinc-400 leading-relaxed max-w-xs mb-6">
              {t("egoStates.emptyDesc")}
            </p>
            <Link
              href="/chat"
              className="inline-block rounded-xl border border-purple-500 bg-purple-600 px-6 py-3 font-saira text-sm font-semibold text-white hover:bg-purple-500 transition"
            >
              {t("egoStates.mapCta")}
            </Link>
          </div>
        )}

        {/* ── State cards ─────────────────────────────────────── */}
        {!loading && states.length > 0 && (
          <div>
            {states.map((state) => (
              <EgoStateCard
                key={state.id}
                state={state}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowPrompt(true)}
              className="w-full mt-2 rounded-2xl border border-dashed border-purple-500/30 bg-surface-card py-4 font-saira text-sm text-purple-400 hover:border-purple-500/60 hover:text-purple-300 transition"
            >
              + {t("egoStates.addNew")}
            </button>
          </div>
        )}
      </div>

      {/* ── Coach AI prompt dialog ─────────────────────────── */}
      {showPrompt && <CoachPromptDialog onClose={() => setShowPrompt(false)} />}
    </div>
  );
}
