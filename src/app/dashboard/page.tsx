import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Sparkles, Bookmark, ListChecks, ArrowRight,
  AlertCircle, TrendingUp, Clock,
} from "lucide-react";
import Link from "next/link";
import { countryFlag, formatDeadline } from "@/lib/utils";

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
    supabase.from("application_tracker").select("id, status").eq("user_id", user.id),
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

  // ── Profile completion % for banner progress bar ───────────
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

  // ── "Complete now" href logic ──────────────────────────────
  // If onboarding wizard was never finished → go back to /onboarding
  // If wizard was done but profile fields missing → go to /dashboard/profile
  const bannerHref = !onboardingComplete ? "/onboarding" : "/dashboard/profile";

  const statCards = [
    {
      label: "Saved",
      sublabel: "scholarships",
      value: saved?.length ?? 0,
      icon: Bookmark,
      href: "/dashboard/saved",
      accent: "bg-brand-50 text-brand-600 border-brand-100",
    },
    {
      label: "Applications",
      sublabel: "tracked",
      value: tracked?.length ?? 0,
      icon: ListChecks,
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
      icon: Clock,
      href: "/scholarships",
      accent: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "AI matches",
      sublabel: profileComplete ? "ready" : "unlock",
      value: profileComplete ? "—" : "—",
      icon: TrendingUp,
      href: "/dashboard/match",
      accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-end justify-between pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-black text-2xl text-slate-900 tracking-tight">
            Good day, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Here&apos;s your scholarship overview for today.
          </p>
        </div>
        <Link
          href="/scholarships"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg"
        >
          Browse all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Profile completion banner ─────────────────────
          Only shown when profile is incomplete.
          Href goes to /onboarding if wizard was never done,
          or /dashboard/profile if wizard is done but fields missing.
      ──────────────────────────────────────────────────── */}
      {!profileComplete && (
        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex-shrink-0 w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {!onboardingComplete
                ? "Complete your profile setup to unlock AI matching"
                : "Your profile is incomplete — AI matching is limited"}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {!onboardingComplete
                ? "You skipped the setup wizard. Add your degree level, field of study, and country to get personalised results."
                : "Add your field of study, degree level, and country to get accurate, personalised recommendations."}
            </p>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                {completionPct}% done
              </span>
            </div>
          </div>

          <Link
            href={bannerHref}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-3 py-2 rounded-lg whitespace-nowrap"
          >
            Complete now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Stats grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl border ${s.accent}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-tight">
              {s.label}
              <br />
              <span className="font-normal normal-case tracking-normal text-slate-300">{s.sublabel}</span>
            </p>
          </Link>
        ))}
      </div>

      {/* ── Two-column: Saved scholarships + Tracker ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recently added scholarships */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-bold text-[13px] text-slate-700">Recently added</h2>
            <Link href="/scholarships" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {scholarships?.map((s) => (
              <Link
                key={s.id}
                href={`/scholarships/${(s as any).slug ?? s.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors group"
              >
                <span className="text-lg flex-shrink-0">{countryFlag(s.country)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 transition-colors truncate">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {s.country} · {formatDeadline(s.application_deadline)}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${
                    s.funding_type === "Full"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {s.funding_type}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Application tracker */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-bold text-[13px] text-slate-700">Application tracker</h2>
            <Link href="/dashboard/tracker" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
              Add new →
            </Link>
          </div>
          {!tracked || tracked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                <ListChecks className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No applications yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Start tracking your applications to stay on top of every deadline.
              </p>
              <Link
                href="/dashboard/tracker"
                className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Track your first →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {tracked.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    t.status === "submitted" ? "bg-brand-500"
                    : t.status === "accepted"  ? "bg-emerald-500"
                    : t.status === "rejected"  ? "bg-red-400"
                    : "bg-slate-300"
                  }`} />
                  <p className="text-sm text-slate-700 flex-1 capitalize">{t.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI match CTA ─────────────────────────────────── */}
      <div className="bg-slate-900 p-7 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-600/15 rounded-full blur-3xl -mr-36 -mt-36 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-600/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <span className="text-brand-400 text-[10px] font-black uppercase tracking-[0.2em]">
                AI Intelligence
              </span>
            </div>
            <h2 className="font-black text-2xl tracking-tight mb-2">
              Discover your perfect match
            </h2>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              {profileComplete
                ? "Your profile is complete. Our AI is ready to rank scholarships based on your unique academic background."
                : "Complete your profile to unlock our AI matching engine and get personalised scholarship recommendations."}
            </p>
          </div>
          <Link
            href={profileComplete ? "/dashboard/match" : bannerHref}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all whitespace-nowrap"
          >
            {profileComplete ? "Run AI matching" : "Complete profile first"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
