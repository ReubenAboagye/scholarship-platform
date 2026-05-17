"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Shared DataTable component
//
// Extracts common patterns from the admin list pages:
//   - Search input with icon
//   - Loading skeleton / empty state
//   - Pagination controls
//   - Optional CSV export trigger
//
// The actual row rendering is left to the caller via the
// `renderRow` prop so each page keeps its bespoke cell UI.
// ─────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  /* data */
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;

  /* identity */
  keyExtractor: (row: T) => string;
  renderRow: (row: T) => React.ReactNode;

  /* search */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /* pagination */
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;

  /* csv export */
  onExportCsv?: () => void;
  exportLabel?: string;

  /* optional top-right slot (filters, view toggles, etc.) */
  headerActions?: React.ReactNode;

  /* optional row click */
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  rows,
  loading = false,
  emptyMessage = "No results found",
  keyExtractor,
  renderRow,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  page,
  pageSize,
  totalRows,
  onPageChange,
  onExportCsv,
  exportLabel = "Export CSV",
  headerActions,
  onRowClick,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalRows);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {headerActions}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              disabled={loading || totalRows === 0}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-all disabled:opacity-40"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">{exportLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="size-5 animate-spin text-zinc-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Search className="size-6 text-zinc-300 mb-2" />
            <p className="text-sm font-medium text-zinc-500">{emptyMessage}</p>
            <p className="text-xs text-zinc-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <div
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && "cursor-pointer hover:bg-zinc-50 transition-colors")}
              >
                {renderRow(row)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {pageStart}–{pageEnd} of {totalRows.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="p-1.5 rounded-md hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4 text-zinc-600" />
            </button>
            <span className="text-xs font-medium text-zinc-600 px-2 min-w-[3rem] text-center">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-md hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="size-4 text-zinc-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
