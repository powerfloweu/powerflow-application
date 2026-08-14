# Feature spec — coach-authored reflection sets ("From your coach")

**Requested:** 2026-08-07 by Dávid. Immediate trigger: a bespoke 3-part self-reflection
document written for **Marthe Henry** (athlete `a2b8e5c4-4a0d-434e-ab83-d3d305f8b20c`,
coached by `33e897e1-1160-4cb0-98ae-51396b4f98c0`, PR tier, `language: en`). He wants
her to be able to answer it in the app, wants to read her answers, and wants an
**ongoing note** to build up alongside it — generalised so any coach can send any
athlete individual reflection questions and voice notes.

---

## Design principle: this must not become a sixth mechanism

The app already has five separate coach→athlete channels. Before writing new code,
read these — the new feature is mostly a **recombination**, not an invention:

| Existing | What it already gives you |
|---|---|
| `meet_reflections` (+ `app/components/PostCompReflection.tsx`, `/api/meet-reflections`) | **The closest match.** A fixed question set, answers in a JSONB blob keyed by question id, per-question autosave on blur, progress ring, permanently visible to the coach in the Profile tab. Copy this shape. |
| `assigned_tests` (+ `/api/coach/assign-test`, `/api/athlete/assigned-tests`) | The assign → athlete completes → coach sees lifecycle, and the "pending item" card on Today. |
| `tool_suggestions` | Coach→athlete card on the Today page with an optional personal note. |
| `journal_prompt_labels` on `profiles` | Precedent for **per-athlete** coach-authored question wording. |
| `CheckinFeedbackPanel` in `app/coach/page.tsx` | **Voice notes already exist.** Coach records audio + writes text against an athlete's check-in. Reuse this recorder wholesale for the "ongoing note" — do not build a second one. |

If the implementation ends up duplicating any of the above, stop and reuse instead.

---

## Data model

One new table, one child table. Follow `supabase/migrations/` conventions, enable RLS
(all 33 existing tables have it), and add the migration to that folder.

```
reflection_sets
  id            uuid pk
  coach_id      uuid  → profiles(id)
  athlete_id    uuid  → profiles(id)
  title         text          -- "Becoming a coach"
  intro         text null     -- the short framing paragraph under the title
  questions     jsonb         -- [{ id, prompt, helper?, kind: "text"|"commitment" }]
  status        text          -- "draft" | "sent" | "archived"
  created_at / updated_at / sent_at

reflection_answers
  id                uuid pk
  reflection_set_id uuid → reflection_sets(id) on delete cascade
  athlete_id        uuid  -- denormalised for RLS + simple querying
  answers           jsonb -- { [questionId]: string }  (same shape as meet_reflections)
  updated_at
  -- one row per set; upsert-merge on save, exactly like /api/meet-reflections POST
```

**Ongoing note.** Do *not* add a `notes` text column — the request is for a
conversation that accumulates. Add a third table:

```
reflection_notes
  id                uuid pk
  reflection_set_id uuid → reflection_sets(id) on delete cascade
  author_id         uuid  -- coach or athlete; both can contribute
  body              text null
  audio_url         text null   -- reuse CheckinFeedbackPanel's upload path
  created_at
```

This gives a threaded note per reflection set, which is what "ongoing note" means in
practice, and lets the athlete respond rather than only receive.

---

## Flows

**Coach authors** — new section in the athlete Profile tab (next to `SuggestToolSection`,
which is the established place for coach→athlete actions and is now rendered on both
mobile and desktop). Title, optional intro, add/remove/reorder questions each with
optional helper text. Save as draft, then Send.

**Athlete answers** — a card on Today ("From your coach: *Becoming a coach*"), styled
like the existing tool-suggestion card, opening the set. Per-question autosave on blur
with a visible saved/failed state — copy `PostCompReflection`, including its
"Save failed — tap to retry" affordance. Partial answers are normal and expected: the
source document explicitly says *"Choose the questions that feel most alive."* Never
gate on completeness, never nag.

**Coach reads** — answers appear in the Profile tab under the set, alongside the note
thread. Coach adds text or a voice note; athlete can reply in the same thread.

---

## Handle with care

The content is genuinely personal — imposter feelings, rejection, self-worth. Three
non-negotiables:

1. **Tell the athlete the coach can see this.** A visible line on the set, not buried.
   The athlete is answering questions *from* their coach, so visibility is expected —
   but it must be stated, not assumed.
2. **RLS from day one**, matching the rest of the schema: athlete sees their own,
   coach sees only their own athletes'. This is the most sensitive table in the app.
3. **No aggressive prompting.** One gentle Today card. Do not add these to the daily
   push reminder cron, and do not badge them as overdue. This is an invitation.

---

## Seed content — Marthe Henry's three sets

Transcribed from `Marthe_Henry_Self_Reflection_Questions.pdf`. Cover framing:
*"There are no perfect answers. Choose the questions that feel most alive, write
honestly, and notice where certainty, discomfort or resistance appears."*

### Set 1 — "Becoming a coach"
*Intro: Explore whether the obstacle is the exam itself, uncertainty about the career, or what becoming visible as a coach could mean.*
1. Do I genuinely want to coach? What part of coaching feels meaningful to me? — *Think about the work itself - not status, approval or what you believe you should do.*
2. Which feels more frightening: failing the exam, or passing and having to put myself forward? — *Notice which possibility creates the stronger reaction in your body.*
3. If someone chose not to work with me, what would I make that mean about me? — *Separate a person's decision from a global judgment of your ability or worth.*
4. What is postponing protecting me from - and what is it costing me?
5. What would 'ready enough to begin' look like, without requiring myself to feel completely confident?
- **commitment:** One small action I can take this week, even with uncertainty, is:

### Set 2 — "Imposter feelings"
*Intro: Treat the feeling as useful information, not automatic proof. Look for the standards, comparisons and discounted evidence beneath it.*
1. When I feel like an imposter, what exactly do I believe I am pretending to be? — *Name the feared claim as precisely as possible.*
2. What evidence suggests I still have something to learn? What evidence shows I am already capable? — *Make room for both. Developing and being competent can coexist.*
3. Which achievements, experiences or qualities do I dismiss - and how do I explain them away?
4. If another person had my experience and results, how would I assess her readiness? — *Would I apply the same standard to her that I apply to myself?*
5. What would change if confidence were allowed to follow action, rather than having to come first?
- **commitment:** When the imposter feeling returns, I want to remember:

### Set 3 — "Rejection & relationships"
*Intro: Slow down the movement from an ambiguous event to a painful conclusion. Explore what happened, what you needed and what else might be true.*
1. When someone seems distant, unavailable or less responsive, what story do I tell myself first?
2. What objectively happened - and what meaning did I add? — *Write these as two separate statements.*
3. What feeling and unmet need sit underneath my anger, withdrawal or urge for reassurance? — *For example: hurt, fear, belonging, safety, clarity or validation.*
4. What am I hoping the other person will confirm about me? How can I offer myself part of that validation?
5. What are two other plausible explanations that are not judgments of my worth?
6. What would a response look like that respects both my needs and the other person's autonomy?
- **commitment:** Before reacting, I will pause and ask: What happened? What story did I add? What do I need?

Seed these three sets for Marthe via the coach UI once it exists, or via a one-off
script — but **build the feature first**; do not hand-insert rows and call it done,
because the whole point is that Dávid can do this for any athlete himself.

---

## i18n

Marthe is `language: en`, so her sets need no translation — but the **UI chrome**
(card title, buttons, saved/failed states, the visibility notice) must be added to
en/de/hu like everything else. Coach-authored question text is free-form and stays in
whatever language the coach wrote it.
