import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ScholarBridge collects, uses, protects, and retains account, profile, security, and analytics data.",
  openGraph: {
    title: "Privacy Policy | ScholarBridge",
    description: "How ScholarBridge handles account, profile, security, and analytics data.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
