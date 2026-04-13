import { createClient } from "@/lib/supabase/server";
import { BarChart3, Users, BookOpen, ListChecks, Bookmark } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalScholarships },
    { count: totalTracked },
    { count: totalSaved },
    { data: statusBreakdown },
    { data: countryBreakdown },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("scholarships").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("application_tracker").select("*", { count: "exact", head: true }),
    supabase.from("saved_scholarships").select("*", { count: "exact", head: true }),
    supabase.from("application_tracker").select("status"),
    supabase.from("scholarships").select("country").eq("is_active", true),
  ]);

  // Aggregate status counts
  const statusCounts: Record<string, number> = {};
  statusBreakdown?.forEach((r: any) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  // Aggregate country counts
  const countryCounts: Record<string, number> = {};
  countryBreakdown?.forEach((r: any) => { countryCounts[r.country] = (countryCounts[r.country] || 0) + 1; });

  const statusColors: Record<string, string> = {
    "Interested": "bg-slate-400",
    "In Progress": "bg-blue-500",
    "Submitted": "bg-violet-500",
    "Awaiting Decision": "bg-amber-500",
    "Accepted": "bg-emerald-500",
    "Rejected": "bg-red-400",
    "Withdrawn": "bg-slate-300",
  };

  const countryFlags: Record<string, string> = { UK: "🇬🇧", USA: "🇺🇸", Germany: "🇩🇪", Canada: "🇨🇦" };
  const maxStatus  = Math.max(...Object.values(statusCounts),  1);
  const maxCountry = Math.max(...Object.values(countryCounts), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform usage overview.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",         value: totalUsers        ?? 0, icon: Users,      color: "bg-blue-50 text-blue-600" },
          { label: "Active Scholarships", value: totalScholarships ?? 0, icon: BookOpen,   color: "bg-emerald-50 text-emerald-600" },
          { label: "Applications",        value: totalTracked      ?? 0, icon: ListChecks, color: "bg-violet-50 text-violet-600" },
          { label: "Saves",               value: totalSaved        ?? 0, icon: Bookmark,   color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application status breakdown */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Application Status Breakdown</h2>
          </div>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No application data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{status}</span>
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusColors[status] || "bg-slate-400"}`}
                        style={{ width: `${(count / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Scholarships by country */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Scholarships by Country</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(countryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div key={country}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{countryFlags[country] || "🌍"} {country}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(count / maxCountry) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
