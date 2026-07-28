/**
 * Emails a durable link to a test result, so the taker can reopen it (and their
 * unlocked report) on any device instead of relying on browser localStorage.
 * Localised to the language the taker chose (en/hu/de). Two modes: "submit"
 * (right after finishing) and "unlock" (full report opened).
 * Never throws — returns false on any failure.
 */
import { sendEmail } from "@/lib/email";
import type { TestType } from "@/lib/tests/resultPayload";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.power-flow.eu";

type Lang = "en" | "hu" | "de";
function normLang(lang?: string): Lang {
  return lang === "hu" || lang === "de" ? lang : "en";
}

const TEST_NAME: Record<Lang, Record<TestType, string>> = {
  en: {
    acsi: "Athlete Coping Skills Inventory",
    csai: "Competitive State Anxiety Inventory",
    das: "Dysfunctional Attitude Scale",
    sat: "Self-Awareness Test",
  },
  hu: {
    acsi: "Sportolói Megküzdési Készségek Kérdőív",
    csai: "Versenyszorongás Kérdőív (CSAI-2)",
    das: "Diszfunkcionális Attitűd Skála",
    sat: "Önismereti Teszt",
  },
  de: {
    acsi: "Athleten-Bewältigungsfähigkeiten-Inventar",
    csai: "Wettkampfangst-Inventar (CSAI-2)",
    das: "Dysfunktionale Einstellungsskala",
    sat: "Selbstwahrnehmungstest",
  },
};

const COPY: Record<Lang, {
  hi: (n: string) => string;
  submitSubject: (name: string) => string;
  unlockSubject: (name: string) => string;
  submitIntro: (name: string) => string;
  unlockIntro: (name: string) => string;
  submitBtn: string;
  unlockBtn: string;
  copyLink: string;
  footer: string;
  submitText: (name: string) => string;
  unlockText: (name: string) => string;
}> = {
  en: {
    hi: (n) => (n ? `Hi ${n},` : "Hi,"),
    submitSubject: (name) => `Your ${name} results`,
    unlockSubject: (name) => `Your full ${name} report is ready`,
    submitIntro: (name) => `Thanks for completing the <strong>${name}</strong>. Here's your results page — bookmark this link so you can come back to it anytime, on any device.`,
    unlockIntro: (name) => `Your full <strong>${name}</strong> report is now unlocked — every subscale explained, what it means under pressure, and what to work on.`,
    submitBtn: "View your results →",
    unlockBtn: "Open your full report →",
    copyLink: "Or copy this link:",
    footer: "PowerFlow · Mental tests are screening and self-reflection tools, not clinical diagnoses.",
    submitText: (name) => `Your ${name} results are ready.`,
    unlockText: (name) => `Your full ${name} report is unlocked.`,
  },
  hu: {
    hi: (n) => (n ? `Szia ${n},` : "Szia,"),
    submitSubject: (name) => `A(z) ${name} eredményed`,
    unlockSubject: (name) => `A teljes ${name} riportod elkészült`,
    submitIntro: (name) => `Köszönjük, hogy kitöltötted a(z) <strong>${name}</strong> tesztet. Itt az eredményoldalad — mentsd el ezt a linket, hogy bármikor, bármelyik eszközön visszatérhess hozzá.`,
    unlockIntro: (name) => `A teljes <strong>${name}</strong> riportod mostantól elérhető — minden alskála magyarázata, hogy mit jelentenek nyomás alatt, és min érdemes dolgoznod.`,
    submitBtn: "Eredmények megtekintése →",
    unlockBtn: "Teljes riport megnyitása →",
    copyLink: "Vagy másold ki ezt a linket:",
    footer: "PowerFlow · A mentális tesztek szűrő- és önreflexiós eszközök, nem klinikai diagnózisok.",
    submitText: (name) => `A(z) ${name} eredményed elkészült.`,
    unlockText: (name) => `A teljes ${name} riportod elérhető.`,
  },
  de: {
    hi: (n) => (n ? `Hallo ${n},` : "Hallo,"),
    submitSubject: (name) => `Deine ${name}-Ergebnisse`,
    unlockSubject: (name) => `Dein vollständiger ${name}-Bericht ist fertig`,
    submitIntro: (name) => `Danke, dass du den <strong>${name}</strong> ausgefüllt hast. Hier ist deine Ergebnisseite — speichere diesen Link, um jederzeit und auf jedem Gerät darauf zugreifen zu können.`,
    unlockIntro: (name) => `Dein vollständiger <strong>${name}</strong>-Bericht ist jetzt freigeschaltet — jede Subskala erklärt, was sie unter Druck bedeutet und woran du arbeiten solltest.`,
    submitBtn: "Ergebnisse ansehen →",
    unlockBtn: "Vollständigen Bericht öffnen →",
    copyLink: "Oder kopiere diesen Link:",
    footer: "PowerFlow · Mentale Tests sind Screening- und Selbstreflexionstools, keine klinischen Diagnosen.",
    submitText: (name) => `Deine ${name}-Ergebnisse sind fertig.`,
    unlockText: (name) => `Dein vollständiger ${name}-Bericht ist freigeschaltet.`,
  },
};

export function resultLink(type: TestType, resultRef: string): string {
  return `${APP_URL}/tests/${type}/results?ref=${encodeURIComponent(resultRef)}`;
}

function shell(bodyHtml: string, footer: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#888">${footer}</p>
    </div>`;
}

export async function sendResultEmail(opts: {
  to: string;
  firstName: string;
  type: TestType;
  resultRef: string;
  mode: "submit" | "unlock";
  lang?: string;
}): Promise<boolean> {
  const { to, firstName, type, resultRef, mode } = opts;
  if (!to) return false;

  const lang = normLang(opts.lang);
  const c = COPY[lang];
  const name = TEST_NAME[lang][type];
  const link = resultLink(type, resultRef);
  const hi = c.hi(firstName?.trim() ?? "");
  const isUnlock = mode === "unlock";

  const button = `
    <p style="margin-top:20px">
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
        ${isUnlock ? c.unlockBtn : c.submitBtn}
      </a>
    </p>
    <p style="font-size:12px;color:#888;margin-top:12px">${c.copyLink} ${link}</p>`;

  const intro = `<p>${(isUnlock ? c.unlockIntro : c.submitIntro)(name)}</p>`;

  return sendEmail({
    to,
    subject: (isUnlock ? c.unlockSubject : c.submitSubject)(name),
    html: shell(`<p style="font-size:16px">${hi}</p>${intro}${button}`, c.footer),
    text: `${hi}\n\n${(isUnlock ? c.unlockText : c.submitText)(name)}\n\n${link}`,
  });
}
