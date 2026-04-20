"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { countryFlagUrl } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// HeroSearch — scholarship hero search.
//
// Desktop (sm+): full search form — keyword + Country / Degree /
//   Funding selects + Search button. Typing / changing any field
//   updates the URL (router.replace, debounced 300ms) and the
//   server re-renders the results list below. Hidden filters
//   set elsewhere (deadline, renewable, international, effort)
//   are preserved across updates.
//
// Mobile (< sm): just the search input. Typing triggers a live
//   typeahead dropdown that queries Supabase directly and shows
//   up to 6 matching scholarships. Tapping a result navigates to
//   that scholarship — it does NOT filter the list below. Mobile
//   intentionally has no filter UI in the hero.
//
// Navigation note:
// Results-list updates use router.replace() (not the usual
// window.location.href) because this is same-route URL param
// mutation — a full reload per keystroke would drop focus.
// Typeahead result clicks use plain <a> like the rest of the app.
// ─────────────────────────────────────────────────────────────

interface HeroSearchProps {
  countries: string[];
  fundingTypes: string[];
  degreeLevels: string[];
  active: {
    country: string;
    funding_type: string;
    degree_level: string;
    search: string;
    deadline: string;
    renewable: string;
    international: string;
    effort: string;
  };
}

interface SuggestionRow {
  id: string;
  slug: string | null;
  name: string;
  provider: string;
  country: string;
  funding_type: string;
}

export default function HeroSearch({
  countries,
  fundingTypes,
  degreeLevels,
  active,
}: HeroSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local controlled state for the form fields.
  const [search, setSearch] = useState(active.search);
  const [country, setCountry] = useState(active.country);
  const [degree, setDegree] = useState(active.degree_level);
  const [funding, setFunding] = useState(active.funding_type);

  // Mobile typeahead state.
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const mobileWrapperRef = useRef<HTMLDivElement | null>(null);

  // ── Desktop: debounced URL rewrite ──────────────────────────
  const desktopDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstDesktopRun = useRef(true);

  function pushUrl(next: {
    search: string;
    country: string;
    degree_level: string;
    funding_type: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key: string, value: string, emptyEquivalent: string) => {
      if (!value || value === emptyEquivalent) params.delete(key);
      else params.set(key, value);
    };
    setOrDelete("search", next.search.trim(), "");
    setOrDelete("country", next.country, "All");
    setOrDelete("degree_level", next.degree_level, "All");
    setOrDelete("funding_type", next.funding_type, "All");

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/scholarships?${qs}` : "/scholarships", { scroll: false });
    });
  }

  // Desktop: debounced URL push on any field change.
  // We only want this to fire when the viewport is sm+ — on mobile
  // the search input drives the typeahead instead. We can't reliably
  // read breakpoint from state at first render (SSR), so we push URL
  // unconditionally for non-search field changes (only possible on
  // desktop anyway) and for search changes we push only when a
  // desktop-only media query matches.
  useEffect(() => {
    if (firstDesktopRun.current) {
      firstDesktopRun.current = false;
      return;
    }
    if (desktopDebounce.current) clearTimeout(desktopDebounce.current);
    desktopDebounce.current = setTimeout(() => {
      // Guard search-driven pushes on mobile — we don't want typing
      // in the mobile input to also rewrite the URL / refetch the page.
      const isDesktop =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 640px)").matches;
      if (!isDesktop && search !== active.search) return;
      pushUrl({ search, country, degree_level: degree, funding_type: funding });
    }, 300);
    return () => {
      if (desktopDebounce.current) clearTimeout(desktopDebounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, degree, funding]);

  function onDesktopSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (desktopDebounce.current) clearTimeout(desktopDebounce.current);
    pushUrl({ search, country, degree_level: degree, funding_type: funding });
  }

  // ── Mobile: typeahead suggestions ───────────────────────────
  const mobileDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryId = useRef(0);

  useEffect(() => {
    // Only run typeahead lookups on mobile viewports.
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return;

    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
    setSuggestionsLoading(true);
    mobileDebounce.current = setTimeout(async () => {
      const queryId = ++latestQueryId.current;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("scholarships")
          .select("id, slug, name, provider, country, funding_type")
          .eq("is_active", true)
          .or(`name.ilike.%${q}%,provider.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(6);

        // Discard if a newer query has started.
        if (queryId !== latestQueryId.current) return;

        if (!error && data) {
          setSuggestions(data as SuggestionRow[]);
          setSuggestionsOpen(true);
        }
      } finally {
        if (queryId === latestQueryId.current) {
          setSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      if (mobileDebounce.current) clearTimeout(mobileDebounce.current);
    };
  }, [search]);

  // Close the mobile dropdown on outside tap.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!mobileWrapperRef.current) return;
      if (!mobileWrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, []);

  function clearSearch() {
    setSearch("");
    setSuggestions([]);
    setSuggestionsOpen(false);
  }

  // Highlight the matched substring in a suggestion title.
  function Highlighted({ text, term }: { text: string; term: string }) {
    if (!term) return <>{text}</>;
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    if (i === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-yellow-100 text-slate-900 rounded px-0.5">
          {text.slice(i, i + term.length)}
        </mark>
        {text.slice(i + term.length)}
      </>
    );
  }

  return (
    <>
      {/* ─── Mobile (< sm): search + typeahead dropdown ─── */}
      <div className="sm:hidden" ref={mobileWrapperRef}>
        {/* Soft scrim below the hero while the dropdown is open — gives the
            floating glass panel a clean visual separation from the results
            list rather than appearing to bleed into it. */}
        {suggestionsOpen && search.trim().length >= 2 && (
          <div
            aria-hidden="true"
            onClick={() => setSuggestionsOpen(false)}
            className="fixed inset-0 top-16 z-20 bg-slate-900/20 backdrop-blur-[2px] transition-opacity"
          />
        )}

        <div className="relative z-30">
          {/* Search bar — solid white so the input itself stays crisp */}
          <div className="relative bg-white rounded-lg shadow-xl border border-white/10">
            <div className="flex items-center">
              <div className="flex items-center pl-4 text-slate-400">
                {suggestionsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setSuggestionsOpen(true);
                }}
                placeholder="Search scholarships"
                autoComplete="off"
                enterKeyHint="search"
                className="flex-1 min-w-0 py-3.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-lg"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Typeahead dropdown — glass morphism panel, capped height so it
              never spills past the viewport. Sits above the scrim. */}
          {suggestionsOpen && search.trim().length >= 2 && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2
                         rounded-xl overflow-hidden animate-fade-in
                         bg-white/70 backdrop-blur-xl
                         border border-white/50
                         shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)]
                         max-h-[min(60vh,22rem)] overflow-y-auto"
            >
              {suggestions.length === 0 && !suggestionsLoading && (
                <div className="px-4 py-6 text-center text-sm text-slate-600">
                  No scholarships found for &ldquo;{search.trim()}&rdquo;
                </div>
              )}

              {suggestions.map((s) => {
                const href = `/scholarships/${s.slug || s.id}`;
                return (
                  <a
                    key={s.id}
                    href={href}
                    role="option"
                    className="flex items-start gap-3 px-4 py-3 border-b border-white/40 last:border-0 hover:bg-white/60 active:bg-white/80 transition-colors"
                  >
                    {countryFlagUrl(s.country) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={countryFlagUrl(s.country)!}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-sm border border-slate-200 mt-1 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-3.5 bg-slate-100 rounded-sm mt-1 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                        <Highlighted text={s.name} term={search.trim()} />
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.provider}</span>
                        <span className="text-slate-400">·</span>
                        <span className="shrink-0">{s.country}</span>
                      </div>
                    </div>
                  </a>
                );
              })}

              {suggestions.length > 0 && (
                <a
                  href={`/scholarships?search=${encodeURIComponent(search.trim())}`}
                  className="block px-4 py-3 text-xs font-semibold text-brand-700 hover:bg-white/70 text-center border-t border-white/40"
                >
                  See all results for &ldquo;{search.trim()}&rdquo;
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop (sm+): full search form ─── */}
      <form
        onSubmit={onDesktopSubmit}
        role="search"
        aria-label="Scholarship search"
        className="hidden sm:block bg-white rounded-lg shadow-xl border border-white/10 overflow-hidden"
      >
        <div className="flex items-center border-b border-slate-200">
          <div className="flex items-center pl-4 text-slate-400">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, provider, or keyword"
            autoComplete="off"
            className="flex-1 min-w-0 py-3.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-4">
          <label className="flex flex-col px-4 py-3 border-r border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 mb-1">Country</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All countries" : c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col px-4 py-3 border-r border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 mb-1">Degree level</span>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
            >
              {degreeLevels.map((d) => (
                <option key={d} value={d}>
                  {d === "All" ? "Any level" : d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col px-4 py-3 border-r border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 mb-1">Funding</span>
            <select
              value={funding}
              onChange={(e) => setFunding(e.target.value)}
              className="text-sm text-slate-900 bg-transparent outline-none -ml-0.5"
            >
              {fundingTypes.map((f) => (
                <option key={f} value={f}>
                  {f === "All" ? "Any funding" : f}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-6 py-3 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>
    </>
  );
}
