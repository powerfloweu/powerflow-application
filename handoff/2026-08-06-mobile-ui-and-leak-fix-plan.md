# PowerFlow fix plan — coach mobile overhaul, athlete-side bugs, security & leaks

**Date:** 2026-08-06 · **Prepared by:** audit session (3 parallel code audits + live mobile browsing of the real app at 390×844 with real coach/athlete sessions)
**Executor:** Opus orchestrating Sonnet agents. Each workstream below is scoped to a file set so agents can run in parallel without conflicts.

---

## How to verify any fix (the harness that found these bugs)

`scripts/dev/mobile-screenshot.mjs` signs into localhost as any user (Supabase admin `generate_link` → OTP verify → `@supabase/ssr` cookie injection — no email sent) and screenshots routes at iPhone size, reporting horizontal overflow and failed requests:

```bash
node scripts/dev/mobile-screenshot.mjs trainer.pod@gmail.com /tmp/shots /coach /coach/athletes /coach/activity
node scripts/dev/mobile-screenshot.mjs demo.athlete@powerflow.training /tmp/shots /today /journal /library /you
```

**Note:** `.env.local` was missing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — every session-authed API route 503'd locally until 2026-08-06, when both were appended. Local dev now talks to production data as prod does.

Standard gates for every phase: `npm run typecheck` && `npm test` && `npm run build`, plus a screenshot re-run for UI work. Commit per workstream, not per file.

---

## P0 — Security (fix before anything else; small diffs, big blast radius)

| # | Issue | Where | Fix |
|---|---|---|---|
| S1 | **`/api/coupon` is an unauthenticated paywall bypass + email cannon.** No auth, no rate limit; `code` is brute-forceable (distinct error messages confirm hits); `resultRef` is attacker-chosen with no ownership check, so one leaked code unlocks *any* result in all four tables and emails the victim from our domain, repeatedly. | `app/api/coupon/route.ts:14-52` | Require session auth; `rateLimit` 5/5min per IP; single generic error; verify the ref belongs to the caller (or bind coupon redemption to the signed-in user's email). |
| S2 | **Bulk psychometric PII export behind a weaker second auth path.** `all-results`/`results` skip `requireAdmin()`+TOTP and compare a static `ADMIN_PASSWORD` bearer with non-constant-time `!==`; `all-results` returns up to 1000 rows × 4 tables of names+emails+scores. | `app/api/admin/all-results/route.ts:10-17`, `app/api/admin/results/route.ts:10-17` | Switch both to `requireAdmin()`. |
| S3 | **Admin fallback baked into source.** `ADMIN_EMAIL ?? "trainer.pod@gmail.com"` fails *open* if the env var is missing (preview deploys). | `app/api/admin/conversations/route.ts:15`, `app/api/admin/weekly-checkin-test/route.ts:16` | Drop the fallback; fail closed; route through `requireAdmin()`. |
| S4 | **Live Make.com webhook URL committed as fallback** on a public, unlimited route (the in-file comment already says to rotate it). | `app/api/apply/route.ts:5-8` | Rotate the Make scenario, delete the literal, fail closed, add IP rate limit. |
| S5 | **`voiceId` interpolated raw into the ElevenLabs URL** — SSRF-style primitive under our API key. | `app/api/tts/route.ts:41-48` | Validate `/^[A-Za-z0-9]{20,}$/` or allowlist from `lib/voices.ts`. |
| S6 | Error bodies leak Anthropic SDK internals to users; one admin route serializes whole error objects. | `app/api/ai/parse-entry/route.ts:178,212,232`, `app/api/admin/migrate-checkin-feedback/route.ts:62` | Log server-side, return static strings. |
| S7 | `join/verify` allows unauthenticated coach-code sweeping (returns coach names). | `app/api/join/verify/route.ts` | IP rate limit. |

**Agent split:** one Sonnet agent, sequential, ~1 session. Tests: add a vitest for the coupon route's auth/ownership if feasible; otherwise curl-verify each route's new behavior.

---

## P1 — Broken athlete-side features (verified against code; users hit these today)

1. **Post-competition reflection is dead for everyone.** The Today card only renders if a `meet_reflections` row already exists (`app/(app)/today/page.tsx:222-242`), but nothing ever creates that row except the card's own save — the only reason it ever worked is that rows were seeded manually via SQL. Fix: derive "reflection due" from `profile.meet_date` (1–7 days past), create the row lazily on first save.
2. **Assigned-test lifecycle is inverted.** Dismissing the banner (✕) marks the test `completed_at` and pushes "Test complete ✓" to athlete + "X completed a test" to the coach (`app/api/athlete/assigned-tests/route.ts:80-120`); actually submitting a test never clears the assignment (no submit route touches `assigned_tests`). Also pushes deep-link to nonexistent `/tools` (→ `/library`) and selects nonexistent `full_name` (→ `display_name`) so the coach push is always anonymous. Fix: complete-on-submit keyed by `test_slug`; ✕ becomes a `dismissed_at`/local dismiss with no push.
3. **Monthly-check-in week traps the journal in a loop.** `journal/page.tsx:1016-1022,1310` ignores `isMonthly` and always opens `WeeklyCheckinModal`; on monthly weeks `currentSubmitted` is computed from `monthly_checkins`, so submitting weekly never clears the prompt — modal re-appears forever that week. Fix: branch to `MonthlyCheckinModal` exactly like `AppShell.tsx:429-457`.
4. **`journal_prompt_labels` PATCH silently no-ops for `course_access`-granted athletes** — GET infers effective tier, PATCH checks raw `plan_tier` (`app/api/me/route.ts:122` vs `:211-231`). Extract one `effectiveTier()` helper used by both; make `PromptCustomizer` check `res.ok`.
5. **Meet Day Mode off-by-one west of UTC.** `lib/phase.ts:41-46` parses `YYYY-MM-DD` as UTC midnight then normalizes locally. Fix: parse `ymd + "T12:00:00"` (pattern already used in `today/page.tsx:60`). Same UTC bug class: `you/page.tsx:256`, `chat/page.tsx:566`, `MeetDayMode.tsx:1323`.
6. **One failed fetch = permanent skeleton** on Journal (`journal/page.tsx:989-1025`, no try/catch around `Promise.all`), Course (`course/page.tsx:54-71`), Guide (`guide/page.tsx:265-276`). Add try/finally + error states with retry.
7. **Journal entries undeletable on mobile** — delete button is `opacity-0 group-hover:opacity-100` (`EntryCard.tsx:80`). Always show at reduced opacity.
8. **Double nav chrome on `/upgrade`, `/ego-states`, `/life`** — marketing `NavBar` renders on top of AppShell (`NavBar.tsx:8-12` route list is stale).
9. **PWA opens on the marketing page** — `public/manifest.webmanifest` (`start_url: "/"`) shadows `app/manifest.ts` (`start_url: "/today"`). Delete the static file or fix it; also `sw.js:41` tab-matching fails with query strings.
10. **Gate inconsistencies (recurring bug class):** `/scripts` and `/voices` check raw tier only (`scripts/page.tsx:58-62`, `voices/page.tsx:58-62`); `upgrade/page.tsx:82` shows course_access users as "Opener"; `journal/page.tsx:1062` prompts-customizer gate misses `course_access`. Fix by exporting one shared `effectiveTier()` from `lib/plan.ts` and sweeping every call site.

Plus (same agent, same files): silent-failure sweep — `selectDayType`, `handleDelete`, `markPastDay`, `saveVizKeywords`, `MeetConfigSection.save` (which also can never clear a field due to `undefined`-drop + server merge — `api/me/meet-config:44` also needs a field allowlist), `SurveyModal.submit`, onboarding submit; check-in sliders default unrated answers to 5 (`WeeklyCheckinModal.tsx:95-102`) — require a touch or store null; chat stream error handling (`api/chat/route.ts:556-574` — try/catch around the stream loop, error the controller); duplicated `script-${i}` block ids (`chat/page.tsx:409-427`).

**Agent split:** two Sonnet agents — (A) Today/assigned-tests/reflection/phase-date fixes, (B) Journal/check-in-loop/gates/silent-failures. They share `lib/plan.ts` (`effectiveTier`) — have agent B create it first or land it in a tiny preparatory commit.

---

## P2 — Coach mobile overhaul (the "mess"; sequenced, mostly serial)

Empirically confirmed on the real account: ~160px dead space above the fold; survey modal auto-blocks the dashboard **and must be dismissed twice** (AppShell mounts `SurveyModal`+`NotificationModal`, `app/coach/page.tsx:3454-3462` mounts both again); notification banner overlaps the roster, the Rest Day button, and the open athlete sheet; every one of 16 athletes flagged red "ATTENTION"; active athletes ("3 entries this week") show **0% positive** in alarm red; the sheet's 7-day sentiment chart renders as seven flat dashes; greeting says "HEY, SIPOS" (first word of a Hungarian family-name-first `display_name`); one athlete duplicated in the roster (two Jonah Wiendieck accounts — data cleanup, but also consider surfacing duplicate emails in admin).

### Pass 1 — Shell contract (unblocks accurate testing of everything after)
- Remove per-page `min-h-screen pt-16 pb-24` from `app/coach/page.tsx:3470`, `coach/athletes/page.tsx:596`, `coach/activity/page.tsx:106` — AppShell already pads (`AppShell.tsx:394-397`). Kills the dead space.
- Add `export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }` to `app/layout.tsx` — today every `env(safe-area-inset-*)` in the app resolves to 0, so the installed PWA puts the header under the notch and TabBar under the home indicator. Simultaneously convert `h-screen`/`vh` in AppShell + coach desktop pane to `dvh` (`app/coach/page.tsx:3613`, `BottomSheet.tsx:114,133,136`).
- Delete the duplicate `SurveyModal`/`NotificationModal`/notification fetch from `app/coach/page.tsx` (`:3298,:3454-3462`) — also fixes the scroll-position-reset on close (double body-scroll-lock bug).
- Reposition the notification banner so it never overlays interactive content (its own layout row above the TabBar, not floating over content), or gate it to appear below the fold content.
- Delete dead code in `app/coach/page.tsx`: `RosterSummary`, `SummaryTile`, `AttentionBanner`, `CoachHeader`, unused `silentCount` prop, unused imports (`:2719-2906,:21-24`).

### Pass 2 — BottomSheet rewrite (`app/components/BottomSheet.tsx`)
- `vh` → `dvh`; drive height from state (`h-[60dvh]`/`h-[90dvh]`) not inline styles (the `min-h` currently makes drag-down a no-op); add `onPointerCancel`; gate drag on `matchMedia` not `window.innerWidth`; safe-area padding on the scroll body regardless of footer (`:166-171`); close button ≥44px.

### Pass 3 — Data truth on the roster
- **No-data ≠ 0%.** Where entries=0, show "—" neutral, not red `0%` (`MobileAthleteRow`, stat tiles, sheet header pill). Rethink flag inputs: an athlete with 3 entries this week whose entries are neutral shouldn't be "NEEDS ATTENTION" red; "Never active" should be its own state, not max-alarm.
- Flat sentiment chart: `app/coach/page.tsx:2447-2455` — give the bar row a real height (`h-12`) and pixel heights (copy `MoodSparkline` at `:2061`).
- Greeting: use full `display_name` (or a dedicated first-name field), never `split(" ")[0]` — breaks on Hungarian name order.
- Avatar fallback: `object-cover` + initials fallback on image error (alt text currently spills out of the circle while loading/broken).
- Flag word or `aria-label` on the mobile row (color-only today, `:2303`).

### Pass 4 — Unify athlete detail (the big one)
Mobile sheet has 3 tabs (Overview/Activity/Profile); desktop `ClientCard` has 8. Missing on mobile: check-in feedback (voice+text), training log with week nav, test scores + assign test, prompts customizer, suggest-tool, mental tools editor, meet dashboard. `MobileAthleteSheet` even receives `feedbackByEntry`/`onFeedbackSaved` and never uses them (`:2354-2362`). Extract ONE tabbed athlete-detail component parameterized by density, rendered in `BottomSheet` on mobile and inline on desktop. This single refactor also fixes the mobile i18n gap (all mobile strings hardcoded English — full list in audit: `:2326-2704,:3476-3526`) and continues the planned `app/coach/page.tsx` split (currently 3,915 lines; extract to `app/coach/components/`).

### Pass 5 — Ergonomics sweep (coach + athlete shared)
- Tap targets ≥44px: sheet ✕, notes toggle, segmented tabs, sort chips (`:2389,:2428`, `BottomSheet.tsx:159`, `athletes/page.tsx:189,:635`).
- iOS zoom: every input/textarea `text-base` on mobile (`:2412,:1029,:2012`, `athletes/page.tsx:623`, `pending/page.tsx:174-184`, `CoachDigests.tsx:105`).
- `break-words` on all preview text (`activity/page.tsx:176-179`, `CoachDigests.tsx:89`, `:3158`) — long URLs currently cause page-wide horizontal scroll.
- Tablet: move the desktop split from `md:` to `lg:` and fix `CoachHomePanel` fixed grids (`:3049-3079`) — at 768px the detail pane is 224px wide with 4-col stat grids.
- 5-col check-in grids → 3-col on mobile (`:2495,:488`, `athletes/page.tsx:257`); micro-type floor 10px.
- Invite link unreachable on mobile once a coach has athletes (`:3484` renders `InvitePanel` only when roster is empty) — always reachable from the You tab or Home.
- `/coach/athletes` + `/coach/activity` get a desktop treatment (or redirect to `/coach` on `lg:`); currently 512px columns on 1920px screens, unreachable from desktop nav.

**Agent split:** Pass 1+2 = one agent (shell+sheet, must land first). Pass 3 = one agent (roster truth). Pass 4 = one agent, the largest (athlete-detail unification + i18n). Pass 5 = one agent (mechanical sweep). Run 3 and 5 in parallel after 1+2; run 4 after 3 (it consumes the unified flag logic). Screenshot-verify after every pass with the harness (coach account, all three routes + opened sheet).

---

## P3 — Client-side leaks (one agent, independent of everything above)

1. **Mic stays live after unmount** — `chat/page.tsx:21-43` SpeechRecognition never stopped (also stale-closure `onresult`; copy the `onResultRef` pattern from `VizLiveSession.tsx:256`); same in `VoicePhotoCapture.tsx:165-171`.
2. **MediaRecorder + getUserMedia stream leaked** if the coach check-in feedback editor unmounts mid-recording (`app/coach/page.tsx:286-301`) — stop tracks in an unmount effect, not only `onstop`.
3. **Voice preview stacks Audio elements + leaks object URLs** (`you/page.tsx:727-746`) — re-entrancy guard defeated by `finally`; revoke on ended+error+unmount (copy `scripts/page.tsx:83-100` engine).
4. **Debounced coach-note timers fire after unmount** (`app/coach/page.tsx:3363`).
5. **Mux upload poll re-arms forever** incl. on error, and survives unmount via async re-arm (`VideoUpload.tsx:74-90`) — cancelledRef + max attempts + backoff.

## P4 — API hygiene (one agent)

- Rate limits on: `ai/parse-entry` (Opus vision on user uploads, no size cap — add both), `course/generate-plan`, `apply`, `coupon`, `mux/upload`.
- `me/meet-config` merge accepts arbitrary keys into JSONB forever (`:44`) — field allowlist + numeric coercion (mirror `life/config/route.ts:46-53`); this also enables clearing fields (P1 depends on it).
- Await `sendBroadcastPush` (`admin/broadcasts/route.ts:137`) — currently truncated by lambda freeze mid-fanout.
- `tools/track`: add the `isConfigured` guard.
- TTS 2500-char silent truncation (`tts/route.ts:39`): chunk or surface a warning.
- Verify Upstash env vars are set in prod (limiter silently degrades to per-instance memory otherwise).

## P5 — Polish backlog (batchable, low risk; do last or opportunistically)

- i18n the hardcoded English strewn through athlete UI (list in audit: Today coach-suggestion card, journal check-in section labels, PostCompReflection, You-page sections, course editor pages, `weekLabel()` en-GB months, WeekBar day initials, EntryCard, chat feedback banner) and the training-journal questions (translations exist; `TRAINING_QKEY` mapping is written but never used — `journal/page.tsx:29-35`).
- `AppShell`/`TabBar` default `planTier` to `"pr"` → locked tabs flash unlocked pre-fetch; default to most-locked.
- Survey round 1 fires immediately for new users but titles itself "30-day check-in" (`api/survey/route.ts:47-49`); gate round 1 on account age ≥30d.
- Suggest-tool has no tier check (`api/coach/suggest-tool`), and the athlete-side `/library#hash` open fails for above-tier tools — validate at suggest time.
- `EntryCard` re-derives sentiment from text while digest uses stored sentiment (can disagree); `course` NaN progress on stale plan slugs; ego-states page reachable without its only creation path; `PaywallScreen.tsx` dead file; sw.js duplicate-tab open; guide-link locale from localStorage instead of `useT().locale`.

---

## Open product questions (need Dávid's call, not agent judgment)

1. **Traffic-light thresholds** — with journal-sentiment-based flags, an entire real roster shows red. What should "attention" actually mean (e.g. no activity ≥7d OR negative streak, rather than positive-rate < 30%)?
2. **Billing card for the master/owner coach** — should trainer.pod see "Billing not set up — please add a payment method to stay active" at the top of his own dashboard?
3. Duplicate athlete accounts (e.g. two Jonah Wiendieck) — merge/cleanup policy?
4. Should `/coach/athletes` + `/coach/activity` exist on desktop, or is desktop `/coach` the single surface?

## Suggested execution order for Opus

```
Phase 1 (parallel):  P0 security  |  P3 leaks  |  P4 hygiene
Phase 2 (parallel):  P1-A today/tests/reflection  |  P1-B journal/gates/silent-failures
Phase 3 (serial):    P2 pass 1+2 → then parallel: pass 3 | pass 5 → pass 4
Phase 4:             P5 polish sweep + full regression (typecheck, tests, build,
                     mobile screenshot suite on both roles, desktop 1440px spot-check)
```

Every phase ends with: gates green, screenshot diff reviewed, one commit per workstream pushed. The harness plus real-session injection makes "looks right on an iPhone" a checkable gate rather than a guess — use it.
