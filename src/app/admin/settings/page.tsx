import type React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Shield,
  Server,
  Users,
} from "lucide-react";
import { requireAdminPageAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/server";

// Admin Settings page
// Read-only operational view. Settings mutations can be added later when
// a platform_settings table, authorization rules, and audit trails exist.

type HealthStatus = "healthy" | "degraded" | "unknown";

type SystemStats = {
  totalUsers: number;
  totalScholarships: number;
  totalApplications: number;
  totalSaved: number;
  dbStatus: HealthStatus;
  warnings: string[];
};

type CountResult = {
  label: string;
  count: number;
  error: string | null;
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

function StatRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0 gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-sm text-zinc-600 truncate">{label}</span>
      </div>
      <span className="text-sm font-semibold text-zinc-900 text-right">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: HealthStatus }) {
  const className =
    status === "healthy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "degraded"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-zinc-50 text-zinc-500 border-zinc-200";

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${className}`}>
      {status === "healthy" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
      {status}
    </span>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 uppercase tracking-wider"
    >
      {children}
      <ArrowRight className="size-3" />
    </Link>
  );
}

function SecurityRow({
  label,
  detail,
  icon: Icon,
  tone,
  action,
}: {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ok" | "warn" | "info";
  action?: React.ReactNode;
}) {
  const toneClass = {
    ok: "text-emerald-700 bg-emerald-50 border-emerald-200",
    warn: "text-amber-700 bg-amber-50 border-amber-200",
    info: "text-blue-700 bg-blue-50 border-blue-200",
  }[tone];

  return (
    <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className="size-3.5 text-zinc-400" />
        <span className="text-sm text-zinc-600">{label}</span>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${toneClass}`}>
          {detail}
        </span>
        {action}
      </div>
    </div>
  );
}

async function countTable(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  label: string,
): Promise<CountResult> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    label,
    count: count ?? 0,
    error: error?.message ?? null,
  };
}

async function getSettingsOverview() {
  const supabase = createAdminClient();

  const [users, scholarships, applications, saved, superAdmins, auditRows] = await Promise.all([
    countTable(supabase, "profiles", "Total Users"),
    countTable(supabase, "scholarships", "Scholarships"),
    countTable(supabase, "application_tracker", "Applications Tracked"),
    countTable(supabase, "saved_scholarships", "Saved Entries"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin")
      .then(({ count, error }) => ({ count: count ?? 0, error: error?.message ?? null })),
    supabase
      .from("admin_role_audit_log")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => ({ count: count ?? 0, error: error?.message ?? null })),
  ]);

  const countResults = [users, scholarships, applications, saved];
  const warnings = countResults
    .filter((result) => result.error)
    .map((result) => `${result.label}: ${result.error}`);

  if (superAdmins.error) warnings.push(`Super Admin Coverage: ${superAdmins.error}`);
  if (auditRows.error) warnings.push(`Audit Logging: ${auditRows.error}`);

  const stats: SystemStats = {
    totalUsers: users.count,
    totalScholarships: scholarships.count,
    totalApplications: applications.count,
    totalSaved: saved.count,
    dbStatus: warnings.length ? "degraded" : "healthy",
    warnings,
  };

  return {
    stats,
    superAdminCount: superAdmins.count,
    auditRowCount: auditRows.count,
  };
}

export default async function AdminSettingsPage() {
  await requireAdminPageAccess();

  const { stats, superAdminCount, auditRowCount } = await getSettingsOverview();
  const hasSuperAdminCoverage = superAdminCount >= 2;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-zinc-900 display">Settings</h1>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-1.5">
            Platform configuration & system health
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-[11px] font-medium ${
          stats.dbStatus === "healthy"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          {stats.dbStatus === "healthy" ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          <span>{stats.dbStatus === "healthy" ? "Systems reporting healthy" : "Systems need attention"}</span>
        </div>
      </div>

      {/* System Health */}
      <SettingsCard
        title="System Health"
        description="Server-side platform metrics"
        icon={Server}
      >
        <div className="space-y-0">
          <StatRow label="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} />
          <StatRow label="Scholarships" value={stats.totalScholarships.toLocaleString()} icon={BookOpen} />
          <StatRow label="Applications Tracked" value={stats.totalApplications.toLocaleString()} icon={Database} />
          <StatRow label="Saved Entries" value={stats.totalSaved.toLocaleString()} icon={Globe} />
          <div className="flex items-center justify-between py-2.5 gap-4">
            <div className="flex items-center gap-2.5">
              <Database className="size-3.5 text-zinc-400" />
              <span className="text-sm text-zinc-600">Database Status</span>
            </div>
            <StatusPill status={stats.dbStatus} />
          </div>
          {stats.warnings.length > 0 && (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
              {stats.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Platform Info */}
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

      {/* Security */}
      <SettingsCard
        title="Security Operations"
        description="Verified controls and operator checkpoints"
        icon={Shield}
      >
        <div className="space-y-3">
          <SecurityRow
            label="Multi-Factor Authentication"
            detail="Manage enrollment"
            icon={Shield}
            tone="info"
            action={<ActionLink href="/admin/security/mfa">Open MFA</ActionLink>}
          />
          <SecurityRow
            label="Super Admin Coverage"
            detail={`${superAdminCount} configured`}
            icon={Users}
            tone={hasSuperAdminCoverage ? "ok" : "warn"}
            action={<ActionLink href="/admin/users?role=super_admin">Review users</ActionLink>}
          />
          <SecurityRow
            label="Role Change Audit Log"
            detail={`${auditRowCount.toLocaleString()} events`}
            icon={Database}
            tone="info"
            action={<ActionLink href="/admin/audit">Open audit</ActionLink>}
          />
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 leading-relaxed">
            MFA enforcement and audit guarantees are implemented in database triggers/RPCs. Supabase dashboard MFA policy and security advisor status still require operator verification before production deploy.
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
