/**
 * Returns a safe in-app redirect path.
 * - Must start with a single "/" (no protocol-relative or external URLs)
 * - Must not point at `/auth/*` (would cause post-login redirect loops)
 * - Must not contain backslashes or control characters
 */
export function sanitizeRedirectPath(next: string | null | undefined): string {
  const FALLBACK = "/dashboard";
  if (!next || typeof next !== "string") return FALLBACK;
  if (!next.startsWith("/")) return FALLBACK;
  if (next.startsWith("//") || next.startsWith("/\\")) return FALLBACK;

  // Strip query/hash before path checks
  const pathOnly = next.split("?")[0].split("#")[0];

  // Block auth pages — redirecting to /auth/* after login causes loops
  if (pathOnly === "/auth" || pathOnly.startsWith("/auth/")) return FALLBACK;

  // Reject anything containing backslashes or control chars
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\\]/.test(next)) return FALLBACK;

  return next;
}
