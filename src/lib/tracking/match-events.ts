// ─────────────────────────────────────────────────────────────
// Server-side match-event logging.
//
// Impressions are the one event type we log server-side, because
// they happen on every matching run and the route already has
// admin-client privileges. Click/save/dismiss are logged from
// the client via /api/match-events because those are driven by
// user actions in the UI.
//
// All writes here are fire-and-forget: any logging failure is
// logged to console and swallowed so it never breaks the main
// matching response.
// ─────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/server';
import type { MatchResult } from '@/types';

export async function logMatchImpressions(
  userId:    string,
  results:   MatchResult[],
  sessionId: string | null = null,
): Promise<void> {
  if (!userId || !results || results.length === 0) return;

  const supabase = createAdminClient();

  try {
    const { error } = await supabase.rpc('log_match_impressions', {
      p_user_id:    userId,
      p_session_id: sessionId,
      p_results:    results,
    });
    if (error) {
      console.warn('log_match_impressions RPC error:', error);
    }
  } catch (err) {
    console.warn('logMatchImpressions failed:', err);
  }
}
