import { CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { value: "$500M+", label: "In scholarship value listed" },
  { value: "20+",    label: "Verified scholarships" },
  { value: "4",      label: "Countries covered" },
  { value: "100%",   label: "Free for students" },
];

const countries = [
  { flag: "🇬🇧", name: "United Kingdom", code: "UK",      count: 5, top: "Chevening · Gates Cambridge · Rhodes" },
  { flag: "🇺🇸", name: "United States",  code: "USA",     count: 5, top: "Fulbright · Mastercard Foundation" },
  { flag: "🇩🇪", name: "Germany",        code: "Germany", count: 5, top: "DAAD · Heinrich Böll · Konrad-Adenauer" },
  { flag: "🇨🇦", name: "Canada",         code: "Canada",  count: 5, top: "Vanier · Lester B. Pearson · Trudeau" },
];

const featured = [
  { name: "Chevening Scholarship",       country: "UK",      flag: "🇬🇧", funding: "Full",    amount: "Tuition + £1,173/mo + flights",   degree: "Masters" },
  { name: "Fulbright Foreign Student",   country: "USA",     flag: "🇺🇸", funding: "Full",    amount: "Full tuition + stipend + flights", degree: "Masters / PhD" },
  { name: "DAAD Scholarship",            country: "Germany", flag: "🇩🇪", funding: "Full",    amount: "€934–€1,200/month + insurance",    degree: "Masters / PhD" },
  { name: "Vanier Canada Graduate",      country: "Canada",  flag: "🇨🇦", funding: "Full",    amount: "CAD $50,000/year × 3 years",       degree: "PhD" },
  { name: "Gates Cambridge Scholarship", country: "UK",      flag: "🇬🇧", funding: "Full",    amount: "Full tuition + £21,000/year",      degree: "Masters / PhD" },
  { name: "Lester B. Pearson",           country: "Canada",  flag: "🇨🇦", funding: "Full",    amount: "Full 4-year undergraduate costs",  degree: "Undergraduate" },
];

const steps = [
  { n: "01", title: "Create your free profile",   body: "Add your field of study, degree level, country, and academic background. Takes under 2 minutes." },
  { n: "02", title: "Get AI-matched",             body: "Our engine scores every scholarship against your profile using semantic similarity — not just keywords." },
  { n: "03", title: "Review ranked results",      body: "See match scores, funding details, eligibility criteria, and deadlines — all in one place." },
  { n: "04", title: "Apply and track progress",   body: "Click straight through to apply. Track every application from Interested to Accepted." },
];

const faqs = [
  { q: "What is ScholarMatch?",              a: "ScholarMatch is a free AI-powered platform that helps international students find scholarships for the UK, USA, Germany, and Canada. Create a profile and our engine matches you to the opportunities you actually qualify for." },
  { q: "Is ScholarMatch completely free?",   a: "Yes, 100% free for students. No credit card, no subscription, no hidden fees. We cover all hosting costs for the first year post-launch." },
  { q: "How does the AI matching work?",     a: "We use OpenAI embeddings to convert your academic profile into a vector, then perform a similarity search against every scholarship in our database. The result is a ranked list of scholarships ordered by how well they fit your specific background." },
  { q: "Are the scholarships legitimate?",   a: "Every scholarship in our database is manually curated and verified. We link directly to official application pages and include accurate deadlines, eligibility criteria, and funding details." },
  { q: "Do I need an account to browse?",   a: "No — you can browse and filter scholarships without an account. You need a free account to run AI matching, save scholarships, and track your applications." },
  { q: "Which countries are covered?",      a: "We currently cover the United Kingdom, United States, Germany, and Canada — the four most popular destinations for international students seeking fully-funded opportunities." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-[#e8f5f0] pt-16 pb-0 lg:pt-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">

            {/* Left */}
            <div className="pb-16 lg:pb-24">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-sm font-semibold text-slate-700 mb-6 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                AI-powered · Free for students
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
                Find{" "}
                <span className="text-blue-600">Scholarships</span>
                <br />Matched to You
              </h1>

              <p className="text-lg text-slate-600 mb-4 max-w-lg leading-relaxed">
                Stop scrolling through hundreds of listings. Tell us about yourself — our AI finds the scholarships you actually qualify for.
              </p>

              <ul className="space-y-1.5 mb-8">
                {[
                  "Scholarships for every type of student",
                  "Fully verified opportunities",
                  "AI-matched to your exact profile",
                  "100% free, always",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/auth/signup" className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow-md">
                  Find Scholarships Now — Free
                </a>
                <a href="/scholarships" className="inline-flex items-center justify-center gap-1.5 px-7 py-3.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-lg transition-colors">
                  Browse All Scholarships <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right — stacked match cards */}
            <div className="hidden lg:block relative pb-0">
              <div className="space-y-3 max-w-sm ml-auto">
                {[
                  { name: "Chevening Scholarship",     pct: 96, flag: "🇬🇧", amount: "Full funding" },
                  { name: "DAAD Scholarship",           pct: 91, flag: "🇩🇪", amount: "€934/month" },
                  { name: "Fulbright Foreign Student",  pct: 87, flag: "🇺🇸", amount: "Full funding" },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className="bg-white rounded-2xl p-4 shadow-md border border-slate-100"
                    style={{ transform: `translateY(${i * -6}px)` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.flag}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.amount}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-green-600 bg-green-100 px-2.5 py-1 rounded-full">{c.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Match score</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-black text-white">{s.value}</p>
                <p className="text-blue-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SCHOLARSHIPS ──────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Featured Scholarships</h2>
              <p className="text-slate-500 mt-1">Hand-picked fully-funded opportunities</p>
            </div>
            <a href="/scholarships" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((s) => (
              <a key={s.name} href="/scholarships" className="group block border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{s.flag}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">{s.funding} Funding</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{s.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{s.country} · {s.degree}</p>
                <p className="text-sm font-semibold text-slate-700">{s.amount}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ───────────────────────────────────── */}
      <section id="countries" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Study in 4 Countries</h2>
            <p className="text-slate-500">All scholarships verified, with direct links to official application pages.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries.map((c) => (
              <a key={c.code} href={`/scholarships?country=${c.code}`} className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all">
                <div className="text-4xl mb-4">{c.flag}</div>
                <h3 className="font-bold text-slate-900 mb-0.5">{c.name}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-3">{c.count} scholarships</p>
                <p className="text-xs text-slate-500 leading-relaxed">{c.top}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">How ScholarMatch Works</h2>
            <p className="text-slate-500">From sign-up to matched scholarships in under 2 minutes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(100%-8px)] w-[calc(100%-16px)] h-px bg-slate-200" />
                )}
                <div className="relative z-10 w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="py-16 bg-[#e8f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Frequently Asked Questions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            {faqs.map((f, i) => (
              <details key={i} className="group border-b border-slate-300 py-5 cursor-pointer">
                <summary className="flex items-center justify-between text-slate-800 font-semibold text-sm list-none">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-6">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Your Scholarship<br className="hidden sm:block" /> Is Out There
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Thousands of students miss funding they qualify for — simply because they never found it. Don&apos;t be one of them.
          </p>
          <a href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-blue-700 font-black text-base rounded-lg transition-colors shadow-lg">
            Find Scholarships Now — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-4 text-blue-300 text-sm">No credit card required · Free forever</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
