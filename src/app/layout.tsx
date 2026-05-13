import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import PageViewTracker from "@/components/tracking/PageViewTracker";
import ServiceWorkerRegister from "@/components/tracking/ServiceWorkerRegister";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridgeai.netlify.app";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ScholarBridge — Find Your Scholarship", template: "%s | ScholarBridge" },
  description:
    "Scholarship discovery for students pursuing higher education in the UK, USA, Germany, and Canada. Verified opportunities, direct application links, matched to your profile.",
  keywords: ["scholarship", "international scholarship", "scholarship finder", "study abroad funding"],
  verification: {
    google: "goMoxBw1rpkbCyFAH_jITdw0bmLF4BkYFFitr2p-yPY",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "ScholarBridge",
    url: siteUrl,
    title: "ScholarBridge — Find Your Scholarship",
    description:
      "Verified scholarships for study in the UK, USA, Germany, and Canada, with profile-based discovery and direct application links.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "ScholarBridge" }],
  },
  twitter: {
    card: "summary",
    title: "ScholarBridge — Find Your Scholarship",
    description:
      "Verified scholarships for study in the UK, USA, Germany, and Canada.",
    images: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ScholarBridge",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head />
      <body>
        {/*
          PageViewTracker logs navigation to Supabase via a
          SECURITY DEFINER RPC. It respects Do Not Track and
          skips bot UAs. Wrapped in Suspense because it uses
          useSearchParams() which requires a boundary in Next 15.
          See /PRIVACY.md for the privacy posture.
        */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
