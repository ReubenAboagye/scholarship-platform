"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import {
  Plus, Pencil, Loader2, ExternalLink, Search,
  LayoutGrid, LayoutList, ChevronLeft, ChevronRight,
  Filter, Download, X, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";

// ─────────────────────────────────────────────────────────────
// Admin scholarships page.
//
// State that survives a refresh / share-link is held in the URL
// search params: search query, view mode, page, and filter
// values. State that's purely transient (filter drawer open?)
// stays in component state.
//
// Everything is client-side because the dataset is small (~20
// rows) and we already had real-time toggle interactions. If the
// catalogue ever crosses ~500 listings we'd push search and
// pagination to the server.
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE          = 20;
const COUNTRY_OPTIONS    = ["UK", "USA", "Germany", "Canada"] as const;
const FUNDING_OPTIONS    = ["Full", "Partial", "Both"] as const;
const STATUS_OPTIONS     = ["all", "active", "inactive"] as const;
const DEADLINE_OPTIONS   = ["all", "open", "closing30", "closed"] as const;

type StatusFilter   = (typeof STATUS_OPTIONS)[number];
type DeadlineFilter = (typeof DEADLINE_OPTIONS)[number];

type Scholarship = {
  id:                   string;
  name:                 string;
  provider:             string | null;
  country:              string;
  funding_type:         string;
  application_deadline: string | null;
  application_url:      string | null;
  is_active:            boolean;
  created_at:           string;
};

// ── URL helpers ──────────────────────────────────────────────
// Read params with sensible fallbacks; write back without
// triggering a full reload (router.replace, scroll: false).

function readArrayParam(sp: URLSearchParams, key: string, allowed: readonly string[]): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw.split(",").filter(v => allowed.includes(v));
}

function readStringParam<T extends string>(
  sp: URLSearchParams, key: string, allowed: readonly T[], fallback: T,
): T {
  const raw = sp.get(key);
  return (raw && (allowed as readonly string[]).includes(raw) ? raw : fallback) as T;
}

// ── Page component ───────────────────────────────────────────

export default function AdminScholarshipsPage() {
  const supabase     = createClient();
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── URL-driven state ──
  const search       = searchParams.get("q") ?? "";
  const view         = readStringParam(searchParams, "view", ["list", "grid"] as const, "list");
  const page         = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const countries    = readArrayParam(searchParams, "country",  COUNTRY_OPTIONS);
  const fundings     = readArrayParam(searchParams, "funding",  FUNDING_OPTIONS);
  const statusFilter = readStringParam(searchParams, "status",   STATUS_OPTIONS,   "all") as StatusFilter;
  const deadlineFilt = readStringParam(searchParams, "deadline", DEADLINE_OPTIONS, "all") as DeadlineFilter;

  // ── Local-only state ──
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // ── URL update helper ──
  // Always reset to page 1 unless the caller explicitly preserves it,
  // because changing a filter on page 5 of "all" probably shouldn't
  // leave you on a page that no longer exists.
  const updateParams = useCallback((patch: Record<string, string | string[] | null>, opts?: { keepPage?: boolean }) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || (Array.isArray(v) ? v.length === 0 : v === "")) {
        next.delete(k);
      } else if (Array.isArray(v)) {
        next.set(k, v.join(","));
      } else {
        next.set(k, v);
      }
    }
    if (!opts?.keepPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, searchParams]);

  // ── Data load ──
  const load = useCallback(async () => {
    const { data } = await supabase
      .from("scholarships")
      .select("*")
      .order("created_at", { ascending: false });
    setScholarships((data ?? []) as Scholarship[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle active ──
  async function toggleActive(id: string, current: boolean) {
    const response = await fetch(`/api/scholarships/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ is_active: !current }),
    });
    if (!response.ok) return;
    setScholarships(prev =>
      prev.map(s => (s.id === id ? { ...s, is_active: !current } : s))
    );
  }

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q   = search.trim().toLowerCase();
    const now = new Date();
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);

    return scholarships.filter(s => {
      // Text search across name, country, provider.
      if (q) {
        const hay = `${s.name} ${s.country} ${s.provider ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (countries.length && !countries.includes(s.country)) return false;
      if (fundings.length  && !fundings.includes(s.funding_type)) return false;
      if (statusFilter === "active"   && !s.is_active) return false;
      if (statusFilter === "inactive" &&  s.is_active) return false;

      if (deadlineFilt !== "all") {
        const dl = s.application_deadline ? new Date(s.application_deadline) : null;
        if (deadlineFilt === "open"       && (!dl || dl < now))                         return false;
        if (deadlineFilt === "closing30"  && (!dl || dl < now || dl > in30))           return false;
        if (deadlineFilt === "closed"     && (!dl || dl >= now))                       return false;
      }
      return true;
    });
  }, [scholarships, search, countries, fundings, statusFilter, deadlineFilt]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── CSV export ──
  function exportCsv() {
    const csv = rowsToCsv(filtered, [
      { key: "name",                 header: "Name" },
      { key: "provider",             header: "Provider" },
      { key: "country",              header: "Country" },
      { key: "funding_type",         header: "Funding" },
      { key: "application_deadline", header: "Deadline" },
      { key: "is_active",            header: "Active",
        format: r => (r.is_active ? "yes" : "no") },
      { key: "application_url",      header: "Application URL" },
      { key: "created_at",           header: "Created At" },
    ]);
    downloadCsv(`scholarships-${todayStamp()}.csv`, csv);
  }

  // ── Filter helpers ──
  const activeFilterCount =
    (countries.length    ? 1 : 0) +
    (fundings.length     ? 1 : 0) +
    (statusFilter !== "all"   ? 1 : 0) +
    (deadlineFilt !== "all"   ? 1 : 0);

  function clearFilters() {
    updateParams({ country: [], funding: [], status: null, deadline: null });
  }

  function toggleArrayValue(key: "country" | "funding", value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateParams({ [key]: next });
  }

  // ── Animation ──
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item      = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-8"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium text-slate-900 display">Scholarships Catalog</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            Liaison &amp; Record Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download filtered list as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <a
            href="/admin/scholarships/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </a>
        </div>
      </motion.div>

      {/* ── Control Bar ─────────────────────────────────── */}
      <motion.div variants={item} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => updateParams({ q: e.target.value || null })}
              placeholder="Search registries..."
              className="w-full rounded border border-slate-100 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-0.5 rounded">
              <button
                onClick={() => updateParams({ view: "list" })}
                aria-pressed={view === "list"}
                className={`p-1.5 rounded transition-colors ${
                  view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => updateParams({ view: "grid" })}
                aria-pressed={view === "grid"}
                className={`p-1.5 rounded transition-colors ${
                  view === "grid" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setFiltersOpen(o => !o)}
              aria-expanded={filtersOpen}
              className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded border bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition ${
                activeFilterCount > 0
                  ? "border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}</span>
            </button>
          </div>
        </div>

        {/* ── Filter drawer (inline, animated) ──────────── */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{    height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Country */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Country</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNTRY_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleArrayValue("country", c, countries)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          countries.includes(c)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{countryFlag(c)}</span>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funding */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Funding</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FUNDING_OPTIONS.map(f => (
                      <button
                        key={f}
                        onClick={() => toggleArrayValue("funding", f, fundings)}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          fundings.includes(f)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => updateParams({ status: s === "all" ? null : s })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          statusFilter === s
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Deadline</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: "all",       label: "All" },
                      { value: "open",      label: "Open" },
                      { value: "closing30", label: "≤ 30 days" },
                      { value: "closed",    label: "Closed" },
                    ].map(d => (
                      <button
                        key={d.value}
                        onClick={() => updateParams({ deadline: d.value === "all" ? null : d.value })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          deadlineFilt === d.value
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    {filtered.length} of {scholarships.length} match current filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={item} className="bg-white border border-slate-200 rounded-lg shadow-sm py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching results found</p>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={() => updateParams({ q: null, country: [], funding: [], status: null, deadline: null })}
              className="mt-4 text-sm font-bold text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : view === "list" ? (
        <ListView rows={pageRows} onToggle={toggleActive} />
      ) : (
        <GridView rows={pageRows} onToggle={toggleActive} />
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900">{pageStart + 1}</span>–
            <span className="text-slate-900">{pageStart + pageRows.length}</span> of{" "}
            <span className="text-slate-900">{filtered.length}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: String(Math.max(1, safePage - 1)) }, { keepPage: true })}
                disabled={safePage <= 1}
                className="w-9 h-9 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) }, { keepPage: true })}
                    aria-current={safePage === p ? "page" : undefined}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      safePage === p
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateParams({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
                disabled={safePage >= totalPages}
                className="w-9 h-9 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── List view ────────────────────────────────────────────────

function ListView({
  rows, onToggle,
}: { rows: Scholarship[]; onToggle: (id: string, current: boolean) => void }) {
  return (
    <motion.div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Scholarship</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Jurisdiction</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Funding</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Deadline</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {rows.map(s => (
                <motion.tr
                  key={s.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  className={`group hover:bg-blue-50/30 transition-colors ${!s.is_active ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  <td className="px-4 py-3.5 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-lg shadow-inner group-hover:bg-white transition-colors">
                        {countryFlag(s.country)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                        <p className="text-[10px] font-normal text-slate-500 truncate mt-0.5">{s.provider}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-tight text-slate-600">
                      {s.country}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest border ${fundingBadgeColor(s.funding_type)} border-current/20`}>
                      {s.funding_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">{formatDeadline(s.application_deadline)}</span>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Closes</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => onToggle(s.id, s.is_active)}
                      className={`inline-flex items-center gap-2 rounded px-3 py-1 text-[10px] font-medium uppercase tracking-wide transition-all border ${
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {s.is_active ? "Live" : "Hold"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/admin/scholarships/${s.id}/edit`}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 shadow-sm active:scale-95"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </a>
                      {s.application_url && (
                        <a
                          href={s.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 shadow-sm active:scale-95"
                          aria-label="Open application URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Grid view ────────────────────────────────────────────────

function GridView({
  rows, onToggle,
}: { rows: Scholarship[]; onToggle: (id: string, current: boolean) => void }) {
  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {rows.map(s => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0 }}
            className={`group bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col ${
              !s.is_active ? "opacity-60 grayscale-[0.4]" : ""
            }`}
          >
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xl shadow-inner shrink-0">
                  {countryFlag(s.country)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-[10px] font-normal text-slate-500 truncate mt-0.5">{s.provider}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[9px] font-medium uppercase tracking-tight text-slate-600">
                  {s.country}
                </span>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest border ${fundingBadgeColor(s.funding_type)} border-current/20`}>
                  {s.funding_type}
                </span>
              </div>

              <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 mt-auto">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="uppercase tracking-tight">Closes {formatDeadline(s.application_deadline)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between gap-2">
              <button
                onClick={() => onToggle(s.id, s.is_active)}
                className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-all border ${
                  s.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {s.is_active ? "Live" : "Hold"}
              </button>
              <div className="flex items-center gap-1.5">
                <a
                  href={`/admin/scholarships/${s.id}/edit`}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 shadow-sm active:scale-95"
                  aria-label="Edit"
                >
                  <Pencil className="w-3 h-3" />
                </a>
                {s.application_url && (
                  <a
                    href={s.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 transition-all hover:border-slate-900 hover:text-slate-900 shadow-sm active:scale-95"
                    aria-label="Open application URL"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
