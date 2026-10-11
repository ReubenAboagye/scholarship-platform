import { TRUSTED_SOURCES } from "../../scripts/scholarship-sources";
import {
  discoverLinks,
  extractMainText,
  extractScholarship,
  fetchPage,
  isVerifiable,
  upsertScholarship,
} from "../../scripts/scrape-utils";

const MAX_PAGES_PER_SOURCE = 30;
const REQUEST_DELAY_MS = 1_500;

function unauthorized() {
  return new Response("Not found", { status: 404 });
}

async function processPage(url: string, source: (typeof TRUSTED_SOURCES)[number]) {
  try {
    const html = await fetchPage(url);
    const record = await extractScholarship(extractMainText(html), url, false);

    if (!record?.name) {
      console.warn("No scholarship data extracted", { url });
      return;
    }

    const verified = isVerifiable(record, source.domain);
    await upsertScholarship(record, source.country, source.domain, "scraped", verified, true);
  } catch (error) {
    console.error("Failed to ingest scholarship page", { url, error });
  }
}

export default async function handler(request: Request) {
  const triggerSecret = process.env.SCHOLARSHIP_INGESTION_SECRET;
  if (!triggerSecret || request.headers.get("x-scholarship-ingestion-secret") !== triggerSecret) {
    return unauthorized();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    console.error("Scholarship ingestion is missing required server-side configuration");
    return new Response("Configuration error", { status: 500 });
  }

  for (const source of TRUSTED_SOURCES) {
    if (source.mode === "single") {
      await processPage(source.listUrl, source);
      continue;
    }

    try {
      const links = discoverLinks(await fetchPage(source.listUrl), source.listUrl, source.linkPattern);
      for (const url of links.slice(0, MAX_PAGES_PER_SOURCE)) {
        await processPage(url, source);
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    } catch (error) {
      console.error("Failed to ingest scholarship source", { source: source.domain, error });
    }
  }

  return new Response(null, { status: 204 });
}

export const config = {
  background: true,
};
