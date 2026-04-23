import { createClient } from "@/lib/supabase/server";
import { BarChart3, Users, BookOpen, ListChecks, Bookmark } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

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
    "In Progress": "bg-slate-600",
    "Submitted": "bg-slate-800",
    "Awaiting Decision": "bg-amber-600",
    "Accepted": "bg-emerald-700",
    "Rejected": "bg-red-800",
    "Withdrawn": "bg-slate-300",
  };

  const countryFlags: Record<string, string> = { UK: "🇬🇧", USA: "🇺🇸", Germany: "🇩🇪", Canada: "🇨🇦" };
  const maxStatus  = Math.max(...Object.values(statusCounts),  1);
  const maxCountry = Math.max(...Object.values(countryCounts), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-medium text-3xl display text-slate-900 tracking-tight">Official Analytics Report</h1>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mt-2">Platform Data & Engagement Overview</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",         value: totalUsers        ?? 0, icon: Users },
          { label: "Active Scholarships", value: totalScholarships ?? 0, icon: BookOpen },
          { label: "Applications",        value: totalTracked      ?? 0, icon: ListChecks },
          { label: "Saved Entries",       value: totalSaved        ?? 0, icon: Bookmark },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 w-2/3 leading-relaxed">{s.label}</p>
              <s.icon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-4xl font-medium display text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application status breakdown */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-200">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-slate-900">Application Status Distribution</h2>
          </div>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-8">No application data logged.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-700">{status}</span>
                      <span className="text-xs font-medium text-slate-900 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${statusColors[status] || "bg-slate-400"}`}
                        style={{ width: `${(count / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Scholarships by country */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-200">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-slate-900">Scholarship Geographic Spread</h2>
          </div>
          {Object.keys(countryCounts).length === 0 ? (
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-8">No active scholarships.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <div key={country} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{countryFlags[country] || "🌍"}</span>
                        <span className="text-xs font-medium text-slate-700">{country}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm bg-slate-800 transition-all duration-500"
                        style={{ width: `${(count / maxCountry) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
