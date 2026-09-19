"use client";

/**
 * Multi-step food logging modal:
 *   input → (scan | loading) → (product | result) → save
 *
 * Three input paths:
 * 1. Photo ± text description → AI recognition → editable result
 * 2. Barcode scan → Open Food Facts → gram entry → save
 * 3. Text-only → AI recognition → editable result
 *
 * Ported from tamas60/app.js food modal, adapted to React + Tailwind.
 */

import React from "react";
import type { MealItem, HandMeasurements } from "@/lib/nutrition";

// Lazy-loaded barcode scanner
const BarcodeScanner = React.lazy(() => import("./BarcodeScanner"));

type Step = "input" | "scan" | "product" | "loading" | "result";
type Ate = "all" | "half" | "little";

interface Per100 {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface Product {
  name: string;
  brand: string;
  per100: Per100;
  serving_g: number | null;
  image: string | null;
}

interface AiResult {
  items: MealItem[];
  confidence: "low" | "medium" | "good";
  note: string;
}

interface Props {
  onSave: (meal: {
    description: string;
    items: MealItem[];
    kcal: number; protein: number; carbs: number; fat: number;
    source: "photo" | "photo+text" | "text" | "barcode";
  }) => void;
  onClose: () => void;
  hand?: HandMeasurements;
  plateCm?: number;
}

// ── Image resize (HEIC → JPEG, max 1280px) ─────────────────────────────────

function resizeImage(file: File, max = 1280, quality = 0.82): Promise<{ data: string; media_type: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const sc = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * sc); h = Math.round(h * sc);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = c.toDataURL("image/jpeg", quality);
      resolve({ data: dataUrl.split(",")[1], media_type: "image/jpeg", preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
    img.src = url;
  });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FoodModal({ onSave, onClose, hand, plateCm }: Props) {
  const [step, setStep] = React.useState<Step>("input");
  const [error, setError] = React.useState<string | null>(null);

  // Input state
  const [imageData, setImageData] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<string>("image/jpeg");
  const [preview, setPreview] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [ate, setAte] = React.useState<Ate>("all");

  // Barcode state
  const [product, setProduct] = React.useState<Product | null>(null);
  const [productGrams, setProductGrams] = React.useState(100);
  const [productLoading, setProductLoading] = React.useState(false);
  const [productError, setProductError] = React.useState<string | null>(null);

  // AI result state
  const [result, setResult] = React.useState<AiResult | null>(null);
  const [editedItems, setEditedItems] = React.useState<MealItem[]>([]);

  const fileRef = React.useRef<HTMLInputElement>(null);

  // ── Photo handling ──────────────────────────────────────────────────────────
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const r = await resizeImage(f);
      setImageData(r.data);
      setMediaType(r.media_type);
      setPreview(r.preview);
    } catch {
      setError("Could not read the image.");
    }
  };

  // ── Barcode lookup ──────────────────────────────────────────────────────────
  const lookupEan = async (ean: string) => {
    setStep("product");
    setProductLoading(true);
    setProductError(null);
    try {
      const r = await fetch(`/api/life/barcode?ean=${encodeURIComponent(ean)}`);
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setProductError(d.error || "Product not found.");
        setProductLoading(false);
        return;
      }
      setProduct(d);
      setProductGrams(d.serving_g || 100);
      setProductLoading(false);
    } catch {
      setProductError("No connection.");
      setProductLoading(false);
    }
  };

  // ── AI analysis ─────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!imageData && !text.trim()) {
      setError("Take a photo or describe what you ate.");
      return;
    }
    setStep("loading");
    setError(null);
    try {
      const r = await fetch("/api/life/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          media_type: mediaType,
          text,
          ate,
          plateCm: plateCm || 26,
          hand,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Error: ${r.status}`);
        setStep("input");
        return;
      }
      setResult(data);
      setEditedItems(data.items.map((i: MealItem) => ({ ...i })));
      setStep("result");
    } catch {
      setError("No connection. Try again when you're online.");
      setStep("input");
    }
  };

  // ── Update grams in result (proportional macro recalc) ──────────────────
  const updateGrams = (idx: number, newGrams: number) => {
    if (!result) return;
    const base = result.items[idx];
    const k = base.grams > 0 ? newGrams / base.grams : 0;
    setEditedItems((prev) =>
      prev.map((item, i) =>
        i !== idx
          ? item
          : {
              ...item,
              grams: newGrams,
              kcal: Math.round(base.kcal * k),
              protein: Math.round(base.protein * k),
              carbs: Math.round(base.carbs * k),
              fat: Math.round(base.fat * k),
            },
      ),
    );
  };

  // ── Save handlers ───────────────────────────────────────────────────────────
  const saveAiResult = () => {
    const items = editedItems.filter((i) => i.grams > 0);
    if (!items.length) return;
    const sum = (k: keyof MealItem) => items.reduce((a, i) => a + (i[k] as number), 0);
    onSave({
      description: text.trim().slice(0, 200) || items.map((i) => i.name).join(", "),
      items,
      kcal: sum("kcal"),
      protein: sum("protein"),
      carbs: sum("carbs"),
      fat: sum("fat"),
      source: imageData ? (text ? "photo+text" : "photo") : "text",
    });
  };

  const saveBarcode = () => {
    if (!product || productGrams <= 0) return;
    const k = productGrams / 100;
    const item: MealItem = {
      name: product.name,
      grams: productGrams,
      kcal: Math.round((product.per100.kcal ?? 0) * k),
      protein: Math.round((product.per100.protein ?? 0) * k),
      carbs: Math.round((product.per100.carbs ?? 0) * k),
      fat: Math.round((product.per100.fat ?? 0) * k),
    };
    onSave({
      description: product.brand ? `${product.name} (${product.brand})` : product.name,
      items: [item],
      kcal: item.kcal,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      source: "barcode",
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const confColors = { good: "text-emerald-400", medium: "text-amber-400", low: "text-red-400" };
  const confLabels = { good: "Good estimate", medium: "Medium confidence", low: "Uncertain estimate" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-zinc-900 p-5 sm:rounded-2xl sm:max-h-[85vh] sm:overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-saira text-lg font-semibold text-white">
            {step === "result" ? "Here's what I see" : step === "product" ? "Product" : step === "scan" ? "Barcode" : "What did you eat?"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── INPUT STEP ──────────────────────────────────────────────── */}
        {step === "input" && (
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

            {/* Photo button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
            >
              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {preview ? "Change photo" : "Photo of your plate"}
            </button>

            {/* Barcode button */}
            <button
              onClick={() => setStep("scan")}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
            >
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
              </svg>
              <span>
                Scan barcode <span className="text-zinc-500">— for packaged food (precise)</span>
              </span>
            </button>

            {/* Photo preview */}
            {preview && (
              <div className="relative">
                <img src={preview} alt="Food photo" className="w-full rounded-xl" />
                <button
                  onClick={() => { setImageData(null); setPreview(null); }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Remove photo"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Text description */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Describe it in a few words
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. grilled chicken breast with rice, large serving"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                rows={2}
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                You can also dictate using your keyboard mic. If there was oil, butter, or sauce, mention it — it&apos;s not visible in the photo.
              </p>
            </div>

            {/* Portion selector */}
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                How much did you eat?
              </label>
              <div className="flex gap-1">
                {(["all", "half", "little"] as Ate[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAte(v)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      ate === v
                        ? "bg-violet-600 text-white"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {v === "all" ? "All of it" : v === "half" ? "About half" : "Just a little"}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-xs text-red-400">{error}</p>}

            {/* Analyze button */}
            <button
              onClick={analyze}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500"
            >
              Analyze
            </button>
          </div>
        )}

        {/* ── SCAN STEP ───────────────────────────────────────────────── */}
        {step === "scan" && (
          <React.Suspense fallback={<p className="py-8 text-center text-sm text-zinc-400">Loading scanner…</p>}>
            <BarcodeScanner onResult={lookupEan} onClose={() => setStep("input")} />
          </React.Suspense>
        )}

        {/* ── PRODUCT STEP (barcode result) ───────────────────────────── */}
        {step === "product" && (
          <div className="space-y-3">
            {productLoading && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                <p className="text-sm text-zinc-400">Looking up product…</p>
              </div>
            )}

            {productError && !productLoading && (
              <div>
                <p className="mb-3 text-sm text-red-400">{productError}</p>
                <p className="mb-3 text-xs text-zinc-500">
                  No worries — if there&apos;s a nutrition label on the package, take a photo and describe the serving size.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setStep("scan")} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white">
                    Try another
                  </button>
                  <button onClick={() => setStep("input")} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white">
                    Back
                  </button>
                </div>
              </div>
            )}

            {product && !productLoading && (
              <>
                {/* Product card */}
                <div className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                  {product.image && (
                    <img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                    {product.brand && <p className="text-xs text-zinc-400 truncate">{product.brand}</p>}
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Per 100g: {product.per100.kcal ?? "–"} kcal · {product.per100.protein ?? "–"}g protein · {product.per100.carbs ?? "–"}g carbs · {product.per100.fat ?? "–"}g fat
                    </p>
                  </div>
                </div>

                {/* Grams input */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    How much did you eat?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={3000}
                      value={productGrams}
                      onChange={(e) => setProductGrams(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                    <span className="text-sm text-zinc-400">g</span>
                    {product.serving_g && (
                      <button
                        onClick={() => setProductGrams(Math.round(product.serving_g!))}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white"
                      >
                        1 serving = {Math.round(product.serving_g)}g
                      </button>
                    )}
                  </div>
                </div>

                {/* Computed macros */}
                {(() => {
                  const k = productGrams / 100;
                  const v = (x: number | null) => x === null ? "–" : Math.round(x * k);
                  return (
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
                      <span className="text-sm font-semibold text-emerald-400">
                        {v(product.per100.protein)}g protein
                      </span>
                      <span className="text-sm text-zinc-400">{v(product.per100.kcal)} kcal</span>
                    </div>
                  );
                })()}

                <p className="text-[10px] text-zinc-500">From the database — precise values, not an estimate.</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setProduct(null); setStep("input"); }}
                    className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveBarcode}
                    className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-bold text-white hover:bg-violet-500"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── LOADING STEP ────────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <p className="text-sm text-zinc-300">Analyzing your meal…</p>
            <p className="mt-1 text-xs text-zinc-500">This takes a few seconds.</p>
          </div>
        )}

        {/* ── RESULT STEP ─────────────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="space-y-3">
            {/* Confidence badge */}
            <span className={`inline-block text-xs font-semibold ${confColors[result.confidence]}`}>
              {confLabels[result.confidence]}
            </span>

            {/* Items list */}
            {editedItems.length === 0 ? (
              <p className="text-sm text-red-400">No food recognized. Describe it in a few words and try again.</p>
            ) : (
              <div className="space-y-2">
                {editedItems.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={2000}
                          value={item.grams}
                          onChange={(e) => updateGrams(idx, Math.max(0, Math.round(Number(e.target.value) || 0)))}
                          className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-right text-xs text-white focus:border-violet-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-500">g</span>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      <b className="text-emerald-400">{item.protein}g</b> protein · {item.kcal} kcal · {item.carbs}g carbs · {item.fat}g fat
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {editedItems.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
                <span className="text-sm font-semibold text-emerald-400">
                  {editedItems.reduce((a, i) => a + i.protein, 0)}g protein
                </span>
                <span className="text-sm text-zinc-400">
                  {editedItems.reduce((a, i) => a + i.kcal, 0)} kcal total
                </span>
              </div>
            )}

            {/* Note */}
            {result.note && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{result.note}</p>
            )}

            <p className="text-[10px] text-zinc-500">
              You can adjust the grams if you think differently — the macros will update proportionally.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("input")}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Back
              </button>
              {editedItems.length > 0 && (
                <button
                  onClick={saveAiResult}
                  className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-bold text-white hover:bg-violet-500"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
