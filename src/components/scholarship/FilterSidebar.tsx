"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// FilterSidebar — browse/search filters for the scholarships
// listing. Redesigned for the government-portal aesthetic:
// sentence-case section headers, understated active-state
// (background tint + left border, not bold + brand text),
// hairline dividers, no outer card shell.
// ─────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  active: {
    country: string; funding_type: string; degree_level: string; search: string;
    deadline: string; renewable: string; international: string; effort: string;
  };
  countries: string[];
  fundingTypes: string[];
  degreeLevels: string[];
  baseUrl?: string;
}

function FilterSection({
  label, children, defaultOpen = true,
}: {
  label: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-200 last:border-0 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
        <ChevronDown
          className={`size-4 text-zinc-400 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="pt-2.5">{children}</div>}
    </div>
  );
}

// Shared row style for every option inside a filter section.
// Active state: subtle slate tint + brand left accent + text darkens.
// Default:       muted slate with hairline hover tint.
function optionClasses(isActive: boolean) {
  return [
    "flex items-center gap-2.5 w-full text-left",
    "px-2.5 py-1.5 rounded-md text-sm transition-colors",
    "border-l-2",
    isActive
      ? "bg-zinc-100 text-zinc-900 border-brand-600 font-medium"
      : "text-zinc-600 hover:bg-zinc-50 border-transparent",
  ].join(" ");
}

interface FilterContentProps {
  active: FilterSidebarProps["active"];
  baseUrl: string;
  countries: string[];
  fundingTypes: string[];
  degreeLevels: string[];
  hasFilters: boolean;
  buildUrl: (overrides: Partial<FilterSidebarProps["active"]>) => string;
  onClose: () => void;
}

function FilterContent({
  active, baseUrl, countries, fundingTypes, degreeLevels, hasFilters, buildUrl, onClose,
}: FilterContentProps) {
  return (
    <div>
      {/* ── Search ─────────────────────────────────────── */}
      <FilterSection label="Search">
        <form method="GET" action={baseUrl}>
          {/* Preserve other active filters across a search submit */}
          {active.country       !== "All"  && <input type="hidden" name="country"       value={active.country} />}
          {active.funding_type  !== "All"  && <input type="hidden" name="funding_type"  value={active.funding_type} />}
          {active.degree_level  !== "All"  && <input type="hidden" name="degree_level"  value={active.degree_level} />}
          {active.deadline      !== "any"  && <input type="hidden" name="deadline"      value={active.deadline} />}
          {active.renewable     === "true" && <input type="hidden" name="renewable"     value="true" />}
          {active.international === "true" && <input type="hidden" name="international" value="true" />}
          {active.effort        !== "any"  && <input type="hidden" name="effort"        value={active.effort} />}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              name="search" defaultValue={active.search} placeholder="Keyword…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-md
                         outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                         placeholder:text-zinc-400 transition-shadow"
            />
          </div>
        </form>
      </FilterSection>

      {/* ── Deadline ───────────────────────────────────── */}
      <FilterSection label="Deadline">
        <div className="space-y-0.5">
          {[
            { v: "any", l: "Any deadline" },
            { v: "7d",  l: "Next 7 days" },
            { v: "30d", l: "Next 30 days" },
            { v: "90d", l: "Next 90 days" },
          ].map(({ v, l }) => (
            <a
              key={v}
              href={buildUrl({ deadline: v })}
              onClick={onClose}
              className={optionClasses(active.deadline === v)}
            >
              {l}
            </a>
          ))}
        </div>
      </FilterSection>

      {/* ── Country ────────────────────────────────────── */}
      <FilterSection label="Country">
        <div className="space-y-0.5">
          {countries.map((c) => (
            <a
              key={c}
              href={buildUrl({ country: c })}
              onClick={onClose}
              className={optionClasses(active.country === c)}
            >
              {c !== "All" && countryFlagUrl(c) ? (
                <img
                  src={countryFlagUrl(c)!}
                  alt=""
                  className="w-4 h-3 object-cover rounded-sm border border-zinc-200 shrink-0"
                />
              ) : (
                <div className="w-4 h-3 bg-zinc-100 rounded-sm shrink-0" />
              )}
              <span className="truncate">{c === "All" ? "All countries" : c}</span>
            </a>
          ))}
        </div>
      </FilterSection>

      {/* ── Degree level ────────────────────────────────── */}
      <FilterSection label="Degree level" defaultOpen={false}>
        <div className="space-y-0.5">
          {degreeLevels.map((d) => (
            <a
              key={d}
              href={buildUrl({ degree_level: d })}
              onClick={onClose}
              className={optionClasses(active.degree_level === d)}
            >
              {d === "All" ? "Any level" : d}
            </a>
          ))}
        </div>
      </FilterSection>

      {/* ── Funding type ───────────────────────────────── */}
      <FilterSection label="Funding type" defaultOpen={false}>
        <div className="space-y-0.5">
          {fundingTypes.map((f) => (
            <a
              key={f}
              href={buildUrl({ funding_type: f })}
              onClick={onClose}
              className={optionClasses(active.funding_type === f)}
            >
              {f === "All" ? "Any funding" : f}
            </a>
          ))}
        </div>
      </FilterSection>

      {/* ── Effort ─────────────────────────────────────── */}
      <FilterSection label="Effort" defaultOpen={false}>
        <div className="space-y-0.5">
          {[
            { v: "any",    l: "Any effort" },
            { v: "quick",  l: "Quick apply (≤60 min)" },
            { v: "medium", l: "Full application" },
          ].map(({ v, l }) => (
            <a
              key={v}
              href={buildUrl({ effort: v })}
              onClick={onClose}
              className={optionClasses(active.effort === v)}
            >
              {l}
            </a>
          ))}
        </div>
      </FilterSection>

      {/* ── Toggles ────────────────────────────────────── */}
      <FilterSection label="Other" defaultOpen={false}>
        <div className="space-y-1">
          {[
            { key: "renewable",     label: "Renewable awards",       value: active.renewable },
            { key: "international", label: "Open internationally",   value: active.international },
          ].map(({ key, label, value }) => {
            const on = value === "true";
            return (
              <a
                key={key}
                href={buildUrl({ [key]: on ? "" : "true" } as any)}
                onClick={onClose}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm transition-colors
                  ${on ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-600 hover:bg-zinc-50"}`}
              >
                <span>{label}</span>
                <span
                  aria-hidden
                  className={`relative w-8 h-4 rounded-full transition-colors shrink-0
                    ${on ? "bg-brand-600" : "bg-zinc-300"}`}
                >
                  <span
                    className={`absolute top-0.5 size-3 bg-white rounded-full shadow-sm transition-transform
                      ${on ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </span>
              </a>
            );
          })}
        </div>
      </FilterSection>

      {/* ── Clear all ──────────────────────────────────── */}
      {hasFilters && (
        <div className="pt-3">
          <a
            href={baseUrl}
            onClick={onClose}
            className="block w-full text-center py-2 text-sm font-medium text-zinc-600
                       border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900
                       rounded-md transition-colors"
          >
            Clear all filters
          </a>
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({
  active, countries, fundingTypes, degreeLevels, baseUrl = "/scholarships",
}: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Build a canonical URL with overrides applied. This keeps the
  // filter state encoded in the query string so it survives page
  // refreshes and is shareable.
  const buildUrl = (overrides: Partial<typeof active>) => {
    const merged = { ...active, ...overrides };
    const params = new URLSearchParams();
    if (merged.country       !== "All" ) params.set("country",       merged.country);
    if (merged.funding_type  !== "All" ) params.set("funding_type",  merged.funding_type);
    if (merged.degree_level  !== "All" ) params.set("degree_level",  merged.degree_level);
    if (merged.deadline      !== "any" ) params.set("deadline",      merged.deadline);
    if (merged.renewable     === "true") params.set("renewable",     "true");
    if (merged.international === "true") params.set("international", "true");
    if (merged.effort        !== "any" ) params.set("effort",        merged.effort);
    if (merged.search                  ) params.set("search",        merged.search);
    const qs = params.toString();
    return `${baseUrl}${qs ? "?" + qs : ""}`;
  };

  const hasFilters =
    active.country !== "All" || active.funding_type !== "All" ||
    active.degree_level !== "All" || active.search !== "" ||
    active.deadline !== "any" || active.renewable === "true" ||
    active.international === "true" || active.effort !== "any";

  const handleClose = () => setDrawerOpen(false);

  // Count active filters for the mobile trigger badge
  const activeCount = [
    active.country !== "All",
    active.funding_type !== "All",
    active.degree_level !== "All",
    active.deadline !== "any",
    active.renewable === "true",
    active.international === "true",
    active.effort !== "any",
    active.search !== "",
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile trigger: quiet bar with filter button + active-count */}
      <div
        className="lg:hidden sticky top-[-16px] z-10 -mx-4 px-4 py-3
                   bg-white/95 backdrop-blur-md border-b border-zinc-200 mb-6
                   flex items-center justify-between"
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md
                     border border-zinc-300 text-sm font-medium text-zinc-700
                     hover:bg-zinc-50 transition-colors"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center
                             min-w-[1.125rem] h-[1.125rem] px-1 rounded-full
                             bg-brand-600 text-white text-[11px] font-semibold">
              {activeCount}
            </span>
          )}
        </button>
        <p className="text-xs text-zinc-500 truncate ml-3">
          {active.country === "All" ? "All countries" : active.country}
          <span className="text-zinc-300"> · </span>
          {active.funding_type === "All" ? "Any funding" : active.funding_type}
        </p>
      </div>

      {/* Desktop sidebar — no outer card, hairline dividers between sections */}
      <aside
        className="hidden lg:block lg:sticky lg:top-4 w-56 flex-shrink-0 self-start
                   max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 custom-scrollbar"
      >
        <h2 className="text-sm font-semibold text-zinc-900 mb-1 px-0.5">Filters</h2>
        {hasFilters && (
          <p className="text-xs text-zinc-500 mb-2 px-0.5">
            {activeCount} active
          </p>
        )}
        <FilterContent
          active={active}
          baseUrl={baseUrl}
          countries={countries}
          fundingTypes={fundingTypes}
          degreeLevels={degreeLevels}
          hasFilters={hasFilters}
          buildUrl={buildUrl}
          onClose={handleClose}
        />
      </aside>

      {/* Mobile modal overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-900/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile modal panel */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden flex items-center justify-center p-4
                    ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                    transition-all duration-300`}
      >
        <div
          className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden
                      ${drawerOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}
                      transition-all duration-300`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="size-5 text-zinc-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[calc(90vh-140px)]">
            <FilterContent
              active={active}
              baseUrl={baseUrl}
              countries={countries}
              fundingTypes={fundingTypes}
              degreeLevels={degreeLevels}
              hasFilters={hasFilters}
              buildUrl={buildUrl}
              onClose={handleClose}
            />
          </div>
          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full bg-brand-600 text-white py-3 rounded-lg
                         font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
