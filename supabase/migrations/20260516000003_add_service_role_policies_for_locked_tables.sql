-- ============================================================
-- add_service_role_policies_for_locked_tables.sql
--
-- Supabase Security Advisor lint 0008 reports RLS-enabled tables
-- with no policies. These tables are intentionally not exposed to
-- anon/authenticated users; only server-side service-role code
-- should read or write them.
-- ============================================================

DROP POLICY IF EXISTS "embedding_cache_service_role_all"
  ON public.embedding_cache;
CREATE POLICY "embedding_cache_service_role_all"
  ON public.embedding_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "match_explanation_cache_service_role_all"
  ON public.match_explanation_cache;
CREATE POLICY "match_explanation_cache_service_role_all"
  ON public.match_explanation_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "page_views_service_role_all"
  ON public.page_views;
CREATE POLICY "page_views_service_role_all"
  ON public.page_views
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
