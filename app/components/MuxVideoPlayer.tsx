"use client";

import React from "react";
import MuxPlayer from "@mux/mux-player-react";

interface Props {
  /** Mux public playback ID — the public ID from the Mux dashboard */
  playbackId?: string;
  title?: string;
  /** Called the first time the user starts playback — use to mark video step done */
  onPlay?: () => void;
  /**
   * Video aspect ratio.  "landscape" = 16:9 (default), "portrait" = 9:16
   * Switch to "portrait" when the eye-corrected vertical videos land.
   */
  aspect?: "landscape" | "portrait";
}

/**
 * Mux video player.
 *
 * Key design decisions:
 *
 * 1. React.memo — prevents the underlying <mux-player> web component from
 *    receiving new props on parent re-renders (e.g. when onPlay fires and
 *    updates progress state). Without this, the player resets/pauses
 *    immediately after the user presses play.
 *
 * 2. Stable handlePlay via ref pattern — onPlay prop is stored in a ref so
 *    handlePlay can be a zero-dep useCallback (stable reference across renders).
 *    This means even if the parent passes a new function instance on re-render,
 *    the Mux component never sees a prop change.
 */
const MuxVideoPlayer = React.memo(function MuxVideoPlayer({
  playbackId,
  title,
  onPlay,
  aspect = "landscape",
}: Props) {
  const firedRef = React.useRef(false);

  // Always keep the latest onPlay in a ref — allows handlePlay to be stable
  const onPlayRef = React.useRef(onPlay);
  onPlayRef.current = onPlay;

  // Stable callback: zero deps, reads onPlay from ref so no re-subscription needed
  const handlePlay = React.useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onPlayRef.current?.();
    }
  }, []);

  const isPlaceholder = !playbackId || playbackId.startsWith("YOUR_MUX");

  const aspectClass =
    aspect === "portrait"
      ? "aspect-[9/16] max-w-xs mx-auto" // vertical — centre & cap width
      : "aspect-video w-full";            // 16:9 default

  if (isPlaceholder) {
    return (
      <div
        className={`relative ${aspectClass} rounded-2xl border border-white/5 bg-surface-card flex items-center justify-center overflow-hidden`}
      >
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-xl">
            ▶
          </div>
          <p className="font-saira text-xs text-zinc-400 mb-1">Video coming soon</p>
          <p className="font-saira text-[10px] text-zinc-400">
            {title ?? "This week's video will be added shortly."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${aspectClass} rounded-2xl overflow-hidden border border-white/5 bg-black`}
    >
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title ?? "PowerFlow lesson" }}
        accentColor="#7c3aed"
        onPlay={handlePlay}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
});

export default MuxVideoPlayer;
