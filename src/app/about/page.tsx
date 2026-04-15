import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

const values = [
  { title: "Accessibility First", body: "Every student, regardless of background or geography, deserves access to life-changing funding opportunities." },
  { title: "Accuracy Over Volume", body: "We curate and verify every scholarship manually. Real, current opportunities matter more than inflated directory counts." },
  { title: "AI That Tells the Truth", body: "Our matching engine only works against data that exists in the database. It does not invent scholarships or criteria." },
  { title: "Built for Global Students", body: "The platform is designed for ambitious students navigating international applications, funding rules, and multiple destinations." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">About ScholarMatch</p>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">
                Built to help students find funding they can actually use
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                ScholarMatch exists because scholarship discovery is usually fragmented, repetitive, and hard to trust. We keep the experience focused: verified opportunities, clear filters, and an AI-assisted match engine that helps students narrow the field fast.
              </p>
              <a href="/auth/signup" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm">
                Start Finding Scholarships →
              </a>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-xl">
                <Image
                  src="/images/marketing/graduates-group.jpg"
                  alt="Graduates celebrating together"
                  width={1600}
                  height={1067}
                  className="h-80 lg:h-96 w-full object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-5 py-3 border border-slate-100">
                <p className="text-2xl font-black text-slate-900">20+</p>
                <p className="text-xs text-slate-500 font-medium">Verified scholarships</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-blue-600 rounded-xl shadow-lg px-5 py-3">
                <p className="text-2xl font-black text-white">4</p>
                <p className="text-xs text-blue-200 font-medium">Countries covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-[2rem] shadow-lg">
                <Image
                  src="/images/marketing/students-collab.jpg"
                  alt="Students collaborating around a laptop"
                  width={1600}
                  height={1067}
                  className="h-80 w-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Our mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Thousands of fully-funded scholarships go unseen each year because students never reach the right source at the right time. ScholarMatch reduces that friction by combining curated listings with profile-based discovery.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We focus on the UK, USA, Germany, and Canada and aim to make the path from research to application far clearer than a generic scholarship directory.
              </p>
              <p className="text-slate-600 leading-relaxed">
                The result is a cleaner workflow for students and a more trustworthy public-facing platform for organizations presenting real opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">What we stand for</h2>
            <p className="text-slate-500">The principles that shape the platform and the student experience.</p>
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

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Built by GenTech Solutions</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                ScholarMatch was designed and developed by <strong className="text-slate-800">GenTech Solutions</strong>, with a focus on clear workflows, dependable information, and practical AI use.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                The project is intended to feel credible to institutions and approachable to students at the same time, which is why the platform keeps both trust pages and a focused product experience.
              </p>
              <a href="/contact" className="inline-flex items-center px-6 py-3 border border-slate-300 hover:border-blue-400 text-slate-700 font-bold rounded-lg transition-colors text-sm">
                Get In Touch →
              </a>
            </div>
            <div className="overflow-hidden rounded-[2rem] shadow-lg">
              <Image
                src="/images/marketing/campus-building.jpg"
                alt="Academic campus building"
                width={1600}
                height={1067}
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

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
