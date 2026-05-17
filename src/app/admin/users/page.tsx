"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Search, Mail, MapPin, Calendar, Shield, CheckCircle2, Circle,
  Filter, Download, ChevronLeft, ChevronRight, X, Crown, UserCheck,
  Eye, ClipboardCopy, ArrowUpRight, ArrowDownRight, Minus,
  ChevronDown, MoreHorizontal,
} from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";
import ActionDropdown from "@/components/admin/ActionDropdown";
import { useToast } from "@/components/admin/ToastProvider";

// ─────────────────────────────────────────────────────────────
// Admin users page — Professional Directory Redesign
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
const ROLE_OPTIONS     = ["all", "user", "admin", "super_admin"] as const;
const ONBOARD_OPTIONS  = ["all", "complete", "incomplete"] as const;
const JOINED_OPTIONS   = ["all", "7d", "30d", "90d"] as const;

type RoleFilter      = (typeof ROLE_OPTIONS)[number];
type OnboardFilter   = (typeof ONBOARD_OPTIONS)[number];
type JoinedFilter    = (typeof JOINED_OPTIONS)[number];
type RoleType        = Exclude<RoleFilter, "all">;

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

// ── Deterministic avatar color based on initial ──
const AVATAR_COLORS = [
  "bg-zinc-800",
  "bg-brand-700",
  "bg-emerald-700",
  "bg-amber-700",
  "bg-violet-700",
  "bg-rose-700",
  "bg-sky-700",
  "bg-teal-700",
];

function avatarColor(initial: string): string {
  const code = initial.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Formatting helpers ──
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function daysAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(iso);
}

// ── Role config ──
const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  user: {
    label: "User",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200/60",
    icon: <Users className="size-3" />,
  },
  admin: {
    label: "Admin",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    icon: <Shield className="size-3" />,
  },
  super_admin: {
    label: "Super Admin",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200/60",
    icon: <Crown className="size-3" />,
  },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.user;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${meta.bg} ${meta.color} ${meta.border}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ── Stat Card ──
function StatCard({
  label, value, sub, tone = "neutral", icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "neutral" | "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-red-600" : "text-zinc-400";
  const TrendIcon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
  return (
    <m.div
      className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em]">{label}</p>
        <div className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</h3>
        {sub && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${toneClass}`}>
            <TrendIcon className="size-3" />
            {sub}
          </span>
        )}
      </div>
    </m.div>
  );
}

export default function AdminUsersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const toast        = useToast();

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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ user: UserRow; nextRole: RoleType } | null>(null);
  const [working, setWorking] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

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

      const rows = (profile ?? []) as UserRow[];
      const currentId = user?.id ?? null;
      setUsers(rows);
      setCurrentUserId(currentId);
      setCurrentUserRole(rows.find((r) => r.id === currentId)?.role ?? null);
    } catch (err) {
      console.error("admin users load failed:", err);
      setUsers([]);
      setCurrentUserId(null);
      setCurrentUserRole(null);
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

  // ── Stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const total = users.length;
    const admins = users.filter(u => u.role === "admin" || u.role === "super_admin").length;
    const newThisWeek = users.filter(u => new Date(u.created_at).getTime() > weekAgo).length;
    const onboarded = users.filter(u => u.onboarding_complete).length;
    const rate = total > 0 ? Math.round((onboarded / total) * 100) : 0;
    return { total, admins, newThisWeek, rate };
  }, [users]);

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
  function requestPromote(u: UserRow, nextRole: RoleType) {
    if (u.id === currentUserId) return;
    if (u.role === nextRole) return;
    setConfirm({ user: u, nextRole });
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
        toast.addToast(body?.error ?? "Role change failed", "error");
        return;
      }
      setUsers(prev => prev.map(u =>
        u.id === confirm.user.id ? { ...u, role: confirm.nextRole } : u
      ));
      toast.addToast(`Role changed to ${confirm.nextRole} successfully`, "success");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-200 rounded-xl" />)}
        </div>
        <div className="h-14 bg-zinc-200 rounded-xl" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-zinc-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Unable to load the user directory.</p>
          <p className="text-xs text-zinc-500 mt-1">{loadError}</p>
          <button
            onClick={() => void load()}
            className="mt-5 inline-flex items-center justify-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1400px] mx-auto space-y-8"
      >
        {/* ── Page Header ─────────────────────────────────── */}
        <m.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-medium text-zinc-900" style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif" }}>
              User Directory
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em]">
              Registry &amp; Personnel Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg text-xs uppercase tracking-wider transition-all hover:bg-zinc-50 active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-3.5" />
              <span>Export Registry</span>
            </button>
          </div>
        </m.div>

        {/* ── Stat Cards ──────────────────────────────────── */}
        <m.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.total.toLocaleString()} icon={Users} />
          <StatCard label="Administrators" value={stats.admins} sub={`${users.length ? Math.round((stats.admins / users.length) * 100) : 0}% of total`} icon={Shield} />
          <StatCard label="New This Week" value={`+${stats.newThisWeek}`} tone={stats.newThisWeek > 0 ? "up" : "neutral"} icon={ArrowUpRight} />
          <StatCard label="Onboarded Rate" value={`${stats.rate}%`} sub={stats.rate >= 80 ? "Strong" : stats.rate >= 50 ? "Moderate" : "Needs attention"} tone={stats.rate >= 80 ? "up" : stats.rate >= 50 ? "neutral" : "down"} icon={CheckCircle2} />
        </m.div>

        {/* ── Control Bar ─────────────────────────────────── */}
        <m.div variants={item} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col lg:flex-row gap-3 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => updateParams({ q: e.target.value || null })}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500/40 placeholder:text-zinc-400"
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  activeFilterCount > 0
                    ? "border-brand-300 text-brand-700 bg-brand-50/60 hover:bg-brand-50"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Filter className="size-3.5" />
                <span>Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}</span>
                <ChevronDown className={`size-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </button>
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-700">{filtered.length}</span>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  {filtered.length === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Filter drawer ─────────────────────────────── */}
          <AnimatePresence>
            {filtersOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-zinc-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Role */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Role</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ROLE_OPTIONS.map(r => (
                          <button
                            key={r}
                            onClick={() => updateParams({ role: r === "all" ? null : r })}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-tight border transition-colors ${
                              roleFilter === r
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {r === "all" ? "All" : r.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Country</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTRY_OPTIONS.map(c => (
                          <button
                            key={c}
                            onClick={() => toggleCountry(c)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-tight border transition-colors ${
                              countries.includes(c)
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Onboarding */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Onboarding</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ONBOARD_OPTIONS.map(o => (
                          <button
                            key={o}
                            onClick={() => updateParams({ onboard: o === "all" ? null : o })}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-tight border transition-colors ${
                              onboardFilter === o
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {o === "all" ? "All" : o}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Joined within */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2.5">Joined</p>
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
                            className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-tight border transition-colors ${
                              joinedFilter === j.value
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            {j.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        {filtered.length} of {users.length} match current filters
                      </p>
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        <X className="size-3" />
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        {/* ── User Listing ────────────────────────────────── */}
        {pageRows.length === 0 ? (
          <m.div variants={item} className="py-20 text-center bg-white border border-dashed border-zinc-200 rounded-2xl">
            <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
              <Users className="size-8 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-semibold uppercase tracking-widest text-xs">
              No users found matching your criteria
            </p>
            {(search || activeFilterCount > 0) && (
              <button
                onClick={() => updateParams({ q: null, role: null, onboard: null, joined: null, country: [] })}
                className="mt-4 text-sm font-bold text-brand-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </m.div>
        ) : (
          <m.div variants={item} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/60">
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">User</th>
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Role</th>
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Country</th>
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Joined</th>
                    <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRows.map(u => {
                    const initial = (u.full_name || u.email)[0].toUpperCase();
                    return (
                      <tr
                        key={u.id}
                        className="group hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative shrink-0">
                              <div className={`size-9 rounded-lg ${avatarColor(initial)} flex items-center justify-center text-xs font-semibold text-white uppercase shadow-sm`}>
                                {initial}
                              </div>
                              {(u.role === "admin" || u.role === "super_admin") && (
                                <div className={`absolute -top-1 -right-1 size-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                                  u.role === "super_admin" ? "bg-red-500" : "bg-amber-400"
                                }`}>
                                  <Shield className="size-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-900 truncate">
                                  {u.full_name || "New Explorer"}
                                </span>
                                {u.id === currentUserId && (
                                  <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">(you)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                                <Mail className="size-3 text-zinc-400" />
                                <span className="truncate">{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                            <MapPin className="size-3.5 text-zinc-400" />
                            <span className="uppercase tracking-tight font-medium">{u.country_of_origin || "Global"}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {u.onboarding_complete ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                              <CheckCircle2 className="size-3.5" />
                              Onboarded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              <Circle className="size-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
                            <Calendar className="size-3.5 text-zinc-400" />
                            {daysAgoLabel(u.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionDropdown
                              
                              actions={[
                                {
                                  label: "View Details",
                                  icon: <Eye className="size-3.5" />,
                                  onClick: () => setDetailUser(u),
                                },
                                ...(currentUserRole === "super_admin" && u.id !== currentUserId
                                  ? [{
                                      label: "Edit Role",
                                      icon: <Shield className="size-3.5" />,
                                      onClick: () => setDetailUser(u),
                                    }]
                                  : []),
                                {
                                  label: "Copy Email",
                                  icon: <ClipboardCopy className="size-3.5" />,
                                  onClick: () => { navigator.clipboard.writeText(u.email); toast.addToast("Email copied", "info"); },
                                },
                                {
                                  label: "Copy User ID",
                                  icon: <ClipboardCopy className="size-3.5" />,
                                  onClick: () => { navigator.clipboard.writeText(u.id); toast.addToast("User ID copied", "info"); },
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-zinc-100">
              {pageRows.map(u => {
                const initial = (u.full_name || u.email)[0].toUpperCase();
                return (
                  <div key={u.id} className="p-4 flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <div className={`size-10 rounded-lg ${avatarColor(initial)} flex items-center justify-center text-sm font-semibold text-white uppercase shadow-sm`}>
                        {initial}
                      </div>
                      {(u.role === "admin" || u.role === "super_admin") && (
                        <div className={`absolute -top-1 -right-1 size-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                          u.role === "super_admin" ? "bg-red-500" : "bg-amber-400"
                        }`}>
                          <Shield className="size-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 truncate">
                            {u.full_name || "New Explorer"}
                            {u.id === currentUserId && (
                              <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-400">(you)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">{u.email}</p>
                        </div>
                        <ActionDropdown
                          
                          actions={[
                            {
                              label: "View Details",
                              icon: <Eye className="size-3.5" />,
                              onClick: () => setDetailUser(u),
                            },
                            {
                              label: "Copy Email",
                              icon: <ClipboardCopy className="size-3.5" />,
                              onClick: () => { navigator.clipboard.writeText(u.email); toast.addToast("Email copied", "info"); },
                            },
                          ]}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <RoleBadge role={u.role} />
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-tight font-medium">
                          <MapPin className="size-3" />
                          {u.country_of_origin || "Global"}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                          <Calendar className="size-3" />
                          {daysAgoLabel(u.created_at)}
                        </span>
                        {u.onboarding_complete ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="size-3.5 text-zinc-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ──────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 bg-zinc-50/40">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateParams({ page: String(safePage - 1) }, { keepPage: true })}
                    disabled={safePage <= 1}
                    className="inline-flex items-center justify-center size-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => updateParams({ page: String(p) }, { keepPage: true })}
                        className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg text-[11px] font-semibold transition-colors ${
                          p === safePage
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <span className="sm:hidden text-[11px] font-semibold text-zinc-600 px-2">
                    {safePage} / {totalPages}
                  </span>

                  <button
                    onClick={() => updateParams({ page: String(safePage + 1) }, { keepPage: true })}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center justify-center size-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </m.div>
        )}

        {/* ── Role-Change Confirmation Modal ──────────────── */}
        <AnimatePresence>
          {confirm && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={() => setConfirm(null)}
            >
              <m.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white border border-zinc-200 rounded-xl shadow-elevated w-full max-w-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <Crown className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Confirm Role Change</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        You are about to change the role of <strong>{confirm.user.full_name || confirm.user.email}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium uppercase tracking-wider">Current role</span>
                      <RoleBadge role={confirm.user.role} />
                    </div>
                    <div className="flex items-center justify-center my-2">
                      <ArrowDownRight className="size-4 text-zinc-400 rotate-[-90deg]" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium uppercase tracking-wider">New role</span>
                      <RoleBadge role={confirm.nextRole} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirm(null)}
                      disabled={working}
                      className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void applyPromote()}
                      disabled={working}
                      className="flex-1 px-4 py-2.5 bg-zinc-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {working ? "Updating…" : "Confirm Change"}
                    </button>
                  </div>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Detail Drawer ─────────────────────────────── */}
        <AnimatePresence>
          {detailUser && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex justify-end"
              onClick={() => setDetailUser(null)}
            >
              <m.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-[420px] bg-white border-l border-zinc-200 shadow-2xl h-full overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-xl ${avatarColor((detailUser.full_name || detailUser.email)[0].toUpperCase())} flex items-center justify-center text-lg font-bold text-white uppercase shadow-sm`}>
                        {(detailUser.full_name || detailUser.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-zinc-900 truncate">
                          {detailUser.full_name || "New Explorer"}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5 truncate">{detailUser.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <RoleBadge role={detailUser.role} />
                          {detailUser.id === currentUserId && (
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">(you)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailUser(null)}
                      className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Profile Summary */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="size-3.5" /> Country
                        </p>
                        <p className="text-sm font-semibold text-zinc-900">
                          {detailUser.country_of_origin || (
                            <span className="text-zinc-400 font-normal italic">Not specified</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> Joined
                        </p>
                        <p className="text-sm font-semibold text-zinc-900">{fmtDate(detailUser.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">Onboarding</p>
                        {detailUser.onboarding_complete ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="size-4" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
                            <Circle className="size-4" />
                            Incomplete
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-400 mb-1.5">User ID</p>
                        <div className="flex items-center gap-2">
                          <code className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md truncate max-w-[100px]">
                            {detailUser.id.slice(0, 8)}…
                          </code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(detailUser.id); toast.addToast("User ID copied", "info"); }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                            title="Copy full ID"
                          >
                            <ClipboardCopy className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`mailto:${detailUser.email}`}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        <Mail className="size-4" />
                        Email User
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(detailUser.email); toast.addToast("Email copied", "info"); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors"
                      >
                        <ClipboardCopy className="size-4" />
                        Copy Email
                      </button>
                    </div>
                  </div>

                  {/* Role Management */}
                  {detailUser.id !== currentUserId && currentUserRole === "super_admin" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Role Management</p>
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                        <p className="text-xs text-zinc-500">
                          Changing this user&apos;s role will immediately update their permissions across the platform.
                        </p>
                        <div className="relative">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">Assign Role</label>
                          <select
                            value={detailUser.role}
                            onChange={(e) => { setDetailUser(null); requestPromote(detailUser, e.target.value as RoleType); }}
                            className="w-full appearance-none rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 py-3 pl-4 pr-10 hover:border-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-colors cursor-pointer"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-[38px] -translate-y-1/2 size-4 pointer-events-none text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {detailUser.id === currentUserId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Crown className="size-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">This is your account</p>
                        <p className="text-xs text-amber-700/80 mt-0.5">You cannot modify your own role from this panel.</p>
                      </div>
                    </div>
                  )}
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </LazyMotion>
  );
}
