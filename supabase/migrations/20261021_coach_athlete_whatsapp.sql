-- The athlete's WhatsApp number, as held by their coach.
--
-- It lives on coach_athlete_settings rather than profiles because it is the
-- coach's contact detail for that athlete, not something the athlete fills in
-- about themselves: two coaches may hold different numbers, and an athlete who
-- leaves a coach should not carry the coach's copy with them.
alter table coach_athlete_settings
  add column if not exists whatsapp_phone text;
