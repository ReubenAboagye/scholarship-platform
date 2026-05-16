-- ============================================================
-- fix_analytics_view_security_invoker.sql
--
-- Supabase Security Advisor lint 0010 flags public views that run
-- with the creator's privileges instead of the querying user's RLS
-- context. These analytics views are only used from server-side admin
-- code through the service-role client, so they should be SECURITY
-- INVOKER and not directly readable by anon/authenticated API roles.
-- ============================================================

ALTER VIEW IF EXISTS public.v_platform_summary
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_scholarship_performance
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_daily_pageviews
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_match_funnel_30d
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_daily_active_users
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_device_breakdown_30d
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_daily_signups
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_utm_sources_30d
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_top_referrers_30d
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.v_top_pages_30d
  SET (security_invoker = true);

REVOKE SELECT ON TABLE
  public.v_platform_summary,
  public.v_scholarship_performance,
  public.v_daily_pageviews,
  public.v_match_funnel_30d,
  public.v_daily_active_users,
  public.v_device_breakdown_30d,
  public.v_daily_signups,
  public.v_utm_sources_30d,
  public.v_top_referrers_30d,
  public.v_top_pages_30d
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.v_platform_summary,
  public.v_scholarship_performance,
  public.v_daily_pageviews,
  public.v_match_funnel_30d,
  public.v_daily_active_users,
  public.v_device_breakdown_30d,
  public.v_daily_signups,
  public.v_utm_sources_30d,
  public.v_top_referrers_30d,
  public.v_top_pages_30d
TO service_role;
