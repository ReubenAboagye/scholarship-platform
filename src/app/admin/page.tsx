import { createClient } from "@/lib/supabase/server";
import { BookOpen, Users, ListChecks, Bookmark, TrendingUp } from "lucide-react";
import { countryFlag, formatDeadline } from "@/lib/utils";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalScholarships },
    { count: totalTracked },
    { count: totalSaved },
    { data: recentScholarships },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("scholarships").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("application_tracker").select("*", { count: "exact", head: true }),
    supabase.from("saved_scholarships").select("*", { count: "exact", head: true }),
    supabase.from("scholarships").select("id, name, country, funding_type, application_deadline, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id, full_name, email, created_at, country_of_origin").order("created_at", { ascending: false }).limit(5),
  ]);

  const statCards = [
    { label: "Total Users",       value: totalUsers       ?? 0, icon: Users,      color: "bg-blue-50 text-blue-600",    href: "/admin/users" },
    { label: "Active Scholarships",value: totalScholarships ?? 0, icon: BookOpen,   color: "bg-emerald-50 text-emerald-600", href: "/admin/scholarships" },
    { label: "Applications",      value: totalTracked     ?? 0, icon: ListChecks, color: "bg-violet-50 text-violet-600", href: "/admin/analytics" },
    { label: "Saved",             value: totalSaved       ?? 0, icon: Bookmark,   color: "bg-amber-50 text-amber-600",  href: "/admin/analytics" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-black text-3xl text-slate-900">Admin Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Platform health at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-card transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scholarships */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Scholarships</h2>
            <Link href="/admin/scholarships" className="text-xs text-blue-600 hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentScholarships?.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl">{countryFlag(s.country)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.country} · {formatDeadline(s.application_deadline)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  s.funding_type === "Full" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {s.funding_type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                  {(u.full_name || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.full_name || "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                {u.country_of_origin && (
                  <span className="text-xs text-slate-400 flex-shrink-0">{u.country_of_origin}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
