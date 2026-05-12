# PowerFlow — Project Memory

This file is read by Claude Code at the start of every session and rendered on
the **Roadmap** tab of the master admin page (`/admin/master`). Update it as
work progresses to keep both Claude and the dashboard in sync.

## Status legend

- `[ ]` — Todo
- `[~]` — In progress
- `[x]` — Done

The parser at `app/api/admin/roadmap/route.ts` reads `### Section` headers and
`- [x|~| ] item` lines under the `## Roadmap` heading. Don't change the
heading structure without updating the parser.

## Roadmap

### Payments & Tiers
- [ ] Stripe payment for all three tiers (opener / second / pr) with upgrade options

### Coach AI
- [ ] Clarice voice install
- [ ] Voice selector for Coach AI
- [ ] Coach dashboard (replace "just select an athlete" with a real dashboard)
- [ ] Monthly check-in simulation

### Localization
- [ ] Hide languages that are not translated yet
- [ ] Ask someone for Hungarian translation
- [ ] Fix national flags on coach language selector

### Admin / Tools
- [ ] Move AI Insights to Dev Tools

### Suggested fixes & cleanup
- [ ] Replace the create-next-app boilerplate README with real project docs
- [ ] Consolidate duplicate `next.config.js` and `next.config.ts` into one file
- [ ] Refresh the docstring at the top of `app/admin/master/page.tsx` (lists only 5 tabs; we now have 8+)
- [ ] Split `app/admin/master/page.tsx` (2600+ lines) into per-tab files under `app/admin/master/tabs/`
- [ ] Add a basic test setup (no tests configured yet)

### Security & hardening
- [ ] Stop accepting `ADMIN_PASSWORD` via URL query param in `app/api/admin/all-results` and `app/api/admin/results` (leaks into logs)
- [ ] Consolidate inconsistent admin auth in `/api/admin/*` into one shared `requireAdmin()` helper
- [ ] Add per-user rate limiting on AI endpoints (`/api/chat`, `/api/tts`, `/api/coach/*`)

### Code quality
- [ ] Remove `PowerFlow course _ AI.zip` from repo root (move to external storage / `.gitignore`)
- [ ] Audit `/scripts/` and `/handoff/` folders — archive or delete unused files
- [ ] Strip ~19 stray `console.log` calls or gate them behind a logger
- [ ] Audit ~59 `as any` / unchecked casts and tighten types

### Dev experience
- [ ] Add `"typecheck": "tsc --noEmit"` script to `package.json`
- [ ] Add Husky + lint-staged for pre-commit lint/typecheck

### Accessibility
- [ ] Add `aria-label`s to icon-only buttons across `app/components/`

### Push notifications (currently in-tab only — no real push)
- [~] Create `public/manifest.webmanifest` (referenced in `app/layout.tsx` but missing — 404 in prod)
- [~] Add a service worker (`public/sw.js`) and register it on app load
- [~] Generate VAPID keys and add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` env vars
- [~] Install `web-push`, add `push_subscriptions` table in Supabase, create `/api/push/subscribe` endpoint
- [x] Build a sender (e.g. `/api/push/send` or cron) that calls `webpush.sendNotification` for check-in reminders and broadcasts

## Session log

Append a short note at the end of each working session: date, branch, what
changed, and what's next. Newest entries on top.

### 2026-05-11 — claude/review-context-Wu0t5
- Added `CLAUDE.md` and `/admin/master` Roadmap tab so progress is visible from the admin dashboard.
- Next: pick a roadmap item to start on — Stripe tiers and Coach AI voice selector are the highest-impact items currently listed.
