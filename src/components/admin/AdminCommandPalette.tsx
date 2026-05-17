"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, X, ArrowRight, LayoutDashboard, BookOpen, Users,
  BarChart3, ShieldCheck, History, Crown, ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Admin Command Palette
//
// ⌘K / Ctrl+K to open. Fuzzy search across:
//   - Admin pages (jump)
//   - Users by name/email
//   - Scholarships by name
//
// Keeps results scoped to what an admin actually needs so the
// list stays short and fast.
// ─────────────────────────────────────────────────────────────

type PageItem = {
  id: string;
  kind: "page";
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
};

type UserItem = {
  id: string;
  kind: "user";
  title: string;
  subtitle: string;
  href: string;
};

type ScholarshipItem = {
  id: string;
  kind: "scholarship";
  title: string;
  subtitle: string;
  href: string;
};

type ResultItem = PageItem | UserItem | ScholarshipItem;

const PAGES: PageItem[] = [
  { id: "page-overview", kind: "page", title: "Overview", href: "/admin", icon: LayoutDashboard, shortcut: "G then O" },
  { id: "page-scholarships", kind: "page", title: "Scholarships", href: "/admin/scholarships", icon: BookOpen, shortcut: "G then S" },
  { id: "page-users", kind: "page", title: "Users", href: "/admin/users", icon: Users, shortcut: "G then U" },
  { id: "page-analytics", kind: "page", title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { id: "page-mfa", kind: "page", title: "MFA Security", href: "/admin/security/mfa", icon: ShieldCheck },
  { id: "page-audit", kind: "page", title: "Audit Log", href: "/admin/audit", icon: History },
];

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ");
}

function score(query: string, text: string): number {
  const q = normalize(query);
  const t = normalize(text);
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  // Fuzzy: count matched chars in order
  let idx = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, idx);
    if (found === -1) return 0;
    idx = found + 1;
  }
  return 40 - t.length; // shorter matches score higher
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminCommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const supabase = createClient();

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setUsers([]);
      setScholarships([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search for users + scholarships
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setUsers([]);
      setScholarships([]);
      return;
    }
    const q = query.trim();
    const t = setTimeout(async () => {
      setLoading(true);
      const term = `%${q}%`;
      const [
        { data: uData },
        { data: sData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.${term},email.ilike.${term}`)
          .limit(5),
        supabase
          .from("scholarships")
          .select("id, name, country")
          .ilike("name", term)
          .limit(5),
      ]);
      setUsers(
        (uData ?? []).map((u: any) => ({
          id: `user-${u.id}`,
          kind: "user" as const,
          title: u.full_name || u.email,
          subtitle: u.email,
          href: `/admin/users?q=${encodeURIComponent(u.email)}`,
        }))
      );
      setScholarships(
        (sData ?? []).map((s: any) => ({
          id: `scholarship-${s.id}`,
          kind: "scholarship" as const,
          title: s.name,
          subtitle: s.country,
          href: `/admin/scholarships?q=${encodeURIComponent(s.name)}`,
        }))
      );
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, supabase]);

  // Build scored results
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return PAGES;
    const all = [
      ...PAGES.map(p => ({ ...p, _score: score(q, p.title) })),
      ...users.map(u => ({ ...u, _score: score(q, u.title + " " + u.subtitle) })),
      ...scholarships.map(s => ({ ...s, _score: score(q, s.title + " " + s.subtitle) })),
    ] as Array<ResultItem & { _score: number }>;
    return all
      .filter(r => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...rest }) => rest);
  }, [query, users, scholarships]);

  // Clamp selection
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  const navigate = useCallback((href: string) => {
    onClose();
    window.location.href = href;
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) navigate(item.href);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex, navigate]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-zinc-900/50 p-4"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <Search className="size-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search pages, users, or scholarships..."
            className="flex-1 bg-transparent outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-mono text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 py-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-zinc-400">
              <Search className="size-6 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No results</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            results.map((item, i) => {
              const active = i === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    active ? "bg-zinc-50" : "hover:bg-zinc-50/50"
                  )}
                >
                  {item.kind === "page" ? (
                    <item.icon className={cn("size-4 flex-shrink-0", active ? "text-zinc-900" : "text-zinc-400")} />
                  ) : item.kind === "user" ? (
                    <div className="size-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600 flex-shrink-0">
                      {(item.title ?? "?")[0].toUpperCase()}
                    </div>
                  ) : (
                    <BookOpen className={cn("size-4 flex-shrink-0", active ? "text-zinc-900" : "text-zinc-400")} />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", active ? "text-zinc-900" : "text-zinc-700")}>
                      {item.title}
                    </p>
                    {item.kind !== "page" && (
                      <p className="text-[11px] text-zinc-400 truncate">{item.subtitle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.kind === "page" && item.shortcut && (
                      <span className="hidden sm:inline text-[10px] text-zinc-300 font-mono">
                        {item.shortcut}
                      </span>
                    )}
                    {active && <ArrowRight className="size-3.5 text-zinc-500" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[9px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[9px]">↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[9px]">↵</kbd> Select</span>
          </div>
          <span className="text-[10px] text-zinc-400">{results.length} result{results.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
