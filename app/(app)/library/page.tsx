"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hasAccess, type PlanTier } from "@/lib/plan";
import { useT, type Locale } from "@/lib/i18n";
import VizLiveSession from "@/app/components/VizLiveSession";
import VizUpload from "@/app/components/VizUpload";

const SECTION_KEY: Record<string, string> = {
  Relaxation: "library.sectionRelaxation",
  Visualizations: "library.sectionVisualizations",
  Activation: "library.sectionActivation",
  Affirmations: "library.sectionAffirmations",
  Focus: "library.sectionFocus",
  Competition: "library.sectionCompetition",
};

// ── Tool definitions ──────────────────────────────────────────────────────────
// Sections are ordered by minTier so unlocked content always appears first.
//
// fileKey: per-locale filenames in the Supabase "tools" storage bucket.
// EN files live at the bucket root; DE/HU files live in de/ and hu/ subfolders.
// AudioPlayer falls back to "en" if a locale-specific file hasn't been added yet.
// Add DE/HU entries here once the recordings are uploaded to Supabase.

type FileKeys = Partial<Record<Locale, string>>;

const TOOLS: Array<{
  section: string;
  /** Minimum plan tier required to use this section */
  minTier: PlanTier;
  items: Array<{
    id: string;
    /** i18n key segment — used as t(`tools.${i18nKey}.title`) etc. */
    i18nKey: string;
    icon: string;
    color: string;
    duration: string;
    citations: string[];
    fileKey: FileKeys | null;
    /** If true, shows the VizKeywords personalisation UI when expanded */
    usesVizKeywords?: boolean;
  }>;
}> = [
  // ── Opener+ (available to all tiers) ─────────────────────────────────────
  {
    section: "Relaxation",
    minTier: "opener",
    items: [
      {
        id: "pmr",
        i18nKey: "pmr",
        icon: "PR",
        color: "teal",
        duration: "~12 min",
        citations: [
          "Jacobson (1938). Progressive Relaxation. University of Chicago Press.",
          "Maynard et al. (1995). The effect of a somatic intervention on competitive state anxiety and performance. Journal of Sports Sciences, 13(4), 289–300.",
          "Carlson & Hoyle (1993). Efficacy of abbreviated progressive muscle relaxation training. Journal of Consulting and Clinical Psychology, 61(6), 1059–1067.",
        ],
        fileKey: {
          en: "ProgRelax_EN_final.m4a",
          de: "PR Grundlage ohne Musik.MP3",
          hu: "ProgRelax.mp3",
        },
      },
      {
        id: "autogenic-training",
        i18nKey: "at",
        icon: "AT",
        color: "teal",
        duration: "~10 min",
        citations: [
          "Schultz & Luthe (1969). Autogenic Therapy. Grune & Stratton.",
          "Ernst & Kanji (2000). Autogenic training for stress and anxiety: A systematic review. Complementary Therapies in Medicine, 8(2), 106–110.",
          "Linden (1994). Autogenic training: A narrative and quantitative review of clinical outcome. Biofeedback and Self-Regulation, 19(3), 227–264.",
        ],
        fileKey: {
          en: "AT_Base.m4a",
          de: "AT Grundlage ohne Musik.MP3",
          hu: "AutogenTrain_Alap.mp3",
        },
      },
    ],
  },

  // ── Second+ ───────────────────────────────────────────────────────────────
  {
    section: "Visualizations",
    minTier: "second",
    items: [
      {
        id: "viz-squat",
        i18nKey: "vizSquat",
        icon: "S",
        color: "purple",
        duration: "~6 min",
        citations: [
          "Holmes & Collins (2001). The PETTLEP approach to motor imagery. Journal of Applied Sport Psychology, 13(1), 60–83.",
          "Driskell, Copper & Moran (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.",
        ],
        fileKey: {
          en: "Visualization_Squat_EN_fin.m4a",
          de: "SQ Visualisierung ohne Musik.MP3",
          hu: "Vizualizacio_Guggolas.mp3",
        },
        usesVizKeywords: true,
      },
      {
        id: "viz-bench",
        i18nKey: "vizBench",
        icon: "B",
        color: "purple",
        duration: "~6 min",
        citations: [
          "Ranganathan et al. (2004). From mental power to muscle power. Neuropsychologia, 42(7), 944–956.",
          "Holmes & Collins (2001). The PETTLEP approach to motor imagery. Journal of Applied Sport Psychology, 13(1), 60–83.",
        ],
        fileKey: {
          en: "Visualization_Bench_EN_fin.m4a",
          de: "BP Visualisierung ohne Musik.MP3",
          hu: "Vizualizacio_Fekvenyomas.mp3",
        },
        usesVizKeywords: true,
      },
      {
        id: "viz-deadlift",
        i18nKey: "vizDeadlift",
        icon: "D",
        color: "purple",
        duration: "~6 min",
        citations: [
          "Guillot & Collet (2008). Construction of the motor imagery integrative model in sport. International Review of Sport and Exercise Psychology, 1(1), 31–44.",
          "Driskell, Copper & Moran (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.",
        ],
        fileKey: {
          en: "Visualization_Deadlift_EN_fin.m4a",
          de: "Kreuzheben Visualisierung ohne Musik.MP3",
          hu: "Vizualizacio_Felhuzas.mp3",
        },
        usesVizKeywords: true,
      },
    ],
  },
  {
    section: "Activation",
    minTier: "second",
    items: [
      {
        id: "resource-activation",
        i18nKey: "resourceActivation",
        icon: "⚡",
        color: "amber",
        duration: "~8 min",
        citations: [
          "Cotterill (2010). Pre-performance routines in sport. International Review of Sport and Exercise Psychology, 3(2), 132–153.",
          "Lidor & Singer (2000). Teaching pre-performance routines to beginners. Journal of Physical Education, Recreation & Dance, 71(7), 34–36.",
        ],
        fileKey: {
          en: "SikerPillanata_EN_fin.m4a",
          de: "Der Moment des Erfolgs ohne Musik.MP3",
          hu: "SikerPillanata.mp3",
        },
      },
    ],
  },
  {
    section: "Affirmations",
    minTier: "second",
    items: [
      {
        id: "affirmations",
        i18nKey: "affirmations",
        icon: "✦",
        color: "emerald",
        duration: "",
        citations: [
          "Hatzigeorgiadis et al. (2011). Self-talk and sports performance: A meta-analysis. Perspectives on Psychological Science, 6(4), 348–356.",
          "Hardy (2006). Speaking clearly: A critical review of the self-talk literature. Psychology of Sport and Exercise, 7(1), 81–97.",
          "Theodorakis et al. (2000). Motivational vs. instructional self-talk effects on performance. The Sport Psychologist, 14(3), 253–272.",
        ],
        fileKey: null,
      },
    ],
  },

  // ── PR only ───────────────────────────────────────────────────────────────
  {
    section: "Focus",
    minTier: "pr",
    items: [
      {
        id: "barrier",
        i18nKey: "barrier",
        icon: "▣",
        color: "amber",
        duration: "~8 min",
        citations: [
          "Moran (1996). The Psychology of Concentration in Sport Performers. Psychology Press.",
          "Nideffer (1976). Test of attentional and interpersonal style. Journal of Personality and Social Psychology, 34(3), 394–404.",
          "Schmid & Peper (1993). Strategies for training concentration. In J. Williams (Ed.), Applied Sport Psychology (pp. 262–273).",
        ],
        fileKey: {
          en: "Barriers_EN_Final.m4a",
          de: "Fokus ohne Musik.MP3",
          hu: "EdezesNap_MentalTraining.mp3",
        },
        usesVizKeywords: true,
      },
      {
        id: "hibajavitas",
        i18nKey: "cinemaScreening",
        icon: "◫",
        color: "purple",
        duration: "~10 min",
        citations: [
          "Orlick (2000). In Pursuit of Excellence. Human Kinetics.",
          "Vealey & Greenleaf (2010). Seeing is believing: Understanding and using imagery in sport. In J. Williams (Ed.), Applied Sport Psychology: Personal Growth to Peak Performance (pp. 267–304).",
          "Munroe-Chandler & Hall (2004). The effects of a mental skills training program on hockey players. The Sport Psychologist, 18(4), 399–409.",
        ],
        fileKey: {
          en: "Hibajavitas_EN_Final.m4a",
          de: "Fehlerkorrektur ohne Musik.MP3",
          hu: "Hibajavitas.mp3",
        },
      },
    ],
  },
  {
    section: "Competition",
    minTier: "pr",
    items: [
      {
        id: "comp-day-viz",
        i18nKey: "compDayViz",
        icon: "CM",
        color: "purple",
        duration: "~12 min",
        citations: [
          "Calmels et al. (2004). The use of mental imagery among elite sport performers. Journal of Applied Sport Psychology, 16(2), 157–177.",
          "Driskell, Copper & Moran (1994). Does mental practice enhance performance? Journal of Applied Psychology, 79(4), 481–492.",
          "Jordet (2005). Perceptual training in soccer: An imagery intervention study with elite players. Journal of Applied Sport Psychology, 17(2), 140–156.",
        ],
        fileKey: {
          en: "Verseny_MentalTraining_EN_fin.m4a",
          de: "Wettkampftag ohne Musik.MP3",
          hu: "Verseny_MentalTraining.mp3",
        },
        usesVizKeywords: true,
      },
    ],
  },
];

type ToolColor = "purple" | "amber" | "teal" | "emerald";

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
  emerald: {
    border: "border-emerald-500/20",
    bg:     "bg-emerald-500/[0.05]",
    icon:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    num:    "text-emerald-400",
    cite:   "text-emerald-400/60",
    player: "bg-emerald-600 hover:bg-emerald-500",
  },
};

// ── Visualization keywords ────────────────────────────────────────────────────

function VizKeywords({
  toolId,
  keywords,
  onSave,
}: {
  toolId: string;
  keywords: string[];
  onSave: (kws: string[]) => Promise<void>;
}) {
  const { t } = useT();
  const [editing, setEditing] = React.useState(false);
  const [drafts, setDrafts]   = React.useState(["", "", ""]);
  const [saving, setSaving]   = React.useState(false);

  const openEdit = () => {
    setDrafts([keywords[0] ?? "", keywords[1] ?? "", keywords[2] ?? ""]);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const filtered = drafts.map((s) => s.trim()).filter(Boolean).slice(0, 3);
    await onSave(filtered);
    setSaving(false);
    setEditing(false);
  };

  const placeholders =
    toolId === "viz-squat"
      ? ["e.g. chest up", "e.g. push the floor", "e.g. sit back"]
      : toolId === "viz-bench"
      ? ["e.g. squeeze the bar", "e.g. leg drive", "e.g. arch tight"]
      : ["e.g. hips back", "e.g. explode", "e.g. lock out"];

  if (editing || keywords.length === 0) {
    return (
      <div className="mb-5 rounded-xl border border-purple-500/15 bg-purple-500/5 p-4">
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-purple-300 mb-3">
          {t("library.yourFocusCues")} {keywords.length === 0 ? t("library.addKeywordsHint") : ""}
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
              className="flex-1 min-w-[80px] rounded-lg border border-white/10 bg-surface-panel px-3 py-1.5 font-saira text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/50"
            />
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={save}
            disabled={drafts.every((s) => !s.trim()) || saving}
            className="rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 px-4 py-1.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
          {keywords.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-saira text-[10px] text-zinc-400 hover:text-zinc-400 underline transition"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-saira text-[10px] uppercase tracking-[0.18em] text-zinc-300">
          {t("library.yourCues")}
        </p>
        <button
          type="button"
          onClick={openEdit}
          className="font-saira text-[10px] text-zinc-400 hover:text-purple-400 underline transition"
        >
          {t("common.edit")}
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {keywords.map((kw, i) => (
          <span key={i} className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 font-saira text-xs text-purple-300">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Affirmations inputs ───────────────────────────────────────────────────────

function AffirmationsInputs({
  affirmations,
  onSave,
}: {
  affirmations: string[];
  onSave: (a: string[]) => Promise<void>;
}) {
  const { t } = useT();
  const [drafts, setDrafts] = React.useState([
    affirmations[0] ?? "",
    affirmations[1] ?? "",
    affirmations[2] ?? "",
  ]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved]   = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);

  // Sync when parent affirmations change (on first profile load)
  React.useEffect(() => {
    setDrafts([affirmations[0] ?? "", affirmations[1] ?? "", affirmations[2] ?? ""]);
  }, [affirmations.join(",")]);  // eslint-disable-line react-hooks/exhaustive-deps

  const hasAny = drafts.some((d) => d.trim().length > 0);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const filtered = drafts.map((s) => s.trim()).filter(Boolean);
      await onSave(filtered);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(t("you.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const placeholders = [
    t("library.affirmationPlaceholder1"),
    t("library.affirmationPlaceholder2"),
    t("library.affirmationPlaceholder3"),
  ];

  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <label className="block font-saira text-[10px] uppercase tracking-[0.14em] text-zinc-300 mb-1.5">
            {t("library.affirmationLabel")} {i + 1}{i > 0 ? ` (${t("common.optional")})` : ""}
          </label>
          <input
            type="text"
            value={drafts[i]}
            onChange={(e) => {
              const next = [...drafts];
              next[i] = e.target.value;
              setDrafts(next);
            }}
            placeholder={placeholders[i]}
            maxLength={120}
            className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-2.5 font-saira text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasAny || saving}
          className={`rounded-xl px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition ${
            saved
              ? "bg-emerald-500"
              : "bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40"
          }`}
        >
          {saved ? t("common.saved") : saving ? t("common.saving") : t("common.save")}
        </button>
        {error && <p className="font-saira text-[11px] text-red-400">{error}</p>}
      </div>
    </div>
  );
}

// ── Audio player ──────────────────────────────────────────────────────────────
//
// Uses a direct public-bucket URL. The bucket must be set to Public in
// Supabase Storage → Buckets → tools → Edit bucket → Public on.
// play() is called synchronously inside the tap handler (iOS requirement).

// Each locale's recordings live in its own public Supabase bucket.
const STORAGE_BASES: Record<Locale, string> = {
  en: "https://njpmnglhgteihslgslou.supabase.co/storage/v1/object/public/tools/",
  de: "https://njpmnglhgteihslgslou.supabase.co/storage/v1/object/public/german/",
  hu: "https://njpmnglhgteihslgslou.supabase.co/storage/v1/object/public/hungarian/",
};

function AudioPlayer({ fileKey, color }: { fileKey: FileKeys | null; color: ToolColor }) {
  const { t, locale } = useT();
  const audioRef  = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]         = React.useState(false);
  const [buffering, setBuffering]     = React.useState(false);
  const [errored, setErrored]         = React.useState(false);
  const [progress, setProgress]       = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration]       = React.useState(0);
  const c = COLOR_MAP[color];

  // Resolve locale-specific key + matching bucket, fall back to "en"
  const resolvedLocale: Locale = fileKey && fileKey[locale] ? locale : "en";
  const resolvedKey = fileKey ? (fileKey[locale] ?? fileKey["en"] ?? null) : null;
  const url = resolvedKey
    ? `${STORAGE_BASES[resolvedLocale]}${resolvedKey.split("/").map(encodeURIComponent).join("/")}`
    : null;

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
      <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-surface-panel px-4 py-3.5">
        <div className="w-10 h-10 rounded-full border border-white/8 bg-white/[0.03] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-zinc-500" fill="currentColor" aria-hidden>
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
          </svg>
        </div>
        <div>
          <p className="font-saira text-xs font-semibold text-zinc-300">{t("library.audioGuided")}</p>
          <p className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {t("library.audioComingSoon")}
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
          <p className="font-saira text-xs font-semibold text-red-400">{t("library.audioLoadError")}</p>
          <button
            type="button"
            onClick={() => setErrored(false)}
            className="font-saira text-[10px] text-zinc-400 hover:text-zinc-400 underline transition"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  // ── Active player ───────────────────────────────────────────
  return (
    <div className="rounded-xl border border-white/10 bg-surface-panel p-4">
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
            <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{fmt(currentTime)}</span>
            <span className="font-saira text-[10px] text-zinc-400 tabular-nums">{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// `useSearchParams` requires a Suspense boundary for static rendering (Next.js 15+).
// The actual page logic lives in ToolsPageInner; the default export wraps it.
export default function ToolsPage() {
  return (
    <React.Suspense>
      <ToolsPageInner />
    </React.Suspense>
  );
}

function ToolsPageInner() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const [openId, setOpenId]             = React.useState<string | null>(() => searchParams.get("open"));
  const [requestText, setRequestText]   = React.useState("");
  const [requestState, setRequestState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [favoriteRelaxId, setFavoriteRelaxId] = React.useState<string | null>(null);

  const [vizKeywordsMap, setVizKeywordsMap]   = React.useState<Record<string, string[]>>({});
  const [vizRecordingsMap, setVizRecordingsMap] = React.useState<Record<string, string>>({});
  const [affirmations, setAffirmations]       = React.useState<string[]>([]);
  const [profileLoaded, setProfileLoaded]     = React.useState(false);
  const [aiAccess, setAiAccess]               = React.useState(false);
  const [planTier, setPlanTier]               = React.useState<PlanTier>("opener"); // conservative until loaded
  // "audio" | "live" | "upload" — selected mode per viz tool
  const [vizModes, setVizModes] = React.useState<Record<string, "audio" | "live" | "upload">>({});

  React.useEffect(() => {
    const stored = localStorage.getItem("relax-favorite");
    if (stored) setFavoriteRelaxId(stored);
  }, []);

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((p) => {
        setVizKeywordsMap(p.viz_keywords ?? {});
        setVizRecordingsMap(p.viz_recordings ?? {});
        setAffirmations(Array.isArray(p.affirmations) ? p.affirmations : []);
        setAiAccess(!!p.ai_access);
        setPlanTier((p?.plan_tier ?? "opener") as PlanTier);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
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

  const saveVizKeywords = async (toolId: string, kws: string[]) => {
    const next = { ...vizKeywordsMap, [toolId]: kws };
    setVizKeywordsMap(next);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viz_keywords: next }),
    });
  };

  const saveAffirmations = async (a: string[]) => {
    setAffirmations(a);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affirmations: a }),
    });
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

  // No early paywall — opener tier gets Relaxation tools; other sections show a locked preview.

  return (
    <div className="min-h-screen bg-surface-base px-4 pt-10 pb-8 sm:px-6 max-w-lg mx-auto md:max-w-3xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-purple-400 mb-1">
          {t("brand.name").toUpperCase()} · {t("nav.tools").toUpperCase()}
        </p>
        <h1 className="font-saira text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
          {t("library.title")}
        </h1>
        <p className="font-saira text-sm text-zinc-300">
          {t("library.subtitle")}
        </p>
      </div>

      {/* ── AI Coach card (PR tier only) ──────────────────────── */}
      {profileLoaded && (aiAccess || planTier === "pr") && (
        <div className="mb-8">
          <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 px-5 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-400 text-sm">✦</span>
                <p className="font-saira text-sm font-semibold text-white uppercase tracking-[0.1em]">
                  {t("library.aiCoachTitle")}
                </p>
              </div>
              <p className="font-saira text-xs text-zinc-400 leading-snug">
                {t("library.aiCoachDesc")}
              </p>
            </div>
            <Link
              href="/chat"
              className="flex-shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition whitespace-nowrap"
            >
              {t("library.aiCoachOpen")}
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link
              href="/scripts"
              className="font-saira text-xs text-zinc-300 hover:text-zinc-300 transition"
            >
              {t("library.savedScripts")}
            </Link>
          </div>
        </div>
      )}

      {/* ── Tool sections ─────────────────────────────────────── */}
      <div className="space-y-8">
        {TOOLS.map(({ section, minTier, items }) => {
          const sectionUnlocked = !profileLoaded || hasAccess(planTier, minTier);

          return (
            <div key={section}>
              <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-300 mb-3">
                {t(SECTION_KEY[section] ?? `library.section${section}`)}
              </p>

              {/* ── Locked section preview ─────────────────── */}
              {!sectionUnlocked ? (
                <div className="rounded-2xl border border-white/5 bg-surface-panel p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-saira text-sm text-zinc-400">🔒</span>
                      <p className="font-saira text-xs text-zinc-300">
                        {t(minTier === "pr" ? "library.toolsCountPR" : "library.toolsCountSecond", { count: items.length })}
                      </p>
                    </div>
                    <Link
                      href="/upgrade"
                      className="flex-shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 font-saira text-[10px] uppercase tracking-[0.16em] text-purple-300 transition"
                    >
                      {t("common.upgradeArrow")}
                    </Link>
                  </div>
                  <div className="space-y-1.5 select-none pointer-events-none opacity-[0.22]">
                    {items.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-card px-4 py-3">
                        <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center font-saira text-[10px] font-bold text-zinc-300">
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-saira text-sm font-semibold text-zinc-400">{t(`tools.${tool.i18nKey}.title`)}</p>
                          <p className="font-saira text-[11px] text-zinc-400">{t(`tools.${tool.i18nKey}.tagline`)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Unlocked section ─────────────────────── */
                <div className="space-y-2">
                  {items.map((tool) => {
                    const c    = COLOR_MAP[tool.color as ToolColor];
                    const open = openId === tool.id;
                    return (
                      <div
                        key={tool.id}
                        id={tool.id}
                        className={`rounded-2xl border transition-colors ${
                          open ? `${c.border} ${c.bg}` : "border-white/5 bg-surface-card"
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
                              <p className="font-saira text-sm font-semibold text-white">{t(`tools.${tool.i18nKey}.title`)}</p>
                              <p className="font-saira text-[11px] text-zinc-300">
                                {t(`tools.${tool.i18nKey}.tagline`)}
                                {tool.duration && <span className="ml-2 text-zinc-500">{tool.duration}</span>}
                              </p>
                            </div>
                            <span className={`font-saira text-sm text-zinc-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
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
                                  : "text-zinc-500 hover:text-zinc-400"
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
                            <p className="font-saira text-[13px] text-zinc-300 leading-relaxed mb-3">{t(`tools.${tool.i18nKey}.intro`)}</p>
                            <ul className="space-y-1 mb-5">
                              {tool.citations.map((cite, i) => (
                                <li key={i} className="flex gap-2 items-baseline">
                                  <span className={`text-[9px] flex-shrink-0 ${c.cite}`}>■</span>
                                  <span className={`font-saira text-[10px] leading-snug italic ${c.cite}`}>{cite}</span>
                                </li>
                              ))}
                            </ul>
                            {tool.id === "affirmations" ? (
                              <AffirmationsInputs affirmations={affirmations} onSave={saveAffirmations} />
                            ) : tool.usesVizKeywords ? (() => {
                              // ── Viz tools: keywords + mode picker ─────────────
                              const liftName =
                                tool.id === "viz-squat" ? "squat"
                                : tool.id === "viz-bench" ? "bench"
                                : "deadlift";
                              const mode = vizModes[tool.id];
                              const setMode = (m: "audio" | "live" | "upload") =>
                                setVizModes((prev) => ({ ...prev, [tool.id]: m }));

                              return (
                                <>
                                  <VizKeywords
                                    toolId={tool.id}
                                    keywords={vizKeywordsMap[tool.id] ?? []}
                                    onSave={(kws) => saveVizKeywords(tool.id, kws)}
                                  />

                                  {!mode ? (
                                    /* CTA — not yet chosen a mode */
                                    <button
                                      type="button"
                                      onClick={() => setMode("audio")}
                                      className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-3 font-saira text-[11px] font-bold uppercase tracking-[0.2em] text-white transition"
                                    >
                                      {t("library.vizBuildCta", { lift: liftName })}
                                    </button>
                                  ) : (
                                    <>
                                      {/* Mode tab strip */}
                                      <div className="flex gap-1.5 mb-4">
                                        {(["audio", "live", "upload"] as const).map((m) => {
                                          const labels = { audio: t("library.vizModeAudio"), live: t("library.vizModeLive"), upload: t("library.vizModeUpload") };
                                          return (
                                            <button
                                              key={m}
                                              type="button"
                                              onClick={() => setMode(m)}
                                              className={`flex-1 rounded-xl px-2 py-2 font-saira text-[10px] font-semibold tracking-[0.12em] transition ${
                                                mode === m
                                                  ? "bg-purple-600 text-white"
                                                  : "border border-white/10 text-zinc-400 hover:text-zinc-300 hover:border-white/20"
                                              }`}
                                            >
                                              {labels[m]}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Active mode content */}
                                      {mode === "audio" && (
                                        <AudioPlayer fileKey={tool.fileKey} color={tool.color as ToolColor} />
                                      )}
                                      {mode === "live" && (
                                        <VizLiveSession
                                          toolId={tool.id as "viz-squat" | "viz-bench" | "viz-deadlift"}
                                          onClose={() => setVizModes((prev) => { const n = { ...prev }; delete n[tool.id]; return n; })}
                                        />
                                      )}
                                      {mode === "upload" && (
                                        <VizUpload
                                          toolId={tool.id as "viz-squat" | "viz-bench" | "viz-deadlift"}
                                          hasExisting={!!vizRecordingsMap[tool.id]}
                                          onUploaded={(path) => setVizRecordingsMap((prev) => ({ ...prev, [tool.id]: path }))}
                                          onDeleted={() => setVizRecordingsMap((prev) => { const n = { ...prev }; delete n[tool.id]; return n; })}
                                        />
                                      )}
                                    </>
                                  )}
                                </>
                              );
                            })() : (
                              <AudioPlayer fileKey={tool.fileKey} color={tool.color as ToolColor} />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Suggest a tool ───────────────────────────────────── */}
        <div>
          <p className="font-saira text-[10px] font-semibold uppercase tracking-[0.26em] text-zinc-300 mb-3">
            {t("library.suggestATool")}
          </p>
          <div className="rounded-2xl border border-white/5 bg-surface-card p-5">
            {requestState === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
                  ✓
                </div>
                <p className="font-saira text-sm font-semibold text-emerald-300">{t("library.requestSent")}</p>
                <p className="font-saira text-xs text-zinc-300 max-w-[240px]">
                  {t("library.requestThanks")}
                </p>
                <button
                  type="button"
                  onClick={() => setRequestState("idle")}
                  className="font-saira text-[10px] uppercase tracking-[0.16em] text-zinc-400 hover:text-zinc-400 underline transition"
                >
                  {t("library.submitAnother")}
                </button>
              </div>
            ) : (
              <>
                <p className="font-saira text-xs text-zinc-400 mb-3">
                  {t("library.suggestQuestion")}
                </p>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder={t("library.suggestPlaceholder")}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/10 bg-surface-panel px-3 py-3 font-saira text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none [color-scheme:dark] mb-3"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-saira text-[10px] tabular-nums ${requestText.length >= 450 ? "text-amber-400" : "text-zinc-400"}`}>
                    {requestText.length}/500
                  </span>
                  <button
                    type="button"
                    onClick={submitRequest}
                    disabled={!requestText.trim() || requestState === "sending"}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2.5 font-saira text-xs font-semibold uppercase tracking-[0.14em] text-white transition"
                  >
                    {requestState === "sending" ? t("common.sending") : requestState === "error" ? t("common.retry") : t("library.sendRequest")}
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
