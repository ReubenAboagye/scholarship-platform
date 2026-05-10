"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const local: Record<string, string> = {
    gb: "/images/countries/uk-flag.jpg",
    us: "/images/countries/usa-flag.jpg",
    de: "/images/countries/germany-flag.jpg",
    ca: "/images/countries/canada-flag.jpg",
  };
  return local[code.toLowerCase()] ?? `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export default function EnhancedDestinations({ countries }: EnhancedDestinationsProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.offsetWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

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

        <div className="relative">
          {/* Left arrow (mobile only) */}
          <button
            onClick={() => scrollBy("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 sm:hidden bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-full p-2 shadow-lg hover:bg-white active:scale-95 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-5 text-zinc-700" />
          </button>

          {/* Right arrow (mobile only) */}
          <button
            onClick={() => scrollBy("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 sm:hidden bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-full p-2 shadow-lg hover:bg-white active:scale-95 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-5 text-zinc-700" />
          </button>

          <div
            ref={scrollRef}
            className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          {countries.map((country) => (
            <a
              key={country.code}
              href={`/scholarships?country=${country.code}`}
              className="group relative block flex-shrink-0 w-[72vw] sm:w-auto aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 hover:border-brand-400 hover:shadow-2xl transition-all duration-300 snap-center"
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
            >
              <img
                src={flagUrl(country.flag)}
                alt={country.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover overlay */}
              {hoveredCountry === country.code && (
                <div className="absolute inset-0 bg-brand-900/10 animate-fade-in" />
              )}

              {/* Tech corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-white/0 group-hover:border-white/60 transition-all duration-300" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-white/0 group-hover:border-white/60 transition-all duration-300" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-white/0 group-hover:border-white/60 transition-all duration-300" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-white/0 group-hover:border-white/60 transition-all duration-300" />

              {/* Scanning line effect on card */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent group-hover:animate-card-scan" />
              </div>
            </a>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
