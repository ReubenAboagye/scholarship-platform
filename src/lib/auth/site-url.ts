import { headers } from "next/headers";

export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const forwardedProto = h.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${forwardedProto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
