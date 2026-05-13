-- Athlete's preferred ElevenLabs voice for the AI Coach TTS.
-- Null = use server default (ELEVENLABS_VOICE_ID env var).
-- Coach's cloned voice (tts_voice_id on coach profile) still takes priority.
alter table public.profiles
  add column if not exists preferred_voice_id text;
