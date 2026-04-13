export type Country = 'UK' | 'USA' | 'Germany' | 'Canada';
export type DegreeLevel = 'Undergraduate' | 'Masters' | 'PhD' | 'Any';
export type FundingType = 'Full' | 'Partial' | 'Tuition Only' | 'Living Allowance';

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: Country;
  degree_levels: DegreeLevel[];
  fields_of_study: string[];
  funding_type: FundingType;
  funding_amount: string;
  description: string;
  eligibility_criteria: string[];
  application_deadline: string | null;
  application_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  country_of_origin: string | null;
  field_of_study: string | null;
  degree_level: DegreeLevel | null;
  gpa: number | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface SavedScholarship {
  id: string;
  user_id: string;
  scholarship_id: string;
  scholarship?: Scholarship;
  saved_at: string;
}

export type ApplicationStatus =
  | 'Interested'
  | 'In Progress'
  | 'Submitted'
  | 'Awaiting Decision'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationTracker {
  id: string;
  user_id: string;
  scholarship_id: string;
  scholarship?: Scholarship;
  status: ApplicationStatus;
  notes: string | null;
  deadline_reminder: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  scholarship: Scholarship;
  match_score: number;
  match_reasons: string[];
}

export interface PlatformStats {
  total_users: number;
  total_scholarships: number;
  total_applications: number;
  total_saved: number;
}

export interface ScholarshipFilters {
  country?: Country | 'All';
  degree_level?: DegreeLevel | 'All';
  field_of_study?: string;
  funding_type?: FundingType | 'All';
  search?: string;
}
