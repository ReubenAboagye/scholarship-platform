// ─────────────────────────────────────────────────────────────
// Server-side loader for the admin overview bundle.
//
// Calls the get_admin_analytics_summary() RPC which returns a
// single JSONB bundle with platform totals, 30-day signups,
// pageviews, DAU, and match funnel counts. Doing it server-side
// (as opposed to the client-side useEffect pattern the old
// overview used) means:
//   - No RLS fight: we use the admin client which bypasses RLS
//     on page_views/match_events.
//   - One round trip instead of many counts.
//   - Faster first paint because the data is in the initial HTML.
//
// This module is server-only. Never import it from a client
// component.
// ─────────────────────────────────────────────────────────────

import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

export type PlatformSummary = {
  total_users:            number;
  users_last_7d:          number;
  users_prev_7d:          number;
  users_last_30d:         number;
  users_prev_30d:         number;
  total_scholarships:     number;
  scholarships_last_7d:   number;
  scholarships_prev_7d:   number;
  total_applications:     number;
  applications_last_7d:   number;
  applications_prev_7d:   number;
  total_saved:            number;
  saved_last_7d:          number;
  saved_prev_7d:          number;
};

export type DailyPoint          = { day: string; signups?: number; views?: number; unique_sessions?: number; dau?: number };
export type MatchFunnelSnapshot = {
  impressions:   number;
  clicks:        number;
  saves:         number;
  apply_starts:  number;
  apply_submits: number;
};

export type AdminOverviewBundle = {
  summary:       PlatformSummary;
  signups_30d:   DailyPoint[];
  pageviews_30d: DailyPoint[];
  dau_30d:       DailyPoint[];
  funnel_30d:    MatchFunnelSnapshot;
  generated_at:  string;
};

const EMPTY_SUMMARY: PlatformSummary = {
  total_users:          0, users_last_7d:        0, users_prev_7d: 0,
  users_last_30d:       0, users_prev_30d:       0,
  total_scholarships:   0, scholarships_last_7d: 0, scholarships_prev_7d: 0,
  total_applications:   0, applications_last_7d: 0, applications_prev_7d: 0,
  total_saved:          0, saved_last_7d:        0, saved_prev_7d:        0,
};

const EMPTY_FUNNEL: MatchFunnelSnapshot = {
  impressions: 0, clicks: 0, saves: 0, apply_starts: 0, apply_submits: 0,
};

export async function getAdminOverviewBundle(): Promise<AdminOverviewBundle> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('get_admin_analytics_summary');

  if (error || !data) {
    // Return an empty-but-valid shape so the UI always renders.
    // If the RPC fails we log and degrade gracefully rather than
    // throwing — the overview is a heads-up dashboard, not a
    // blocking flow.
    console.warn('get_admin_analytics_summary failed:', error);
    return {
      summary:       EMPTY_SUMMARY,
      signups_30d:   [],
      pageviews_30d: [],
      dau_30d:       [],
      funnel_30d:    EMPTY_FUNNEL,
      generated_at:  new Date().toISOString(),
    };
  }

  // The RPC returns JSONB; supabase-js parses it.
  return data as unknown as AdminOverviewBundle;
}

// ── Delta helpers ────────────────────────────────────────────
// Used by the overview tiles. Returns a percentage delta and a
// direction flag; guards against division by zero.

export function weekOverWeekDelta(current: number, previous: number): {
  pct: number | null;
  up:  boolean;
  flat: boolean;
} {
  if (previous === 0) {
    // From zero: any positive is "new activity", not a percentage.
    if (current === 0) return { pct: 0,    up: true,  flat: true  };
    return                   { pct: null, up: true,  flat: false };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    pct:  Math.round(pct * 10) / 10,
    up:   pct >= 0,
    flat: Math.abs(pct) < 0.1,
  };
}

// Format a delta for the UI: "+12.5%" / "−4.2%" / "new" / "—"
export function formatDelta(d: ReturnType<typeof weekOverWeekDelta>): string {
  if (d.flat)         return '—';
  if (d.pct === null) return 'new';
  const sign = d.pct >= 0 ? '+' : '';
  return `${sign}${d.pct}%`;
}
