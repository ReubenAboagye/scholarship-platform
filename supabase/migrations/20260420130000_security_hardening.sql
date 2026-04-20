-- ============================================================
-- 016_security_hardening.sql
-- Locks down privilege-sensitive profile fields and replaces
-- the in-memory AI matching cooldown with a durable DB-backed
-- rate limit.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

-- Non-admin users must never be able to self-promote or rewrite
-- profile fields that are sourced from auth.
CREATE OR REPLACE FUNCTION private.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF private.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only admins can change profile roles';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Only admins can change profile emails';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_fields ON profiles;
CREATE TRIGGER trg_profiles_protect_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_profile_fields();

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bucket    TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, bucket)
);

ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_rate_limits_select_own" ON public.user_rate_limits;
CREATE POLICY "user_rate_limits_select_own" ON public.user_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rate_limits_insert_own" ON public.user_rate_limits;
CREATE POLICY "user_rate_limits_insert_own" ON public.user_rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rate_limits_update_own" ON public.user_rate_limits;
CREATE POLICY "user_rate_limits_update_own" ON public.user_rate_limits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_user_rate_limit(
  bucket_name TEXT,
  window_seconds INT
)
RETURNS TABLE (allowed BOOLEAN, retry_after_ms BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  last_seen_at TIMESTAMPTZ;
  wait_ms BIGINT;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, GREATEST(window_seconds, 1)::BIGINT * 1000;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::TEXT || ':' || bucket_name, 0));

  SELECT last_seen
    INTO last_seen_at
    FROM public.user_rate_limits
   WHERE user_id = current_user_id
     AND bucket = bucket_name;

  IF last_seen_at IS NOT NULL THEN
    wait_ms := GREATEST(
      0,
      FLOOR(EXTRACT(EPOCH FROM ((last_seen_at + make_interval(secs => window_seconds)) - NOW())) * 1000)::BIGINT
    );

    IF wait_ms > 0 THEN
      RETURN QUERY SELECT FALSE, wait_ms;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.user_rate_limits (user_id, bucket, last_seen)
  VALUES (current_user_id, bucket_name, NOW())
  ON CONFLICT (user_id, bucket)
  DO UPDATE SET last_seen = EXCLUDED.last_seen;

  RETURN QUERY SELECT TRUE, 0::BIGINT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INT) TO authenticated;
