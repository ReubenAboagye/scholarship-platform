-- ============================================================
-- Preserve NULL duration for initial pageview rows
--
-- Initial pageview rows intentionally have both scroll_depth and
-- duration_ms as NULL; finalisation rows carry those metrics. The
-- analytics views count initial rows with that NULL/NULL signal.
-- ============================================================

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
  IF p_path IS NULL OR length(p_path) = 0 THEN
    RETURN;
  END IF;

  clean_device := CASE
    WHEN p_device_type IN ('mobile','tablet','desktop','bot') THEN p_device_type
    ELSE NULL
  END;

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
    CASE WHEN p_duration_ms IS NULL THEN NULL ELSE GREATEST(0, p_duration_ms) END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_page_view(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT
) TO anon, authenticated;

UPDATE public.page_views
SET duration_ms = NULL
WHERE scroll_depth IS NULL
  AND duration_ms = 0;
