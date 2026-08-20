/**
 * Email bodies for the seminar sign-up flow.
 *
 * Kept out of the route so the HTML can be unit-tested — these go to people
 * outside the app, where a broken template is a visible embarrassment rather
 * than a log line.
 */

import { sendEmail } from "@/lib/email";
import {
  SEMINAR,
  topicLabel,
  contextLabel,
  formatLabel,
  type SeminarSignup,
  type SignupStatus,
} from "@/lib/seminar";

/** Free-text from a public form goes into HTML — escape it. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CONTACT = "david@power-flow.eu";

/** "Saturday, 3 October 2026" — always rendered on Budapest time. */
export function seminarDateLabel(): string {
  return new Date(SEMINAR.startsAt).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Budapest",
  });
}

/** "3 October" — for running text, where the weekday and year are noise. */
export function seminarShortDate(): string {
  return new Date(SEMINAR.startsAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", timeZone: "Europe/Budapest",
  });
}

// ── Confirmation to the person who signed up ─────────────────────────────────

export function confirmationSubject(status: SignupStatus): string {
  return status === "waitlist"
    ? `You're on the waitlist — ${SEMINAR.title}`
    : `You're in — ${SEMINAR.title}, ${seminarDateLabel()}`;
}

export function confirmationHtml(signup: SeminarSignup, status: SignupStatus): string {
  const waitlisted = status === "waitlist";
  const firstName  = signup.fullName.trim().split(/\s+/)[0];

  const topics = signup.topics
    .map((id) => `<li style="margin:0 0 6px">${esc(topicLabel(id))}</li>`)
    .join("");

  const opening = waitlisted
    ? `All ${SEMINAR.maxParticipants} spots were taken by the time you signed up, so you're
       first in line if someone drops out — which does happen. We'll email you the moment
       a place opens.`
    : `Your spot is saved. You'll get the joining link by email closer to the date —
       there's nothing else you need to do until then.`;

  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:8px 0;color:#18181b;line-height:1.6">

  <p style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#7c3aed;margin:0 0 6px">
    ${waitlisted ? "You're on the waitlist" : "You're in"}
  </p>
  <h1 style="font-size:24px;font-weight:800;margin:0 0 18px;line-height:1.25">
    ${esc(SEMINAR.title)}
  </h1>

  <p style="font-size:15px;margin:0 0 20px">Hi ${esc(firstName)},</p>
  <p style="font-size:15px;margin:0 0 24px">${opening}</p>

  <table style="width:100%;border-collapse:collapse;background:#f4f4f5;border-radius:12px;margin:0 0 24px">
    <tr>
      <td style="padding:16px 18px">
        <p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#71717a;margin:0 0 4px">When</p>
        <p style="font-size:15px;font-weight:700;margin:0">${esc(seminarDateLabel())}</p>
        <p style="font-size:13px;color:#52525b;margin:2px 0 0">${esc(SEMINAR.hostTimeLabel)} · ${esc(SEMINAR.durationLabel)} · online</p>
        <p style="font-size:12px;color:#71717a;margin:8px 0 0">
          That's Central European Summer Time — please check it against your own timezone.
        </p>
      </td>
    </tr>
  </table>

  <p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#71717a;margin:0 0 8px">
    The topics you picked
  </p>
  <ul style="font-size:14px;margin:0 0 8px;padding-left:20px;color:#3f3f46">${topics}</ul>
  <p style="font-size:13px;color:#52525b;margin:0 0 28px">
    These genuinely shape the session — the most-requested topics get the most time.
  </p>

  <p style="font-size:14px;color:#52525b;margin:0 0 6px">
    Can't make it after all, or want your details removed? Just reply to this email.
  </p>
  <p style="font-size:14px;color:#52525b;margin:0 0 28px">
    ${waitlisted ? `Hoping to see you on ${esc(seminarShortDate())}.` : `See you on ${esc(seminarShortDate())}.`}<br>
    David — PowerFlow
  </p>

  <p style="font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:14px;margin:0">
    You're getting this because you signed up at power-flow.eu. We'll only email you about
    this seminar. <a href="mailto:${CONTACT}" style="color:#7c3aed">${CONTACT}</a>
  </p>
</div>`.trim();
}

export function confirmationText(signup: SeminarSignup, status: SignupStatus): string {
  const firstName = signup.fullName.trim().split(/\s+/)[0];
  const opening = status === "waitlist"
    ? `All ${SEMINAR.maxParticipants} spots were taken by the time you signed up, so you're first in line if someone drops out. We'll email you the moment a place opens.`
    : `Your spot is saved. You'll get the joining link by email closer to the date.`;

  return [
    `${SEMINAR.title}`,
    ``,
    `Hi ${firstName},`,
    ``,
    opening,
    ``,
    `WHEN: ${seminarDateLabel()}, ${SEMINAR.hostTimeLabel} (${SEMINAR.durationLabel}, online)`,
    `That's Central European Summer Time — please check it against your own timezone.`,
    ``,
    `The topics you picked:`,
    ...signup.topics.map((id) => `  - ${topicLabel(id)}`),
    ``,
    `These genuinely shape the session — the most-requested topics get the most time.`,
    ``,
    `Can't make it after all, or want your details removed? Just reply to this email.`,
    ``,
    status === "waitlist"
      ? `Hoping to see you on ${seminarShortDate()}.`
      : `See you on ${seminarShortDate()}.`,
    `David — PowerFlow`,
    CONTACT,
  ].join("\n");
}

/** Never throws — a failed confirmation must not fail the sign-up. */
export async function sendConfirmation(
  signup: SeminarSignup,
  status: SignupStatus,
): Promise<void> {
  const ok = await sendEmail({
    to:      signup.email,
    subject: confirmationSubject(status),
    html:    confirmationHtml(signup, status),
    text:    confirmationText(signup, status),
  });
  // They are registered either way — the row is already written. Log loudly so
  // the owner can follow up from the admin tab's Email button.
  if (!ok) console.error("[seminar] confirmation email failed for", signup.email);
}

// ── Notification to the owner ────────────────────────────────────────────────

export function ownerNotificationHtml(signup: SeminarSignup, status: SignupStatus): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#71717a;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:4px 0;color:#18181b">${value}</td></tr>`;

  return `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px">
  <p style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:.12em;margin:0 0 4px">
    ${status === "waitlist" ? "Seminar waitlist" : "Seminar sign-up"}
  </p>
  <h2 style="margin:0 0 16px;font-size:20px">${esc(signup.fullName)}</h2>
  <table style="font-size:14px;border-collapse:collapse">
    ${row("Email", esc(signup.email))}
    ${signup.country ? row("Country", esc(signup.country)) : ""}
    ${row("Coaches", esc(contextLabel(signup.context)))}
    ${row("Topics", signup.topics.map((t) => esc(topicLabel(t))).join("<br>"))}
    ${row("Format", esc(formatLabel(signup.formatPref)))}
    ${signup.materials.length ? row("Wants", esc(signup.materials.join(", "))) : ""}
  </table>
  ${signup.question ? `<p style="font-size:14px;margin:16px 0 0"><strong>Their question:</strong><br>${esc(signup.question)}</p>` : ""}
  <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0">
    Full list and topic tally in the admin dashboard → Seminar tab.
  </p>
</div>`.trim();
}

/** Never throws — a failed notification must not fail the sign-up. */
export async function notifyOwner(
  signup: SeminarSignup,
  status: SignupStatus,
): Promise<void> {
  const to = (process.env.SEMINAR_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "").trim();
  if (!to) {
    console.warn("[seminar] no SEMINAR_NOTIFY_EMAIL or ADMIN_EMAIL set — skipping notification");
    return;
  }

  const ok = await sendEmail({
    to,
    subject: `${status === "waitlist" ? "[Waitlist] " : ""}Seminar sign-up — ${signup.fullName}`,
    html:    ownerNotificationHtml(signup, status),
  });
  if (!ok) console.error("[seminar] owner notification failed for", signup.email);
}
