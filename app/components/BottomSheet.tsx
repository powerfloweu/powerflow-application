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
 *   - Drag the handle up   → snaps to full height (90vh)
 *   - Drag the handle down → closes if dragged > 80px, else snaps back
 * Desktop (≥ md): centred modal, max-w-lg, rounded all corners.
 *
 * Closes on backdrop click or Escape key.
 */
export default function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const sheetRef    = React.useRef<HTMLDivElement>(null);
  const startY      = React.useRef<number | null>(null);
  const startHeight = React.useRef<number>(0);
  const isDragging  = React.useRef(false);

  // Reset expanded state when sheet opens/closes
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);

  // Trap Escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll on iOS via position:fixed
  React.useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top      = `-${scrollY}px`;
    document.body.style.left     = "0";
    document.body.style.right    = "0";
    return () => {
      document.body.style.position = "";
      document.body.style.top      = "";
      document.body.style.left     = "";
      document.body.style.right    = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // ── Drag-to-resize handle ─────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only on the handle area; ignore desktop (md+)
    if (window.innerWidth >= 768) return;
    startY.current      = e.clientY;
    startHeight.current = sheetRef.current?.getBoundingClientRect().height ?? 0;
    isDragging.current  = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    // Disable transition while dragging for a live feel
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || startY.current === null) return;
    const dy         = startY.current - e.clientY;           // +ve = dragging up
    const newHeight  = startHeight.current + dy;
    const winH       = window.innerHeight;
    const clamped    = Math.min(Math.max(newHeight, winH * 0.38), winH * 0.93);
    if (sheetRef.current) sheetRef.current.style.height = `${clamped}px`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || startY.current === null) return;
    isDragging.current = false;

    const dy      = startY.current - e.clientY;
    const winH    = window.innerHeight;
    const current = sheetRef.current?.getBoundingClientRect().height ?? 0;

    // Re-enable transition for the snap animation
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.height     = "";
    }

    if (dy < -80) {
      // Dragged down hard → close
      onClose();
    } else if (current > winH * 0.72) {
      // Past the threshold → snap to full
      setExpanded(true);
    } else {
      // Below threshold → snap back to compact
      setExpanded(false);
    }

    startY.current = null;
  };

  if (!open) return null;

  const minH = expanded ? "min-h-[90vh]" : "min-h-[60vh]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet / modal */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        className={[
          "fixed z-[70] bg-surface-alt flex flex-col overflow-hidden transition-[min-height] duration-300 ease-out",
          // Mobile: bottom sheet
          `bottom-0 inset-x-0 rounded-t-2xl ${minH} max-h-[93vh]`,
          // Desktop: centred modal
          "md:transition-none md:min-h-0 md:inset-x-auto md:inset-y-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-lg md:rounded-2xl md:max-h-[80vh]",
        ].join(" ")}
      >
        {/* Drag handle + title — the whole header is the drag target on mobile */}
        <div
          className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/5 md:cursor-default cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Pill */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 md:hidden" />
          {title && (
            <p className="font-saira text-sm font-semibold text-white leading-snug pr-8">
              {title}
            </p>
          )}
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()} // don't trigger drag
            aria-label="Close"
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4"
          style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-white/5 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
