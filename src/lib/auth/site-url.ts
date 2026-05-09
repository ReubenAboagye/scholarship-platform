import { headers } from "next/headers";

export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");

  if (host) {
    const isLocalhost =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const forwardedProto = h.get("x-forwarded-proto");
    const proto = isLocalhost ? "http" : (forwardedProto ?? "https");
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
