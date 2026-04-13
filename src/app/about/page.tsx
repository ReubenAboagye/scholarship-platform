import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

const team = [
  {
    name: "GenTech Solutions",
    role: "Development & AI Integration",
    desc: "We build modern web platforms powered by AI, helping businesses bring ambitious digital products to life.",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80",
  },
];

const values = [
  { title: "Accessibility First",   body: "Every student, regardless of background or geography, deserves access to life-changing funding opportunities." },
  { title: "Accuracy Over Volume",  body: "We curate and verify every scholarship manually. 20 real, active opportunities beat 2,000 outdated listings." },
  { title: "AI That Tells the Truth", body: "Our matching engine uses RAG — it only surfaces what is actually in the database. No fabricated opportunities, ever." },
  { title: "Built for Africa & Beyond", body: "Designed with international students from developing nations in mind — the people who need this most." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#e8f5f0] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">About ScholarMatch</p>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">
                We help students find funding they actually qualify for
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                ScholarMatch was built because finding international scholarships is genuinely hard. Most platforms overwhelm students with thousands of irrelevant listings. We took a different approach — curate fewer, verify everything, and let AI do the matching.
              </p>
              <a href="/auth/signup" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm">
                Start Finding Scholarships →
              </a>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=700&q=80"
                alt="International graduates celebrating"
                className="rounded-2xl w-full object-cover h-80 lg:h-96 shadow-xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-slate-100">
                <p className="text-2xl font-black text-slate-900">20+</p>
                <p className="text-xs text-slate-500 font-medium">Verified Scholarships</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-blue-600 rounded-xl shadow-lg px-5 py-3">
                <p className="text-2xl font-black text-white">4</p>
                <p className="text-xs text-blue-200 font-medium">Countries Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80"
                alt="Diverse students collaborating"
                className="rounded-2xl w-full object-cover h-80 shadow-lg"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Thousands of fully-funded scholarships go unclaimed every year — not because students are unqualified, but because they never found them. The scholarship discovery process is fragmented, outdated, and overwhelming.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                ScholarMatch changes this. We use AI to match each student&apos;s unique academic profile against our curated database of verified scholarships — surfacing only the opportunities they are genuinely eligible for, in seconds.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We cover the UK, USA, Germany, and Canada — the four most sought-after destinations for international students pursuing postgraduate and undergraduate studies abroad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">What We Stand For</h2>
            <p className="text-slate-500">The principles that guide every decision we make on this platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT BY */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Built by GenTech Solutions</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                ScholarMatch was designed and developed by <strong className="text-slate-800">GenTech Solutions</strong>, a Ghanaian software development company specialising in AI-powered web platforms and modern digital products.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                We believe that world-class technology should be accessible to everyone — not just those in Silicon Valley. Our work is driven by the conviction that the right digital tools can transform opportunities for students across Africa and the developing world.
              </p>
              <a href="/contact" className="inline-flex items-center px-6 py-3 border border-slate-300 hover:border-blue-400 text-slate-700 font-bold rounded-lg transition-colors text-sm">
                Get In Touch →
              </a>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=80"
                alt="Academic library"
                className="rounded-2xl w-full object-cover h-72 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to find your scholarship?</h2>
          <p className="text-blue-200 mb-6">Create a free profile and get matched in under 2 minutes.</p>
          <a href="/auth/signup" className="inline-flex items-center px-7 py-3.5 bg-white hover:bg-slate-50 text-blue-700 font-black rounded-lg transition-colors text-sm">
            Get Started Free →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
