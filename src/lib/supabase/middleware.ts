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

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith('/dashboard');
  const isAdmin     = path.startsWith('/admin');
  const isAuthPage  = path.startsWith('/auth');

  if ((isDashboard || isAdmin) && !userId) {
    const url = request.nextUrl.clone();
    const destination = `${path}${request.nextUrl.search}`;

    url.pathname = '/auth/login';
    url.search = '';
    url.searchParams.set('redirectTo', sanitizeRedirectPath(destination));
    return NextResponse.redirect(url);
  }

  if (isAuthPage && userId) {
    const url = request.nextUrl.clone();
    const redirectTo = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirectTo'));

    url.pathname = redirectTo;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
