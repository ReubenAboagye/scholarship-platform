import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import PageViewTracker from "@/components/tracking/PageViewTracker";

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
  title: { default: "ScholarBridge — Find Your Scholarship", template: "%s | ScholarBridge" },
  description:
    "Scholarship discovery for students pursuing higher education in the UK, USA, Germany, and Canada. Verified opportunities, direct application links, matched to your profile.",
  keywords: ["scholarship", "international scholarship", "scholarship finder", "study abroad funding"],
  verification: {
    google: "goMoxBw1rpkbCyFAH_jITdw0bmLF4BkYFFitr2p-yPY",
  },
  manifest: "/manifest.json",
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
        {process.env.NODE_ENV === 'production' && (
          <Script
            id="sw-register"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('SW registration failed:', err);
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
