import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/auth/ip';
import { rateLimitByIp, rateLimitByKey } from '@/lib/rate-limit/server';

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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set<Event['event_type']>([
  'click', 'save', 'unsave',
  'apply_start', 'apply_submit',
  'dismiss', 'not_relevant', 'view_detail',
]);
const REASON_CODES = new Set<NonNullable<Event['reason_code']>>([
  'wrong_country', 'wrong_degree', 'wrong_eligibility',
  'too_competitive', 'deadline_too_close', 'not_interested',
  'duplicate', 'other',
]);

function tooManyRequests(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: 'Too many events. Please slow down.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

function isValidEvent(e: Event): boolean {
  if (!UUID_RE.test(e.scholarship_id)) return false;
  if (!EVENT_TYPES.has(e.event_type)) return false;
  if (e.rank_position != null && (!Number.isInteger(e.rank_position) || e.rank_position < 0 || e.rank_position > 500)) return false;
  if (e.match_score != null && (typeof e.match_score !== 'number' || e.match_score < 0 || e.match_score > 100)) return false;
  if (e.reason_code != null && !REASON_CODES.has(e.reason_code)) return false;
  if (e.session_id != null && !UUID_RE.test(e.session_id)) return false;
  return true;
}

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

  if (!events.every(isValidEvent)) {
    return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
  }

  const ip = await getClientIp();
  const [ipLimit, userLimit] = await Promise.all([
    rateLimitByIp(ip, 'match_events_ip', 120, 60),
    rateLimitByKey(user.id, 'match_events_user', 60, 60),
  ]);

  if (!ipLimit.allowed) return tooManyRequests(ipLimit.reset);
  if (!userLimit.allowed) return tooManyRequests(userLimit.reset);

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
      }).then(({ error }) => {
        if (error) throw error;
      })
    )
  );

  const accepted = outcomes.filter(o => o.status === 'fulfilled').length;
  const rejected = outcomes.length - accepted;

  return NextResponse.json({
    data: { accepted, rejected },
  });
}
