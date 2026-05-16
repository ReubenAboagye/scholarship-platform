import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/auth/ip';
import { rateLimitByIp, rateLimitByKey } from '@/lib/rate-limit/server';
import { readJsonBody } from '@/lib/server/body-size';

// ─────────────────────────────────────────────────────────────
// POST /api/match-events
//
// Records a match-event (click, save, unsave, apply_start,
// apply_submit, dismiss, not_relevant, view_detail) initiated
// from the client. Accepts either a single event or a small
// batch, because UI interactions often chain (e.g. click +
// view_detail fire together).
//
// Auth: this route requires a user session, then writes with the
// service-role client so the logging function does not need to be
// exposed as a SECURITY DEFINER RPC.
//
// Validation: the route validates event payloads before writing,
// and the database constraints remain the final guardrail. We keep
// the route tolerant: if one event in a batch fails, the others
// still go through.
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

  const bodyResult = await readJsonBody(request, 32_768);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

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

  const adminSupabase = createAdminClient();

  // Log each event, collecting errors but not short-circuiting.
  // We use Promise.allSettled so one database failure doesn't lose
  // the others.
  const outcomes = await Promise.allSettled(
    events.map(e =>
      adminSupabase.from('match_events').insert({
        user_id:        user.id,
        scholarship_id: e.scholarship_id,
        event_type:     e.event_type,
        rank_position:  e.rank_position ?? null,
        match_score:    e.match_score   ?? null,
        reason_code:    e.reason_code   ?? null,
        session_id:     e.session_id    ?? null,
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
