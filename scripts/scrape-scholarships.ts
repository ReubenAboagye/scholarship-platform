/**
 * scrape-scholarships.ts
 * ============================================================
 * Crawls trusted scholarship sources (scholarship-sources.ts),
 * discovers individual scholarship pages, extracts structured
 * data via OpenRouter LLM (JSON schema), and upserts into
 * `scholarships`.
 *
 * Shared extraction/upsert logic lives in scrape-utils.ts, also
 * used by harvest-scholars4dev.ts.
 *
 * Embeddings are NOT generated here — the existing DB trigger
 * (trg_scholarship_embedding, see migration 007) fires
 * automatically on INSERT/UPDATE of the relevant columns.
 * (Note: the trigger has intermittently missed a firing in
 * practice — run generate-embeddings.ts as a backfill after
 * every scrape run to be safe.)
 *
 * Usage:
 *   pnpm tsx scripts/scrape-scholarships.ts
 * ============================================================
 */

import * as dotenv from "dotenv";
import { TRUSTED_SOURCES } from "./scholarship-sources";
import {
  fetchPage,
  extractMainText,
  discoverLinks,
  extractScholarship,
  isVerifiable,
  upsertScholarship,
} from "./scrape-utils";

dotenv.config({ path: ".env.local" });

const MAX_PAGES_PER_SOURCE = 30; // safety cap on OpenRouter spend per run
const REQUEST_DELAY_MS = 1500; // politeness delay between page fetches per domain

async function processPage(url: string, source: (typeof TRUSTED_SOURCES)[number]) {
  try {
    const html = await fetchPage(url);
    const text = extractMainText(html);
    const record = await extractScholarship(text, url, false); // fixed-country mode

    if (!record || !record.name) {
      console.log(`  ⏭️  Skipped (no data extracted): ${url}`);
      return;
    }

    const verified = isVerifiable(record, source.domain);
    // Trusted-list sources are curated and pre-verified as a class,
    // so auto-verification is allowed here (allowAutoVerify = true).
    await upsertScholarship(record, source.country, source.domain, "scraped", verified, true);
  } catch (err: any) {
    console.error(`  ❌ Failed on ${url}: ${err.message}`);
  }
}

async function run() {
  for (const source of TRUSTED_SOURCES) {
    console.log(`\n🌐 Processing ${source.domain} (${source.mode})...`);

    if (source.mode === "single") {
      await processPage(source.listUrl, source);
      continue;
    }

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

  console.log("\n🎉 Scrape run complete.");
  console.log("   Run: pnpm tsx scripts/generate-embeddings.ts   (backfill any missed embeddings)");
  console.log("   Check flagged rows with:");
  console.log("   SELECT name, source_domain, application_url FROM scholarships WHERE ingestion_method = 'scraped' AND verified_at IS NULL;");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
