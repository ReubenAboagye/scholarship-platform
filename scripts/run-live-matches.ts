import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { matchScholarships } from "../src/lib/ai/matching";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, field_of_study, primary_field_slug, degree_level, citizenship, gpa, country_of_origin, bio, career_goals, interests, extracurriculars, financial_need")
    .not("primary_field_slug", "is", null)
    .order("full_name");

  if (error) throw error;

  const results = [];
  for (const profile of profiles ?? []) {
    const matches = await matchScholarships(profile as any, 5, profile.id);
    results.push({
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        field_of_study: profile.field_of_study,
        primary_field_slug: profile.primary_field_slug,
        degree_level: profile.degree_level,
        citizenship: profile.citizenship,
      },
      matches: matches.map((match) => ({
        scholarship: match.scholarship.name,
        scholarship_id: match.scholarship.id,
        score: match.match_score,
        reasons: match.match_reasons,
        fields_of_study: match.scholarship.fields_of_study,
        study_field_slugs: match.scholarship.study_field_slugs ?? [],
        degree_levels: match.scholarship.degree_levels,
        funding_type: match.scholarship.funding_type,
        deadline: match.scholarship.application_deadline,
      })),
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error("run-live-matches failed:", error);
  process.exit(1);
});
