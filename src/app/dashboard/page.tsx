import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, Bookmark, ListChecks, ArrowRight, AlertCircle } from "lucide-react";
import { countryFlag, formatDeadline } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: saved }, { data: tracked }, { data: scholarships }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("saved_scholarships").select("id").eq("user_id", user.id),
      supabase.from("application_tracker").select("id, status").eq("user_id", user.id),
      supabase.from("scholarships").select("id, name, country, funding_type, application_deadline").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    ]);

  const profileComplete = !!(profile?.field_of_study && profile?.degree_level && profile?.country_of_origin);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const statCards = [
    { label: "Saved Scholarships",  value: saved?.length ?? 0,   icon: Bookmark,   href: "/dashboard/saved",   color: "bg-blue-50 text-blue-600" },
    { label: "Applications Tracked",value: tracked?.length ?? 0, icon: ListChecks, href: "/dashboard/tracker", color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-slate-900">Good day, {firstName} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Here&apos;s your scholarship overview.</p>
      </div>

      {/* Profile incomplete banner */}
      {!profileComplete && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Complete your profile to unlock AI matching</p>
            <p className="text-xs text-amber-700 mt-0.5">Add your field of study, degree level, and country to get personalised scholarship recommendations.</p>
          </div>
          <Link href="/dashboard/profile" className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:underline">
            Complete now →
          </Link>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-card transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs text-slate-400 group-hover:text-blue-600 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* AI Match CTA */}
      <div className="relative overflow-hidden bg-blue-600 rounded-2xl p-6 text-white">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-500 rounded-full opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">AI Matching</span>
          </div>
          <h2 className="font-display text-2xl mb-1">Find your best matches</h2>
          <p className="text-blue-200 text-sm mb-4 max-w-sm">
            {profileComplete
              ? "Your profile is complete. Run AI matching to see which scholarships fit you best."
              : "Complete your profile first, then run AI matching to get personalised results."}
          </p>
          <Link
            href={profileComplete ? "/scholarships?match=true" : "/dashboard/profile"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors"
          >
            {profileComplete ? "Run AI Matching" : "Complete Profile First"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent scholarships */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recently Added Scholarships</h2>
          <Link href="/scholarships" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {scholarships?.map((s) => (
            <Link
              key={s.id}
              href={`/scholarships/${s.id}`}
              className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-card transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{countryFlag(s.country)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{s.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.country} · Deadline: {formatDeadline(s.application_deadline)}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                s.funding_type === "Full" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}>
                {s.funding_type}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
