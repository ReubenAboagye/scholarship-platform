"use client";

import Image from "next/image";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import { Mail, MapPin, Clock, CheckCircle, Loader2, ArrowRight, Sparkles } from "lucide-react";

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

const contactInfo = [
  { icon: Mail, label: "Email", value: "support@gentechmart.shop" },
  { icon: MapPin, label: "Based in", value: "Ghana, West Africa" },
  { icon: Clock, label: "Response time", value: "Within 24-48 hours" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  }

  const inp = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none text-sm transition-all bg-white font-light";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────
          HERO (Consistent with About/FAQ)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-paper border-b border-slate-200/70 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-6">
                Support & Inquiries
              </p>
              <h1 className="text-[40px] sm:text-[46px] lg:text-[56px] text-slate-900 mb-6 leading-tight tracking-tight" style={SERIF}>
                We would love to <span className="italic">hear from you.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl font-light">
                Have a question about ScholarBridge AI, a scholarship you think we should add, or a partnership enquiry? Send a message and we will get back to you promptly.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 lg:gap-24 items-start">
            
            {/* Left Column: Contact Sidebar */}
            <div className="space-y-12">
              <FadeIn direction="right">
                <div>
                  <h2 className="text-2xl text-slate-900 mb-8" style={SERIF}>Get in touch</h2>
                  <div className="space-y-6">
                    {contactInfo.map((c) => (
                      <div key={c.label} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-brand-100 hover:bg-brand-50/30 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200 group-hover:bg-white group-hover:border-brand-200 transition-colors">
                          <c.icon className="w-4 h-4 text-slate-500 group-hover:text-brand-600 transition-colors" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                          <p className="text-base text-slate-800 font-medium">{c.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl shadow-lg border border-slate-200 mt-12">
                  <Image
                    src="/images/marketing/award-ceremony.jpg"
                    alt="Student award ceremony"
                    width={1600}
                    height={1067}
                    className="h-64 w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-xs font-semibold text-brand-300 uppercase tracking-widest mb-1">Impact</p>
                    <p className="text-sm text-white font-medium italic">Building the next generation of global scholars.</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-8 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5">
                    <Sparkles className="w-24 h-24 text-slate-950" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">Want to suggest a scholarship?</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-light relative z-10">
                    Know of a fully-funded opportunity we have not listed? Send the details and the team will review it for inclusion.
                  </p>
                </div>
              </FadeIn>
            </div>

            {/* Right Column: Contact Form */}
            <div className="relative">
              <FadeIn delay={0.2}>
                {sent ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 lg:p-20 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl text-slate-900 mb-4" style={SERIF}>Message received.</h3>
                    <p className="text-slate-600 font-light mb-8 max-w-sm mx-auto">
                      Thanks for reaching out. A specialist from our team will get back to you at <span className="font-medium text-slate-900">{form.email}</span> within 24-48 hours.
                    </p>
                    <button 
                      onClick={() => setSent(false)}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      Send another message <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 lg:p-12 shadow-sm">
                    <h2 className="text-2xl text-slate-900 mb-10" style={SERIF}>Send a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                          <input required className={inp} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                          <input required type="email" className={inp} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                        <select required className={inp + " cursor-pointer appearance-none"} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                          <option value="">Select a subject</option>
                          <option>General enquiry</option>
                          <option>Suggest a scholarship</option>
                          <option>Technical issue</option>
                          <option>Partnership opportunity</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
                        <textarea required rows={5} className={inp + " resize-none"} placeholder="Tell us how we can help..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full group py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/20 active:scale-[0.98]"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Send Message
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center font-medium">
                        Standard response time is 24-48 hours.
                      </p>
                    </form>
                  </div>
                )}
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          CLOSING CTA (Consistent Brand Band)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <FadeIn>
            <h2 className="text-4xl lg:text-5xl text-white mb-6 leading-tight font-medium" style={SERIF}>
              Explore our <span className="italic text-brand-300">directory.</span>
            </h2>
            <p className="text-slate-400 text-base lg:text-lg mb-10 max-w-xl mx-auto leading-relaxed font-light">
              Skip the long emails and browse our curated list of fully-funded scholarships directly.
            </p>
            <a
              href="/scholarships"
              className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Browse Scholarships
              <ArrowRight className="w-4 h-4" />
            </a>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
