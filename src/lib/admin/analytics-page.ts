// ─────────────────────────────────────────────────────────────
// Server-side loaders for the deeper /admin/analytics page.
//
// We don't fold these into get_admin_analytics_summary because:
//   - That RPC drives the overview tile + 30d charts and is called
//     on every /admin load. Keeping it slim keeps the home page fast.
//   - The analytics page is heavier — top-pages, top-referrers,
//     UTM table, device pie, scholarship performance — and is
//     opt-in. Loading those views in parallel here is fine.
//
// Each loader degrades gracefully on error so the page always
// renders even if one view is empty or broken.
// ─────────────────────────────────────────────────────────────

import "server-only";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, isAdminUser } from "@/lib/auth/admin";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getAdminOverviewBundle } from '@/lib/admin/analytics';
import type { AdminOverviewBundle } from '@/lib/admin/analytics-shared';

export type TopPageRow = {
  path:               string;
  views:              number;
  avg_duration_ms:    number | null;
  avg_scroll_depth:   number | null;
  finalised_views:    number | null;
};

export type TopReferrerRow = {
  source: string;
  views:  number;
};

export type UtmRow = {
  utm_source:   string;
  utm_medium:   string | null;
  utm_campaign: string | null;
  sessions:     number;
  signups:      number;
};

export type DeviceRow = {
  device_type: string;
  sessions:    number;
  pct:         number;
};

export type ScholarshipPerformanceRow = {
  scholarship_id: string;
  name:           string;
  country:        string;
  funding_type:   string;
  is_active:      boolean;
  impressions:    number;
  clicks:         number;
  views_detail:   number;
  saves:          number;
  apply_starts:   number;
  apply_submits:  number;
  dismisses:      number;
  ctr:            number;
  save_rate:      number;
  apply_rate:     number;
};

export type CountBreakdownRow = {
  label: string;
  count: number;
};

export type AnalyticsBundle = {
  overview:                  AdminOverviewBundle;
  topPages:                  TopPageRow[];
  topReferrers:              TopReferrerRow[];
  utmSources:                UtmRow[];
  devices:                   DeviceRow[];
  scholarshipPerformance:    ScholarshipPerformanceRow[];
  statusDistribution:        CountBreakdownRow[];
  countryDistribution:       CountBreakdownRow[];
};

// Supabase query builders are PromiseLike, not Promise — they
// resolve to { data, error }. We accept any thenable that resolves
// to that shape so we don't have to wrap each call in an extra
// `Promise.resolve()`.
type SelectThenable<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

async function safeSelect<T>(
  fn: () => SelectThenable<T>,
  label: string,
): Promise<T[]> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`analytics loader ${label} error:`, error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn(`analytics loader ${label} threw:`, err);
    return [];
  }
}

async function requireAdminPageAccess(): Promise<void> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  if (!user) redirect("/auth/login");

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) redirect("/dashboard");
}

function aggregateCounts(
  rows: Array<{ label: string | null | undefined }>
): CountBreakdownRow[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = row.label?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAnalyticsBundle(): Promise<AnalyticsBundle> {
  await requireAdminPageAccess();

  const supabase = createAdminClient();

  const [
    overview,
    topPages,
    topReferrers,
    utmSources,
    devices,
    scholarshipPerformance,
    statuses,
    countries,
  ] = await Promise.all([
    getAdminOverviewBundle(),
    safeSelect<TopPageRow>(() =>
      supabase.from('v_top_pages_30d').select('*').limit(15),
      'v_top_pages_30d'),
    safeSelect<TopReferrerRow>(() =>
      supabase.from('v_top_referrers_30d').select('*').limit(15),
      'v_top_referrers_30d'),
    safeSelect<UtmRow>(() =>
      supabase.from('v_utm_sources_30d').select('*').limit(15),
      'v_utm_sources_30d'),
    safeSelect<DeviceRow>(() =>
      supabase.from('v_device_breakdown_30d').select('*'),
      'v_device_breakdown_30d'),
    safeSelect<ScholarshipPerformanceRow>(() =>
      supabase.from('v_scholarship_performance').select('*'),
      'v_scholarship_performance'),
    safeSelect<{ status: string | null }>(() =>
      supabase.from("application_tracker").select("status"),
      "application_tracker.status"),
    safeSelect<{ country: string | null }>(() =>
      supabase.from("scholarships").select("country").eq("is_active", true),
      "scholarships.country"),
  ]);

  return {
    overview,
    topPages,
    topReferrers,
    utmSources,
    devices,
    scholarshipPerformance,
    statusDistribution: aggregateCounts(
      statuses.map((row) => ({ label: row.status }))
    ),
    countryDistribution: aggregateCounts(
      countries.map((row) => ({ label: row.country }))
    ),
  };
}
