-- Per-athlete visualization reference cards.
--
-- Maps a visualization tool id to a card design id, e.g.
--   { "viz-squat": "squat-stack-depth-drive" }
-- The designs themselves are components in lib/vizCards.tsx; only the
-- assignment lives here, so handing a card to another athlete (or moving it to
-- another lift) is a data change, not a deploy.
alter table profiles
  add column if not exists viz_cards jsonb not null default '{}'::jsonb;
