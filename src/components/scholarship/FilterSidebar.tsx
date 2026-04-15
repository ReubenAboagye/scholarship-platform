"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { countryFlagUrl } from "@/lib/utils";

interface FilterSidebarProps {
  active: {
    country: string;
    funding_type: string;
    degree_level: string;
    search: string;
  };
  countries: string[];
  fundingTypes: string[];
  degreeLevels: string[];
  buildUrl: (overrides: any) => string;
}

export default function FilterSidebar({ active, countries, fundingTypes, degreeLevels, buildUrl }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Search</label>
        <form method="GET" action="/scholarships">
          {active.country      !== "All" && <input type="hidden" name="country"      value={active.country} />}
          {active.funding_type !== "All" && <input type="hidden" name="funding_type" value={active.funding_type} />}
          {active.degree_level !== "All" && <input type="hidden" name="degree_level" value={active.degree_level} />}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input name="search" defaultValue={active.search} placeholder="Scholarship name…"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400" />
          </div>
        </form>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Country</label>
        <div className="grid grid-cols-1 gap-1">
          {countries.map((c) => (
            <Link key={c} href={buildUrl({ country: c })} onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group ${
                active.country === c ? "bg-brand-600 text-white shadow-brand-glow font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}>
              <div className="flex items-center gap-2.5">
                {c !== "All" && countryFlagUrl(c) && <img src={countryFlagUrl(c)!} alt={c} className="w-5 h-auto rounded-sm shadow-sm" />}
                {c}
              </div>
              {active.country !== c && <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Funding Type</label>
        <div className="grid grid-cols-1 gap-1">
          {fundingTypes.map((f) => (
            <Link key={f} href={buildUrl({ funding_type: f })} onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group ${
                active.funding_type === f ? "bg-brand-600 text-white shadow-brand-glow font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}>
              {f}
              {active.funding_type !== f && <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-3">Degree Level</label>
        <div className="grid grid-cols-1 gap-1">
          {degreeLevels.map((d) => (
            <Link key={d} href={buildUrl({ degree_level: d })} onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group ${
                active.degree_level === d ? "bg-brand-600 text-white shadow-brand-glow font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}>
              {d}
              {active.degree_level !== d && <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />}
            </Link>
          ))}
        </div>
      </div>

      {Object.values(active).some(v => v !== "All" && v !== "") && (
        <Link href="/scholarships" onClick={() => setIsOpen(false)}
          className="block w-full text-center py-2.5 text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors border border-dashed border-slate-200 rounded-xl hover:border-brand-200">
          Clear all filters
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="lg:hidden sticky top-[65px] z-40 -mx-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 mb-6 flex items-center justify-between">
        <button onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter Results
        </button>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          {active.country === "All" ? "Global" : active.country} · {active.funding_type === "All" ? "Any Funding" : active.funding_type}
        </p>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 animate-fade-in">
        <div className="sticky top-24">
          <FilterContent />
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden animate-fade-in" 
          onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[70] w-[280px] bg-white shadow-2xl lg:hidden transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-lg">Filters</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <FilterContent />
          </div>
          <div className="p-6 border-t border-slate-100">
            <button onClick={() => setIsOpen(false)}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow-brand-glow">
              Show Results
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
