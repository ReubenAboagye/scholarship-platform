import { headers } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const LOCALHOST_DEFAULT = "http://localhost:3000";

/**
 * Returns the canonical application origin.
 *
 * In production we always use NEXT_PUBLIC_APP_URL so that a poisoned Host
 * header can never influence signup/reset/callback URLs.
 *
 * We only derive the origin from the request when running on localhost,
 * where NEXT_PUBLIC_APP_URL may not be set or may point to a deployed
 * preview while the dev server runs locally.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const isLocalhost =
    !!host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));

  if (isLocalhost) {
    const forwardedProto = h.get("x-forwarded-proto");
    const proto = forwardedProto ?? "http";
    return `${proto}://${host}`;
  }

  return APP_URL ?? LOCALHOST_DEFAULT;
}
