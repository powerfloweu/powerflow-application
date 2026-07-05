/**
 * Fire-and-forget notifications to a coach when one of their athletes is active
 * (check-in, journal entry, post-competition reflection).
 *
 * Push is sent for every event and is naturally gated by whether the coach has
 * enabled notifications (sendPushToUser no-ops without a push subscription).
 * Email is sent only for the lower-frequency, higher-signal events (check-ins
 * and reflections) — journal entries would be too noisy to email.
 *
 * Never throws.
 */
import { dbSelect } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import { sendEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.power-flow.eu";

export type CoachEvent =
  | { kind: "weekly" }
  | { kind: "monthly" }
  | { kind: "reflection" }
  | { kind: "journal"; preview?: string; mentioned?: boolean };

async function getAuthUserEmail(userId: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const user = await res.json() as { email?: string };
    return user.email ?? null;
  } catch { return null; }
}

interface PushCopy { title: string; body: string; tag: string; }
interface EmailCopy { subject: string; intro: string; }

/** Build the push (+ optional email) copy for a given event and athlete. */
function copyFor(athleteName: string, athleteUserId: string, event: CoachEvent): {
  push: PushCopy;
  email: EmailCopy | null;
} {
  switch (event.kind) {
    case "weekly":
    case "monthly": {
      const label = event.kind;
      return {
        push: {
          title: `New ${label} check-in`,
          body: `${athleteName} just submitted their ${label} check-in`,
          tag: `checkin-${athleteUserId}-${label}`,
        },
        email: {
          subject: `${athleteName} submitted their ${label} check-in`,
          intro: `just submitted their <strong>${label} check-in</strong>. Head to your coach dashboard to review it and leave feedback.`,
        },
      };
    }
    case "reflection":
      return {
        push: {
          title: "New post-competition reflection",
          body: `${athleteName} shared a post-competition reflection`,
          tag: `reflection-${athleteUserId}`,
        },
        email: {
          subject: `${athleteName} shared a post-competition reflection`,
          intro: `just shared a <strong>post-competition reflection</strong>. Head to their profile to read it.`,
        },
      };
    case "journal": {
      const preview = event.preview ? `: "${event.preview}"` : "";
      return {
        push: event.mentioned
          ? {
              title: `${athleteName} mentioned you 📓`,
              body: event.preview ? `"${event.preview}"` : "in a journal entry",
              tag: `journal-${athleteUserId}`,
            }
          : {
              title: `${athleteName} wrote a journal entry 📓`,
              body: `New journal entry${preview}`,
              tag: `journal-${athleteUserId}`,
            },
        email: null, // journal entries are too frequent to email
      };
    }
  }
}

/**
 * Notify the athlete's coach of an activity event.
 * Looks up the athlete's coach_id + display_name, then sends push (+ email
 * where appropriate). Both are awaited so the serverless function doesn't exit
 * before delivery. Silently returns if the athlete has no coach.
 */
export async function notifyCoachOfActivity(
  athleteUserId: string,
  event: CoachEvent,
): Promise<void> {
  try {
    const profiles = await dbSelect<{ display_name: string; coach_id: string | null }>("profiles", {
      id: `eq.${athleteUserId}`,
      select: "display_name,coach_id",
    });
    const profile = profiles[0];
    if (!profile?.coach_id) return;

    const athleteName = profile.display_name ?? "An athlete";
    const { push, email } = copyFor(athleteName, athleteUserId, event);

    const tasks: Promise<unknown>[] = [
      sendPushToUser(profile.coach_id, {
        title: push.title,
        body: push.body,
        url: "/coach",
        tag: push.tag,
      }).catch((err) => console.error("[coachNotify] push failed", err)),
    ];

    if (email) {
      const coachEmail = await getAuthUserEmail(profile.coach_id);
      if (coachEmail) {
        tasks.push(
          sendEmail({
            to: coachEmail,
            subject: email.subject,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <p style="font-size:16px;color:#111">Hi Coach,</p>
                <p style="font-size:15px;color:#333">
                  <strong>${athleteName}</strong> ${email.intro}
                </p>
                <a href="${APP_URL}/coach" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                  Open PowerFlow →
                </a>
                <p style="margin-top:24px;font-size:12px;color:#888">PowerFlow · You're receiving this because you're listed as this athlete's coach.</p>
              </div>
            `,
            text: `${athleteName} ${email.intro.replace(/<[^>]+>/g, "")} Visit ${APP_URL}/coach`,
          }).catch((err) => console.error("[coachNotify] email failed", err)),
        );
      }
    }

    await Promise.all(tasks);
  } catch { /* never throw */ }
}

/**
 * Back-compat wrapper for the check-in call sites.
 */
export async function notifyCoachOfCheckin(
  athleteUserId: string,
  checkinType: "weekly" | "monthly",
): Promise<void> {
  return notifyCoachOfActivity(athleteUserId, { kind: checkinType });
}
