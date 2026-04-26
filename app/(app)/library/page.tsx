"use client";

import React from "react";

// ── Tool definitions ──────────────────────────────────────────────────────────
// audioUrl: swap null for the hosted file URL when recordings are ready.

const TOOLS = [
  {
    section: "Visualizations",
    items: [
      {
        id: "viz-squat",
        title: "Squat",
        tagline: "Mental rehearsal · Squat",
        icon: "S",
        color: "purple",
        duration: "~6 min",
        intro: "Mental imagery activates the same motor pathways as physical execution, reinforcing technique and building confidence without adding physical load. Consistent pre-lift rehearsal has been shown to improve performance accuracy and reduce competition anxiety — most effective when the imagery is vivid, first-person, and felt in the body rather than watched from the outside.",
        citations: [
          "Holmes & Collins (2001). The PETTLEP approach to motor imagery. Journal of Applied Sport Psychology, 13(1), 60–83.",
          "Driskell, Copper & Moran (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.",
        ],
        fileKey: "Visualization_Squat_EN_fin.m4a" as string | null,
      },
      {
        id: "viz-bench",
        title: "Bench",
        tagline: "Mental rehearsal · Bench Press",
        icon: "B",
        color: "purple",
        duration: "~6 min",
        intro: "Visualising the bench press with high sensory detail — including proprioception, timing, and force — primes the neuromuscular system for execution. Multi-sensory imagery has been shown to improve both technical precision and attentional focus under pressure, with the greatest gains seen when imagery closely matches the real performance environment.",
        citations: [
          "Ranganathan et al. (2004). From mental power to muscle power. Neuropsychologia, 42(7), 944–956.",
          "Holmes & Collins (2001). The PETTLEP approach to motor imagery. Journal of Applied Sport Psychology, 13(1), 60–83.",
        ],
        fileKey: "Visualization_Bench_EN_fin.m4a" as string | null,
      },
      {
        id: "viz-deadlift",
        title: "Deadlift",
        tagline: "Mental rehearsal · Deadlift",
        icon: "D",
        color: "purple",
        duration: "~6 min",
        intro: "The deadlift demands maximal tension from the first pull. Mental rehearsal helps establish the correct internal focus cues — brace, slack out, leg press — before getting under the bar, reducing error rates on heavy attempts. Research shows imagery is most effective when rehearsed at the actual speed of the movement.",
        citations: [
          "Guillot & Collet (2008). Construction of the motor imagery integrative model in sport. International Review of Sport and Exercise Psychology, 1(1), 31–44.",
          "Driskell, Copper & Moran (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.",
        ],
        fileKey: "Visualization_Deadlift_EN_fin.m4a" as string | null,
      },
    ],
  },
  {
    section: "Activation",
    items: [
      {
        id: "resource-activation",
        title: "Resource Activation",
        tagline: "Anchor your peak state",
        icon: "⚡",
        color: "amber",
        duration: "~8 min",
        intro: "Anchoring links a physical cue — such as a finger squeeze — to a rehearsed emotional state through classical conditioning. Repeated pairing of the cue with peak-state recall allows athletes to rapidly access optimal confidence and arousal on demand, reducing variability in psychological readiness across competition attempts.",
        citations: [
          "Cotterill (2010). Pre-performance routines in sport. International Review of Sport and Exercise Psychology, 3(2), 132–153.",
          "Lidor & Singer (2000). Teaching pre-performance routines to beginners. Journal of Physical Education, Recreation & Dance, 71(7), 34–36.",
        ],
        fileKey: "SikerPillanata_EN_fin.m4a" as string | null,
      },
    ],
  },
  {
    section: "Relaxation",
    items: [
      {
        id: "pmr",
        title: "Progressive Muscle Relaxation",
        tagline: "Full-body tension release",
        icon: "PR",
        color: "teal",
        duration: "~12 min",
        intro: "Developed by Edmund Jacobson (1938), PMR works by systematically tensing and releasing muscle groups to produce deep physiological and psychological relaxation. In sport contexts it has been shown to lower pre-competition anxiety, improve sleep quality before meets, and accelerate recovery between sessions — with measurable effects after just a few weeks of daily practice.",
        citations: [
          "Jacobson (1938). Progressive Relaxation. University of Chicago Press.",
          "Maynard et al. (1995). The effect of a somatic intervention on competitive state anxiety and performance. Journal of Sports Sciences, 13(4), 289–300.",
          "Carlson & Hoyle (1993). Efficacy of abbreviated progressive muscle relaxation training. Journal of Consulting and Clinical Psychology, 61(6), 1059–1067.",
        ],
        fileKey: "ProgRelax_EN_final.m4a" as string | null,
      },
      {
        id: "autogenic-training",
        title: "Autogenic Training",
        tagline: "Self-induced deep relaxation",
        icon: "AT",
        color: "teal",
        duration: "~10 min",
        intro: "Developed by psychiatrist Johannes Heinrich Schultz (1932), autogenic training uses silent self-directed formulas to induce sensations of heaviness and warmth, directly activating the parasympathetic nervous system. Systematic reviews show it significantly reduces anxiety and cortisol, improves sleep quality, and shortens recovery time — particularly effective during high-load competition blocks.",
        citations: [
          "Schultz & Luthe (1969). Autogenic Therapy. Grune & Stratton.",
          "Ernst & Kanji (2000). Autogenic training for stress and anxiety: A systematic review. Complementary Therapies in Medicine, 8(2), 106–110.",
          "Linden (1994). Autogenic training: A narrative and quantitative review of clinical outcome. Biofeedback and Self-Regulation, 19(3), 227–264.",
        ],
        fileKey: "AT_Base.m4a" as string | null,
      },
    ],
  },
];

type ToolColor = "purple" | "amber" | "teal";

const COLOR_MAP: Record<ToolColor, {
  border: string; bg: string; icon: string; num: string; cite: string; player: string;
}> = {
  purple: {
    border:  "border-purple-500/20",
    bg:      "bg-purple-500/[0.06]",
    icon:    "bg-purple-500/15 text-purple-300 border-purple-500/30",
    num:     "text-purple-400",
    cite:    "text-purple-400/60",
    player:  "bg-purple-600 hover:bg-purple-500",
  },
  amber: {
    border:  "border-amber-500/20",
    bg:      "bg-amber-500/[0.05]",
    icon:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
    num:     "text-amber-400",
    cite:    "text-amber-400/60",
    player:  "bg-amber-600 hover:bg-amber-500",
  },
  teal: {
    border:  "border-teal-500/20",
    bg:      "bg-teal-500/[0.05]",
    icon:    "bg-teal-500/15 text-teal-300 border-teal-500/30",
    num:     "text-teal-400",
    cite:    "text-teal-400/60",
    player:  "bg-teal-600 hover:bg-teal-500",
  },
};

// ── Visualization keywords ────────────────────────────────────────────────────

function VizKeywords({ toolId }: { toolId: string }) {
  const key = `viz-kw-${toolId}`;

  const [keywords, setKeywords] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
  });
  const [editing, setEditing] = React.useState(false);
  const [drafts, setDrafts]   = React.useState(["", "", ""]);

  const openEdit = () => {
    setDrafts([keywords[0] ?? "", keywords[1] ?? "", keywords[2] ?? ""]);
    setEditing(true);
  };

  const save = () => {
    const filtered = drafts.map((s) => s.trim()).filter(Boolean).slice(0, 3);
    setKeywords(filtered);
    localStorage.setItem(key, JSON.stringify(filtered));
    setEditing(false);
  };

  const placeholders = ["e.g. tight", "e.g. explode", "e.g. breathe"];

  if (editing || keywords.length === 0) {
    return (
      <div className="mb-5 rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-purple-300 mb-3">
          Your focus cues {keywords.length === 0 ? "(1–3 keywords)" : ""}
        </p>
        <div className="flex gap-2 mb-3 flex-wrap">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              value={drafts[i]}
              onChange={(e) => {
                const next = [...drafts];
                next[i] = e.target.value;
                setDrafts(next);
              }}
              placeholder={placeholders[i]}
              maxLength={20}
              className="flex-1 min-w-[80px] rounded-lg border border-white/10 bg-[#0D0B14] px-3 py-1.5 font-saira text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
            />
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={save}
            disabled={drafts.every((s) => !s.trim())}
            className="rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-4 py-1.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
          >
            Save
          </button>
          {keywords.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-saira text-[10px] text-zinc-600 hover:text-zinc-400 underline transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Your cues
        </p>
        <button
          type="button"
          onClick={openEdit}
          className="font-saira text-[10px] text-zinc-600 hover:text-purple-400 underline transition"
        >
          Edit
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 font-saira text-xs text-purple-300"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Audio player ──────────────────────────────────────────────────────────────
//
// Uses a direct public-bucket URL. The bucket must be set to Public in
// Supabase Storage → Buckets → tools → Edit bucket → Public on.
// play() is called synchronously inside the tap handler (iOS requirement).

const STORAGE_BASE =
  "https://njpmnglhgteihslgslou.supabase.co/storage/v1/object/public/tools/";

function AudioPlayer({ fileKey, color }: { fileKey: string | null; color: ToolColor }) {
  const audioRef  = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]         = React.useState(false);
  const [buffering, setBuffering]     = React.useState(false);
  const [errored, setErrored]         = React.useState(false);
  const [progress, setProgress]       = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration]       = React.useState(0);
  const c = COLOR_MAP[color];

  const url = fileKey ? `${STORAGE_BASE}${encodeURIComponent(fileKey)}` : null;

  // play() is called synchronously — no await in front of it (iOS requirement)
  const toggle = () => {
    const el = audioRef.current;
    if (!el || !url) return;
    if (playing) { el.pause(); setPlaying(false); return; }
    setBuffering(true);
    el.play()
      .catch(() => setErrored(true))
      .finally(() => setBuffering(false));
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    setCurrentTime(el.currentTime);
    setProgress(el.currentTime / el.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // ── Placeholder (no audio yet) ──────────────────────────────
  if (!url) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0D0B14] px-4 py-3.5">
        <div className="w-10 h-10 rounded-full border border-white/8 bg-white/[0.03] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-zinc-700" fill="currentColor" aria-hidden>
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
          </svg>
        </div>
        <div>
          <p className="font-saira text-xs font-semibold text-zinc-500">Guided audio</p>
          <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-700">
            Recording coming soon
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (errored) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5">
        <div className="w-10 h-10 rounded-full border border-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400 text-sm">
          ✕
        </div>
        <div>
          <p className="font-saira text-xs font-semibold text-red-400">Couldn't load audio</p>
          <button
            type="button"
            onClick={() => setErrored(false)}
            className="font-saira text-[10px] text-zinc-600 hover:text-zinc-400 underline transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Active player ───────────────────────────────────────────
  return (
    <div className="rounded-xl border border-white/10 bg-[#0D0B14] p-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
        onError={() => { setErrored(true); setPlaying(false); setBuffering(false); }}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        {/* Play / Pause / Buffering */}
        <button
          type="button"
          onClick={toggle}
          disabled={buffering}
          className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition disabled:opacity-70 ${c.player}`}
          aria-label={playing ? "Pause" : "Play"}
        >
          {buffering ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : playing ? (
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="white" aria-hidden>
              <rect x="5" y="3" width="3.5" height="14" rx="1"/>
              <rect x="11.5" y="3" width="3.5" height="14" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="w-4 h-4 ml-0.5" fill="white" aria-hidden>
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
            </svg>
          )}
        </button>

        {/* Progress + time */}
        <div className="flex-1 min-w-0">
          <div
            role="slider"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 rounded-full bg-white/10 cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className={`h-full rounded-full transition-[width] ${
                color === "purple" ? "bg-purple-400" :
                color === "amber"  ? "bg-amber-400"  : "bg-teal-400"
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-saira text-[10px] text-zinc-600 tabular-nums">{fmt(currentTime)}</span>
            <span className="font-saira text-[10px] text-zinc-600 tabular-nums">{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [openId, setOpenId]             = React.useState<string | null>(null);
  const [requestText, setRequestText]   = React.useState("");
  const [requestState, setRequestState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [favoriteRelaxId, setFavoriteRelaxId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("relax-favorite");
    if (stored) setFavoriteRelaxId(stored);
  }, []);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const toggleFavorite = (id: string) => {
    const next = favoriteRelaxId === id ? null : id;
    setFavoriteRelaxId(next);
    if (next) localStorage.setItem("relax-favorite", next);
    else localStorage.removeItem("relax-favorite");
  };

  const submitRequest = async () => {
    const text = requestText.trim();
    if (!text) return;
    setRequestState("sending");
    try {
      const res = await fetch("/api/tool-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setRequestState("sent");
      setRequestText("");
    } catch {
      setRequestState("error");
      setTimeout(() => setRequestState("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] px-4 pt-10 pb-8 sm:px-6 max-w-lg mx-auto">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          POWERFLOW · TOOLS
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
          Mental Tools
        </h1>
        <p className="font-saira text-sm text-zinc-500">
          Guided audio sessions · tap to expand
        </p>
      </div>

      {/* ── Tool sections ─────────────────────────────────────── */}
      <div className="space-y-8">
        {TOOLS.map(({ section, items }) => (
          <div key={section}>
            <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500 mb-3">
              {section}
            </p>
            <div className="space-y-2">
              {items.map((tool) => {
                const c    = COLOR_MAP[tool.color as ToolColor];
                const open = openId === tool.id;
                return (
                  <div
                    key={tool.id}
                    className={`rounded-2xl border transition-colors ${
                      open ? `${c.border} ${c.bg}` : "border-white/5 bg-[#17131F]"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => toggle(tool.id)}
                        className="flex-1 flex items-center gap-4 pl-5 pr-3 py-4 text-left"
                      >
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-saira text-[11px] font-bold border ${c.icon}`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-saira text-sm font-semibold text-white">{tool.title}</p>
                          <p className="font-saira text-[11px] text-zinc-500">
                            {tool.tagline}
                            <span className="ml-2 text-zinc-700">{tool.duration}</span>
                          </p>
                        </div>
                        <span className={`font-saira text-sm text-zinc-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
                          →
                        </span>
                      </button>

                      {/* Star — relaxation tools only */}
                      {section === "Relaxation" && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(tool.id)}
                          aria-label={favoriteRelaxId === tool.id ? "Remove favourite" : "Mark as favourite"}
                          className="pr-5 pl-2 py-4 flex-shrink-0 transition-colors"
                        >
                          <span className={`text-lg leading-none ${
                            favoriteRelaxId === tool.id
                              ? "text-amber-400"
                              : "text-zinc-700 hover:text-zinc-400"
                          }`}>
                            {favoriteRelaxId === tool.id ? "★" : "☆"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Expanded */}
                    {open && (
                      <div className="px-5 pb-6">
                        <div className={`w-full h-px mb-4 border-t ${c.border}`} />

                        {/* Intro */}
                        <p className="font-saira text-[13px] text-zinc-300 leading-relaxed mb-3">
                          {tool.intro}
                        </p>

                        {/* Citations */}
                        <ul className="space-y-1 mb-5">
                          {tool.citations.map((cite, i) => (
                            <li key={i} className="flex gap-2 items-baseline">
                              <span className={`text-[9px] flex-shrink-0 ${c.cite}`}>■</span>
                              <span className={`font-saira text-[10px] leading-snug italic ${c.cite}`}>{cite}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Personal cues — visualizations only */}
                        {section === "Visualizations" && (
                          <VizKeywords toolId={tool.id} />
                        )}

                        {/* Audio player */}
                        <AudioPlayer fileKey={tool.fileKey} color={tool.color as ToolColor} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Suggest a tool ───────────────────────────────────── */}
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-500 mb-3">
            Suggest a Tool
          </p>
          <div className="rounded-2xl border border-white/5 bg-[#17131F] p-5">
            {requestState === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
                  ✓
                </div>
                <p className="font-saira text-sm font-semibold text-emerald-300">Request sent</p>
                <p className="font-saira text-xs text-zinc-500 max-w-[240px]">
                  Thank you — we review every suggestion and add the most-requested tools.
                </p>
                <button
                  type="button"
                  onClick={() => setRequestState("idle")}
                  className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-400 underline transition"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <>
                <p className="font-saira text-xs text-zinc-400 mb-3">
                  Is there a mental skill or technique you'd like to see added? Let us know.
                </p>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="e.g. A pre-meet focus routine, self-talk scripts, handling nerves on the platform…"
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/10 bg-[#0D0B14] px-3 py-3 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark] mb-3"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="font-saira text-[10px] text-zinc-600 tabular-nums">
                    {requestText.length}/500
                  </span>
                  <button
                    type="button"
                    onClick={submitRequest}
                    disabled={!requestText.trim() || requestState === "sending"}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
                  >
                    {requestState === "sending" ? "Sending…" : requestState === "error" ? "Try again" : "Send request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
