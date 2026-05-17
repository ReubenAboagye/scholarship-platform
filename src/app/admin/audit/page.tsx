"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  History,
  ArrowRightLeft,
  Shield,
  Crown,
  Users,
} from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { rowsToCsv, downloadCsv, todayStamp } from "@/lib/admin/csv";
import { useToast } from "@/components/admin/ToastProvider";
import DataTable from "@/components/admin/DataTable";

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

function StatCard({
  label, value, icon: Icon, tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "up";
}) {
  const toneClass = tone === "up" ? "text-emerald-600" : "text-zinc-400";
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
        {tone === "up" && <span className={`text-[10px] font-medium ${toneClass}`}>+ active</span>}
      </div>
    </m.div>
  );
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "super_admin") { router.replace("/admin"); return; }
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

  useEffect(() => { if (currentRole === "super_admin") load(); }, [currentRole, load]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.actor_email ?? ""} ${r.target_email ?? ""} ${r.old_role} ${r.new_role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

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
    if (filtered.length === 0) { toast.addToast("Nothing to export", "info"); return; }
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
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Events" value={stats.total} icon={History} />
          <StatCard label="This Week" value={stats.thisWeek} icon={ArrowRightLeft} tone={stats.thisWeek > 0 ? "up" : "neutral"} />
          <StatCard label="Unique Actors" value={stats.uniqueActors} icon={Users} />
        </div>

        {/* ── Data Table ── */}
        <DataTable
          rows={filtered}
          loading={loading}
          emptyMessage="No audit events found"
          keyExtractor={(r) => r.id}
          renderRow={(r) => (
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600 flex-shrink-0">
                  {(r.actor_email ?? "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 truncate">
                      {r.actor_email ?? "System"}
                    </span>
                    <span className="text-zinc-300">→</span>
                    <span className="text-sm font-medium text-zinc-700 truncate">
                      {r.target_email ?? "Unknown"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{fmtDateTime(r.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <RoleBadge role={r.old_role} />
                <span className="text-zinc-300 text-xs">→</span>
                <RoleBadge role={r.new_role} />
              </div>
            </div>
          )}
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search actor, target, or role..."
          page={page}
          pageSize={PAGE_SIZE}
          totalRows={filtered.length}
          onPageChange={setPage}
          onExportCsv={exportCsv}
        />
      </m.div>
    </LazyMotion>
  );
}
