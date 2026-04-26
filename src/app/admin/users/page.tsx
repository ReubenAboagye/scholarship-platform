"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Search, MoreVertical, Mail, MapPin, Calendar, Shield,
  Filter, Download, ChevronLeft, ChevronRight, X, Crown, UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";

// ─────────────────────────────────────────────────────────────
// Admin users page.
//
// State that survives a refresh / share-link is in the URL:
// search query, page, role filter, country, onboarding,
// joined-within window. The role-promotion confirmation is
// transient and lives in component state.
//
// Account creation, deletion, and identity edits are
// deliberately not here — those would all need audit trails or
// are flat-out prohibited. The only mutation supported is
// flipping role between user and admin.
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE        = 25;
const COUNTRY_OPTIONS  = ["UK", "USA", "Germany", "Canada", "Other"] as const;
const ROLE_OPTIONS     = ["all", "user", "admin"] as const;
const ONBOARD_OPTIONS  = ["all", "complete", "incomplete"] as const;
const JOINED_OPTIONS   = ["all", "7d", "30d", "90d"] as const;

type RoleFilter      = (typeof ROLE_OPTIONS)[number];
type OnboardFilter   = (typeof ONBOARD_OPTIONS)[number];
type JoinedFilter    = (typeof JOINED_OPTIONS)[number];

type UserRow = {
  id:                 string;
  full_name:          string | null;
  email:              string;
  role:               string;
  country_of_origin:  string | null;
  onboarding_complete?: boolean | null;
  created_at:         string;
};

function readArrayParam(sp: URLSearchParams, key: string, allowed: readonly string[]): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw.split(",").filter(v => allowed.includes(v));
}

function readStringParam<T extends string>(
  sp: URLSearchParams, key: string, allowed: readonly T[], fallback: T,
): T {
  const raw = sp.get(key);
  return (raw && (allowed as readonly string[]).includes(raw) ? raw : fallback) as T;
}

export default function AdminUsersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── URL-driven state ──
  const search        = searchParams.get("q") ?? "";
  const page          = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const roleFilter    = readStringParam(searchParams, "role",     ROLE_OPTIONS,    "all") as RoleFilter;
  const onboardFilter = readStringParam(searchParams, "onboard",  ONBOARD_OPTIONS, "all") as OnboardFilter;
  const joinedFilter  = readStringParam(searchParams, "joined",   JOINED_OPTIONS,  "all") as JoinedFilter;
  const countries     = readArrayParam(searchParams, "country",   COUNTRY_OPTIONS);

  // ── Local-only state ──
  const [users,        setUsers]        = useState<UserRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ user: UserRow; nextRole: "user" | "admin" } | null>(null);
  const [working, setWorking] = useState(false);

  const updateParams = useCallback((patch: Record<string, string | string[] | null>, opts?: { keepPage?: boolean }) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || (Array.isArray(v) ? v.length === 0 : v === "")) {
        next.delete(k);
      } else if (Array.isArray(v)) {
        next.set(k, v.join(","));
      } else {
        next.set(k, v);
      }
    }
    if (!opts?.keepPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, searchParams]);

  // ── Data load ──
  const load = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setLoadError(null);
    try {
      const [
        { data: profile, error: profileError },
        { data: { user }, error: userError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role, country_of_origin, onboarding_complete, created_at")
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);

      if (profileError || userError) {
        throw new Error(profileError?.message ?? userError?.message ?? "Failed to load users");
      }

      setUsers((profile ?? []) as UserRow[]);
      setCurrentUserId(user?.id ?? null);
    } catch (err) {
      console.error("admin users load failed:", err);
      setUsers([]);
      setCurrentUserId(null);
      setLoadError("Failed to load user records. Check your connection or try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q   = search.trim().toLowerCase();
    const now = Date.now();
    const dayMs = 86_400_000;
    const joinedCutoff =
      joinedFilter === "7d"  ? now -  7 * dayMs :
      joinedFilter === "30d" ? now - 30 * dayMs :
      joinedFilter === "90d" ? now - 90 * dayMs :
      null;

    return users.filter(u => {
      if (q) {
        const hay = `${u.full_name ?? ""} ${u.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (countries.length) {
        const c = u.country_of_origin ?? "Other";
        if (!countries.includes(c)) return false;
      }
      if (onboardFilter === "complete"   && !u.onboarding_complete) return false;
      if (onboardFilter === "incomplete" &&  u.onboarding_complete) return false;
      if (joinedCutoff !== null && new Date(u.created_at).getTime() < joinedCutoff) return false;
      return true;
    });
  }, [users, search, roleFilter, countries, onboardFilter, joinedFilter]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── CSV export ──
  function exportCsv() {
    const csv = rowsToCsv(filtered, [
      { key: "email",                header: "Email" },
      { key: "full_name",            header: "Full Name" },
      { key: "role",                 header: "Role" },
      { key: "country_of_origin",    header: "Country" },
      { key: "onboarding_complete",  header: "Onboarded",
        format: r => (r.onboarding_complete ? "yes" : "no") },
      { key: "created_at",           header: "Joined" },
    ]);
    downloadCsv(`users-${todayStamp()}.csv`, csv);
  }

  // ── Filter helpers ──
  const activeFilterCount =
    (roleFilter    !== "all" ? 1 : 0) +
    (onboardFilter !== "all" ? 1 : 0) +
    (joinedFilter  !== "all" ? 1 : 0) +
    (countries.length        ? 1 : 0);

  function clearFilters() {
    updateParams({ role: null, onboard: null, joined: null, country: [] });
  }

  function toggleCountry(c: string) {
    const next = countries.includes(c)
      ? countries.filter(x => x !== c)
      : [...countries, c];
    updateParams({ country: next });
  }

  // ── Role change ──
  function requestPromote(u: UserRow) {
    if (u.id === currentUserId) return;     // can't change own role
    setConfirm({ user: u, nextRole: u.role === "admin" ? "user" : "admin" });
  }

  async function applyPromote() {
    if (!confirm) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/users/${confirm.user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: confirm.nextRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error ?? "Role change failed");
        return;
      }
      setUsers(prev => prev.map(u =>
        u.id === confirm.user.id ? { ...u, role: confirm.nextRole } : u
      ));
      setConfirm(null);
    } finally {
      setWorking(false);
    }
  }

  // ── Animation ──
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item      = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-slate-200 rounded-lg" />
        <div className="h-20 bg-slate-200 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-900">Unable to load the user directory.</p>
          <p className="text-xs text-slate-500 mt-1">{loadError}</p>
          <button
            onClick={() => void load()}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-8"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium text-slate-900 display">User Directory</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            Registry &amp; Personnel Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry</span>
          </button>
        </div>
      </motion.div>

      {/* ── Control Bar ─────────────────────────────────── */}
      <motion.div variants={item} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => updateParams({ q: e.target.value || null })}
              placeholder="Search personnel records..."
              className="w-full rounded border border-slate-100 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setFiltersOpen(o => !o)}
              aria-expanded={filtersOpen}
              className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded border bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition ${
                activeFilterCount > 0
                  ? "border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}</span>
            </button>
            <div className="text-[10px] font-medium text-slate-400 px-2 hidden lg:block uppercase tracking-widest">
              {filtered.length} {filtered.length === 1 ? "Entry" : "Entries"}
            </div>
          </div>
        </div>

        {/* ── Filter drawer ─────────────────────────────── */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{    height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Role */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Role</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_OPTIONS.map(r => (
                      <button
                        key={r}
                        onClick={() => updateParams({ role: r === "all" ? null : r })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          roleFilter === r
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {r === "all" ? "All" : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Country</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNTRY_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCountry(c)}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          countries.includes(c)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Onboarding */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Onboarding</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ONBOARD_OPTIONS.map(o => (
                      <button
                        key={o}
                        onClick={() => updateParams({ onboard: o === "all" ? null : o })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          onboardFilter === o
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {o === "all" ? "All" : o}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Joined within */}
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-2">Joined</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: "all", label: "All time" },
                      { value: "7d",  label: "Last 7d"  },
                      { value: "30d", label: "Last 30d" },
                      { value: "90d", label: "Last 90d" },
                    ].map(j => (
                      <button
                        key={j.value}
                        onClick={() => updateParams({ joined: j.value === "all" ? null : j.value })}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-tight border transition-colors ${
                          joinedFilter === j.value
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    {filtered.length} of {users.length} match current filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── User Listing ────────────────────────────────── */}
      {pageRows.length === 0 ? (
        <motion.div variants={item} className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">
            No users found matching your criteria
          </p>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={() => updateParams({ q: null, role: null, onboard: null, joined: null, country: [] })}
              className="mt-4 text-sm font-bold text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {pageRows.map(u => (
            <motion.div
              key={u.id}
              layout
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-xs font-medium text-white shadow-sm uppercase">
                    {(u.full_name || u.email)[0].toUpperCase()}
                  </div>
                  {u.role === "admin" && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm">
                      <Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {u.full_name || "New Explorer"}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-[9px] font-medium uppercase tracking-widest text-slate-400">(you)</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-0.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block" />
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                      <MapPin className="w-3 h-3 text-slate-400" /> {u.country_of_origin || "Global"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="hidden lg:flex flex-col items-end px-4 border-l border-slate-100">
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Enrolled</span>
                  <span className="text-[10px] font-medium text-slate-700 flex items-center gap-1 mt-0.5 uppercase tracking-tight">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest border ${
                  u.role === "admin"
                    ? "bg-amber-50 text-amber-600 border-amber-200/50"
                    : "bg-blue-50 text-blue-600 border-blue-200/50"
                }`}>
                  {u.role}
                </span>

                <button
                  onClick={() => requestPromote(u)}
                  disabled={u.id === currentUserId}
                  title={
                    u.id === currentUserId
                      ? "You cannot change your own role"
                      : u.role === "admin" ? "Demote to user" : "Promote to admin"
                  }
                  className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wide border bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {u.role === "admin" ? <UserCheck className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                  <span>{u.role === "admin" ? "Demote" : "Promote"}</span>
                </button>

                {/* Reserved for future per-row actions (suspend, etc.) */}
                <button className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" aria-label="More">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {filtered.length > 0 && (
        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900">{pageStart + 1}</span>–
            <span className="text-slate-900">{pageStart + pageRows.length}</span> of{" "}
            <span className="text-slate-900">{filtered.length}</span>
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: String(Math.max(1, safePage - 1)) }, { keepPage: true })}
                disabled={safePage <= 1}
                className="w-9 h-9 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) }, { keepPage: true })}
                    aria-current={safePage === p ? "page" : undefined}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      safePage === p
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => updateParams({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
                disabled={safePage >= totalPages}
                className="w-9 h-9 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Confirmation modal ──────────────────────────── */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => !working && setConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${
                  confirm.nextRole === "admin" ? "bg-amber-100" : "bg-blue-100"
                }`}>
                  {confirm.nextRole === "admin"
                    ? <Crown className="w-5 h-5 text-amber-600" />
                    : <UserCheck className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h2 className="text-base font-medium text-slate-900">
                    {confirm.nextRole === "admin" ? "Promote to admin?" : "Demote to user?"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This change takes effect immediately.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-5">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">User</p>
                <p className="text-sm font-medium text-slate-900">{confirm.user.full_name || confirm.user.email}</p>
                <p className="text-xs text-slate-500 mt-0.5">{confirm.user.email}</p>
              </div>
              {confirm.nextRole === "admin" && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2.5 mb-5 leading-relaxed">
                  Admins can manage scholarships, view all user data, and change other users&apos; roles. Only promote people you trust.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  disabled={working}
                  className="px-3 py-1.5 rounded text-xs font-medium uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyPromote}
                  disabled={working}
                  className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-widest text-white transition-colors disabled:opacity-50 ${
                    confirm.nextRole === "admin"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {working ? "Working…" : confirm.nextRole === "admin" ? "Promote" : "Demote"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
