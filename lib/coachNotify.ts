/**
 * Fire-and-forget notifications to a coach when an athlete submits a check-in.
 * Sends both a web-push and an email. Never throws.
 */
import { dbSelect } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import { sendEmail } from "@/lib/email";

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

export async function notifyCoachOfCheckin(
  athleteUserId: string,
  checkinType: "weekly" | "monthly",
): Promise<void> {
  try {
    const profiles = await dbSelect<{ display_name: string; coach_id: string | null }>("profiles", {
      id: `eq.${athleteUserId}`,
      select: "display_name,coach_id",
    });
    const profile = profiles[0];
    if (!profile?.coach_id) return;

    const athleteName = profile.display_name ?? "An athlete";
    const label = checkinType === "monthly" ? "monthly" : "weekly";

    // Push + email in parallel, both awaited so serverless doesn't kill them
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.power-flow.eu";
    const coachEmail = await getAuthUserEmail(profile.coach_id);

    await Promise.all([
      sendPushToUser(profile.coach_id, {
        title: `New ${label} check-in`,
        body: `${athleteName} just submitted their ${label} check-in`,
        url: "/coach",
        tag: `checkin-${athleteUserId}-${label}`,
      }).catch(() => {}),
      coachEmail ? sendEmail({
        to: coachEmail,
        subject: `${athleteName} submitted their ${label} check-in`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <p style="font-size:16px;color:#111">Hi Coach,</p>
            <p style="font-size:15px;color:#333">
              <strong>${athleteName}</strong> just submitted their <strong>${label} check-in</strong>.
              Head to your coach dashboard to review it and leave feedback.
            </p>
            <a href="${appUrl}/coach" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
              View check-in →
            </a>
            <p style="margin-top:24px;font-size:12px;color:#888">PowerFlow · You're receiving this because you're listed as this athlete's coach.</p>
          </div>
        `,
        text: `${athleteName} submitted their ${label} check-in. Visit ${appUrl}/coach to review it.`,
      }).catch(() => {}) : Promise.resolve(),
    ]);
  } catch { /* never throw */ }
}
