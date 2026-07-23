-- Fix schema drift: sat_results was missing the `total_score` column that both
-- the submit route (app/api/test/submit) and the coach dashboard
-- (app/api/coach/athletes) reference. Its absence made every Self-Awareness
-- submission fail with a 500 (nothing saved) AND broke the coach's SAT read.
-- total_score mirrors sum_yes (the count of "yes" answers, used as the
-- at-a-glance figure on the coach dashboard).

ALTER TABLE sat_results ADD COLUMN IF NOT EXISTS total_score int;

-- Backfill historical rows so past results show a score for coaches.
UPDATE sat_results SET total_score = sum_yes WHERE total_score IS NULL;
