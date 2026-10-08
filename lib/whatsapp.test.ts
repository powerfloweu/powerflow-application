import { describe, expect, it } from "vitest";
import { analyseWhatsAppHeuristically, parseWhatsAppExport } from "./whatsapp";

describe("parseWhatsAppExport", () => {
  it("parses dash-style WhatsApp exports with multiline messages", () => {
    const parsed = parseWhatsAppExport(
      [
        "04/09/2026, 09:12 - Jaana Koskipaasi: I am nervous about deadlifts",
        "This is still part of the same message",
        "04/09/2026, 09:15 - David: What happens when you picture the opener?",
      ].join("\n"),
      "Jaana Koskipaasi",
    );

    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[0].sender_role).toBe("athlete");
    expect(parsed.messages[0].content).toContain("same message");
    expect(parsed.participant_names).toEqual(["David", "Jaana Koskipaasi"]);
    expect(String(parsed.period_start)).toMatch(/^2026-09-04/);
  });

  it("parses bracket-style WhatsApp exports", () => {
    const parsed = parseWhatsAppExport(
      "[04.09.2026, 18:04:33] Jaana: Not sure I can trust my deadlift yet",
      "Jaana Koskipaasi",
    );

    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0]).toMatchObject({
      sender_name: "Jaana",
      sender_role: "athlete",
      content: "Not sure I can trust my deadlift yet",
    });
  });
});

describe("analyseWhatsAppHeuristically", () => {
  it("extracts likely psychological themes and session questions", () => {
    const parsed = parseWhatsAppExport(
      [
        "04/09/2026, 09:12 - Jaana: I am nervous and not sure I can pull this",
        "04/09/2026, 09:18 - Jaana: One bad session makes me think I am not ready",
      ].join("\n"),
      "Jaana",
    );

    const analysis = analyseWhatsAppHeuristically(parsed.messages);

    expect(analysis.summary).toContain("WhatsApp themes");
    expect(analysis.themes.map((t) => t.label)).toContain("Pre-comp anxiety");
    expect(analysis.recurring_beliefs.length).toBeGreaterThan(0);
    expect(analysis.session_questions.length).toBeGreaterThan(0);
  });
});
