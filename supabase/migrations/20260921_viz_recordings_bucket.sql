-- Storage bucket for athlete visualization voice notes.
--
-- Private, not public: /api/tools/viz-recording hands out short-lived signed
-- read URLs for these, and a personal recording of someone talking themselves
-- through a lift should not be fetchable by anyone holding the path.
--
-- The bucket was never created, so every upload failed at the signing step
-- (404 "The related resource does not exist") and the feature had never worked.
insert into storage.buckets (id, name, public)
values ('viz-recordings', 'viz-recordings', false)
on conflict (id) do nothing;
