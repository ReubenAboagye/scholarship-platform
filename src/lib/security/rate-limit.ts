const matchCooldowns = new Map<string, number>();

export function consumeCooldown(key: string, windowMs: number) {
  const now = Date.now();
  const lastSeen = matchCooldowns.get(key) ?? 0;
  const retryAfterMs = Math.max(0, lastSeen + windowMs - now);

  if (retryAfterMs > 0) {
    return {
      allowed: false as const,
      retryAfterMs,
    };
  }

  matchCooldowns.set(key, now);

  // Keep the in-memory map bounded for long-lived processes.
  if (matchCooldowns.size > 5000) {
    for (const [entryKey, timestamp] of matchCooldowns.entries()) {
      if (now - timestamp > windowMs * 2) matchCooldowns.delete(entryKey);
    }
  }

  return {
    allowed: true as const,
    retryAfterMs: 0,
  };
}
