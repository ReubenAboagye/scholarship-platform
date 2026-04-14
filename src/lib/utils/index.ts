import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return 'Rolling / Open';
  const date = new Date(dateStr);
  if (isPast(date)) return 'Closed';
  return format(date, 'dd MMM yyyy');
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
const COUNTRY_CODES: Record<string, string> = {
  UK: 'gb', USA: 'us', Germany: 'de', Canada: 'ca',
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
  return 'text-slate-400';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    'Interested':         'bg-slate-100 text-slate-700',
    'In Progress':        'bg-blue-100 text-blue-700',
    'Submitted':          'bg-violet-100 text-violet-700',
    'Awaiting Decision':  'bg-amber-100 text-amber-700',
    'Accepted':           'bg-emerald-100 text-emerald-700',
    'Rejected':           'bg-red-100 text-red-700',
    'Withdrawn':          'bg-slate-100 text-slate-500',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function fundingBadgeColor(type: string): string {
  const map: Record<string, string> = {
    'Full':             'bg-emerald-100 text-emerald-700',
    'Partial':          'bg-blue-100 text-blue-700',
    'Tuition Only':     'bg-violet-100 text-violet-700',
    'Living Allowance': 'bg-amber-100 text-amber-700',
  };
  return map[type] ?? 'bg-slate-100 text-slate-600';
}
