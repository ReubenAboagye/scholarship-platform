import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

const lastUpdated = "April 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#e8f5f0] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Terms of Use</h1>
          <p className="text-slate-500 text-sm">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-sm leading-relaxed">

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-800 font-medium">
                By accessing or using ScholarMatch, you agree to be bound by these Terms of Use. If you do not agree, please do not use the platform. These terms are governed by the laws of Ghana.
              </p>
            </div>

            {[
              {
                title: "1. Acceptance of Terms",
                content: [
                  "These Terms of Use form a legally binding agreement between you and GenTech Solutions, the developers of ScholarMatch.",
                  "By creating an account or using any feature of the platform, you confirm that you have read, understood, and agreed to these terms.",
                  "We reserve the right to update these terms at any time. Continued use of the platform after changes are posted constitutes acceptance.",
                ],
              },
              {
                title: "2. Use of the Platform",
                content: [
                  "ScholarMatch is provided for personal, non-commercial use by students seeking scholarship opportunities.",
                  "You agree not to misuse the platform — including attempting to reverse-engineer, scrape, or automate access to its content.",
                  "You are responsible for maintaining the security of your account credentials.",
                  "You must be at least 16 years old to create an account.",
                ],
              },
              {
                title: "3. Scholarship Information",
                content: [
                  "ScholarMatch curates and presents scholarship information in good faith. We make every reasonable effort to ensure accuracy.",
                  "However, scholarship details — including deadlines, eligibility criteria, and funding amounts — may change. We strongly recommend verifying all information directly with the scholarship provider before applying.",
                  "ScholarMatch is not responsible for missed deadlines, rejected applications, or changes to scholarship terms made by third-party providers.",
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
                  "All content on ScholarMatch — including the platform design, code, copy, and branding — is owned by GenTech Solutions and protected by copyright.",
                  "Scholarship descriptions sourced from public scholarship provider websites remain the intellectual property of their respective owners.",
                  "You may not reproduce, distribute, or create derivative works from ScholarMatch content without written permission.",
                ],
              },
              {
                title: "7. Limitation of Liability",
                content: [
                  "ScholarMatch is provided 'as is' without warranties of any kind, express or implied.",
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
