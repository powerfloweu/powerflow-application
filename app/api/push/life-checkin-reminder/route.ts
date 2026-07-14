/**
 * GET /api/push/life-checkin-reminder
 *
 * Vercel Cron — runs daily. For each lifestyle-beta user, computes which
 * check-in dimensions are due today (respecting the adaptive cadence) and, if
 * any are, sends a single web-push nudge. Silent when nothing is due, so the
 * adaptive cadence stays quiet on the days it should.
 *
 * Protected by CRON_SECRET (Vercel sends `Authorization: Bearer <CRON_SECRET>`).
 */

import { NextRequest, NextResponse } from "next/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { sendPushToUser } from "@/lib/push";
import { computeDimStatuses, type LifeDimension, type CheckinRow } from "@/lib/life";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function utcTodayYmd(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = utcTodayYmd();

  const users = await dbSelect<{ user_id: string; dimensions: LifeDimension[] }>("lifestyle_config", {
    select: "user_id,dimensions",
  }).catch(() => []);

  let notified = 0;
  for (const u of users) {
    const dims = Array.isArray(u.dimensions) ? u.dimensions : [];
    if (!dims.length) continue;

    const checkins = await dbSelect<CheckinRow>("lifestyle_checkins", {
      user_id: `eq.${u.user_id}`,
      select: "checkin_date,scores",
      order: "checkin_date.desc",
      limit: "120",
    }).catch(() => []);

    const due = computeDimStatuses(dims, checkins, today).filter((s) => s.due);
    if (!due.length) continue;

    const labels = due.map((s) => s.dim.label);
    const preview = labels.slice(0, 3).join(", ") + (labels.length > 3 ? "…" : "");
    await sendPushToUser(u.user_id, {
      title: `${due.length} check-in item${due.length === 1 ? "" : "s"} due`,
      body: preview,
      url: "/life",
      tag: "life-checkin-due",
    });
    notified++;
  }

  return NextResponse.json({ users: users.length, notified });
}
