"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { countryFlagUrl, formatDeadline, statusColor, isDeadlineUrgent, cn } from "@/lib/utils";
import {
  ListChecks, ExternalLink, Loader2, ArrowRight, Trash2,
  ChevronRight, LayoutGrid, List, StickyNote, X, Check,
  CalendarPlus, Search, ArrowUpDown, GripVertical, Archive, Clock,
  Bell, BellOff, Bookmark, AlertTriangle, Square, CheckSquare,
} from "lucide-react";
import { downloadScholarshipICS } from "@/lib/utils/ics";
import { differenceInDays } from "date-fns";
import {
  DragDropContext, Droppable, Draggable,
  type DropResult, type DroppableProvided, type DraggableProvided,
} from "@hello-pangea/dnd";

// ── Types ───────────────────────────────────────────────────────

const STATUSES = [
  "Interested", "In Progress", "Submitted",
  "Awaiting Decision", "Accepted", "Rejected", "Withdrawn", "Deadline Passed",
] as const;
type Status = (typeof STATUSES)[number];

interface ScholarshipSummary {
  id: string;
  slug?: string;
  name: string;
  country: string;
  application_deadline: string | null;
  funding_type: string;
  application_url: string;
}

interface TrackerItem {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: Status;
  notes: string | null;
  deadline_reminder: string | null;
  created_at: string;
  updated_at: string;
  scholarship: ScholarshipSummary | null;
}

type SortOption = "deadline" | "updated" | "name";
type ViewMode = "list" | "kanban";

interface SortConfig {
  key: SortOption;
  label: string;
}

const SORT_OPTIONS: SortConfig[] = [
  { key: "deadline", label: "Deadline" },
  { key: "updated",  label: "Recently updated" },
  { key: "name",     label: "Name (A-Z)" },
];

const KANBAN_COLS: {
  status: Status;
  headerBg: string;
  border: string;
  dot: string;
  topBar: string;
  cardBorder: string;
}[] = [
  { status: "Interested",        headerBg: "bg-zinc-100/60", border: "border-zinc-200", dot: "bg-zinc-400", topBar: "bg-zinc-400", cardBorder: "hover:border-zinc-300" },
  { status: "In Progress",       headerBg: "bg-blue-100/60", border: "border-blue-200", dot: "bg-blue-500", topBar: "bg-blue-500", cardBorder: "hover:border-blue-300" },
  { status: "Submitted",         headerBg: "bg-violet-100/60", border: "border-violet-200", dot: "bg-violet-500", topBar: "bg-violet-500", cardBorder: "hover:border-violet-300" },
  { status: "Awaiting Decision", headerBg: "bg-amber-100/60", border: "border-amber-200", dot: "bg-amber-500", topBar: "bg-amber-500", cardBorder: "hover:border-amber-300" },
  { status: "Accepted",          headerBg: "bg-emerald-100/60", border: "border-emerald-200", dot: "bg-emerald-500", topBar: "bg-emerald-500", cardBorder: "hover:border-emerald-300" },
  { status: "Rejected",          headerBg: "bg-rose-100/60", border: "border-rose-200", dot: "bg-rose-400", topBar: "bg-rose-400", cardBorder: "hover:border-rose-300" },
  { status: "Withdrawn",         headerBg: "bg-zinc-100/60", border: "border-zinc-300", dot: "bg-zinc-400", topBar: "bg-zinc-400", cardBorder: "hover:border-zinc-400" },
  { status: "Deadline Passed",   headerBg: "bg-slate-100/60", border: "border-slate-300", dot: "bg-slate-500", topBar: "bg-slate-500", cardBorder: "hover:border-slate-400" },
];

interface StatCard {
  label: string;
  key: Status | null;
  color: string;
}

const STAT_CARDS: StatCard[] = [
  { label: "Total",        key: null,              color: "bg-zinc-50 text-zinc-600 border-zinc-200" },
  { label: "In Progress",  key: "In Progress",     color: "bg-brand-50 text-brand-700 border-brand-200" },
  { label: "Submitted",    key: "Submitted",       color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Accepted",     key: "Accepted",        color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

// ── Helpers ─────────────────────────────────────────────────────

function daysUntilDeadline(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(dateStr), new Date());
}

function sortItems(items: TrackerItem[], sort: SortOption): TrackerItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "deadline": {
        const da = a.scholarship?.application_deadline;
        const db = b.scholarship?.application_deadline;
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(da).getTime() - new Date(db).getTime();
      }
      case "updated":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "name": {
        const na = a.scholarship?.name ?? "";
        const nb = b.scholarship?.name ?? "";
        return na.localeCompare(nb);
      }
      default:
        return 0;
    }
  });
}

// ── Notes drawer ────────────────────────────────────────────────

function NotesDrawer({ item, onClose, onSave }: {
  item: TrackerItem;
  onClose: () => void;
  onSave: (id: string, notes: string) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(item.id, notes);
    setSaving(false);
    if (!ok) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <StickyNote className="size-4 text-brand-600" />
            <h3 className="text-zinc-900 text-sm truncate max-w-[280px]">{item.scholarship?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="size-4 text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">
              Notes & Essay Draft
            </label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Add notes, draft your essay, or track key requirements here..."
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl resize-none outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-zinc-400"
            />
            <p className="text-xs text-zinc-400 mt-1">{notes.length} characters</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {item.scholarship?.application_deadline && (
              <span>Deadline: <span className="font-semibold text-zinc-600">{formatDeadline(item.scholarship.application_deadline)}</span></span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : saved ? <Check className="size-3.5" /> : null}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation dialog ──────────────────────────────────

function DeleteConfirmDialog({ item, onConfirm, onCancel }: {
  item: TrackerItem;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden p-6 text-center">
        <div className="size-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-rose-500" />
        </div>
        <h3 className="text-zinc-900 text-base mb-1">Remove application?</h3>
        <p className="text-zinc-500 text-sm mb-5">
          This will stop tracking <span className="font-semibold text-zinc-700">{item.scholarship?.name}</span>. You can re-add it later from the scholarships page.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tracker card (shared by list + kanban) ──────────────────────

function TrackerCard({ item, onStatusChange, onDelete, onOpenNotes, hideStepper, isDragging, isSaved, isSelected, onToggleSelect, onToggleReminder, col }: {
  item: TrackerItem;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (item: TrackerItem) => void;
  hideStepper?: boolean;
  isDragging?: boolean;
  isSaved?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onToggleReminder?: (id: string, enabled: boolean) => void;
  col?: (typeof KANBAN_COLS)[number];
}) {
  const s = item.scholarship;
  if (!s) return null;
  const urgent = isDeadlineUrgent(s.application_deadline);
  const curIdx = KANBAN_COLS.findIndex(c => c.status === item.status);
  const days = daysUntilDeadline(s.application_deadline);

  const isKanban = !!hideStepper;

  return (
    <div className={cn(
      "bg-white rounded-xl border transition-all",
      isKanban ? "p-3 space-y-2.5" : "p-4 space-y-3",
      isDragging
        ? "border-brand-400 shadow-lg ring-2 ring-brand-100"
        : isKanban && col
          ? cn("border-zinc-200", col.cardBorder)
          : "border-zinc-200 hover:border-zinc-300"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {onToggleSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
            className="mt-0.5 flex-shrink-0 text-zinc-400 hover:text-brand-600 transition-colors"
          >
            {isSelected
              ? <CheckSquare className="size-4 text-brand-600" />
              : <Square className="size-4" />}
          </button>
        )}
        {hideStepper && (
          <div className="text-zinc-300 mt-0.5 flex-shrink-0">
            <GripVertical className="size-3.5" />
          </div>
        )}
        <div className="size-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {countryFlagUrl(s.country)
            ? <img src={countryFlagUrl(s.country)!} alt={s.country} className="w-5 h-3.5 object-cover rounded-sm" />
            : <span className="text-xs text-zinc-400">{s.country?.slice(0, 2)}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-zinc-900 text-sm leading-tight truncate">{s.name}</h3>
            {isSaved && (
              <Bookmark className="size-3 text-brand-500 flex-shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {s.country}
            <span className="mx-1">&#183;</span>
            <span className={urgent ? "text-red-500 font-semibold" : ""}>
              {formatDeadline(s.application_deadline)}
            </span>
            {days !== null && days <= 7 && days >= 0 && (
              <span className="ml-1 text-red-500 font-bold">({days}d)</span>
            )}
          </p>
        </div>
        <button onClick={() => onDelete(item.id)}
          className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Status stepper - horizontal scroll (hidden in kanban) */}
      {!hideStepper && (
        <div className="flex items-center overflow-x-auto pb-0.5 -mx-1 px-1 gap-0 scrollbar-none">
          {KANBAN_COLS.filter(c => c.status !== "Rejected" && c.status !== "Withdrawn" && c.status !== "Deadline Passed").map((col, i, arr) => {
            const actualIdx = KANBAN_COLS.findIndex(c => c.status === col.status);
            const isDone    = actualIdx < curIdx;
            const isActive  = actualIdx === curIdx;
            return (
              <div key={col.status} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => onStatusChange(item.id, col.status)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                    isActive ? "bg-zinc-900 text-white"
                    : isDone  ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    : "text-zinc-300 hover:text-zinc-500"
                  }`}>
                  {col.status}
                </button>
                {i < arr.length - 1 && <ChevronRight className="size-3 text-zinc-200 flex-shrink-0" />}
              </div>
            );
          })}
          {(item.status === "Rejected" || item.status === "Withdrawn" || item.status === "Deadline Passed") && (
            <span className={`ml-2 flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor(item.status)}`}>
              {item.status}
            </span>
          )}
        </div>
      )}

      {/* Notes preview */}
      {item.notes && (
        <p className="text-xs text-zinc-400 bg-zinc-50 rounded-lg px-3 py-2 line-clamp-2 italic">
          {item.notes}
        </p>
      )}

      {/* Footer actions */}
      {isKanban ? (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-400 flex-1 leading-none">{s.funding_type}</span>
          <div className="flex items-center gap-0.5">
            {onToggleReminder && s.application_deadline && (
              <button
                onClick={() => onToggleReminder(item.id, !item.deadline_reminder)}
                title={item.deadline_reminder ? "Reminder on" : "Remind me"}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  item.deadline_reminder
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-zinc-300 hover:text-amber-500"
                )}>
                {item.deadline_reminder ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
              </button>
            )}
            {s.application_deadline && (
              <button
                onClick={() => downloadScholarshipICS(s.name, s.application_deadline!)}
                title="Add to calendar"
                className="p-1.5 text-zinc-300 hover:text-brand-600 rounded-lg transition-all">
                <CalendarPlus className="size-3.5" />
              </button>
            )}
            <button
              onClick={() => onOpenNotes(item)}
              title={item.notes ? "Edit notes" : "Add notes"}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                item.notes ? "text-brand-500 hover:text-brand-600" : "text-zinc-300 hover:text-brand-500"
              )}>
              <StickyNote className="size-3.5" />
            </button>
            <a href={`/dashboard/scholarships/${s.slug || s.id}`}
              title="Details"
              className="p-1.5 text-zinc-300 hover:text-zinc-600 rounded-lg transition-all">
              <ExternalLink className="size-3.5" />
            </a>
            <a href={s.application_url} target="_blank" rel="noopener noreferrer"
              className="ml-0.5 flex items-center gap-1 px-2 py-1 bg-zinc-900 text-white rounded-md text-[11px] font-bold hover:bg-zinc-800 transition-all">
              Apply
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-50">
          <span className="text-xs text-zinc-400 flex-1">{s.funding_type} funding</span>
          {onToggleReminder && s.application_deadline && (
            <button
              onClick={() => onToggleReminder(item.id, !item.deadline_reminder)}
              title={item.deadline_reminder ? "Reminder on" : "Remind me before deadline"}
              className={cn(
                "p-1.5 border rounded-lg transition-all",
                item.deadline_reminder
                  ? "border-amber-300 text-amber-500 hover:border-amber-400 hover:text-amber-600"
                  : "border-zinc-200 text-zinc-400 hover:border-amber-300 hover:text-amber-500"
              )}>
              {item.deadline_reminder ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
            </button>
          )}
          {s.application_deadline && (
            <button
              onClick={() => downloadScholarshipICS(s.name, s.application_deadline!)}
              title="Add deadline to calendar"
              className="p-1.5 border border-zinc-200 text-zinc-400 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-all">
              <CalendarPlus className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => onOpenNotes(item)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 text-zinc-500 rounded-lg text-xs font-semibold hover:border-brand-300 hover:text-brand-600 transition-all">
            <StickyNote className="size-3" />
            {item.notes ? "Edit" : "Notes"}
          </button>
          <a href={`/dashboard/scholarships/${s.slug || s.id}`}
            className="px-2.5 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-semibold hover:border-zinc-300 transition-all">
            Details
          </a>
          <a href={s.application_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all">
            Apply <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// ── Kanban column ───────────────────────────────────────────────

function KanbanColumn({ col, items, onStatusChange, onDelete, onOpenNotes, isDropDisabled, isSaved }: {
  col: (typeof KANBAN_COLS)[number];
  items: TrackerItem[];
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (item: TrackerItem) => void;
  isDropDisabled: boolean;
  isSaved: (scholarshipId: string) => boolean;
}) {
  return (
    <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-t-xl border border-b-0 bg-white">
        <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${col.topBar}`} />
        <span className={`size-2 rounded-full ${col.dot}`} />
        <span className="text-[13px] font-bold text-zinc-700">{col.status}</span>
        <span className="ml-auto text-[11px] font-bold text-white bg-zinc-900/80 px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
          {items.length}
        </span>
      </div>
      {/* Drop zone */}
      <Droppable droppableId={col.status} isDropDisabled={isDropDisabled}>
        {(provided: DroppableProvided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 min-h-[220px] max-h-[calc(100vh-300px)] overflow-y-auto rounded-b-xl rounded-tr-xl border bg-white p-2.5 space-y-2.5 transition-colors scrollbar-thin",
              col.border,
              snapshot.isDraggingOver && "bg-zinc-50/80"
            )}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-zinc-200 rounded-lg">
                <p className="text-xs font-medium text-zinc-400">
                  {isDropDisabled ? "No items" : "Drop here"}
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided: DraggableProvided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TrackerCard
                        item={item}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        onOpenNotes={onOpenNotes}
                        hideStepper
                        isDragging={snapshot.isDragging}
                        isSaved={isSaved(item.scholarship_id)}
                        col={col}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────

export default function TrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL param state ──
  const viewParam    = (searchParams.get("view") as ViewMode | null) ?? "list";
  const statusParam  = (searchParams.get("status") as Status | "All" | null) ?? "All";
  const sortParam    = (searchParams.get("sort") as SortOption | null) ?? "deadline";
  const searchParam  = searchParams.get("q") ?? "";

  const [items,        setItems]        = useState<TrackerItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [view,         setView]         = useState<ViewMode>(viewParam);
  const [activeFilter, setActiveFilter] = useState<Status | "All">(statusParam as Status | "All");
  const [activeSort,   setActiveSort]   = useState<SortOption>(sortParam);
  const [searchQuery,  setSearchQuery]  = useState(searchParam);
  const [notesItem,    setNotesItem]    = useState<TrackerItem | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [savedIds,     setSavedIds]     = useState<Set<string>>(new Set());
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Sync state -> URL params ──
  const updateURL = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All" && value !== "list" && value !== "deadline" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [searchParams, router]);

  // ── Load data ──
  useEffect(() => {
    const supabase = createClient();
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          window.location.href = "/auth/login?redirectTo=/dashboard/tracker";
          return;
        }
        const [{ data, error: trackerError }, { data: savedData }] = await Promise.all([
          supabase
            .from("application_tracker")
            .select("*, scholarship:scholarships(*)")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
          supabase
            .from("saved_scholarships")
            .select("scholarship_id")
            .eq("user_id", user.id),
        ]);
        if (trackerError) throw trackerError;
        setItems((data ?? []) as TrackerItem[]);
        setSavedIds(new Set((savedData ?? []).map((s: any) => s.scholarship_id)));
      } catch (err) {
        console.error("Failed to load application tracker", err);
        setError("Unable to load your application tracker. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Optimistic status update ──
  async function updateStatus(id: string, status: Status) {
    const prevItems = items;
    setError(null);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));

    const supabase = createClient();
    const { error: updateError } = await supabase.from("application_tracker").update({ status }).eq("id", id);
    if (updateError) {
      console.error("Failed to update tracker status", updateError);
      setItems(prevItems);
      setError("Unable to update application status. Please try again.");
    }
  }

  // ── Save notes ──
  async function saveNotes(id: string, notes: string): Promise<boolean> {
    const supabase = createClient();
    const { error: notesError } = await supabase.from("application_tracker").update({ notes }).eq("id", id);
    if (notesError) {
      console.error("Failed to save tracker notes", notesError);
      setError("Unable to save notes. Please try again.");
      return false;
    }
    setError(null);
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
    return true;
  }

  // ── Optimistic delete ──
  async function removeItem(id: string) {
    const prevItems = items;
    setError(null);
    setItems(prev => prev.filter(i => i.id !== id));

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("application_tracker").delete().eq("id", id);
    if (deleteError) {
      console.error("Failed to remove tracker item", deleteError);
      setItems(prevItems);
      setError("Unable to remove this application. Please try again.");
    }
  }

  // ── Toggle deadline reminder ──
  async function toggleReminder(id: string, enabled: boolean) {
    const prevItems = items;
    setError(null);
    setItems(prev => prev.map(i => i.id === id ? { ...i, deadline_reminder: enabled ? new Date().toISOString().split("T")[0] : null } : i));

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("application_tracker")
      .update({ deadline_reminder: enabled ? new Date().toISOString().split("T")[0] : null })
      .eq("id", id);
    if (updateError) {
      console.error("Failed to toggle reminder", updateError);
      setItems(prevItems);
      setError("Unable to update reminder. Please try again.");
    }
  }

  // ── Bulk operations ──
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(computedItems.map(i => i.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const prevItems = items;
    setError(null);
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("application_tracker").delete().in("id", ids);
    if (deleteError) {
      console.error("Failed to bulk delete", deleteError);
      setItems(prevItems);
      setError("Unable to delete selected applications. Please try again.");
    }
  }

  async function bulkStatusChange(status: Status) {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const prevItems = items;
    setError(null);
    setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, status } : i));
    setSelectedIds(new Set());

    const supabase = createClient();
    const { error: updateError } = await supabase.from("application_tracker").update({ status }).in("id", ids);
    if (updateError) {
      console.error("Failed to bulk update status", updateError);
      setItems(prevItems);
      setError("Unable to update selected applications. Please try again.");
    }
  }

  // ── Drag-and-drop handler (kanban) ──
  function handleDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Status;
    const item = items.find(i => i.id === draggableId);
    if (item) {
      const sourceIdx = KANBAN_COLS.findIndex(c => c.status === item.status);
      const destIdx   = KANBAN_COLS.findIndex(c => c.status === newStatus);
      // Don't allow moving back from Rejected(5), Withdrawn(6), or Deadline Passed(7)
      if (sourceIdx >= 5 && destIdx < sourceIdx) {
        setError("Cannot move applications back from archived statuses (Rejected, Withdrawn, Deadline Passed).");
        return;
      }
    }

    // Optimistic update
    setItems(prev => prev.map(i => i.id === draggableId ? { ...i, status: newStatus } : i));

    // Persist
    const supabase = createClient();
    supabase.from("application_tracker")
      .update({ status: newStatus })
      .eq("id", draggableId)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error("Failed to update tracker status via drag", updateError);
          setError("Failed to move application. Refreshing...");
        }
      });
  }

  // ── Compute filtered, sorted, and grouped items ──
  const computedItems = useMemo(() => {
    let result = items;

    if (activeFilter !== "All") {
      result = result.filter(i => i.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.scholarship?.name.toLowerCase().includes(q) ||
        i.scholarship?.country.toLowerCase().includes(q)
      );
    }

    result = sortItems(result, activeSort);
    return result;
  }, [items, activeFilter, searchQuery, activeSort]);

  // Due soon items (deadline within 7 days, not yet submitted/accepted/rejected/withdrawn)
  // Always computed from filtered+searched items regardless of sort
  const dueSoon = useMemo(() => {
    return computedItems.filter(i => {
      const days = daysUntilDeadline(i.scholarship?.application_deadline ?? null);
      return days !== null && days >= 0 && days <= 7 &&
        !["Submitted", "Accepted", "Rejected", "Withdrawn", "Deadline Passed"].includes(i.status);
    });
  }, [computedItems]);

  // Regular items = everything in computedItems minus dueSoon
  const regularItems = useMemo(() => {
    if (dueSoon.length === 0) return computedItems;
    return computedItems.filter(i => !dueSoon.some(d => d.id === i.id));
  }, [computedItems, dueSoon]);

  // ── Loading state ──
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-5 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16">

      {/* Header */}
      <div className="pb-2">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Applications</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl text-zinc-900">Application Tracker</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {items.length > 0
                ? `Tracking ${items.length} application${items.length !== 1 ? "s" : ""}`
                : "Track the status of your scholarship applications."}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* View toggle */}
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
              <button
                onClick={() => { setView("list"); updateURL({ view: "list" }); }}
                className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-400 hover:text-zinc-600"}`}>
                <List className="size-3.5" />
              </button>
              <button
                onClick={() => { setView("kanban"); updateURL({ view: "kanban" }); }}
                className={`p-1.5 rounded-md transition-all ${view === "kanban" ? "bg-white shadow-sm text-zinc-800" : "text-zinc-400 hover:text-zinc-600"}`}>
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
            <a href="/dashboard/scholarships"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-lg transition-all">
              Browse <ArrowRight className="size-3" />
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search + Sort bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateURL({ q: e.target.value });
              }}
              placeholder="Search by name or country..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); updateURL({ q: "" }); }}
                className="absolute right-2.5 top-1/2 -tranzinc-y-1/2 p-0.5 text-zinc-300 hover:text-zinc-500">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={activeSort}
              onChange={(e) => {
                const val = e.target.value as SortOption;
                setActiveSort(val);
                updateURL({ sort: val });
              }}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none focus:border-brand-400 cursor-pointer text-zinc-600"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -tranzinc-y-1/2 size-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Stats row */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, key, color }) => {
            const count = key ? items.filter(i => i.status === key).length : items.length;
            const pct   = Math.round((count / Math.max(items.length, 1)) * 100);
            return (
              <div key={label} className="bg-white rounded-xl border border-zinc-200 p-3 space-y-1.5">
                <p className="text-2xl font-bold text-zinc-900 leading-none">{count}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border inline-block ${color}`}>
                  {label}
                </span>
                <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
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
            <button
              key={s}
              onClick={() => {
                setActiveFilter(s as Status | "All");
                updateURL({ status: s === "All" ? "" : s });
              }}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
                activeFilter === s
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-zinc-900 text-white rounded-xl px-4 py-3 sticky top-2 z-30 shadow-lg">
          <span className="text-xs font-semibold">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={selectAllVisible}
            className="text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Select all
          </button>
          <button
            onClick={deselectAll}
            className="text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Clear
          </button>
          <div className="w-px h-4 bg-zinc-700" />
          <select
            onChange={(e) => { if (e.target.value) { bulkStatusChange(e.target.value as Status); e.target.value = ""; } }}
            className="appearance-none bg-zinc-800 border border-zinc-700 text-white text-[11px] font-semibold rounded-lg px-3 py-1.5 pr-6 outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>Move to...</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={bulkDelete}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-rose-200 transition-colors"
          >
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          item={items.find(i => i.id === deleteConfirmId)!}
          onConfirm={() => { removeItem(deleteConfirmId); setDeleteConfirmId(null); }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-zinc-200 p-10 text-center">
          <div className="size-12 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="size-5 text-zinc-300" />
          </div>
          <h3 className="text-zinc-900 text-base mb-1">No applications tracked yet</h3>
          <p className="text-zinc-500 text-sm mb-5 max-w-xs mx-auto">
            Browse scholarships and click <strong>Track</strong> on any listing to add it here.
          </p>
          <a href="/dashboard/scholarships"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 transition-all">
            Find Scholarships <ArrowRight className="size-3.5" />
          </a>
        </div>

      ) : computedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
          <p className="text-zinc-400 text-sm">No applications match this filter.</p>
        </div>

      ) : view === "list" ? (
        // ── List view ──
        <div className="space-y-5">
          {/* Due Soon section */}
          {dueSoon.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xs text-red-600 uppercase tracking-wider mb-3">
                <Clock className="size-3.5" />
                Due within 7 days ({dueSoon.length})
              </h2>
              <div className="space-y-3">
                {dueSoon.map(item => (
                  <TrackerCard
                    key={item.id}
                    item={item}
                    onStatusChange={updateStatus}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onOpenNotes={setNotesItem}
                    isSaved={savedIds.has(item.scholarship_id)}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                    onToggleReminder={toggleReminder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular items */}
          {regularItems.length > 0 && (
            <div className="space-y-3">
              {dueSoon.length > 0 && (
                <h2 className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                  All applications ({regularItems.length})
                </h2>
              )}
              {regularItems.map(item => (
                <TrackerCard
                  key={item.id}
                  item={item}
                  onStatusChange={updateStatus}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onOpenNotes={setNotesItem}
                  isSaved={savedIds.has(item.scholarship_id)}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                  onToggleReminder={toggleReminder}
                />
              ))}
            </div>
          )}
        </div>

      ) : (
        // ── Kanban view with drag-and-drop ──
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="pb-4">
            {/* Archive toggle for Rejected/Withdrawn/Deadline Passed columns */}
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all",
                  showArchived
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                )}
              >
                <Archive className="size-3" />
                {showArchived ? "Hide archived" : "Show archived"}
              </button>
            </div>
            <div className="flex gap-4 min-w-max">
              {KANBAN_COLS.map(col => {
                if ((col.status === "Rejected" || col.status === "Withdrawn" || col.status === "Deadline Passed") && !showArchived) return null;
                const colItems = computedItems.filter(i => i.status === col.status);
                const isFinalCol = col.status === "Rejected" || col.status === "Withdrawn" || col.status === "Deadline Passed";
                return (
                  <KanbanColumn
                    key={col.status}
                    col={col}
                    items={colItems}
                    onStatusChange={updateStatus}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    onOpenNotes={setNotesItem}
                    isDropDisabled={isFinalCol}
                    isSaved={(sid) => savedIds.has(sid)}
                  />
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Notes drawer */}
      {notesItem && (
        <NotesDrawer
          item={notesItem}
          onClose={() => setNotesItem(null)}
          onSave={async (id, notes) => {
            const ok = await saveNotes(id, notes);
            if (ok) setNotesItem(null);
            return ok;
          }}
        />
      )}

    </div>
  );
}
