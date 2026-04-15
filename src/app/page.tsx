"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
const MotionLink = motion.create(Link);
import { CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const benefits = [
  { icon: CheckCircle, title: "Verified Data", desc: "Direct links to official sources only." },
  { icon: ArrowRight,  title: "Always Free",  desc: "No hidden fees or credit cards." },
  { icon: ChevronDown, title: "4 Tier-1 Countries", desc: "UK, USA, Germany, and Canada." },
  { icon: ArrowRight,  title: "AI Matching",  desc: "Instant ranking for your profile." },
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

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const floatAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const blobAnimation = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 90, 0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <motion.section
        className="relative py-8 lg:py-10 overflow-hidden bg-white"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Animated Background Depth Elements */}
        <motion.div 
          className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-brand-50 rounded-full blur-3xl opacity-30 select-none pointer-events-none"
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-slate-50 rounded-full blur-3xl opacity-40 select-none pointer-events-none"
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 mb-6">
                <span className="w-2 h-2 bg-green-500 inline-block"></span>
                Personalized matches · Free for students
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                Find <span className="text-brand-600">Scholarships</span><br /> Matched to You
              </h1>
              <p className="text-lg text-slate-600 mb-4 max-w-lg leading-relaxed">
                Stop scrolling through hundreds of listings. Tell us about your study goals and get scholarship matches that fit your profile.
              </p>
              <ul className="space-y-1.5 mb-8">
                {["Scholarships for every type of student","Fully verified opportunities","Personalized matches for your profile","100% free, always"].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <MotionLink
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full px-7 py-3.5 bg-brand-600 text-white font-bold text-sm shadow-brand transition duration-200 ease-out hover:bg-brand-700"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start matching scholarships for free
                </MotionLink>
                <MotionLink
                  href="/scholarships"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-7 py-3 bg-white border border-slate-300 text-slate-700 font-semibold text-sm shadow-sm transition duration-200 ease-out hover:border-slate-400 hover:shadow-md"
                  variants={fadeInUp}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Browse all scholarships <ArrowRight className="w-4 h-4" />
                </MotionLink>
              </div>
            </motion.div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-xl">
                <Image src="/images/marketing/students-collab.jpg" alt="Students studying together" width={1600} height={1067} className="h-80 lg:h-96 w-full object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-8 left-4 right-4 sm:left-auto sm:-right-8 sm:bottom-12 sm:w-64 bg-white/90 backdrop-blur-md border border-white/50 p-5 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-3">Global Destination Coverage</p>
                <div className="flex -space-x-3 mb-4">
                  {['gb', 'us', 'de', 'ca'].map((code) => (
                    <motion.div 
                      key={code}
                      className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-slate-100"
                      whileHover={{ scale: 1.1, zIndex: 10, y: -5 }}
                    >
                      <img src={FLAG_URL(code)} alt={code} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">4 Prime Countries</span>
                  <span className="text-[10px] font-medium text-slate-500">Verified Access</span>
                </div>
              </div>
              <div className="hidden sm:block absolute top-5 right-5 bg-slate-900/90 backdrop-blur px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Coverage</p>
                <p className="text-2xl font-black">4 countries</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-white py-12 border-y border-slate-100 relative z-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {benefits.map((b, i) => (
              <motion.div key={b.title} className="flex gap-4 items-start" variants={fadeInUp} transition={{ delay: i * 0.08 }}>
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-600 mb-3">Why Students Use It</p>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 leading-tight">A focused platform, not a noisy directory</h2>
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                ScholarMatch keeps the process simple: verified opportunities, a fast match check, and a clean workflow for saving and tracking applications.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <Image src="/images/marketing/campus-building.jpg" alt="University campus" width={1600} height={1067} className="h-64 w-full object-cover" />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 bg-white border-t border-slate-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Featured Scholarships</h2>
              <p className="text-slate-500 mt-1">Hand-picked fully-funded opportunities</p>
            </div>
            <Link href="/scholarships" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((s, i) => (
              <Link
                key={s.name}
                href="/scholarships"
                className="group relative block bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300"
                style={{ position: 'relative' }}
              >
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -12 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                {/* Glass Shine Effect */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                    <img src={FLAG_URL(s.flag)} alt={s.country} className="w-7 h-auto shadow-sm" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    {s.funding} Funding
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-all leading-snug">{s.name}</h3>
                <p className="text-xs font-medium text-slate-400 mb-6 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" /> {s.country} · {s.degree}
                </p>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Estimated Value</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{s.amount}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                    <ArrowRight className="w-4 h-4 text-brand-600" />
                  </div>
                </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="countries"
        className="py-16 bg-slate-50 border-t border-slate-200"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Study in 4 Countries</h2>
            <p className="text-slate-500">All scholarships verified, with direct links to official application pages.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {countries.map((c, i) => (
              <Link
                key={c.code}
                href={`/scholarships?country=${c.code}`}
                className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all h-full"
              >
                <motion.div
                  variants={fadeInUp}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                <img src={FLAG_URL(c.flag)} alt={c.name} className="w-10 h-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-0.5">{c.name}</h3>
                <p className="text-xs text-brand-600 font-bold mb-3">{c.count} scholarships</p>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">{c.top}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="how-it-works"
        className="py-16 bg-white border-t border-slate-200"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">How ScholarMatch Works</h2>
            <p className="text-slate-500">From sign-up to matched scholarships in under 2 minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.n} className="relative" variants={fadeInUp} transition={{ delay: i * 0.05 }}>
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-5 left-[calc(100%-8px)] w-[calc(100%-16px)] h-px bg-slate-200" />}
                <div className="relative z-10 w-10 h-10 bg-blue-600 text-white text-sm font-black flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-16 bg-slate-50 border-t border-slate-200"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {faqs.map((f, i) => (
              <details key={i} className="group border-b border-slate-300 py-5 cursor-pointer">
                <summary className="flex items-center justify-between text-slate-800 font-bold text-sm list-none">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-brand-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed pr-6">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-20 lg:py-32 relative overflow-hidden bg-slate-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="absolute inset-0 opacity-20">
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight" variants={fadeInUp}>
            Your Scholarship<br className="hidden sm:block" /> Is Out There
          </motion.h2>
          <motion.p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto" variants={fadeInUp} transition={{ delay: 0.08 }}>
            Thousands of students miss funding they qualify for simply because they never found it.
          </motion.p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 bg-brand-600 text-white font-black text-base shadow-brand transition duration-200 ease-out hover:bg-brand-700 hover:scale-105"
          >
            Find scholarships now — free to use <ArrowRight className="w-5 h-5" />
          </Link>
          <motion.p className="mt-6 text-slate-500 text-xs font-semibold uppercase tracking-widest" variants={fadeInUp} transition={{ delay: 0.15 }}>
            No credit card required · Free forever
          </motion.p>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
