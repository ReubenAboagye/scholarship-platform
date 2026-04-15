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
    { label: "Saved Scholarships",   value: saved?.length ?? 0,   icon: Bookmark,   href: "/dashboard/saved",   color: "bg-brand-50 text-brand-700" },
    { label: "Applications Tracked", value: tracked?.length ?? 0, icon: ListChecks, href: "/dashboard/tracker", color: "bg-indigo-50 text-indigo-700" },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-ambient hover:shadow-elevated transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50/30 rounded-full blur-3xl -mr-8 -mt-8 group-hover:bg-brand-100/50 transition-colors" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-sm ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-6 text-xs font-bold text-slate-400 group-hover:text-brand-600 transition-colors">
              View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-elevated">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-brand-400 text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence</span>
          </div>
          <h2 className="font-black text-2xl lg:text-3xl mb-2 tracking-tight">Discover your perfect match</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
            {profileComplete
              ? "Your profile is 100% complete. Our AI is ready to rank scholarships based on your unique academic background."
              : "Complete your professional profile to unlock our proprietary AI matching engine and get personalized recommendations."}
          </p>
          <Link href={profileComplete ? "/dashboard/match" : "/dashboard/profile"}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-brand-600 text-white font-bold text-sm rounded-xl hover:bg-brand-700 transition-all hover:shadow-brand-glow active:scale-95">
            {profileComplete ? "Run AI Matching" : "Complete Profile First"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-brand-600 rounded-full" />
            <h2 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">Recently Added</h2>
          </div>
          <Link href="/scholarships" className="text-xs text-brand-600 hover:text-brand-700 font-bold transition-colors">View all →</Link>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-ambient overflow-hidden divide-y divide-slate-50">
          {scholarships?.map((s) => (
            <Link key={s.id} href={`/scholarships/${s.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-all group">
              <div className="flex items-center gap-4">
                <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{countryFlag(s.country)}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.country}</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline: {formatDeadline(s.application_deadline)}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                s.funding_type === "Full" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-brand-50 text-brand-700 border-brand-100"
              }`}>{s.funding_type}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
