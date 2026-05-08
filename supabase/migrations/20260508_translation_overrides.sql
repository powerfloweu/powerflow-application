-- Translation override store.
-- Allows editors to update app strings for DE/HU/ES/FR via the /translate UI
-- without a code deploy. The compiled TS dictionaries remain as fallback.

CREATE TABLE IF NOT EXISTS translation_overrides (
  locale      text        NOT NULL CHECK (locale IN ('de', 'hu', 'es', 'fr')),
  key         text        NOT NULL,
  value       text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text,           -- editor email, informational
  PRIMARY KEY (locale, key)
);

-- Index for the public GET endpoint (locale lookup)
CREATE INDEX IF NOT EXISTS translation_overrides_locale_idx
  ON translation_overrides (locale);

-- Public read (used by the i18n provider), editor write via service role
ALTER TABLE translation_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_overrides"
  ON translation_overrides FOR SELECT
  USING (true);

-- Writes go through the /api/admin/translations route (service role), so no
-- INSERT/UPDATE policy for anon is needed.
