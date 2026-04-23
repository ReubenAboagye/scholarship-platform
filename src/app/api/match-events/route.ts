import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─────────────────────────────────────────────────────────────
// POST /api/match-events
//
// Records a match-event (click, save, unsave, apply_start,
// apply_submit, dismiss, not_relevant, view_detail) initiated
// from the client. Accepts either a single event or a small
// batch, because UI interactions often chain (e.g. click +
// view_detail fire together).
//
// Auth: the underlying log_match_event RPC is SECURITY DEFINER
// and uses auth.uid() for user_id, so a forged user_id in the
// body is ignored. We still require an authenticated session
// at the route level so we can return a clean 401.
//
// Validation: the RPC validates event_type against the check
// constraint and raises on unknown values. We keep the route
// tolerant — if one event in a batch fails, the others still
// go through.
// ─────────────────────────────────────────────────────────────

type Event = {
  scholarship_id: string;
  event_type:
    | 'click' | 'save' | 'unsave'
    | 'apply_start' | 'apply_submit'
    | 'dismiss' | 'not_relevant' | 'view_detail';
  rank_position?: number | null;
  match_score?:   number | null;
  reason_code?:
    | 'wrong_country' | 'wrong_degree' | 'wrong_eligibility'
    | 'too_competitive' | 'deadline_too_close' | 'not_interested'
    | 'duplicate' | 'other'
    | null;
  session_id?: string | null;
};

const MAX_BATCH = 20;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Accept either a single event or { events: Event[] }.
  const events: Event[] = Array.isArray((body as any)?.events)
    ? (body as any).events
    : body && typeof body === 'object' && 'event_type' in (body as any)
      ? [body as Event]
      : [];

  if (events.length === 0) {
    return NextResponse.json({ error: 'No events provided' }, { status: 400 });
  }

  if (events.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Too many events (max ${MAX_BATCH} per request)` },
      { status: 400 }
    );
  }

  // Log each event, collecting errors but not short-circuiting.
  // We use Promise.allSettled so one malformed event doesn't lose
  // the others.
  const outcomes = await Promise.allSettled(
    events.map(e =>
      supabase.rpc('log_match_event', {
        p_scholarship_id: e.scholarship_id,
        p_event_type:     e.event_type,
        p_rank_position:  e.rank_position ?? null,
        p_match_score:    e.match_score   ?? null,
        p_reason_code:    e.reason_code   ?? null,
        p_session_id:     e.session_id    ?? null,
      })
    )
  );

  const accepted = outcomes.filter(o => o.status === 'fulfilled').length;
  const rejected = outcomes.length - accepted;

  return NextResponse.json({
    data: { accepted, rejected },
  });
}
