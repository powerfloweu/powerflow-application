"use client";

import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Shown in the drag-handle row */
  title?: string;
  children: React.ReactNode;
  /**
   * Sticky footer rendered outside the scrollable body — always visible above
   * the iOS software keyboard. Pass action buttons here so they're never hidden.
   */
  footer?: React.ReactNode;
}

/**
 * Mobile-first bottom sheet / desktop modal.
 *
 * Mobile  (< md): slides up from the bottom, full-width, rounded top corners.
 * Desktop (≥ md): centred modal, max-w-lg, rounded all corners.
 *
 * Closes on backdrop click or Escape key.
 */
export default function BottomSheet({ open, onClose, title, children, footer }: Props) {
  // Trap Escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll when open.
  // On iOS, `overflow: hidden` on <body> blocks scroll inside overflow:auto children too.
  // Safer fix: lock via position:fixed (saves & restores scroll position).
  React.useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — above TabBar (z-50) */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet / modal — above backdrop */}
      <div
        role="dialog"
        aria-modal
        className={[
          // overflow-hidden: enforces max-height by clipping flex children that would
          // otherwise expand past the boundary; also clips rounded corners cleanly.
          "fixed z-[70] bg-surface-alt flex flex-col overflow-hidden",
          // Mobile: bottom sheet.
          // Use vh (not dvh) — dvh requires iOS 15.4+; vh works on all iOS versions.
          "bottom-0 inset-x-0 rounded-t-2xl min-h-[55vh] max-h-[90vh]",
          // Desktop: centred modal
          "md:min-h-0 md:inset-x-auto md:inset-y-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
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
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body.
            min-h-0: without this, flex items have min-height:auto and won't shrink
            below their content size — overflow-y never activates and content escapes
            past the sheet boundary instead of scrolling.
            overscrollBehavior: contain — prevents pull-to-refresh firing.
            WebkitOverflowScrolling: momentum scroll on iOS. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4"
          style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Sticky footer — always above the iOS keyboard */}
        {footer && (
          <div className="flex-shrink-0 border-t border-white/5 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
