'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/tracking/pageview';

// Mount once in the root layout. Fires a pageview on mount and on
// every route change. Search-params are included in the effect
// dep so ?utm_* navigations also get picked up (though UTM is
// first-touch per session, not re-captured).
//
// The component returns null — it's an effect host, not UI.

export default function PageViewTracker() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    // We intentionally don't include searchParams in the path
    // stored in page_views — we strip query strings to avoid
    // PII and token leakage in URLs. UTM is captured separately.
    trackPageView(pathname);
    // searchParams is in the dep list only so SPA navigations
    // that change ?utm_* (rare but possible) re-run the effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}
