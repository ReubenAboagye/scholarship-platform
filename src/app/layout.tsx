import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ScholarBridge — Find Your Scholarship", template: "%s | ScholarBridge" },
  description:
    "Scholarship discovery for students pursuing higher education in the UK, USA, Germany, and Canada. Verified opportunities, direct application links, matched to your profile.",
  keywords: ["scholarship", "international scholarship", "scholarship finder", "study abroad funding"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter for body/UI, Fraunces for editorial display headlines */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
