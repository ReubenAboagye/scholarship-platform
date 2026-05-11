import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

const limiters = new Map<string, Ratelimit>();
const memoryBuckets = new Map<string, { count: number; reset: number }>();

function getLimiter(namespace: string, maxRequests: number, windowSeconds: number) {
  const key = `${namespace}_${maxRequests}_${windowSeconds}`;
  if (!limiters.has(key)) {
    if (!redis) {
      // No Redis configured — use a per-process fallback for local/dev.
      return null;
    }
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        analytics: true,
        prefix: `sb_ratelimit_${namespace}`,
      })
    );
  }
  return limiters.get(key)!;
}

export async function rateLimitByIp(
  ip: string,
  namespace: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; reset: number }> {
  return rateLimitByKey(ip, namespace, maxRequests, windowSeconds);
}

export async function rateLimitByKey(
  key: string,
  namespace: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; reset: number }> {
  const limiter = getLimiter(namespace, maxRequests, windowSeconds);
  if (!limiter) {
    const now = Date.now();
    const bucketKey = `${namespace}:${key}`;
    const existing = memoryBuckets.get(bucketKey);
    if (!existing || existing.reset <= now) {
      const reset = now + windowSeconds * 1000;
      memoryBuckets.set(bucketKey, { count: 1, reset });
      return { allowed: true, reset };
    }
    existing.count += 1;
    return { allowed: existing.count <= maxRequests, reset: existing.reset };
  }
  const { success, reset } = await limiter.limit(key);
  return { allowed: success, reset };
}
