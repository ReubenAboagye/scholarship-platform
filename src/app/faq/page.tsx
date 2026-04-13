import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs — Frequently Asked Questions" };

const faqs = [
  {
    category: "General",
    items: [
      { q: "What is ScholarMatch?", a: "ScholarMatch is a free AI-powered platform that helps international students discover scholarships for the UK, USA, Germany, and Canada. Create a profile and our matching engine finds the opportunities you actually qualify for — ranked by relevance." },
      { q: "Is ScholarMatch completely free?", a: "Yes, 100% free for students. No subscription, no credit card, no hidden fees. You can browse all scholarships and run AI matching without paying anything." },
      { q: "Who is ScholarMatch for?", a: "ScholarMatch is built for international students — particularly from developing nations — who are seeking fully-funded opportunities to study in the UK, USA, Germany, or Canada at undergraduate, Masters, or PhD level." },
      { q: "Which countries are covered?", a: "We currently cover the United Kingdom, United States, Germany, and Canada. These are the four most popular and competitive destinations for internationally-funded scholarships." },
    ],
  },
  {
    category: "AI Matching",
    items: [
      { q: "How does AI matching work?", a: "When you complete your profile, we use OpenAI embeddings to convert your academic background into a vector. We then run a semantic similarity search against every scholarship in our database and return a ranked list of the best matches — ordered by how closely your profile fits each opportunity's criteria." },
      { q: "Why does AI matching sometimes return no results?", a: "If your profile is incomplete, the matching engine doesn't have enough information to find strong matches. Make sure you've filled in your field of study, degree level, and country of origin. You can also add a short bio to improve accuracy." },
      { q: "Does the AI ever make up scholarships?", a: "No. Our AI uses RAG (Retrieval Augmented Generation), which means it only works with data that is actually in our database. It cannot fabricate scholarships, invent deadlines, or generate information that doesn't exist in our records." },
      { q: "How accurate are the match scores?", a: "Match scores (shown as a percentage) reflect semantic similarity between your profile and each scholarship's criteria. A score above 80% is a strong match. Scores are a guide — always read the full eligibility criteria before applying." },
    ],
  },
  {
    category: "Scholarships",
    items: [
      { q: "Are all scholarships legitimate and verified?", a: "Yes. Every scholarship in our database is manually curated. We verify each listing against the official provider website, check deadlines, eligibility criteria, and funding details — then link directly to the official application page. We do not list closed, outdated, or unverified scholarships." },
      { q: "How many scholarships are on the platform?", a: "We launched with 20 carefully selected, fully verified scholarships across 4 countries. Quality over quantity — every listing includes full details, verified deadlines, and a direct apply link. More scholarships are added continuously." },
      { q: "Can I suggest a scholarship to be added?", a: "Absolutely. Use our Contact page to suggest a scholarship and we will review and add it to the platform if it meets our verification standards." },
      { q: "What if a scholarship deadline has passed?", a: "We mark expired scholarships as closed and remove them from active results. If you see one that appears out of date, please let us know via the Contact page." },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      { q: "Do I need an account to browse scholarships?", a: "No — you can browse and filter all scholarships without creating an account. You need a free account to run AI matching, save scholarships, and use the application tracker." },
      { q: "How do I improve my AI match results?", a: "Complete every field in your profile — field of study, degree level, country of origin, GPA, and your academic background bio. The more context you provide, the more accurate your matches will be." },
      { q: "Can I save scholarships I'm interested in?", a: "Yes. Once logged in, click the Save button on any scholarship to bookmark it. You can access all saved scholarships from your dashboard." },
      { q: "How does the application tracker work?", a: "The tracker lets you assign a status to any scholarship — from Interested through In Progress, Submitted, Awaiting Decision, Accepted, or Rejected. It gives you one place to manage your entire scholarship pipeline." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#e8f5f0] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Help Centre</p>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Everything you need to know about ScholarMatch, AI matching, and the scholarship process.
              </p>
              <a href="/contact" className="inline-flex items-center px-6 py-3 border border-slate-300 hover:border-blue-400 text-slate-700 font-bold rounded-lg transition-colors text-sm">
                Can&apos;t find your answer? Contact us →
              </a>
            </div>
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=700&q=80"
              alt="Graduates celebrating"
              className="rounded-2xl w-full object-cover h-72 shadow-xl hidden lg:block"
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTIONS */}
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

      {/* STILL NEED HELP */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <img
            src="https://images.pexels.com/photos/15371598/pexels-photo-15371598.jpeg?auto=compress&cs=tinysrgb&w=200"
            alt="Graduates"
            className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-white shadow-md"
          />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Still have a question?</h2>
          <p className="text-slate-500 mb-5 text-sm">Our team is happy to help. Send us a message and we&apos;ll get back to you within 24 hours.</p>
          <a href="/contact" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm">
            Contact Support →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
