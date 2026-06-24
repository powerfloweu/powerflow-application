-- Add Mux playback ID to prep_lifts for in-app video storage
ALTER TABLE prep_lifts ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;

NOTIFY pgrst, 'reload schema';
