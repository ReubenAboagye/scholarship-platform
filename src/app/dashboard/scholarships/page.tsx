import { createClient } from "@/lib/supabase/server";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import ScholarshipRow from "@/components/scholarship/ScholarshipRow";
import ScholarshipTable from "@/components/scholarship/ScholarshipTable";
import ViewToggle from "@/components/scholarship/ViewToggle";
import { Search } from "lucide-react";

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
      {/* Header — quiet, informational */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse scholarships</h1>
          <p className="text-sm text-slate-500 mt-1">
            {scholarships?.length ?? 0} scholarship{scholarships?.length === 1 ? "" : "s"} across {countries.length - 1} countries
          </p>
        </div>

        <ViewToggle />
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-md text-sm">
          <p className="text-slate-700">
            Filters applied
          </p>
          <a href="/dashboard/scholarships"
            className="font-medium text-brand-700 hover:text-brand-800 hover:underline underline-offset-4">
            Clear all
          </a>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters — component manages its own width + stickiness */}
        <FilterSidebar
          active={active}
          countries={countries}
          fundingTypes={fundingTypes}
          degreeLevels={degreeLevels}
          baseUrl="/dashboard/scholarships"
        />

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
              <ScholarshipTable 
                scholarships={scholarships} 
                baseUrl="/dashboard/scholarships"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-slate-200 border-dashed">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1.5">No scholarships match your filters</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                Try broadening your search criteria or removing some filters.
              </p>
              <a href="/dashboard/scholarships"
                className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-md hover:bg-brand-700 transition-colors">
                Clear all filters
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
