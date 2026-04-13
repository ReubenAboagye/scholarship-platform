import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const trustPoints = [
  "Scholarships for every type of student",
  "100% free to use",
  "Verified & curated opportunities",
  "AI-matched to your profile",
];

const stats = [
  { value: "20+",    label: "Scholarships" },
  { value: "4",      label: "Countries" },
  { value: "100%",   label: "Free" },
  { value: "AI",     label: "Matched" },
];

const countries = [
  { flag: "🇬🇧", name: "United Kingdom", code: "UK",      scholarships: 5, examples: "Chevening, Gates Cambridge, Rhodes" },
  { flag: "🇺🇸", name: "United States",  code: "USA",     scholarships: 5, examples: "Fulbright, Mastercard Foundation" },
  { flag: "🇩🇪", name: "Germany",        code: "Germany", scholarships: 5, examples: "DAAD, Heinrich Böll, Deutschlandstipendium" },
  { flag: "🇨🇦", name: "Canada",         code: "Canada",  scholarships: 5, examples: "Vanier, Lester B. Pearson, Trudeau" },
];

const steps = [
  { num: "1", title: "Create your free profile",  desc: "Tell us your field of study, degree level, and where you're from." },
  { num: "2", title: "Run AI Matching",            desc: "Our engine ranks every scholarship by how well it fits your profile." },
  { num: "3", title: "Review your results",        desc: "See personalised matches with scores, eligibility, and funding details." },
  { num: "4", title: "Apply & track",              desc: "Click through to apply and track your applications in one place." },
];

const recentWins = [
  { name: "Chevening Scholarship",           country: "🇬🇧 UK",      amount: "Full funding + £1,173/mo",  field: "Any field" },
  { name: "DAAD Scholarship",                country: "🇩🇪 Germany", amount: "€934/month + health cover",   field: "Any field" },
  { name: "Fulbright Foreign Student",       country: "🇺🇸 USA",     amount: "Full tuition + living costs", field: "Any field" },
  { name: "Lester B. Pearson Scholarship",   country: "🇨🇦 Canada",  amount: "Full 4-year undergraduate",   field: "Any field" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-[#e8f5f0] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-none tracking-tight mb-6">
              Find Scholarships<br />
              <span className="text-blue-600">for Your Future</span>
            </h1>

            <ul className="space-y-2 mb-8">
              {trustPoints.map((p) => (
                <li key={p} className="flex items-center gap-2 text-slate-700 text-base font-medium">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-lg transition-colors"
              >
                Find Scholarships Now
              </Link>
              <Link
                href="/scholarships"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base rounded-lg border border-slate-200 transition-colors"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-blue-500">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-6 py-2">
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-blue-200 text-sm font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCHOLARSHIP HIGHLIGHTS ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Featured Scholarships</h2>
              <p className="text-slate-500 mt-1">A sample of what&apos;s waiting for you</p>
            </div>
            <Link href="/scholarships" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentWins.map((s) => (
              <div key={s.name} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                <p className="text-2xl mb-3">{s.country.split(" ")[0]}</p>
                <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">{s.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{s.country}</p>
                <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  {s.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section id="countries" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Study in 4 Countries</h2>
          <p className="text-slate-500 mb-8">Scholarships across the UK, USA, Germany, and Canada — all in one place.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/scholarships?country=${c.code}`}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-3">{c.flag}</div>
                <h3 className="font-bold text-slate-900 mb-1">{c.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{c.scholarships} scholarships</p>
                <p className="text-xs text-slate-600 leading-relaxed">{c.examples}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">How ScholarMatch Works</h2>
          <p className="text-slate-500 mb-12">From sign-up to matched scholarships in under 2 minutes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-slate-200 -translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Your Scholarship<br />Is Out There
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Thousands of students miss funding they qualify for simply because they never found it. ScholarMatch changes that.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-blue-50 text-blue-700 font-black text-base rounded-lg transition-colors"
          >
            Find Scholarships Now — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-blue-300 text-sm">No credit card required</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
