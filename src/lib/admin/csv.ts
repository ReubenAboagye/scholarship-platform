// ─────────────────────────────────────────────────────────────
// CSV export helper for admin pages.
//
// Tiny on purpose — no external dep needed. Handles the only
// quoting cases that matter for our data:
//   - values containing commas
//   - values containing double-quotes (escaped by doubling)
//   - values containing newlines
//   - null/undefined → empty string
//   - Date objects → ISO string
//
// If you find yourself needing more (BOM for Excel, custom
// separators, streamed output for large datasets), reach for
// papaparse. For exporting <1000 rows from an admin page this
// is fine.
// ─────────────────────────────────────────────────────────────

export type CsvColumn<T> = {
  key:    keyof T | string;     // string allows derived columns
  header: string;
  // Optional formatter for derived values or transforms.
  // Receives the whole row so derived columns work.
  format?: (row: T) => string | number | null | undefined;
};

function escapeCell(raw: unknown): string {
  if (raw == null)          return '';
  if (raw instanceof Date)  return raw.toISOString();
  let s = String(raw);
  // Neutralize spreadsheet formula injection for Excel/Sheets.
  // Prefixing with an apostrophe preserves the visible value.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  // Quote if the value contains a comma, quote, or newline.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  rows:    T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map(c => escapeCell(c.header)).join(',');
  const lines  = rows.map(row =>
    columns
      .map(c => escapeCell(c.format ? c.format(row) : (row as any)[c.key]))
      .join(',')
  );
  // CRLF for maximum spreadsheet-app compatibility on Windows.
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Convenience: today as YYYY-MM-DD for filenames.
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
