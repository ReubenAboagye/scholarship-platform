-- ============================================================
-- 020_analytics_views.sql
-- Read-only SQL views + one RPC that back the admin analytics
-- surface. These sit on top of the instrumentation tables
-- (page_views, match_events) and existing core tables.
--
-- Design notes:
--   - All views are plain non-materialised views. At this scale
--     (~20 scholarships, modest user base) the underlying queries
--     run in single-digit ms. Refreshing a matview would be extra
--     surface with no measurable payoff.
--   - Views are SECURITY INVOKER, so they inherit the caller's
--     RLS context. page_views and match_events have no SELECT
--     policies, which means only service_role (which bypasses
--     RLS) can read these views. That matches the admin backend
--     calling pattern.
--   - get_admin_analytics_summary() is SECURITY DEFINER so it
--     works when called from a server-side admin route that
--     uses the service role. Granted only to service_role.
--
-- What this intentionally does NOT include:
--   - Materialised views / refresh jobs. Revisit if p95 query
--     time ever crosses ~300ms.
--   - Forecasting / anomaly detection — that belongs in the
--     application layer when we add the AI co-pilot.
-- ============================================================


-- ── Helpers ──────────────────────────────────────────────────
-- Consistent day-boundary truncation at UTC. The admin UI can
-- render these in local time; keeping storage UTC avoids DST
-- and timezone drift headaches on aggregates.

-- ── v_platform_summary ───────────────────────────────────────
-- Single-row view with totals + WoW/MoM deltas for the top
-- overview tiles. We compute this in one scan each rather than
-- many small head:true counts from the client.

CREATE OR REPLACE VIEW public.v_platform_summary AS
WITH now_ts AS (
  SELECT
    NOW()                               AS t_now,
    NOW() - INTERVAL '7 days'           AS t_wk_start,
    NOW() - INTERVAL '14 days'          AS t_2wk_start,
    NOW() - INTERVAL '30 days'          AS t_mo_start,
    NOW() - INTERVAL '60 days'          AS t_2mo_start
),
users_agg AS (
  SELECT
    COUNT(*) FILTER (WHERE TRUE)                                              AS total,
    COUNT(*) FILTER (WHERE p.created_at >= (SELECT t_wk_start  FROM now_ts))  AS last_7d,
    COUNT(*) FILTER (WHERE p.created_at >= (SELECT t_2wk_start FROM now_ts)
                       AND p.created_at <  (SELECT t_wk_start  FROM now_ts)) AS prev_7d,
    COUNT(*) FILTER (WHERE p.created_at >= (SELECT t_mo_start  FROM now_ts))  AS last_30d,
    COUNT(*) FILTER (WHERE p.created_at >= (SELECT t_2mo_start FROM now_ts)
                       AND p.created_at <  (SELECT t_mo_start  FROM now_ts)) AS prev_30d
  FROM public.profiles p
),
scholarships_agg AS (
  SELECT
    COUNT(*) FILTER (WHERE is_active = TRUE)                                  AS total_active,
    COUNT(*) FILTER (WHERE is_active = TRUE
                       AND created_at >= (SELECT t_wk_start FROM now_ts))    AS last_7d,
    COUNT(*) FILTER (WHERE is_active = TRUE
                       AND created_at >= (SELECT t_2wk_start FROM now_ts)
                       AND created_at <  (SELECT t_wk_start  FROM now_ts))   AS prev_7d
  FROM public.scholarships
),
tracker_agg AS (
  SELECT
    COUNT(*)                                                                  AS total,
    COUNT(*) FILTER (WHERE created_at >= (SELECT t_wk_start  FROM now_ts))    AS last_7d,
    COUNT(*) FILTER (WHERE created_at >= (SELECT t_2wk_start FROM now_ts)
                       AND created_at <  (SELECT t_wk_start  FROM now_ts))   AS prev_7d
  FROM public.application_tracker
),
saved_agg AS (
  SELECT
    COUNT(*)                                                                  AS total,
    COUNT(*) FILTER (WHERE saved_at >= (SELECT t_wk_start  FROM now_ts))      AS last_7d,
    COUNT(*) FILTER (WHERE saved_at >= (SELECT t_2wk_start FROM now_ts)
                       AND saved_at <  (SELECT t_wk_start  FROM now_ts))     AS prev_7d
  FROM public.saved_scholarships
)
SELECT
  users_agg.total            AS total_users,
  users_agg.last_7d          AS users_last_7d,
  users_agg.prev_7d          AS users_prev_7d,
  users_agg.last_30d         AS users_last_30d,
  users_agg.prev_30d         AS users_prev_30d,
  scholarships_agg.total_active AS total_scholarships,
  scholarships_agg.last_7d   AS scholarships_last_7d,
  scholarships_agg.prev_7d   AS scholarships_prev_7d,
  tracker_agg.total          AS total_applications,
  tracker_agg.last_7d        AS applications_last_7d,
  tracker_agg.prev_7d        AS applications_prev_7d,
  saved_agg.total            AS total_saved,
  saved_agg.last_7d          AS saved_last_7d,
  saved_agg.prev_7d          AS saved_prev_7d
FROM users_agg, scholarships_agg, tracker_agg, saved_agg;


-- ── v_daily_signups ──────────────────────────────────────────
-- Last 30 days of profile creation, one row per UTC day.
-- Empty days are filled with 0 via generate_series so the chart
-- doesn't show gaps (Recharts handles nulls but blanks look
-- worse than zeros on a low-activity site).

CREATE OR REPLACE VIEW public.v_daily_signups AS
WITH day_bounds AS (
  SELECT date_trunc('day', NOW() - INTERVAL '29 days')::date AS start_day,
         date_trunc('day', NOW())::date                       AS end_day
),
days AS (
  SELECT generate_series(
    (SELECT start_day FROM day_bounds),
    (SELECT end_day   FROM day_bounds),
    '1 day'::interval
  )::date AS day
),
counts AS (
  SELECT date_trunc('day', p.created_at)::date AS day, COUNT(*) AS n
  FROM public.profiles p
  WHERE p.created_at >= (SELECT start_day FROM day_bounds)
  GROUP BY 1
)
SELECT d.day, COALESCE(c.n, 0)::int AS signups
FROM days d
LEFT JOIN counts c USING (day)
ORDER BY d.day;


-- ── v_daily_pageviews ────────────────────────────────────────
-- Last 30 days of page views + unique sessions. Uses the
-- initial-row signal (scroll_depth IS NULL AND duration_ms IS
-- NULL) to avoid double-counting finalisation rows. See
-- pageview.ts for why we emit two rows per visit.

CREATE OR REPLACE VIEW public.v_daily_pageviews AS
WITH day_bounds AS (
  SELECT date_trunc('day', NOW() - INTERVAL '29 days')::date AS start_day,
         date_trunc('day', NOW())::date                       AS end_day
),
days AS (
  SELECT generate_series(
    (SELECT start_day FROM day_bounds),
    (SELECT end_day   FROM day_bounds),
    '1 day'::interval
  )::date AS day
),
views AS (
  SELECT
    date_trunc('day', pv.occurred_at)::date AS day,
    COUNT(*)                                AS views,
    COUNT(DISTINCT pv.session_id)           AS unique_sessions
  FROM public.page_views pv
  WHERE pv.occurred_at >= (SELECT start_day FROM day_bounds)
    AND pv.scroll_depth IS NULL           -- initial rows only
    AND pv.duration_ms  IS NULL
  GROUP BY 1
)
SELECT
  d.day,
  COALESCE(v.views,           0)::int AS views,
  COALESCE(v.unique_sessions, 0)::int AS unique_sessions
FROM days d
LEFT JOIN views v USING (day)
ORDER BY d.day;


-- ── v_daily_active_users ─────────────────────────────────────
-- DAU = distinct authenticated users with a page view that day.

CREATE OR REPLACE VIEW public.v_daily_active_users AS
WITH day_bounds AS (
  SELECT date_trunc('day', NOW() - INTERVAL '29 days')::date AS start_day,
         date_trunc('day', NOW())::date                       AS end_day
),
days AS (
  SELECT generate_series(
    (SELECT start_day FROM day_bounds),
    (SELECT end_day   FROM day_bounds),
    '1 day'::interval
  )::date AS day
),
dau AS (
  SELECT
    date_trunc('day', pv.occurred_at)::date AS day,
    COUNT(DISTINCT pv.user_id)              AS n
  FROM public.page_views pv
  WHERE pv.occurred_at >= (SELECT start_day FROM day_bounds)
    AND pv.user_id IS NOT NULL
  GROUP BY 1
)
SELECT d.day, COALESCE(dau.n, 0)::int AS dau
FROM days d
LEFT JOIN dau USING (day)
ORDER BY d.day;


-- ── v_top_pages_30d ──────────────────────────────────────────
-- Most-viewed paths in the last 30 days, with avg duration and
-- scroll depth joined from finalisation rows.

CREATE OR REPLACE VIEW public.v_top_pages_30d AS
WITH initial AS (
  SELECT path, COUNT(*) AS views
  FROM public.page_views
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
    AND scroll_depth IS NULL
    AND duration_ms  IS NULL
  GROUP BY path
),
final_stats AS (
  SELECT
    path,
    AVG(duration_ms)::int          AS avg_duration_ms,
    AVG(scroll_depth)::int         AS avg_scroll_depth,
    COUNT(*)                       AS finalised_views
  FROM public.page_views
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
    AND (scroll_depth IS NOT NULL OR duration_ms IS NOT NULL)
  GROUP BY path
)
SELECT
  i.path,
  i.views,
  f.avg_duration_ms,
  f.avg_scroll_depth,
  f.finalised_views
FROM initial i
LEFT JOIN final_stats f USING (path)
ORDER BY i.views DESC
LIMIT 50;


-- ── v_top_referrers_30d ──────────────────────────────────────
-- Where inbound traffic comes from. Null host = direct/typed.

CREATE OR REPLACE VIEW public.v_top_referrers_30d AS
SELECT
  COALESCE(referrer_host, '(direct)') AS source,
  COUNT(*)                            AS views
FROM public.page_views
WHERE occurred_at >= NOW() - INTERVAL '30 days'
  AND scroll_depth IS NULL
  AND duration_ms  IS NULL
GROUP BY COALESCE(referrer_host, '(direct)')
ORDER BY views DESC
LIMIT 25;


-- ── v_utm_sources_30d ────────────────────────────────────────
-- Campaign attribution: utm_* combined, with a signup conversion
-- count. Joins page_views → profiles by session-id-first-seen.

CREATE OR REPLACE VIEW public.v_utm_sources_30d AS
WITH tagged AS (
  SELECT
    utm_source,
    utm_medium,
    utm_campaign,
    session_id,
    user_id
  FROM public.page_views
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
    AND utm_source IS NOT NULL
)
SELECT
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(DISTINCT session_id)                                        AS sessions,
  COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END)    AS signups
FROM tagged
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY sessions DESC
LIMIT 50;


-- ── v_device_breakdown_30d ───────────────────────────────────
-- Share of sessions by device_type. Using sessions not views
-- so a chatty SPA user doesn't skew the ratio.

CREATE OR REPLACE VIEW public.v_device_breakdown_30d AS
WITH base AS (
  SELECT
    COALESCE(device_type, 'unknown') AS device_type,
    COUNT(DISTINCT session_id)       AS sessions
  FROM public.page_views
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
  GROUP BY COALESCE(device_type, 'unknown')
),
total AS (
  SELECT GREATEST(SUM(sessions), 1) AS t FROM base
)
SELECT
  b.device_type,
  b.sessions,
  ROUND((b.sessions::numeric / total.t) * 100, 1) AS pct
FROM base b, total
ORDER BY b.sessions DESC;


-- ── v_scholarship_performance ────────────────────────────────
-- Per-scholarship funnel based on match_events (30d window).
-- ctr, save_rate, apply_rate are computed in the view so the
-- UI stays clean.

CREATE OR REPLACE VIEW public.v_scholarship_performance AS
WITH ev AS (
  SELECT
    scholarship_id,
    COUNT(*) FILTER (WHERE event_type = 'impression')   AS impressions,
    COUNT(*) FILTER (WHERE event_type = 'click')        AS clicks,
    COUNT(*) FILTER (WHERE event_type = 'view_detail')  AS views_detail,
    COUNT(*) FILTER (WHERE event_type = 'save')         AS saves,
    COUNT(*) FILTER (WHERE event_type = 'apply_start')  AS apply_starts,
    COUNT(*) FILTER (WHERE event_type = 'apply_submit') AS apply_submits,
    COUNT(*) FILTER (WHERE event_type = 'dismiss')      AS dismisses
  FROM public.match_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
  GROUP BY scholarship_id
)
SELECT
  s.id                                              AS scholarship_id,
  s.name,
  s.country,
  s.funding_type,
  s.is_active,
  COALESCE(ev.impressions,   0) AS impressions,
  COALESCE(ev.clicks,        0) AS clicks,
  COALESCE(ev.views_detail,  0) AS views_detail,
  COALESCE(ev.saves,         0) AS saves,
  COALESCE(ev.apply_starts,  0) AS apply_starts,
  COALESCE(ev.apply_submits, 0) AS apply_submits,
  COALESCE(ev.dismisses,     0) AS dismisses,
  -- Rates guarded against divide-by-zero.
  CASE WHEN COALESCE(ev.impressions, 0) > 0
       THEN ROUND((COALESCE(ev.clicks, 0)::numeric / ev.impressions) * 100, 1)
       ELSE 0 END AS ctr,
  CASE WHEN COALESCE(ev.impressions, 0) > 0
       THEN ROUND((COALESCE(ev.saves,  0)::numeric / ev.impressions) * 100, 1)
       ELSE 0 END AS save_rate,
  CASE WHEN COALESCE(ev.impressions, 0) > 0
       THEN ROUND((COALESCE(ev.apply_starts, 0)::numeric / ev.impressions) * 100, 1)
       ELSE 0 END AS apply_rate
FROM public.scholarships s
LEFT JOIN ev ON ev.scholarship_id = s.id
ORDER BY impressions DESC, s.name;


-- ── v_match_funnel_30d ───────────────────────────────────────
-- Overall match-pipeline funnel.

CREATE OR REPLACE VIEW public.v_match_funnel_30d AS
SELECT
  COUNT(*) FILTER (WHERE event_type = 'impression')   AS impressions,
  COUNT(*) FILTER (WHERE event_type = 'click')        AS clicks,
  COUNT(*) FILTER (WHERE event_type = 'save')         AS saves,
  COUNT(*) FILTER (WHERE event_type = 'apply_start')  AS apply_starts,
  COUNT(*) FILTER (WHERE event_type = 'apply_submit') AS apply_submits
FROM public.match_events
WHERE occurred_at >= NOW() - INTERVAL '30 days';


-- ── get_admin_analytics_summary(days) RPC ────────────────────
-- One-shot JSON bundle for the overview page. Returns the
-- platform summary plus the two headline time series, so the
-- admin overview renders with a single network round trip.
--
-- Granted to service_role only; admin pages call it via the
-- admin supabase client.

CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  summary       JSONB;
  signups_arr   JSONB;
  pageviews_arr JSONB;
  dau_arr       JSONB;
  funnel        JSONB;
BEGIN
  SELECT to_jsonb(vps.*) INTO summary FROM public.v_platform_summary vps;

  SELECT COALESCE(jsonb_agg(to_jsonb(vds.*) ORDER BY vds.day), '[]'::jsonb)
    INTO signups_arr
    FROM public.v_daily_signups vds;

  SELECT COALESCE(jsonb_agg(to_jsonb(vdp.*) ORDER BY vdp.day), '[]'::jsonb)
    INTO pageviews_arr
    FROM public.v_daily_pageviews vdp;

  SELECT COALESCE(jsonb_agg(to_jsonb(vdau.*) ORDER BY vdau.day), '[]'::jsonb)
    INTO dau_arr
    FROM public.v_daily_active_users vdau;

  SELECT to_jsonb(vmf.*) INTO funnel FROM public.v_match_funnel_30d vmf;

  RETURN jsonb_build_object(
    'summary',       summary,
    'signups_30d',   signups_arr,
    'pageviews_30d', pageviews_arr,
    'dau_30d',       dau_arr,
    'funnel_30d',    funnel,
    'generated_at',  to_jsonb(NOW())
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_analytics_summary()
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_admin_analytics_summary()
  TO service_role;
