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
- [x] Stripe payment for all three tiers (opener / second / pr) with upgrade options

### Coach AI
- [ ] Clarice voice install
- [x] Voice selector for Coach AI
- [x] Coach dashboard (replace "just select an athlete" with a real dashboard)
- [ ] Monthly check-in simulation

### Localization
- [x] Hide languages that are not translated yet (ES, FR hidden until complete — use READY_LOCALES)
- [ ] Ask someone for Hungarian translation
- [x] Fix national flags on coach language selector (fixed by hiding incomplete locales)

### Admin / Tools
- [ ] Move AI Insights to Dev Tools

### Suggested fixes & cleanup
- [ ] Replace the create-next-app boilerplate README with real project docs
- [x] Consolidate duplicate `next.config.js` and `next.config.ts` into one file
- [ ] Refresh the docstring at the top of `app/admin/master/page.tsx` (lists only 5 tabs; we now have 8+)
- [ ] Split `app/admin/master/page.tsx` (2600+ lines) into per-tab files under `app/admin/master/tabs/`
- [ ] Add a basic test setup (no tests configured yet)

### Security & hardening
- [x] Stop accepting `ADMIN_PASSWORD` via URL query param in `app/api/admin/all-results` and `app/api/admin/results` (leaks into logs)
- [x] Add TOTP 2FA gate to `/admin/master` (Google Authenticator, RFC 6238, 4 h HttpOnly session cookie)
- [x] Consolidate inconsistent admin auth in `/api/admin/*` into one shared `requireAdmin()` helper
- [ ] Add per-user rate limiting on AI endpoints (`/api/chat`, `/api/tts`, `/api/coach/*`)

### Code quality
- [ ] Remove `PowerFlow course _ AI.zip` from repo root (move to external storage / `.gitignore`)
- [ ] Audit `/scripts/` and `/handoff/` folders — archive or delete unused files
- [ ] Strip ~19 stray `console.log` calls or gate them behind a logger
- [ ] Audit ~59 `as any` / unchecked casts and tighten types

### Dev experience
- [x] Add `"typecheck": "tsc --noEmit"` script to `package.json`
- [ ] Add Husky + lint-staged for pre-commit lint/typecheck

### Accessibility
- [ ] Add `aria-label`s to icon-only buttons across `app/components/`

### Push notifications
- [x] Create `public/manifest.webmanifest` (referenced in `app/layout.tsx` but missing — 404 in prod)
- [x] Add a service worker (`public/sw.js`) and register it on app load
- [x] Generate VAPID keys and add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` env vars
- [x] Install `web-push`, add `push_subscriptions` table in Supabase, create `/api/push/subscribe` endpoint
- [x] Build a sender (e.g. `/api/push/send` or cron) that calls `webpush.sendNotification` for check-in reminders and broadcasts

## Medium-term tasks
These are the next meaningful features after quick wins are done.

- **Monthly check-in simulation** — let coaches trigger/preview a monthly check-in for an athlete without waiting for the real date
- **Per-user rate limiting on AI endpoints** — sliding-window limiter (Vercel KV or in-memory) on `/api/chat`, `/api/tts`, `/api/coach/*`
- **Split `admin/master/page.tsx`** — 2600+ lines; move each tab into `app/admin/master/tabs/<tab>.tsx`

## Session log

Append a short note at the end of each working session: date, branch, what
changed, and what's next. Newest entries on top.

### 2026-05-13 — main (continued)
- Coach dashboard revamp: mobile home (greeting, 3-tile strip, priority/stable sections, MobileAthleteSheet), desktop home (CoachHomePanel with stats + attention list + activity feed), sticky athlete header, sidebar sparklines + grouped Priority/Stable sections.
- 4-tab coach bottom nav (Home/Athletes/Activity/You) + new /coach/athletes and /coach/activity pages.
- Broadcast push notifications on publish (fire-and-forget, tag dedup).
- AI voice selector on You page (Clarice/David/Jacqueline, play preview, auto-save via preferred_voice_id).
- Quick wins: hide incomplete locales (ES/FR) via READY_LOCALES, typecheck script, merged next.config, roadmap search.
- Next: monthly check-in simulation or per-user AI rate limiting.

### 2026-05-13 — main
- Stripe integration: checkout sessions, billing portal, webhook handler syncing plan_tier + access flags, admin migrate-stripe endpoint, setup script for products.
- Upgrade page: real Stripe CTAs (replaces mailto), manage-subscription link, success/cancel toasts.
- stripe_customer_id + stripe_subscription_id + stripe_price_id added to profiles table (migration + /api/me exposure).
- Next: run `node scripts/stripe-setup.mjs` (with sk_live_ key) to create products, add env vars (STRIPE_SECOND_PRICE_ID, STRIPE_PR_PRICE_ID, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL), apply DB migration via /api/admin/migrate-stripe.

### 2026-05-12 — main (continued)
- Security: `ADMIN_PASSWORD` moved from URL query param to `Authorization: Bearer` header in `all-results` and `results` routes.
- Security: TOTP 2FA added to `/admin/master` — RFC 6238 implementation using Node built-in crypto, HttpOnly 4 h session cookie, Google Authenticator compatible. Env vars (`TOTP_SECRET`, `TOTP_SESSION_SECRET`) added via Vercel CLI and deployed.
- Push notifications: completed — Vercel cron at 17:00 UTC sends web-push to all subscribers via `web-push`; service worker handles delivery even when browser is closed.
- Admin auth: consolidated 13 routes from 5 different local copies into one shared `lib/adminAuth.ts` `requireAdmin()` helper (−144 lines).
- Next: Stripe tiers (needs product decisions on what's included per tier).

### 2026-05-12 — main
- Push notification UX: 7-day snooze on banner (was permanent dismiss), push subscription status (bell colour) in admin Users tab, Notifications card in You tab.
- Guide refresh: both printable (`content.ts`) and interactive (i18n keys) coach guide updated with accurate approval flow; athlete guide gained "Enable notifications" step.
- Roadmap tab fixes: optimistic updates, all-buttons-disabled-during-patch (prevents concurrent GitHub SHA conflicts), done-item hover cue.
- Roadmap production bug fixed: GET and PATCH now read from GitHub API (`cache: no-store`) when `GITHUB_TOKEN` is set, so sequential clicks accumulate instead of overwriting each other (Vercel filesystem is a frozen build snapshot).

### 2026-05-11 — claude/review-context-Wu0t5
- Added `CLAUDE.md` and `/admin/master` Roadmap tab so progress is visible from the admin dashboard.
- Next: pick a roadmap item to start on — Stripe tiers and Coach AI voice selector are the highest-impact items currently listed.
