// ─────────────────────────────────────────────────────────────
// URL-driven state helpers for admin data-table pages.
//
// Keeps filter / search / page state in the URL so it survives
// refresh and can be shared. Used by users, scholarships, and
// audit pages.
// ─────────────────────────────────────────────────────────────

export function readArrayParam(
  sp: URLSearchParams,
  key: string,
  allowed: readonly string[],
): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw.split(",").filter((v) => allowed.includes(v));
}

export function readStringParam<T extends string>(
  sp: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = sp.get(key);
  return (raw && (allowed as readonly string[]).includes(raw)
    ? raw
    : fallback) as T;
}

export function readIntParam(
  sp: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const raw = sp.get(key);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}
