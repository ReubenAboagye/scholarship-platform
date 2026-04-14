"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, Search, BookOpen, Cpu, Bookmark, LayoutDashboard, Globe, Info, HelpCircle, Mail } from "lucide-react";

const studentsMenu = [
  { icon: Search,          title: "Scholarship Search",    desc: "Find scholarships matched to your profile.", href: "/auth/signup" },
  { icon: BookOpen,        title: "Scholarship Directory", desc: "Browse all scholarships by country or field.", href: "/scholarships" },
  { icon: Cpu,             title: "AI Matching",           desc: "Let our AI rank opportunities for you.", href: "/dashboard/match" },
  { icon: Bookmark,        title: "Saved Scholarships",    desc: "Access your bookmarked opportunities.", href: "/dashboard/saved" },
  { icon: LayoutDashboard, title: "Application Tracker",   desc: "Track every application in one dashboard.", href: "/dashboard/tracker" },
  { icon: Globe,           title: "Destinations",          desc: "UK, USA, Germany, and Canada covered.", href: "/#countries" },
];

const companyMenu = [
  { icon: Info,       title: "About Us", desc: "Who we are and why we built ScholarMatch.", href: "/about" },
  { icon: HelpCircle, title: "FAQ",      desc: "Answers to common questions.", href: "/faq" },
  { icon: Mail,       title: "Contact",  desc: "Get in touch with our team.", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [companyOpen, setCompanyOpen]   = useState(false);
  const studentsRef = useRef<HTMLDivElement>(null);
  const companyRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (studentsRef.current && !studentsRef.current.contains(e.target as Node)) setStudentsOpen(false);
      if (companyRef.current  && !companyRef.current.contains(e.target as Node))  setCompanyOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          <a href="/" className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tight text-slate-900">Scholar</span>
            <span className="text-xl font-black tracking-tight text-blue-600">Match</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <div ref={studentsRef} className="relative">
              <button onClick={() => { setStudentsOpen(!studentsOpen); setCompanyOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Students
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${studentsOpen ? "rotate-180" : ""}`} />
              </button>
              {studentsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[540px] -translate-x-1/2 border border-slate-200 bg-white shadow-lg">
                  <div className="grid grid-cols-2 gap-px bg-slate-100 p-px">
                    {studentsMenu.map((item) => (
                      <a key={item.title} href={item.href} onClick={() => setStudentsOpen(false)}
                        className="flex items-start gap-3 bg-white p-4 hover:bg-slate-50 transition-colors group">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center bg-blue-50">
                          <item.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-xs text-slate-500">Free for all students · No credit card needed</p>
                    <a href="/auth/signup" onClick={() => setStudentsOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition-colors">
                      Get Started Free →
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
                <div className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 border border-slate-200 bg-white shadow-lg">
                  {companyMenu.map((item) => (
                    <a key={item.title} href={item.href} onClick={() => setCompanyOpen(false)}
                      className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center bg-slate-100">
                        <item.icon className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log In</a>
            <a href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors">Sign Up Free</a>
          </div>

          <button className="p-2 text-slate-600 hover:bg-slate-100 transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="px-4 py-3 space-y-1">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Students</p>
            {studentsMenu.map((item) => (
              <a key={item.title} href={item.href} className="flex items-center gap-3 px-2 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-blue-50">
                  <item.icon className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}
            <p className="px-2 py-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Company</p>
            {companyMenu.map((item) => (
              <a key={item.title} href={item.href} className="flex items-center gap-3 px-2 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-slate-100">
                  <item.icon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <a href="/auth/login" className="block border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Log In</a>
              <a href="/auth/signup" className="block bg-blue-600 hover:bg-blue-700 py-2.5 text-center text-sm font-bold text-white transition-colors">Sign Up Free</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
