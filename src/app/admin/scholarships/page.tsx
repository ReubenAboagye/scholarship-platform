"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import {
  Plus, Pencil, Loader2, ExternalLink, Search,
  LayoutGrid, LayoutList, ChevronLeft, ChevronRight,
  Filter, Download, X, Calendar, Trash2, Eye, Copy,
  Square, SquareCheck, Power,
} from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";
import { readArrayParam, readStringParam } from "@/lib/admin/url-state";
import ActionDropdown from "@/components/admin/ActionDropdown";
import { useToast } from "@/components/admin/ToastProvider";

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

// ── Page component ───────────────────────────────────────────


export default function AdminScholarshipsPage() {
  const supabase     = createClient();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const toast        = useToast();

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
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

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
    if (!response.ok) { toast.addToast("Failed to update status", "error"); return; }
    setScholarships(prev =>
      prev.map(s => (s.id === id ? { ...s, is_active: !current } : s))
    );
    toast.addToast(current ? "Scholarship paused" : "Scholarship activated", "success");
  }

  // ── Delete ──
  // -- Soft Delete --
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; reason: string } | null>(null);

  async function deleteScholarship(id: string) {
    setConfirmDelete({ id, reason: "" });
  }

  async function applyDelete() {
    if (!confirmDelete) return;
    const { id, reason } = confirmDelete;
    if (!reason.trim() || reason.trim().length < 5) {
      toast.addToast("Please provide a reason with at least 5 characters.", "error");
      return;
    }
    const response = await fetch(`/api/scholarships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "soft_delete", reason: reason.trim() }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      toast.addToast(body?.error ?? "Failed to delete scholarship", "error");
      return;
    }
    setScholarships(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    setConfirmDelete(null);
    toast.addToast("Scholarship removed (soft delete)", "success");
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

  // ── Bulk selection helpers (must be after pageRows) ──
  const allPageSelected = pageRows.length > 0 && pageRows.every(r => selectedIds.has(r.id));
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageRows.forEach(r => next.delete(r.id));
      } else {
        pageRows.forEach(r => next.add(r.id));
      }
      return next;
    });
  }
  function clearSelection() { setSelectedIds(new Set()); }

  async function runBulkRequest(
    ids: string[],
    requestFor: (id: string) => Promise<Response>
  ) {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const response = await requestFor(id);
        if (!response.ok) throw new Error(await response.text());
        return id;
      })
    );

    const succeeded = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    const failed = results.length - succeeded.length;
    return { succeeded, failed };
  }

  async function bulkActivate() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { succeeded, failed } = await runBulkRequest(ids, id => fetch(`/api/scholarships/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    }));
    if (succeeded.length > 0) {
      const succeededSet = new Set(succeeded);
      setScholarships(prev => prev.map(s => succeededSet.has(s.id) ? { ...s, is_active: true } : s));
      toast.addToast(`${succeeded.length} scholarship(s) activated`, "success");
    }
    if (failed > 0) toast.addToast(`${failed} scholarship action(s) failed`, "error");
    setSelectedIds(new Set(ids.filter(id => !succeeded.includes(id))));
  }

  async function bulkDeactivate() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { succeeded, failed } = await runBulkRequest(ids, id => fetch(`/api/scholarships/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    }));
    if (succeeded.length > 0) {
      const succeededSet = new Set(succeeded);
      setScholarships(prev => prev.map(s => succeededSet.has(s.id) ? { ...s, is_active: false } : s));
      toast.addToast(`${succeeded.length} scholarship(s) paused`, "success");
    }
    if (failed > 0) toast.addToast(`${failed} scholarship action(s) failed`, "error");
    setSelectedIds(new Set(ids.filter(id => !succeeded.includes(id))));
  }

  const [bulkDeleteReason, setBulkDeleteReason] = useState("");

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!bulkDeleteReason.trim() || bulkDeleteReason.trim().length < 5) {
      toast.addToast("Please provide a reason with at least 5 characters for bulk removal.", "error");
      return;
    }
    const { succeeded, failed } = await runBulkRequest(ids, id =>
      fetch(`/api/scholarships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soft_delete", reason: bulkDeleteReason.trim() }),
      })
    );
    if (succeeded.length > 0) {
      const succeededSet = new Set(succeeded);
      setScholarships(prev => prev.filter(s => !succeededSet.has(s.id)));
      toast.addToast(`${succeeded.length} scholarship(s) removed (soft delete)`, "success");
    }
    if (failed > 0) toast.addToast(`${failed} scholarship action(s) failed`, "error");
    setSelectedIds(new Set(ids.filter(id => !succeeded.includes(id))));
    setBulkDeleteReason("");
  }

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
    <LazyMotion features={domAnimation}>
      <m.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-8"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <m.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium text-zinc-900 display">Scholarships Catalog</h1>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-1">
            Liaison &amp; Record Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 font-medium rounded text-xs uppercase tracking-widest transition-all hover:bg-zinc-50 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download filtered list as CSV"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>
          <a
            href="/admin/scholarships/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>New Entry</span>
          </a>
        </div>
      </m.div>

      {/* ── Control Bar ─────────────────────────────────── */}
      <m.div variants={item} className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -tranzinc-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => updateParams({ q: e.target.value || null })}
              placeholder="Search registries..."
              className="w-full rounded border border-zinc-100 bg-zinc-50 py-2 pl-10 pr-4 text-xs text-zinc-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex bg-zinc-100 p-0.5 rounded">
              <button
                onClick={() => updateParams({ view: "list" })}
                aria-pressed={view === "list"}
                className={`p-1.5 rounded transition-colors ${
                  view === "list" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                }`}
                title="List view"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => updateParams({ view: "grid" })}
                aria-pressed={view === "grid"}
                className={`p-1.5 rounded transition-colors ${
                  view === "grid" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
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
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
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
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{    height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Country */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Country</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNTRY_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleArrayValue("country", c, countries)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          countries.includes(c)
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
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
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Funding</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FUNDING_OPTIONS.map(f => (
                      <button
                        key={f}
                        onClick={() => toggleArrayValue("funding", f, fundings)}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          fundings.includes(f)
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => updateParams({ status: s === "all" ? null : s })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          statusFilter === s
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Deadline</p>
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
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                    {filtered.length} of {scholarships.length} match current filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600 hover:text-zinc-900"
                  >
                    <X className="size-3" />
                    Clear filters
                  </button>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* ── Bulk actions bar ──────────────────────────── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900 text-white rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium">
                {selectedIds.size} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkActivate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium uppercase tracking-wider transition-colors"
              >
                <Power className="size-3" /> Activate
              </button>
              <button
                onClick={bulkDeactivate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-[10px] font-medium uppercase tracking-wider transition-colors"
              >
                <Power className="size-3" /> Pause
              </button>
              <button
                onClick={bulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-medium uppercase tracking-wider transition-colors"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <Loader2 className="size-8 animate-spin text-blue-500 mb-4" />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <m.div variants={item} className="bg-white border border-zinc-200 rounded-lg shadow-sm py-20 text-center">
          <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-6">
            <Search className="size-8 text-zinc-200" />
          </div>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No matching results found</p>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={() => updateParams({ q: null, country: [], funding: [], status: null, deadline: null })}
              className="mt-4 text-sm font-bold text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </m.div>
      ) : view === "list" ? (
        <ListView
          rows={pageRows}
          onToggle={toggleActive}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onSelectAll={toggleSelectAll}
          allSelected={allPageSelected}
          onDelete={deleteScholarship}
        />
      ) : (
        <GridView
          rows={pageRows}
          onToggle={toggleActive}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onDelete={deleteScholarship}
        />
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <m.div variants={item} className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            Showing <span className="text-zinc-900">{pageStart + 1}</span>–
            <span className="text-zinc-900">{pageStart + pageRows.length}</span> of{" "}
            <span className="text-zinc-900">{filtered.length}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: String(Math.max(1, safePage - 1)) }, { keepPage: true })}
                disabled={safePage <= 1}
                className="size-9 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className={`size-8 rounded text-xs font-medium transition-colors ${
                      safePage === p
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateParams({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
                disabled={safePage >= totalPages}
                className="size-9 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </m.div>
      )}
      </m.div>
    </LazyMotion>
  );
}

// ── List view ────────────────────────────────────────────────

function ListView({
  rows,
  onToggle,
  selectedIds,
  onSelect,
  onSelectAll,
  allSelected,
  onDelete,
}: {
  rows: Scholarship[];
  onToggle: (id: string, current: boolean) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <m.div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
              <th className="p-3 w-10">
                <button
                  onClick={onSelectAll}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors"
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                >
                  {allSelected ? <SquareCheck className="size-4" /> : <Square className="size-4" />}
                </button>
              </th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Scholarship</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Jurisdiction</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Funding</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Deadline</th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <AnimatePresence mode="popLayout">
              {rows.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <m.tr
                    key={s.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`group hover:bg-blue-50/30 transition-colors ${!s.is_active ? "opacity-60 grayscale-[0.5]" : ""} ${isSelected ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="p-3.5">
                      <button
                        onClick={() => onSelect(s.id)}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                        aria-label={isSelected ? "Deselect" : "Select"}
                      >
                        {isSelected ? <SquareCheck className="size-4 text-blue-600" /> : <Square className="size-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 min-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-zinc-100 flex items-center justify-center text-lg shadow-inner group-hover:bg-white transition-colors">
                          {countryFlag(s.country)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                          <p className="text-[10px] font-normal text-zinc-500 truncate mt-0.5">{s.provider}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-medium uppercase tracking-tight text-zinc-600">
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
                        <span className="text-xs font-medium text-zinc-700">{formatDeadline(s.application_deadline)}</span>
                        <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter mt-0.5">Closes</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onToggle(s.id, s.is_active)}
                        className={`inline-flex items-center gap-2 rounded px-3 py-1 text-[10px] font-medium uppercase tracking-wide transition-all border ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {s.is_active ? "Live" : "Hold"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/admin/scholarships/${s.id}/edit`}
                          className="size-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 transition-all hover:border-zinc-900 hover:text-zinc-900 shadow-sm active:scale-95"
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </a>
                        {s.application_url && (
                          <a
                            href={s.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-8 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 transition-all hover:border-zinc-900 hover:text-zinc-900 shadow-sm active:scale-95"
                            aria-label="Open application URL"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        <ActionDropdown
                          actions={[
                            {
                              label: "View Public",
                              icon: <Eye className="size-3.5" />,
                              onClick: () => window.open(`/scholarships/${s.id}`, "_blank"),
                            },
                            {
                              label: "Copy ID",
                              icon: <Copy className="size-3.5" />,
                              onClick: () => { navigator.clipboard.writeText(s.id); },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="size-3.5" />,
                              danger: true,
                              onClick: () => onDelete(s.id),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </m.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </m.div>
  );
}

// ── Grid view ────────────────────────────────────────────────

function GridView({
  rows,
  onToggle,
  selectedIds,
  onSelect,
  onDelete,
}: {
  rows: Scholarship[];
  onToggle: (id: string, current: boolean) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <m.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {rows.map(s => {
          const isSelected = selectedIds.has(s.id);
          return (
            <m.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`group bg-white border rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col ${
                !s.is_active ? "opacity-60 grayscale-[0.4]" : ""
              } ${isSelected ? "border-blue-400 ring-1 ring-blue-400/30" : "border-zinc-200"}`}
            >
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-10 rounded bg-zinc-100 flex items-center justify-center text-xl shadow-inner shrink-0">
                    {countryFlag(s.country)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-[10px] font-normal text-zinc-500 truncate mt-0.5">{s.provider}</p>
                  </div>
                  <button
                    onClick={() => onSelect(s.id)}
                    className="text-zinc-400 hover:text-blue-600 transition-colors"
                    aria-label={isSelected ? "Deselect" : "Select"}
                  >
                    {isSelected ? <SquareCheck className="size-4 text-blue-600" /> : <Square className="size-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[9px] font-medium uppercase tracking-tight text-zinc-600">
                    {s.country}
                  </span>
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest border ${fundingBadgeColor(s.funding_type)} border-current/20`}>
                    {s.funding_type}
                  </span>
                </div>

                <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-1.5 mt-auto">
                  <Calendar className="size-3 text-zinc-400" />
                  <span className="uppercase tracking-tight">Closes {formatDeadline(s.application_deadline)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 px-3 py-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggle(s.id, s.is_active)}
                  className={`inline-flex items-center gap-2 rounded px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-all border ${
                    s.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80"
                      : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {s.is_active ? "Live" : "Hold"}
                </button>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`/admin/scholarships/${s.id}/edit`}
                    className="size-7 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 transition-all hover:border-zinc-900 hover:text-zinc-900 shadow-sm active:scale-95"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </a>
                  {s.application_url && (
                    <a
                      href={s.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-7 flex items-center justify-center rounded bg-white border border-zinc-200 text-zinc-400 transition-all hover:border-zinc-900 hover:text-zinc-900 shadow-sm active:scale-95"
                      aria-label="Open application URL"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  <ActionDropdown
                    align="right"
                    actions={[
                      {
                        label: "View Public",
                        icon: <Eye className="size-3.5" />,
                        onClick: () => window.open(`/scholarships/${s.id}`, "_blank"),
                      },
                      {
                        label: "Copy ID",
                        icon: <Copy className="size-3.5" />,
                        onClick: () => { navigator.clipboard.writeText(s.id); },
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="size-3.5" />,
                        danger: true,
                        onClick: () => onDelete(s.id),
                      },
                    ]}
                  />
                </div>
              </div>
            </m.div>
          );
        })}
      </AnimatePresence>
    </m.div>
  );
}
