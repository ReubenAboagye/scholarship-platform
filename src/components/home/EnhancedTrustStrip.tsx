"use client";

import { Shield, Lock, Globe, Award } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const trustStrip = [
  {
    icon: Shield,
    title: "Government-verified sources",
    desc: "Every scholarship links directly to official embassy and university portals.",
  },
  {
    icon: Lock,
    title: "Privacy guaranteed",
    desc: "Your data is never sold, shared, or used for marketing purposes.",
  },
  {
    icon: Globe,
    title: "Four nations, full coverage",
    desc: "Comprehensive funding opportunities across the UK, USA, Germany, and Canada.",
  },
  {
    icon: Award,
    title: "Eligibility-matched",
    desc: "AI-powered ranking based on actual eligibility criteria, not keywords.",
  },
] as const;

export default function EnhancedTrustStrip() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative bg-white border-b border-zinc-200/70 overflow-hidden">
      {/* Sci-fi background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
      </div>

      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-brand-200 animate-pulse" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-brand-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-brand-200 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-brand-200 animate-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustStrip.map((block, index) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                className="relative group flex gap-3 items-start p-4 rounded-lg hover:bg-zinc-50 transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover glow effect */}
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-brand-50/50 rounded-lg animate-fade-in" />
                )}

                {/* Icon container with sci-fi effect */}
                <div className="relative size-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-lg border border-brand-200 group-hover:border-brand-400 transition-colors" />
                  <div className="absolute inset-0 rounded-lg bg-brand-400/0 group-hover:bg-brand-400/10 transition-colors" />
                  <Icon className="size-5 text-brand-600 group-hover:text-brand-700 transition-colors" strokeWidth={1.75} />
                  
                  {/* Animated ring around icon */}
                  <div className="absolute -inset-2 rounded-full border border-brand-300/0 group-hover:border-brand-300/50 transition-all duration-500 animate-spin-slow" />
                </div>

                <div className="relative">
                  <p className="text-sm font-semibold text-zinc-900 mb-1 group-hover:text-brand-700 transition-colors">
                    {block.title}
                  </p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">
                    {block.desc}
                  </p>
                </div>

                {/* Tech accent dots */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
