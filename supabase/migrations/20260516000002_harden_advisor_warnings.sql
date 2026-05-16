-- ============================================================
-- harden_advisor_warnings.sql
--
-- Clears Supabase Security Advisor warnings for mutable function
-- search paths, public pgvector extension placement, and exposed
-- SECURITY DEFINER helper functions.
-- ============================================================

-- 1. Move pgvector out of the public schema.
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION vector SET SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 2. Pin search_path on functions flagged by lint 0011.
-- Dynamic ALTERs avoid hard-coding argument signatures for functions
-- whose signatures include extension types such as vector.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'auto_transition_deadline_passed',
        'trigger_generate_embedding',
        'update_updated_at',
        'match_scholarships_gated',
        'generate_scholarship_slug',
        'immutable_array_to_text',
        'handle_new_user',
        'rls_auto_enable',
        'log_match_event'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, extensions, pg_temp',
      fn
    );
  END LOOP;
END;
$$;

-- 3. Trigger/event-infrastructure SECURITY DEFINER functions should
-- not be callable through /rest/v1/rpc by anon/authenticated users.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'handle_new_user',
        'rls_auto_enable',
        'trigger_generate_embedding'
      )
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',
      fn
    );
  END LOOP;
END;
$$;

-- 4. Match-event writes now go through server routes that authenticate
-- the user, rate-limit the request, and insert with the service role.
REVOKE EXECUTE ON FUNCTION public.log_match_event(
  UUID, TEXT, INT, NUMERIC, TEXT, UUID
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.log_match_event(
  UUID, TEXT, INT, NUMERIC, TEXT, UUID
) TO service_role;
