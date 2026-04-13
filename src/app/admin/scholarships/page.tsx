"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, ExternalLink, Search } from "lucide-react";
import ScholarshipForm from "@/components/admin/ScholarshipForm";

export default function AdminScholarshipsPage() {
  const supabase = createClient();
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<any | null>(null);

  async function load() {
    const { data } = await supabase
      .from("scholarships")
      .select("*")
      .order("created_at", { ascending: false });
    setScholarships(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("scholarships").update({ is_active: !current }).eq("id", id);
    setScholarships((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  }

  const filtered = scholarships.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase())
  );

  if (showForm || editing) return (
    <ScholarshipForm
      initial={editing}
      onSaved={() => { setShowForm(false); setEditing(null); load(); }}
      onCancel={() => { setShowForm(false); setEditing(null); }}
    />
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Scholarships</h1>
          <p className="text-slate-500 text-sm mt-1">{scholarships.length} total scholarships</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Scholarship
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scholarships…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Scholarship</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Country</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Funding</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${!s.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 max-w-xs truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-xs">{s.provider}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {countryFlag(s.country)} {s.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fundingBadgeColor(s.funding_type)}`}>
                        {s.funding_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{formatDeadline(s.application_deadline)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(s.id, s.is_active)} className="flex items-center gap-1 text-xs font-medium transition-colors">
                        {s.is_active
                          ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                          : <><ToggleLeft  className="w-5 h-5 text-slate-400"  /><span className="text-slate-400">Inactive</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No scholarships found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
