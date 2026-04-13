import { createClient } from "@/lib/supabase/server";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface SearchParams { country?: string; degree_level?: string; funding_type?: string; search?: string; }

export default async function ScholarshipsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (searchParams.country && searchParams.country !== "All")
    query = query.eq("country", searchParams.country);
  if (searchParams.funding_type && searchParams.funding_type !== "All")
    query = query.eq("funding_type", searchParams.funding_type);
  if (searchParams.degree_level && searchParams.degree_level !== "All")
    query = query.contains("degree_levels", [searchParams.degree_level]);
  if (searchParams.search)
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`);

  const { data: scholarships } = await query;

  const countries     = ["All", "UK", "USA", "Germany", "Canada"];
  const fundingTypes  = ["All", "Full", "Partial", "Tuition Only", "Living Allowance"];
  const degreeLevels  = ["All", "Undergraduate", "Masters", "PhD"];

  const active = {
    country:      searchParams.country      || "All",
    funding_type: searchParams.funding_type || "All",
    degree_level: searchParams.degree_level || "All",
    search:       searchParams.search       || "",
  };

  function buildUrl(overrides: Partial<typeof active>) {
    const merged = { ...active, ...overrides };
    const params = new URLSearchParams();
    if (merged.country      !== "All")  params.set("country",       merged.country);
    if (merged.funding_type !== "All")  params.set("funding_type",  merged.funding_type);
    if (merged.degree_level !== "All")  params.set("degree_level",  merged.degree_level);
    if (merged.search)                  params.set("search",         merged.search);
    const qs = params.toString();
    return `/scholarships${qs ? "?" + qs : ""}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-black text-4xl text-slate-900 mb-2">Browse Scholarships</h1>
          <p className="text-slate-500">
            {scholarships?.length ?? 0} scholarships across the UK, USA, Germany, and Canada.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="lg:w-56 flex-shrink-0 space-y-4">
            {/* Search */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Search</label>
              <form method="GET" action="/scholarships">
                {active.country      !== "All"  && <input type="hidden" name="country"       value={active.country} />}
                {active.funding_type !== "All"  && <input type="hidden" name="funding_type"  value={active.funding_type} />}
                {active.degree_level !== "All"  && <input type="hidden" name="degree_level"  value={active.degree_level} />}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="search"
                    defaultValue={active.search}
                    placeholder="Scholarship name…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </form>
            </div>

            {/* Country */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Country</label>
              <div className="space-y-1">
                {countries.map((c) => (
                  <Link
                    key={c}
                    href={buildUrl({ country: c })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      active.country === c ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {c !== "All" && countryFlag(c)} {c}
                  </Link>
                ))}
              </div>
            </div>

            {/* Funding */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Funding Type</label>
              <div className="space-y-1">
                {fundingTypes.map((f) => (
                  <Link
                    key={f}
                    href={buildUrl({ funding_type: f })}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      active.funding_type === f ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </Link>
                ))}
              </div>
            </div>

            {/* Degree */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Degree Level</label>
              <div className="space-y-1">
                {degreeLevels.map((d) => (
                  <Link
                    key={d}
                    href={buildUrl({ degree_level: d })}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      active.degree_level === d ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {d}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Cards grid */}
          <div className="flex-1 min-w-0">
            {scholarships && scholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scholarships.map((s: any) => (
                  <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-card transition-all flex flex-col">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{countryFlag(s.country)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fundingBadgeColor(s.funding_type)}`}>
                          {s.funding_type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{s.country}</span>
                    </div>

                    <h3 className="font-semibold text-slate-900 text-[15px] mb-1 leading-snug">{s.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{s.provider}</p>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed flex-1">{s.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400">Deadline</p>
                        <p className={`text-xs font-semibold ${
                          s.application_deadline && new Date(s.application_deadline) > new Date()
                            ? "text-slate-700" : "text-slate-400"
                        }`}>
                          {formatDeadline(s.application_deadline)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/scholarships/${s.id}`}
                          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:border-blue-300 transition-colors font-medium"
                        >
                          Details
                        </Link>
                        <a
                          href={s.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-1"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-semibold text-slate-900 mb-2">No scholarships found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your filters or clearing your search.</p>
                <Link href="/scholarships" className="mt-4 text-sm text-blue-600 hover:underline">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
