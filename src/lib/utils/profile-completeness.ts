// Profile completeness nudge helpers
// Used on dashboard, matches page, and profile page

export interface NudgeField {
  field: string;
  label: string;
  weight: number;
  href: string;
  gain: string; // human-readable gain estimate
}

// Ordered by matching impact — highest first
const NUDGE_FIELDS: NudgeField[] = [
  { field: "citizenship",      label: "citizenship",    weight: 15, href: "/dashboard/profile", gain: "up to 8 more filtered matches" },
  { field: "field_of_study",   label: "field of study", weight: 15, href: "/dashboard/profile", gain: "significantly better match accuracy" },
  { field: "degree_level",     label: "degree level",   weight: 15, href: "/dashboard/profile", gain: "filters out ineligible scholarships" },
  { field: "career_goals",     label: "career goals",   weight: 10, href: "/dashboard/profile", gain: "better semantic matching" },
  { field: "financial_need",   label: "financial need", weight: 10, href: "/dashboard/profile", gain: "unlock need-based scholarships" },
  { field: "gpa",              label: "GPA",            weight: 10, href: "/dashboard/profile", gain: "accurate merit-based filtering" },
  { field: "country_of_origin",label: "country of origin", weight: 10, href: "/dashboard/profile", gain: "relevant regional scholarships" },
  { field: "full_name",        label: "full name",      weight: 10, href: "/dashboard/profile", gain: "complete your profile" },
  { field: "bio",              label: "background",     weight: 5,  href: "/dashboard/profile", gain: "richer semantic matching" },
];

// Returns the single highest-impact missing field for the given profile
export function getTopNudge(profile: Record<string, any>): NudgeField | null {
  return NUDGE_FIELDS.find(f => !profile[f.field]) ?? null;
}

// Returns completeness % using the same weighted formula as the server
export function computeCompleteness(profile: Record<string, any>): number {
  const total  = NUDGE_FIELDS.reduce((s, f) => s + f.weight, 0);
  const earned = NUDGE_FIELDS.filter(f => Boolean(profile[f.field])).reduce((s, f) => s + f.weight, 0);
  return Math.round((earned / total) * 100);
}
