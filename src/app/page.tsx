"use client";

import Image from "next/image";
import { Check, ArrowRight, ChevronDown, Shield, Lock, Globe, Compass } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const trustStrip = [
  { icon: Shield,  title: "Verified sources",      desc: "Every scholarship links directly to the official application page — no middlemen." },
  { icon: Lock,    title: "No email spam",         desc: "We don't sell, rent, or share your email. Not to partners, not to advertisers." },
  { icon: Globe,   title: "Four countries, curated", desc: "Hand-picked opportunities across the UK, USA, Germany, and Canada." },
  { icon: Compass, title: "Matched to your profile", desc: "Ranked by fit — your best-match scholarships surface first." },
];

const FLAG_URL = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const countries = [
  { flag: "gb", name: "United Kingdom", code: "UK",      count: 5, top: "Chevening · Gates Cambridge · Rhodes" },
  { flag: "us", name: "United States",  code: "USA",     count: 5, top: "Fulbright · Mastercard Foundation" },
  { flag: "de", name: "Germany",        code: "Germany", count: 5, top: "DAAD · Heinrich Böll · Konrad-Adenauer" },
  { flag: "ca", name: "Canada",         code: "Canada",  count: 5, top: "Vanier · Lester B. Pearson · Trudeau" },
];

type Featured = {
  name: string; country: string; flag: string; funding: string;
  amount: string; degree: string; slug: string;
  deadline: string; effort: string;
};

const featured: Featured[] = [
  { name: "Chevening Scholarship",         country: "United Kingdom", flag: "gb", funding: "Full Funding", amount: "Tuition + £1,173/month + flights",       degree: "Masters",          slug: "chevening-scholarship",            deadline: "Nov 2026",   effort: "Essays · 2 referees" },
  { name: "Fulbright Foreign Student",     country: "United States",  flag: "us", funding: "Full Funding", amount: "Full tuition + stipend + flights",      degree: "Masters / PhD",    slug: "fulbright-foreign-student-program",deadline: "Country-specific", effort: "Essays · 3 referees" },
  { name: "DAAD Scholarship",              country: "Germany",        flag: "de", funding: "Full Funding", amount: "€934–1,200/month + health insurance",    degree: "Masters / PhD",    slug: "daad-scholarship",                 deadline: "Oct 2026",   effort: "Proposal · 2 referees" },
  { name: "Vanier Canada Graduate",        country: "Canada",         flag: "ca", funding: "Full Funding", amount: "CAD 50,000/year × 3 years",              degree: "PhD",              slug: "vanier-canada-graduate-scholarship", deadline: "Nov 2026", effort: "Research proposal"     },
  { name: "Gates Cambridge Scholarship",   country: "United Kingdom", flag: "gb", funding: "Full Funding", amount: "Full tuition + £21,000/year",            degree: "Masters / PhD",    slug: "gates-cambridge-scholarship",      deadline: "Dec 2026",   effort: "Essays · 2 referees"   },
  { name: "Lester B. Pearson",             country: "Canada",         flag: "ca", funding: "Full Funding", amount: "Full 4-year undergraduate costs",        degree: "Undergraduate",    slug: "lester-b-pearson-scholarship",     deadline: "Nov 2026",   effort: "Nomination required"   },
];

const steps = [
  { n: "01", title: "Create a free profile",      body: "Tell us your field of study, degree level, and destination country. Takes about two minutes." },
  { n: "02", title: "See your matches",           body: "We compare your profile against real eligibility criteria, not keywords — no false positives." },
  { n: "03", title: "Review the details",         body: "Match fit, funding, requirements, and deadlines in one place. Every listing links to the source." },
  { n: "04", title: "Apply and track",            body: "Save, apply, and monitor every application from interested through to an offer." },
];

const faqs = [
  { q: "What is ScholarBridge?",                 a: "ScholarBridge is a free platform that helps students find scholarships for study in the UK, USA, Germany, and Canada. Every listing is verified and links to the official application page." },
  { q: "Is it really free?",                     a: "Yes — there's no subscription, no trial, no credit card. The platform is free for students, and we make no money by selling your data." },
  { q: "How does the matching work?",            a: "We compare your academic profile — degree level, country of study, field, GPA, and more — against each scholarship's actual eligibility rules. You see the strongest fits first, with the reasoning shown." },
  { q: "Are the scholarships legitimate?",       a: "Every scholarship in the database is manually curated, verified, and linked directly to the official application page. We never list pay-to-apply awards or anything we can't trace to a real funder." },
  { q: "Do I need an account to browse?",        a: "No. You can browse the full directory without signing up. An account is only required to run personalised matches, save favourites, and track your applications." },
  { q: "Which countries are covered?",           a: "The United Kingdom, United States, Germany, and Canada. We deliberately focus on these four so we can keep coverage deep and verified." },
];

/* -------------------------------------------------------------------------- */
/*  Shared inline font families — use inline style to guarantee Fraunces loads */
/*  even on first paint before the stylesheet has been parsed.                */
/* -------------------------------------------------------------------------- */

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────
          HERO
          Flat off-white background, editorial serif headline, single-color
          emphasis, two clear CTAs, credibility photo on the right with one
          quiet overlay card. No animated gradient blobs.
          ────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-paper border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">

            {/* Left: headline + copy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-6">
                For students · Free, always
              </p>

              <h1
                className="text-[44px] sm:text-5xl lg:text-[64px] text-slate-900 mb-6"
                style={SERIF}
              >
                Scholarships for the UK,<br className="hidden sm:block" />
                USA, Germany, and Canada<span className="text-brand-600">.</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                Twenty fully-funded opportunities, every one verified against its official source.
                Tell us about your studies and we'll surface the ones you actually qualify for — in about two minutes.
              </p>

              <ul className="space-y-2.5 mb-10 max-w-md">
                {[
                  "Verified scholarships with direct application links",
                  "Matched on eligibility rules, not keyword guesswork",
                  "No email spam — ever. We don't sell your data.",
                  "Free for students, no credit card required",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                    <span className="mt-1 inline-flex w-4 h-4 items-center justify-center rounded-full bg-brand-600/10 flex-shrink-0">
                      <Check className="w-3 h-3 text-brand-600" strokeWidth={3} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-card-hover"
                >
                  Find my scholarships
                </a>
                <a
                  href="/scholarships"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md px-6 py-3 bg-white border border-slate-300 text-slate-800 font-semibold text-sm hover:border-slate-400 transition-colors"
                >
                  Browse the directory
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right: photography + one overlay */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg border border-slate-200 shadow-card-hover">
                <Image
                  src="/images/marketing/students-collab.jpg"
                  alt="Students studying together"
                  width={1600}
                  height={1067}
                  className="h-[420px] lg:h-[520px] w-full object-cover"
                  priority
                />
              </div>

              {/* Single, calm overlay — not two stacked badges */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 w-72 bg-white border border-slate-200 shadow-lg rounded-lg p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
                  Coverage
                </p>
                <div className="flex -space-x-2 mb-3">
                  {["gb", "us", "de", "ca"].map((code) => (
                    <div
                      key={code}
                      className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-slate-100"
                      aria-hidden
                    >
                      <img src={FLAG_URL(code)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-800">
                  <span className="font-semibold text-slate-900" style={SERIF}>20 scholarships</span>{" "}
                  across four destinations, each one linked to its official source.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          TRUST STRIP
          Four consistent icon pairs with plainspoken copy. No purple tiles —
          just aligned start, hairline separator above.
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {trustStrip.map((b) => (
              <div key={b.title} className="flex gap-3 items-start">
                <b.icon className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{b.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          FEATURED SCHOLARSHIPS
          Tighter cards: 1px border, 8px radius, amount + deadline pre-
          attentive. Each card now has deadline and effort chips — the two
          fields students most want at a glance.
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-paper border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
                Featured
              </p>
              <h2 className="text-3xl lg:text-4xl text-slate-900" style={SERIF}>
                Fully-funded opportunities
              </h2>
              <p className="text-slate-500 mt-2">
                Hand-picked flagship scholarships across all four destinations.
              </p>
            </div>
            <a
              href="/scholarships"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors whitespace-nowrap"
            >
              See the full directory
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((s) => (
              <a
                key={s.slug}
                href={`/scholarships/${s.slug}`}
                className="group block bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-card-hover transition-all"
              >
                {/* Header: flag + funding pill */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <img src={FLAG_URL(s.flag)} alt="" className="w-6 h-auto rounded-sm shadow-sm" aria-hidden />
                    <span className="text-xs font-medium text-slate-500">{s.country}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    {s.funding}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="text-xl text-slate-900 mb-2 group-hover:text-brand-700 transition-colors leading-tight"
                  style={SERIF}
                >
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500 mb-5">{s.degree}</p>

                {/* Amount — primary attention anchor */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">
                    Funding
                  </p>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {s.amount}
                  </p>
                </div>

                {/* Chips: deadline + effort */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden />
                    Deadline: {s.deadline}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                    {s.effort}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          COUNTRIES — flagship names up front, count tertiary.
          ────────────────────────────────────────────────────────────────── */}
      <section id="countries" className="bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
              Destinations
            </p>
            <h2 className="text-3xl lg:text-4xl text-slate-900 mb-3" style={SERIF}>
              Four destinations, curated
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Rather than list 10,000 scholarships we can't verify, we cover four destinations deeply. Every listing is traceable to an official source.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {countries.map((c) => (
              <a
                key={c.code}
                href={`/scholarships?country=${c.code}`}
                className="group block bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={FLAG_URL(c.flag)} alt="" className="w-10 h-auto rounded-sm shadow-sm" aria-hidden />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.count} scholarships</p>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5 line-clamp-2">
                  {c.top}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 group-hover:gap-2.5 transition-all">
                  Browse
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          HOW IT WORKS
          Plain grid, no scroll-in animations (fixes the phantom-empty
          section on first scroll). Numbered with the serif, body in sans.
          ────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-paper border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
              How it works
            </p>
            <h2 className="text-3xl lg:text-4xl text-slate-900 mb-3" style={SERIF}>
              From sign-up to ranked matches in two minutes
            </h2>
            <p className="text-slate-500 leading-relaxed">
              A straightforward four-step flow — no quizzes, no upsells, no surveys to unlock your results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {/* Subtle dividing line on desktop between steps */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-4 left-[calc(100%-12px)] w-[calc(100%-24px)] h-px bg-slate-200" aria-hidden />
                )}
                <p
                  className="text-brand-600 text-2xl leading-none mb-4"
                  style={{ ...SERIF, fontStyle: "italic", fontWeight: 500 }}
                >
                  {s.n}
                </p>
                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          FAQ
          Two-column details/summary. No animation, clean hairline dividers.
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
              Questions
            </p>
            <h2 className="text-3xl lg:text-4xl text-slate-900" style={SERIF}>
              Frequently asked
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group border-b border-slate-200 py-5 cursor-pointer"
              >
                <summary className="flex items-center justify-between text-slate-900 font-semibold text-[15px] list-none">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-8">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          CLOSING CTA
          Dark navy band, serif headline, quieter copy than before (no
          "thousands of students miss…" melodrama).
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <h2
            className="text-4xl lg:text-5xl text-white mb-5 leading-tight"
            style={SERIF}
          >
            Most students apply to three scholarships.<br className="hidden sm:block" />
            <span className="text-brand-300" style={{ fontStyle: "italic", fontWeight: 400 }}>
              You can find ten you qualify for.
            </span>
          </h2>
          <p className="text-slate-400 text-base lg:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Free for students. No credit card. No email spam. Just the scholarships you actually qualify for.
          </p>
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 transition-colors"
          >
            Find my scholarships
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-6 text-slate-500 text-xs font-medium uppercase tracking-[0.18em]">
            Takes about two minutes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
