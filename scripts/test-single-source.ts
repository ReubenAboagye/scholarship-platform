/**
 * test-single-source.ts — quick content check for candidate "single"
 * sources before adding them for real. Confirms server-rendered HTML
 * has real substance (not a near-empty JS shell like DAAD).
 *
 * Usage: pnpm tsx scripts/test-single-source.ts
 */
import * as cheerio from "cheerio";

const CANDIDATES = [
  { name: "Commonwealth Scholarships (UK)", url: "https://cscuk.fcdo.gov.uk/scholarships/" },
  { name: "Deutschlandstipendium (Germany)", url: "https://www.deutschlandstipendium.de/deutschlandstipendium/de/services/english/english_node.html" },
  { name: "Humphrey Fellowship (USA)", url: "https://www.humphreyfellowship.org/" },
];

async function check(name: string, url: string) {
  console.log(`\n--- ${name} ---`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ScholarBridgeBot/1.0 (test run)" } });
    console.log(`  HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    console.log(`  Extracted text length: ${text.length} chars`);
    console.log(`  Sample: "${text.slice(0, 200)}..."`);
    if (text.length < 500) {
      console.log(`  ⚠️  Very little text — likely JS-rendered or blocked. Do not add without further checking.`);
    } else {
      console.log(`  ✅ Looks server-rendered with real content.`);
    }
  } catch (err: any) {
    console.log(`  ❌ Fetch failed: ${err.message}`);
  }
}

async function run() {
  for (const c of CANDIDATES) await check(c.name, c.url);
}

run();
