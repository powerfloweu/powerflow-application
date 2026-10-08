/**
 * GET  /api/coach/whatsapp-imports?athlete_id=<uuid>
 * POST /api/coach/whatsapp-imports
 *
 * Coach-only WhatsApp export import. The raw export is parsed, attached to one
 * athlete, analysed locally for coach prep, and stored as coach-owned data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbInsert, dbInsertMany, dbSelect } from "@/lib/supabaseAdmin";
import {
  analyseWhatsAppHeuristically,
  parseWhatsAppExport,
  type WhatsAppAnalysis,
} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EXPORT_CHARS = 1_200_000;

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  coach_id: string | null;
};

type ImportRow = {
  id: string;
  coach_id: string;
  athlete_id: string;
  file_name: string | null;
  file_hash: string;
  message_count: number;
  period_start: string | null;
  period_end: string | null;
  participant_names: string[];
  analysis: WhatsAppAnalysis;
  model: string | null;
  created_at: string;
};

async function requireCoach() {
  if (!isConfigured) return { error: NextResponse.json({ error: "Not configured" }, { status: 503 }) };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const coaches = await dbSelect<{ id: string }>("profiles", {
    id: `eq.${user.id}`,
    role: "eq.coach",
    select: "id",
  });
  if (!coaches.length) return { error: NextResponse.json({ error: "Not a coach" }, { status: 403 }) };
  return { user };
}

async function getCoachAthlete(coachId: string, athleteId: string): Promise<ProfileRow | null> {
  const rows = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${athleteId}`,
    coach_id: `eq.${coachId}`,
    select: "id,display_name,role,coach_id",
    limit: "1",
  });
  return rows[0] ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await requireCoach();
  if ("error" in auth) return auth.error;

  const athleteId = req.nextUrl.searchParams.get("athlete_id");
  if (!athleteId) return NextResponse.json({ error: "athlete_id required" }, { status: 400 });

  const athlete = await getCoachAthlete(auth.user.id, athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const imports = await dbSelect<ImportRow>("whatsapp_imports", {
    coach_id: `eq.${auth.user.id}`,
    athlete_id: `eq.${athleteId}`,
    order: "created_at.desc",
    limit: "10",
    select: "id,coach_id,athlete_id,file_name,file_hash,message_count,period_start,period_end,participant_names,analysis,model,created_at",
  }).catch(() => [] as ImportRow[]);

  return NextResponse.json({ imports });
}

export async function POST(req: NextRequest) {
  const auth = await requireCoach();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit(`whatsapp-import:${auth.user.id}`, { limit: 6, windowSec: 3600 });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: { athlete_id?: string; file_name?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const athleteId = body.athlete_id;
  const content = body.content?.trim() ?? "";
  if (!athleteId) return NextResponse.json({ error: "athlete_id required" }, { status: 400 });
  if (content.length < 20) return NextResponse.json({ error: "Export content is empty" }, { status: 400 });
  if (content.length > MAX_EXPORT_CHARS) return NextResponse.json({ error: "Export is too large" }, { status: 413 });

  const athlete = await getCoachAthlete(auth.user.id, athleteId);
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const fileHash = createHash("sha256").update(`${athleteId}\n${content}`).digest("hex");
  const existing = await dbSelect<ImportRow>("whatsapp_imports", {
    coach_id: `eq.${auth.user.id}`,
    athlete_id: `eq.${athleteId}`,
    file_hash: `eq.${fileHash}`,
    select: "id,coach_id,athlete_id,file_name,file_hash,message_count,period_start,period_end,participant_names,analysis,model,created_at",
    limit: "1",
  }).catch(() => [] as ImportRow[]);
  if (existing[0]) return NextResponse.json({ import: existing[0], duplicate: true });

  const parsed = parseWhatsAppExport(content, athlete.display_name);
  if (parsed.messages.length === 0) {
    return NextResponse.json({ error: "No WhatsApp messages found in this export" }, { status: 400 });
  }

  const analysis = analyseWhatsAppHeuristically(parsed.messages);
  const inserted = await dbInsert("whatsapp_imports", {
    coach_id: auth.user.id,
    athlete_id: athleteId,
    file_name: body.file_name?.slice(0, 240) ?? null,
    file_hash: fileHash,
    message_count: parsed.messages.length,
    period_start: parsed.period_start,
    period_end: parsed.period_end,
    participant_names: parsed.participant_names,
    analysis,
    model: null,
  });
  if (!inserted) return NextResponse.json({ error: "Import failed" }, { status: 500 });

  const messageRows = parsed.messages.map((m) => ({
    import_id: inserted.id,
    coach_id: auth.user.id,
    athlete_id: athleteId,
    sent_at: m.sent_at,
    sender_name: m.sender_name,
    sender_role: m.sender_role,
    content: m.content,
  }));
  const rows = await dbInsertMany("whatsapp_messages", messageRows);
  if (rows.length !== messageRows.length) {
    console.error(`[whatsapp-imports] stored ${rows.length}/${messageRows.length} messages for import ${inserted.id}`);
  }

  const imports = await dbSelect<ImportRow>("whatsapp_imports", {
    id: `eq.${inserted.id}`,
    select: "id,coach_id,athlete_id,file_name,file_hash,message_count,period_start,period_end,participant_names,analysis,model,created_at",
    limit: "1",
  });

  return NextResponse.json({ import: imports[0] ?? { id: inserted.id }, duplicate: false });
}
