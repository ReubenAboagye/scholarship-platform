-- ============================================================
-- 019_instrumentation.sql
-- Phase 1 instrumentation: page views and match events.
--
-- What this adds:
--   1. page_views table — anonymous-friendly site visit log with
--      UTM capture, device/browser/OS, scroll depth, duration.
--   2. record_page_view() RPC — SECURITY DEFINER, accepts writes
--      from anon and authenticated callers without exposing the
--      underlying table through INSERT policies.
--   3. Widened match_events.reason_code enum to cover the full
--      taxonomy from the build doc (the old constraint allowed
--      only three values; we need more).
--   4. log_match_impressions() RPC — batch insert for matching
--      runs, callable only by service_role.
--   5. log_match_event() RPC — per-event insert for
--      click/save/dismiss/etc. from the client, SECURITY DEFINER.
--
-- What this does NOT add:
--   - Aggregation views (daily_signups, scholarship_performance,
--     etc.). Those belong in Phase 2 once we see the real query
--     patterns the dashboards need.
--   - Admin read policies. Admin reads go through the service-
--     role client (same pattern as matching).
-- ============================================================


-- ── 1. page_views table ──────────────────────────────────────
-- Designed to be cheap to write (many inserts/day) and
-- reasonable to aggregate (covering indexes on common group-bys).
-- user_id is nullable for anonymous traffic. session_id is a
-- client-generated cookie so we can stitch anon→signup journeys.
--
-- `referrer_host` is a generated column derived from `referrer`
-- so we don't have to parse the URL in every analytics query.

CREATE TABLE IF NOT EXISTS public.page_views (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id    TEXT,
  path          TEXT NOT NULL,
  referrer      TEXT,
  referrer_host TEXT GENERATED ALWAYS AS (
    CASE
      WHEN referrer IS NULL OR referrer = '' THEN NULL
      -- Strip scheme then take everything up to the next slash or query.
      ELSE split_part(
        split_part(
          regexp_replace(referrer, '^[a-z]+://', ''),
          '/', 1
        ),
        '?', 1
      )
    END
  ) STORED,
  country       TEXT,
  user_agent    TEXT,
  device_type   TEXT CHECK (device_type IS NULL
                            OR device_type IN ('mobile','tablet','desktop','bot')),
  browser       TEXT,
  os            TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_term      TEXT,
  utm_content   TEXT,
  scroll_depth  SMALLINT CHECK (scroll_depth IS NULL
                                OR (scroll_depth >= 0 AND scroll_depth <= 100)),
  duration_ms   INT      CHECK (duration_ms IS NULL OR duration_ms >= 0),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hot path: "show me views over the last N days, grouped by X".
CREATE INDEX IF NOT EXISTS idx_page_views_occurred
  ON public.page_views(occurred_at DESC);

-- Per-user journey reconstruction.
CREATE INDEX IF NOT EXISTS idx_page_views_user_occurred
  ON public.page_views(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

-- Anon session stitching.
CREATE INDEX IF NOT EXISTS idx_page_views_session_occurred
  ON public.page_views(session_id, occurred_at DESC)
  WHERE session_id IS NOT NULL;

-- Top-path queries ("most viewed pages").
CREATE INDEX IF NOT EXISTS idx_page_views_path_occurred
  ON public.page_views(path, occurred_at DESC);

-- Attribution / traffic-source queries.
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source
  ON public.page_views(utm_source, occurred_at DESC)
  WHERE utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_page_views_referrer_host
  ON public.page_views(referrer_host, occurred_at DESC)
  WHERE referrer_host IS NOT NULL;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies. Writes go through the
-- SECURITY DEFINER RPC below; reads go through the service-role
-- client from admin pages (service_role bypasses RLS).


-- ── 2. record_page_view() RPC ────────────────────────────────
-- Callable by anon + authenticated. Validates inputs, truncates
-- anything too long, and stamps auth.uid() so clients can't
-- impersonate another user. The function runs with the privileges
-- of its owner (postgres), so it can write to page_views despite
-- the locked-down RLS.

CREATE OR REPLACE FUNCTION public.record_page_view(
  p_path          TEXT,
  p_session_id    TEXT    DEFAULT NULL,
  p_referrer      TEXT    DEFAULT NULL,
  p_user_agent    TEXT    DEFAULT NULL,
  p_device_type   TEXT    DEFAULT NULL,
  p_browser       TEXT    DEFAULT NULL,
  p_os            TEXT    DEFAULT NULL,
  p_country       TEXT    DEFAULT NULL,
  p_utm_source    TEXT    DEFAULT NULL,
  p_utm_medium    TEXT    DEFAULT NULL,
  p_utm_campaign  TEXT    DEFAULT NULL,
  p_utm_term      TEXT    DEFAULT NULL,
  p_utm_content   TEXT    DEFAULT NULL,
  p_scroll_depth  INT     DEFAULT NULL,
  p_duration_ms   INT     DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid           UUID := auth.uid();
  clean_device  TEXT;
  clean_scroll  SMALLINT;
BEGIN
  -- Path is required. Truncate aggressively — realistic paths
  -- are well under 500 chars and we don't want pathological
  -- payloads bloating the table.
  IF p_path IS NULL OR length(p_path) = 0 THEN
    RETURN;
  END IF;

  -- Normalise device_type; silently drop unknown values rather
  -- than error so a misbehaving client doesn't lose the event.
  clean_device := CASE
    WHEN p_device_type IN ('mobile','tablet','desktop','bot') THEN p_device_type
    ELSE NULL
  END;

  -- Clamp scroll_depth to [0,100]; drop anything outside.
  clean_scroll := CASE
    WHEN p_scroll_depth IS NULL              THEN NULL
    WHEN p_scroll_depth < 0                  THEN 0
    WHEN p_scroll_depth > 100                THEN 100
    ELSE p_scroll_depth
  END;

  INSERT INTO public.page_views (
    user_id, session_id, path, referrer, country, user_agent,
    device_type, browser, os,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    scroll_depth, duration_ms
  ) VALUES (
    uid,
    NULLIF(left(p_session_id,    64),    ''),
    left(p_path,                 500),
    NULLIF(left(p_referrer,      500),   ''),
    NULLIF(left(p_country,       8),     ''),
    NULLIF(left(p_user_agent,    500),   ''),
    clean_device,
    NULLIF(left(p_browser,       64),    ''),
    NULLIF(left(p_os,            64),    ''),
    NULLIF(left(p_utm_source,    100),   ''),
    NULLIF(left(p_utm_medium,    100),   ''),
    NULLIF(left(p_utm_campaign,  100),   ''),
    NULLIF(left(p_utm_term,      100),   ''),
    NULLIF(left(p_utm_content,   100),   ''),
    clean_scroll,
    GREATEST(0, COALESCE(p_duration_ms, 0))
  );
END;
$$;

-- Lock down execute: only the two roles that actually call this.
REVOKE EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) TO anon, authenticated;


-- ── 3. Widen match_events.reason_code ────────────────────────
-- The original check constraint only allowed three values; the
-- build doc's taxonomy needs more. Drop and recreate.

ALTER TABLE public.match_events
  DROP CONSTRAINT IF EXISTS match_events_reason_code_check;

ALTER TABLE public.match_events
  ADD CONSTRAINT match_events_reason_code_check
  CHECK (
    reason_code IS NULL
    OR reason_code IN (
      'wrong_country',
      'wrong_degree',
      'wrong_eligibility',
      'too_competitive',
      'deadline_too_close',
      'not_interested',
      'duplicate',
      'other'
    )
  );

-- Also widen event_type to cover the taxonomy we actually log.
-- (The old constraint already covers most; this is idempotent.)
ALTER TABLE public.match_events
  DROP CONSTRAINT IF EXISTS match_events_event_type_check;

ALTER TABLE public.match_events
  ADD CONSTRAINT match_events_event_type_check
  CHECK (event_type IN (
    'impression', 'click', 'save', 'unsave',
    'apply_start', 'apply_submit',
    'dismiss', 'not_relevant', 'view_detail'
  ));


-- ── 4. log_match_impressions() RPC ───────────────────────────
-- Batch insert impressions after a matching run. Called server-
-- side only (service_role) from the /api/matching route. Takes
-- the results array + the user_id and writes one row per
-- scholarship shown, with rank and score preserved.
--
-- Using jsonb here keeps the call site simple — we pass the
-- same results array that goes to match_history.

CREATE OR REPLACE FUNCTION public.log_match_impressions(
  p_user_id    UUID,
  p_session_id UUID,
  p_results    JSONB
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INT := 0;
BEGIN
  IF p_user_id IS NULL OR p_results IS NULL OR jsonb_typeof(p_results) <> 'array' THEN
    RETURN 0;
  END IF;

  INSERT INTO public.match_events (
    user_id, scholarship_id, event_type,
    rank_position, match_score, session_id
  )
  SELECT
    p_user_id,
    (elem->'scholarship'->>'id')::uuid,
    'impression',
    (rn - 1)::int,  -- 0-based rank to match web conventions
    COALESCE((elem->>'match_score')::numeric, NULL),
    p_session_id
  FROM jsonb_array_elements(p_results) WITH ORDINALITY AS t(elem, rn)
  WHERE elem->'scholarship'->>'id' IS NOT NULL;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_match_impressions(UUID, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.log_match_impressions(UUID, UUID, JSONB)
  TO service_role;


-- ── 5. log_match_event() RPC ─────────────────────────────────
-- Single-event insert for client-initiated signals: click, save,
-- unsave, apply_start, apply_submit, dismiss, not_relevant,
-- view_detail. Uses auth.uid() so clients can't forge user_id.

CREATE OR REPLACE FUNCTION public.log_match_event(
  p_scholarship_id UUID,
  p_event_type     TEXT,
  p_rank_position  INT    DEFAULT NULL,
  p_match_score    NUMERIC DEFAULT NULL,
  p_reason_code    TEXT   DEFAULT NULL,
  p_session_id     UUID   DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL OR p_scholarship_id IS NULL OR p_event_type IS NULL THEN
    RETURN;
  END IF;

  -- Validate event_type against the table's check constraint
  -- early so we get a clean error rather than a 23514.
  IF p_event_type NOT IN (
    'impression','click','save','unsave',
    'apply_start','apply_submit',
    'dismiss','not_relevant','view_detail'
  ) THEN
    RAISE EXCEPTION 'Invalid event_type: %', p_event_type;
  END IF;

  INSERT INTO public.match_events (
    user_id, scholarship_id, event_type,
    rank_position, match_score, reason_code, session_id
  ) VALUES (
    uid, p_scholarship_id, p_event_type,
    p_rank_position, p_match_score, p_reason_code, p_session_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_match_event(UUID, TEXT, INT, NUMERIC, TEXT, UUID)
  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.log_match_event(UUID, TEXT, INT, NUMERIC, TEXT, UUID)
  TO authenticated;
