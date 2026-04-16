import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bookmark, ListChecks, TrendingUp, Clock } from "lucide-react";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: profile },
    { data: saved },
    { data: tracked },
    { data: scholarships },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, onboarding_complete")
      .eq("id", user.id)
      .single(),
    supabase.from("saved_scholarships").select("id").eq("user_id", user.id),
    supabase.from("application_tracker").select("id, status, scholarships(name)").eq("user_id", user.id).limit(5),
    supabase
      .from("scholarships")
      .select("id, slug, name, country, funding_type, application_deadline")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profileComplete = !!(
    profile?.field_of_study &&
    profile?.degree_level &&
    profile?.country_of_origin
  );

  const onboardingComplete = !!(profile as any)?.onboarding_complete;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  // ── Profile completion %
  const profileFields = [
    profile?.field_of_study,
    profile?.degree_level,
    profile?.country_of_origin,
    profile?.full_name,
    (profile as any)?.gpa,
    (profile as any)?.bio,
  ];
  const completedCount = profileFields.filter(Boolean).length;
  const completionPct  = Math.round((completedCount / profileFields.length) * 100);

  const bannerHref = !onboardingComplete ? "/onboarding" : "/dashboard/profile";

  const stats = [
    {
      label: "Saved",
      sublabel: "scholarships",
      value: saved?.length ?? 0,
      iconName: "Bookmark",
      href: "/dashboard/saved",
      accent: "bg-brand-50 text-brand-600 border-brand-100",
    },
    {
      label: "Applications",
      sublabel: "tracked",
      value: tracked?.length ?? 0,
      iconName: "ListChecks",
      href: "/dashboard/tracker",
      accent: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "Upcoming",
      sublabel: "deadlines",
      value: scholarships?.filter((s) => {
        if (!s.application_deadline) return false;
        const diff = new Date(s.application_deadline).getTime() - Date.now();
        return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
      }).length ?? 0,
      iconName: "Clock",
      href: "/scholarships",
      accent: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "AI matches",
      sublabel: profileComplete ? "ready" : "unlock",
      value: profileComplete ? "—" : "—",
      iconName: "TrendingUp",
      href: "/dashboard/match",
      accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <DashboardClient
      firstName={firstName}
      profileComplete={profileComplete}
      onboardingComplete={onboardingComplete}
      completionPct={completionPct}
      bannerHref={bannerHref}
      stats={stats}
      scholarships={scholarships ?? []}
      tracked={tracked ?? []}
    />
  );
}
