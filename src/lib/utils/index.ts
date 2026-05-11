import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  const formatted = format(date, 'dd MMM yyyy');
  if (isPast(date)) return `${formatted} (Closed)`;
  return formatted;
}

export function isDeadlineUrgent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const diff = date.getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// Maps country name → ISO 3166-1 alpha-2 code for flagcdn.com
// Add new countries here as they are added to the platform
const COUNTRY_CODES: Record<string, string> = {
  UK: 'gb', USA: 'us', Germany: 'de', Canada: 'ca',
  Australia: 'au', France: 'fr', Netherlands: 'nl',
  Sweden: 'se', Japan: 'jp', China: 'cn',
  Ireland: 'ie', Switzerland: 'ch', Norway: 'no',
  Denmark: 'dk', Finland: 'fi', Austria: 'at',
  Italy: 'it', Spain: 'es', Portugal: 'pt',
  'New Zealand': 'nz', Singapore: 'sg', 'South Korea': 'kr',
};

export function countryFlagUrl(country: string): string | null {
  const code = COUNTRY_CODES[country];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

// Keep for backwards compat — returns emoji (works on Mac/mobile, not Windows)
export function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    UK: '🇬🇧', USA: '🇺🇸', Germany: '🇩🇪', Canada: '🇨🇦',
  };
  return flags[country] ?? '🌍';
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function matchScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-500';
  return 'text-zinc-400';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    'Interested':         'bg-zinc-50 text-zinc-500 border-zinc-100 border',
    'In Progress':        'bg-brand-50 text-brand-700 border-brand-100 border',
    'Submitted':          'bg-brand-100 text-brand-900 border-brand-200 border',
    'Awaiting Decision':  'bg-amber-50 text-amber-700 border-amber-100 border',
    'Accepted':           'bg-emerald-50 text-emerald-700 border-emerald-100 border',
    'Rejected':           'bg-rose-50 text-rose-700 border-rose-100 border',
    'Withdrawn':          'bg-zinc-100 text-zinc-500',
    'Deadline Passed':    'bg-slate-100 text-slate-600 border-slate-200 border',
  };
  return map[status] ?? 'bg-zinc-100 text-zinc-700';
}

export function fundingBadgeColor(type: string): string {
  const map: Record<string, string> = {
    'Full':             'bg-emerald-50 text-emerald-700 border-emerald-100 border',
    'Partial':          'bg-brand-50 text-brand-700 border-brand-100 border',
    'Tuition Only':     'bg-indigo-50 text-indigo-700 border-indigo-100 border',
    'Living Allowance': 'bg-amber-50 text-amber-700 border-amber-100 border',
  };
  return map[type] ?? 'bg-zinc-50 text-zinc-600 border-zinc-100 border';
}

// ── Country imagery ──────────────────────────────────────────
// High-quality Unsplash photos mapped to destination countries.
// Used in scholarship cards for a more editorial, premium feel.

const COUNTRY_IMAGES: Record<string, string> = {
  UK:            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80&auto=format&fit=crop',
  USA:           'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80&auto=format&fit=crop',
  Germany:       'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80&auto=format&fit=crop',
  Canada:        'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80&auto=format&fit=crop',
  Australia:     'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80&auto=format&fit=crop',
  France:        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop',
  Netherlands:   'https://images.unsplash.com/photo-1512470876302-972faa2d0f1b?w=800&q=80&auto=format&fit=crop',
  Sweden:        'https://images.unsplash.com/photo-1509356843151-3e69d71d72e3?w=800&q=80&auto=format&fit=crop',
  Japan:         'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&auto=format&fit=crop',
  China:         'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80&auto=format&fit=crop',
  Ireland:       'https://images.unsplash.com/photo-1565050885637-936a70b89a7e?w=800&q=80&auto=format&fit=crop',
  Switzerland:   'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80&auto=format&fit=crop',
  Norway:        'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800&q=80&auto=format&fit=crop',
  Denmark:       'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80&auto=format&fit=crop',
  Finland:       'https://images.unsplash.com/photo-1538332576228-dcdd0818b71a?w=800&q=80&auto=format&fit=crop',
  Austria:       'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80&auto=format&fit=crop',
  Italy:         'https://images.unsplash.com/photo-1529260830199-42c2f08f23f0?w=800&q=80&auto=format&fit=crop',
  Spain:         'https://images.unsplash.com/photo-1543783207-e07e561f164e?w=800&q=80&auto=format&fit=crop',
  Portugal:      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80&auto=format&fit=crop',
  'New Zealand': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop',
  Singapore:     'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80&auto=format&fit=crop',
  'South Korea': 'https://images.unsplash.com/photo-1538669710690-5b13d39d4b24?w=800&q=80&auto=format&fit=crop',
};

export function countryImageUrl(country: string): string | null {
  return COUNTRY_IMAGES[country] ?? null;
}

// ── Opportunity Score ────────────────────────────────────────
// A public-facing "desirability" score (0–100) computed from
// funding generosity, accessibility, and deadline urgency.
// Serves as a match/confidence proxy for users without a profile.

export function opportunityScore(s: {
  funding_type?: string;
  open_to_international?: boolean;
  renewable?: boolean;
  effort_minutes?: number | null;
  application_deadline?: string | null;
}): number {
  let score = 0;
  // Funding generosity (max 40)
  const fundingMap: Record<string, number> = {
    Full: 40, Partial: 25, 'Tuition Only': 15, 'Living Allowance': 10,
  };
  score += fundingMap[s.funding_type ?? ''] ?? 5;

  // Accessibility (max 35)
  if (s.open_to_international) score += 20;
  if (s.renewable) score += 15;

  // Effort (max 15)
  if (s.effort_minutes != null && s.effort_minutes <= 60) score += 15;
  else if (s.effort_minutes != null && s.effort_minutes <= 120) score += 8;

  // Deadline urgency (max 10)
  if (!s.application_deadline) {
    score += 5;
  } else {
    const days = (new Date(s.application_deadline).getTime() - Date.now()) / 86_400_000;
    if (days > 30) score += 10;
    else if (days > 14) score += 5;
    else if (days > 0) score += 2;
  }

  return Math.min(100, Math.round(score));
}

export function opportunityScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-brand-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-zinc-400';
}

export function opportunityScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (score >= 60) return 'bg-brand-50 text-brand-700 border-brand-100';
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-zinc-100 text-zinc-600 border-zinc-200';
}
