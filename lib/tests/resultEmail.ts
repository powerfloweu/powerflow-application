/**
 * Emails a durable link to a test result, so the taker can reopen it (and their
 * unlocked report) on any device instead of relying on browser localStorage.
 * Two modes: "submit" (right after finishing) and "unlock" (full report opened).
 * Never throws — returns false on any failure.
 */
import { sendEmail } from "@/lib/email";
import type { TestType } from "@/lib/tests/resultPayload";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.power-flow.eu";

const TEST_NAME: Record<TestType, string> = {
  acsi: "Athlete Coping Skills Inventory",
  csai: "Competitive State Anxiety Inventory",
  das: "Dysfunctional Attitude Scale",
  sat: "Self-Awareness Test",
};

export function resultLink(type: TestType, resultRef: string): string {
  return `${APP_URL}/tests/${type}/results?ref=${encodeURIComponent(resultRef)}`;
}

function shell(bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#888">
        PowerFlow · Mental tests are screening and self-reflection tools, not clinical diagnoses.
      </p>
    </div>`;
}

export async function sendResultEmail(opts: {
  to: string;
  firstName: string;
  type: TestType;
  resultRef: string;
  mode: "submit" | "unlock";
}): Promise<boolean> {
  const { to, firstName, type, resultRef, mode } = opts;
  if (!to) return false;

  const name = TEST_NAME[type];
  const link = resultLink(type, resultRef);
  const hi = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";

  const button = `
    <p style="margin-top:20px">
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
        ${mode === "unlock" ? "Open your full report →" : "View your results →"}
      </a>
    </p>
    <p style="font-size:12px;color:#888;margin-top:12px">Or copy this link: ${link}</p>`;

  const subject =
    mode === "unlock"
      ? `Your full ${name} report is ready`
      : `Your ${name} results`;

  const intro =
    mode === "unlock"
      ? `<p>Your full <strong>${name}</strong> report is now unlocked — every subscale explained, what it means under pressure, and what to work on.</p>`
      : `<p>Thanks for completing the <strong>${name}</strong>. Here's your results page — bookmark this link so you can come back to it anytime, on any device.</p>`;

  return sendEmail({
    to,
    subject,
    html: shell(`<p style="font-size:16px">${hi}</p>${intro}${button}`),
    text: `${hi}\n\n${mode === "unlock" ? `Your full ${name} report is unlocked.` : `Your ${name} results are ready.`}\n\n${link}`,
  });
}
