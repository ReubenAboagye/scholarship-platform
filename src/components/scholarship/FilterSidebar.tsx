"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { countryFlagUrl } from "@/lib/utils";

interface FilterSidebarProps {
  active: { country: string; funding_type: string; degree_level: string; search: string };
  countries: string[];
  fundingTypes: string[];
  degreeLevels: string[];
}

function FilterSection({
  label, children, defaultOpen = true,
}: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left group">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 group-hover:text-slate-700 transition-colors">
          {label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ active, countries, fundingTypes, degreeLevels }: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const buildUrl = (overrides: Partial<typeof active>) => {
    const merged = { ...active, ...overrides };
    const params = new URLSearchParams();
    if (merged.country      !== "All") params.set("country",      merged.country);
    if (merged.funding_type !== "All") params.set("funding_type", merged.funding_type);
    if (merged.degree_level !== "All") params.set("degree_level", merged.degree_level);
    if (merged.search)                 params.set("search",       merged.search);
    const qs = params.toString();
    return `/scholarships${qs ? "?" + qs : ""}`;
  };

  const hasFilters = Object.values(active).some(v => v !== "All" && v !== "");

  const FilterContent = () => (
    <div className="space-y-0">

      {/* Search */}
      <FilterSection label="Search">
        <form method="GET" action="/scholarships">
          {active.country      !== "All" && <input type="hidden" name="country"      value={active.country} />}
          {active.funding_type !== "All" && <input type="hidden" name="funding_type" value={active.funding_type} />}
          {active.degree_level !== "All" && <input type="hidden" name="degree_level" value={active.degree_level} />}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input name="search" defaultValue={active.search} placeholder="Keyword…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 transition-all placeholder:text-slate-400" />
          </div>
        </form>
      </FilterSection>

      {/* Country */}
      <FilterSection label="Country">
        <div className="space-y-0.5">
          {countries.map((c) => (
            <Link key={c} href={buildUrl({ country: c })} onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                active.country === c
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}>
              {c !== "All" && countryFlagUrl(c) && (
                <img src={countryFlagUrl(c)!} alt={c} className="w-4 h-3 object-cover rounded-sm border border-slate-100" />
              )}
              {c === "All" && <span className="w-4 h-3 flex items-center justify-center text-[10px]">🌍</span>}
              <span>{c === "All" ? "All Countries" : c}</span>
              {active.country === c && <ChevronRight className="w-3 h-3 ml-auto text-brand-500" />}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Funding Type */}
      <FilterSection label="Funding Type">
        <div className="space-y-0.5">
          {fundingTypes.map((f) => (
            <Link key={f} href={buildUrl({ funding_type: f })} onClick={() => setDrawerOpen(false)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                active.funding_type === f
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}>
              <span>{f === "All" ? "Any Funding" : f}</span>
              {active.funding_type === f && <ChevronRight className="w-3 h-3 text-brand-500" />}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Degree Level */}
      <FilterSection label="Degree Level" defaultOpen={false}>
        <div className="space-y-0.5">
          {degreeLevels.map((d) => (
            <Link key={d} href={buildUrl({ degree_level: d })} onClick={() => setDrawerOpen(false)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                active.degree_level === d
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}>
              <span>{d === "All" ? "Any Level" : d}</span>
              {active.degree_level === d && <ChevronRight className="w-3 h-3 text-brand-500" />}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Clear all */}
      {hasFilters && (
        <div className="pt-3">
          <Link href="/scholarships" onClick={() => setDrawerOpen(false)}
            className="block w-full text-center py-2 text-xs font-semibold text-slate-400 hover:text-rose-500 border border-dashed border-slate-200 hover:border-rose-200 rounded-lg transition-colors">
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile sticky bar */}
      <div className="lg:hidden sticky top-[65px] z-40 -mx-4 px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-slate-200 mb-6 flex items-center justify-between">
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters {hasFilters && <span className="bg-brand-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">!</span>}
        </button>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {active.country === "All" ? "Global" : active.country} · {active.funding_type === "All" ? "Any Funding" : active.funding_type}
        </p>
      </div>

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Filters</p>
          <FilterContent />
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl lg:hidden transform transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">Filters</h2>
            <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FilterContent />
          </div>
          <div className="p-4 border-t border-slate-100">
            <button onClick={() => setDrawerOpen(false)}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
