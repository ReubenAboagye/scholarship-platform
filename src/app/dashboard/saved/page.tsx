import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bookmark, ArrowRight, ExternalLink } from "lucide-react";
import { countryFlagUrl, formatDeadline, fundingBadgeColor } from "@/lib/utils";
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

  const { data: trackedRows } = await supabase
    .from("application_tracker")
    .select("scholarship_id, status")
    .eq("user_id", user.id);

  const trackedMap = Object.fromEntries(
    (trackedRows ?? []).map((r: any) => [r.scholarship_id, r.status])
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="pb-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Your Collection</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl text-zinc-900">Saved Scholarships</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {saved.length > 0
                ? `${saved.length} scholarship${saved.length !== 1 ? "s" : ""} bookmarked for later.`
                : "Scholarships you've bookmarked will appear here."}
            </p>
          </div>
          <a href="/dashboard/scholarships"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all px-3.5 py-2 rounded-lg mt-1">
            Browse <ArrowRight className="size-3" />
          </a>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-10 text-center">
          <div className="size-10 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Bookmark className="size-4 text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 text-sm mb-1">No saved scholarships yet</h3>
          <p className="text-zinc-400 text-xs mb-4">Browse scholarships and click Save to bookmark them here.</p>
          <a href="/scholarships"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
            Browse scholarships <ArrowRight className="size-3.5" />
          </a>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden">
          {saved.map((item: any) => {
            const s = item.scholarship;
            if (!s) return null;
            const flagUrl = countryFlagUrl(s.country);
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                {/* Flag */}
                <div className="flex-shrink-0 size-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
                  {flagUrl
                    ? <img src={flagUrl} alt={s.country} className="w-5 h-3.5 object-cover rounded-sm" />
                    : <span className="text-[10px] text-zinc-400 font-bold">{s.country?.slice(0,2)}</span>
                  }
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-zinc-900 text-sm truncate">{s.name}</h3>
                    <span className={`hidden sm:inline flex-shrink-0 text-[10px] px-1.5 py-0.5 font-bold rounded-md ${fundingBadgeColor(s.funding_type)}`}>
                      {s.funding_type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">
                    {s.country} · {formatDeadline(s.application_deadline).replace(" (Closed)", "")}
                  </p>
                </div>

                {/* Actions — compact on mobile */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <TrackButton
                    scholarshipId={s.id}
                    userId={user.id}
                    initialStatus={trackedMap[s.id] ?? null}
                  />
                  <a href={`/dashboard/scholarships/${s.slug || s.id}`}
                    className="hidden sm:flex text-xs px-2.5 py-1.5 border border-zinc-200 text-zinc-600 hover:border-zinc-300 transition-colors font-medium rounded-lg">
                    Details
                  </a>
                  <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition-colors rounded-lg">
                    Apply <ExternalLink className="size-3" />
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
