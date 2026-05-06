import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();

  // Netlify sets this header at the edge — trusted because they control the proxy
  const nfIp = h.get("x-nf-client-connection-ip");
  if (nfIp) return nfIp.trim();

  // Fallback for other environments (Vercel, self-hosted, etc.)
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
