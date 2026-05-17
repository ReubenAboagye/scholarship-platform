"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Shield, ChevronLeft, ChevronRight, X, User, ArrowRight, Activity
} from "lucide-react";
import { useToast } from "@/components/admin/ToastProvider";

const PAGE_SIZE = 20;

type AuditRow = {
  id: string;
  action: string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  old_snapshot: any;
  new_snapshot: any;
  scholarships: { id: string; name: string } | null;
  profiles: { id: string; email: string; full_name: string | null } | null;
};

export default function ScholarshipAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const actionFilter = searchParams.get("action") ?? "all";

  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  const updateParams = useCallback((patch: Record<string, string | null>, opts?: { keepPage?: boolean }) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    if (!opts?.keepPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router, searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (actionFilter !== "all") qs.set("action", actionFilter);
      qs.set("page", String(page));
      qs.set("pageSize", String(PAGE_SIZE));

      const response = await fetch(`/api/admin/audit/scholarships?${qs.toString()}`);
      if (!response.ok) {
        if (response.status === 403) throw new Error("Super Admin access required");
        throw new Error("Failed to load audit logs");
      }
      const data = await response.json();
      setLogs(data.logs);
      setTotalLogs(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      toast.addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page, toast]);

  useEffect(() => { load(); }, [load]);

  const safePage = Math.min(page, Math.max(1, totalPages));
  const pageStart = (safePage - 1) * PAGE_SIZE;

  const actionColors: Record<string, string> = {
    create: "bg-emerald-50 text-emerald-700 border-emerald-200",
    update: "bg-blue-50 text-blue-700 border-blue-200",
    soft_delete: "bg-amber-50 text-amber-700 border-amber-200",
    hard_delete: "bg-red-50 text-red-700 border-red-200",
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <LazyMotion features={domAnimation}>
      <m.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <m.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-medium text-zinc-900" style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif" }}>
              Scholarship Audit Log
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield className="size-3" /> Restricted Access (Super Admin Only)
            </p>
          </div>
        </m.div>

        {/* Filters */}
        <m.div variants={item} className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Action Type:</span>
            <select
              value={actionFilter}
              onChange={(e) => updateParams({ action: e.target.value === "all" ? null : e.target.value })}
              className="text-sm border-zinc-200 rounded-md py-1.5 px-3 bg-zinc-50 outline-none"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="soft_delete">Soft Delete</option>
              <option value="hard_delete">Hard Delete</option>
            </select>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            {totalLogs} entries found
          </div>
        </m.div>

        {/* Table */}
        <m.div variants={item} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Timestamp</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Actor</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Action</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Target</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-zinc-500">
                      <Search className="size-8 mx-auto text-zinc-300 mb-4" />
                      <p className="text-xs uppercase tracking-widest font-semibold">No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-zinc-600 font-medium">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="size-4 text-zinc-400" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 truncate">
                              {log.profiles?.full_name || "Unknown"}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate">{log.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${actionColors[log.action] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-zinc-900 font-medium truncate max-w-[200px]">
                          {log.scholarships?.name || "Deleted / Unknown"}
                        </div>
                        <div className="text-[9px] text-zinc-400 truncate">{log.scholarships?.id}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center justify-center size-8 rounded bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
                        >
                          <FileText className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 bg-zinc-50/40">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, totalLogs)} of {totalLogs}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateParams({ page: String(safePage - 1) }, { keepPage: true })}
                  disabled={safePage <= 1}
                  className="inline-flex items-center justify-center size-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => updateParams({ page: String(p) }, { keepPage: true })}
                      className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg text-[11px] font-semibold transition-colors ${
                        p === safePage ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => updateParams({ page: String(Math.min(totalPages, safePage + 1)) }, { keepPage: true })}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center justify-center size-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </m.div>
      </m.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="size-4 text-zinc-400" /> Audit Log Detail
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors p-1">
                  <X className="size-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Actor</p>
                    <p className="text-sm font-medium text-zinc-900">{selectedLog.profiles?.full_name} ({selectedLog.profiles?.email})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-zinc-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Action</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${actionColors[selectedLog.action] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                      {selectedLog.action.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Network</p>
                    <p className="text-xs text-zinc-600 font-mono">{selectedLog.ip_address || "Unknown IP"}</p>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Provided Reason</p>
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                      {selectedLog.reason}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
                      Old Snapshot
                    </p>
                    <pre className="bg-zinc-950 text-zinc-300 text-[10px] p-4 rounded-lg overflow-auto max-h-[300px]">
                      {selectedLog.old_snapshot ? JSON.stringify(selectedLog.old_snapshot, null, 2) : "null"}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1">
                      New Snapshot
                    </p>
                    <pre className="bg-zinc-950 text-emerald-400 text-[10px] p-4 rounded-lg overflow-auto max-h-[300px]">
                      {selectedLog.new_snapshot ? JSON.stringify(selectedLog.new_snapshot, null, 2) : "null"}
                    </pre>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
