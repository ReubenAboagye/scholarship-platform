import Image from "next/image";
import { ArrowRight, Shield, Globe2, Sparkles, Scale } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import { Metadata } from "next";

export const metadata: Metadata = { 
  title: "About Us | ScholarBridge AI",
  description: "Learn about our mission to help students find fully funded scholarships."
};

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

const values = [
  { 
    icon: Globe2, 
    title: "Accessibility First", 
    body: "Every student, regardless of background or geography, deserves access to life-changing funding opportunities." 
  },
  { 
    icon: Shield, 
    title: "Accuracy Over Volume", 
    body: "We curate and verify every scholarship manually. Real, current opportunities matter more than inflated directory counts." 
  },
  { 
    icon: Sparkles, 
    title: "AI That Tells the Truth", 
    body: "Our matching engine only works against data that exists in the database. It does not invent scholarships or criteria." 
  },
  { 
    icon: Scale, 
    title: "Built for Global Students", 
    body: "The platform is designed for ambitious students navigating international applications, funding rules, and multiple destinations." 
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-500/30">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────
          HERO (Elevated Editorial Layout)
          ────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 lg:pt-36 pb-32 overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 mix-blend-multiply pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-[0.2em] mb-8 border border-brand-100 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Our Mission
              </div>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 
                className="text-[44px] sm:text-[56px] lg:text-[72px] text-slate-900 mb-8 leading-[1.05] tracking-tight" 
                style={SERIF}
              >
                Built to help students find funding <span className="text-brand-600 italic">they can actually use.</span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto font-light">
                ScholarBridge AI exists because scholarship discovery is usually fragmented, repetitive, and hard to trust. We keep the experience focused: verified opportunities, clear filters, and truth-driven AI matching.
              </p>
            </FadeIn>
          </div>
        </div>

        {/* Floating Masterpiece Image */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-4">
          <FadeIn delay={0.3} direction="up">
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-60 mix-blend-multiply z-10" />
              <Image
                src="/images/marketing/graduates-group.jpg"
                alt="Graduates celebrating together"
                width={1600}
                height={900}
                className="w-full h-[400px] lg:h-[600px] object-cover transition-transform duration-1000 group-hover:scale-105"
                priority
              />
              
              {/* Glassmorphic Stats Metric */}
              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 hidden md:block">
                <div className="backdrop-blur-md bg-white/80 border border-white/50 shadow-xl rounded-xl p-6 w-80 transform transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">
                      Global Scope
                    </p>
                    <div className="flex -space-x-2">
                      {["gb", "us", "de", "ca"].map((code) => (
                        <div
                          key={code}
                          className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-sm bg-slate-100"
                          aria-hidden
                        >
                          <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[15px] text-slate-800 leading-snug">
                    <span className="font-bold text-slate-900 text-lg block mb-1">20+ Verified Sources</span> 
                    Across four highly vetted academic destinations worldwide.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          VALUES / PRINCIPLES (Premium Card Grid)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <FadeIn>
              <h2 className="text-3xl lg:text-5xl text-slate-900 mb-6" style={SERIF}>
                Core Principles
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed font-light">
                The core rules that shape our platform and the student experience. We believe in quality over quantity, and radical transparency over marketing.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {values.map((v, i) => (
              <FadeIn key={v.title} delay={i * 0.1} direction="up">
                <div className="group relative bg-white rounded-2xl p-8 lg:p-10 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                  {/* Huge background number */}
                  <div 
                    className="absolute -right-6 -bottom-10 text-[180px] font-bold text-slate-50/80 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:text-slate-100/60" 
                    style={{ ...SERIF, lineHeight: 1 }}
                    aria-hidden
                  >
                    {i + 1}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-8 border border-slate-200 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-colors duration-300">
                      <v.icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4" style={SERIF}>{v.title}</h3>
                    <p className="text-base text-slate-600 leading-relaxed font-light">{v.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          OUR MISSION & DEEP DIVE (Split Layout with High Contrast)
          ────────────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white border-t border-slate-200 hidden-overflow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <FadeIn direction="right">
              <div className="relative group">
                <div className="absolute inset-0 bg-brand-600/10 rounded-2xl transform translate-x-4 translate-y-4 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
                <Image
                  src="/images/marketing/students-collab.jpg"
                  alt="Students collaborating"
                  width={800}
                  height={1000}
                  className="relative w-full h-[500px] lg:h-[700px] object-cover rounded-2xl shadow-lg ring-1 ring-slate-900/10 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </FadeIn>
            
            <FadeIn direction="left" delay={0.2}>
              <div className="lg:pl-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
                  The Problem
                </div>
                
                <h2 className="text-3xl lg:text-5xl text-slate-900 mb-8 leading-tight" style={SERIF}>
                  Reducing friction for <span className="italic text-brand-600">students</span> and <span className="italic text-brand-600">funders</span>.
                </h2>
                
                <div className="space-y-6">
                  <p className="text-lg text-slate-600 leading-relaxed font-light">
                    Thousands of fully-funded scholarships go unseen each year because students never reach the right source at the right time. ScholarBridge AI reduces that friction by combining curated listings with profile-based discovery.
                  </p>
                  <p className="text-lg text-slate-600 leading-relaxed font-light">
                    We focus heavily on four main destinations—the UK, USA, Germany, and Canada—and aim to make the path from research to application far clearer than a generic scholarship directory. The result is a cleaner workflow for students and a more trustworthy platform for organizations.
                  </p>
                  
                  <div className="pt-8 mt-8 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">Designed & Built By</p>
                    <p className="text-xl text-slate-900 font-semibold" style={SERIF}>
                      GenTech Solutions
                    </p>
                  </div>
                </div>
                
                <div className="mt-10">
                  <a 
                    href="/contact" 
                    className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Get in touch with us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          CLOSING CTA (Dramatic Dark Section)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white relative overflow-hidden">
        {/* Subtle glowing orb background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center relative z-10">
          <FadeIn>
            <h2
              className="text-4xl lg:text-6xl text-white mb-6 leading-[1.1]"
              style={SERIF}
            >
              Ready to find your scholarship?
            </h2>
            <p className="text-slate-300 text-lg lg:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Create a free profile and get matched in under 2 minutes. Free for students. No credit card. No email spam.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Takes about two minutes
            </p>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
