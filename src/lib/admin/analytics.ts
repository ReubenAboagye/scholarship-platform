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
import {
  type AdminOverviewBundle,
  type MatchFunnelSnapshot,
  type PlatformSummary,
} from '@/lib/admin/analytics-shared';

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
