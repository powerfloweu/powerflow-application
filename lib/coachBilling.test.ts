import { describe, it, expect, vi, beforeEach } from "vitest";

const { subscriptionsUpdate, subscriptionsRetrieve, subscriptionsCancel, dbSelect, dbPatch } = vi.hoisted(() => ({
  subscriptionsUpdate: vi.fn(),
  subscriptionsRetrieve: vi.fn().mockResolvedValue({ items: { data: [{ id: "si_1" }] } }),
  subscriptionsCancel: vi.fn(),
  dbSelect: vi.fn(),
  dbPatch: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: {
      update: subscriptionsUpdate,
      retrieve: subscriptionsRetrieve,
      cancel: subscriptionsCancel,
    },
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
  appUrl: () => "https://app.power-flow.eu",
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  dbSelect,
  dbPatch,
}));

import { syncCoachQuantity, MAX_BILLABLE_ATHLETES } from "./coachBilling";

describe("syncCoachQuantity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionsRetrieve.mockResolvedValue({ items: { data: [{ id: "si_1" }] } });
  });

  it("caps a coach with 25 athletes at MAX_BILLABLE_ATHLETES seats", async () => {
    dbSelect.mockImplementation((table: string) => {
      if (table === "profiles") return [{ id: "coach1", stripe_coach_sub_id: "sub_1" }];
      return [];
    });
    // countAthletes calls dbSelect too — second call returns 25 athlete rows.
    dbSelect
      .mockResolvedValueOnce([{ id: "coach1", stripe_coach_sub_id: "sub_1" }])
      .mockResolvedValueOnce(Array.from({ length: 25 }, (_, i) => ({ id: `a${i}` })));

    await syncCoachQuantity("coach1");

    expect(MAX_BILLABLE_ATHLETES).toBe(20);
    expect(subscriptionsUpdate).toHaveBeenCalledWith(
      "sub_1",
      expect.objectContaining({ items: [{ id: "si_1", quantity: 20 }] }),
    );
  });
});
