"use client";

import React from "react";

interface Props {
  /** The Vidyard video UUID (last segment of the share URL) */
  uuid: string;
  /** Optional label shown in the placeholder */
  title?: string;
  /** Called the first time the user taps "play" — use to mark video step done */
  onPlay?: () => void;
}

/**
 * Lightweight Vidyard embed — lazy-loaded on first tap to keep the page snappy.
 * Uses the documented iframe embed (no JS SDK, no bundle bloat).
 * `onPlay` fires once when the user initiates playback.
 */
export default function VidyardPlayer({ uuid, title, onPlay }: Props) {
  const [loaded, setLoaded] = React.useState(false);
  const firedRef = React.useRef(false);

  const isPlaceholder = !uuid || uuid.startsWith("YOUR_VIDYARD_UUID");

  const handlePlay = () => {
    setLoaded(true);
    if (!firedRef.current && onPlay) {
      firedRef.current = true;
      onPlay();
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

  const src = `https://play.vidyard.com/${uuid}.html?autoplay=0`;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black">
      {loaded ? (
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
          onClick={handlePlay}
          className="group absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#17131F] to-[#0D0B14] hover:from-[#1e1828] transition"
        >
          <div className="w-16 h-16 rounded-full bg-purple-600/80 group-hover:bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/40 transition">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
          <span className="absolute bottom-3 left-3 font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Tap to play
          </span>
        </button>
      )}
    </div>
  );
}
