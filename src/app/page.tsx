import Image from "next/image";
import { CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { value: "$500M+", label: "In scholarship value listed" },
  { value: "20+",    label: "Verified scholarships" },
  { value: "4",      label: "Countries covered" },
  { value: "100%",   label: "Free for students" },
];

const FLAG_URL = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const countries = [
  { flag: "gb", name: "United Kingdom", code: "UK",      count: 5, top: "Chevening, Gates Cambridge, Rhodes" },
  { flag: "us", name: "United States",  code: "USA",     count: 5, top: "Fulbright, Mastercard Foundation" },
  { flag: "de", name: "Germany",        code: "Germany", count: 5, top: "DAAD, Heinrich Boll, Konrad-Adenauer" },
  { flag: "ca", name: "Canada",         code: "Canada",  count: 5, top: "Vanier, Lester B. Pearson, Trudeau" },
];

const featured = [
  { name: "Chevening Scholarship",       country: "UK",     flag: "gb", funding: "Full", amount: "Tuition + GBP 1,173/mo + flights",  degree: "Masters" },
  { name: "Fulbright Foreign Student",   country: "USA",    flag: "us", funding: "Full", amount: "Full tuition + stipend + flights",   degree: "Masters / PhD" },
  { name: "DAAD Scholarship",            country: "Germany",flag: "de", funding: "Full", amount: "EUR 934–1,200/month + insurance",    degree: "Masters / PhD" },
  { name: "Vanier Canada Graduate",      country: "Canada", flag: "ca", funding: "Full", amount: "CAD 50,000/year × 3 years",          degree: "PhD" },
  { name: "Gates Cambridge Scholarship", country: "UK",     flag: "gb", funding: "Full", amount: "Full tuition + GBP 21,000/year",     degree: "Masters / PhD" },
  { name: "Lester B. Pearson",           country: "Canada", flag: "ca", funding: "Full", amount: "Full 4-year undergraduate costs",    degree: "Undergraduate" },
];

const steps = [
  { n: "01", title: "Create your free profile",  body: "Add your field of study, degree level, country, and academic background. Takes under 2 minutes." },
  { n: "02", title: "Get personalized matches",  body: "We compare your profile to scholarship criteria, not just keywords." },
  { n: "03", title: "Review ranked results",     body: "See match scores, funding details, eligibility criteria, and deadlines in one place." },
  { n: "04", title: "Apply and track progress",  body: "Click straight through to apply and track every application from Interested to Accepted." },
];

const faqs = [
  { q: "What is ScholarMatch?",            a: "ScholarMatch is a free platform that helps international students find scholarships for the UK, USA, Germany, and Canada." },
  { q: "Is ScholarMatch completely free?", a: "Yes. There is no subscription, no hidden fee, and no credit card requirement for students." },
  { q: "How does the matching work?",      a: "We compare your academic profile to scholarship criteria and highlight the strongest fits." },
  { q: "Are the scholarships legitimate?", a: "Every scholarship in the database is manually curated, verified, and linked to an official application page." },
  { q: "Do I need an account to browse?",  a: "No. You can browse scholarships without an account, but you need one to run matches, save favorites, and track applications." },
  { q: "Which countries are covered?",     a: "We currently cover the United Kingdom, United States, Germany, and Canada." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] pt-16 pb-10 lg:pt-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="pb-6 lg:pb-10">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 mb-6">
                <span className="w-2 h-2 bg-green-500 inline-block"></span>
                Personalized matches · Free for students
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
                Find <span className="text-blue-600">Scholarships</span><br /> Matched to You
              </h1>
              <p className="text-lg text-slate-600 mb-4 max-w-lg leading-relaxed">
                Stop scrolling through hundreds of listings. Tell us about your study goals and get scholarship matches that fit your profile.
              </p>
              <ul className="space-y-1.5 mb-8">
                {["Scholarships for every type of student","Fully verified opportunities","Personalized matches for your profile","100% free, always"].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/auth/signup" className="inline-flex items-center justify-center px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors">
                  Start matching scholarships for free
                </a>
                <a href="/scholarships" className="inline-flex items-center justify-center gap-1.5 px-7 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm transition-colors">
                  Browse all scholarships <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden border border-slate-200 shadow-lg">
                <Image src="/images/marketing/students-collab.jpg" alt="Students studying together" width={1600} height={1067} className="h-[420px] w-full object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-6 left-4 right-4 sm:left-8 sm:right-auto sm:w-72 bg-white border border-slate-200 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Top match ready</p>
                    <p className="text-xs text-slate-500">Verified funding opportunity</p>
                  </div>
                  <span className="text-sm font-black text-green-700 bg-green-100 px-2.5 py-1 font-mono">96%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5"><div className="bg-green-500 h-1.5 w-[96%]" /></div>
              </div>
              <div className="hidden sm:block absolute top-5 right-5 bg-slate-900/90 backdrop-blur px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Coverage</p>
                <p className="text-2xl font-black">4 countries</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600 mb-3">Why Students Use It</p>
              <h2 className="text-3xl font-black text-slate-900 mb-3">A focused platform, not a noisy directory</h2>
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                ScholarMatch keeps the process simple: verified opportunities, a fast match check, and a clean workflow for saving and tracking applications.
              </p>
            </div>
            <div className="relative overflow-hidden border border-slate-200 shadow-sm">
              <Image src="/images/marketing/campus-building.jpg" alt="University campus" width={1600} height={1067} className="h-64 w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-slate-100">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200">
            {featured.map((s) => (
              <a key={s.name} href="/scholarships" className="group block bg-white p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <img src={FLAG_URL(s.flag)} alt={s.country} className="w-8 h-auto" />
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5">{s.funding} Funding</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{s.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{s.country} · {s.degree}</p>
                <p className="text-sm font-semibold text-slate-700">{s.amount}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="countries" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Study in 4 Countries</h2>
            <p className="text-slate-500">All scholarships verified, with direct links to official application pages.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
            {countries.map((c) => (
              <a key={c.code} href={`/scholarships?country=${c.code}`} className="group bg-white p-6 hover:bg-slate-50 transition-colors">
                <img src={FLAG_URL(c.flag)} alt={c.name} className="w-10 h-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-0.5">{c.name}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-3">{c.count} scholarships</p>
                <p className="text-xs text-slate-500 leading-relaxed">{c.top}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-blue-600">Browse <ArrowRight className="w-3.5 h-3.5" /></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">How ScholarMatch Works</h2>
            <p className="text-slate-500">From sign-up to matched scholarships in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-5 left-[calc(100%-8px)] w-[calc(100%-16px)] h-px bg-slate-200" />}
                <div className="relative z-10 w-10 h-10 bg-blue-600 text-white text-sm font-black flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
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

      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">Your Scholarship<br className="hidden sm:block" /> Is Out There</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">Thousands of students miss funding they qualify for simply because they never found it.</p>
          <a href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-50 text-blue-700 font-black text-base transition-colors">
            Find scholarships now — free to use <ArrowRight className="w-5 h-5" />
          </a>
          <p className="mt-4 text-blue-300 text-sm">No credit card required · Free forever</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
