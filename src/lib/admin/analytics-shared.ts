export type PlatformSummary = {
  total_users: number;
  users_last_7d: number;
  users_prev_7d: number;
  users_last_30d: number;
  users_prev_30d: number;
  total_scholarships: number;
  scholarships_last_7d: number;
  scholarships_prev_7d: number;
  total_applications: number;
  applications_last_7d: number;
  applications_prev_7d: number;
  total_saved: number;
  saved_last_7d: number;
  saved_prev_7d: number;
};

export type DailyPoint = {
  day: string;
  signups?: number;
  views?: number;
  unique_sessions?: number;
  dau?: number;
};

export type MatchFunnelSnapshot = {
  impressions: number;
  clicks: number;
  saves: number;
  apply_starts: number;
  apply_submits: number;
};

export type AdminOverviewBundle = {
  summary: PlatformSummary;
  signups_30d: DailyPoint[];
  pageviews_30d: DailyPoint[];
  dau_30d: DailyPoint[];
  funnel_30d: MatchFunnelSnapshot;
  generated_at: string;
};

export function weekOverWeekDelta(current: number, previous: number): {
  pct: number | null;
  up: boolean;
  flat: boolean;
} {
  if (previous === 0) {
    if (current === 0) return { pct: 0, up: true, flat: true };
    return { pct: null, up: true, flat: false };
  }

  const pct = ((current - previous) / previous) * 100;
  return {
    pct: Math.round(pct * 10) / 10,
    up: pct >= 0,
    flat: Math.abs(pct) < 0.1,
  };
}

export function formatDelta(d: ReturnType<typeof weekOverWeekDelta>): string {
  if (d.flat) return "-";
  if (d.pct === null) return "new";
  const sign = d.pct >= 0 ? "+" : "";
  return `${sign}${d.pct}%`;
}
