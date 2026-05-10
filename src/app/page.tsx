import Image from "next/image";
import { ArrowRight, Check, ChevronDown, Compass, Globe, Lock, Shield, Award, BookOpen, Users, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSpotlight from "@/components/home/HeroSpotlight";
import SciFiAnimations from "@/components/home/SciFiAnimations";
import InteractiveGrid from "@/components/home/InteractiveGrid";
import EnhancedTrustStrip from "@/components/home/EnhancedTrustStrip";
import EnhancedDestinations from "@/components/home/EnhancedDestinations";
import ScholarshipCategories from "@/components/home/ScholarshipCategories";
import ScrollToTop from "@/components/home/ScrollToTop";
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-900 overflow-x-hidden pt-16">
        {/* Sci-Fi Animations - Educational elements */}
        <SciFiAnimations />

        {/* Mouse-following spotlight effect */}
        <HeroSpotlight />

        {/* Decorative background elements - Unipix-style with floating animations */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 size-[800px] bg-brand-900 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float" />
          <div className="absolute bottom-0 left-0 size-[600px] bg-brand-900 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-float-delayed" />
        </div>
        
        {/* Interactive grid that tracks mouse cursor */}
        <InteractiveGrid />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-20 items-center">
            <div>
              

              <h1
                className="text-[32px] sm:text-[40px] lg:text-[52px] xl:text-[64px] text-white mb-5 sm:mb-6 leading-tight lg:leading-tight animate-fade-up"
                style={{ ...SERIF, animationDelay: '100ms' }}
              >
                Scholarships matched
                <br className="hidden sm:block" />
                to your academic
                <br className="hidden sm:block" />
                <span className="text-blue-300"> profile.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-zinc-300 leading-relaxed mb-8 sm:mb-10 max-w-xl animate-fade-up" style={{ animationDelay: '200ms' }}>
                Access verified funding opportunities from government agencies and accredited universities. Our eligibility engine matches you with scholarships you actually qualify for.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-lg animate-fade-up" style={{ animationDelay: '300ms' }}>
                {[
                  { icon: Shield, text: "Official sources" },
                  { icon: Globe, text: "4 countries" },
                  { icon: BookOpen, text: "Full & partial" },
                  { icon: Lock, text: "Data stays private" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 sm:gap-3 text-zinc-200">
                    <div className="size-7 sm:w-8 sm:h-8 rounded-lg bg-brand-700/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="size-3.5 sm:w-4 sm:h-4 text-blue-300" strokeWidth={2} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 sm:px-8 sm:py-4 bg-amber-600 text-white font-bold text-sm sm:text-base hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span>Find my scholarships</span>
                  <ArrowRight className="size-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="/scholarships"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm sm:text-base hover:bg-white/20 transition-all transform hover:-translate-y-1"
                >
                  <span>Browse directory</span>
                  <ArrowRight className="size-4 sm:w-5 sm:h-5" />
                </a>
              </div>
              
            </div>

            <div className="relative animate-scale-in order-first lg:order-last animate-pulse-glow" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-brand-500/20 to-brand-500/20 rounded-2xl blur-2xl animate-float" />
                <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 shadow-2xl h-[280px] sm:h-[350px] lg:h-[450px] xl:h-[550px]">
                  <Image
                    src="/images/marketing/students-collab.jpg"
                    alt="Students studying together"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1023px) 100vw, 45vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      {COUNTRY_META.map((country, idx) => (
                        <div
                          key={country.code}
                          className={`size-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-brand-800 ${idx > 0 ? '-ml-2 sm:-ml-3' : ''}`}
                          aria-hidden
                        >
                          <img src={flagUrl(country.flag)} alt="" className="size-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20">
                      <p className="text-blue-200 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                        Verified Opportunities
                      </p>
                      <p className="text-white text-xl sm:text-2xl font-bold" style={SERIF}>
                        {totalScholarships} Scholarships
                      </p>
                      <p className="text-zinc-300 text-xs sm:text-sm mt-1">
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

      {/* Scholarship Categories Section - adapted from Unipix template */}
      <ScholarshipCategories />

      {/* Enhanced Trust Strip with sci-fi effects */}
      <EnhancedTrustStrip />

      <section className="bg-paper border-b border-zinc-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
                Featured
              </p>
              <h2 className="text-3xl lg:text-4xl text-zinc-900" style={SERIF}>
                Fully-funded opportunities
              </h2>
              <p className="text-zinc-500 mt-2">
                Pulled from the current scholarship database, not a static marketing list.
              </p>
            </div>
            <a
              href="/scholarships"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors whitespace-nowrap"
            >
              See the full directory
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((scholarship) => (
              <a
                key={scholarship.slug!}
                href={`/scholarships/${scholarship.slug}`}
                className="group block bg-white border border-zinc-200 rounded-lg p-6 hover:border-zinc-300 hover:shadow-card-hover transition-all"
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
                    <span className="text-xs font-medium text-zinc-500">
                      {getCountryLabel(scholarship.country)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    {scholarship.funding_type} funding
                  </span>
                </div>

                <h3
                  className="text-xl text-zinc-900 mb-2 group-hover:text-brand-700 transition-colors leading-tight"
                  style={SERIF}
                >
                  {scholarship.name}
                </h3>
                <p className="text-xs text-zinc-500 mb-5">
                  {scholarship.degree_levels?.join(" / ") || "Any level"}
                </p>

                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-1">
                    Funding
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 leading-snug">
                    {scholarship.funding_amount || `${scholarship.funding_type} funding`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded">
                    <span className="size-1.5 rounded-full bg-blue-500" aria-hidden />
                    Deadline: {formatDeadline(scholarship.application_deadline).replace(" (Closed)", "")}
                  </span>
                  <span className="inline-flex items-center text-[11px] font-medium text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded">
                    {formatEffort(scholarship.effort_minutes)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Destinations with sci-fi effects */}
      <EnhancedDestinations countries={countries} />

      <section id="how-it-works" className="bg-white border-b border-zinc-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-zinc-900 mb-3 whitespace-nowrap" style={SERIF}>
              From sign-up to ranked matches in two minutes
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 leading-relaxed whitespace-nowrap">
              A straightforward four-step flow with no quizzes, no upsells, and no surveys to unlock your results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.n}
                className="relative group bg-white border border-zinc-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-lg transition-all duration-300"
              >
                {/* Step number circle */}
                <div className="absolute -top-4 left-6 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-brand-700 transition-colors">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="pt-2">
                  <h3 className="font-semibold text-zinc-900 mb-2 text-[15px]">{step.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.body}</p>
                </div>

                {/* Arrow indicator */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-zinc-300">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-zinc-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 mb-3">
              Questions
            </p>
            <h2 className="text-3xl lg:text-4xl text-zinc-900" style={SERIF}>
              Frequently asked
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {faqs.map((faq, index) => (
              <details key={index} className="group border-b border-zinc-200 py-5 cursor-pointer">
                <summary className="flex items-center justify-between text-zinc-900 font-semibold text-[15px] list-none">
                  {faq.q}
                  <ChevronDown className="size-4 text-zinc-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed pr-8">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
