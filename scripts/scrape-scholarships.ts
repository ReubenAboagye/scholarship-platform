/**
 * scrape-scholarships.ts
 * ============================================================
 * Crawls trusted scholarship sources (scholarship-sources.ts),
 * discovers individual scholarship pages, extracts structured
 * data via OpenRouter LLM (JSON schema), and upserts into
 * `scholarships`.
 *
 * Embeddings are NOT generated here — the existing DB trigger
 * (trg_scholarship_embedding, see migration 007) fires
 * automatically on INSERT/UPDATE of name/description/eligibility/
 * funding_type/funding_amount/degree_levels/fields_of_study/country
 * and calls the generate-embedding Edge Function.
 *
 * "Verified" gate: verified_at is set only when the record passes
 * all checks below. Per client decision, everything still goes
 * live immediately (is_active stays true) — verified_at = NULL
 * is the audit flag, surfaced in the admin dashboard via:
 *   WHERE ingestion_method = 'scraped' AND verified_at IS NULL
 *
 * Usage:
 *   pnpm tsx scripts/scrape-scholarships.ts
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";
import { createHash } from "crypto";
import { TRUSTED_SOURCES } from "./scholarship-sources";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://scholarbridgeai.netlify.app",
    "X-Title": "ScholarBridge AI Scraper",
  },
});

const MAX_PAGES_PER_SOURCE = 30; // safety cap on OpenRouter spend per run
const REQUEST_DELAY_MS = 1500; // politeness delay between page fetches per domain

// ── Extraction schema — mirrors the real `scholarships` columns ──
const EXTRACTION_INSTRUCTIONS = `You extract structured scholarship data from a web page's text content.
Return ONLY valid JSON (no prose, no markdown fences) matching exactly this shape:

{
  "name": string,
  "provider": string,
  "degree_levels": string[],      // only from: "Undergraduate","Masters","PhD","Any"
  "fields_of_study": string[],    // e.g. ["Engineering","Public Policy"], [] if fully open
  "funding_type": string,         // exactly one of: "Full","Partial","Tuition Only","Living Allowance"
  "funding_amount": string,       // human-readable, e.g. "Full tuition + monthly stipend"
  "description": string,          // 2-4 sentences
  "eligibility_criteria": string[],
  "application_deadline": string | null,  // ISO date (YYYY-MM-DD), null if not stated or unclear
  "application_url": string,
  "citizenship_required": string[] | null, // null if open to all nationalities
  "open_to_international": boolean,
  "min_gpa": number | null,
  "renewable": boolean,
  "effort_minutes": number | null // rough estimate of application effort, null if unknown
}

Rules:
- If you cannot confidently determine a field, use null (or [] for arrays, false for renewable if unstated).
- Never guess a deadline you're not confident about — use null instead.
- funding_type and degree_levels values MUST be from the allowed lists above, or omit/leave the array empty.
- This is a single scholarship's page. If the page lists multiple scholarships, extract only the primary/first one.`;

interface ExtractedScholarship {
  name: string;
  provider: string;
  degree_levels: string[];
  fields_of_study: string[];
  funding_type: string;
  funding_amount: string;
  description: string;
  eligibility_criteria: string[];
  application_deadline: string | null;
  application_url: string;
  citizenship_required: string[] | null;
  open_to_international: boolean;
  min_gpa: number | null;
  renewable: boolean;
  effort_minutes: number | null;
}

const ALLOWED_DEGREE_LEVELS = new Set(["Undergraduate", "Masters", "PhD", "Any"]);
const ALLOWED_FUNDING_TYPES = new Set(["Full", "Partial", "Tuition Only", "Living Allowance"]);

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarBridgeBot/1.0 (+https://scholarbridgeai.netlify.app/about)" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return await res.text();
}

function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
}

function discoverLinks(html: string, baseUrl: string, linkPattern: RegExp): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const absolute = new URL(href, baseUrl).href;
      if (linkPattern.test(absolute)) links.add(absolute);
    } catch {
      // ignore malformed hrefs (mailto:, javascript:, etc.)
    }
  });
  return Array.from(links);
}

async function extractScholarship(pageText: string, sourceUrl: string): Promise<ExtractedScholarship | null> {
  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL!,
    messages: [
      { role: "system", content: EXTRACTION_INSTRUCTIONS },
      { role: "user", content: `Source URL: ${sourceUrl}\n\nPage content:\n${pageText}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ExtractedScholarship;
  } catch {
    console.warn(`  ⚠️  Could not parse JSON from LLM for ${sourceUrl}`);
    return null;
  }
}

function isVerifiable(record: ExtractedScholarship, sourceDomain: string): boolean {
  const hasCoreFields = Boolean(
    record.name && record.provider && record.description && record.application_url
  );
  const degreeLevelsOk =
    record.degree_levels.length === 0 || record.degree_levels.every((d) => ALLOWED_DEGREE_LEVELS.has(d));
  const fundingTypeOk = ALLOWED_FUNDING_TYPES.has(record.funding_type);
  const deadlineOk = !record.application_deadline || new Date(record.application_deadline) > new Date();
  const urlMatchesDomain = record.application_url.includes(sourceDomain);

  return hasCoreFields && degreeLevelsOk && fundingTypeOk && deadlineOk && urlMatchesDomain;
}

function contentHashOf(record: ExtractedScholarship): string {
  return createHash("sha256")
    .update(JSON.stringify({ name: record.name, description: record.description, eligibility_criteria: record.eligibility_criteria }))
    .digest("hex");
}

async function upsertScholarship(record: ExtractedScholarship, source: (typeof TRUSTED_SOURCES)[number], verified: boolean) {
  const contentHash = contentHashOf(record);

  // Dedupe on application_url — not DB-enforced unique, so check manually
  const { data: existing } = await supabase
    .from("scholarships")
    .select("id, content_hash")
    .eq("application_url", record.application_url)
    .maybeSingle();

  if (existing && existing.content_hash === contentHash) {
    console.log(`  ⏭️  ${record.name} — unchanged, skipping`);
    return;
  }

  const row = {
    name: record.name,
    provider: record.provider,
    country: source.country,
    degree_levels: record.degree_levels.filter((d) => ALLOWED_DEGREE_LEVELS.has(d)),
    fields_of_study: record.fields_of_study,
    funding_type: ALLOWED_FUNDING_TYPES.has(record.funding_type) ? record.funding_type : "Partial",
    funding_amount: record.funding_amount,
    description: record.description,
    eligibility_criteria: record.eligibility_criteria,
    application_deadline: record.application_deadline,
    application_url: record.application_url,
    citizenship_required: record.citizenship_required,
    open_to_international: record.open_to_international,
    min_gpa: record.min_gpa,
    renewable: record.renewable,
    effort_minutes: record.effort_minutes,
    is_active: true,
    source_domain: source.domain,
    scraped_at: new Date().toISOString(),
    ingestion_method: "scraped" as const,
    verified_at: verified ? new Date().toISOString() : null,
    content_hash: contentHash,
  };

  if (existing) {
    const { error } = await supabase.from("scholarships").update(row).eq("id", existing.id);
    if (error) console.error(`  ❌ Update failed for ${record.name}: ${error.message}`);
    else console.log(`  ✅ Updated: ${record.name}${verified ? "" : " (flagged for audit)"}`);
  } else {
    const { error } = await supabase.from("scholarships").insert(row);
    if (error) console.error(`  ❌ Insert failed for ${record.name}: ${error.message}`);
    else console.log(`  ✅ Inserted: ${record.name}${verified ? "" : " (flagged for audit)"}`);
  }
}

async function processPage(url: string, source: (typeof TRUSTED_SOURCES)[number]) {
  try {
    const html = await fetchPage(url);
    const text = extractMainText(html);
    const record = await extractScholarship(text, url);

    if (!record || !record.name) {
      console.log(`  ⏭️  Skipped (no data extracted): ${url}`);
      return;
    }

    const verified = isVerifiable(record, source.domain);
    await upsertScholarship(record, source, verified);
  } catch (err: any) {
    console.error(`  ❌ Failed on ${url}: ${err.message}`);
  }
}

async function run() {
  for (const source of TRUSTED_SOURCES) {
    console.log(`\n🌐 Processing ${source.domain} (${source.mode})...`);

    if (source.mode === "single") {
      // The whole site IS one scholarship — extract directly, no discovery.
      await processPage(source.listUrl, source);
      continue;
    }

    // mode === "directory" — discover links, then crawl each one.
    let listHtml: string;
    try {
      listHtml = await fetchPage(source.listUrl);
    } catch (err: any) {
      console.error(`  ❌ Could not fetch listing page: ${err.message}`);
      continue;
    }

    const links = discoverLinks(listHtml, source.listUrl, source.linkPattern);
    if (links.length === 0) {
      console.warn(
        `  ⚠️  Zero links discovered — this page may be JS-rendered. ` +
        `Check manually before trusting this source; consider Playwright for it.`
      );
      continue;
    }

    console.log(`  Found ${links.length} candidate page(s), processing up to ${MAX_PAGES_PER_SOURCE}`);

    for (const url of links.slice(0, MAX_PAGES_PER_SOURCE)) {
      await processPage(url, source);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
  }

  console.log("\n🎉 Scrape run complete. Embeddings will auto-generate via the DB trigger.");
  console.log("   Check flagged rows with:");
  console.log("   SELECT name, source_domain, application_url FROM scholarships WHERE ingestion_method = 'scraped' AND verified_at IS NULL;");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
