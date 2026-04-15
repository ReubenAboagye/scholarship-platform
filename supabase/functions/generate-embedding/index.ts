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
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY       = Deno.env.get("SERVICE_ROLE_KEY")!;

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
      "Content-Type":  "application/json",
      "HTTP-Referer":  "https://scholarmatch.app",
      "X-Title":       "ScholarMatch",
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

    const body = await req.json();
    const scholarshipId: string = body.scholarship_id;

    if (!scholarshipId) {
      return new Response(
        JSON.stringify({ error: "Missing scholarship_id" }),
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
    const text      = buildScholarshipText(scholarship);
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
