"use client";

import React from "react";

interface Props {
  /** The Vidyard video UUID (last segment of the share URL) */
  uuid: string;
  title?: string;
  /** Called the first time the user taps play — use to mark video step done */
  onPlay?: () => void;
}

/**
 * Vidyard video embed with iOS PWA fallback.
 *
 * Regular browser → lazy-loaded iframe (standard embed).
 * iOS standalone (added to home screen) → tapping opens the Vidyard share
 * URL in Safari, because WKWebView blocks third-party iframes.
 *
 * onPlay fires before navigation/load in both cases.
 */
export default function VidyardPlayer({ uuid, title, onPlay }: Props) {
  const [loaded, setLoaded] = React.useState(false);
  const firedRef = React.useRef(false);

  // Detect iOS standalone / WKWebView context
  const isIOSStandalone = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      // iOS "Add to Home Screen" sets navigator.standalone
      (window.navigator as { standalone?: boolean }).standalone === true ||
      // Broader standalone PWA check
      window.matchMedia("(display-mode: standalone)").matches
    );
  }, []);

  const isPlaceholder = !uuid || uuid.startsWith("YOUR_VIDYARD_UUID");

  const fireOnPlay = () => {
    if (!firedRef.current && onPlay) {
      firedRef.current = true;
      onPlay();
    }
  };

  const handleTap = () => {
    fireOnPlay();
    if (isIOSStandalone) {
      // Open in Safari — iframes don't work in WKWebView standalone mode
      window.open(`https://share.vidyard.com/watch/${uuid}`, "_blank", "noopener");
    } else {
      setLoaded(true);
    }
  };

  if (isPlaceholder) {
    return (
      <div className="relative w-full aspect-video rounded-2xl border border-white/5 bg-[#17131F] flex items-center justify-center overflow-hidden">
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-xl">
            ▶
          </div>
          <p className="font-saira text-xs text-zinc-400 mb-1">Video coming soon</p>
          <p className="font-saira text-[10px] text-zinc-600">
            {title ?? "This week's video will be added shortly."}
          </p>
        </div>
      </div>
    );
  }

  const src = `https://play.vidyard.com/${uuid}?autoplay=0`;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black">
      {loaded && !isIOSStandalone ? (
        <iframe
          src={src}
          title={title ?? "PowerFlow lesson"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={handleTap}
          className="group absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#17131F] to-[#0D0B14] hover:from-[#1e1828] transition gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-purple-600/80 group-hover:bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/40 transition">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
          {isIOSStandalone && (
            <span className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Opens in Safari ↗
            </span>
          )}
          {!isIOSStandalone && (
            <span className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Tap to play
            </span>
          )}
        </button>
      )}
    </div>
  );
}
