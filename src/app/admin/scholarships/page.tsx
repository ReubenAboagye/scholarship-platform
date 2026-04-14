"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, ExternalLink, Search, LayoutGrid, LayoutList, Funnel, ChevronLeft, ChevronRight } from "lucide-react";
import ScholarshipForm from "@/components/admin/ScholarshipForm";

export default function AdminScholarshipsPage() {
  const supabase = createClient();
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("scholarships")
      .select("*")
      .order("created_at", { ascending: false });
    setScholarships(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(id: string, current: boolean) {
    const response = await fetch(`/api/scholarships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });

    if (!response.ok) return;

    setScholarships((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
    );
  }

  const activeCount = useMemo(
    () => scholarships.filter((s) => s.is_active).length,
    [scholarships]
  );

  const filtered = useMemo(
    () => scholarships.filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.toLowerCase().includes(search.toLowerCase())
    ),
    [scholarships, search]
  );

  if (showForm || editing) return (
    <ScholarshipForm
      initial={editing}
      onSaved={() => { setShowForm(false); setEditing(null); load(); }}
      onCancel={() => { setShowForm(false); setEditing(null); }}
    />
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <h1 className="font-black text-3xl text-slate-900">Scholarships</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Manage the scholarship catalog, activate or deactivate listings, and keep deadlines up to date.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Scholarship
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex-1 min-w-0">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scholarship name, country, or provider"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
              <LayoutList className="h-4 w-4" /> List
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
              <LayoutGrid className="h-4 w-4" /> Grid
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
              <Funnel className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-56 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-5 py-4">Scholarship</th>
                  <th className="px-5 py-4">Country</th>
                  <th className="px-5 py-4">Funding</th>
                  <th className="px-5 py-4">Deadline</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className={`border-t border-slate-100 transition hover:bg-slate-50 ${!s.is_active ? "opacity-80" : ""}`}>
                    <td className="px-5 py-5 max-w-[320px]">
                      <p className="font-semibold text-slate-900 truncate">{s.name}</p>
                      <p className="mt-1 text-xs text-slate-500 truncate">{s.provider}</p>
                    </td>
                    <td className="px-5 py-5 text-slate-600 text-sm whitespace-nowrap">{countryFlag(s.country)} {s.country}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${fundingBadgeColor(s.funding_type)}`}>
                        {s.funding_type}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-slate-600 text-sm whitespace-nowrap">{formatDeadline(s.application_deadline)}</td>
                    <td className="px-5 py-5">
                      <button
                        onClick={() => toggleActive(s.id, s.is_active)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {s.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {s.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-5 text-right space-x-2">
                      <button
                        onClick={() => setEditing(s)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        aria-label="Edit scholarship"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <a
                        href={s.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Open application URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-sm">No scholarships match your query.</div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing 1 to {Math.min(filtered.length, 10)} of {filtered.length} results</p>
            <div className="inline-flex items-center gap-2">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">1</button>
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">2</button>
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
