/**
 * generate-embeddings.ts
 * ============================================================
 * Generates embeddings for all scholarships using OpenRouter.
 * Uses openai/text-embedding-3-small via OpenRouter with Matryoshka
 * truncation to 768 dimensions. Matches the vector(768) column.
 *
 * Usage:
 *   pnpm tsx scripts/generate-embeddings.ts
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route embeddings through OpenRouter — no separate OpenAI billing needed
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://scholarbridgeai.netlify.app",
    "X-Title": "ScholarBridge AI",
  },
});

function buildScholarshipText(s: any): string {
  return [
    `Scholarship name: ${s.name}`,
    `Provider: ${s.provider}`,
    `Country: ${s.country}`,
    `Funding type: ${s.funding_type}`,
    `Funding amount: ${s.funding_amount}`,
    `Degree levels: ${s.degree_levels?.join(", ")}`,
    `Fields of study: ${s.fields_of_study?.join(", ")}`,
    `Description: ${s.description}`,
    `Eligibility: ${s.eligibility_criteria?.join(". ")}`,
  ].join("\n");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text,
    // @ts-ignore — OpenRouter supports dimensions param for Matryoshka truncation
    dimensions: 768,
  });
  const embedding = response.data[0].embedding;
  // Fallback: if OpenRouter returned 1536d anyway, truncate to 768
  return embedding.length === 768 ? embedding : embedding.slice(0, 768);
}

async function main() {
  console.log("🔍 Fetching scholarships without embeddings...");

  const { data: scholarships, error } = await supabase
    .from("scholarships")
    .select("*")
    .is("embedding", null)
    .eq("is_active", true);

  if (error) { console.error("Fetch error:", error); process.exit(1); }
  if (!scholarships?.length) {
    console.log("All scholarships already have embeddings.");
    return;
  }

  console.log(`Generating embeddings for ${scholarships.length} scholarships...\n`);

  for (const scholarship of scholarships) {
    try {
      const text = buildScholarshipText(scholarship);
      const embedding = await generateEmbedding(text);

      const { error: updateError } = await supabase
        .from("scholarships")
        .update({ embedding })
        .eq("id", scholarship.id);

      if (updateError) {
        console.error(`❌ ${scholarship.name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${scholarship.name}`);
      }

      // Small delay to stay within rate limits
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      console.error(`❌ ${scholarship.name}: ${err.message}`);
    }
  }

  console.log("\n🎉 Embedding generation complete!");
}

main().catch(console.error);
