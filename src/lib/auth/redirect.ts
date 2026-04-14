export function sanitizeRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}
