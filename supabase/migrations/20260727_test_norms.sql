-- Data-driven, versioned test benchmarks.
--
-- test_norms stores one row per (test_type, metric, cohort, version): the
-- distribution of that metric across a sample — mean, SD, min/max, and
-- percentiles — plus N and where the sample came from. Multiple versions can
-- coexist; exactly one per (test_type, cohort) is `active` at a time. Results
-- can be stamped with the norm_version used to score them, so a report stays
-- interpretable even after benchmarks are updated later.

CREATE TABLE IF NOT EXISTS test_norms (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type   text        NOT NULL CHECK (test_type IN ('acsi','csai','das','sat')),
  metric_key  text        NOT NULL,               -- e.g. 'score_coping', 'total_score', 'sum_yes'
  cohort_key  text        NOT NULL DEFAULT 'all',  -- 'all' | 'gender:male' | 'gender:female' | future cohorts
  version     int         NOT NULL,                -- monotonically increasing per (test_type)
  n           int         NOT NULL,                -- sample size behind these stats
  mean        numeric,
  sd          numeric,
  min         numeric,
  max         numeric,
  percentiles jsonb       NOT NULL DEFAULT '{}',    -- { "p10":.., "p25":.., "p50":.., "p75":.., "p90":.. }
  source      text        NOT NULL DEFAULT 'powerflow',  -- 'published' | 'powerflow' | 'mixed'
  active      boolean     NOT NULL DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_type, metric_key, cohort_key, version)
);

CREATE INDEX IF NOT EXISTS test_norms_lookup_idx
  ON test_norms (test_type, cohort_key, active);

ALTER TABLE test_norms ENABLE ROW LEVEL SECURITY;
-- Service-role only (admin recompute + read); no public policy needed.

-- Provenance + norm stamping on each result table.
ALTER TABLE acsi_results ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
ALTER TABLE csai_results ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
ALTER TABLE das_results  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';
ALTER TABLE sat_results  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';

ALTER TABLE acsi_results ADD COLUMN IF NOT EXISTS norm_version int;
ALTER TABLE csai_results ADD COLUMN IF NOT EXISTS norm_version int;
ALTER TABLE das_results  ADD COLUMN IF NOT EXISTS norm_version int;
ALTER TABLE sat_results  ADD COLUMN IF NOT EXISTS norm_version int;
