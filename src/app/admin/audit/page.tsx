"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  History,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Shield,
  X,
  Crown,
  Users,
} from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";
import { useToast } from "@/components/admin/ToastProvider";

// ─────────────────────────────────────────────────────────────
// Admin Audit Log page
//
// Super-admin-only view of the admin_role_audit_log table.
// Role changes are guaranteed by the AFTER UPDATE trigger
// (trg_profiles_audit_role_change) so this is always complete.
// ─────────────────────────────────────────────────────────────

type AuditRow = {
  id: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  old_role: string;
  new_role: string;
  actor_email: string | null;
  target_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;

function RoleBadge({ role }: { role: string }) {
  const meta: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    user: {
      label: "User",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Users className="size-2.5" />,
    },
    admin: {
      label: "Admin",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Shield className="size-2.5" />,
    },
    super_admin: {
      label: "Super Admin",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: <Crown className="size-2.5" />,
    },
  };
  const m = meta[role] ?? {
    label: role,
    cls: "bg-zinc-50 text-zinc-600 border-zinc-200",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${m.cls}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminAuditPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Gate: super_admin only ──
  useEffect(() => {
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "super_admin") {
        router.replace("/admin");
        return;
      }
      setCurrentRole("super_admin");
    }
    checkRole();
  }, [router, supabase]);

  // ── Load audit data ──
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_role_audit_log")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Audit log load failed:", error);
      toast.addToast("Failed to load audit log", "error");
    } else {
      setRows((data ?? []) as AuditRow[]);
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    if (currentRole === "super_admin") load();
  }, [currentRole, load]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.actor_email ?? ""} ${r.target_email ?? ""} ${r.old_role} ${r.new_role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const total = rows.length;
    const thisWeek = rows.filter((r) => new Date(r.created_at).getTime() > sevenDaysAgo).length;
    const uniqueActors = new Set(rows.map((r) => r.actor_user_id).filter(Boolean)).size;
    return { total, thisWeek, uniqueActors };
  }, [rows]);

  // ── CSV export ──
  function exportCsv() {
    if (filtered.length === 0) {
      toast.addToast("Nothing to export", "info");
      return;
    }
    const csv = rowsToCsv(filtered, [
      { key: "created_at", header: "Timestamp", format: (r) => fmtDateTime(r.created_at) },
      { key: "actor_email", header: "Actor" },
      { key: "target_email", header: "Target" },
      { key: "old_role", header: "Old Role" },
      { key: "new_role", header: "New Role" },
      { key: "ip_address", header: "IP Address" },
    ]);
    downloadCsv(`audit-log-${todayStamp()}.csv`, csv);
    toast.addToast("Audit log exported", "success");
  }

  if (!currentRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin size-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full" />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium text-zinc-900 display">Audit Log</h1>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-1.5">
              Immutable role-change history — super admin only
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={loading || rows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg text-xs uppercase tracking-wider transition-all hover:bg-zinc-50 disabled:opacity-40"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Events" value={stats.total} icon={History} />
          <StatCard label="This Week" value={stats.thisWeek} icon={ArrowRightLeft} tone={stats.thisWeek > 0 ? "up" : "neutral"} />
          <StatCard label="Unique Actors" value={stats.uniqueActors} icon={Users} />
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search actor, target, or role..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all placeholder:text-zinc-400"
            />
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin size-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full" />
            </div>
          ) : pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <History className="size-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">No audit events found</p>
              <p className="text-xs mt-1">Role changes will appear here automatically</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                    <th className="px-4 py-3 w-48">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-600 tabular-nums text-xs">
                        {fmtDateTime(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600 shrink-0">
                            {(row.actor_email ?? "?")[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-zinc-900 truncate">
                            {row.actor_email ?? "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-zinc-900">
                          {row.target_email ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <RoleBadge role={row.old_role} />
                          <ArrowRightLeft className="size-3 text-zinc-300 shrink-0" />
                          <RoleBadge role={row.new_role} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-400 tabular-nums">
                        {row.ip_address ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50/50">
              <p className="text-xs text-zinc-500">
                Showing {pageStart + 1}-
                {Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-medium text-zinc-600 px-2">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </m.div>
    </LazyMotion>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "up";
}) {
  return (
    <m.div
      className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm"
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em]">
          {label}
        </p>
        <div className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
          <Icon className="size-4" />
        </div>
      </div>
      <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight">
        {value.toLocaleString()}
      </h3>
    </m.div>
  );
}
