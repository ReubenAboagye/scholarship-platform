/**
 * generate-embeddings.ts
 * ============================================================
 * Run ONCE after seeding the scholarships table to generate
 * OpenAI embeddings and store them in Supabase pgvector.
 *
 * NOTE: Uses OpenAI directly for embeddings.
 *       OpenRouter does NOT support the embeddings endpoint.
 *
 * Usage:
 *   pnpm tsx scripts/generate-embeddings.ts
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
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

// Embeddings must use OpenAI directly — OpenRouter does not support this endpoint
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function buildScholarshipText(s: any): Promise<string> {
  const parts = [
    `Scholarship name: ${s.name}`,
    `Provider: ${s.provider}`,
    `Country: ${s.country}`,
    `Funding type: ${s.funding_type}`,
    `Funding amount: ${s.funding_amount}`,
    `Degree levels: ${s.degree_levels?.join(", ")}`,
    `Fields of study: ${s.fields_of_study?.join(", ")}`,
    `Description: ${s.description}`,
    `Eligibility: ${s.eligibility_criteria?.join(". ")}`,
  ];
  return parts.join("\n");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  console.log("🔍 Fetching scholarships without embeddings...");

  const { data: scholarships, error } = await supabase
    .from("scholarships")
    .select("*")
    .is("embedding", null)
    .eq("is_active", true);

  if (error) { console.error("Fetch error:", error); process.exit(1); }
  if (!scholarships || scholarships.length === 0) {
    console.log("✅ All scholarships already have embeddings."); return;
  }

  console.log(`📝 Generating embeddings for ${scholarships.length} scholarships...\n`);

  for (const scholarship of scholarships) {
    try {
      const text      = await buildScholarshipText(scholarship);
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

      // Respect rate limits
      await new Promise((r) => setTimeout(r, 50));
    } catch (err: any) {
      console.error(`❌ ${scholarship.name}: ${err.message}`);
    }
  }

  console.log("\n🎉 Embedding generation complete!");
}

main().catch(console.error);
