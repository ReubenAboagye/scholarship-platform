import { createClient } from '@/lib/supabase/client';

export type MatchEventType =
  | 'impression'
  | 'click'
  | 'save'
  | 'unsave'
  | 'apply_start'
  | 'apply_submit'
  | 'dismiss'
  | 'not_relevant'
  | 'view_detail';

export type NotRelevantReason = 'wrong_country' | 'wrong_degree' | 'not_interested';

interface LogEventParams {
  scholarshipId: string;
  eventType: MatchEventType;
  rankPosition?: number;
  matchScore?: number;
  reasonCode?: NotRelevantReason;
  sessionId?: string;
}

// Log a single match event — fire-and-forget (non-blocking)
export async function logMatchEvent(params: LogEventParams): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('match_events').insert({
      user_id:        user.id,
      scholarship_id: params.scholarshipId,
      event_type:     params.eventType,
      rank_position:  params.rankPosition ?? null,
      match_score:    params.matchScore ?? null,
      reason_code:    params.reasonCode ?? null,
      session_id:     params.sessionId ?? null,
    });
  } catch {
    // Non-fatal — never surface logging errors to the user
  }
}

// Log impressions for a full result set in one batch insert
export async function logImpressions(
  results: { scholarshipId: string; matchScore: number }[],
  sessionId?: string
): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = results.map((r, i) => ({
      user_id:        user.id,
      scholarship_id: r.scholarshipId,
      event_type:     'impression' as MatchEventType,
      rank_position:  i + 1,
      match_score:    r.matchScore,
      session_id:     sessionId ?? null,
    }));

    await supabase.from('match_events').insert(rows);
  } catch {
    // Non-fatal
  }
}

// Dismiss a scholarship — logs event + inserts into dismissed_scholarships
export async function dismissScholarship(
  scholarshipId: string,
  reasonCode?: NotRelevantReason,
  rankPosition?: number,
  matchScore?: number
): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all([
      supabase.from('match_events').insert({
        user_id:        user.id,
        scholarship_id: scholarshipId,
        event_type:     reasonCode ? 'not_relevant' : 'dismiss',
        rank_position:  rankPosition ?? null,
        match_score:    matchScore ?? null,
        reason_code:    reasonCode ?? null,
      }),
      supabase.from('dismissed_scholarships').upsert({
        user_id:        user.id,
        scholarship_id: scholarshipId,
        reason_code:    reasonCode ?? null,
      }, { onConflict: 'user_id,scholarship_id' }),
    ]);
  } catch {
    // Non-fatal
  }
}
