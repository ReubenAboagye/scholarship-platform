"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const COUNTRY_META = [
  { flag: "gb", name: "United Kingdom", code: "UK" },
  { flag: "us", name: "United States", code: "USA" },
  { flag: "de", name: "Germany", code: "Germany" },
  { flag: "ca", name: "Canada", code: "Canada" },
] as const;

interface Country {
  code: string;
  count: number;
  top: string;
  name: string;
  flag: string;
}

interface EnhancedDestinationsProps {
  countries: Country[];
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export default function EnhancedDestinations({ countries }: EnhancedDestinationsProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <section id="countries" className="relative bg-white border-b border-zinc-200/70 overflow-hidden">
      {/* Sci-fi background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImhleCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMzAgMEw2MCAxNkw2MCA0NEwzMCA2MEwwIDQ0TDAgMTZMMzAgMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwgMTMwLCAyNDYsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNleCkiLz48L3N2Zz4=')]" />
      </div>

      {/* Animated scanning line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent animate-scan-line" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
            Destinations
          </p>
          <h2 className="text-3xl lg:text-4xl text-zinc-900 mb-3" style={{ fontFamily: 'Fraunces, Georgia, ui-serif, serif' }}>
            Four destinations, curated
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            Rather than list 10,000 scholarships we cannot verify, we cover four destinations deeply. Every listing is traceable to an official source.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {countries.map((country, index) => (
            <a
              key={country.code}
              href={`/scholarships?country=${country.code}`}
              className="group relative block bg-white border border-zinc-200 rounded-lg p-6 hover:border-brand-400 hover:shadow-2xl transition-all duration-300 overflow-hidden"
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
            >
              {/* Hover glow effect */}
              {hoveredCountry === country.code && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-blue-50/50 animate-fade-in" />
              )}

              {/* Tech corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-brand-300/0 group-hover:border-brand-300/50 transition-all duration-300" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-brand-300/0 group-hover:border-brand-300/50 transition-all duration-300" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-brand-300/0 group-hover:border-brand-300/50 transition-all duration-300" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-brand-300/0 group-hover:border-brand-300/50 transition-all duration-300" />

              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-sm bg-brand-400/0 group-hover:bg-brand-400/20 transition-colors" />
                    <img 
                      src={flagUrl(country.flag)} 
                      alt="" 
                      className="relative w-10 h-auto rounded-sm shadow-sm group-hover:scale-110 transition-transform duration-300" 
                      aria-hidden 
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900 leading-tight group-hover:text-brand-700 transition-colors">
                      {country.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {country.count} scholarships
                    </p>
                  </div>
                </div>

                <p className="text-[13px] text-zinc-600 leading-relaxed mb-5 line-clamp-2">
                  {country.top}
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 group-hover:gap-2.5 transition-all">
                  Browse
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Animated data indicator */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* Scanning line effect on card */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400/30 to-transparent group-hover:animate-card-scan" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
