-- ============================================================
-- 017_secure_notifications_and_rpcs.sql
-- Adds RLS coverage for notifications tables and narrows
-- execute privileges on public RPCs so they cannot be abused
-- directly through the Data API.
-- ============================================================

-- Notifications shown in the in-app notification center.
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  href       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- Delivery log used by background jobs to deduplicate emails.
CREATE TABLE IF NOT EXISTS public.notification_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  ref_id     UUID,
  channel    TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_log_select_own" ON public.notification_log;
CREATE POLICY "notification_log_select_own" ON public.notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_type_sent
  ON public.notification_log(user_id, type, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_ref_type
  ON public.notification_log(user_id, ref_id, type);

-- Make notifications available to Postgres Changes subscribers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;

-- Functions in public are exposed through the Data API. Revoke broad
-- execute rights first, then grant the minimum callers explicitly.
REVOKE EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INT)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.match_scholarships_gated(vector, TEXT, TEXT, TEXT, NUMERIC, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_scholarships_gated(vector, TEXT, TEXT, TEXT, NUMERIC, INT)
  TO service_role;

-- Restrict rate-limit buckets so clients cannot create arbitrary rows.
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
  allowed_buckets CONSTANT TEXT[] := ARRAY['ai_matching'];
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, GREATEST(window_seconds, 1)::BIGINT * 1000;
    RETURN;
  END IF;

  IF bucket_name IS NULL
     OR bucket_name = ''
     OR NOT (bucket_name = ANY(allowed_buckets)) THEN
    RAISE EXCEPTION 'Unknown rate limit bucket';
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

REVOKE EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_user_rate_limit(TEXT, INT)
  TO authenticated;
