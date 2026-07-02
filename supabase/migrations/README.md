# Database migrations

## Baseline

`00000000000000_baseline_schema.sql` is the **full production schema** as of
2026-07-02 — all 33 tables, their columns, constraints, foreign keys, indexes,
RLS flags, and policies. It was reconstructed directly from the live database
via the Supabase Management API and `pg_get_constraintdef`, and verified by
applying it to a clean Postgres 16 instance (builds cleanly and is idempotent).

Everything in the baseline uses `IF NOT EXISTS` / duplicate-safe `DO` blocks, so
it is a **no-op against the existing production database** and safe to re-run.

## Later migrations

The dated files (`20260428_*.sql` onward) are the historical, incremental
migrations. On a database built from the baseline they are redundant no-ops
(they are guarded too); they remain as a record of how the schema evolved.

## Rebuilding a database from scratch

Apply the baseline first, then the dated migrations in filename order:

```bash
psql "$DATABASE_URL" -f 00000000000000_baseline_schema.sql
for f in $(ls 2026*.sql | sort); do psql "$DATABASE_URL" -f "$f"; done
```

FKs reference `auth.users`, so the Supabase `auth` schema must exist first
(it does on any Supabase project; for a vanilla Postgres, create an
`auth.users(id uuid primary key)` stub and an `auth.uid()` function).

## Regenerating the baseline

If the schema drifts, regenerate by dumping the live schema again rather than
hand-editing this file, so it stays a faithful mirror of production.
