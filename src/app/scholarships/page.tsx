import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import Link from "next/link";
import { Search } from "lucide-react";

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

  // Pull distinct countries live from the DB — no hardcoding needed
  const { data: countryRows } = await supabase
    .from("scholarships")
    .select("country")
    .eq("is_active", true)
    .order("country", { ascending: true });
  const countries = ["All", ...Array.from(new Set((countryRows ?? []).map((r: any) => r.country)))];

  const fundingTypes = ["All", "Full", "Partial", "Tuition Only", "Living Allowance"];
  const degreeLevels = ["All", "Undergraduate", "Masters", "PhD"];

  const active = {
    country:      resolvedSearchParams.country      || "All",
    funding_type: resolvedSearchParams.funding_type || "All",
    degree_level: resolvedSearchParams.degree_level || "All",
    search:       resolvedSearchParams.search       || "",
  };

  const isFiltered = active.country !== "All" || active.funding_type !== "All" || active.degree_level !== "All" || active.search !== "";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "380px" }}>
        {/* Background photo — university campus, Unsplash */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay — just enough to keep text readable, let the photo colours breathe */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />

        {/* Content — centred */}
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-3">
            Scholarship Directory
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight tracking-tight mb-4">
            Find the right scholarship<br className="hidden sm:block" /> for your ambitions.
          </h1>
          <p className="text-white/80 text-base max-w-lg leading-relaxed mb-8">
            {scholarships?.length ?? 0} curated opportunities across {countries.length - 1} countries —
            matched to your profile, level, and field of study.
          </p>

          {/* Search bar */}
          <form method="GET" action="/scholarships"
            className="flex items-center w-full max-w-xl bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-white/50 transition-all">
            <div className="flex items-center px-4 text-white/60">
              <Search className="w-4 h-4" />
            </div>
            {active.country      !== "All" && <input type="hidden" name="country"      value={active.country} />}
            {active.funding_type !== "All" && <input type="hidden" name="funding_type" value={active.funding_type} />}
            {active.degree_level !== "All" && <input type="hidden" name="degree_level" value={active.degree_level} />}
            <input name="search" defaultValue={active.search} placeholder="Search by scholarship name or keyword…"
              className="flex-1 bg-transparent py-3.5 pr-3 text-sm text-white placeholder:text-white/50 outline-none" />
            <button type="submit"
              className="m-1.5 px-5 py-2.5 bg-white text-brand-700 hover:bg-white/90 text-sm font-semibold rounded-lg transition-colors shrink-0">
              Search
            </button>
          </form>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {[
              { label: "Countries", value: `${countries.length - 1}` },
              { label: "Scholarships", value: `${scholarships?.length ?? 0}` },
              { label: "Funding Types", value: "4" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3.5 py-2">
                <span className="text-white font-bold text-sm">{stat.value}</span>
                <span className="text-white/60 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── END HERO ─────────────────────────────────────────── */}

      {/* ── RESULTS AREA ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">

        {/* Active filter summary bar */}
        {isFiltered && (
          <div className="flex items-center justify-between mb-6 py-3 px-4 bg-white border border-slate-200 rounded-xl text-sm">
            <p className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{scholarships?.length ?? 0}</span> result{scholarships?.length !== 1 ? "s" : ""}
              {active.country !== "All" && <> in <span className="font-semibold text-slate-900">{active.country}</span></>}
              {active.funding_type !== "All" && <> · <span className="font-semibold text-slate-900">{active.funding_type}</span></>}
              {active.degree_level !== "All" && <> · <span className="font-semibold text-slate-900">{active.degree_level}</span></>}
              {active.search && <> matching &ldquo;<span className="font-semibold text-slate-900">{active.search}</span>&rdquo;</>}
            </p>
            <Link href="/scholarships" className="text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors">
              Clear filters
            </Link>
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
                  {scholarships.map((s: any, idx) => (
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
                  No scholarships match your current filters. Try adjusting your search criteria.
                </p>
                <Link href="/scholarships"
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all">
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
