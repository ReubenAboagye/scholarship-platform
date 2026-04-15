"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlag, formatDeadline, statusColor, isDeadlineUrgent } from "@/lib/utils";
import {
  ListChecks, ExternalLink, Loader2, ArrowRight, Trash2, ChevronRight,
} from "lucide-react";
import Link from "next/link";

const STATUSES = [
  "Interested",
  "In Progress",
  "Submitted",
  "Awaiting Decision",
  "Accepted",
  "Rejected",
  "Withdrawn",
] as const;

type Status = (typeof STATUSES)[number];

// Only show first 5 in the stepper to keep it readable
const STEPPER_STATUSES: Status[] = [
  "Interested",
  "In Progress",
  "Submitted",
  "Awaiting Decision",
  "Accepted",
];

const STAT_CARDS = [
  { label: "Total",            key: null,              color: "bg-slate-50 text-slate-600 border-slate-200" },
  { label: "In Progress",      key: "In Progress",     color: "bg-brand-50 text-brand-700 border-brand-200" },
  { label: "Submitted",        key: "Submitted",       color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Accepted",         key: "Accepted",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
] as const;

export default function TrackerPage() {
  const [items,          setItems]          = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activeFilter,   setActiveFilter]   = useState<Status | "All">("All");
  const [activeCountry,  setActiveCountry]  = useState<string>("All");

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

  async function updateStatus(id: string, status: Status) {
    const supabase = createClient();
    await supabase.from("application_tracker").update({ status }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("application_tracker").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Derived country list from items
  const countries = Array.from(new Set(items.map((i) => i.scholarship?.country).filter(Boolean)));

  const filtered = items.filter((i) => {
    const matchStatus  = activeFilter  === "All" || i.status === activeFilter;
    const matchCountry = activeCountry === "All" || i.scholarship?.country === activeCountry;
    return matchStatus && matchCountry;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex items-end justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage your scholarship applications</p>
        </div>
        <Link
          href="/scholarships"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition-colors"
        >
          Browse Scholarships <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Stats row ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, key, color }) => {
            const count = key ? items.filter((i) => i.status === key).length : items.length;
            const pct   = Math.round((count / Math.max(items.length, 1)) * 100);
            return (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-ambient p-4 space-y-2">
                <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{count}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border inline-block ${color}`}>
                  {label}
                </span>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filters ── */}
      {items.length > 0 && (
        <div className="space-y-3">
          {/* Status filter */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {(["All", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s as Status | "All")}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                    activeFilter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Country filter — only shown when multiple countries exist */}
          {countries.length > 1 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Country</p>
              <div className="flex flex-wrap gap-2">
                {(["All", ...countries] as string[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCountry(c)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                      activeCountry === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {c === "All" ? "All Countries" : `${countryFlag(c)} ${c}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListChecks className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-black text-slate-900 text-xl mb-2">No applications tracked yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Browse scholarships and click <strong>Track</strong> on any listing to add it here.
          </p>
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Find Scholarships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-sm">No applications match this filter.</p>
        </div>

      ) : (
        <div className="space-y-4">
          {filtered.map((item: any, idx: number) => {
            const s = item.scholarship;
            if (!s) return null;
            const urgent    = isDeadlineUrgent(s.application_deadline);
            const curIdx    = STEPPER_STATUSES.indexOf(item.status as Status);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-ambient hover:shadow-elevated transition-all duration-200 p-5 animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* ── Card top row ── */}
                <div className="flex items-start gap-4 mb-4">

                  {/* Country badge */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                    {countryFlag(s.country)}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-tight tracking-tight truncate">
                      {s.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.provider}
                      </span>
                      <span className="text-slate-200 text-[10px]">•</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        urgent ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {urgent && "⚠ "}Deadline: {formatDeadline(s.application_deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={s.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                    <Link
                      href={`/scholarships/${s.slug ?? s.id}`}
                      className="flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:border-slate-300 transition-all"
                    >
                      Details <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Status stepper ── */}
                <div className="flex items-center gap-0 overflow-x-auto pb-1">
                  {STEPPER_STATUSES.map((st, i) => {
                    const isDone   = i < curIdx;
                    const isActive = i === curIdx;
                    return (
                      <div key={st} className="flex items-center">
                        <button
                          onClick={() => updateStatus(item.id, st)}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : isDone
                              ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {st}
                        </button>
                        {i < STEPPER_STATUSES.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-200 flex-shrink-0 mx-0.5" />
                        )}
                      </div>
                    );
                  })}

                  {/* Rejected / Withdrawn as separate pill at end */}
                  {(item.status === "Rejected" || item.status === "Withdrawn") && (
                    <span className={`ml-3 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  )}
                </div>

                {/* ── Footer: funding + match score ── */}
                {(s.funding_type || item.match_score) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                    {s.funding_type && (
                      <>
                        <span className="text-[10px] text-slate-400 font-semibold">Funding</span>
                        <span className="text-[11px] font-bold text-slate-600">{s.funding_type}</span>
                      </>
                    )}
                    {item.match_score && (
                      <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {item.match_score}% match
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
