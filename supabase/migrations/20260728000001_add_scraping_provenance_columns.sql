-- Add scraping provenance columns to scholarships table
-- Applied directly via Supabase MCP execute_sql on 2026-07-28.
-- This file exists to keep local migration history in sync.

ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS source_domain     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scraped_at        TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ingestion_method  TEXT NOT NULL DEFAULT 'manual'
    CHECK (ingestion_method IN ('manual', 'scraped', 'sheets_import'));

CREATE INDEX IF NOT EXISTS idx_scholarships_needs_audit
  ON public.scholarships(ingestion_method)
  WHERE ingestion_method = 'scraped' AND verified_at IS NULL;
