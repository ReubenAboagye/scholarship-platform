import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarbridge-ai.netlify.app";

const routes = [
  "",
  "/scholarships",
  "/destinations",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/scholarships" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/scholarships" ? 0.9 : 0.6,
  }));
}
