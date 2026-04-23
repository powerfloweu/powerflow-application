-- ============================================================
-- PowerFlow — Phase 1 Migration
-- Adds meet_date to the profiles table.
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

alter table profiles add column if not exists meet_date date;
