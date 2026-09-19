"use client";

/**
 * Barcode scanner — React wrapper around @zxing/browser.
 *
 * Lazily imports ZXing only when the scanner is opened. Uses rear camera
 * with continuous autofocus at 1920×1080. Requires two consecutive identical
 * reads before accepting (prevents format confusion between EAN-13/UPC-A).
 *
 * Ported from tamas60/vendor-src/scanner.js + app.js barcode flow.
 */

import React from "react";

interface Props {
  onResult: (ean: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = React.useRef(false);
  const [msg, setMsg] = React.useState("Starting camera…");
  const [msgErr, setMsgErr] = React.useState(false);
  const [manualEan, setManualEan] = React.useState("");

  const stopScan = React.useCallback(() => {
    doneRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch { /* ignore */ }
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function start() {
      // Lazily import ZXing
      let BrowserMultiFormatOneDReader: typeof import("@zxing/browser").BrowserMultiFormatOneDReader;
      let BarcodeFormat: typeof import("@zxing/library").BarcodeFormat;
      let DecodeHintType: typeof import("@zxing/library").DecodeHintType;
      try {
        const [browser, library] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        BrowserMultiFormatOneDReader = browser.BrowserMultiFormatOneDReader;
        BarcodeFormat = library.BarcodeFormat;
        DecodeHintType = library.DecodeHintType;
      } catch {
        setMsg("Barcode scanner could not load — enter the code manually.");
        setMsgErr(true);
        return;
      }
      if (cancelled || doneRef.current) return;

      // Get camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        setMsg("No camera access — enter the code manually.");
        setMsgErr(true);
        return;
      }
      if (cancelled || doneRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = stream;

      // Continuous autofocus
      const track = stream.getVideoTracks()[0];
      if (track?.getCapabilities) {
        try {
          const caps = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[] };
          if (caps.focusMode?.includes("continuous")) {
            await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] });
          }
        } catch { /* unsupported, fine */ }
      }

      try { await video.play(); } catch (e) {
        setMsg(`Camera won't start (${(e as Error)?.name || "unknown"}). Try closing and reopening the browser.`);
        setMsgErr(true);
        stopScan();
        return;
      }

      // Wait for first frame (black-screen detection)
      const gotFrame = await new Promise<boolean>((resolve) => {
        if (video.videoWidth > 0) { resolve(true); return; }
        const onData = () => { clearTimeout(to); resolve(true); };
        const to = setTimeout(() => { video.removeEventListener("loadeddata", onData); resolve(false); }, 3000);
        video.addEventListener("loadeddata", onData, { once: true });
      });
      if (cancelled || doneRef.current) return;
      if (!gotFrame) {
        setMsg("Camera is running but not sending frames. Check your privacy settings.");
        setMsgErr(true);
        stopScan();
        return;
      }

      // Set up ZXing reader
      const hints = new Map<number, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatOneDReader(hints, { delayBetweenScanAttempts: 150 });

      const scanCanvas = document.createElement("canvas");
      const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true })!;
      let attempts = 0;
      let pendingCode: string | null = null;
      let pendingCount = 0;

      function scanTick() {
        if (cancelled || doneRef.current || !video) return;
        const vw = video.videoWidth, vh = video.videoHeight;
        if (vw > 0 && vh > 0) {
          const MAX = 1280;
          const scale = Math.min(1, MAX / Math.max(vw, vh));
          scanCanvas.width = Math.round(vw * scale);
          scanCanvas.height = Math.round(vh * scale);
          scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
          let result: { getText: () => string } | null = null;
          try {
            result = reader.decodeFromCanvas(scanCanvas) as { getText: () => string } | null;
          } catch (e) {
            // NotFoundException is normal
            if ((e as Error)?.name !== "NotFoundException") {
              attempts++;
              if (attempts % 40 === 0) {
                setMsg("Having trouble reading — try entering the code manually.");
                setMsgErr(true);
              }
            }
          }
          if (result && !doneRef.current) {
            const code = result.getText();
            if (code === pendingCode) { pendingCount++; } else { pendingCode = code; pendingCount = 1; }
            if (pendingCount >= 2) {
              stopScan();
              if (navigator.vibrate) { try { navigator.vibrate(60); } catch { /* */ } }
              onResult(code);
              return;
            }
          } else {
            pendingCode = null; pendingCount = 0;
          }
        }
        attempts++;
        if (attempts === 60) setMsg("Still looking — try holding the barcode closer (10–15 cm), straight, in good light.");
        timerRef.current = setTimeout(scanTick, 150);
      }

      scanTick();
      setMsg("Hold the barcode inside the frame.");
      setMsgErr(false);
    }

    start();
    return () => { cancelled = true; stopScan(); };
  }, [onResult, stopScan]);

  const manualSubmit = () => {
    const v = manualEan.replace(/\D/g, "");
    if (v.length < 8) { setMsg("At least 8 digits required."); setMsgErr(true); return; }
    stopScan();
    onResult(v);
  };

  return (
    <div className="space-y-3">
      {/* Camera preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {/* Scan frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-64 rounded-lg border-2 border-emerald-400/60" />
        </div>
      </div>

      {/* Status */}
      <p className={`text-center text-xs font-saira ${msgErr ? "text-red-400" : "text-zinc-400"}`}>
        {msg}
      </p>

      {/* Manual entry */}
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Or type the number below the barcode
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 5449000000996"
            value={manualEan}
            onChange={(e) => setManualEan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && manualSubmit()}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
          />
          <button
            onClick={manualSubmit}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* Back */}
      <button
        onClick={() => { stopScan(); onClose(); }}
        className="w-full rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white"
      >
        ← Back
      </button>
    </div>
  );
}
