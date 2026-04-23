// ─────────────────────────────────────────────────────────────
// Tiny User-Agent parser for analytics.
//
// Goal: pull out the minimal info the page_views table records
// (device_type, browser, os) without shipping ua-parser-js (~50KB).
// Analytics wants buckets like "Chrome 138" / "macOS 15" — not
// exhaustive fingerprinting. Regexes below handle the common
// majority; anything unrecognised falls through to null and still
// logs the raw UA string for later inspection.
// ─────────────────────────────────────────────────────────────

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot';

export interface ParsedUA {
  device_type: DeviceType;
  browser:     string | null;
  os:          string | null;
}

// Ordered most-specific first. Matching stops at the first hit.
const BOT_PATTERNS = [
  /bot|crawler|spider|slurp|facebookexternalhit|mediapartners|ahrefs|semrush|baiduspider/i,
  /googlebot|bingbot|yandex|duckduckbot/i,
  /lighthouse|headlesschrome|phantomjs/i,
];

const TABLET_PATTERNS = [
  /ipad/i,
  /android(?!.*mobile)/i,   // "Android" w/o "Mobile" = tablet
  /tablet/i,
];

const MOBILE_PATTERNS = [
  /iphone|ipod/i,
  /android.*mobile/i,
  /windows phone/i,
  /blackberry|bb10/i,
  /mobile/i,
];

// Browser regexes ordered by specificity. Edge must come before
// Chrome (Edge's UA contains "Chrome"), Chrome before Safari
// (Chrome UA contains "Safari"), etc.
const BROWSERS: Array<[RegExp, string]> = [
  [/edg(?:e|a|ios)?\/(\d+)/i,    'Edge'],
  [/opr\/(\d+)/i,                'Opera'],
  [/firefox\/(\d+)/i,            'Firefox'],
  [/fxios\/(\d+)/i,              'Firefox'],  // iOS Firefox
  [/crios\/(\d+)/i,              'Chrome'],   // iOS Chrome
  [/chrome\/(\d+)/i,             'Chrome'],
  [/safari\/.*version\/(\d+)/i,  'Safari'],
  [/version\/(\d+).*safari/i,    'Safari'],
];

const OSES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  // iOS: "OS 17_5_1 like Mac OS X" → "iOS 17"
  [/(?:iphone|ipad|ipod).*os (\d+)[._]/i,   m => `iOS ${m[1]}`],
  // macOS: "Mac OS X 10_15_7" → "macOS 15"  ("10_N_*" = macOS N for N≥16, awkward for older)
  [/mac os x (\d+)[._](\d+)/i,              m => {
    const major = parseInt(m[1], 10);
    const minor = parseInt(m[2], 10);
    // Apple's version numbering: 10.15 = Catalina, 11 = Big Sur, 12 = Monterey…
    // Simplify: if major is 10, show "macOS 10.X"; otherwise "macOS N".
    return major === 10 ? `macOS 10.${minor}` : `macOS ${major}`;
  }],
  [/android (\d+)/i,                        m => `Android ${m[1]}`],
  [/windows nt 10/i,                        () => 'Windows 10/11'],
  [/windows nt (\d+)\.(\d+)/i,              m => `Windows NT ${m[1]}.${m[2]}`],
  [/cros /i,                                () => 'ChromeOS'],
  [/linux/i,                                () => 'Linux'],
];

function matchAny(ua: string, patterns: RegExp[]): boolean {
  return patterns.some(re => re.test(ua));
}

export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) return { device_type: 'desktop', browser: null, os: null };

  if (matchAny(ua, BOT_PATTERNS)) {
    return { device_type: 'bot', browser: null, os: null };
  }

  const device_type: DeviceType =
    matchAny(ua, TABLET_PATTERNS)  ? 'tablet'
  : matchAny(ua, MOBILE_PATTERNS)  ? 'mobile'
  : 'desktop';

  let browser: string | null = null;
  for (const [re, name] of BROWSERS) {
    const m = ua.match(re);
    if (m) {
      browser = `${name} ${m[1]}`;
      break;
    }
  }

  let os: string | null = null;
  for (const [re, fmt] of OSES) {
    const m = ua.match(re);
    if (m) {
      os = fmt(m);
      break;
    }
  }

  return { device_type, browser, os };
}
