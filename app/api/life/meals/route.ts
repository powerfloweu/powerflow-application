/**
 * GET    /api/life/meals?date=YYYY-MM-DD  — meals for a date (default today).
 * POST   /api/life/meals                  — save a new meal.
 * DELETE /api/life/meals?id=UUID          — delete a meal by id.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLifeUser } from "@/lib/lifeAuth";
import { dbSelect, dbInsert, dbDelete } from "@/lib/supabaseAdmin";
import type { MealRow, MealItem } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const date = req.nextUrl.searchParams.get("date") ?? todayYmd();
  const rows = await dbSelect<MealRow>("lifestyle_meals", {
    user_id: `eq.${userId}`,
    meal_date: `eq.${date}`,
    select: "id,meal_date,description,items,kcal,protein,carbs,fat,source,created_at",
    order: "created_at.asc",
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    meal_date?: string;
    description?: string;
    items?: MealItem[];
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    source?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mealDate = body.meal_date ?? todayYmd();
  const items = Array.isArray(body.items) ? body.items : [];
  const source = (["photo", "photo+text", "text", "barcode"] as string[]).includes(body.source ?? "")
    ? body.source!
    : "text";

  const row = {
    user_id: userId,
    meal_date: mealDate,
    description: String(body.description ?? "").slice(0, 500) || items.map((i) => i.name).join(", "),
    // Pass the array itself — dbInsert serialises the whole payload, so
    // stringifying here would store a JSON string instead of a jsonb array.
    items,
    kcal: Math.round(body.kcal ?? 0),
    protein: Math.round((body.protein ?? 0) * 10) / 10,
    carbs: Math.round((body.carbs ?? 0) * 10) / 10,
    fat: Math.round((body.fat ?? 0) * 10) / 10,
    source,
  };

  const inserted = await dbInsert("lifestyle_meals", row);
  if (!inserted) return NextResponse.json({ error: "Save failed" }, { status: 500 });

  return NextResponse.json({ ok: true, id: (inserted as Record<string, unknown>).id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireLifeUser();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership before deleting
  const existing = await dbSelect<{ id: string }>("lifestyle_meals", {
    id: `eq.${id}`,
    user_id: `eq.${userId}`,
    select: "id",
  });
  if (!existing.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await dbDelete("lifestyle_meals", { id });
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
