// @ts-nocheck
// ============================================================
// supabase/functions/generate-embedding/index.ts
//
// Called automatically by a Postgres trigger whenever a new
// scholarship is inserted or an existing one is updated with
// a NULL embedding.
//
// It builds the same rich text representation used in the
// manual script, calls OpenRouter → text-embedding-3-small,
// then writes the 1536-dim vector back to the row.
//
// Hardening:
//   • Only accepts requests bearing the service-role key.
//   • Rejects payloads > 1 KB (prevents large-body DoS).
//   • Strict UUID validation on scholarship_id.
//   • Per-IP rate limiting (max 10 req / 60 s).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const MAX_BODY_BYTES = 1_024; // 1 KB
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Simple in-memory rate limiter: IP -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ── Auth guard ─────────────────────────────────────────────
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;
  return parts[1] === SUPABASE_KEY;
}

// ── Text builder — mirrors scripts/generate-embeddings.ts ──
function buildScholarshipText(s: Record<string, unknown>): string {
  return [
    `Scholarship name: ${s.name}`,
    `Provider: ${s.provider}`,
    `Country: ${s.country}`,
    `Funding type: ${s.funding_type}`,
    `Funding amount: ${s.funding_amount}`,
    `Degree levels: ${(s.degree_levels as string[])?.join(", ")}`,
    `Fields of study: ${(s.fields_of_study as string[])?.join(", ")}`,
    `Description: ${s.description}`,
    `Eligibility: ${(s.eligibility_criteria as string[])?.join(". ")}`,
  ].join("\n");
}

// ── Generate embedding via OpenRouter ──────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://scholarbridgeai.netlify.app",
      "X-Title": "ScholarBridge AI",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter embeddings error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

// ── Main handler ───────────────────────────────────────────
Deno.serve(async (req: Request) => {
  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // 1. Authorisation (service-role key or shared secret)
    if (!isAuthorized(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Body-size guard (before parsing)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }
    // Fallback for chunked bodies: read stream and enforce limit
    const bodyBuf = await req.arrayBuffer();
    if (bodyBuf.byteLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Payload too large" }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Rate limit by caller IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
               req.headers.get("x-real-ip") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Parse & validate payload
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(new TextDecoder().decode(bodyBuf));
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const scholarshipId = body.scholarship_id;
    if (typeof scholarshipId !== "string" || !UUID_RE.test(scholarshipId)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid scholarship_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use service role key — this runs server-side only, never exposed
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch the scholarship row
    const { data: scholarship, error: fetchError } = await supabase
      .from("scholarships")
      .select("*")
      .eq("id", scholarshipId)
      .single();

    if (fetchError || !scholarship) {
      return new Response(
        JSON.stringify({ error: fetchError?.message ?? "Scholarship not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build text and generate embedding
    const text = buildScholarshipText(scholarship);
    const embedding = await generateEmbedding(text);

    // Write vector back to the row
    const { error: updateError } = await supabase
      .from("scholarships")
      .update({ embedding })
      .eq("id", scholarshipId);

    if (updateError) throw updateError;

    console.log(`✅ Embedding generated for: ${scholarship.name}`);

    return new Response(
      JSON.stringify({ success: true, scholarship: scholarship.name }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ generate-embedding error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
