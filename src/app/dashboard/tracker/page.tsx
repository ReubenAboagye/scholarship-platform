"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, statusColor } from "@/lib/utils";
import Link from "next/link";
import { ListChecks, ExternalLink, Loader2 } from "lucide-react";

const STATUSES = ["Interested","In Progress","Submitted","Awaiting Decision","Accepted","Rejected","Withdrawn"] as const;

export default function TrackerPage() {
  const supabase = createClient();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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
    await supabase.from("application_tracker").update({ status }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-slate-900">Application Tracker</h1>
        <p className="text-slate-500 text-sm mt-1">Track the status of your scholarship applications.</p>
      </div>

      {/* Status summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "In Progress", status: "In Progress", color: "bg-blue-100 text-blue-700" },
            { label: "Submitted",   status: "Submitted",   color: "bg-violet-100 text-violet-700" },
            { label: "Accepted",    status: "Accepted",    color: "bg-emerald-100 text-emerald-700" },
            { label: "Total",       status: null,          color: "bg-slate-100 text-slate-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {s.status ? items.filter((i) => i.status === s.status).length : items.length}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${s.color}`}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No applications tracked yet</h3>
          <p className="text-slate-500 text-sm mb-4">Browse scholarships and add them to your tracker.</p>
          <Link href="/scholarships" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Browse Scholarships
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const s = item.scholarship;
            if (!s) return null;
            return (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{countryFlag(s.country)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-[15px] leading-snug">{s.name}</h3>
                      <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{s.provider} · Deadline: {formatDeadline(s.application_deadline)}</p>

                    {/* Status selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStatus(item.id, st)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            item.status === st
                              ? statusColor(st) + " ring-2 ring-offset-1 ring-current"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
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
