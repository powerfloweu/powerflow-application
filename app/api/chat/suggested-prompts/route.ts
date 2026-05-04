/**
 * GET /api/chat/suggested-prompts
 * Returns 4–5 personalised prompt chips for the Coach AI welcome screen.
 * Context sources: profile (meet date), journal sentiment/themes, ego states,
 * conversation summaries, and recent training mood.
 */

import { NextResponse } from "next/server";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { dbSelect } from "@/lib/supabaseAdmin";

const FALLBACK_PROMPTS = [
  "Map my ego states with me",
  "What patterns do you see in my recent entries?",
  "Help me debrief today's training session",
  "Generate a visualization script in my coach's voice",
  "I'm in my head — help me switch states",
];

type ProfileRow = {
  id: string;
  meet_date: string | null;
  display_name: string | null;
};

type JournalRow = {
  sentiment: string | null;
  themes: string[] | null;
  created_at: string;
};

type EgoStateRow = {
  id: string;
};

type SummaryRow = {
  id: string;
};

type TrainingRow = {
  mood_rating: number | null;
  entry_date: string;
};

export async function GET() {
  if (!isConfigured) return NextResponse.json({ prompts: FALLBACK_PROMPTS });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)
      .toISOString()
      .slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .slice(0, 10);

    const [profiles, entries, egoStates, summaries] = await Promise.all([
      dbSelect<ProfileRow>("profiles", {
        id: `eq.${user.id}`,
        select: "id,meet_date,display_name",
        limit: "1",
      }),
      dbSelect<JournalRow>("journal_entries", {
        user_id: `eq.${user.id}`,
        created_at: `gte.${fourteenDaysAgo}`,
        select: "sentiment,themes,created_at",
        order: "created_at.desc",
        limit: "10",
      }),
      dbSelect<EgoStateRow>("ego_states", {
        user_id: `eq.${user.id}`,
        select: "id",
      }).catch(() => [] as EgoStateRow[]),
      dbSelect<SummaryRow>("conversation_summaries", {
        user_id: `eq.${user.id}`,
        select: "id",
        limit: "3",
      }),
    ]);

    // Training entries fetched separately (table may not always be needed)
    const trainingEntries = await dbSelect<TrainingRow>("training_entries", {
      user_id: `eq.${user.id}`,
      entry_date: `gte.${sevenDaysAgo}`,
      select: "mood_rating,entry_date",
      order: "entry_date.desc",
      limit: "7",
    }).catch(() => [] as TrainingRow[]);

    void trainingEntries; // available for future enhancements

    const profile = profiles[0] ?? null;

    // ── Build prompts ──────────────────────────────────────────────────────────

    const prompts: string[] = [];

    // 1. Ego states — highest priority if none mapped
    if (egoStates.length === 0) {
      prompts.push("Map my ego states with me");
    }

    // 2. Upcoming meet
    const meetDate = profile?.meet_date ? new Date(profile.meet_date) : null;
    const daysToMeet =
      meetDate !== null
        ? Math.ceil((meetDate.getTime() - Date.now()) / 86400000)
        : null;

    if (daysToMeet !== null && daysToMeet >= 0 && daysToMeet <= 21) {
      prompts.push(`Help me prepare mentally for my meet in ${daysToMeet} days`);
    } else if (daysToMeet !== null && daysToMeet > 21 && daysToMeet <= 60) {
      prompts.push("Help me build my mental competition plan");
    }

    // 3. Sentiment-based chips (last 7 days)
    const last7Days = entries.filter(
      (e) => new Date(e.created_at) >= new Date(Date.now() - 7 * 86400000)
    );
    const recentNegative = last7Days.filter(
      (e) => e.sentiment === "negative"
    ).length;
    const recentPositive = last7Days.filter(
      (e) => e.sentiment === "positive"
    ).length;

    if (recentNegative >= 2) {
      prompts.push("I've been struggling this week — let's work through it");
    } else if (last7Days.length === 0) {
      prompts.push("I haven't checked in for a while — let's catch up");
    } else if (recentPositive >= 3) {
      prompts.push("Things have been going well — help me keep the momentum");
    }

    // 4. Theme-based (patterns across all 14-day entries)
    const allThemes = entries.flatMap((e) => e.themes ?? []);
    if (allThemes.filter((t) => t === "Perfectionism").length >= 2) {
      prompts.push("I keep being too hard on myself — help me work on that");
    } else if (allThemes.filter((t) => t === "Pre-comp anxiety").length >= 2) {
      prompts.push("Competition anxiety is showing up a lot — let's address it");
    } else if (allThemes.filter((t) => t === "Self-doubt").length >= 2) {
      prompts.push("Self-doubt has been creeping in — let's work on it");
    }

    // 5. Returning user vs first-time
    if (summaries.length > 0) {
      prompts.push("What patterns do you see in my recent entries?");
    } else {
      prompts.push("What can you see about my mental state from my journal?");
    }

    // 6. Post-session debrief — always useful
    prompts.push("Help me debrief today's training session");

    // 7. State-switching — only once ego states exist
    if (egoStates.length > 0) {
      prompts.push("I need to switch states — walk me through it");
    }

    // 8. Audio script — context-aware wording
    if (daysToMeet !== null && daysToMeet <= 14) {
      prompts.push(
        "Generate a pre-competition script I can listen to in my coach's voice"
      );
    } else {
      prompts.push(
        "Generate a squat visualization script in my coach's voice"
      );
    }

    // Deduplicate and cap at 5
    const result = [...new Set(prompts)].slice(0, 5);

    return NextResponse.json({ prompts: result });
  } catch {
    return NextResponse.json({ prompts: FALLBACK_PROMPTS });
  }
}
