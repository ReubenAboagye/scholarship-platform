import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: profile },
    { data: saved },
    { data: tracked },
    { data: latestMatch },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, onboarding_complete, citizenship, career_goals, interests, extracurriculars, financial_need")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_scholarships")
      .select("id, created_at, scholarships(name, application_deadline, amount, country, provider, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("application_tracker")
      .select("id, status, deadline_reminder, scholarships(name, application_deadline, slug, amount)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("match_history")
      .select("id, run_at, explanation, results")
      .eq("user_id", user.id)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profileComplete = !!(
    profile?.field_of_study &&
    profile?.degree_level &&
    profile?.country_of_origin
  );
  const onboardingComplete = !!(profile as any)?.onboarding_complete;
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const bannerHref = !onboardingComplete ? "/onboarding" : "/dashboard/profile";

  // Profile completion % — weighted fields
  const weightedFields = [
    { value: profile?.full_name,           weight: 10 },
    { value: profile?.country_of_origin,   weight: 10 },
    { value: profile?.field_of_study,      weight: 15 },
    { value: profile?.degree_level,        weight: 15 },
    { value: (profile as any)?.citizenship,       weight: 15 },
    { value: (profile as any)?.gpa,               weight: 10 },
    { value: (profile as any)?.career_goals,      weight: 10 },
    { value: profile?.bio,                 weight: 5  },
    { value: (profile as any)?.financial_need !== null && (profile as any)?.financial_need !== undefined ? "set" : null, weight: 10 },
  ];
  const totalWeight   = weightedFields.reduce((s, f) => s + f.weight, 0);
  const earnedWeight  = weightedFields.filter((f) => Boolean(f.value)).reduce((s, f) => s + f.weight, 0);
  const completionPct = Math.round((earnedWeight / totalWeight) * 100);

  // "Due this week" — tracker items with deadline within 7 days
  const dueThisWeek = (tracked ?? [])
    .filter((t: any) => {
      const d = t.scholarships?.application_deadline;
      if (!d) return false;
      const diff = new Date(d).getTime() - Date.now();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    })
    .slice(0, 5);

  // Top match results (up to 3) from latest session
  const topMatches = ((latestMatch as any)?.results ?? []).slice(0, 3);

  // Financial calculations
  const potentialValue = (tracked ?? [])
    .filter(t => t.status !== "Rejected")
    .reduce((sum, t) => sum + (t.scholarships?.[0]?.amount || 0), 0);
  const acceptedValue = (tracked ?? [])
    .filter(t => t.status === "Accepted")
    .reduce((sum, t) => sum + (t.scholarships?.[0]?.amount || 0), 0);

  return (
    <DashboardClient
      firstName={firstName}
      profileComplete={profileComplete}
      onboardingComplete={onboardingComplete}
      completionPct={completionPct}
      bannerHref={bannerHref}
      saved={saved?.length ?? 0}
      savedData={saved ?? []}
      tracked={tracked ?? []}
      dueThisWeek={dueThisWeek}
      topMatches={topMatches}
      hasMatchHistory={!!(latestMatch as any)?.id}
      potentialValue={potentialValue}
      acceptedValue={acceptedValue}
    />
  );
}
