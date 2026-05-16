import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/auth/ip";
import { rateLimitByIp, rateLimitByKey } from "@/lib/rate-limit/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/server/body-size";

const pageViewSchema = z.object({
  p_path: z.string().min(1).max(500),
  p_session_id: z.string().max(64).nullable().optional(),
  p_referrer: z.string().max(500).nullable().optional(),
  p_user_agent: z.string().max(500).nullable().optional(),
  p_device_type: z.enum(["mobile", "tablet", "desktop", "bot"]).nullable().optional(),
  p_browser: z.string().max(64).nullable().optional(),
  p_os: z.string().max(64).nullable().optional(),
  p_country: z.string().max(8).nullable().optional(),
  p_utm_source: z.string().max(100).nullable().optional(),
  p_utm_medium: z.string().max(100).nullable().optional(),
  p_utm_campaign: z.string().max(100).nullable().optional(),
  p_utm_term: z.string().max(100).nullable().optional(),
  p_utm_content: z.string().max(100).nullable().optional(),
  p_scroll_depth: z.number().int().min(0).max(100).nullable().optional(),
  p_duration_ms: z.number().int().min(0).max(86_400_000).nullable().optional(),
});

function tooManyRequests(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many tracking events." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonBody(request, 8_192);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = pageViewSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid page view payload" }, { status: 400 });
  }

  const ip = await getClientIp();
  const sessionId = parsed.data.p_session_id?.trim();
  const [ipLimit, sessionLimit] = await Promise.all([
    rateLimitByIp(ip, "pageview_ip", 240, 5 * 60),
    sessionId
      ? rateLimitByKey(sessionId, "pageview_session", 120, 5 * 60)
      : Promise.resolve({ allowed: true, reset: Date.now() }),
  ]);

  if (!ipLimit.allowed) return tooManyRequests(ipLimit.reset);
  if (!sessionLimit.allowed) return tooManyRequests(sessionLimit.reset);

  const sessionSupabase = await createClient();
  const { data: { user } } = await sessionSupabase.auth.getUser();

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.from("page_views").insert({
    user_id: user?.id ?? null,
    session_id: parsed.data.p_session_id ?? null,
    path: parsed.data.p_path,
    referrer: parsed.data.p_referrer ?? null,
    user_agent: parsed.data.p_user_agent ?? null,
    device_type: parsed.data.p_device_type ?? null,
    browser: parsed.data.p_browser ?? null,
    os: parsed.data.p_os ?? null,
    country: parsed.data.p_country ?? null,
    utm_source: parsed.data.p_utm_source ?? null,
    utm_medium: parsed.data.p_utm_medium ?? null,
    utm_campaign: parsed.data.p_utm_campaign ?? null,
    utm_term: parsed.data.p_utm_term ?? null,
    utm_content: parsed.data.p_utm_content ?? null,
    scroll_depth: parsed.data.p_scroll_depth ?? null,
    duration_ms: parsed.data.p_duration_ms ?? null,
  });
  if (error) {
    console.warn("page view insert failed:", error);
    return NextResponse.json({ error: "Unable to record page view" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
