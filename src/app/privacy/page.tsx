import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const lastUpdated = "April 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-8">

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-800 font-medium">
                ScholarMatch (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by GenTech Solutions. This Privacy Policy explains how we collect, use, and protect your information when you use ScholarMatch at scholarmatch.com and related services.
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
                  "When you run AI matching, your profile text is sent to OpenAI's API to generate embeddings (vector representations) and to OpenRouter for generating explanations.",
                  "We do not use your personal data to train AI models.",
                  "OpenAI and OpenRouter process data in accordance with their own privacy policies.",
                  "Embedding vectors are stored in our Supabase database and are not human-readable.",
                ],
              },
              {
                title: "4. Data Storage and Security",
                content: [
                  "Your data is stored in Supabase (PostgreSQL) hosted on secure cloud infrastructure.",
                  "We implement Row Level Security (RLS) so you can only access your own data.",
                  "Passwords are hashed by Supabase Auth and never stored in plain text.",
                  "We use HTTPS/TLS encryption for all data in transit.",
                ],
              },
              {
                title: "5. Cookies",
                content: [
                  "We use authentication cookies managed by Supabase Auth to maintain your login session.",
                  "We do not use third-party advertising or tracking cookies.",
                  "Session cookies are temporary and expire when you close your browser or sign out.",
                ],
              },
              {
                title: "6. Your Rights",
                content: [
                  "Access: You can view all profile data you have provided from your dashboard.",
                  "Update: You can modify your profile information at any time.",
                  "Deletion: You can request full account deletion by contacting us at support@gentechmart.shop. We will delete your data within 30 days.",
                  "Export: You can request a copy of your personal data at any time.",
                ],
              },
              {
                title: "7. Children's Privacy",
                content: [
                  "ScholarMatch is intended for users who are 16 years of age or older.",
                  "We do not knowingly collect personal data from children under 16.",
                ],
              },
              {
                title: "8. Changes to This Policy",
                content: [
                  "We may update this Privacy Policy from time to time. Significant changes will be communicated via email or a prominent notice on the platform.",
                  "Continued use of ScholarMatch after changes constitutes acceptance of the updated policy.",
                ],
              },
              {
                title: "9. Contact",
                content: [
                  "For any privacy-related questions or requests, contact us at: support@gentechmart.shop",
                ],
              },
            ].map((section) => (
              <div key={section.title}>
                <h2 className="text-lg font-black text-slate-900 mb-3">{section.title}</h2>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
