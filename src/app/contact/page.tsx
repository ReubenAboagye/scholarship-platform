"use client";

import Image from "next/image";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin, Clock, CheckCircle, Loader2 } from "lucide-react";

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

  const inp = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Contact Us</p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
              We would love to hear from you
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Have a question about ScholarBridge AI, a scholarship you think we should add, or a partnership enquiry? Send a message and we will get back to you promptly.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-5">Get in touch</h2>
                <div className="space-y-4">
                  {contactInfo.map((c) => (
                    <div key={c.label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <c.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{c.label}</p>
                        <p className="text-sm font-semibold text-slate-800">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] shadow-md">
                <Image
                  src="/images/marketing/award-ceremony.jpg"
                  alt="Student award ceremony"
                  width={1600}
                  height={1067}
                  className="h-56 w-full object-cover"
                />
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">Want to suggest a scholarship?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Know of a fully-funded opportunity we have not listed? Send the details and the team can review it for inclusion.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Message sent</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Thanks for reaching out. We will get back to you at <strong>{form.email}</strong> within 24-48 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                      <input required className={inp} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                      <input required type="email" className={inp} placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject *</label>
                    <select required className={inp + " cursor-pointer"} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                      <option value="">Select a subject</option>
                      <option>General enquiry</option>
                      <option>Suggest a scholarship</option>
                      <option>Technical issue</option>
                      <option>Partnership opportunity</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
                    <textarea required rows={6} className={inp + " resize-none"} placeholder="Tell us how we can help..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Sending..." : "Send Message"}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    We respond to all messages within 24-48 hours on business days.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
