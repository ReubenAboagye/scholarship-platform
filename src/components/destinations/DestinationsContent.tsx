"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe, CheckCircle, GraduationCap, MapPin } from "lucide-react";
import { CountryMetadata } from "@/types";

const FLAG_URL = (code: string) => `https://flagcdn.com/w160/${code.toLowerCase()}.png`;

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface DestinationsContentProps {
  countries: CountryMetadata[];
}

export default function DestinationsContent({ countries }: DestinationsContentProps) {
  return (
    <>
      {/* Hero Section - Using Scholarship Page Hero Image */}
      <section className="relative overflow-hidden" style={{ minHeight: "380px" }}>
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80&auto=format&fit=crop"
          alt="University Campus"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p variants={fadeInUp} className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90 mb-3">
              Global Study Destinations
            </motion.p>
            <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-[3.2rem] font-black text-white leading-tight tracking-tight mb-6">
              Explore Your <span className="text-brand-400">Future</span> Destinations
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              We focus on 4 major destinations where international students find the greatest success. 
              Each offers unique academic cultures and world-class funding opportunities.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {countries.map((c, i) => (
              <motion.a 
                key={c.code}
                href={`/scholarships?country=${c.code}`}
                className="group relative flex flex-col items-center justify-center bg-white rounded-none border border-slate-200 shadow-sm aspect-square p-8 hover:shadow-xl hover:border-brand-200 transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
              >
                <div className="w-full aspect-[3/2] border border-slate-100 overflow-hidden shadow-sm mb-6 transition-transform duration-500 group-hover:scale-105">
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                </div>
                
                <h2 className="text-xl font-black text-slate-900 mb-2 group-hover:text-brand-600 transition-colors text-center tracking-tight">
                  {c.name}
                </h2>
                
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Explore <ArrowRight className="w-3 h-3" />
                </div>

                {/* Subtle Decorative Element */}
                <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-slate-100 group-hover:bg-brand-100 transition-colors" />
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Focus Section - Value Driven */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-4">
                <Globe className="w-4 h-4" /> Why these countries?
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8 leading-tight">We focus on destinations with<br />high-value funding opportunities.</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { icon: CheckCircle, t: "Verified Sources", b: "We only list countries where we have manually verified official funding programs." },
                  { icon: GraduationCap, t: "Global Recognition", b: "Universities in these countries are ranked among the top 1% globally." },
                  { icon: MapPin, t: "Post-Study Paths", b: "Clear regulatory pathways for transitioning from study to career." },
                  { icon: Globe, t: "International Hubs", b: "Rich cultural diversity and extensive support for foreign students." },
                ].map((item) => (
                  <div key={item.t} className="flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">{item.t}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative p-2">
              <div className="absolute inset-0 bg-brand-600 rounded-[3rem] rotate-3 opacity-10" />
              <div className="relative bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-10 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50" />
                <h3 className="text-2xl font-black text-slate-900 mb-4">Expanding Soon</h3>
                <p className="text-slate-600 leading-relaxed mb-8">
                  While we focus on the UK, USA, Germany, and Canada today, we are researching more destinations to ensure we only include the most reliable funding sources.
                </p>
                <div className="flex items-center gap-2 py-4 px-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Destinations in Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Ready to find your match?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Take the first step toward your international education. Create a free profile and get personalized matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/signup" 
              className="px-8 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 transition-all shadow-brand text-base"
            >
              Get Started for Free
            </a>
            <a 
              href="/scholarships" 
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-base"
            >
              Browse Scholarships
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
