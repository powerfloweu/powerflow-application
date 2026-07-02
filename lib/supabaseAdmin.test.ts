import { describe, it, expect, vi } from "vitest";
import { buildMatchQuery } from "./supabaseAdmin";

describe("buildMatchQuery", () => {
  it("builds a single eq filter from a raw value", () => {
    expect(buildMatchQuery("meet_reflections", { id: "abc-123" })).toBe("?id=eq.abc-123");
  });

  it("joins multiple filters with &", () => {
    const q = buildMatchQuery("weekly_checkins", { user_id: "u1", entry_date: "2026-07-02" });
    expect(q).toBe("?user_id=eq.u1&entry_date=eq.2026-07-02");
  });

  it("does NOT double-prefix when a value already starts with eq. (the production bug)", () => {
    // The meet-reflections route once passed `eq.<uuid>` here, producing
    // `?id=eq.eq.<uuid>` which matched zero rows and silently lost data.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const q = buildMatchQuery("meet_reflections", { id: "eq.abc-123" });
    expect(q).toBe("?id=eq.abc-123");
    expect(spy).toHaveBeenCalledOnce(); // it warns loudly about the mistake
    spy.mockRestore();
  });

  it("url-encodes special characters in keys and values", () => {
    const q = buildMatchQuery("t", { "col name": "a b/c" });
    expect(q).toBe("?col%20name=eq.a%20b%2Fc");
  });
});
