import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/scholarship/FilterSidebar";
import ScholarshipCard from "@/components/scholarship/ScholarshipCard";
import FeaturedScholarshipCard from "@/components/scholarship/FeaturedScholarshipCard";
import HeroSearch from "@/components/scholarship/HeroSearch";
import { opportunityScore } from "@/lib/utils";
import { escapePostgrestLikePattern } from "@/lib/supabase/filters";
import { Search, GraduationCap, Globe2, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarship Directory",
  description:
    "Browse verified scholarships across the UK, USA, Germany, and Canada. Filter by destination, degree level, funding type, deadline, and eligibility.",
  openGraph: {
    title: "Scholarship Directory | ScholarBridge",
    description:
      "Browse verified scholarships by destination, degree level, funding type, deadline, and eligibility.",
    url: "/scholarships",
  },
  twitter: {
    card: "summary",
    title: "Scholarship Directory | ScholarBridge",
    description: "Browse verified scholarships across top study destinations.",
  },
};

interface SearchParams {
  country?: string;
  degree_level?: string;
  funding_type?: string;
  search?: string;
  deadline?: string;
  renewable?: string;
  international?: string;
  effort?: string;
}

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient();
  const p = await searchParams;

  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (p.country      && p.country      !== "All") query = query.eq("country", p.country);
  if (p.funding_type && p.funding_type !== "All") query = query.eq("funding_type", p.funding_type);
  if (p.degree_level && p.degree_level !== "All") query = query.contains("degree_levels", [p.degree_level]);
  if (p.search?.trim()) {
    const pattern = escapePostgrestLikePattern(p.search);
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

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

  const [{ data: scholarships }, { data: countryRows }, { count: totalCount }] = await Promise.all([
    query,
    supabase
      .from("scholarships")
      .select("country")
      .eq("is_active", true)
      .order("country", { ascending: true }),
    supabase
      .from("scholarships")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);
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

  // Pick the featured scholarship with the same public-facing score shown on cards.
  // Avoid featuring opportunities that are already past their deadline.
  const featured = (() => {
    if (!scholarships?.length) return null;
    const today = new Date().toISOString().split("T")[0];
    const candidates = scholarships.filter((s: any) => !s.application_deadline || s.application_deadline >= today);
    const scored = (candidates.length ? candidates : scholarships).map((s: any) => ({
      s,
      score: opportunityScore(s),
    }));
    scored.sort((a: any, b: any) => b.score - a.score);
    return scored[0].s;
  })();

  const remaining = scholarships?.filter((s: any) => s.id !== featured?.id) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16" style={{ minHeight: "420px" }}>
        {/* Prestigious university library photo — warm, aspirational, editorial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />

        {/* Heavy dark overlay — ensures text legibility and adds gravitas */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/70 to-zinc-950/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.15),_transparent_60%)]" />

        {/* Subtle grid texture for that editorial print feel */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          {/* Overline */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8 bg-white/20" />
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
              Scholarship Directory
            </p>
            <div className="h-px w-8 bg-white/20" />
          </div>

          {/* Headline */}
          <h1
            className="text-center text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.1] tracking-tight mb-5"
            style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif", fontWeight: 500 }}
          >
            Fund your future.
            <br className="hidden sm:block" />
            <span className="text-white/80">Find the right scholarship.</span>
          </h1>

          <p className="text-center text-white/60 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-10">
            {totalCount ?? scholarships?.length ?? 0} curated opportunities across {countries.length - 1} countries.
            Search by destination, degree, or funding type.
          </p>

          {/* Search */}
          <HeroSearch
            countries={countries}
            fundingTypes={fundingTypes}
            degreeLevels={degreeLevels}
            active={active}
          />

          {/* Trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10">
            <div className="flex items-center gap-2 text-white/50">
              <GraduationCap className="size-4" />
              <span className="text-xs font-medium">{totalCount ?? scholarships?.length ?? 0} Scholarships</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <Globe2 className="size-4" />
              <span className="text-xs font-medium">{countries.length - 1} Countries</span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
              <Award className="size-4" />
              <span className="text-xs font-medium">Full &amp; Partial Funding</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {isFiltered && (
          <div className="flex items-center justify-between mb-8 py-3 px-4 bg-white border border-zinc-200 rounded-xl text-sm">
            <p className="text-zinc-600">
              Showing <span className="font-semibold text-zinc-900">{scholarships?.length ?? 0}</span> result{scholarships?.length !== 1 ? "s" : ""}
              {active.country      !== "All"  && <> in <span className="font-semibold">{active.country}</span></>}
              {active.funding_type !== "All"  && <> · <span className="font-semibold">{active.funding_type}</span></>}
              {active.degree_level !== "All"  && <> · <span className="font-semibold">{active.degree_level}</span></>}
              {active.deadline     !== "any"  && <> · <span className="font-semibold">Due within {active.deadline}</span></>}
              {active.renewable    === "true" && <> · <span className="font-semibold">Renewable</span></>}
              {active.international === "true" && <> · <span className="font-semibold">International</span></>}
              {active.effort       !== "any"  && <> · <span className="font-semibold">{active.effort === "quick" ? "Quick apply" : "Full application"}</span></>}
              {active.search && <> matching &ldquo;<span className="font-semibold">{active.search}</span>&rdquo;</>}
            </p>
            <a href="/scholarships" className="text-xs font-semibold text-zinc-400 hover:text-brand-600 transition-colors">
              Clear filters
            </a>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start gap-10">
          <FilterSidebar
            active={active}
            countries={countries}
            fundingTypes={fundingTypes}
            degreeLevels={degreeLevels}
          />
          <div className="flex-1 min-w-0">
            {scholarships && scholarships.length > 0 ? (
              <>
                {/* Section header */}
                {!isFiltered && (
                  <div className="mb-8">
                    <h2
                      className="text-2xl text-zinc-900 tracking-tight mb-1"
                      style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif", fontWeight: 500 }}
                    >
                      All opportunities
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {scholarships.length} scholarship{scholarships.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                )}

                {/* Featured scholarship */}
                {featured && !isFiltered && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Editor&apos;s Pick
                      </span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                    <FeaturedScholarshipCard scholarship={featured} />
                  </div>
                )}

                {/* Results grid */}
                {remaining.length > 0 && (
                  <>
                    {featured && !isFiltered && (
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-5">
                        More scholarships
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {remaining.map((s: any, idx: number) => (
                        <ScholarshipCard key={s.id} scholarship={s} index={idx} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-28 text-center bg-white rounded-xl border border-zinc-200">
                <div className="size-12 bg-zinc-100 rounded-full flex items-center justify-center mb-5">
                  <Search className="size-5 text-zinc-400" />
                </div>
                <h3 className="text-zinc-900 text-lg mb-2">No scholarships found</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-7">
                  No scholarships match your current filters. Try adjusting your criteria.
                </p>
                <a
                  href="/scholarships"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700
                             text-white text-sm font-semibold rounded-lg transition-colors"
                >
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
