"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Search, BookOpen, Cpu, Bookmark, LayoutDashboard, Globe, Info, HelpCircle, Mail } from "lucide-react";

const studentsMenu = [
  { icon: Search, title: "Scholarship Search", desc: "Find scholarships matched to your profile.", href: "/auth/signup" },
  { icon: BookOpen, title: "Scholarship Directory", desc: "Browse all scholarships by country or field.", href: "/scholarships" },
  { icon: Cpu, title: "AI Matching", desc: "Let our AI rank opportunities for you.", href: "/dashboard/match" },
  { icon: Bookmark, title: "Saved Scholarships", desc: "Access your bookmarked opportunities.", href: "/dashboard/saved" },
  { icon: LayoutDashboard, title: "Application Tracker", desc: "Track every application in one dashboard.", href: "/dashboard/tracker" },
  { icon: Globe, title: "Destinations", desc: "UK, USA, Germany, and Canada covered.", href: "/destinations" },
];

const companyMenu = [
  { icon: Info, title: "About Us", desc: "Who we are and why we built ScholarBridge AI.", href: "/about" },
  { icon: HelpCircle, title: "FAQ", desc: "Answers to common questions.", href: "/faq" },
  { icon: Mail, title: "Contact", desc: "Get in touch with our team.", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const studentsRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (studentsRef.current && !studentsRef.current.contains(e.target as Node)) setStudentsOpen(false);
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tight text-slate-900">Scholar</span>
            <span className="text-xl font-black tracking-tight text-brand-600">Match</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <div ref={studentsRef} className="relative">
              <button onClick={() => { setStudentsOpen(!studentsOpen); setCompanyOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Students
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${studentsOpen ? "rotate-180" : ""}`} />
              </button>
              {studentsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[540px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-elevated animate-scale-in">
                  <div className="grid grid-cols-2 gap-px bg-slate-100 p-px overflow-hidden rounded-t-2xl">
                    {studentsMenu.map((item) => (
                      <a key={item.title} href={item.href} onClick={() => setStudentsOpen(false)}
                        className="flex items-start gap-3 bg-white p-4 hover:bg-slate-50 transition-colors group">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 transition-colors">
                          <item.icon className="h-4.5 w-4.5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/50 rounded-b-2xl">
                    <p className="text-xs text-slate-500 font-medium">Free for all students · No credit card needed</p>
                    <a href="/auth/signup" onClick={() => setStudentsOpen(false)}
                      className="bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white transition-all hover:shadow-brand-glow rounded-xl">
                      Get Started Free
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div ref={companyRef} className="relative">
              <button onClick={() => { setCompanyOpen(!companyOpen); setStudentsOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Company
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${companyOpen ? "rotate-180" : ""}`} />
              </button>
              {companyOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white shadow-elevated animate-scale-in overflow-hidden">
                  {companyMenu.map((item) => (
                    <a key={item.title} href={item.href} onClick={() => setCompanyOpen(false)}
                      className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-brand-50 transition-colors">
                        <item.icon className="h-4 w-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <a href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Log In</a>
            <a href="/auth/signup" className="group relative overflow-hidden bg-brand-600 hover:bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:shadow-brand-glow rounded-xl">
              <span className="relative z-10">Sign Up Free</span>
            </a>
          </div>

          <button className={`flex flex-col items-center justify-center w-10 h-10 gap-1.5 text-slate-600 hover:bg-slate-100 transition-colors md:hidden ${mobileOpen ? "hamburger-open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </button>
        </div>
      </div>

      <div className={`mobile-menu-container border-t border-slate-200 bg-white md:hidden ${mobileOpen ? "is-open" : ""}`}>
        <div className="mobile-menu-inner">
          <div className="px-4 py-3 space-y-1">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 animate-stagger-in" style={{ animationDelay: '0.05s' }}>Students</p>
            {studentsMenu.map((item, idx) => (
              <a key={item.title} href={item.href}
                className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors animate-stagger-in"
                style={{ animationDelay: `${(idx + 2) * 0.05}s` }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <item.icon className="h-4 w-4 text-brand-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}

            <p className="px-2 py-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 animate-stagger-in"
              style={{ animationDelay: `${(studentsMenu.length + 2) * 0.05}s` }}>
              Company
            </p>
            {companyMenu.map((item, idx) => (
              <a key={item.title} href={item.href}
                className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl transition-colors animate-stagger-in"
                style={{ animationDelay: `${(studentsMenu.length + idx + 3) * 0.05}s` }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <item.icon className="h-4 w-4 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}

            <div className="pt-4 border-t border-slate-100 space-y-3 animate-stagger-in"
              style={{ animationDelay: `${(studentsMenu.length + companyMenu.length + 3) * 0.05}s` }}>
              <a href="/auth/login" className="block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Log In</a>
              <a href="/auth/signup" className="block w-full rounded-xl bg-brand-600 hover:bg-brand-700 py-3 text-center text-sm font-bold text-white transition-all shadow-sm">Sign Up Free</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
