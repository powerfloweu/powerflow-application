/**
 * The link in every result email must point at a page that exists.
 *
 * It didn't, for five months. `resultLink()` built "/tests/${type}/results",
 * which is right for acsi, csai and das purely by coincidence — their type
 * name matches their directory. "sat" lives at /tests/self-awareness, so every
 * SAT result email since April linked to a 404, including for people who had
 * paid for the report.
 *
 * These assertions read the real directories under app/tests, so adding a test
 * type or renaming a route breaks the test rather than the email.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { RESULT_ROUTE, RESULT_TABLE, type TestType } from "./resultPayload";
import { resultLink } from "./resultEmail";

const TESTS_DIR = join(__dirname, "../../app/tests");
const TYPES = Object.keys(RESULT_ROUTE) as TestType[];

describe("result email links", () => {
  it("covers every test type", () => {
    expect(TYPES.sort()).toEqual(Object.keys(RESULT_TABLE).sort());
  });

  it.each(TYPES)("%s points at a results page that exists on disk", (type) => {
    const dir = join(TESTS_DIR, RESULT_ROUTE[type], "results");
    expect(existsSync(dir), `no page at app/tests/${RESULT_ROUTE[type]}/results`).toBe(true);
  });

  it.each(TYPES)("%s builds a link under its real route", (type) => {
    const link = resultLink(type, "pfsa_123_abc");
    expect(link).toContain(`/tests/${RESULT_ROUTE[type]}/results`);
    expect(link).toContain("ref=pfsa_123_abc");
  });

  it("does not link SAT to /tests/sat, which has never existed", () => {
    // The exact bug: the type name is not the route.
    expect(resultLink("sat", "x")).not.toMatch(/\/tests\/sat\//);
    expect(resultLink("sat", "x")).toContain("/tests/self-awareness/results");
  });

  it("url-encodes the ref rather than pasting it in raw", () => {
    expect(resultLink("sat", "a b&c")).toContain("ref=a%20b%26c");
  });

  it("every route it can point at is a real directory", () => {
    const onDisk = readdirSync(TESTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    for (const type of TYPES) {
      expect(onDisk, `app/tests/${RESULT_ROUTE[type]} is missing`).toContain(RESULT_ROUTE[type]);
    }
  });
});
