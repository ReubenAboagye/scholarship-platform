import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Privacy Policy | ScholarBridge AI",
  description: "How we collect, use, and protect your data at ScholarBridge AI."
};

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;
const lastUpdated = "April 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-paper border-b border-slate-200/70 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-6">Legal Documentation</p>
            <h1 className="text-[40px] sm:text-[46px] lg:text-[56px] text-slate-900 mb-6 leading-tight tracking-tight" style={SERIF}>
              Privacy Policy
            </h1>
            <p className="text-slate-500 text-sm font-medium">Last updated: {lastUpdated}</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <div className="prose prose-slate max-w-none space-y-12">

              <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24 text-brand-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
                </div>
                <p className="text-lg text-slate-700 leading-relaxed font-light italic relative z-10">
                  ScholarBridge AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by GenTech Solutions. This Privacy Policy explains how we collect, use, and protect your information when you use ScholarBridge AI and related services.
                </p>
              </div>

              {[
                {
                  title: "1. Information We Collect",
                  content: [
                    "Account information: When you register, we collect your name and email address.",
                    "Profile data: You may voluntarily provide your country of origin, field of study, degree level, GPA, and academic background to enable AI scholarship matching.",
                    "Usage data: We collect anonymised data about how you interact with the platform — pages visited, scholarships viewed, and features used — to improve the service.",
                    "We do not collect payment information, government-issued ID numbers, or sensitive financial data.",
                  ],
                },
                {
                  title: "2. How We Use Your Information",
                  content: [
                    "To provide scholarship matching: Your profile data is processed by our AI matching engine to surface relevant opportunities.",
                    "To operate your account: Name and email are used for authentication, account management, and service communications.",
                    "To improve the platform: Anonymised usage data helps us understand which features are most useful.",
                    "We never sell your personal data to third parties for advertising purposes.",
                  ],
                },
                {
                  title: "3. AI Processing",
                  content: [
                    "When you run AI matching, your profile text is processed through secure API endpoints (OpenAI and OpenRouter) to generate embeddings and matching logic.",
                    "We do not use your personal data to train large language models.",
                    "Embedding vectors are stored in our secure database and are not human-readable.",
                  ],
                },
                {
                  title: "4. Data Storage and Security",
                  content: [
                    "Your data is stored in secure PostgreSQL databases hosted on encrypted cloud infrastructure.",
                    "We implement Row Level Security (RLS) so you can only access your own data.",
                    "Passwords are hashed and never stored in plain text.",
                    "We use HTTPS/TLS encryption for all data in transit.",
                  ],
                },
                {
                  title: "5. Cookies",
                  content: [
                    "We use authentication cookies to maintain your login session.",
                    "We do not use third-party advertising or tracking cookies.",
                    "Session cookies are temporary and expire when you close your browser or sign out.",
                  ],
                },
                {
                  title: "6. Your Rights",
                  content: [
                    "Access: You can view all profile data you have provided from your dashboard.",
                    "Update: You can modify your profile information at any time.",
                    "Deletion: You can request full account deletion. We will delete your data within 30 days of a verified request.",
                    "Export: You can request a copy of your personal data at any time.",
                  ],
                },
                {
                  title: "7. Children's Privacy",
                  content: [
                    "ScholarBridge AI is intended for users who are 16 years of age or older.",
                    "We do not knowingly collect personal data from children under 16.",
                  ],
                },
                {
                  title: "8. Changes to This Policy",
                  content: [
                    "We may update this Privacy Policy from time to time. Significant changes will be communicated via the platform.",
                    "Continued use of ScholarBridge AI after changes constitutes acceptance of the updated policy.",
                  ],
                },
                {
                  title: "9. Contact",
                  content: [
                    "For any privacy-related questions or requests, contact us at: support@gentechmart.shop",
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
