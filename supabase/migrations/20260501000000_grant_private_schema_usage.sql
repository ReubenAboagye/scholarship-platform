-- ============================================================
-- grant_private_schema_usage.sql
-- Grants usage on the private schema to authenticated users
-- so that RLS policies and triggers can execute successfully.
-- ============================================================

GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, anon, service_role;
