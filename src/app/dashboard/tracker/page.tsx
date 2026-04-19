"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { countryFlagUrl, formatDeadline, statusColor, isDeadlineUrgent } from "@/lib/utils";
import {
  ListChecks, ExternalLink, Loader2, ArrowRight, Trash2,
  ChevronRight, LayoutGrid, List, StickyNote, X, Check,
  CalendarPlus,
} from "lucide-react";
import { downloadScholarshipICS } from "@/lib/utils/ics";

const STATUSES = [
  "Interested", "In Progress", "Submitted",
  "Awaiting Decision", "Accepted", "Rejected", "Withdrawn",
] as const;
type Status = (typeof STATUSES)[number];

const KANBAN_COLS: { status: Status; color: string; dot: string }[] = [
  { status: "Interested",       color: "bg-slate-50 border-slate-200",   dot: "bg-slate-300" },
  { status: "In Progress",      color: "bg-blue-50 border-blue-200",     dot: "bg-blue-400" },
  { status: "Submitted",        color: "bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  { status: "Awaiting Decision",color: "bg-amber-50 border-amber-200",   dot: "bg-amber-400" },
  { status: "Accepted",         color: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-500" },
];

const STAT_CARDS = [
  { label: "Total",        key: null,              color: "bg-slate-50 text-slate-600 border-slate-200" },
  { label: "In Progress",  key: "In Progress",     color: "bg-brand-50 text-brand-700 border-brand-200" },
  { label: "Submitted",    key: "Submitted",       color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Accepted",     key: "Accepted",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
] as const;

// ── Notes drawer ──────────────────────────────────────────────

function NotesDrawer({ item, onClose, onSave }: {
  item: any;
  onClose: () => void;
  onSave: (id: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(item.id, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm truncate max-w-[280px]">{item.scholarship?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Notes & Essay Draft
            </label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Add notes, draft your essay, or track key requirements here…"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">{notes.length} characters</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {item.scholarship?.application_deadline && (
              <span>Deadline: <span className="font-semibold text-slate-600">{formatDeadline(item.scholarship.application_deadline)}</span></span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tracker card (shared by list + kanban) ────────────────────

function TrackerCard({ item, onStatusChange, onDelete, onOpenNotes }: {
  item: any;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (item: any) => void;
}) {
  const s = item.scholarship;
  if (!s) return null;
  const urgent  = isDeadlineUrgent(s.application_deadline);
  const curIdx  = KANBAN_COLS.findIndex(c => c.status === item.status);
  const col     = KANBAN_COLS[curIdx];

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {countryFlagUrl(s.country)
            ? <img src={countryFlagUrl(s.country)!} alt={s.country} className="w-5 h-3.5 object-cover rounded-sm" />
            : <span className="text-xs text-slate-400">{s.country?.slice(0, 2)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{s.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {s.country} · <span className={urgent ? "text-red-500 font-semibold" : ""}>{formatDeadline(s.application_deadline)}</span>
          </p>
        </div>
        <button onClick={() => onDelete(item.id)}
          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status stepper — horizontal scroll */}
      <div className="flex items-center overflow-x-auto pb-0.5 -mx-1 px-1 gap-0 scrollbar-none">
        {KANBAN_COLS.map((col, i) => {
          const isDone   = i < curIdx;
          const isActive = i === curIdx;
          return (
            <div key={col.status} className="flex items-center flex-shrink-0">
              <button
                onClick={() => onStatusChange(item.id, col.status)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  isActive ? "bg-slate-900 text-white"
                  : isDone  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "text-slate-300 hover:text-slate-500"
                }`}>
                {col.status}
              </button>
              {i < KANBAN_COLS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-200 flex-shrink-0" />}
            </div>
          );
        })}
        {(item.status === "Rejected" || item.status === "Withdrawn") && (
          <span className={`ml-2 flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor(item.status)}`}>
            {item.status}
          </span>
        )}
      </div>

      {/* Notes preview */}
      {item.notes && (
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2 italic">
          {item.notes}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
        <span className="text-xs text-slate-400 flex-1">{s.funding_type} funding</span>
        {s.application_deadline && (
          <button
            onClick={() => downloadScholarshipICS(s.name, s.application_deadline)}
            title="Add deadline to calendar"
            className="p-1.5 border border-slate-200 text-slate-400 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all">
            <CalendarPlus className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onOpenNotes(item)}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:border-brand-300 hover:text-brand-600 transition-all">
          <StickyNote className="w-3 h-3" />
          {item.notes ? "Edit notes" : "Add notes"}
        </button>
        <a href={`/scholarships/${s.slug ?? s.id}`}
          className="px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:border-slate-300 transition-all">
          Details
        </a>
        <a href={s.application_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
          Apply <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function TrackerPage() {
  const [items,        setItems]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState<"list" | "kanban">("list");
  const [activeFilter, setActiveFilter] = useState<Status | "All">("All");
  const [notesItem,    setNotesItem]    = useState<any | null>(null);

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
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  async function saveNotes(id: string, notes: string) {
    const supabase = createClient();
    await supabase.from("application_tracker").update({ notes }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("application_tracker").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = items.filter(i =>
    activeFilter === "All" || i.status === activeFilter
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">

      {/* Header */}
      <div className="pb-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Applications</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">
              {items.length > 0
                ? `Tracking ${items.length} application${items.length !== 1 ? "s" : ""}`
                : "Track the status of your scholarship applications."}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView("kanban")}
                className={`p-1.5 rounded-md transition-all ${view === "kanban" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
            <a href="/scholarships"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition-all">
              Browse <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, key, color }) => {
            const count = key ? items.filter(i => i.status === key).length : items.length;
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

      {/* Status filter pills */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
          {(["All", ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setActiveFilter(s as Status | "All")}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                activeFilter === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}>
              {s}
              {s !== "All" && (
                <span className="ml-1.5 opacity-60">
                  {items.filter(i => i.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-5 h-5 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">No applications tracked yet</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
            Browse scholarships and click <strong>Track</strong> on any listing to add it here.
          </p>
          <a href="/scholarships"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all">
            Find Scholarships <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-400 text-sm">No applications match this filter.</p>
        </div>

      ) : view === "list" ? (
        // ── List view ──
        <div className="space-y-3">
          {filtered.map(item => (
            <TrackerCard
              key={item.id}
              item={item}
              onStatusChange={updateStatus}
              onDelete={removeItem}
              onOpenNotes={setNotesItem}
            />
          ))}
        </div>

      ) : (
        // ── Kanban view ──
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLS.map(col => {
              const colItems = filtered.filter(i => i.status === col.status);
              return (
                <div key={col.status} className="w-64 flex-shrink-0">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl border ${col.color} border-b-0 mb-0`}>
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-bold text-slate-700">{col.status}</span>
                    <span className="ml-auto text-xs font-bold text-slate-400">{colItems.length}</span>
                  </div>
                  <div className={`min-h-[200px] rounded-b-xl rounded-tr-xl border ${col.color} p-2 space-y-2`}>
                    {colItems.length === 0 ? (
                      <p className="text-xs text-slate-300 text-center py-6">Drop here</p>
                    ) : colItems.map(item => (
                      <TrackerCard
                        key={item.id}
                        item={item}
                        onStatusChange={updateStatus}
                        onDelete={removeItem}
                        onOpenNotes={setNotesItem}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes drawer */}
      {notesItem && (
        <NotesDrawer
          item={notesItem}
          onClose={() => setNotesItem(null)}
          onSave={async (id, notes) => {
            await saveNotes(id, notes);
            setNotesItem(null);
          }}
        />
      )}

    </div>
  );
}
