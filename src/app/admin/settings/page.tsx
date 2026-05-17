"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Settings, Shield, Users, BookOpen, Database,
  Globe, Clock, Server, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// Admin Settings page
//
// Platform configuration and system health read-only view.
// Settings mutations can be added later when a platform_settings
// table is introduced.
// ─────────────────────────────────────────────────────────────

type SystemStats = {
  totalUsers: number;
  totalScholarships: number;
  totalApplications: number;
  totalSaved: number;
  dbStatus: "healthy" | "degraded" | "unknown";
};

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
        <div className="size-8 rounded bg-zinc-50 flex items-center justify-center text-zinc-500">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {description && (
            <p className="text-[11px] text-zinc-400">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatRow({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-zinc-400" />
        <span className="text-sm text-zinc-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Gate: admin only
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.role || !["admin", "super_admin"].includes(profile.role)) {
        router.replace("/admin");
        return;
      }
      setIsAdmin(true);
    }
    check();
  }, [router, supabase]);

  // Load system stats
  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        const [
          { count: users },
          { count: scholarships },
          { count: applications },
          { count: saved },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("scholarships").select("*", { count: "exact", head: true }),
          supabase.from("application_tracker").select("*", { count: "exact", head: true }),
          supabase.from("saved_scholarships").select("*", { count: "exact", head: true }),
        ]);
        setStats({
          totalUsers: users ?? 0,
          totalScholarships: scholarships ?? 0,
          totalApplications: applications ?? 0,
          totalSaved: saved ?? 0,
          dbStatus: "healthy",
        });
      } catch {
        setStats({
          totalUsers: 0, totalScholarships: 0,
          totalApplications: 0, totalSaved: 0,
          dbStatus: "degraded",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin, supabase]);

  if (!isAdmin) {
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
        className="space-y-8 max-w-4xl"
      >
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium text-zinc-900 display">Settings</h1>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-1.5">
              Platform configuration & system health
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-700 font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>All systems operational</span>
          </div>
        </div>

        {/* ── System Health ── */}
        <SettingsCard
          title="System Health"
          description="Real-time platform metrics"
          icon={Server}
        >
          {loading || !stats ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin size-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full" />
            </div>
          ) : (
            <div className="space-y-0">
              <StatRow label="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} />
              <StatRow label="Scholarships" value={stats.totalScholarships.toLocaleString()} icon={BookOpen} />
              <StatRow label="Applications Tracked" value={stats.totalApplications.toLocaleString()} icon={Database} />
              <StatRow label="Saved Entries" value={stats.totalSaved.toLocaleString()} icon={Globe} />
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <Database className="size-3.5 text-zinc-400" />
                  <span className="text-sm text-zinc-600">Database Status</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  stats.dbStatus === "healthy"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : stats.dbStatus === "degraded"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-zinc-50 text-zinc-500 border-zinc-200"
                }`}>
                  {stats.dbStatus === "healthy" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                  {stats.dbStatus}
                </span>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* ── Platform Info ── */}
        <SettingsCard
          title="Platform Information"
          description="Read-only system details"
          icon={Globe}
        >
          <div className="space-y-0">
            <StatRow label="Platform Name" value="ScholarBridge" icon={Globe} />
            <StatRow label="Version" value="1.0.0" icon={Clock} />
            <StatRow label="Environment" value={process.env.NODE_ENV === "production" ? "Production" : "Development"} icon={Server} />
            <StatRow label="Timezone" value="UTC" icon={Clock} />
          </div>
        </SettingsCard>

        {/* ── Security ── */}
        <SettingsCard
          title="Security"
          description="Authentication & access control"
          icon={Shield}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <Shield className="size-3.5 text-zinc-400" />
                <span className="text-sm text-zinc-600">Multi-Factor Authentication</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Required for role changes
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <Users className="size-3.5 text-zinc-400" />
                <span className="text-sm text-zinc-600">Role-based Access Control</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <Database className="size-3.5 text-zinc-400" />
                <span className="text-sm text-zinc-600">Audit Logging</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Enabled
              </span>
            </div>
          </div>
        </SettingsCard>
      </m.div>
    </LazyMotion>
  );
}
