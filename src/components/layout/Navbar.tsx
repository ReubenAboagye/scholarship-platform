"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, Search, BookOpen, Target, Bookmark, LayoutDashboard, Globe, Info, HelpCircle, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/auth/AuthModal";

const studentsMenu = [
  { icon: Search, title: "Scholarship Search", desc: "Find scholarships matched to your profile.", href: "/scholarships", requiresAuth: false },
  { icon: BookOpen, title: "Scholarship Directory", desc: "Browse all scholarships by country or field.", href: "/scholarships", requiresAuth: false },
  { icon: Target, title: "Smart Match", desc: "See your best-fit scholarships ranked by eligibility.", href: "/dashboard/match", requiresAuth: true, featureName: "Smart Match" },
  { icon: Bookmark, title: "Saved Scholarships", desc: "Access your bookmarked opportunities.", href: "/dashboard/saved", requiresAuth: true, featureName: "Saved Scholarships" },
  { icon: LayoutDashboard, title: "Application Tracker", desc: "Track every application in one dashboard.", href: "/dashboard/tracker", requiresAuth: true, featureName: "Application Tracker" },
  { icon: Globe, title: "Destinations", desc: "UK, USA, Germany, and Canada covered.", href: "/destinations", requiresAuth: false },
];

const companyMenu = [
  { icon: Info, title: "About Us", desc: "Who we are and why we built ScholarBridge.", href: "/about" },
  { icon: HelpCircle, title: "FAQ", desc: "Answers to common questions.", href: "/faq" },
  { icon: Mail, title: "Contact", desc: "Get in touch with our team.", href: "/contact" },
];

// Inline font family for the logo — avoids a CSS class dependency if the
// stylesheet hasn't loaded the Fraunces face yet.
const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Auth Modal State
  const [authModal, setAuthModal] = useState({ isOpen: false, featureName: "", redirectUrl: "" });
  const studentsRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (studentsRef.current && !studentsRef.current.contains(e.target as Node)) setStudentsOpen(false);
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, item: any) => {
    if (item.requiresAuth && !user) {
      e.preventDefault();
      setMobileOpen(false);
      setStudentsOpen(false);
      setAuthModal({
        isOpen: true,
        featureName: item.featureName || item.title,
        redirectUrl: item.href
      });
    } else {
      setMobileOpen(false);
      setStudentsOpen(false);
    }
  };

  // Lock body scroll while the mobile overlay is open; close on Escape.
  useEffect(() => {
    if (!mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <a href="/" className="flex items-baseline">
            <span className="text-2xl tracking-tight text-slate-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
              Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <div ref={studentsRef} className="relative">
              <button onClick={() => { setStudentsOpen(!studentsOpen); setCompanyOpen(false); }}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Students
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${studentsOpen ? "rotate-180" : ""}`} />
              </button>
              {studentsOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[520px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white shadow-lg animate-scale-in overflow-hidden">
                  <div className="grid grid-cols-2 p-2">
                    {studentsMenu.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={(e) => handleMenuClick(e, item)}
                        className="group flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-brand-600 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Free for students. No credit card required.</p>
                    <a
                      href={user ? "/dashboard" : "/auth/signup"}
                      onClick={() => setStudentsOpen(false)}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      {user ? "Go to dashboard" : "Get started"}
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
                <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white shadow-lg animate-scale-in overflow-hidden">
                  <div className="p-2">
                    {companyMenu.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        onClick={() => setCompanyOpen(false)}
                        className="group flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-brand-600 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700 transition-colors">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/#how-it-works" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <a href="/dashboard" className="inline-flex items-center rounded-md bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
                Go to dashboard
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</a>
                <a href="/auth/signup" className="inline-flex items-center rounded-md bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
                  Get started
                </a>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className={`md:hidden inline-flex flex-col items-center justify-center gap-[5px]
                        w-10 h-10 rounded-md border transition-all duration-200
                        ${mobileOpen
                          ? "border-slate-300 bg-slate-100 text-slate-900 hamburger-open"
                          : "border-slate-200 bg-white/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.97]"}`}
          >
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </button>
        </div>
      </div>
      </header>

      {/* Mobile menu */}
      <div className="md:hidden" aria-hidden={!mobileOpen}>
        {/* Scrim */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300
                      ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        />

        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={`fixed top-0 right-0 z-50 w-[85vw] max-w-[360px] h-[100dvh]
                      bg-white shadow-2xl flex flex-col
                      transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                      ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Header: brand + close */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
            <a href="/" onClick={() => setMobileOpen(false)} className="flex items-baseline">
              <span className="text-xl tracking-tight text-slate-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
                Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
              </span>
            </a>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 active:scale-[0.96] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User strip */}
          {user ? (
            <a
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user.email?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 shrink-0" />
            </a>
          ) : (
            <div className="px-5 py-3 border-b border-slate-100 shrink-0 bg-slate-50/60">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Not signed in
              </p>
            </div>
          )}

          {/* Scrollable link body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-6">
            <nav className="py-2 px-3">
              
              {/* Students Accordion */}
              <details className="group" open>
                <summary className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold text-slate-900 list-none cursor-pointer hover:bg-slate-50 transition-colors outline-none">
                  Students
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pl-4 pr-2 pb-2 space-y-1">
                  {studentsMenu.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      onClick={(e) => handleMenuClick(e, item)}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{item.title}</span>
                    </a>
                  ))}
                </div>
              </details>

              {/* Company Accordion */}
              <details className="group">
                <summary className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold text-slate-900 list-none cursor-pointer hover:bg-slate-50 transition-colors outline-none mt-1">
                  Company
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pl-4 pr-2 pb-2 space-y-1">
                  {companyMenu.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{item.title}</span>
                    </a>
                  ))}
                </div>
              </details>

              {/* Resources / Links */}
              <div className="mt-1">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-3 rounded-lg text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  How it works
                </a>
              </div>

            </nav>
          </div>

          {/* Footer band: primary CTAs */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 bg-white">
            {user ? (
              <a
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-md bg-brand-600 hover:bg-brand-700 py-2.5 text-center text-sm font-semibold text-white transition-colors"
              >
                Go to dashboard
              </a>
            ) : (
              <div className="flex gap-2">
                <a
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-md border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Log in
                </a>
                <a
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-md bg-brand-600 hover:bg-brand-700 py-2.5 text-center text-sm font-semibold text-white transition-colors"
                >
                  Get started
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        featureName={authModal.featureName}
        redirectUrl={authModal.redirectUrl}
      />
    </>
  );
}
