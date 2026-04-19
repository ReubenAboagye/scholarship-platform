"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Globe, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function CountrySelect({ value, onChange, placeholder = "Select country...", className, icon }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter countries based on search
  const filtered = useMemo(() => {
    if (!search) return COUNTRIES;
    const term = search.toLowerCase();
    return COUNTRIES.filter(c => c.toLowerCase().includes(term));
  }, [search]);

  // Reset search when opening/closing
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-[40px] flex items-center justify-between px-3.5 py-2 rounded-lg border bg-white text-sm text-slate-800 border-slate-200 hover:border-slate-300 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon || <Globe className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-brand-500 transition-colors" />}
          <span className={cn("truncate font-medium", !value && "text-slate-400 font-normal")}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0", open && "rotate-180")} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[280px] animate-fade-in translate-y-0">
          {/* Search container */}
          <div className="p-2 border-b border-slate-50 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
                className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 border border-slate-100 rounded-lg outline-none focus:bg-white focus:border-brand-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List container */}
          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-slate-400 font-medium italic">No results for &quot;{search}&quot;</p>
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left text-xs sm:text-sm",
                    value === country 
                      ? "bg-brand-50 text-brand-700 font-bold" 
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
