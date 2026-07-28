/**
 * test-discovery.ts — ad-hoc check: does link discovery find anything
 * on each trusted source's listing page? Run before the real scrape
 * to catch JS-rendered pages (which return zero links from cheerio).
 *
 * Usage: pnpm tsx scripts/test-discovery.ts
 */
import * as cheerio from "cheerio";
import { TRUSTED_SOURCES } from "./scholarship-sources";

async function testSource(source: (typeof TRUSTED_SOURCES)[number]) {
  console.log(`\n--- ${source.domain} ---`);
  try {
    const res = await fetch(source.listUrl, {
      headers: { "User-Agent": "ScholarBridgeBot/1.0 (test run)" },
    });
    console.log(`  HTTP ${res.status}`);
    const html = await res.text();
    console.log(`  HTML length: ${html.length} chars`);

    const $ = cheerio.load(html);
    const totalLinks = $("a[href]").length;
    console.log(`  Total <a> tags on page: ${totalLinks}`);

    const matches = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const abs = new URL(href, source.listUrl).href;
        if (source.linkPattern.test(abs)) matches.add(abs);
      } catch {}
    });

    console.log(`  Matching scholarship links: ${matches.size}`);
    if (matches.size > 0) {
      console.log(`  Sample: ${Array.from(matches).slice(0, 3).join("\n           ")}`);
    } else if (totalLinks < 20) {
      console.log(`  ⚠️  Very few <a> tags total — likely JS-rendered. Needs Playwright.`);
    } else {
      console.log(`  ⚠️  Links exist but linkPattern matched none — pattern needs adjusting.`);
    }
  } catch (err: any) {
    console.log(`  ❌ Fetch failed: ${err.message}`);
  }
}

async function run() {
  for (const source of TRUSTED_SOURCES) {
    await testSource(source);
  }
}

run();
