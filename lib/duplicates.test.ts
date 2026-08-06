import { describe, it, expect } from "vitest";
import {
  normalizeName,
  normalizeEmailLocalPart,
  findDuplicateGroups,
  indexDuplicates,
} from "./duplicates";

describe("normalizeName", () => {
  it("strips diacritics", () => {
    expect(normalizeName("Dávid")).toBe("david");
  });

  it("lowercases and collapses internal whitespace", () => {
    expect(normalizeName("  Jonah   Wiendieck ")).toBe("jonah wiendieck");
  });
});

describe("findDuplicateGroups — exact-name duplicates", () => {
  it("groups two profiles with the identical display name", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "Jonah Wiendieck" },
      { id: "2", display_name: "Jonah Wiendieck" },
      { id: "3", display_name: "Someone Else" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].signal).toBe("name");
    expect(groups[0].ids.sort()).toEqual(["1", "2"]);
  });
});

describe("findDuplicateGroups — diacritic-insensitive matching", () => {
  it("matches 'Dávid' with 'David'", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "Dávid Sipos" },
      { id: "2", display_name: "David Sipos" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].ids.sort()).toEqual(["1", "2"]);
  });
});

describe("findDuplicateGroups — case/whitespace insensitivity", () => {
  it("matches names differing only in case and extra whitespace", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "jonah  wiendieck" },
      { id: "2", display_name: "  JONAH WIENDIECK  " },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].ids.sort()).toEqual(["1", "2"]);
  });
});

describe("findDuplicateGroups — no-duplicates case", () => {
  it("returns an empty array when every name and email is unique", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "Alice Example", email: "alice@example.com" },
      { id: "2", display_name: "Bob Example", email: "bob@example.com" },
    ]);
    expect(groups).toEqual([]);
  });
});

describe("findDuplicateGroups — email signal", () => {
  it("groups identical email addresses", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "A One", email: "same@example.com" },
      { id: "2", display_name: "B Two", email: "same@example.com" },
    ]);
    expect(groups.filter((g) => g.signal === "email")).toHaveLength(1);
    expect(groups.find((g) => g.signal === "email")?.ids.sort()).toEqual(["1", "2"]);
  });

  it("groups matching local-parts across different domains", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "A One", email: "jonah.w@gmail.com" },
      { id: "2", display_name: "B Two", email: "Jonah.W@yahoo.com" },
    ]);
    expect(groups.filter((g) => g.signal === "email")).toHaveLength(1);
  });

  it("ignores profiles with no email", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "A One", email: null },
      { id: "2", display_name: "B Two", email: undefined },
    ]);
    expect(groups.filter((g) => g.signal === "email")).toHaveLength(0);
  });

  it("reports name and email duplicates as separate groups", () => {
    const groups = findDuplicateGroups([
      { id: "1", display_name: "Jonah Wiendieck", email: "jonah@example.com" },
      { id: "2", display_name: "Jonah Wiendieck", email: "different@example.com" },
      { id: "3", display_name: "Totally Different", email: "jonah@example.com" },
    ]);
    const nameGroup = groups.find((g) => g.signal === "name");
    const emailGroup = groups.find((g) => g.signal === "email");
    expect(nameGroup?.ids.sort()).toEqual(["1", "2"]);
    expect(emailGroup?.ids.sort()).toEqual(["1", "3"]);
  });
});

describe("normalizeEmailLocalPart", () => {
  it("returns null for an empty string", () => {
    expect(normalizeEmailLocalPart("")).toBeNull();
  });

  it("lowercases and strips diacritics from the local part only", () => {
    expect(normalizeEmailLocalPart("Dávid.S@Example.COM")).toBe("david.s");
  });
});

describe("indexDuplicates", () => {
  it("indexes profiles by id with signals and group size", () => {
    const index = indexDuplicates([
      { id: "1", display_name: "Jonah Wiendieck", email: "a@example.com" },
      { id: "2", display_name: "Jonah Wiendieck", email: "b@example.com" },
      { id: "3", display_name: "Unique Person", email: "c@example.com" },
    ]);
    expect(index.get("1")).toEqual({ signals: ["name"], groupSize: 2 });
    expect(index.get("2")).toEqual({ signals: ["name"], groupSize: 2 });
    expect(index.get("3")).toBeUndefined();
  });

  it("returns an empty map when there are no duplicates", () => {
    const index = indexDuplicates([
      { id: "1", display_name: "Alice Example", email: "alice@example.com" },
      { id: "2", display_name: "Bob Example", email: "bob@example.com" },
    ]);
    expect(index.size).toBe(0);
  });
});
