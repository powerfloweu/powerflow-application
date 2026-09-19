/**
 * Guards the /api/life/meals route against two mistakes that fail silently.
 *
 * 1. Double-encoding jsonb. `dbInsert` serialises the whole payload, so a
 *    `JSON.stringify(items)` at the call site stores the literal string
 *    "[{\"name\":...}]" in the jsonb column instead of an array. Nothing
 *    throws — reads just come back as a string, and any consumer that maps
 *    over `items` breaks far from the cause.
 * 2. A hand-written select that drifts from the row type, so a column the UI
 *    reads is never actually fetched (this shipped once on the seminar admin
 *    route and showed every language as zero).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(__dirname, "../app/api/life/meals/route.ts"), "utf8");

describe("/api/life/meals route", () => {
  it("does not stringify the jsonb items column before insert", () => {
    expect(SRC).not.toMatch(/items:\s*JSON\.stringify/);
  });

  it("selects every column the MealRow type promises", () => {
    const select = SRC.match(/select:\s*"([^"]+)"/)?.[1];
    expect(select, "no select string found in route").toBeTruthy();
    const selected = new Set(select!.split(",").map((s) => s.trim()));

    for (const col of [
      "id", "meal_date", "description", "items",
      "kcal", "protein", "carbs", "fat", "source", "created_at",
    ]) {
      expect(selected.has(col), `select is missing "${col}"`).toBe(true);
    }
  });

  it("scopes every read and write to the calling user", () => {
    // Both the GET and the pre-delete ownership check must filter on user_id;
    // without it one beta user could read or delete another's food log.
    const userScopes = SRC.match(/user_id:\s*`eq\.\$\{userId\}`/g) ?? [];
    expect(userScopes.length).toBeGreaterThanOrEqual(2);
  });

  it("verifies ownership before deleting", () => {
    expect(SRC).toMatch(/dbSelect[\s\S]{0,300}?user_id[\s\S]{0,200}?dbDelete/);
  });
});
