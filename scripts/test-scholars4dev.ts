/**
 * test-scholars4dev.ts — inspect scholars4dev's link structure before
 * building the real harvester. Checks:
 * 1. Can we find internal per-scholarship listing links on a category page?
 * 2. Can we find the outbound official-site link on a per-scholarship page?
 */
import * as cheerio from "cheerio";

const CATEGORY_URL = "https://www.scholars4dev.com/1892/government-scholarships-for-developing-countries/";

async function run() {
  console.log(`Fetching category page: ${CATEGORY_URL}`);
  const res = await fetch(CATEGORY_URL, { headers: { "User-Agent": "ScholarBridgeBot/1.0 (test run)" } });
  console.log(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Internal scholars4dev listing links look like /NNNN/slug/
  const internalPattern = /scholars4dev\.com\/\d+\/[a-z0-9-]+\/?$/i;
  const internalLinks = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, CATEGORY_URL).href;
      const isSelf = new URL(abs).pathname === new URL(CATEGORY_URL).pathname;
      if (internalPattern.test(abs) && !isSelf) internalLinks.add(abs);
    } catch {}
  });

  console.log(`\nInternal per-scholarship links found: ${internalLinks.size}`);
  const sample = Array.from(internalLinks).slice(0, 3);
  console.log(sample.join("\n"));

  if (sample.length === 0) {
    console.log("No internal links found — pattern or page structure needs adjusting.");
    return;
  }

  // Now inspect ONE per-scholarship page for its outbound official link
  const testPage = sample[0];
  console.log(`\n\nFetching sample per-scholarship page: ${testPage}`);
  const res2 = await fetch(testPage, { headers: { "User-Agent": "ScholarBridgeBot/1.0 (test run)" } });
  const html2 = await res2.text();
  const $2 = cheerio.load(html2);

  const outboundLinks: string[] = [];
  $2("a[href]").each((_, el) => {
    const href = $2(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, testPage).href;
      const domain = new URL(abs).hostname;
      const isInternal = domain.includes("scholars4dev.com");
      const isSocial = /facebook|twitter|x\.com|instagram|linkedin|youtube|pinterest/i.test(domain);
      const isAd = /doubleclick|googleadservices|googlesyndication|amazon|unicaf|refer-a-friend/i.test(abs);
      if (!isInternal && !isSocial && !isAd) outboundLinks.push(abs);
    } catch {}
  });

  console.log(`\nCandidate outbound (non-internal, non-social, non-ad) links: ${outboundLinks.length}`);
  console.log([...new Set(outboundLinks)].slice(0, 10).join("\n"));
}

run();
