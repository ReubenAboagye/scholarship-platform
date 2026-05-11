import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridge-ai.netlify.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/scholarships", "/destinations", "/about", "/faq", "/contact"],
        disallow: ["/admin", "/dashboard", "/onboarding", "/auth"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
