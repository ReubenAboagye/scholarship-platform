-- ============================================================
-- Fix analytics views to be SECURITY INVOKER
--
-- These views were intended to be SECURITY INVOKER (as documented
-- in 20260424000000_analytics_views.sql) but were flagged by the
-- database linter as SECURITY DEFINER, which is a security risk.
--
-- SECURITY INVOKER means the views inherit the caller's RLS context,
-- which is the intended behavior for analytics views that should
-- only be readable by service_role (admin client).
-- ============================================================

-- ── v_platform_summary ────────────────────────────────────────
ALTER VIEW public.v_platform_summary SET (security_invoker = true);

-- ── v_daily_signups ──────────────────────────────────────────
ALTER VIEW public.v_daily_signups SET (security_invoker = true);

-- ── v_daily_pageviews ────────────────────────────────────────
ALTER VIEW public.v_daily_pageviews SET (security_invoker = true);

-- ── v_daily_active_users ─────────────────────────────────────
ALTER VIEW public.v_daily_active_users SET (security_invoker = true);

-- ── v_top_pages_30d ──────────────────────────────────────────
ALTER VIEW public.v_top_pages_30d SET (security_invoker = true);

-- ── v_top_referrers_30d ──────────────────────────────────────
ALTER VIEW public.v_top_referrers_30d SET (security_invoker = true);

-- ── v_utm_sources_30d ────────────────────────────────────────
ALTER VIEW public.v_utm_sources_30d SET (security_invoker = true);

-- ── v_device_breakdown_30d ───────────────────────────────────
ALTER VIEW public.v_device_breakdown_30d SET (security_invoker = true);

-- ── v_scholarship_performance ────────────────────────────────
ALTER VIEW public.v_scholarship_performance SET (security_invoker = true);

-- ── v_match_funnel_30d ───────────────────────────────────────
ALTER VIEW public.v_match_funnel_30d SET (security_invoker = true);
