import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * The admin seminar route declares a row type and separately hand-writes the
 * PostgREST `select` string. Nothing links the two: dropping a column from the
 * select still typechecks, and the field simply arrives undefined at runtime.
 *
 * That is not hypothetical — the language tally shipped reading
 * `preferred_language` while the select still asked for the long-removed
 * `format_pref` and `materials`, so every language counted zero. This test
 * pins the two together.
 */
const ROUTE = path.join(process.cwd(), "app/api/admin/seminar/route.ts");

function selectedColumns(src: string): string[] {
  const m = src.match(/select:\s*"([^"]+)"/);
  if (!m) throw new Error("no select string found in the admin seminar route");
  return m[1].split(",").map((c) => c.trim());
}

function declaredRowFields(src: string): string[] {
  const m = src.match(/export type SeminarSignupRow = \{([\s\S]*?)\n\};/);
  if (!m) throw new Error("SeminarSignupRow type not found");
  return [...m[1].matchAll(/^\s*(\w+)\s*[?]?:/gm)].map((x) => x[1]);
}

describe("admin seminar query", () => {
  const src = fs.readFileSync(ROUTE, "utf8");

  it("selects every column the row type promises", () => {
    const selected = selectedColumns(src);
    for (const field of declaredRowFields(src)) {
      expect(selected, `${field} is in SeminarSignupRow but missing from the select`).toContain(field);
    }
  });

  it("does not select columns nothing reads any more", () => {
    const selected = selectedColumns(src);
    // Left behind when the format/materials questions were removed.
    expect(selected).not.toContain("format_pref");
    expect(selected).not.toContain("materials");
  });

  it("selects the field the language tally depends on", () => {
    expect(selectedColumns(src)).toContain("preferred_language");
  });
});
