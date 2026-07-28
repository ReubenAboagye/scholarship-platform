/**
 * scholarship-sources.ts
 * ============================================================
 * Seed list of trusted, first-party scholarship sources.
 *
 * mode: "single"    — the site IS one scholarship program (Chevening,
 *                      Fulbright). Extract directly from listUrl,
 *                      no link discovery needed.
 * mode: "directory" — the site lists MANY distinct scholarships
 *                      (a real database/index page). Needs link
 *                      discovery via linkPattern, then per-page
 *                      extraction.
 *
 * Verified against live HTML on 2026-07-27 — see scripts/test-discovery.ts.
 * ============================================================
 */

export type ScholarshipSource =
  | {
      mode: "single";
      domain: string;
      listUrl: string;
      country: "UK" | "USA" | "Germany" | "Canada";
    }
  | {
      mode: "directory";
      domain: string;
      listUrl: string;
      country: "UK" | "USA" | "Germany" | "Canada";
      linkPattern: RegExp;
    };

export const TRUSTED_SOURCES: ScholarshipSource[] = [
  {
    mode: "single",
    domain: "chevening.org",
    listUrl: "https://www.chevening.org/scholarships/",
    country: "UK",
  },
  {
    mode: "single",
    domain: "fulbrightonline.org",
    listUrl: "https://www.fulbrightonline.org/",
    country: "USA",
  },
  {
    mode: "single",
    domain: "cscuk.fcdo.gov.uk",
    listUrl: "https://cscuk.fcdo.gov.uk/scholarships/",
    country: "UK",
  },
  {
    mode: "single",
    domain: "humphreyfellowship.org",
    listUrl: "https://www.humphreyfellowship.org/",
    country: "USA",
  },
  {
    mode: "single",
    domain: "deutschlandstipendium.de",
    listUrl: "https://www.deutschlandstipendium.de/deutschlandstipendium/de/services/english/english_node.html",
    country: "Germany",
  },
  // DAAD's real database is a JS search widget (0 links found via
  // plain fetch — confirmed via test-discovery.ts). Do not enable
  // until a Playwright-based fetch is added; leaving here as a
  // documented gap rather than silently guessing at a pattern.
  //
  // {
  //   mode: "directory",
  //   domain: "daad.de",
  //   listUrl: "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/",
  //   country: "Germany",
  //   linkPattern: /TODO — needs manual inspection post-Playwright/,
  // },

  // EduCanada's matches were mostly anchors/language-toggle links,
  // not individual scholarship pages — needs manual inspection of
  // its actual listing structure before a linkPattern can be trusted.
  // Left out of v1 rather than shipping a guessed pattern.
];
