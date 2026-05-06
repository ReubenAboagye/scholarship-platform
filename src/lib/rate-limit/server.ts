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

function getLimiter(namespace: string, maxRequests: number, windowSeconds: number) {
  const key = `${namespace}_${maxRequests}_${windowSeconds}`;
  if (!limiters.has(key)) {
    if (!redis) {
      // No Redis configured — dev fallback that always allows
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
  const limiter = getLimiter(namespace, maxRequests, windowSeconds);
  if (!limiter) {
    return { allowed: true, reset: 0 };
  }
  const { success, reset } = await limiter.limit(ip);
  return { allowed: success, reset };
}
