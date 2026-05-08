/**
 * Admin translations API — requires editor or master admin access.
 *
 * GET  /api/admin/translations?locale=de
 *   Returns all EN keys paired with the current DE override (if any).
 *   Shape: { key: string; en: string; value: string | null }[]
 *
 * PATCH /api/admin/translations
 *   Body: { locale, key, value }
 *   Upserts one override. Send value="" to delete the override.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { en } from "@/lib/i18n/en";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const VALID_LOCALES = new Set(["de", "hu", "es", "fr"]);

// Allowed emails for translation access (master admin + invited editors)
function editorEmails(): string[] {
  const base = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];
  const extra = process.env.EDITOR_EMAILS
    ? process.env.EDITOR_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
    : [];
  return [...base, ...extra];
}

async function getSessionEmail(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

// Flatten a nested object to dot-separated key → value pairs
function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof obj !== "object" || obj === null) return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out[key] = v;
    } else {
      Object.assign(out, flatten(v, key));
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email || !editorEmails().includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const locale = request.nextUrl.searchParams.get("locale") ?? "";
  if (!VALID_LOCALES.has(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  // Fetch existing overrides for this locale
  const overrides: Record<string, string> = {};
  if (SUPABASE_URL && SERVICE_KEY) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/translation_overrides?locale=eq.${locale}&select=key,value`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (res.ok) {
      const rows: { key: string; value: string }[] = await res.json();
      for (const { key, value } of rows) overrides[key] = value;
    }
  }

  // Return all EN keys paired with the override value (null = not yet translated)
  const enFlat = flatten(en);
  const result = Object.entries(enFlat).map(([key, enVal]) => ({
    key,
    en: enVal,
    value: overrides[key] ?? null,
  }));

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email || !editorEmails().includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    locale?: string;
    key?: string;
    value?: string;
  };

  const { locale, key, value } = body;
  if (!locale || !VALID_LOCALES.has(locale) || !key) {
    return NextResponse.json({ error: "locale and key are required" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  // Empty value = delete the override (fall back to compiled)
  if (value === "" || value === null || value === undefined) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/translation_overrides?locale=eq.${locale}&key=eq.${encodeURIComponent(key)}`,
      {
        method: "DELETE",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      },
    );
    return NextResponse.json({ deleted: true });
  }

  // Upsert
  const res = await fetch(`${SUPABASE_URL}/rest/v1/translation_overrides`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ locale, key, value, updated_at: new Date().toISOString() }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return NextResponse.json({ error: txt }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
