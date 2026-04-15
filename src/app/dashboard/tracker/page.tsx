"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, statusColor } from "@/lib/utils";
import { ListChecks, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUSES = ["Interested","In Progress","Submitted","Awaiting Decision","Accepted","Rejected","Withdrawn"] as const;

export default function TrackerPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      const { data } = await supabase
        .from("application_tracker")
        .select("*, scholarship:scholarships(*)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("application_tracker").update({ status }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-black text-2xl text-slate-900">Application Tracker</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track the status of your scholarship applications.</p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "In Progress", status: "In Progress", color: "bg-blue-50 text-blue-600 border-blue-100" },
            { label: "Submitted",   status: "Submitted",   color: "bg-violet-50 text-violet-600 border-violet-100" },
            { label: "Accepted",    status: "Accepted",    color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { label: "Total Applications", status: null,   color: "bg-slate-50 text-slate-600 border-slate-100" },
          ].map((s) => (
            <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-ambient text-center animate-fade-up">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {s.status ? items.filter((i) => i.status === s.status).length : items.length}
              </p>
              <span className={`text-[10px] px-2.5 py-1 font-black uppercase tracking-widest mt-2 inline-block rounded-full border ${s.color}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center animate-fade-in">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListChecks className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-black text-slate-900 text-xl mb-2">No applications tracked yet</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Start tracking your journey by adding scholarships to your dashboard.</p>
          <Link href="/scholarships" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
            Find Scholarships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any, idx) => {
            const s = item.scholarship;
            if (!s) return null;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-ambient p-6 hover:shadow-elevated transition-all animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xlgrayscale group-hover:grayscale-0 transition-all">{countryFlag(s.country)}</span>
                      <h3 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{s.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 mb-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider">{s.provider}</span>
                      </div>
                      <span className="text-slate-200">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider">Deadline: {formatDeadline(s.application_deadline)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((st) => (
                        <button key={st} onClick={() => updateStatus(item.id, st)}
                          className={`text-[10px] px-3 py-1.5 font-black uppercase tracking-widest rounded-lg transition-all ${
                            item.status === st
                              ? statusColor(st) + " shadow-sm ring-1 ring-current"
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          }`}>
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2 flex-shrink-0">
                    <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                      Apply Now <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
