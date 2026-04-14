import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bookmark, ExternalLink } from "lucide-react";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("saved_scholarships")
    .select("*, scholarship:scholarships(*)")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const saved = data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-black text-2xl text-slate-900">Saved Scholarships</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {saved.length} scholarship{saved.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No saved scholarships yet</h3>
          <p className="text-slate-500 text-sm mb-4">Browse scholarships and click Save to bookmark them here.</p>
          <a href="/scholarships" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            Browse Scholarships
          </a>
        </div>
      ) : (
        <div className="border border-slate-200 divide-y divide-slate-100">
          {saved.map((item: any) => {
            const s = item.scholarship;
            if (!s) return null;
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <span className="text-2xl">{countryFlag(s.country)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-0.5">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{s.name}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 font-medium ${fundingBadgeColor(s.funding_type)}`}>
                      {s.funding_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{s.provider} · Deadline: {formatDeadline(s.application_deadline)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={`/scholarships/${s.id}`} className="text-xs px-3 py-1.5 border border-slate-200 text-slate-700 hover:border-slate-400 transition-colors font-medium">
                    Details
                  </a>
                  <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-1">
                    Apply <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
