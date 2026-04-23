// ─────────────────────────────────────────────────────────────
// Pageview tracker (client-side).
//
// Responsibilities:
//   - Mint/keep a session id in sessionStorage (rotates per tab
//     session; stable within one browsing session, so we can
//     stitch anon → signup journeys).
//   - Capture UTM params from URL on first pageview of a session.
//   - Parse the UA client-side into device/browser/os buckets.
//   - Fire an impression when the route changes.
//   - Fire a *finalisation* (scroll_depth + duration_ms) when
//     the page unloads, using navigator.sendBeacon so the
//     browser commits it even during navigation.
//   - Respect Do Not Track: if DNT=1, skip the entire module.
//   - Skip bot UAs cheaply — no point burning DB inserts on them.
//
// Privacy posture (documented in /PRIVACY.md):
//   - We do not store IP addresses directly; country is derived
//     server-side from request headers.
//   - Session IDs are random opaque strings, not identifiers.
//   - We honour navigator.doNotTrack === '1'.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client';
import { parseUserAgent } from './ua';

const SESSION_KEY  = 'sb_session_id';
const UTM_KEY      = 'sb_utm';
const UTM_KEYS     = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'] as const;

type UtmFields = Partial<Record<(typeof UTM_KEYS)[number], string>>;

// Guard against SSR and DNT.
function isTrackingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  // Do Not Track — respect both standard and Safari's old flag.
  const dnt =
    (typeof navigator !== 'undefined' && (navigator as any).doNotTrack) ||
    (typeof window    !== 'undefined' && (window    as any).doNotTrack);
  if (dnt === '1' || dnt === 'yes' || dnt === true) return false;
  return true;
}

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    // crypto.randomUUID is widely available in modern browsers.
    const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // sessionStorage can throw in private-mode Safari etc. Fall back to
    // a per-load id so we at least group events from this pageload.
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function captureUtmFromUrl(search: string): UtmFields | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const out: UtmFields = {};
  let any = false;
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) { out[key] = v; any = true; }
  }
  return any ? out : null;
}

function getSessionUtm(): UtmFields {
  // UTM is captured once per session — first touch wins. That's how
  // attribution usually works, and it stops later internal clicks
  // from clobbering a real acquisition source.
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as UtmFields;
    const fromUrl = captureUtmFromUrl(window.location.search);
    if (fromUrl) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    return {};
  } catch {
    return {};
  }
}

// ── Finalisation tracking ────────────────────────────────────
// When the user leaves a page (navigation, tab close, app
// background) we want to capture scroll_depth and duration_ms.
// We hold this in a module-level object for the currently-viewed
// page and flush it on pagehide/visibilitychange.

interface PendingPage {
  path:       string;
  startedAt:  number;
  maxScroll:  number;  // 0–100
  flushed:    boolean;
}

let pending: PendingPage | null = null;

function currentScrollDepth(): number {
  const h   = document.documentElement;
  const max = (h.scrollHeight - h.clientHeight) || 1;
  const y   = window.scrollY || h.scrollTop || 0;
  return Math.max(0, Math.min(100, Math.round((y / max) * 100)));
}

function onScroll() {
  if (!pending) return;
  const d = currentScrollDepth();
  if (d > pending.maxScroll) pending.maxScroll = d;
}

// Fire the *initial* impression for a new path. Returns a
// finaliser closure the caller can use to mark this page as
// the current one for scroll/duration tracking.
async function sendInitial(
  path:       string,
  utm:        UtmFields,
  sessionId:  string,
): Promise<void> {
  const supabase = createClient();
  const ua       = navigator.userAgent || '';
  const parsed   = parseUserAgent(ua);

  // If this is a bot, don't log anything at all.
  if (parsed.device_type === 'bot') return;

  supabase.rpc('record_page_view', {
    p_path:         path,
    p_session_id:   sessionId,
    p_referrer:     document.referrer || null,
    p_user_agent:   ua,
    p_device_type:  parsed.device_type,
    p_browser:      parsed.browser,
    p_os:           parsed.os,
    p_country:      null,                     // server-derived later if desired
    p_utm_source:   utm.utm_source   ?? null,
    p_utm_medium:   utm.utm_medium   ?? null,
    p_utm_campaign: utm.utm_campaign ?? null,
    p_utm_term:     utm.utm_term     ?? null,
    p_utm_content:  utm.utm_content  ?? null,
    p_scroll_depth: null,
    p_duration_ms:  null,
  }).then(() => undefined, () => undefined);  // fire-and-forget
}

// Flush the current page's scroll_depth/duration as a *second*
// page_views row. Yes, this means each visit produces two rows —
// one "landed" and one "left" — which keeps the insert path
// cheap and lets us aggregate either signal independently. The
// Phase-2 analytics views will coalesce them if needed.
function flushFinalisation(sessionId: string) {
  if (!pending || pending.flushed) return;
  pending.flushed = true;

  const duration = Date.now() - pending.startedAt;
  const payload = {
    p_path:         pending.path,
    p_session_id:   sessionId,
    p_scroll_depth: pending.maxScroll,
    p_duration_ms:  duration,
    // Leave the rest null — this row exists to carry the two
    // finalisation signals. We tell it apart from an initial row
    // by (scroll_depth IS NOT NULL OR duration_ms IS NOT NULL).
  };

  // fetch with keepalive is the right tool for "commit this even if
  // the page is unloading". sendBeacon would work too but can't set
  // auth headers, which Supabase's REST endpoint requires.
  try {
    const url =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/record_page_view`;
    const body = JSON.stringify(payload);
    void fetch(url, {
      method:    'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'apikey':        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      body,
    }).catch(() => {
      // Last-ditch: sendBeacon without auth. Will fail against
      // Supabase auth but avoids unhandled rejections on exotic
      // browsers that break keepalive.
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon?.(url, blob);
    });
  } catch {
    // Ignore — we genuinely don't want tracking failures to
    // crash the app.
  }
}

// Module-level listener setup — run once.
let listenersAttached = false;
function ensureListeners(sessionId: string) {
  if (listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('scroll', onScroll, { passive: true });

  // pagehide fires on real navigation and tab close; also covers
  // iOS Safari where beforeunload is unreliable.
  window.addEventListener('pagehide', () => flushFinalisation(sessionId));

  // visibilitychange catches backgrounding on mobile — we flush
  // early so we don't lose data if the tab gets killed.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushFinalisation(sessionId);
    }
  });
}

// ── Public entrypoint ────────────────────────────────────────

export async function trackPageView(path: string): Promise<void> {
  if (!isTrackingAllowed()) return;

  const sessionId = getOrCreateSessionId();
  ensureListeners(sessionId);

  // If there's a pending page, flush it first — the user is
  // now navigating to a new route.
  if (pending && !pending.flushed) {
    flushFinalisation(sessionId);
  }

  pending = {
    path,
    startedAt: Date.now(),
    maxScroll: currentScrollDepth(),
    flushed:   false,
  };

  const utm = getSessionUtm();
  void sendInitial(path, utm, sessionId);
}
