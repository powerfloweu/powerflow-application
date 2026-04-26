# Self-Talk Log → Voice Work (Beta)

Implementation handoff for Claude Code.

This package adds a **Beta** mode to the Self-Talk Log built around the coach's voice/parts technique (see `Coach Voice & Method.md` §2.1). Classic mode stays available behind a per-user toggle in **You → Practice preferences**.

---

## TL;DR for the implementing engineer

1. Read this file end-to-end (~10 min).
2. Open `PowerFlow App v2.html` in the project — scroll to the **"Self-Talk Log — Classic vs. Beta"** section. That's the spec, in pixels. The `A.SelfTalk*` components in `src/journal/self_talk_log_a.jsx` are non-binding visual reference; reuse the markup if it helps, but the production version lives in the shipped repo.
3. `handoff/types.ts` is the source of truth for the schema. Copy it into the repo's types module.
4. `handoff/seed_voices.json` is dev fixtures — wire it into your seed task.
5. Ship in 5 PRs, in order. Each is independently mergeable. See **Build order** below.

---

## What we're building

A second-mode for the existing self-talk log. Instead of logging individual thoughts as one-off entries, the user **maps the recurring voices in their head over time** — names them, locates them in the body, gives each one a shape and color, and decides where in space they should sit.

Why: across 10 athlete sessions, this was the single most-repeated technique the coach used. The intent isn't to silence inner critics — it's to make them **identifiable, locatable, and assignable to the right context**. A "harsh" voice useful for technique review is destructive at 1am the night before a meet; the technique gives the user agency over which voice gets the mic and when.

**Critical product principle, from the coach (transcript, athlete 5):**
> "It's part of you and you need it in order to function well. You created it, so you must need it. The task is to not be over-active — only come when I need you."

This means: **never delete a voice**. The "purpose" step (Step 5) is non-skippable for that reason. Every voice gets a job.

---

## Schema

Three things are new. One thing changes.

### New table — `voices`
One row per named voice per user. See `types.ts > Voice`.

```
id              uuid pk
user_id         uuid fk
name            text
shape           enum  cloud|orb|beam|blade|fog|spike|thread|custom
shape_custom_description text null   -- when shape='custom'
color           text   -- hex
size            int    -- 1..5 (XS..XL)
tone            int    -- 0..100 (low → high)
volume          int    -- 0..100 (whisper → loud)
body_locations  text[] -- BodyRegion enum, see types.ts
current_distance enum  on|close|arm|meters|gone
current_side     enum  front|back|left|right
desired_distance enum  ...
desired_side     enum  ...
helps_when      text[] -- free-text tags, presets in HELPS_WHEN_PRESETS
helps_note      text
created_at, updated_at
```

Index on `(user_id, updated_at desc)` for the cast list.

### New table — `voice_drafts`
Autosaved wizard state. One row per `(user_id, editing_voice_id)` — `editing_voice_id` is null when creating new. Wipe on successful save. See `types.ts > VoiceDraft`.

This exists so a user can leave the wizard mid-flow (phone ring, app backgrounded, refresh) without losing progress. **Save on every step transition**, not on every keystroke.

### Changed table — `thought_entries` (or whatever your existing self-talk row is called)
Three nullable columns added:

```
voice_id            uuid null fk -> voices.id   -- which voice did this thought come from?
reframe_text        text null
reframe_test_due    date null    -- "search for those clues" date
reframe_test_resolved enum 'true'|'false' null
```

All nullable. Classic users never set them. Existing rows stay valid.

### Changed table — `user_preferences`
One new column:

```
self_talk_mode  enum 'classic'|'beta_voice_work'  default 'classic'
```

This is the only feature flag. Toggle lives in the You tab.

---

## Routing

```
/log                       → branches on self_talk_mode
                              classic → existing self-talk log (no change)
                              beta    → /log/voices

/log/voices                → cast list + recent thoughts (Beta home)
/log/voices/new            → wizard, ?step=1..5
/log/voices/:id            → saved voice card
/log/voices/:id/edit       → wizard prefilled from row, ?step=1..5
/log/thoughts/new          → existing compose flow + (Beta only) "whose voice?" sheet
```

The wizard is a single route with `?step=N` so back-button works and the URL is shareable. Step state lives in `voice_drafts` server-side, not in URL or localStorage. Reasoning: a user might start the wizard on phone, finish on iPad.

---

## Wizard — six surfaces

Each step's design lives in the canvas section "Self-Talk Log — Classic vs. Beta (Voice work)" inside `PowerFlow App v2.html`. Open it and refer to the corresponding artboard. Below is the **interaction contract** for each — what's local state, what hits the server, what fires next.

### 0 · Cast list (`/log/voices`)

The home for Beta. Lists existing voices, recent thoughts (each tagged with the voice it came from), and the "+ Map a new voice" CTA.

- **Server data:** `GET /api/voices` returns `Voice[]` with `thought_count` joined.
- **Empty state:** if `voices.length === 0`, show a single hero CTA and the coach quote — no list section, no "Recent thoughts."
- **Recent thoughts row:** `GET /api/thought-entries?limit=10&include=voice`. Tap → opens that thought's edit sheet (existing route).
- **+ Map a new voice** → `POST /api/voice-drafts` (server creates blank draft, returns `draft_id`) → navigate to `/log/voices/new?step=1`.

### 1 · Name the voice (`?step=1`)

- Pre-loaded list of the user's existing voices (so they can attach the current thought to one they already mapped).
- One free-text input below for a new name.
- **Validation:** name is 1–60 chars. No uniqueness constraint (a user is allowed two voices with the same name — uncommon but legal; the coach explicitly mentioned that voices can split or merge over time).
- If user picks an existing voice → shortcut: skip to step 5 (purpose review) so they can update when-it-helps for that voice. Save the linked thought entry directly.
- **Continue** → autosave draft, navigate to `?step=2`.

### 2 · Locate it in the body (`?step=2`)

- Inline SVG body silhouette with **12 named regions** (see `BodyRegion` enum). Tap toggles a region in `body_locations[]`.
- Each selected region shows a numbered circle. Tap-and-hold opens a small note input ("tightness," "shaky") — these notes are **not stored on the voice** (they belong to the thought entry, not the voice — see open question Q4 below).
- Two sliders below: **Tone** (low → high) and **Volume** (whisper → loud). Native `<input type="range">`, styled. 0–100 stored.
- **Continue** → autosave draft, `?step=3`.

**Build note:** the silhouette is one SVG file with `<path data-region="...">` per region. Don't render as `<img>`. See `src/journal/self_talk_log_a.jsx > A.SelfTalkBetaLocate` for the path data — copy it.

### 3 · Shape, color, size (`?step=3`)

- 8 shape options: 7 presets + "+ Custom." Each preset is a small SVG glyph component in `lib/voice_shapes/`.
- 8-color swatch row. Hex stored directly.
- 5-size scale (XS..XL) shown as growing circles. Stored as integer 1..5.
- **+ Custom shape** opens a textarea. Stored as `shape='custom', shape_custom_description=text`. For v1 we render `custom` voices using the `cloud` glyph as fallback. (See open question Q1.)
- **Continue** → autosave, `?step=4`.

### 4 · Place it in space (`?step=4`)

- Top-down spatial canvas (SVG, square aspect-ratio). Concentric distance rings. "YOU" puck at center.
- **Two draggable pucks:** "Now" (where the voice currently sits) and "Want" (where the user wants it to sit). Each puck snaps to a `(distance, side)` bucket on drop — no continuous coordinates stored.
- The five distance buckets are deliberately coarse (`on | close | arm | meters | gone`) — this is psychological framing, not a measurement.
- A horizontal "Distance from you" rail below mirrors the current "Want" bucket as a fallback control for users who can't drag accurately.
- **Continue** → autosave, `?step=5`.

**Build note:** drag-and-drop on mobile-web is fiddly. Use `pointermove` + capture, not HTML5 drag events. The spatial canvas in the mock is interactive-stub — both pucks render statically. Production needs real dragging.

### 5 · Purpose — when does it help? (`?step=5`)

- Checklist of preset situations (`HELPS_WHEN_PRESETS` from types.ts). Multi-select.
- "+ Add custom" appends a free-string tag.
- Free-text "In your words" field below. **Required** — minimum 10 characters. This is the non-skippable step that enforces the "every voice has a job" principle.
- Coach quote rendered at top as the rationale.
- **Save voice** → `POST /api/voices` (or `PATCH` if editing) with the assembled draft. Server deletes the draft row, returns the `Voice`. Navigate to `/log/voices/:id` (the saved card).

### Saved card (`/log/voices/:id`)

- Hero glyph + name + descriptors (shape, distance, tone summary).
- Three-stat row: where it shows up, tone, helps when.
- **Reframe test block** — appears only when this is a voice that just had a thought attached AND that thought was negative. Server-rendered prompt with one CTA: "Set test for week 11" (or whatever timeframe the AI suggests). On confirm, sets `reframe_test_due` on the thought entry and schedules a notification.
- "Back to your cast" → `/log/voices`.

---

## You-tab toggle

Lives inside `A.Progress` (existing component). One card titled "Self-Talk Log" with:

- Helper copy explaining what Beta adds.
- A 2-option segmented control: **Classic** | **Voice work · BETA**.
- "Open log →" link in the corner that routes to whichever mode is active.

**Switching from Beta → Classic:**
- Voices stay in the DB. Thought entries keep their `voice_id`.
- Routes `/log/voices/*` start returning 404 to user-facing requests. (Server still has them.)
- Switching back resurfaces everything.
- **No destructive operation.** The toggle is fully reversible at any time.

**Switching from Classic → Beta for the first time:**
- Server creates the user's empty cast (no voices).
- Existing thought entries appear in the "Recent thoughts" rail at the bottom of the cast list, **unassigned**. A small banner above offers: "You have 12 thoughts from before. Want to map them to voices?" — tapping kicks off a batch-assign flow (out of scope for v1, see open question Q2).

---

## API surface (proposed)

All authenticated, all return 401 on missing user.

```
GET    /api/voices                     → { voices: Voice[] }
GET    /api/voices/:id                 → Voice
POST   /api/voices                     → Voice                    body: CreateVoiceRequest
PATCH  /api/voices/:id                 → Voice                    body: UpdateVoiceRequest
DELETE /api/voices/:id                 → 204                      cascade: thought_entries.voice_id = null

GET    /api/voice-drafts/current       → VoiceDraft | null        (active draft for new-voice flow)
POST   /api/voice-drafts               → VoiceDraft               (creates blank, returns id)
PATCH  /api/voice-drafts/:id           → VoiceDraft               body: { state: Partial<Voice> }
DELETE /api/voice-drafts/:id           → 204                      (called server-side after successful POST /api/voices)

POST   /api/thought-entries/:id/link-voice
       body: { voice_id: string | null }                          → ThoughtEntry

GET    /api/thought-entries?include=voice&limit=N                 → ThoughtEntry[]
                                                                  (existing endpoint, +include=voice param)
```

`PATCH /api/user-preferences` already exists — add `self_talk_mode` to its accepted body.

---

## Build order — 5 PRs

Each is independently shippable. Numbers correspond to the order Claude Code should pick them up.

### PR 1 — Schema + toggle (no UI change)
- Migration: new tables + new columns.
- `PATCH /api/user-preferences` accepts `self_talk_mode`.
- Toggle UI in You → Practice preferences. Default `classic`. Selecting Beta currently routes nowhere new (Beta surfaces don't exist yet) — show a "Coming next week" placeholder behind the toggle for staff/internal users only, gated by an env flag.
- **Acceptance:** existing users unaffected, schema migration is reversible, internal users can flip the toggle and see the placeholder.

### PR 2 — Cast list + voice CRUD
- `voices` API endpoints (list, get, post, patch, delete).
- `/log/voices` cast-list screen.
- "+ Map a new voice" CTA navigates to a stub `/log/voices/new` (placeholder until PR 3).
- Saved voice card `/log/voices/:id`.
- Empty state + coach quote.
- **Acceptance:** internal users with the Beta toggle on can create a hardcoded voice via curl and see it render correctly in the list and detail views.

### PR 3 — Wizard steps 1–3
- Routes for `?step=1..3`.
- Body silhouette SVG component with 12 regions.
- Tone/volume sliders.
- 8 shape glyphs in `lib/voice_shapes/`.
- 8-color swatch + 5-size scale.
- Draft autosave on step transition.
- **Acceptance:** internal users can create a voice through the UI through step 3, navigate back/forward, and see draft state persist across page refresh.

### PR 4 — Wizard steps 4–5
- Spatial canvas with two draggable pucks (pointer events; iOS-Safari + Chrome tested).
- Distance/side bucketing.
- Purpose checklist + free-text + 10-char min validation.
- `POST /api/voices` wired to wizard completion.
- Voice draft cleanup.
- **Acceptance:** an internal user can complete the full wizard end-to-end and see the saved voice on the cast list.

### PR 5 — Voice ↔ thought linking
- "Whose voice?" bottom sheet on thought entry compose (Beta mode only).
- `POST /api/thought-entries/:id/link-voice`.
- Recent thoughts rail on cast list.
- Voice-tagged thought rendering on entry detail.
- Reframe test scheduler (saved-card CTA).
- Beta toggle removes the staff gate; Beta is now public-launch ready.
- **Acceptance:** a Beta user can log a new thought, attach it to a voice, see it appear under that voice's `thought_count`, and set a reframe test.

---

## State management — what's local, what's server

| State | Where it lives | Why |
|---|---|---|
| `self_talk_mode` | Server (`user_preferences`) | Multi-device |
| Voice draft (in-progress wizard) | Server (`voice_drafts`) | Survives refresh and device change; user already pays for the round-trip during step transitions |
| Wizard step number | URL query param `?step=N` | Back-button must work |
| Slider drag position (live) | Local React state | Persisted only on `mouseup` / `pointerup` |
| Body region selection | Local React state, persisted via `PATCH voice-draft` on step transition | Same |
| Spatial puck position | Local React state, snaps to bucket on drop, persisted on drop | Same |
| Cast list | Server, fetched fresh on `/log/voices` mount | Cache for 30s — voices change infrequently |
| Recent thoughts on cast list | Server, fetched fresh | These mutate often — don't cache |

**Don't use localStorage for any of this.** Identity is server-side; multi-device users would diverge.

---

## What the mocks DON'T answer — open questions

These need a product call before PR 3 lands. I'd raise them in the kickoff with the PM.

**Q1 · Custom shapes.** When user picks "+ Custom" on step 3, do we (a) accept a free-text description and render `cloud` as fallback, (b) generate a glyph via an LLM image step at save time, or (c) provide a small set of paint tools? My recommendation is (a) for v1 — it's cheap, ships, and lets us measure how often users actually hit "Custom" before investing in (b).

**Q2 · Backfill.** When a Classic user flips to Beta, what happens to their existing thoughts? Out of scope for v1, but we should not silently abandon them. Recommend: show a one-time banner on the cast list, "You have N unmapped thoughts," that opens a flow to bulk-attach them later.

**Q3 · Multiple voices per thought.** Mock implies one voice per thought. I recommend keeping it that way for v1 — it makes `thought_count` per voice unambiguous, and simplifies the UI. If users push back, we can make `voice_id` a many-to-many later (additive change).

**Q4 · Body-region notes.** When a user holds a region during step 2 and adds a note ("tightness here"), is that a property of the **voice** (always shows up here) or of the **thought** (right now, this thought, this body sensation)? My read of the coach's method: it's per-thought. The voice has body locations; the thought has body sensations. Keep them separate. Recommend storing region notes on the thought entry as a `region_notes: { region: BodyRegion, note: string }[]` JSON column. Out of scope for PR 3; revisit in PR 5.

**Q5 · Reframe test scheduling.** Mock shows "Set test for week 11" — does the app pick the date based on the user's training cycle (week-aware), the user's meet calendar, or just `+3 weeks`? My recommendation: in PR 5, just `+3 weeks`. Smarter scheduling later.

**Q6 · Notifications.** Reframe test = a push notification on `reframe_test_due`. Does the existing app have a push-notification stack? If not, this is a separate prerequisite — flag in kickoff.

---

## Files in this handoff

```
handoff/
├── HANDOFF.md            ← this file
├── types.ts              ← schema as TypeScript, copy into the repo's types module
├── seed_voices.json      ← three sample voices + two sample thought entries; wire into seed task
└── _capture.html         ← visual reference page; runs the React mocks against the iOS frame.
                            Open with ?screen=<id> to render one surface at a time.
                            screen ids: classic | beta-intro | beta-1-name | beta-2-locate
                                        | beta-3-shape | beta-4-place | beta-5-purpose
                                        | beta-saved | you-toggle
```

For interactive review, open `PowerFlow App v2.html` and scroll to the section titled **"Self-Talk Log — Classic vs. Beta (Voice work)."** Every surface is laid out side-by-side there.

---

## Source material

- `Coach Voice & Method.md` — coach's complete method including §2.1 on voice/parts work
- `Course Handoff Memo.md` — current state of the shipped repo and what already exists
- `MVP Build Brief.md` — original product brief
- Athlete 5's full transcript (in the source materials provided to the design pass) — the most concentrated single example of the voice technique applied end-to-end. The Cheater / Warrior / Quiet One naming and the "search for clues" reframe pattern come directly from there.

---

## One thing not to lose

Beta isn't a power-user feature. It's the deepest part of the coach's method and the thing athletes told us moved them most. The reason it's behind a toggle is **scope**, not optionality — Classic exists so we can ship without forcing every user through a 5-step wizard the first time they want to log a thought. As adoption stabilizes, we should expect Beta to become the default. Build it that way.
