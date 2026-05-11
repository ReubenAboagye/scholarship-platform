import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ScholarBridge for support, scholarship suggestions, technical issues, and partnership enquiries.",
  openGraph: {
    title: "Contact ScholarBridge",
    description:
      "Get help with ScholarBridge, suggest a scholarship, or contact us about partnerships.",
    url: "/contact",
  },
  twitter: {
    card: "summary",
    title: "Contact ScholarBridge",
    description: "Get support or suggest a verified scholarship.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
