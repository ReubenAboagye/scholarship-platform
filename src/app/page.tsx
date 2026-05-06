import Image from "next/image";
import { ArrowRight, Check, ChevronDown, Compass, Globe, Lock, Shield, Award, BookOpen, Users, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";

const trustStrip = [
  {
    icon: Shield,
    title: "Government-verified sources",
    desc: "Every scholarship links directly to official embassy and university portals.",
  },
  {
    icon: Lock,
    title: "Privacy guaranteed",
    desc: "Your data is never sold, shared, or used for marketing purposes.",
  },
  {
    icon: Globe,
    title: "Four nations, full coverage",
    desc: "Comprehensive funding opportunities across the UK, USA, Germany, and Canada.",
  },
  {
    icon: Award,
    title: "Eligibility-matched",
    desc: "AI-powered ranking based on actual eligibility criteria, not keywords.",
  },
] as const;

const COUNTRY_META = [
  { flag: "gb", name: "United Kingdom", code: "UK" },
  { flag: "us", name: "United States", code: "USA" },
  { flag: "de", name: "Germany", code: "Germany" },
  { flag: "ca", name: "Canada", code: "Canada" },
] as const;

const steps = [
  {
    n: "01",
    title: "Create a free profile",
    body: "Tell us your field of study, degree level, and destination country. Takes about two minutes.",
  },
  {
    n: "02",
    title: "See your matches",
    body: "We compare your profile against real eligibility criteria, not keywords, so you avoid false positives.",
  },
  {
    n: "03",
    title: "Review the details",
    body: "Match fit, funding, requirements, and deadlines in one place. Every listing links to the source.",
  },
  {
    n: "04",
    title: "Apply and track",
    body: "Save, apply, and monitor every application from interested through to an offer.",
  },
] as const;

const faqs = [
  {
    q: "What is ScholarBridge?",
    a: "ScholarBridge is a free platform that helps students find scholarships for study in the UK, USA, Germany, and Canada. Every listing is verified and links to the official application page.",
  },
  {
    q: "Is it really free?",
    a: "Yes. There is no subscription, no trial, and no credit card. The platform is free for students, and we do not make money by selling your data.",
  },
  {
    q: "How does the matching work?",
    a: "We compare your academic profile, degree level, country of study, field, GPA, and more against each scholarship's actual eligibility rules. You see the strongest fits first, with the reasoning shown.",
  },
  {
    q: "Are the scholarships legitimate?",
    a: "Every scholarship in the database is manually curated, verified, and linked directly to the official application page. We never list pay-to-apply awards or anything we cannot trace to a real funder.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No. You can browse the full directory without signing up. An account is only required to run personalized matches, save favorites, and track your applications.",
  },
  {
    q: "Which countries are covered?",
    a: "The United Kingdom, United States, Germany, and Canada. We deliberately focus on these four so we can keep coverage deep and verified.",
  },
] as const;

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

type HomepageScholarship = {
  application_deadline: string | null;
  country: string;
  created_at: string;
  degree_levels: string[] | null;
  effort_minutes: number | null;
  funding_amount: string | null;
  funding_type: string;
  is_active: boolean;
  name: string;
  slug: string | null;
  verified_at: string | null;
};

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

function formatEffort(effortMinutes: number | null) {
  if (effortMinutes == null) return "Application details inside";
  if (effortMinutes <= 60) return "Quick apply";
  if (effortMinutes <= 180) return `${Math.round(effortMinutes / 60)} hr application`;
  return `${Math.round(effortMinutes / 60)}+ hr application`;
}

function getCountryLabel(code: string) {
  return COUNTRY_META.find((country) => country.code === code)?.name ?? code;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scholarships")
    .select("application_deadline,country,created_at,degree_levels,effort_minutes,funding_amount,funding_type,is_active,name,slug,verified_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const scholarships = (data ?? []) as HomepageScholarship[];
  const totalScholarships = scholarships.length;

  const featured = scholarships
    .filter((scholarship) => scholarship.funding_type === "Full" && scholarship.slug)
    .sort((a, b) => {
      const aRank = new Date(a.verified_at ?? a.created_at).getTime();
      const bRank = new Date(b.verified_at ?? b.created_at).getTime();
      return bRank - aRank || a.name.localeCompare(b.name);
    })
    .slice(0, 6);

  const countries = COUNTRY_META.map((country) => {
    const matches = scholarships.filter((scholarship) => scholarship.country === country.code);
    const top = matches
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 3)
      .map((scholarship) =>
        scholarship.name.replace(/ Scholarship$| Program$| Fellowship$| International Scholarship$/g, "")
      )
      .join(" · ");

    return {
      ...country,
      count: matches.length,
      top: top || "Verified opportunities updated regularly",
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-20 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-700/50 backdrop-blur-sm rounded-full border border-brand-500/30 mb-6 sm:mb-8">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-amber-200">
                  Official Scholarship Portal
                </span>
              </div>

              <h1
                className="text-[32px] sm:text-[40px] lg:text-[52px] xl:text-[64px] text-white mb-5 sm:mb-6 leading-tight lg:leading-tight"
                style={SERIF}
              >
                Scholarships matched
                <br className="hidden sm:block" />
                to your academic
                <br className="hidden sm:block" />
                <span className="text-amber-400"> profile.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed mb-8 sm:mb-10 max-w-xl">
                Access verified funding opportunities from government agencies and accredited universities. Our eligibility engine matches you with scholarships you actually qualify for.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-lg">
                {[
                  { icon: Shield, text: "Official sources" },
                  { icon: Globe, text: "4 countries" },
                  { icon: BookOpen, text: "Full & partial" },
                  { icon: Lock, text: "Data stays private" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 sm:gap-3 text-slate-200">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-700/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" strokeWidth={2} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 sm:px-8 sm:py-4 bg-amber-500 text-brand-900 font-bold text-sm sm:text-base hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/25 transform hover:-translate-y-0.5"
                >
                  <span>Find my scholarships</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="/scholarships"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm sm:text-base hover:bg-white/20 transition-all"
                >
                  <span>Browse directory</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
              
              <p className="mt-5 sm:mt-6 text-xs sm:text-sm text-slate-400">
                Free for students • No credit card required • Takes 2 minutes
              </p>
            </div>

            <div className="relative animate-scale-in order-first lg:order-last" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-amber-500/20 to-brand-500/20 rounded-2xl blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 shadow-2xl">
                  <Image
                    src="/images/marketing/students-collab.jpg"
                    alt="Students studying together"
                    width={1600}
                    height={1067}
                    className="h-[280px] sm:h-[350px] lg:h-[450px] xl:h-[550px] w-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      {COUNTRY_META.map((country, idx) => (
                        <div
                          key={country.code}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-brand-800 ${idx > 0 ? '-ml-2 sm:-ml-3' : ''}`}
                          aria-hidden
                        >
                          <img src={flagUrl(country.flag)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20">
                      <p className="text-amber-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                        Verified Opportunities
                      </p>
                      <p className="text-white text-xl sm:text-2xl font-bold" style={SERIF}>
                        {totalScholarships} Scholarships
                      </p>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1">
                        Across UK, USA, Germany & Canada
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {trustStrip.map((block) => (
              <div key={block.title} className="flex gap-3 items-start p-4 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <block.icon className="w-5 h-5 text-brand-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{block.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{block.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                Pulled from the current scholarship database, not a static marketing list.
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
            {featured.map((scholarship) => (
              <a
                key={scholarship.slug!}
                href={`/scholarships/${scholarship.slug}`}
                className="group block bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    {countryFlagUrl(scholarship.country) && (
                      <img
                        src={countryFlagUrl(scholarship.country)!}
                        alt=""
                        className="w-6 h-auto rounded-sm shadow-sm"
                        aria-hidden
                      />
                    )}
                    <span className="text-xs font-medium text-slate-500">
                      {getCountryLabel(scholarship.country)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    {scholarship.funding_type} funding
                  </span>
                </div>

                <h3
                  className="text-xl text-slate-900 mb-2 group-hover:text-brand-700 transition-colors leading-tight"
                  style={SERIF}
                >
                  {scholarship.name}
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  {scholarship.degree_levels?.join(" / ") || "Any level"}
                </p>

                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-1">
                    Funding
                  </p>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {scholarship.funding_amount || `${scholarship.funding_type} funding`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden />
                    Deadline: {formatDeadline(scholarship.application_deadline).replace(" (Closed)", "")}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded">
                    {formatEffort(scholarship.effort_minutes)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

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
              Rather than list 10,000 scholarships we cannot verify, we cover four destinations deeply. Every listing is traceable to an official source.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {countries.map((country) => (
              <a
                key={country.code}
                href={`/scholarships?country=${country.code}`}
                className="group block bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={flagUrl(country.flag)} alt="" className="w-10 h-auto rounded-sm shadow-sm" aria-hidden />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">{country.name}</h3>
                    <p className="text-xs text-slate-500">{country.count} scholarships</p>
                  </div>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5 line-clamp-2">
                  {country.top}
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
              A straightforward four-step flow with no quizzes, no upsells, and no surveys to unlock your results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {steps.map((step, index) => (
              <div key={step.n} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-4 left-[calc(100%-12px)] w-[calc(100%-24px)] h-px bg-slate-200" aria-hidden />
                )}
                <p
                  className="text-brand-600 text-2xl leading-none mb-4"
                  style={{ ...SERIF, fontStyle: "italic", fontWeight: 500 }}
                >
                  {step.n}
                </p>
                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            {faqs.map((faq, index) => (
              <details key={index} className="group border-b border-slate-200 py-5 cursor-pointer">
                <summary className="flex items-center justify-between text-slate-900 font-semibold text-[15px] list-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-8">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <h2 className="text-4xl lg:text-5xl text-white mb-5 leading-tight" style={SERIF}>
            Most students apply to three scholarships.
            <br className="hidden sm:block" />
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
