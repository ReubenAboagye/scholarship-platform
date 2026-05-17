import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that a mutating request came from the same origin.
 *
 * Strategy:
 *   1. Prefer the modern `Sec-Fetch-Site` header. Browsers set this to
 *      `same-origin` for same-origin navigations and `cross-site` for
 *      cross-site requests. We reject anything that is not `same-origin`
 *      or `none` (direct navigation).
 *   2. Fallback to `Origin` header check when `Sec-Fetch-Site` is absent
 *      (older browsers or non-browser clients).
 *   3. If neither header is present, we allow the request only if the
 *      environment variable `REQUIRE_CSRF_FOR_ADMIN` is not set to "true".
 *      In production you should always require one of these headers.
 *
 * Usage in an admin API route:
 *   const csrf = checkSameOrigin(req);
 *   if (csrf) return csrf;
 */
export function checkSameOrigin(request: NextRequest): NextResponse | null {
  const secFetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Modern browsers send Sec-Fetch-Site on cross-origin and same-origin requests.
  if (secFetchSite) {
    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      return null;
    }
    return NextResponse.json(
      { error: "Cross-site request forbidden." },
      { status: 403 }
    );
  }

  // Fallback: verify Origin matches Host.
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
    } catch {
      // malformed origin
    }
    return NextResponse.json(
      { error: "Cross-origin request forbidden." },
      { status: 403 }
    );
  }

  // No origin information available.
  if (process.env.REQUIRE_CSRF_FOR_ADMIN === "true") {
    return NextResponse.json(
      { error: "Unable to verify request origin." },
      { status: 403 }
    );
  }

  return null;
}
