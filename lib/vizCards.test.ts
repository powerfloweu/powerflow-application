import { describe, it, expect } from "vitest";
import { cardFor, VIZ_CARDS } from "./vizCards";

describe("cardFor", () => {
  it("returns nothing for an athlete with no cards", () => {
    expect(cardFor({}, "viz-squat")).toBeNull();
    expect(cardFor(null, "viz-squat")).toBeNull();
    expect(cardFor(undefined, "viz-squat")).toBeNull();
  });

  it("returns the assigned card for that tool", () => {
    const card = cardFor({ "viz-squat": "squat-stack-depth-drive" }, "viz-squat");
    expect(card?.id).toBe("squat-stack-depth-drive");
  });

  it("does not leak a card onto a tool it wasn't assigned to", () => {
    const cards = { "viz-squat": "squat-stack-depth-drive" };
    expect(cardFor(cards, "viz-bench")).toBeNull();
    expect(cardFor(cards, "viz-deadlift")).toBeNull();
  });

  it("degrades to nothing when the design id is unknown", () => {
    // A renamed or deleted design must leave the tool working, not crash it.
    expect(cardFor({ "viz-squat": "design-that-was-removed" }, "viz-squat")).toBeNull();
  });

  it("every registered card is keyed by its own id and can render", () => {
    for (const [key, card] of Object.entries(VIZ_CARDS)) {
      expect(card.id, `${key} is filed under the wrong key`).toBe(key);
      expect(card.tabLabel.trim().length).toBeGreaterThan(0);
      expect(typeof card.render).toBe("function");
    }
  });
});
