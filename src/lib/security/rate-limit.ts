import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitRow = {
  allowed: boolean;
  retry_after_ms: number;
};

export async function consumeUserCooldown(
  supabase: SupabaseClient,
  bucket: string,
  windowMs: number
) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const { data, error } = await supabase.rpc("consume_user_rate_limit", {
    bucket_name: bucket,
    window_seconds: windowSeconds,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? (data[0] as RateLimitRow | undefined) : undefined;
  return {
    allowed: row?.allowed ?? false,
    retryAfterMs: row?.retry_after_ms ?? windowMs,
  };
}
