import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getUser() (not getClaims()) so we validate against Supabase Auth.
  // getClaims() only decodes the local JWT and will happily return a userId
  // even when the refresh token is dead — causing every downstream API call
  // to throw "Invalid Refresh Token" in a loop. getUser() catches this at
  // the edge and lets us nuke the stale cookies before they reach any route.
  let userId: string | null = null;
  let claimsFailed = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      claimsFailed = true;
    } else {
      userId = data.user?.id ?? null;
    }
  } catch {
    claimsFailed = true;
    userId = null;
  }

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith('/dashboard');
  const isAdmin     = path.startsWith('/admin');
  const isAuthPage  = path.startsWith('/auth');

  // Protected route, no valid session → redirect to login.
  // If claims failed (stale/corrupt token), nuke the supabase cookies
  // before redirecting so the browser doesn't loop with bad state.
  if ((isDashboard || isAdmin) && !userId) {
    const url = request.nextUrl.clone();
    const destination = `${path}${request.nextUrl.search}`;

    url.pathname = '/auth/login';
    url.search = '';
    url.searchParams.set('redirectTo', sanitizeRedirectPath(destination));

    const redirectResponse = NextResponse.redirect(url);

    if (claimsFailed) {
      // Clear any sb-* cookies; @supabase/ssr will re-issue on next login
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith('sb-')) {
          redirectResponse.cookies.delete(cookie.name);
        }
      }
    }

    return redirectResponse;
  }

  // Authenticated user landing on an auth page → bounce to redirectTo.
  // CRITICAL: skip this when already mid-callback or the redirectTo would
  // resolve back to an auth page (sanitizeRedirectPath enforces this) —
  // also skip /auth/callback and /auth/confirm so OAuth/email flows complete.
  if (isAuthPage && userId) {
    const isCallback = path.startsWith('/auth/callback') || path.startsWith('/auth/confirm');
    if (!isCallback) {
      const url = request.nextUrl.clone();
      const redirectTo = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirectTo'));

      // Defensive: never redirect from /auth/* to another /auth/* path.
      // sanitizeRedirectPath already enforces this, but the safeguard is
      // cheap and prevents future regressions.
      const safeTarget = redirectTo.startsWith('/auth') ? '/dashboard' : redirectTo;

      // Don't redirect to the same page we're already on (no-op loop).
      if (safeTarget !== path) {
        url.pathname = safeTarget;
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
