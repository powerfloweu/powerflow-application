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

import { syncCoachQuantity, coachPlanFor, FLAT_RATE_THRESHOLD } from "./coachBilling";

const PER_ATHLETE_PRICE = "price_per_athlete";
const FLAT_PRICE = "price_flat_99";

function mockCoachWithAthletes(count: number) {
  dbSelect
    .mockResolvedValueOnce([{ id: "coach1", stripe_coach_sub_id: "sub_1" }])
    .mockResolvedValueOnce(Array.from({ length: count }, (_, i) => ({ id: `a${i}` })));
}

describe("coachPlanFor", () => {
  beforeEach(() => {
    process.env.STRIPE_COACH_PRICE_ID = PER_ATHLETE_PRICE;
    process.env.STRIPE_PRICE_COACH_FLAT_99 = FLAT_PRICE;
  });

  it("19 athletes → per-athlete price × 19 (€95)", () => {
    expect(coachPlanFor(19)).toEqual({ priceId: PER_ATHLETE_PRICE, quantity: 19 });
  });

  it("20 athletes → flat €99 price, quantity 1", () => {
    expect(FLAT_RATE_THRESHOLD).toBe(20);
    expect(coachPlanFor(20)).toEqual({ priceId: FLAT_PRICE, quantity: 1 });
  });

  it("25 athletes → still flat €99, however many over", () => {
    expect(coachPlanFor(25)).toEqual({ priceId: FLAT_PRICE, quantity: 1 });
  });

  it("dropping from 25 to 18 → back to per-athlete price × 18", () => {
    expect(coachPlanFor(18)).toEqual({ priceId: PER_ATHLETE_PRICE, quantity: 18 });
  });

  it("fails loudly when the flat price env var is missing", () => {
    delete process.env.STRIPE_PRICE_COACH_FLAT_99;
    expect(() => coachPlanFor(20)).toThrow("STRIPE_PRICE_COACH_FLAT_99");
  });
});

describe("syncCoachQuantity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_COACH_PRICE_ID = PER_ATHLETE_PRICE;
    process.env.STRIPE_PRICE_COACH_FLAT_99 = FLAT_PRICE;
    subscriptionsRetrieve.mockResolvedValue({ items: { data: [{ id: "si_1" }] } });
  });

  it("switches a 25-athlete coach onto the flat price at quantity 1", async () => {
    mockCoachWithAthletes(25);

    await syncCoachQuantity("coach1");

    expect(subscriptionsUpdate).toHaveBeenCalledWith(
      "sub_1",
      expect.objectContaining({ items: [{ id: "si_1", price: FLAT_PRICE, quantity: 1 }] }),
    );
  });

  it("keeps a 18-athlete coach on the per-athlete price at that quantity", async () => {
    mockCoachWithAthletes(18);

    await syncCoachQuantity("coach1");

    expect(subscriptionsUpdate).toHaveBeenCalledWith(
      "sub_1",
      expect.objectContaining({ items: [{ id: "si_1", price: PER_ATHLETE_PRICE, quantity: 18 }] }),
    );
  });
});
