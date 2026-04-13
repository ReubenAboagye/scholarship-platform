import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";

export default async function SavedPage() {
  const supabase = createClient();
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
      <div>
        <h1 className="font-display text-3xl text-slate-900">Saved Scholarships</h1>
        <p className="text-slate-500 text-sm mt-1">
          {saved.length} scholarship{saved.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No saved scholarships yet</h3>
          <p className="text-slate-500 text-sm mb-4">Browse scholarships and click Save to bookmark them here.</p>
          <Link href="/scholarships" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((item: any) => {
            const s = item.scholarship;
            if (!s) return null;
            return (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-card transition-all flex items-center gap-4">
                <span className="text-2xl">{countryFlag(s.country)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-[15px] leading-snug">{s.name}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${fundingBadgeColor(s.funding_type)}`}>
                      {s.funding_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{s.provider} · Deadline: {formatDeadline(s.application_deadline)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/scholarships/${s.id}`} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:border-blue-300 transition-colors font-medium">
                    Details
                  </Link>
                  <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-1">
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
