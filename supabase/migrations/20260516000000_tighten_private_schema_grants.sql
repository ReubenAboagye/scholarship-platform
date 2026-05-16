-- ============================================================
-- tighten_private_schema_grants.sql
--
-- Replaces the broad EXECUTE ON ALL FUNCTIONS grant with
-- explicit per-function grants.  The private schema is not
-- exposed through the Supabase Data API, but if it ever
-- were, this prevents anon/authenticated from calling
-- internal trigger or helper functions.
--
-- Functions currently in private:
--   • private.is_admin()      — referenced by RLS policies
--   • private.protect_profile_fields() — trigger (SECURITY DEFINER)
--
-- Only is_admin() needs to be executable by session users so
-- that RLS policies on profiles, scholarships, countries, etc.
-- can evaluate.  The trigger function runs as its definer.
-- ============================================================

-- 1. Revoke the overly broad grants from the previous migration
REVOKE ALL ON SCHEMA private FROM authenticated, anon, service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM authenticated, anon, service_role;

-- 2. Re-grant the minimum required
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, anon;
