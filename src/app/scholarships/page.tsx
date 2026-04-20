import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import { Search } from "lucide-react";

interface SearchParams {
  country?: string;
  degree_level?: string;
  funding_type?: string;
  search?: string;
  deadline?: string;      // "7d" | "30d" | "90d" | "any"
  renewable?: string;     // "true"
  international?: string; // "true"
  effort?: string;        // "quick" (<= 60 min) | "medium" | "any"
}

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const p = await searchParams;

  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Existing filters
  if (p.country      && p.country      !== "All") query = query.eq("country", p.country);
  if (p.funding_type && p.funding_type !== "All") query = query.eq("funding_type", p.funding_type);
  if (p.degree_level && p.degree_level !== "All") query = query.contains("degree_levels", [p.degree_level]);
  if (p.search) query = query.or(`name.ilike.%${p.search}%,description.ilike.%${p.search}%`);

  // New Phase 2 filters
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

  // Distinct countries from DB
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
  };

  const isFiltered =
    active.country !== "All" || active.funding_type !== "All" ||
    active.degree_level !== "All" || active.search !== "" ||
    active.deadline !== "any" || active.renewable === "true" ||
    active.international === "true" || active.effort !== "any";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "360px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80&auto=format&fit=crop"
          alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Deeper scrim — ensures text and white form remain legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950/80" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70 mb-3">
              Scholarship Directory
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-white leading-tight tracking-tight mb-3">
              Find the right scholarship for your ambitions
            </h1>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed">
              {scholarships?.length ?? 0} curated opportunities across {countries.length - 1} countries.
              Search by keyword or filter below.
            </p>
          </div>

          {/* Solid search form — government-portal feel */}
          <form
            method="GET"
            action="/scholarships"
            className="bg-white rounded-lg shadow-xl border border-white/10 overflow-hidden"
          >
            {/* Keyword search row */}
            <div className="flex items-center border-b border-slate-200">
              <div className="flex items-center pl-4 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                name="search"
                defaultValue={active.search}
                placeholder="Search by name, provider, or keyword"
                className="flex-1 py-3.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>

            {/* Inline filter row */}
            <div className="grid grid-cols-1 sm:grid-cols-4">
              {/* Country */}
              <label className="flex flex-col px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 mb-1">Country</span>
                <select
                  name="country"
                  defaultValue={active.country}
                  className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>{c === "All" ? "All countries" : c}</option>
                  ))}
                </select>
              </label>

              {/* Degree level */}
              <label className="flex flex-col px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 mb-1">Degree level</span>
                <select
                  name="degree_level"
                  defaultValue={active.degree_level}
                  className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
                >
                  {degreeLevels.map((d) => (
                    <option key={d} value={d}>{d === "All" ? "Any level" : d}</option>
                  ))}
                </select>
              </label>

              {/* Funding type */}
              <label className="flex flex-col px-4 py-3 border-b sm:border-b-0 sm:border-r border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 mb-1">Funding</span>
                <select
                  name="funding_type"
                  defaultValue={active.funding_type}
                  className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
                >
                  {fundingTypes.map((f) => (
                    <option key={f} value={f}>{f === "All" ? "Any funding" : f}</option>
                  ))}
                </select>
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-3 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Preserve hidden filters not shown in the hero */}
            {active.deadline      !== "any"  && <input type="hidden" name="deadline"      value={active.deadline} />}
            {active.renewable     === "true" && <input type="hidden" name="renewable"     value="true" />}
            {active.international === "true" && <input type="hidden" name="international" value="true" />}
            {active.effort        !== "any"  && <input type="hidden" name="effort"        value={active.effort} />}
          </form>

          {/* Quiet subtitle line replaces the glass pills */}
          <p className="text-center text-xs text-white/60 mt-5">
            Filter more specifically on the results page · Always free for students
          </p>
        </div>
      </section>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {isFiltered && (
          <div className="flex items-center justify-between mb-6 py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm">
            <p className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{scholarships?.length ?? 0}</span> result{scholarships?.length !== 1 ? "s" : ""}
              {active.country      !== "All"  && <> in <span className="font-semibold">{active.country}</span></>}
              {active.funding_type !== "All"  && <> · <span className="font-semibold">{active.funding_type}</span></>}
              {active.degree_level !== "All"  && <> · <span className="font-semibold">{active.degree_level}</span></>}
              {active.deadline     !== "any"  && <> · <span className="font-semibold">Due within {active.deadline}</span></>}
              {active.renewable    === "true" && <> · <span className="font-semibold">Renewable</span></>}
              {active.international === "true" && <> · <span className="font-semibold">International</span></>}
              {active.effort       !== "any"  && <> · <span className="font-semibold">{active.effort === "quick" ? "Quick apply" : "Full application"}</span></>}
              {active.search && <> matching &ldquo;<span className="font-semibold">{active.search}</span>&rdquo;</>}
            </p>
            <a href="/scholarships" className="text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors">
              Clear filters
            </a>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          <FilterSidebar
            active={active}
            countries={countries}
            fundingTypes={fundingTypes}
            degreeLevels={degreeLevels}
          />
          <div className="flex-1 min-w-0">
            {scholarships && scholarships.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 font-medium mb-5">
                  {scholarships.length} scholarship{scholarships.length !== 1 ? "s" : ""} found
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {scholarships.map((s: any, idx: number) => (
                    <ScholarshipCard key={s.id} scholarship={s} index={idx} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-28 text-center bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No scholarships found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-7">
                  No scholarships match your current filters. Try adjusting your criteria.
                </p>
                <a href="/scholarships"
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all">
                  Clear all filters
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
