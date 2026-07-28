/**
 * harvest-scholars4dev.ts
 * ============================================================
 * Discovery pipeline: crawls scholars4dev.com category pages,
 * follows their per-scholarship listing pages, and extracts the
 * OUTBOUND link to the real/official provider site. We never
 * store or reproduce scholars4dev's own written content —
 * per their copyright policy — only use their site as an index
 * to find primary sources, exactly like following citations.
 *
 * Two-hop crawl:
 *   category page -> per-scholarship listing links (scholars4dev.com)
 *   per-scholarship page -> outbound link(s) to the actual provider site
 *
 * The real provider page is then run through the same extraction
 * pipeline as scrape-scholarships.ts (scrape-utils.ts), but with
 * two differences reflecting the lower trust of a discovery step:
 *   1. Country is DETECTED by the LLM (not pinned by config) —
 *      anything not UK/USA/Germany/Canada is skipped entirely,
 *      since the `scholarships.country` column has a hard CHECK.
 *   2. allowAutoVerify = false — harvested rows ALWAYS land with
 *      verified_at = NULL (audit queue), regardless of how clean
 *      they look structurally. Only the fixed trusted-list sources
 *      can auto-verify; discovery needs a human look first.
 *
 * Usage:
 *   pnpm tsx scripts/harvest-scholars4dev.ts
 * ============================================================
 */

import * as dotenv from "dotenv";
import * as cheerio from "cheerio";
import {
  fetchPage,
  extractMainText,
  extractScholarship,
  isVerifiable,
  upsertScholarship,
  ALLOWED_COUNTRIES,
} from "./scrape-utils";

dotenv.config({ path: ".env.local" });

// Category pages to harvest from — chosen for relevance to UK/USA/Germany/Canada.
// Each is a scholars4dev "list" page linking to many per-scholarship pages.
const CATEGORY_SEEDS = [
  "https://www.scholars4dev.com/1892/government-scholarships-for-developing-countries/",
  "https://www.scholars4dev.com/6643/scholarships-in-germany-for-international-students/",
];

const MAX_LISTINGS_PER_CATEGORY = 15; // cap scholars4dev pages visited per category
const REQUEST_DELAY_MS = 1500;

const SOCIAL_DOMAINS = /facebook|twitter|x\.com|instagram|linkedin|youtube|pinterest|tiktok/i;
const AD_OR_AFFILIATE = /doubleclick|googleadservices|googlesyndication|amazon\.|unicaf|refer-a-friend|bit\.ly|ads\./i;
const INTERNAL_LISTING_PATTERN = /scholars4dev\.com\/\d+\/[a-z0-9-]+\/?$/i;

function discoverInternalListings(html: string, categoryUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const categoryPath = new URL(categoryUrl).pathname;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, categoryUrl).href;
      const isSelf = new URL(abs).pathname === categoryPath;
      if (INTERNAL_LISTING_PATTERN.test(abs) && !isSelf) links.add(abs);
    } catch {
      // ignore malformed hrefs
    }
  });
  return Array.from(links);
}

function discoverOutboundLink(html: string, listingUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, listingUrl).href;
      const domain = new URL(abs).hostname;
      const isInternal = domain.includes("scholars4dev.com");
      if (isInternal || SOCIAL_DOMAINS.test(domain) || AD_OR_AFFILIATE.test(abs)) return;
      candidates.push(abs);
    } catch {
      // ignore malformed hrefs
    }
  });

  return candidates.length > 0 ? candidates[0] : null;
}

async function processOutboundCandidate(url: string, foundVia: string) {
  let html: string;
  try {
    html = await fetchPage(url);
  } catch (err: any) {
    console.log(`    ❌ Could not fetch candidate: ${err.message}`);
    return;
  }

  const text = extractMainText(html);
  const record = await extractScholarship(text, url, true); // detect country

  if (!record || !record.name) {
    console.log(`    ⏭️  No data extracted from ${url}`);
    return;
  }

  if (!ALLOWED_COUNTRIES.has(record.country)) {
    console.log(`    ⏭️  Skipped "${record.name}" — country "${record.country}" not in UK/USA/Germany/Canada`);
    return;
  }

  const sourceDomain = new URL(url).hostname;
  const verified = isVerifiable(record, sourceDomain);

  // allowAutoVerify = false: harvested rows always need a human look first,
  // regardless of how clean they check out structurally.
  await upsertScholarship(record, record.country, sourceDomain, "harvested", verified, false);
  console.log(`    (discovered via scholars4dev: ${foundVia})`);
}

async function run() {
  let totalProcessed = 0;

  for (const categoryUrl of CATEGORY_SEEDS) {
    console.log(`\n📂 Category: ${categoryUrl}`);

    let categoryHtml: string;
    try {
      categoryHtml = await fetchPage(categoryUrl);
    } catch (err: any) {
      console.error(`  ❌ Could not fetch category page: ${err.message}`);
      continue;
    }

    const listings = discoverInternalListings(categoryHtml, categoryUrl).slice(0, MAX_LISTINGS_PER_CATEGORY);
    console.log(`  Found ${listings.length} per-scholarship listing(s) to check`);

    for (const listingUrl of listings) {
      try {
        const listingHtml = await fetchPage(listingUrl);
        const outbound = discoverOutboundLink(listingHtml, listingUrl);

        if (!outbound) {
          console.log(`  ⏭️  No outbound official link found on ${listingUrl}`);
          continue;
        }

        console.log(`  🔗 ${listingUrl}\n     -> ${outbound}`);
        await processOutboundCandidate(outbound, listingUrl);
        totalProcessed++;

        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
      } catch (err: any) {
        console.error(`  ❌ Failed on ${listingUrl}: ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Harvest run complete. ${totalProcessed} candidate(s) processed.`);
  console.log("   All harvested rows land with verified_at = NULL — review before trusting:");
  console.log("   SELECT name, source_domain, application_url FROM scholarships WHERE ingestion_method = 'harvested';");
  console.log("   Run: pnpm tsx scripts/generate-embeddings.ts   (backfill any missed embeddings)");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
