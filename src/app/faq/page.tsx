import Image from "next/image";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import FAQInteractive from "@/components/faq/FAQInteractive";
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

      {/* Interactive Hero and FAQ List */}
      <FAQInteractive faqs={faqs} />

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
