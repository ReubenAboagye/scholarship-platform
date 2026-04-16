"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlagUrl, formatDeadline, statusColor, isDeadlineUrgent } from "@/lib/utils";
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
    <div className="max-w-4xl mx-auto space-y-4 pb-16">

      {/* ── Header ── */}
      <div className="pb-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Applications</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">
              {items.length > 0
                ? `Tracking ${items.length} application${items.length !== 1 ? "s" : ""} across ${new Set(items.map((i) => i.scholarship?.country).filter(Boolean)).size} countr${new Set(items.map((i) => i.scholarship?.country).filter(Boolean)).size === 1 ? "y" : "ies"}.`
                : "Track the status of your scholarship applications in one place."}
            </p>
          </div>
          <Link href="/scholarships"
            className="hidden sm:flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all px-3.5 py-2 rounded-lg mt-1">
            Browse <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, key, color }) => {
            const count = key ? items.filter((i) => i.status === key).length : items.length;
            const pct   = Math.round((count / Math.max(items.length, 1)) * 100);
            return (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                <p className="text-2xl font-bold text-slate-900 leading-none">{count}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border inline-block ${color}`}>
                  {label}
                </span>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filters ── */}
      {items.length > 0 && (
        <div className="space-y-3">
          {/* Status filter — scrollable on mobile */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {(["All", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s as Status | "All")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                    activeFilter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
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
                    {c === "All" ? "All Countries" : c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-5 h-5 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">No applications tracked yet</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
            Browse scholarships and click <strong>Track</strong> on any listing to add it here.
          </p>
          <Link href="/scholarships" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all">
            Find Scholarships <ArrowRight className="w-3.5 h-3.5" />
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
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 p-4"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* ── Card top row ── */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Flag */}
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {countryFlagUrl(s.country) ? (
                      <img src={countryFlagUrl(s.country)!} alt={s.country} className="w-5 h-3.5 object-cover rounded-sm" />
                    ) : (
                      <span className="text-xs text-slate-400">{s.country?.slice(0,2)}</span>
                    )}
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {s.country} · {formatDeadline(s.application_deadline).replace(" (Closed)", "")}
                    </p>
                  </div>

                  {/* Delete only in top-right — compact */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove from tracker"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ── Status stepper — horizontal scroll on mobile ── */}
                <div className="flex items-center gap-0 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
                  {STEPPER_STATUSES.map((st, i) => {
                    const isDone   = i < curIdx;
                    const isActive = i === curIdx;
                    return (
                      <div key={st} className="flex items-center flex-shrink-0">
                        <button
                          onClick={() => updateStatus(item.id, st)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                            isActive
                              ? "bg-slate-900 text-white"
                              : isDone
                              ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              : "text-slate-300 hover:text-slate-500"
                          }`}
                        >
                          {st}
                        </button>
                        {i < STEPPER_STATUSES.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-200 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  {(item.status === "Rejected" || item.status === "Withdrawn") && (
                    <span className={`ml-2 flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  )}
                </div>

                {/* ── Footer: actions + funding ── */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                  {s.funding_type && (
                    <span className="text-xs text-slate-400 flex-1 whitespace-nowrap">{s.funding_type} funding</span>
                  )}
                  {item.match_score && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {item.match_score}% match
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Link
                      href={`/scholarships/${s.slug ?? s.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:border-slate-300 transition-all"
                    >
                      Details
                    </Link>
                    <a
                      href={s.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
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
