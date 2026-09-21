import { describe, it, expect } from "vitest";
import { coachAudioPath } from "./coachAudio";

const BASE = "https://njpmnglhgteihslgslou.supabase.co";

describe("coachAudioPath", () => {
  it("reads the object path out of a stored public URL", () => {
    // The shape every row written before the bucket went private holds.
    expect(
      coachAudioPath(`${BASE}/storage/v1/object/public/coach-audio/066eeaf0/1784624962304.webm`),
    ).toBe("066eeaf0/1784624962304.webm");
  });

  it("reads it out of a non-public object URL too", () => {
    expect(
      coachAudioPath(`${BASE}/storage/v1/object/coach-audio/abc/1.webm`),
    ).toBe("abc/1.webm");
  });

  it("accepts a bare path, so newer rows need no migration", () => {
    expect(coachAudioPath("abc/1.webm")).toBe("abc/1.webm");
    expect(coachAudioPath("/abc/1.webm")).toBe("abc/1.webm");
  });

  it("drops a query string rather than signing it into the path", () => {
    expect(
      coachAudioPath(`${BASE}/storage/v1/object/public/coach-audio/abc/1.webm?token=xyz`),
    ).toBe("abc/1.webm");
  });

  it("decodes an escaped path", () => {
    expect(
      coachAudioPath(`${BASE}/storage/v1/object/public/coach-audio/abc%2F1.webm`),
    ).toBe("abc/1.webm");
  });

  it("returns nothing for empty or missing values", () => {
    expect(coachAudioPath(null)).toBeNull();
    expect(coachAudioPath(undefined)).toBeNull();
    expect(coachAudioPath("")).toBeNull();
    expect(coachAudioPath("   ")).toBeNull();
  });

  it("refuses a URL pointing at another host", () => {
    // A row holding someone else's URL must not become a signing request.
    expect(coachAudioPath("https://evil.example/x.webm")).toBeNull();
    expect(coachAudioPath("http://evil.example/coach-audio-ish/x.webm")).toBeNull();
  });

  it("refuses a URL for a different bucket", () => {
    expect(
      coachAudioPath(`${BASE}/storage/v1/object/public/viz-recordings/abc/1.webm`),
    ).toBeNull();
  });
});
