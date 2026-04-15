import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs - Frequently Asked Questions" };

const faqs = [
  {
    category: "General",
    items: [
      { q: "What is ScholarBridge AI?", a: "ScholarBridge AI is a free AI-powered platform that helps international students discover scholarships for the UK, USA, Germany, and Canada." },
      { q: "Is ScholarBridge AI completely free?", a: "Yes. Students can browse scholarships, create accounts, and use core matching features without paying." },
      { q: "Who is ScholarBridge AI for?", a: "It is built for students researching undergraduate, masters, and PhD funding opportunities abroad." },
      { q: "Which countries are covered?", a: "The current platform coverage is the United Kingdom, United States, Germany, and Canada." },
    ],
  },
  {
    category: "AI Matching",
    items: [
      { q: "How does AI matching work?", a: "Your profile is converted into an embedding and compared against verified scholarship records to return ranked matches." },
      { q: "Why might AI matching return no results?", a: "Profiles with too little academic detail provide weak input. Completing field of study, degree level, and country improves results." },
      { q: "Does the AI invent scholarships?", a: "No. The matching process is grounded in records stored in the database." },
      { q: "How should I read the match score?", a: "Treat it as a relevance signal, not a guarantee. You should still review eligibility criteria before applying." },
    ],
  },
  {
    category: "Scholarships",
    items: [
      { q: "Are all scholarships legitimate and verified?", a: "Yes. Listings are manually curated, checked against official sources, and linked to official application pages." },
      { q: "How many scholarships are currently listed?", a: "The initial launch includes 20 verified scholarships across 4 countries, with more added over time." },
      { q: "Can I suggest a scholarship to be added?", a: "Yes. Use the contact page to submit suggestions for review." },
      { q: "What if a deadline has passed?", a: "Expired opportunities are removed from active discovery once they are no longer current." },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      { q: "Do I need an account to browse scholarships?", a: "No. You only need an account for AI matching, saving scholarships, and application tracking." },
      { q: "How do I improve my match results?", a: "Complete your profile with clear academic details, especially field of study, degree level, and background." },
      { q: "Can I save scholarships I am interested in?", a: "Yes. Logged-in users can save scholarships and revisit them from the dashboard." },
      { q: "How does the application tracker work?", a: "The tracker lets you manage scholarship applications by status, from interest through decision." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Help Centre</p>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Everything you need to know about ScholarBridge AI, AI matching, and the scholarship discovery process.
              </p>
              <a href="/contact" className="inline-flex items-center px-6 py-3 border border-slate-300 hover:border-blue-400 text-slate-700 font-bold rounded-lg transition-colors text-sm">
                Need more help? Contact us →
              </a>
            </div>
            <div className="hidden lg:block overflow-hidden rounded-[2rem] shadow-xl">
              <Image
                src="/images/marketing/graduates-celebration.jpg"
                alt="Graduates celebrating"
                width={1600}
                height={1067}
                className="h-72 w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-black text-slate-900 mb-1 pb-3 border-b-2 border-blue-600 inline-block">
                {section.category}
              </h2>
              <div className="mt-4 space-y-0">
                {section.items.map((item) => (
                  <details key={item.q} className="group border-b border-slate-200 py-4 cursor-pointer">
                    <summary className="flex items-center justify-between font-semibold text-slate-800 text-sm list-none">
                      {item.q}
                      <span className="ml-4 flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 group-open:bg-blue-600 flex items-center justify-center transition-colors">
                        <svg className="w-3 h-3 text-slate-500 group-open:text-white group-open:rotate-180 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-2xl">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 border-2 border-white shadow-md">
            <Image
              src="/images/marketing/graduates-group.jpg"
              alt="Graduates"
              width={400}
              height={400}
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Still have a question?</h2>
          <p className="text-slate-500 mb-5 text-sm">Our team is happy to help. Send us a message and we will get back to you as soon as possible.</p>
          <a href="/contact" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm">
            Contact Support →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
