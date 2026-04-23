# Privacy — ScholarBridge Analytics

This document describes what the platform's analytics layer collects and
why. It's a plain-English companion to the code in `src/lib/tracking/`
and `supabase/migrations/20260423120000_instrumentation.sql`.

This is a technical transparency note, not a legal privacy policy.
A formal privacy policy belongs in the deployed site's footer.

---

## What we collect

### Page views (`public.page_views`)

One row per navigation within the app. Each row stores:

- **Path** (e.g. `/scholarships/commonwealth-scholarship`). Query strings
  are stripped before storage — no tokens, no PII in URLs.
- **User ID**, if the visitor is logged in. Anonymous visits are stored
  with `user_id = NULL`.
- **Session ID**, a random opaque string held in `sessionStorage` for
  the life of the browser tab session. Used to stitch anonymous →
  signup journeys. Not stable across tabs or devices.
- **Referrer URL** and its host, derived from `document.referrer`.
- **Country**, if available from the hosting platform's geo headers.
  Derived server-side; we do not store IP addresses.
- **User-Agent string** and parsed components (device type, browser,
  OS). Used to bucket traffic by platform, not to fingerprint users.
- **UTM parameters** (`utm_source`, `utm_medium`, `utm_campaign`,
  `utm_term`, `utm_content`) from the first pageview of a session.
  First-touch attribution only — later internal clicks do not overwrite.
- **Scroll depth** (0–100, integer percentage) and **duration** (ms),
  captured when the page is hidden or unloaded. Both are approximate:
  browsers throttle timers on backgrounded tabs.

### Match events (`public.match_events`)

One row per interaction with a scholarship match. Event types:

- `impression` — a scholarship was shown in results
- `click`, `view_detail` — opened / viewed
- `save`, `unsave` — bookmarking
- `apply_start`, `apply_submit` — application workflow signals
- `dismiss`, `not_relevant` — negative feedback, with optional reason

Each row stores user ID, scholarship ID, rank position in the result
list, the match score at the time, and an optional reason code for
negative signals.

---

## What we don't collect

- IP addresses (country only, never the raw address).
- Form contents, keystrokes, or field-level input tracking.
- Mouse-move / click heatmaps.
- Third-party analytics scripts (Google Analytics, Facebook Pixel,
  Hotjar, etc.) — the platform ships with none of these.
- Cross-site tracking identifiers, advertising IDs, or fingerprints.

---

## Opting out

The tracker respects the browser's **Do Not Track** signal. If
`navigator.doNotTrack === '1'` (or the Safari equivalent), no pageview
or finalisation data is sent. Match events are still recorded when a
logged-in user interacts with the matcher, because those are necessary
product signals — users can delete their account to remove them.

Bots (detected by common UA patterns) are skipped entirely.

---

## Data access

- Page-view and match-event data is readable only by the **service
  role** used by the admin backend. Row-level security on both tables
  blocks direct read access from `authenticated` and `anon` clients.
- Write access flows through `SECURITY DEFINER` RPCs, so the underlying
  tables remain locked down even though anonymous visitors can log
  events. Inputs are validated and truncated inside each RPC.

---

## Retention

Pageviews and match events are retained indefinitely today. A retention
job (e.g. "delete rows older than 18 months") is easy to add once the
platform has enough data to need one — see
`cleanup_match_history()` in migration 018 for the pattern.
