import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, Bookmark, ListChecks, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { countryFlag, formatDeadline } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: saved }, { data: tracked }, { data: scholarships }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("saved_scholarships").select("id").eq("user_id", user.id),
      supabase.from("application_tracker").select("id, status").eq("user_id", user.id),
      supabase.from("scholarships").select("id, name, country, funding_type, application_deadline")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    ]);

  const profileComplete = !!(profile?.field_of_study && profile?.degree_level && profile?.country_of_origin);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const statCards = [
    { label: "Saved Scholarships",   value: saved?.length ?? 0,   icon: Bookmark,   href: "/dashboard/saved",   color: "bg-blue-50 text-blue-600" },
    { label: "Applications Tracked", value: tracked?.length ?? 0, icon: ListChecks, href: "/dashboard/tracker", color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-black text-2xl text-slate-900">Good day, {firstName} 👋</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Here&apos;s your scholarship overview.</p>
      </div>

      {!profileComplete && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Complete your profile to unlock AI matching</p>
            <p className="text-xs text-amber-700 mt-0.5">Add your field of study, degree level, and country to get personalised recommendations.</p>
          </div>
          <Link href="/dashboard/profile" className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap">
            Complete now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
              <div className={`w-10 h-10 flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs text-slate-400 group-hover:text-brand-600 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-brand-600 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-200" />
          <span className="text-brand-200 text-xs font-semibold uppercase tracking-wide">AI Matching</span>
        </div>
        <h2 className="font-black text-xl mb-1">Find your best matches</h2>
        <p className="text-brand-100 text-sm mb-4 max-w-sm">
          {profileComplete
            ? "Your profile is complete. Run AI matching to see which scholarships fit you best."
            : "Complete your profile first, then run AI matching to get personalised results."}
        </p>
        <Link href={profileComplete ? "/dashboard/match" : "/dashboard/profile"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors">
          {profileComplete ? "Run AI Matching" : "Complete Profile First"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Recently Added</h2>
          <Link href="/scholarships" className="text-xs text-brand-600 hover:underline font-medium">View all →</Link>
        </div>
        <div className="border border-slate-200 divide-y divide-slate-100">
          {scholarships?.map((s) => (
            <Link key={s.id} href={`/scholarships/${s.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-lg">{countryFlag(s.country)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">{s.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.country} · Deadline: {formatDeadline(s.application_deadline)}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 font-medium ${
                s.funding_type === "Full" ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"
              }`}>{s.funding_type}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
