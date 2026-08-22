/**
 * Emails for the affiliate coach application flow. Kept out of the route so
 * the HTML can be unit-tested — these go to people outside the app, where a
 * broken template is a visible embarrassment rather than a log line.
 */

import { sendEmail } from "@/lib/email";
import { esc } from "@/lib/seminarEmails";
import { countryLabel } from "@/lib/countries";
import {
  qualificationLabel,
  experienceLabel,
  languageLabels,
  type CoachApplication,
} from "@/lib/coachApply";

const CONTACT = "david@power-flow.eu";

// ── Confirmation to the applicant ────────────────────────────────────────────

export function applicantSubject(): string {
  return "We've got your application — PowerFlow";
}

export function applicantHtml(app: CoachApplication): string {
  const firstName = app.fullName.trim().split(/\s+/)[0];
  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:8px 0;color:#18181b;line-height:1.6">
  <p style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#7c3aed;margin:0 0 6px">
    Application received
  </p>
  <h1 style="font-size:24px;font-weight:800;margin:0 0 18px;line-height:1.25">
    Coaching with PowerFlow
  </h1>

  <p style="font-size:15px;margin:0 0 20px">Hi ${esc(firstName)},</p>
  <p style="font-size:15px;margin:0 0 20px">
    Thanks for applying to coach with PowerFlow. David reads every application
    himself, so this will take a few days rather than a few minutes — you'll hear
    back either way.
  </p>
  <p style="font-size:15px;margin:0 0 28px">
    If anything changes in the meantime, or you'd like to add something, just reply
    to <a href="mailto:${CONTACT}" style="color:#7c3aed">${CONTACT}</a>.
  </p>

  <p style="font-size:14px;color:#52525b;margin:0 0 28px">
    David — PowerFlow
  </p>

  <p style="font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:14px;margin:0">
    You're getting this because you applied at power-flow.eu. Want your details
    deleted? Email <a href="mailto:${CONTACT}" style="color:#7c3aed">${CONTACT}</a>
    and we'll remove them.
  </p>
</div>`.trim();
}

export function applicantText(app: CoachApplication): string {
  const firstName = app.fullName.trim().split(/\s+/)[0];
  return [
    `Coaching with PowerFlow`,
    ``,
    `Hi ${firstName},`,
    ``,
    `Thanks for applying to coach with PowerFlow. David reads every application himself, so this will take a few days rather than a few minutes — you'll hear back either way.`,
    ``,
    `If anything changes in the meantime, or you'd like to add something, just reply to ${CONTACT}.`,
    ``,
    `David — PowerFlow`,
    ``,
    `Want your details deleted? Email ${CONTACT} and we'll remove them.`,
  ].join("\n");
}

/** Never throws — a failed email must not fail the application. */
export async function sendApplicantConfirmation(app: CoachApplication): Promise<void> {
  const ok = await sendEmail({
    to:      app.email,
    subject: applicantSubject(),
    html:    applicantHtml(app),
    text:    applicantText(app),
  });
  if (!ok) console.error("[coach-apply] confirmation email failed for", app.email);
}

// ── Notification to the owner ────────────────────────────────────────────────

export function ownerHtml(app: CoachApplication): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#71717a;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:4px 0;color:#18181b">${value}</td></tr>`;

  return `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">
  <p style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.12em;margin:0 0 4px">
    Coach application
  </p>
  <h2 style="margin:0 0 16px;font-size:20px">${esc(app.fullName)}</h2>
  <table style="font-size:14px;border-collapse:collapse">
    ${row("Email", esc(app.email))}
    ${app.country ? row("Country", esc(countryLabel(app.country))) : ""}
    ${row("Background", esc(qualificationLabel(app.qualification)))}
    ${row("Experience", esc(experienceLabel(app.experience)))}
    ${row("Coaches in", esc(languageLabels(app.languages)))}
    ${app.instagram ? row("Instagram", `<a href="https://www.instagram.com/${esc(app.instagram)}/">@${esc(app.instagram)}</a>`) : ""}
    ${app.website ? row("Website", `<a href="${esc(app.website)}">${esc(app.website)}</a>`) : ""}
  </table>

  ${app.athletes ? `<p style="font-size:14px;margin:16px 0 0"><strong>Who they work with:</strong><br>${esc(app.athletes)}</p>` : ""}
  <p style="font-size:14px;margin:16px 0 0"><strong>Why PowerFlow:</strong><br>${esc(app.motivation)}</p>

  <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0">
    Full list in the admin dashboard → Coach applications tab.
  </p>
</div>`.trim();
}

/** Never throws — a failed notification must not fail the application. */
export async function notifyOwnerOfApplication(app: CoachApplication): Promise<void> {
  const to = (process.env.COACH_APPLY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "").trim();
  if (!to) {
    console.warn("[coach-apply] no COACH_APPLY_NOTIFY_EMAIL or ADMIN_EMAIL set — skipping notification");
    return;
  }
  const ok = await sendEmail({
    to,
    subject: `Coach application — ${app.fullName}`,
    html:    ownerHtml(app),
  });
  if (!ok) console.error("[coach-apply] owner notification failed for", app.email);
}
