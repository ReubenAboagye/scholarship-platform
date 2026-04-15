import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-12 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-[2px] bg-brand-600 rounded-full" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-600">Opportunity Awaits</span>
          </div>
          <h1 className="font-black text-4xl lg:text-5xl text-slate-900 mb-4 tracking-tight">Browse Scholarships</h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Discover <span className="text-slate-900 font-bold">{scholarships?.length ?? 0} premium opportunities</span> carefully curated across the top global destinations.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Responsive Sidebar */}
          <FilterSidebar 
            active={active} 
            countries={countries} 
            fundingTypes={fundingTypes} 
            degreeLevels={degreeLevels} 
            buildUrl={buildUrl} 
          />

          {/* Results Grid */}
          <div className="flex-1 min-w-0">
            {scholarships && scholarships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {scholarships.map((s: any, idx) => (
                  <ScholarshipCard key={s.id} scholarship={s} index={idx} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200 animate-fade-in">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl text-slate-300">🔍</span>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-2">No scholarships found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                  We couldn&apos;t find any scholarships matching your current filters. Try broadening your search.
                </p>
                <Link href="/scholarships" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

