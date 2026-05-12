/**
 * GET  /api/admin/roadmap — parse CLAUDE.md and return roadmap JSON (admin-only)
 * PATCH /api/admin/roadmap — update a single item's status in CLAUDE.md (admin-only)
 *
 * Storage strategy:
 *   - Dev  : read/write the local CLAUDE.md via fs (fast, no API calls)
 *   - Prod : Vercel filesystem is a read-only build snapshot, so we read and
 *            write through the GitHub Contents API to keep state consistent
 *            across requests.  Requires GITHUB_TOKEN env var.
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAdmin } from "@/lib/adminAuth";

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
    totals: { total: done + inProgress + todo, done, in_progress: inProgress, todo },
  };
}

const FLAG: Record<Status, string> = { todo: " ", in_progress: "~", done: "x" };
const CLAUDE_PATH = path.join(process.cwd(), "CLAUDE.md");
const GH_FILE = "CLAUDE.md";
const GH_OWNER = process.env.GITHUB_OWNER ?? "powerfloweu";
const GH_REPO = process.env.GITHUB_REPO ?? "powerflow-application";
const GH_BRANCH = process.env.GITHUB_BRANCH ?? "main";

type GhFileMeta = { sha: string; content: string };

/** Fetch the current CLAUDE.md content + SHA from GitHub. */
async function ghRead(token: string): Promise<GhFileMeta> {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      // Never serve a stale cached copy — we need the latest SHA for the PUT.
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub GET failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<GhFileMeta>;
}

/** Decode GitHub's base64 file content (line-wrapped at 60 chars). */
function ghDecode(content: string): string {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

/** Commit updated content back to GitHub. */
async function ghWrite(
  token: string,
  sha: string,
  content: string,
  commitMsg: string,
): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMsg,
        content: Buffer.from(content).toString("base64"),
        sha,
        branch: GH_BRANCH,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} ${err}`);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      // Production: read from GitHub so we always see the latest committed state,
      // not the build-time snapshot baked into the Vercel deployment.
      const meta = await ghRead(token);
      const md = ghDecode(meta.content);
      return NextResponse.json(parseRoadmap(md));
    }

    // Dev: read straight from the local file.
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

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { text?: string; status?: Status };
    const { text, status } = body;
    if (!text || !status || !FLAG[status]) {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lineRe = new RegExp(
      `^(\\s*-\\s+\\[)[  x~](\\]\\s+${escaped}\\s*)$`,
      "im",
    );

    function applyPatch(md: string): string | null {
      if (!lineRe.test(md)) return null;
      return md.replace(lineRe, `$1${FLAG[status!]}$2`);
    }

    // ── Dev path: local filesystem read + write ──────────────────────────────
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      let md: string;
      try {
        md = await fs.readFile(CLAUDE_PATH, "utf8");
      } catch {
        return NextResponse.json({ error: "CLAUDE.md not found" }, { status: 404 });
      }
      const updated = applyPatch(md);
      if (!updated) {
        return NextResponse.json({ error: "item not found in CLAUDE.md" }, { status: 404 });
      }
      await fs.writeFile(CLAUDE_PATH, updated, "utf8");
      return NextResponse.json(parseRoadmap(updated));
    }

    // ── Production path: read CURRENT state from GitHub, patch, commit ───────
    //
    // We must read from GitHub (not the local build snapshot) so that multiple
    // sequential patches don't overwrite each other.  Each PATCH reads the
    // latest SHA and content, applies its change, then commits — ensuring every
    // click accumulates correctly.
    const meta = await ghRead(token);
    const currentMd = ghDecode(meta.content);
    const updated = applyPatch(currentMd);
    if (!updated) {
      return NextResponse.json({ error: "item not found in CLAUDE.md" }, { status: 404 });
    }

    await ghWrite(
      token,
      meta.sha,
      updated,
      `roadmap: mark "${text.slice(0, 60)}" as ${status.replace("_", " ")}`,
    );

    return NextResponse.json(parseRoadmap(updated));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
