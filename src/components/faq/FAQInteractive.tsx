"use client";

import { useState } from "react";
import FadeIn from "@/components/ui/FadeIn";
import FAQAccordionItem from "@/components/faq/FAQAccordionItem";
import { ArrowRight, MessageCircle } from "lucide-react";

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

type FAQItem = { q: string; a: string };
type FAQCategory = { category: string; items: FAQItem[] };

export default function FAQInteractive({ faqs }: { faqs: FAQCategory[] }) {
  const [query, setQuery] = useState("");

  const filteredFaqs = faqs
    .map((section) => ({
      category: section.category,
      items: section.items.filter((item) =>
        item.q.toLowerCase().includes(query.toLowerCase()) ||
        item.a.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────
          HERO (Interactive Premium Layout)
          ────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-50 pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50" />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-brand-700 text-xs font-semibold uppercase tracking-[0.2em] mb-8">
                Help & Documentation
              </div>
              <h1 className="text-[44px] sm:text-[52px] lg:text-[64px] text-slate-900 mb-6 leading-[1.05] tracking-tight" style={SERIF}>
                Frequently Asked <span className="italic text-brand-600">Questions</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-light mb-12">
                Everything you need to know about how ScholarBridge AI matches you with life-changing, fully-funded opportunities.
              </p>
              
              <div className="max-w-xl mx-auto relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentation (e.g., 'matching accuracy')"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-lg shadow-slate-200/50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-700 placeholder-slate-400 transition-all font-light"
                />
                {!query && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="hidden sm:inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-400">
                      Ctrl + K
                    </span>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          FAQ LIST (Editorial Detail/Summary structure)
          ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-24">
            
            {/* Left Rail Navigation / Info */}
            <div className="hidden lg:block relative">
              <div className="sticky top-32">
                <FadeIn direction="right">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-6">
                    Categories
                  </p>
                  <ul className="space-y-4">
                    {faqs.map((section) => {
                      const isActive = filteredFaqs.some(f => f.category === section.category);
                      return (
                        <li key={section.category}>
                          <a 
                            href={`#${section.category.toLowerCase().replace(/\s+/g, "-")}`}
                            className={`text-sm font-medium transition-colors ${isActive ? "text-slate-500 hover:text-brand-600" : "text-slate-300 pointer-events-none"}`}
                          >
                            {section.category}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <MessageCircle className="w-5 h-5 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-800 font-semibold mb-2">Still need help?</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Our support team monitors inquiries during UK business hours.
                    </p>
                    <a href="/contact" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                      Contact us <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </FadeIn>
              </div>
            </div>

            {/* Right Main FAQ Content */}
            <div className="space-y-16 lg:space-y-24 min-h-[400px]">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((section, secIdx) => (
                  <FadeIn key={section.category} delay={secIdx * 0.1}>
                    <div 
                      id={section.category.toLowerCase().replace(/\s+/g, "-")}
                      className="scroll-mt-32"
                    >
                      <h2 className="text-2xl text-slate-900 mb-6 border-b border-slate-200 pb-4" style={SERIF}>
                        {section.category}
                      </h2>
                      
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <FAQAccordionItem 
                            key={item.q} 
                            question={item.q} 
                            answer={item.a} 
                          />
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                ))
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-lg text-slate-500 font-light mb-2">No results found for &quot;{query}&quot;</p>
                  <p className="text-sm text-slate-400">Try adjusting your search terms.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
