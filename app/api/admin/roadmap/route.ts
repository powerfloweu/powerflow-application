/**
 * GET /api/admin/roadmap
 * Parses CLAUDE.md (repo root) and returns the roadmap as structured JSON.
 * Admin-only.
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

export async function GET() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
  if (!adminEmail || !isConfigured) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionEmail = (user?.email ?? "").toLowerCase().trim();
  if (!sessionEmail || sessionEmail !== adminEmail) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const filePath = path.join(process.cwd(), "CLAUDE.md");
  try {
    const md = await fs.readFile(filePath, "utf8");
    return NextResponse.json(parseRoadmap(md));
  } catch {
    return NextResponse.json({
      sections: [],
      totals: { total: 0, done: 0, in_progress: 0, todo: 0 },
      error: "CLAUDE.md not found",
    });
  }
}
