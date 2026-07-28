-- Expand ingestion_method to allow 'harvested' (scholars4dev discovery pipeline)
-- Applied directly via Supabase MCP execute_sql on 2026-07-28.
-- This file exists to keep local migration history in sync.

ALTER TABLE public.scholarships DROP CONSTRAINT IF EXISTS scholarships_ingestion_method_check;
ALTER TABLE public.scholarships ADD CONSTRAINT scholarships_ingestion_method_check
  CHECK (ingestion_method IN ('manual', 'scraped', 'sheets_import', 'harvested'));
