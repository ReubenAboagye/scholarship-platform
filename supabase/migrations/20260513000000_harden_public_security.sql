-- ============================================================
-- harden_public_security.sql
-- Adds database-side guardrails for public analytics and outbound
-- scholarship links. App-layer validation already exists; these
-- constraints keep direct SQL/import paths honest too.
-- ============================================================

ALTER TABLE public.scholarships
  DROP CONSTRAINT IF EXISTS scholarships_application_url_http_check;

ALTER TABLE public.scholarships
  ADD CONSTRAINT scholarships_application_url_http_check
  CHECK (application_url ~* '^https?://');

-- Anonymous page views now go through /api/page-view, where IP and
-- session rate limits run before the service-role insert. Do not
-- expose this write RPC directly through the Data API.
REVOKE EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) TO service_role;
