import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ScholarMatch — Find Your Scholarship", template: "%s | ScholarMatch" },
  description:
    "AI-powered scholarship discovery for students pursuing higher education in the UK, USA, Germany, and Canada. Get matched to fully-funded opportunities in seconds.",
  keywords: ["scholarship", "international scholarship", "AI scholarship finder", "study abroad funding"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
