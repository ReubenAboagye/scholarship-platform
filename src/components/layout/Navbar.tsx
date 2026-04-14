"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, Search, BookOpen, Cpu, Bookmark, LayoutDashboard, Globe, Info, HelpCircle, Mail } from "lucide-react";

const studentsMenu = [
  { icon: Search,          title: "Scholarship Search",    desc: "Find scholarships matched to your profile.",   href: "/auth/signup" },
  { icon: BookOpen,        title: "Scholarship Directory", desc: "Browse all scholarships by country or field.", href: "/scholarships" },
  { icon: Cpu,             title: "AI Matching",           desc: "Let our AI rank opportunities for you.",       href: "/dashboard/match" },
  { icon: Bookmark,        title: "Saved Scholarships",    desc: "Access your bookmarked opportunities.",        href: "/dashboard/saved" },
  { icon: LayoutDashboard, title: "Application Tracker",   desc: "Track every application in one dashboard.",   href: "/dashboard/tracker" },
  { icon: Globe,           title: "Destinations",          desc: "UK, USA, Germany, and Canada covered.",        href: "/#countries" },
];

const companyMenu = [
  { icon: Info,       title: "About Us", desc: "Who we are and why we built ScholarMatch.", href: "/about" },
  { icon: HelpCircle, title: "FAQ",      desc: "Answers to common questions.",              href: "/faq" },
  { icon: Mail,       title: "Contact",  desc: "Get in touch with our team.",               href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [companyOpen,  setCompanyOpen]  = useState(false);
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tight text-slate-900">Scholar</span>
            <span className="text-2xl font-black tracking-tight text-blue-600">Match</span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            <div ref={studentsRef} className="relative">
              <button onClick={() => { setStudentsOpen(!studentsOpen); setCompanyOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">
                Students
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${studentsOpen ? "rotate-180" : ""}`} />
              </button>
              {studentsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="grid grid-cols-2 gap-1">
                    {studentsMenu.map((item) => (
                      <a key={item.title} href={item.href} onClick={() => setStudentsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors mt-0.5">
                          <item.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between px-1">
                    <p className="text-xs text-slate-500">Free for all students · No credit card needed</p>
                    <a href="/auth/signup" onClick={() => setStudentsOpen(false)}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                      Get Started Free →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div ref={companyRef} className="relative">
              <button onClick={() => { setCompanyOpen(!companyOpen); setStudentsOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">
                Company
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${companyOpen ? "rotate-180" : ""}`} />
              </button>
              {companyOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50">
                  {companyMenu.map((item) => (
                    <a key={item.title} href={item.href} onClick={() => setCompanyOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors mt-0.5">
                        <item.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="/auth/login"  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Student Log In</a>
            <a href="/auth/signup" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Student Sign Up</a>
          </div>

          <button className="md:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2">Students</p>
            {studentsMenu.map((item) => (
              <a key={item.title} href={item.href}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2 mt-4">Company</p>
            {companyMenu.map((item) => (
              <a key={item.title} href={item.href}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.title}</span>
              </a>
            ))}
            <div className="border-t border-slate-100 mt-3 pt-3 space-y-1">
              <a href="/#how-it-works" className="block px-2 py-2 text-sm font-medium text-slate-700">How It Works</a>
            </div>
            <div className="border-t border-slate-100 mt-3 pt-3 flex flex-col gap-2">
              <a href="/auth/login"  className="block py-2.5 text-sm font-medium text-center text-slate-700 border border-slate-200 rounded-lg">Student Log In</a>
              <a href="/auth/signup" className="block py-2.5 text-sm font-bold text-center text-white bg-blue-600 rounded-lg">Student Sign Up</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
