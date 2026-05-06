const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export interface RateLimitState {
  blocked: boolean;
  minutesLeft: number;
}

export function getRateLimitState(key: string): RateLimitState {
  if (typeof window === "undefined") return { blocked: false, minutesLeft: 0 };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { blocked: false, minutesLeft: 0 };
    const { count, timestamp } = JSON.parse(raw) as { count: number; timestamp: number };
    const now = Date.now();
    if (now - timestamp > WINDOW_MS) {
      localStorage.removeItem(key);
      return { blocked: false, minutesLeft: 0 };
    }
    if (count >= MAX_ATTEMPTS) {
      return { blocked: true, minutesLeft: Math.ceil((WINDOW_MS - (now - timestamp)) / 60000) };
    }
    return { blocked: false, minutesLeft: 0 };
  } catch {
    return { blocked: false, minutesLeft: 0 };
  }
}

export function recordAttempt(key: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(key);
    const now = Date.now();
    if (!raw) {
      localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
      return;
    }
    const { count, timestamp } = JSON.parse(raw) as { count: number; timestamp: number };
    localStorage.setItem(key, JSON.stringify({ count: count + 1, timestamp }));
  } catch {
    /* noop */
  }
}

export function clearAttempts(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
