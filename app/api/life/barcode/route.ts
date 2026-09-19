/**
 * GET /api/life/barcode?ean=XXXXX — EAN → Open Food Facts → per-100g macros.
 *
 * Proxied so we can:
 * - enforce auth (lifestyle_beta gate)
 * - set a proper User-Agent (Open Food Facts asks for it)
 * - cache at the edge (a product doesn't change daily)
 * - normalize the response shape
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";

export const dynamic = "force-dynamic";

const num = (v: unknown) =>
  v === undefined || v === null || v === "" || Number.isNaN(+(v as string))
    ? null
    : Math.round(+(v as number) * 10) / 10;

export async function GET(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ean = (req.nextUrl.searchParams.get("ean") ?? "").replace(/\D/g, "");
  if (ean.length < 8 || ean.length > 14) {
    return NextResponse.json({ ok: false, error: "Invalid barcode." }, { status: 400 });
  }

  const notFound = () =>
    NextResponse.json({ ok: false, ean, error: "Product not found in database." }, { status: 404 });

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=code,product_name,product_name_en,brands,nutriments,serving_quantity,image_front_small_url`;
    const r = await fetch(url, {
      headers: { "User-Agent": "powerflow-app/1.0 (trainer.pod@gmail.com)" },
    });
    if (r.status === 404) return notFound();
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "Food database unavailable." }, { status: 502 });
    }

    const d = await r.json();
    const p = d?.product;
    if (!p || d.status === 0) return notFound();

    const n = p.nutriments || {};
    let kcal = num(n["energy-kcal_100g"]);
    if (kcal === null && num(n["energy_100g"]) !== null) {
      kcal = Math.round((num(n["energy_100g"]) ?? 0) / 4.184);
    }
    const per100 = {
      kcal,
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
    };
    if (per100.kcal === null && per100.protein === null) return notFound();

    const res = NextResponse.json({
      ok: true,
      ean,
      name: p.product_name_en || p.product_name || "Unknown product",
      brand: p.brands || "",
      per100,
      serving_g: num(p.serving_quantity),
      image: p.image_front_small_url || null,
    });
    res.headers.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res;
  } catch (e) {
    console.error("[barcode]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Lookup failed." }, { status: 502 });
  }
}
