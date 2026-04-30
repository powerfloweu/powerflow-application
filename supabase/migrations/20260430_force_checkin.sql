-- Lets Dev Tools force the weekly check-in modal on any user's next app load.
alter table profiles add column if not exists force_checkin boolean default false;
