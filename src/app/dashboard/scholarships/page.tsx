import { createClient } from "@/lib/supabase/server";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import ScholarshipRow from "@/components/scholarship/ScholarshipRow";
import ViewToggle from "@/components/scholarship/ViewToggle";
import { Search, Info, LayoutGrid, List } from "lucide-react";

interface SearchParams {
  country?: string;
  degree_level?: string;
  funding_type?: string;
  search?: string;
  deadline?: string;
  renewable?: string;
  international?: string;
  effort?: string;
  view?: string;
}

export default async function DashboardScholarshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const p = await searchParams;

  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Filters
  if (p.country      && p.country      !== "All") query = query.eq("country", p.country);
  if (p.funding_type && p.funding_type !== "All") query = query.eq("funding_type", p.funding_type);
  if (p.degree_level && p.degree_level !== "All") query = query.contains("degree_levels", [p.degree_level]);
  if (p.search) query = query.or(`name.ilike.%${p.search}%,description.ilike.%${p.search}%`);
  if (p.renewable    === "true") query = query.eq("renewable", true);
  if (p.international === "true") query = query.eq("open_to_international", true);

  if (p.deadline && p.deadline !== "any") {
    const days = p.deadline === "7d" ? 7 : p.deadline === "30d" ? 30 : 90;
    const cutoff = new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];
    query = query
      .not("application_deadline", "is", null)
      .lte("application_deadline", cutoff)
      .gte("application_deadline", new Date().toISOString().split("T")[0]);
  }

  if (p.effort === "quick")  query = query.lte("effort_minutes", 60);
  if (p.effort === "medium") query = query.gt("effort_minutes", 60);

  const { data: scholarships } = await query;

  // Metadata for filters
  const { data: countryRows } = await supabase
    .from("scholarships")
    .select("country")
    .eq("is_active", true)
    .order("country", { ascending: true });
  
  const countries = ["All", ...Array.from(new Set((countryRows ?? []).map((r: any) => r.country)))];
  const fundingTypes  = ["All", "Full", "Partial", "Tuition Only", "Living Allowance"];
  const degreeLevels  = ["All", "Undergraduate", "Masters", "PhD"];

  const active = {
    country:       p.country       || "All",
    funding_type:  p.funding_type  || "All",
    degree_level:  p.degree_level  || "All",
    search:        p.search        || "",
    deadline:      p.deadline      || "any",
    renewable:     p.renewable     || "",
    international: p.international || "",
    effort:        p.effort        || "any",
    view:          p.view          || "grid",
  };

  const isFiltered =
    active.country !== "All" || active.funding_type !== "All" ||
    active.degree_level !== "All" || active.search !== "" ||
    active.deadline !== "any" || active.renewable === "true" ||
    active.international === "true" || active.effort !== "any";

  return (
    <div className="space-y-6">
      {/* Header section — matches dashboard feel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Browse Scholarships</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore {scholarships?.length ?? 0} curated opportunities across the globe.
          </p>
        </div>
        
        {/* Right side Actions */}
        <div className="flex items-center gap-4">
          <ViewToggle />
          
          {/* Quick status summary */}
          <div className="hidden sm:flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
              <span className="text-lg font-bold text-slate-900">{scholarships?.length ?? 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-600">{countries.length - 1}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Countries</span>
            </div>
          </div>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between py-2.5 px-4 bg-brand-50/50 border border-brand-100 rounded-xl text-xs md:text-sm">
          <p className="text-brand-900 font-medium">
            Active filters applied
          </p>
          <a href="/dashboard/scholarships" className="font-bold text-brand-600 hover:text-brand-700 underline underline-offset-4">
            Clear all
          </a>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters — Sidebar handles stickiness internally */}
        <div className="lg:w-60 flex-shrink-0">
          <FilterSidebar
            active={active}
            countries={countries}
            fundingTypes={fundingTypes}
            degreeLevels={degreeLevels}
            baseUrl="/dashboard/scholarships"
          />
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {scholarships && scholarships.length > 0 ? (
            active.view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scholarships.map((s: any, idx: number) => (
                  <ScholarshipCard 
                    key={s.id} 
                    scholarship={s} 
                    index={idx} 
                    baseUrl="/dashboard/scholarships"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {scholarships.map((s: any, idx: number) => (
                  <ScholarshipRow 
                    key={s.id} 
                    scholarship={s} 
                    index={idx} 
                    baseUrl="/dashboard/scholarships"
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl mb-2">No scholarships found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                We couldn&apos;t find any scholarships matching your current filters. 
                Try broadening your criteria or search term.
              </p>
              <a href="/dashboard/scholarships"
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95">
                Clear all filters
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
