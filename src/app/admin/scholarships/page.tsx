"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, ExternalLink, Search, LayoutGrid, LayoutList, Funnel, ChevronLeft, ChevronRight, MoreHorizontal, Filter } from "lucide-react";
import ScholarshipForm from "@/components/admin/ScholarshipForm";
import { motion, AnimatePresence } from "framer-motion";

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

  const filtered = useMemo(
    () => scholarships.filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.toLowerCase().includes(search.toLowerCase())
    ),
    [scholarships, search]
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (showForm || editing) return (
    <ScholarshipForm
      initial={editing}
      onSaved={() => { setShowForm(false); setEditing(null); load(); }}
      onCancel={() => { setShowForm(false); setEditing(null); }}
    />
  );

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Scholarships Catalog</h1>
          <p className="text-slate-500 text-sm max-w-xl font-medium">
            Overview and management of all scholarship listings on the platform.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> 
          <span>Add New Scholarship</span>
        </button>
      </motion.div>

      {/* Control Bar */}
      <motion.div variants={item} className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, country, or provider..."
              className="w-full rounded-2xl border border-transparent bg-slate-100/80 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-slate-100/80 p-1 rounded-xl">
              <button className="p-2 rounded-lg bg-white shadow-sm text-blue-600"><LayoutList className="h-4 w-4" /></button>
              <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600"><LayoutGrid className="h-4 w-4" /></button>
            </div>
            <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              <Filter className="h-4 w-4" /> 
              <span>Filters</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 rounded-[2.5rem] bg-white border border-slate-200/60 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Catalog...</p>
        </div>
      ) : (
        <motion.div variants={item} className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-left">
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Scholarship</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Country</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Funding</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Deadline</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filtered.map((s) => (
                    <motion.tr 
                      key={s.id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`group hover:bg-blue-50/30 transition-colors ${!s.is_active ? "opacity-60 grayscale-[0.5]" : ""}`}
                    >
                      <td className="px-6 py-5 min-w-[300px]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-inner group-hover:bg-white transition-colors">
                            {countryFlag(s.country)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                            <p className="text-xs font-medium text-slate-400 truncate">{s.provider}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                           {s.country}
                        </span>
                      </td>
                      <td className="px-6 py-5 px-6">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${fundingBadgeColor(s.funding_type)}`}>
                          {s.funding_type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-700">{formatDeadline(s.application_deadline)}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Closes</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => toggleActive(s.id, s.is_active)}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all ${
                            s.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {s.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {s.is_active ? "Live" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditing(s)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:scale-95"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={s.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 transition-all hover:border-slate-400 hover:text-slate-800 hover:shadow-md active:scale-95"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-slate-600">
                             <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching results found</p>
                <button onClick={() => setSearch("")} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Clear all filters</button>
              </div>
            )}
          </div>

          {/* Pagination Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 bg-slate-50/50 border-t border-slate-100 gap-4">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">
              Showing <span className="text-slate-900">{filtered.length > 0 ? 1 : 0}</span> to <span className="text-slate-900">{filtered.length}</span> of <span className="text-slate-900">{filtered.length}</span> total
            </p>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5 px-3">
                 <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold">1</button>
                 <button className="w-8 h-8 rounded-lg text-slate-400 text-xs font-bold hover:bg-slate-200">2</button>
              </div>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
