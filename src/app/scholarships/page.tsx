import { createClient } from "@/lib/supabase/server";
import { countryFlagUrl, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface SearchParams { country?: string; degree_level?: string; funding_type?: string; search?: string; }

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  let query = supabase.from("scholarships").select("*").eq("is_active", true).order("created_at", { ascending: false });
  if (resolvedSearchParams.country      && resolvedSearchParams.country      !== "All") query = query.eq("country", resolvedSearchParams.country);
  if (resolvedSearchParams.funding_type && resolvedSearchParams.funding_type !== "All") query = query.eq("funding_type", resolvedSearchParams.funding_type);
  if (resolvedSearchParams.degree_level && resolvedSearchParams.degree_level !== "All") query = query.contains("degree_levels", [resolvedSearchParams.degree_level]);
  if (resolvedSearchParams.search) query = query.or(`name.ilike.%${resolvedSearchParams.search}%,description.ilike.%${resolvedSearchParams.search}%`);
  const { data: scholarships } = await query;

  const countries    = ["All", "UK", "USA", "Germany", "Canada"];
  const fundingTypes = ["All", "Full", "Partial", "Tuition Only", "Living Allowance"];
  const degreeLevels = ["All", "Undergraduate", "Masters", "PhD"];

  const active = {
    country:      resolvedSearchParams.country      || "All",
    funding_type: resolvedSearchParams.funding_type || "All",
    degree_level: resolvedSearchParams.degree_level || "All",
    search:       resolvedSearchParams.search       || "",
  };

  function buildUrl(overrides: Partial<typeof active>) {
    const merged = { ...active, ...overrides };
    const params = new URLSearchParams();
    if (merged.country      !== "All") params.set("country",      merged.country);
    if (merged.funding_type !== "All") params.set("funding_type", merged.funding_type);
    if (merged.degree_level !== "All") params.set("degree_level", merged.degree_level);
    if (merged.search)                 params.set("search",       merged.search);
    const qs = params.toString();
    return `/scholarships${qs ? "?" + qs : ""}`;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="font-black text-3xl text-slate-900 mb-1">Browse Scholarships</h1>
          <p className="text-slate-500 text-sm">{scholarships?.length ?? 0} scholarships across the UK, USA, Germany, and Canada.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-52 flex-shrink-0 space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Search</label>
              <form method="GET" action="/scholarships">
                {active.country      !== "All" && <input type="hidden" name="country"      value={active.country} />}
                {active.funding_type !== "All" && <input type="hidden" name="funding_type" value={active.funding_type} />}
                {active.degree_level !== "All" && <input type="hidden" name="degree_level" value={active.degree_level} />}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="search" defaultValue={active.search} placeholder="Scholarship name…"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </form>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Country</label>
              <div className="space-y-px">
                {countries.map((c) => (
                  <Link key={c} href={buildUrl({ country: c })}
                    className={`flex items-center gap-2 px-2.5 py-1.5 text-sm transition-colors ${
                      active.country === c ? "bg-brand-600 text-white font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}>
                    {c !== "All" && countryFlagUrl(c) && <img src={countryFlagUrl(c)!} alt={c} className="w-5 h-auto" />}
                    {c}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Funding Type</label>
              <div className="space-y-px">
                {fundingTypes.map((f) => (
                  <Link key={f} href={buildUrl({ funding_type: f })}
                    className={`block px-2.5 py-1.5 text-sm transition-colors ${
                      active.funding_type === f ? "bg-brand-600 text-white font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}>{f}</Link>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Degree Level</label>
              <div className="space-y-px">
                {degreeLevels.map((d) => (
                  <Link key={d} href={buildUrl({ degree_level: d })}
                    className={`block px-2.5 py-1.5 text-sm transition-colors ${
                      active.degree_level === d ? "bg-brand-600 text-white font-medium" : "text-slate-600 hover:bg-slate-100"
                    }`}>{d}</Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {scholarships && scholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
                {scholarships.map((s: any) => (
                  <div key={s.id} className="bg-white p-5 flex flex-col hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {countryFlagUrl(s.country)
                          ? <img src={countryFlagUrl(s.country)!} alt={s.country} className="w-7 h-auto" />
                          : <span className="text-xl">🌍</span>}
                        <span className={`text-xs px-2 py-0.5 font-medium ${fundingBadgeColor(s.funding_type)}`}>{s.funding_type}</span>
                      </div>
                      <span className="text-xs text-slate-400">{s.country}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-0.5 leading-snug">{s.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{s.provider}</p>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed flex-1">{s.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400">Deadline</p>
                        <p className={`text-xs font-semibold ${
                          s.application_deadline && new Date(s.application_deadline) > new Date() ? "text-slate-700" : "text-slate-400"
                        }`}>{formatDeadline(s.application_deadline)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/scholarships/${s.id}`} className="text-xs px-3 py-1.5 border border-slate-200 text-slate-700 hover:border-slate-400 transition-colors font-medium">Details</Link>
                        <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors flex items-center gap-1">
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-slate-200">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="font-semibold text-slate-900 mb-2">No scholarships found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your filters or clearing your search.</p>
                <Link href="/scholarships" className="mt-4 text-sm text-brand-600 hover:underline font-medium">Clear all filters</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
