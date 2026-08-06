import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOOL_MIN_TIER, isKnownTool } from "./toolTiers";

/**
 * The library page owns the visual grouping of tools into tiered sections;
 * lib/toolTiers.ts owns the gating map that server routes check against. If the
 * two drift, a coach can suggest a tool the athlete cannot open — the exact bug
 * this map was introduced to prevent. Parse the page and assert they agree.
 */
function toolTiersDeclaredInLibraryPage(): Record<string, string> {
  const src = readFileSync(
    resolve(__dirname, "../app/(app)/library/page.tsx"),
    "utf8",
  );
  const found: Record<string, string> = {};
  let currentTier: string | null = null;
  for (const line of src.split("\n")) {
    const tier = line.match(/^\s*minTier:\s*"(opener|second|pr)"/);
    if (tier) { currentTier = tier[1]; continue; }
    const id = line.match(/^\s*id:\s*"([a-z0-9-]+)"/);
    if (id && currentTier) found[id[1]] = currentTier;
  }
  return found;
}

describe("TOOL_MIN_TIER", () => {
  it("covers every tool the library page renders, at the same tier", () => {
    const fromPage = toolTiersDeclaredInLibraryPage();
    // Sanity: the parse actually found the tools, so a rename can't vacuously pass.
    expect(Object.keys(fromPage).length).toBeGreaterThanOrEqual(10);
    expect(fromPage).toEqual(TOOL_MIN_TIER);
  });

  it("recognises known tools and rejects unknown ones", () => {
    expect(isKnownTool("pmr")).toBe(true);
    expect(isKnownTool("comp-day-viz")).toBe(true);
    expect(isKnownTool("not-a-tool")).toBe(false);
    expect(isKnownTool("constructor")).toBe(false);
  });
});
