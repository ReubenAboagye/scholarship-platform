"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";
import { Shield, Lock, Database, Cookie, UserCheck, AlertCircle, Mail } from "lucide-react";
import { useState, useEffect } from "react";

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;
const lastUpdated = "April 2026";

const sections = [
  {
    id: "information-collect",
    icon: Lock,
    title: "Information We Collect",
    content: [
      "Account information: When you register, we collect your name and email address for authentication purposes.",
      "Profile data: You may voluntarily provide your country of origin, field of study, degree level, GPA, and academic background to enable scholarship matching.",
      "Usage data: We collect anonymised data about how you interact with the platform — pages visited, scholarships viewed, and features used — to improve the service.",
      "We do not collect payment information, government-issued ID numbers, or sensitive financial data.",
    ],
  },
  {
    id: "information-use",
    icon: Database,
    title: "How We Use Your Information",
    content: [
      "To provide scholarship matching: Your profile data is processed by our matching engine to surface relevant opportunities.",
      "To operate your account: Name and email are used for authentication, account management, and service communications.",
      "To improve the platform: Anonymised usage data helps us understand which features are most useful to students.",
      "We never sell your personal data to third parties for advertising purposes.",
    ],
  },
  {
    id: "data-security",
    icon: Shield,
    title: "Data Storage and Security",
    content: [
      "Your data is stored in secure PostgreSQL databases hosted on encrypted cloud infrastructure.",
      "We implement Row Level Security (RLS) so you can only access your own data.",
      "Passwords are hashed and never stored in plain text.",
      "We use HTTPS/TLS encryption for all data in transit.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "Cookies",
    content: [
      "We use authentication cookies to maintain your login session.",
      "We do not use third-party advertising or tracking cookies.",
      "Session cookies are temporary and expire when you close your browser or sign out.",
    ],
  },
  {
    id: "your-rights",
    icon: UserCheck,
    title: "Your Rights",
    content: [
      "Access: You can view all profile data you have provided from your dashboard.",
      "Update: You can modify your profile information at any time.",
      "Deletion: You can request full account deletion. We will delete your data within 30 days of a verified request.",
      "Export: You can request a copy of your personal data at any time.",
    ],
  },
  {
    id: "children-privacy",
    icon: AlertCircle,
    title: "Children's Privacy",
    content: [
      "ScholarBridge is intended for users who are 16 years of age or older.",
      "We do not knowingly collect personal data from children under 16.",
    ],
  },
  {
    id: "changes",
    icon: Shield,
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. Significant changes will be communicated via the platform.",
      "Continued use of ScholarBridge after changes constitutes acceptance of the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const activeSectionData = sections.find(s => s.id === activeSection) || sections[0];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 size-[600px] bg-brand-500 rounded-full blur-3xl -tranzinc-y-1/2 tranzinc-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700/50 backdrop-blur-sm rounded-full border border-brand-500/30 mb-8">
              <Shield className="size-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-200">
                Official Legal Documentation
              </span>
            </div>
            <h1 className="text-[40px] sm:text-[46px] lg:text-[56px] text-white mb-6 leading-tight" style={SERIF}>
              Privacy Policy
            </h1>
            <p className="text-zinc-300 text-lg max-w-2xl mb-6">
              Your privacy is fundamental. This document outlines how we collect, use, and protect your personal information in accordance with data protection regulations.
            </p>
            <p className="text-zinc-400 text-sm font-medium">Last updated: {lastUpdated}</p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Sidebar Navigation */}
              <aside className="lg:w-72 flex-shrink-0">
                <nav className="lg:sticky lg:top-24 space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        activeSection === section.id
                          ? "bg-brand-600 text-white font-medium"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className="size-4 flex-shrink-0" />
                        <span className="text-sm">{section.title}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-card p-8 lg:p-12 mb-12">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="size-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Shield className="size-6 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900 mb-2">Our Commitment</h2>
                      <p className="text-zinc-600 leading-relaxed">
                        ScholarBridge is operated by GenTech Solutions. We are committed to protecting your privacy and ensuring the security of your personal data. This policy applies to all users of our platform.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-16">
                  {sections.map((section) => (
                    <div key={section.id} id={section.id} className="scroll-mt-24">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <section.icon className="size-5 text-brand-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-zinc-900" style={SERIF}>{section.title}</h2>
                      </div>
                      <ul className="space-y-4">
                        {section.content.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-zinc-600 leading-relaxed text-base">
                            <span className="size-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-2.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 rounded-xl p-8 text-white">
                    <div className="flex items-start gap-4">
                      <div className="size-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="size-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
                        <p className="text-zinc-300 mb-4">
                          For any privacy-related questions or requests, please contact us:
                        </p>
                        <a href="mailto:support@gentechmart.shop" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium">
                          <Mail className="size-4" />
                          support@gentechmart.shop
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
