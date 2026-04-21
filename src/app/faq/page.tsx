import Image from "next/image";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import FAQAccordionItem from "@/components/faq/FAQAccordionItem";
import { Metadata } from "next";

export const metadata: Metadata = { 
  title: "FAQs | ScholarBridge AI",
  description: "Frequently asked questions about ScholarBridge AI matching, accounts, and verified scholarships."
};

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

const faqs = [
  {
    category: "General Framework",
    items: [
      { q: "What is ScholarBridge AI?", a: "ScholarBridge AI is a free AI-powered platform that helps international students discover fully-funded scholarships for the UK, USA, Germany, and Canada." },
      { q: "Is the platform completely free?", a: "Yes. Students can browse scholarships, create accounts, and use core matching features without paying. There are no paywalls or premium tiers for students." },
      { q: "Who is this designed for?", a: "It is built for ambitious global students researching undergraduate, masters, and PhD funding opportunities abroad. We specifically target fully-funded and high-value awards." },
      { q: "Which destinations are covered?", a: "The current platform focuses meticulously on four destinations: the United Kingdom, United States, Germany, and Canada. This deep focus ensures all records remain verified." },
    ],
  },
  {
    category: "AI Matching Engine",
    items: [
      { q: "How does the AI matching work?", a: "Your profile is converted into a vector and compared against verified scholarship eligibility records to surface the most mathematically relevant opportunities." },
      { q: "Why might a match return low relevance?", a: "Profiles with limited academic detail provide weak input. Completing your field of study, degree level, and targeted country drastically improves result fidelity." },
      { q: "Does the AI invent scholarships?", a: "No. The matching process is strictly grounded in records stored and manually verified in our database. It cannot generate fake opportunities." },
      { q: "How should I read the match score?", a: "Treat the score as a relevance signal to guide your research, not a guarantee of selection. You must still review official eligibility criteria before applying." },
    ],
  },
  {
    category: "Verified Scholarships",
    items: [
      { q: "Are all scholarships legitimate and verified?", a: "Yes. Every single listing is manually curated, checked against official institutional policies, and linked directly to the primary source application page." },
      { q: "How many scholarships are tracked?", a: "The initial launch includes 20 verified flagship scholarships across the 4 core countries. We prioritize high-trust accuracy over inflated volume." },
      { q: "Can institutions suggest a scholarship?", a: "Yes. Use the contact page to submit formal suggestions for review. We only accept opportunities with transparent funding structures." },
      { q: "What happens to expired deadlines?", a: "Expired opportunities are updated immediately and removed from active discovery until their funding cycle opens again for the next academic year." },
    ],
  },
  {
    category: "Profiles & Tracking",
    items: [
      { q: "Do I need an account to browse?", a: "No. You can freely read the scholarship directory. An account is only required for AI matching, saving favorites, and full lifecycle application tracking." },
      { q: "How can I improve match accuracy?", a: "Maintain an updated profile. If you change your intended degree level or switch focus from STEM to Humanities, update your profile so the AI retrieves relevant results." },
      { q: "Can I manage application status?", a: "Yes. Logged-in students have access to an application tracker, which supports moving opportunities from 'Interested' through 'Applied', 'Interview', and 'Offer'." },
      { q: "Is my data sold to universities?", a: "No. We process your data exclusively to generate accurate matches. We do not sell your email, profile, or browsing history to third parties." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────
          HERO (Minimalist, High Contrast)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-paper border-b border-slate-200/70 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-6">
                Help & Documentation
              </p>
              <h1 className="text-[40px] sm:text-[46px] lg:text-[56px] text-slate-900 mb-6 leading-tight tracking-tight" style={SERIF}>
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl font-light">
                Documentation on how ScholarBridge AI works, our verification procedures, and how to get the most accurate matches from the platform.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          FAQ LIST (Editorial Detail/Summary structure)
          ────────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-24">
            
            {/* Left Rail Navigation / Info */}
            <div className="hidden lg:block relative">
              <div className="sticky top-32">
                <FadeIn direction="right">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-6">
                    Categories
                  </p>
                  <ul className="space-y-4">
                    {faqs.map((section) => (
                      <li key={section.category}>
                        <a 
                          href={`#${section.category.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
                        >
                          {section.category}
                        </a>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <MessageCircle className="w-5 h-5 text-slate-400 mb-4" />
                    <p className="text-sm text-slate-800 font-semibold mb-2">Still need help?</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Our support team monitors inquiries during UK business hours.
                    </p>
                    <a href="/contact" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
                      Contact us <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </FadeIn>
              </div>
            </div>

            {/* Right Main FAQ Content */}
            <div className="space-y-16 lg:space-y-24">
              {faqs.map((section, secIdx) => (
                <FadeIn key={section.category} delay={secIdx * 0.1}>
                  <div 
                    id={section.category.toLowerCase().replace(/\s+/g, "-")}
                    className="scroll-mt-32"
                  >
                    <h2 className="text-2xl text-slate-900 mb-6 border-b border-slate-200 pb-4" style={SERIF}>
                      {section.category}
                    </h2>
                    
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <FAQAccordionItem 
                          key={item.q} 
                          question={item.q} 
                          answer={item.a} 
                        />
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          CLOSING CTA (Consistent Dark Band)
          ────────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <FadeIn>
            <h2 className="text-3xl lg:text-5xl text-white mb-6 leading-tight" style={SERIF}>
              Didn&apos;t find your answer?
            </h2>
            <p className="text-slate-400 text-base lg:text-lg mb-10 max-w-xl mx-auto leading-relaxed font-light">
              Our team is dedicated to providing students with the clarity they need. Reach out and we&apos;ll get back to you with an answer.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </a>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
