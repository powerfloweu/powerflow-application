/**
 * GET /api/coach/session-prep?athlete_id=<uuid>
 *
 * Coach-only session prep view. Pulls together the existing athlete data:
 * coach notes, recent journal entries, training logs, check-ins, and WhatsApp
 * imports. No model call is made here.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";
import { trainingLogText } from "@/lib/coachDigest";
import type { WhatsAppAnalysis } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  coach_id: string | null;
  meet_date: string | null;
  main_barrier: string | null;
  confidence_break: string | null;
  overthinking_focus: string | null;
  expectations: string | null;
  mental_goals: string[] | null;
};

type NoteRow = {
  content: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  content: string;
  sentiment: string;
  context: string;
  themes: string[];
  created_at: string;
};

type TrainingRow = {
  id: string;
  entry_date: string;
  mood_rating: number | null;
  thoughts_before: string | null;
  thoughts_after: string | null;
  what_went_well: string | null;
  frustrations: string | null;
  next_session: string | null;
  coach_note: string | null;
  created_at: string;
  updated_at: string;
};

type CheckinRow = {
  id: string;
  week_start: string;
  mood_rating: number;
  training_quality: number;
  readiness_rating: number;
  energy_rating: number;
  sleep_rating: number;
  biggest_win: string | null;
  biggest_challenge: string | null;
  focus_next_week: string | null;
  created_at: string;
};

type ImportRow = {
  id: string;
  file_name: string | null;
  message_count: number;
  period_start: string | null;
  period_end: string | null;
  participant_names: string[];
  analysis: WhatsAppAnalysis;
  model: string | null;
  created_at: string;
};

type WhatsAppMessageRow = {
  id: string;
  sent_at: string | null;
  sender_name: string;
  sender_role: string;
  content: string;
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

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysAgoYmd(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function compactText(value: string, max = 220): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function GET(req: NextRequest) {
  const auth = await requireCoach();
  if ("error" in auth) return auth.error;

  const athleteId = req.nextUrl.searchParams.get("athlete_id");
  if (!athleteId) return NextResponse.json({ error: "athlete_id required" }, { status: 400 });

  const athletes = await dbSelect<ProfileRow>("profiles", {
    id: `eq.${athleteId}`,
    coach_id: `eq.${auth.user.id}`,
    select: "id,display_name,role,coach_id,meet_date,main_barrier,confidence_break,overthinking_focus,expectations,mental_goals",
    limit: "1",
  });
  const athlete = athletes[0];
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const [notes, entries, training, checkins, imports, messages] = await Promise.all([
    dbSelect<NoteRow>("coach_notes", {
      coach_id: `eq.${auth.user.id}`,
      athlete_id: `eq.${athleteId}`,
      select: "content,updated_at",
      limit: "1",
    }).catch(() => [] as NoteRow[]),
    dbSelect<EntryRow>("journal_entries", {
      user_id: `eq.${athleteId}`,
      created_at: `gte.${daysAgoIso(30)}`,
      order: "created_at.desc",
      limit: "20",
      select: "id,content,sentiment,context,themes,created_at",
    }).catch(() => [] as EntryRow[]),
    dbSelect<TrainingRow>("training_entries", {
      user_id: `eq.${athleteId}`,
      entry_date: `gte.${daysAgoYmd(30)}`,
      order: "entry_date.desc",
      limit: "20",
      select: "id,entry_date,mood_rating,thoughts_before,thoughts_after,what_went_well,frustrations,next_session,coach_note,created_at,updated_at",
    }).catch(() => [] as TrainingRow[]),
    dbSelect<CheckinRow>("weekly_checkins", {
      user_id: `eq.${athleteId}`,
      order: "year.desc,week_number.desc",
      limit: "4",
      select: "id,week_start,mood_rating,training_quality,readiness_rating,energy_rating,sleep_rating,biggest_win,biggest_challenge,focus_next_week,created_at",
    }).catch(() => [] as CheckinRow[]),
    dbSelect<ImportRow>("whatsapp_imports", {
      coach_id: `eq.${auth.user.id}`,
      athlete_id: `eq.${athleteId}`,
      order: "created_at.desc",
      limit: "5",
      select: "id,file_name,message_count,period_start,period_end,participant_names,analysis,model,created_at",
    }).catch(() => [] as ImportRow[]),
    dbSelect<WhatsAppMessageRow>("whatsapp_messages", {
      coach_id: `eq.${auth.user.id}`,
      athlete_id: `eq.${athleteId}`,
      order: "sent_at.desc.nullslast,created_at.desc",
      limit: "12",
      select: "id,sent_at,sender_name,sender_role,content",
    }).catch(() => [] as WhatsAppMessageRow[]),
  ]);

  const latestImport = imports[0] ?? null;
  const whatsappThemes = latestImport?.analysis?.themes?.map((t) => t.label) ?? [];
  const journalThemes = entries.flatMap((e) => e.themes ?? []);
  const trainingTexts = training.map((t) => trainingLogText(t)).filter(Boolean);

  const focus = {
    key_themes: unique([...whatsappThemes, ...journalThemes]).slice(0, 8),
    risk_flags: latestImport?.analysis?.risk_flags ?? [],
    suggested_interventions: latestImport?.analysis?.suggested_interventions ?? [],
    session_questions: latestImport?.analysis?.session_questions ?? [
      "What has changed since the last time we spoke?",
      "What should we focus on today: confidence, pressure, attention, or recovery?",
    ],
  };

  return NextResponse.json({
    athlete: {
      id: athlete.id,
      display_name: athlete.display_name,
      meet_date: athlete.meet_date,
      mental_goals: athlete.mental_goals ?? [],
      main_barrier: athlete.main_barrier,
      confidence_break: athlete.confidence_break,
      overthinking_focus: athlete.overthinking_focus,
      expectations: athlete.expectations,
    },
    coach_note: notes[0] ?? null,
    focus,
    whatsapp: {
      imports,
      latest_import: latestImport,
      recent_messages: messages.map((m) => ({ ...m, content: compactText(m.content) })),
    },
    recent_journal: entries.map((e) => ({ ...e, content: compactText(e.content) })),
    recent_training: training.map((t) => ({
      ...t,
      summary: compactText(trainingLogText(t)),
    })).filter((t) => t.summary || t.mood_rating != null),
    recent_checkins: checkins,
    training_patterns: trainingTexts.slice(0, 6).map((text) => compactText(text)),
  });
}
