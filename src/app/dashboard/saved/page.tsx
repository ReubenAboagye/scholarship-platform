import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bookmark, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import TrackButton from "@/components/scholarship/TrackButton";

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

  // Fetch all tracked scholarship IDs + statuses for this user in one query
  const { data: trackedRows } = await supabase
    .from("application_tracker")
    .select("scholarship_id, status")
    .eq("user_id", user.id);

  const trackedMap = Object.fromEntries(
    (trackedRows ?? []).map((r: any) => [r.scholarship_id, r.status])
  );

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
          <Link href="/scholarships" className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold text-sm transition-colors">
            Browse latest scholarships <ArrowRight className="w-4 h-4" />
          </Link>
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
                  <TrackButton
                    scholarshipId={s.id}
                    userId={user.id}
                    initialStatus={trackedMap[s.id] ?? null}
                  />
                  <a href={`/scholarships/${s.slug ?? s.id}`} className="text-xs px-3 py-1.5 border border-slate-200 text-slate-700 hover:border-slate-400 transition-colors font-medium rounded-lg">
                    Details
                  </a>
                  <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-1 rounded-lg">
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
