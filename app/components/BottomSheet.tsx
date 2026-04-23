"use client";

import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Shown in the drag-handle row */
  title?: string;
  children: React.ReactNode;
}

/**
 * Mobile-first bottom sheet / desktop modal.
 *
 * Mobile  (< md): slides up from the bottom, full-width, rounded top corners.
 * Desktop (≥ md): centred modal, max-w-lg, rounded all corners.
 *
 * Closes on backdrop click or Escape key.
 */
export default function BottomSheet({ open, onClose, title, children }: Props) {
  // Trap Escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet / modal */}
      <div
        role="dialog"
        aria-modal
        className={[
          "fixed z-50 bg-[#0F1117] flex flex-col",
          // Mobile: bottom sheet
          "bottom-0 inset-x-0 rounded-t-2xl max-h-[90dvh]",
          // Desktop: centred modal
          "md:inset-x-auto md:inset-y-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-lg md:rounded-2xl md:max-h-[80vh]",
        ].join(" ")}
      >
        {/* Drag handle + title */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/5">
          {/* Pill — mobile only */}
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-3 md:hidden" />
          {title && (
            <p className="font-saira text-sm font-semibold text-white leading-snug pr-8">
              {title}
            </p>
          )}
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
