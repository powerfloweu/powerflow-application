/**
 * GET  /api/admin/roadmap — parse CLAUDE.md and return roadmap JSON (admin-only)
 * PATCH /api/admin/roadmap — update a single item's status in CLAUDE.md (admin-only)
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createClient, isConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Status = "todo" | "in_progress" | "done";

type Item = { status: Status; text: string };
type Section = { name: string; items: Item[] };
type Roadmap = {
  sections: Section[];
  totals: { total: number; done: number; in_progress: number; todo: number };
};

function parseRoadmap(md: string): Roadmap {
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  let inRoadmap = false;
  let current: Section | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Enter the Roadmap block on `## Roadmap`; exit on the next `## ` heading.
    if (/^##\s+/.test(line)) {
      if (/^##\s+Roadmap\s*$/i.test(line)) {
        inRoadmap = true;
        current = null;
        continue;
      }
      if (inRoadmap) break;
    }

    if (!inRoadmap) continue;

    const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
    if (sectionMatch) {
      current = { name: sectionMatch[1], items: [] };
      sections.push(current);
      continue;
    }

    const itemMatch = line.match(/^\s*-\s+\[([ x~])\]\s+(.+?)\s*$/i);
    if (itemMatch && current) {
      const flag = itemMatch[1].toLowerCase();
      const status: Status =
        flag === "x" ? "done" : flag === "~" ? "in_progress" : "todo";
      current.items.push({ status, text: itemMatch[2] });
    }
  }

  let done = 0;
  let inProgress = 0;
  let todo = 0;
  for (const s of sections) {
    for (const i of s.items) {
      if (i.status === "done") done++;
      else if (i.status === "in_progress") inProgress++;
      else todo++;
    }
  }

  return {
    sections,
    totals: {
      total: done + inProgress + todo,
      done,
      in_progress: inProgress,
      todo,
    },
  };
}

async function requireAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const sessionEmail = (user?.email ?? "").toLowerCase().trim();
  return sessionEmail && sessionEmail === adminEmail ? sessionEmail : null;
}

const FLAG: Record<Status, string> = { todo: " ", in_progress: "~", done: "x" };
const CLAUDE_PATH = path.join(process.cwd(), "CLAUDE.md");

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const md = await fs.readFile(CLAUDE_PATH, "utf8");
    return NextResponse.json(parseRoadmap(md));
  } catch {
    return NextResponse.json({
      sections: [],
      totals: { total: 0, done: 0, in_progress: 0, todo: 0 },
      error: "CLAUDE.md not found",
    });
  }
}

export async function PATCH(req: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { text?: string; status?: Status };
  const { text, status } = body;
  if (!text || !status || !FLAG[status]) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let md: string;
  try {
    md = await fs.readFile(CLAUDE_PATH, "utf8");
  } catch {
    return NextResponse.json({ error: "CLAUDE.md not found" }, { status: 404 });
  }

  // Replace the checkbox of the matching item line (first match wins).
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lineRe = new RegExp(
    `^(\\s*-\\s+\\[)[  x~](\\]\\s+${escaped}\\s*)$`,
    "im",
  );
  if (!lineRe.test(md)) {
    return NextResponse.json({ error: "item not found in CLAUDE.md" }, { status: 404 });
  }

  const updated = md.replace(lineRe, `$1${FLAG[status]}$2`);

  try {
    await fs.writeFile(CLAUDE_PATH, updated, "utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Write failed: ${msg}`, cwd: process.cwd(), path: CLAUDE_PATH }, { status: 500 });
  }

  return NextResponse.json(parseRoadmap(updated));
}
