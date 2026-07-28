/**
 * scrape-utils.ts
 * ============================================================
 * Shared logic for scholarship scraping/harvesting scripts.
 * Used by both scrape-scholarships.ts (fixed trusted sources)
 * and harvest-scholars4dev.ts (discovery via scholars4dev links).
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";
import { createHash } from "crypto";

// Load env here, not in the importing script — ES module imports are
// evaluated before the importing file's own top-level code runs, so
// relying on the caller to dotenv.config() first is a real race condition
// (bit us once already: Supabase client got created with undefined URL).
dotenv.config({ path: ".env.local" });

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://scholarbridgeai.netlify.app",
    "X-Title": "ScholarBridge AI Scraper",
  },
});

export interface ExtractedScholarship {
  name: string;
  provider: string;
  country: string; // "UK" | "USA" | "Germany" | "Canada" | "Other" — validated by caller
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

export const ALLOWED_DEGREE_LEVELS = new Set(["Undergraduate", "Masters", "PhD", "Any"]);
export const ALLOWED_FUNDING_TYPES = new Set(["Full", "Partial", "Tuition Only", "Living Allowance"]);
export const ALLOWED_COUNTRIES = new Set(["UK", "USA", "Germany", "Canada"]);

export async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarBridgeBot/1.0 (+https://scholarbridgeai.netlify.app/about)" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error(`Skipping non-HTML content (${contentType || "unknown type"}): ${url}`);
  }

  return await res.text();
}

export function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer").remove();
  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
}

export function discoverLinks(html: string, baseUrl: string, linkPattern: RegExp): string[] {
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

// Extraction schema WITHOUT country (used when the source config already
// pins the country — the fixed trusted-list sources).
const FIXED_COUNTRY_INSTRUCTIONS = `You extract structured scholarship data from a web page's text content.
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
- This is a single scholarship's page. If the page lists multiple scholarships, extract only the primary/first one.
- Do not confuse this scholarship with similarly-named or sibling programs mentioned on the page (e.g. related fellowships run by the same
  umbrella organization). Only extract details for the scholarship the page is actually about; "provider" must be the specific administering
  body of THIS scholarship, not a parent organization mentioned in passing.`;

// Extraction schema WITH country detection (used for harvested/discovered
// sources where we don't know the country in advance).
const DETECT_COUNTRY_INSTRUCTIONS = FIXED_COUNTRY_INSTRUCTIONS.replace(
  '"name": string,',
  '"name": string,\n  "country": string,             // exactly one of: "UK","USA","Germany","Canada","Other"'
) + `\n- Set "country" to "Other" if the scholarship's host country is not UK, USA, Germany, or Canada, or if unclear.`;

export async function extractScholarship(
  pageText: string,
  sourceUrl: string,
  detectCountry: boolean
): Promise<ExtractedScholarship | null> {
  const response = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL!,
    messages: [
      { role: "system", content: detectCountry ? DETECT_COUNTRY_INSTRUCTIONS : FIXED_COUNTRY_INSTRUCTIONS },
      { role: "user", content: `Source URL: ${sourceUrl}\n\nPage content:\n${pageText}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeExtracted(parsed);
  } catch {
    console.warn(`  ⚠️  Could not parse JSON from LLM for ${sourceUrl}`);
    return null;
  }
}

// The LLM's JSON output isn't schema-enforced — it can return a bare string
// where an array is expected, or omit a field entirely. Coerce into the
// shapes the rest of the pipeline assumes, rather than trusting the raw
// parse (caught a real crash: "degree_levels.every is not a function"
// when the model returned a string instead of a one-element array).
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
}

function normalizeExtracted(parsed: Record<string, unknown>): ExtractedScholarship {
  return {
    name: typeof parsed.name === "string" ? parsed.name : "",
    provider: typeof parsed.provider === "string" ? parsed.provider : "",
    country: typeof parsed.country === "string" ? parsed.country : "Other",
    degree_levels: toStringArray(parsed.degree_levels),
    fields_of_study: toStringArray(parsed.fields_of_study),
    funding_type: typeof parsed.funding_type === "string" ? parsed.funding_type : "",
    funding_amount: typeof parsed.funding_amount === "string" ? parsed.funding_amount : "Not specified",
    description: typeof parsed.description === "string" ? parsed.description : "",
    eligibility_criteria: toStringArray(parsed.eligibility_criteria),
    application_deadline: typeof parsed.application_deadline === "string" ? parsed.application_deadline : null,
    application_url: typeof parsed.application_url === "string" ? parsed.application_url : "",
    citizenship_required:
      parsed.citizenship_required === null ? null : toStringArray(parsed.citizenship_required),
    open_to_international: Boolean(parsed.open_to_international),
    min_gpa: typeof parsed.min_gpa === "number" ? parsed.min_gpa : null,
    renewable: Boolean(parsed.renewable),
    effort_minutes: typeof parsed.effort_minutes === "number" ? parsed.effort_minutes : null,
  };
}

export function isVerifiable(record: ExtractedScholarship, sourceDomain: string): boolean {
  const hasCoreFields = Boolean(
    record.name && record.provider && record.description && record.application_url
  );
  const degreeLevelsOk =
    record.degree_levels.length === 0 || record.degree_levels.every((d) => ALLOWED_DEGREE_LEVELS.has(d));
  const fundingTypeOk = ALLOWED_FUNDING_TYPES.has(record.funding_type);
  const deadlineOk = !record.application_deadline || new Date(record.application_deadline) > new Date();
  const urlMatchesDomain = Boolean(record.application_url) && record.application_url.includes(sourceDomain);

  return hasCoreFields && degreeLevelsOk && fundingTypeOk && deadlineOk && urlMatchesDomain;
}

export function contentHashOf(record: ExtractedScholarship): string {
  return createHash("sha256")
    .update(JSON.stringify({ name: record.name, description: record.description, eligibility_criteria: record.eligibility_criteria }))
    .digest("hex");
}

/**
 * Upserts a scholarship row.
 * @param country       Resolved country (UK/USA/Germany/Canada) — caller must validate.
 * @param sourceDomain   Domain the data was extracted FROM (the actual provider site).
 * @param ingestionMethod "scraped" (fixed trusted list) or "harvested" (discovered via scholars4dev, etc.)
 * @param allowAutoVerify If false, verified_at is always left NULL regardless of isVerifiable() result —
 *                        used for lower-trust discovery paths so nothing auto-publishes as "verified".
 */
export async function upsertScholarship(
  record: ExtractedScholarship,
  country: string,
  sourceDomain: string,
  ingestionMethod: "scraped" | "harvested",
  verified: boolean,
  allowAutoVerify: boolean
) {
  const contentHash = contentHashOf(record);
  const finalVerified = allowAutoVerify && verified;

  if (!record.application_url) {
    console.log(`  ⏭️  ${record.name} — no application_url extracted, skipping (column is NOT NULL)`);
    return;
  }

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
    country,
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
    source_domain: sourceDomain,
    scraped_at: new Date().toISOString(),
    ingestion_method: ingestionMethod,
    verified_at: finalVerified ? new Date().toISOString() : null,
    content_hash: contentHash,
  };

  if (existing) {
    const { error } = await supabase.from("scholarships").update(row).eq("id", existing.id);
    if (error) console.error(`  ❌ Update failed for ${record.name}: ${error.message}`);
    else console.log(`  ✅ Updated: ${record.name}${finalVerified ? "" : " (flagged for audit)"}`);
  } else {
    const { error } = await supabase.from("scholarships").insert(row);
    if (error) console.error(`  ❌ Insert failed for ${record.name}: ${error.message}`);
    else console.log(`  ✅ Inserted: ${record.name}${finalVerified ? "" : " (flagged for audit)"}`);
  }
}
