/**
 * GET /api/translations?locale=de
 *
 * Public endpoint — returns DB overrides for the requested locale as a flat
 * { "dot.key": "value" } map. No authentication required (strings are not
 * sensitive). Response is cached for 5 minutes at the edge.
 */

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const VALID_LOCALES = new Set(["de", "hu", "es", "fr"]);

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? "";

  if (!VALID_LOCALES.has(locale)) {
    return NextResponse.json({}, { status: 200 });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/translation_overrides?locale=eq.${locale}&select=key,value`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        next: { revalidate: 300 }, // cache 5 min at the edge
      },
    );

    if (!res.ok) return NextResponse.json({}, { status: 200 });

    const rows: { key: string; value: string }[] = await res.json();
    const map: Record<string, string> = {};
    for (const { key, value } of rows) map[key] = value;

    return NextResponse.json(map, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
