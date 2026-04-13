import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Target, Bell, CheckCircle, Globe, Award } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { value: "20+", label: "Curated Scholarships" },
  { value: "4",   label: "Countries Covered" },
  { value: "AI",  label: "Powered Matching" },
  { value: "Free", label: "To Get Started" },
];

const features = [
  { icon: Target,   title: "Smart AI Matching",     desc: "Our AI analyses your academic profile and ranks scholarships by how well they fit you personally." },
  { icon: BookOpen, title: "Curated Database",       desc: "Every scholarship hand-verified with full eligibility details, funding amounts, deadlines, and direct apply links." },
  { icon: Bell,     title: "Application Tracker",    desc: "Track every application from Interested to Accepted. Built-in status management so you never miss a deadline." },
  { icon: Sparkles, title: "RAG-Powered Accuracy",   desc: "Responses grounded in real scholarship data only. The AI never fabricates — it only uses what is in the database." },
];

const countries = [
  { flag: "🇬🇧", name: "United Kingdom", code: "UK",      count: 5, highlight: "Chevening & Gates Cambridge" },
  { flag: "🇺🇸", name: "United States",  code: "USA",     count: 5, highlight: "Fulbright & Mastercard Foundation" },
  { flag: "🇩🇪", name: "Germany",        code: "Germany", count: 5, highlight: "DAAD & Heinrich Böll" },
  { flag: "🇨🇦", name: "Canada",         code: "Canada",  count: 5, highlight: "Vanier & Lester B. Pearson" },
];

const steps = [
  { num: "01", title: "Create your profile",   desc: "Tell us your field of study, degree level, and academic background." },
  { num: "02", title: "Run AI Matching",        desc: "Our engine compares your profile against every scholarship using semantic similarity." },
  { num: "03", title: "Review your matches",    desc: "See ranked results with match scores and personalised explanations." },
  { num: "04", title: "Track & Apply",          desc: "Save scholarships, track applications, and click through to apply directly." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-slate-100 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Scholarship Discovery
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6 leading-tight">
              Find scholarships{" "}
              <em className="text-blue-600 not-italic">matched</em>
              <br />to your profile
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mb-8 leading-relaxed">
              Stop scrolling through hundreds of listings. Tell us about yourself and let our AI surface the opportunities you actually qualify for — in the UK, USA, Germany, and Canada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Get Your Matches Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/scholarships" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-xl transition-all hover:shadow-sm">
                Browse All Scholarships
              </Link>
            </div>
          </div>

          {/* Floating match cards */}
          <div className="hidden lg:flex lg:flex-col absolute right-8 top-20 gap-3 w-72">
            {[
              { name: "Chevening Scholarship", country: "🇬🇧 United Kingdom", score: 94 },
              { name: "DAAD Scholarship",       country: "🇩🇪 Germany",        score: 88 },
              { name: "Fulbright Program",      country: "🇺🇸 United States",  score: 81 },
            ].map((card) => (
              <div key={card.name} className="bg-white rounded-xl p-4 shadow-card border border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{card.country}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">{card.score}% match</span>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Full Funding</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl text-white">{s.value}</p>
                <p className="text-blue-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-slate-900 mb-3">Everything you need to find funding</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built specifically for international students navigating the complex world of overseas scholarships.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COUNTRIES */}
      <section id="countries" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-slate-900 mb-3">4 world-class destinations</h2>
            <p className="text-slate-500">Scholarships across the UK, USA, Germany, and Canada — all in one place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {countries.map((c) => (
              <Link key={c.code} href={`/scholarships?country=${c.code}`} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 hover:border-blue-300 hover:shadow-card transition-all p-6">
                <div className="text-5xl mb-4">{c.flag}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{c.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{c.count} scholarships available</p>
                <p className="text-xs text-blue-600 font-medium">{c.highlight}</p>
                <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl text-slate-900 mb-3">How ScholarMatch works</h2>
            <p className="text-slate-500">From profile to matched scholarships in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-5 left-[calc(100%-8px)] w-full h-px bg-slate-200" />}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-4 shadow-lg relative z-10">{s.num}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Globe,        label: "International coverage",  desc: "UK, USA, Germany, Canada — the most sought-after destinations for international students." },
              { icon: CheckCircle,  label: "Verified listings",       desc: "Every scholarship manually curated. No outdated, closed, or inaccurate listings." },
              { icon: Award,        label: "Fully-funded options",     desc: "Many listed scholarships cover 100% of costs including tuition, living expenses, and flights." },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 p-5 bg-white rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm mb-1">{item.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">🎓</div>
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Your scholarship is <em className="text-blue-400 not-italic">waiting</em>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
            Thousands of students miss funding they qualify for simply because they never found it. Don&apos;t be one of them.
          </p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-blue-50 text-slate-900 font-semibold rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-4 text-slate-500 text-sm">No credit card required · Free forever for students</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
