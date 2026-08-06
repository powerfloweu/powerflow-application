"use client";

import React from "react";

// ── Any-sheet-open registry ─────────────────────────────────────────────────
// A minimal module-level pub/sub so other shell chrome (e.g. the floating
// notification-permission banner in AppShell) can hide itself while a
// BottomSheet is open anywhere in the app, without every call site having to
// thread that state through props or React context. Every BottomSheet
// instance (including ones nested inside other components, like
// NotificationModal) registers itself for as long as it's open.
let openSheetCount = 0;
const openSheetListeners = new Set<(anyOpen: boolean) => void>();

function notifySheetListeners() {
  const anyOpen = openSheetCount > 0;
  openSheetListeners.forEach((listener) => listener(anyOpen));
}

/** Subscribe to "is any BottomSheet currently open" changes. Returns an unsubscribe fn. */
export function subscribeAnySheetOpen(listener: (anyOpen: boolean) => void): () => void {
  openSheetListeners.add(listener);
  listener(openSheetCount > 0);
  return () => { openSheetListeners.delete(listener); };
}

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
 *   - Drag the handle up   → snaps to full height (90dvh)
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
  // Kept in sync via a real matchMedia listener rather than reading
  // window.innerWidth inside the pointer handler — the two must agree at
  // exactly 768px and across rotation, or drag-to-resize silently breaks
  // right when the layout itself switches to the desktop modal.
  const isDesktopRef = React.useRef(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => { isDesktopRef.current = mq.matches; };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset expanded state when sheet opens/closes
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);

  // Register with the any-sheet-open pub/sub for as long as this instance is open.
  React.useEffect(() => {
    if (!open) return;
    openSheetCount += 1;
    notifySheetListeners();
    return () => {
      openSheetCount -= 1;
      notifySheetListeners();
    };
  }, [open]);

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

  // Undo whatever an in-progress drag left on the DOM node — shared by the
  // normal pointerup path and the cancel/lost-capture paths so a gesture
  // stolen by the OS (edge swipe, incoming call/notification) can never
  // leave the sheet with its transition disabled or a stale inline height,
  // which previously made the next open animate from the wrong size.
  const clearDragStyles = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.height     = "";
    }
  };

  // ── Drag-to-resize handle ─────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only on the handle area; ignore desktop (md+)
    if (isDesktopRef.current) return;
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
    // Imperative inline height during the drag — this correctly overrides
    // the class-driven height below (inline style beats a class always),
    // which is what makes dragging down actually shrink the sheet now.
    if (sheetRef.current) sheetRef.current.style.height = `${clamped}px`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || startY.current === null) return;
    isDragging.current = false;

    const dy      = startY.current - e.clientY;
    const winH    = window.innerHeight;
    const current = sheetRef.current?.getBoundingClientRect().height ?? 0;

    clearDragStyles();

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

  // iOS can steal an in-progress gesture (edge-swipe back, incoming call,
  // Control Center). Without this, isDragging stays true forever, the
  // transition stays disabled, and the stale inline height persists.
  const onPointerCancel = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startY.current = null;
    clearDragStyles();
  };

  if (!open) return null;

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
          "pf-sheet",
          expanded ? "pf-sheet-expanded" : "",
          "fixed z-[70] bg-surface-alt flex flex-col overflow-hidden transition-[height] duration-300 ease-out",
          // Mobile: bottom sheet
          "bottom-0 inset-x-0 rounded-t-2xl",
          // Desktop: centred modal
          "md:transition-none md:inset-x-auto md:inset-y-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-lg md:rounded-2xl",
        ].join(" ")}
      >
        {/* Drag handle + title — the whole header is the drag target on mobile */}
        <div
          className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/5 md:cursor-default cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
        >
          {/* Pill */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 md:hidden" />
          {title && (
            <p className="font-saira text-sm font-semibold text-white leading-snug pr-14">
              {title}
            </p>
          )}
          {/* Close button — 44x44 hit target (visual glyph stays small) */}
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()} // don't trigger drag
            aria-label="Close"
            className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition"
          >
            <span className="text-base leading-none" aria-hidden>✕</span>
          </button>
        </div>

        {/* Scrollable body — bottom safe-area inset applies even without a
            footer, so the last row never sits under the iOS home bar. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
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

      {/* Height is state-driven (collapsed/expanded) instead of fighting an
          inline style against a min-height utility. vh is the base value;
          browsers that understand dvh (the visible/small viewport, correct
          under a visible mobile Safari URL bar) get it via @supports. */}
      <style jsx>{`
        .pf-sheet {
          height: 60vh;
          max-height: 93vh;
        }
        .pf-sheet.pf-sheet-expanded {
          height: 90vh;
        }
        @supports (height: 100dvh) {
          .pf-sheet {
            height: 60dvh;
            max-height: 93dvh;
          }
          .pf-sheet.pf-sheet-expanded {
            height: 90dvh;
          }
        }
        @media (min-width: 768px) {
          .pf-sheet,
          .pf-sheet.pf-sheet-expanded {
            height: auto;
            min-height: 0;
            max-height: 80vh;
          }
        }
        @supports (height: 100dvh) {
          @media (min-width: 768px) {
            .pf-sheet,
            .pf-sheet.pf-sheet-expanded {
              max-height: 80dvh;
            }
          }
        }
      `}</style>
    </>
  );
}
