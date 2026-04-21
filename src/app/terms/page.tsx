import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Terms of Use | ScholarBridge AI",
  description: "Terms and conditions for using the ScholarBridge AI platform."
};

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;
const lastUpdated = "April 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-paper border-b border-slate-200/70 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-6">Legal Documentation</p>
            <h1 className="text-[40px] sm:text-[46px] lg:text-[56px] text-slate-900 mb-6 leading-tight tracking-tight" style={SERIF}>
              Terms of Use
            </h1>
            <p className="text-slate-500 text-sm font-medium">Last updated: {lastUpdated}</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <div className="prose prose-slate max-w-none space-y-12">

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 font-bold text-6xl" style={SERIF}>!</div>
                <p className="text-lg text-slate-700 leading-relaxed font-light italic relative z-10">
                  By accessing or using ScholarBridge AI, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform. These terms are governed by the laws of Ghana.
                </p>
              </div>

              {[
                {
                  title: "1. Acceptance of Terms",
                  content: [
                    "These Terms of Use form a legally binding agreement between you and GenTech Solutions, the developers of ScholarBridge AI.",
                    "By creating an account or using any feature of the platform, you confirm that you have read, understood, and agreed to these terms.",
                    "We reserve the right to update these terms at any time. Continued use of the platform after changes are posted constitutes acceptance.",
                  ],
                },
                {
                  title: "2. Use of the Platform",
                  content: [
                    "ScholarBridge AI is provided for personal, non-commercial use by students seeking scholarship opportunities.",
                    "You agree not to misuse the platform — including attempting to reverse-engineer, scrape, or automate access to its content.",
                    "You are responsible for maintaining the security of your account credentials.",
                    "You must be at least 16 years old to create an account.",
                  ],
                },
                {
                  title: "3. Scholarship Information",
                  content: [
                    "ScholarBridge AI curates and presents scholarship information in good faith. We make every reasonable effort to ensure accuracy.",
                    "However, scholarship details — including deadlines, eligibility criteria, and funding amounts — may change. We strongly recommend verifying all information directly with the scholarship provider before applying.",
                    "ScholarBridge AI is not responsible for missed deadlines, rejected applications, or changes to scholarship terms made by third-party providers.",
                  ],
                },
                {
                  title: "4. AI Matching Disclaimer",
                  content: [
                    "Match scores and AI-generated explanations are provided as guidance only and do not constitute a guarantee of eligibility or success.",
                    "AI matching is based on the information you provide in your profile. Accuracy improves with a complete profile.",
                    "You are responsible for verifying your eligibility against each scholarship's official criteria before applying.",
                  ],
                },
                {
                  title: "5. User Accounts",
                  content: [
                    "You are responsible for all activity that occurs under your account.",
                    "You agree to provide accurate and current information when creating your profile.",
                    "We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behaviour.",
                  ],
                },
                {
                  title: "6. Intellectual Property",
                  content: [
                    "All content on ScholarBridge AI — including the platform design, code, copy, and branding — is owned by GenTech Solutions and protected by copyright.",
                    "Scholarship descriptions sourced from public scholarship provider websites remain the intellectual property of their respective owners.",
                    "You may not reproduce, distribute, or create derivative works from ScholarBridge AI content without written permission.",
                  ],
                },
                {
                  title: "7. Limitation of Liability",
                  content: [
                    "ScholarBridge AI is provided 'as is' without warranties of any kind, express or implied.",
                    "GenTech Solutions is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.",
                    "We are not responsible for actions taken by scholarship providers, outcomes of applications, or third-party website content.",
                  ],
                },
                {
                  title: "8. Governing Law",
                  content: [
                    "These terms are governed by the laws of the Republic of Ghana.",
                    "Any disputes arising from these terms or your use of the platform shall be resolved under Ghanaian jurisdiction.",
                  ],
                },
                {
                  title: "9. Contact",
                  content: [
                    "For any questions regarding these Terms of Use, contact us at: support@gentechmart.shop",
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="pt-8 border-t border-slate-100">
                  <h2 className="text-2xl text-slate-900 mb-6" style={SERIF}>{section.title}</h2>
                  <ul className="space-y-4">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-slate-600 leading-relaxed font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-2.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
