"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, Users, BookOpen, ListChecks, Bookmark,
  Eye, MousePointerClick, Send, CheckCircle2, ArrowDown,
  Activity, Globe, Link2, Tag, Smartphone, Trophy,
  ArrowUpDown,
} from "lucide-react";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  weekOverWeekDelta,
  formatDelta,
  type AdminOverviewBundle,
} from "@/lib/admin/analytics-shared";
import type {
  AnalyticsBundle,
  CountBreakdownRow,
  TopPageRow,
  TopReferrerRow,
  UtmRow,
  ScholarshipPerformanceRow,
} from "@/lib/admin/analytics-page";

interface Props {
  bundle: AnalyticsBundle;
}

// ── Shared section primitives ────────────────────────────────
// Keeping these inline (not extracting to /components) because
// they're tightly coupled to the analytics page's layout decisions
// and noisy elsewhere.

function SectionHeader({
  icon: Icon,
  title,
  caption,
}: {
  icon:    React.ComponentType<{ className?: string }>;
  title:   string;
  caption?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
      <Icon className="w-4 h-4 text-slate-500" />
      <h2 className="text-[11px] font-medium uppercase tracking-widest text-slate-900">
        {title}
      </h2>
      {caption && (
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 ml-auto">
          {caption}
        </span>
      )}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-50/50 border border-slate-200 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Top-tile component (re-uses the WoW delta from Bite 1) ──

function TopStat({
  label, value,
  current, previous,
  icon: Icon,
}: {
  label:    string;
  value:    number;
  current:  number;
  previous: number;
  icon:     React.ComponentType<{ className?: string }>;
}) {
  const delta = weekOverWeekDelta(current, previous);
  const trendClass = delta.flat
    ? "text-slate-400"
    : delta.up ? "text-emerald-600" : "text-red-600";
  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 w-2/3 leading-relaxed">
          {label}
        </p>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-4xl font-medium display text-slate-900 tabular-nums">
          {value.toLocaleString()}
        </p>
        <span className={`text-[10px] font-medium uppercase tracking-widest ${trendClass}`} title="vs. previous 7 days">
          {formatDelta(delta)}
        </span>
      </div>
    </div>
  );
}

// ── Time-series chart helper ────────────────────────────────

function shortDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TimeSeriesChart({
  data,
  dataKey,
  color,
  height = 200,
}: {
  data:    { day: string; [k: string]: unknown }[];
  dataKey: string;
  color:   string;
  height?: number;
}) {
  const series = data.map(row => ({
    label: shortDay(row.day),
    [dataKey]: (row[dataKey] as number | undefined) ?? 0,
  }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12, borderRadius: 6,
              border: "1px solid #e2e8f0", padding: "6px 10px",
            }}
            labelStyle={{ fontSize: 11, color: "#475569" }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Match funnel ────────────────────────────────────────────
// Horizontal bars sized relative to impressions. Shows raw
// counts and conversion-from-previous-stage so admins can
// see which step is leaking.

function MatchFunnel({ funnel }: { funnel: AdminOverviewBundle["funnel_30d"] }) {
  const stages = [
    { key: "impressions",   label: "Impressions",   icon: Eye,             color: "bg-slate-300"   },
    { key: "clicks",        label: "Clicks",        icon: MousePointerClick,color: "bg-slate-400"   },
    { key: "saves",         label: "Saves",         icon: Bookmark,        color: "bg-slate-500"   },
    { key: "apply_starts",  label: "Apply Starts",  icon: Send,            color: "bg-slate-700"   },
    { key: "apply_submits", label: "Apply Submits", icon: CheckCircle2,    color: "bg-emerald-700" },
  ] as const;

  const max = Math.max(funnel.impressions, 1);

  if (funnel.impressions === 0) {
    return (
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-8">
        No matching activity in the last 30 days.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const value     = funnel[s.key];
        const widthPct  = (value / max) * 100;
        const prevValue = i === 0 ? value : funnel[stages[i - 1].key];
        const stageRate = prevValue > 0 && i > 0
          ? Math.round((value / prevValue) * 1000) / 10
          : null;
        return (
          <div key={s.key} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <s.icon className="w-3.5 h-3.5 text-slate-400" />
                {s.label}
              </div>
              <div className="flex items-center gap-3 text-xs tabular-nums">
                {stageRate !== null && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                    <ArrowDown className="w-3 h-3" />
                    {stageRate}%
                  </span>
                )}
                <span className="font-medium text-slate-900">{value.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-500 ${s.color}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Top pages table ─────────────────────────────────────────

function TopPagesTable({ rows }: { rows: TopPageRow[] }) {
  if (rows.length === 0) {
    return <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-6">No page-view data yet.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] font-medium uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-2 py-2">Path</th>
            <th className="px-2 py-2 text-right">Views</th>
            <th className="px-2 py-2 text-right">Avg Time</th>
            <th className="px-2 py-2 text-right">Scroll</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.path} className="border-b border-slate-100 hover:bg-white">
              <td className="px-2 py-2 font-medium text-slate-700 truncate max-w-[280px]" title={r.path}>{r.path}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-900">{r.views.toLocaleString()}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                {r.avg_duration_ms != null ? `${Math.round(r.avg_duration_ms / 1000)}s` : "—"}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-500">
                {r.avg_scroll_depth != null ? `${r.avg_scroll_depth}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top referrers table ─────────────────────────────────────

function TopReferrersTable({ rows }: { rows: TopReferrerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-6">No referrer data yet.</p>;
  }
  const max = Math.max(...rows.map(r => r.views), 1);
  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.source}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700 truncate" title={r.source}>{r.source}</span>
            <span className="text-xs font-medium text-slate-900 tabular-nums">{r.views.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm bg-slate-700 transition-all duration-500"
              style={{ width: `${(r.views / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── UTM table ───────────────────────────────────────────────

function UtmTable({ rows }: { rows: UtmRow[] }) {
  if (rows.length === 0) {
    return <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-6">No UTM-tagged traffic in the last 30 days.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] font-medium uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-2 py-2">Source</th>
            <th className="px-2 py-2">Medium</th>
            <th className="px-2 py-2">Campaign</th>
            <th className="px-2 py-2 text-right">Sessions</th>
            <th className="px-2 py-2 text-right">Signups</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.utm_source}-${r.utm_medium ?? ""}-${r.utm_campaign ?? ""}-${i}`} className="border-b border-slate-100 hover:bg-white">
              <td className="px-2 py-2 font-medium text-slate-700 truncate max-w-[140px]" title={r.utm_source}>{r.utm_source}</td>
              <td className="px-2 py-2 text-slate-500 truncate max-w-[120px]">{r.utm_medium   ?? "—"}</td>
              <td className="px-2 py-2 text-slate-500 truncate max-w-[160px]">{r.utm_campaign ?? "—"}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-900">{r.sessions}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-700">{r.signups}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Device breakdown donut ──────────────────────────────────

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#0f172a",  // slate-900
  mobile:  "#475569",  // slate-600
  tablet:  "#94a3b8",  // slate-400
  bot:     "#f59e0b",  // amber-500
  unknown: "#cbd5e1",  // slate-300
};

function DeviceDonut({ rows }: { rows: AnalyticsBundle["devices"] }) {
  if (rows.length === 0 || rows.every(r => r.sessions === 0)) {
    return <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-8">No device data yet.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="sessions"
            nameKey="device_type"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="#fff"
          >
            {rows.map((r, i) => (
              <Cell key={i} fill={DEVICE_COLORS[r.device_type] ?? "#cbd5e1"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12, borderRadius: 6,
              border: "1px solid #e2e8f0", padding: "6px 10px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Scholarship performance table (sortable) ────────────────

const STATUS_COLORS: Record<string, string> = {
  Interested: "bg-slate-400",
  "In Progress": "bg-slate-600",
  Submitted: "bg-slate-800",
  "Awaiting Decision": "bg-amber-600",
  Accepted: "bg-emerald-700",
  Rejected: "bg-red-800",
  Withdrawn: "bg-slate-300",
};

const COUNTRY_FLAGS: Record<string, string> = {
  UK: "🇬🇧",
  USA: "🇺🇸",
  Germany: "🇩🇪",
  Canada: "🇨🇦",
};

function DistributionBars({
  rows,
  emptyLabel,
  colorFor,
  leadFor,
}: {
  rows: CountBreakdownRow[];
  emptyLabel: string;
  colorFor: (label: string) => string;
  leadFor?: (label: string) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-8">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {leadFor?.(row.label)}
              <span className="text-xs font-medium text-slate-700">{row.label}</span>
            </div>
            <span className="text-xs font-medium text-slate-900 tabular-nums">
              {row.count.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all duration-500 ${colorFor(row.label)}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type SortKey = "name" | "impressions" | "clicks" | "saves" | "apply_starts" | "ctr" | "save_rate" | "apply_rate";

function ScholarshipPerformanceTable({ rows }: { rows: ScholarshipPerformanceRow[] }) {
  const [sortKey,   setSortKey]   = useState<SortKey>("impressions");
  const [sortDesc,  setSortDesc]  = useState(true);

  const sorted = useMemo(() => {
    const out = [...rows].sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      const an = Number(av), bn = Number(bv);
      return sortDesc ? bn - an : an - bn;
    });
    return out.slice(0, 25);
  }, [rows, sortKey, sortDesc]);

  if (rows.length === 0) {
    return <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 text-center py-6">No scholarship performance data yet.</p>;
  }

  function header(key: SortKey, label: string, align: "left" | "right" = "right") {
    const active = sortKey === key;
    const alignClass = align === "left" ? "text-left" : "text-right";
    return (
      <th className={`px-2 py-2 ${alignClass}`}>
        <button
          type="button"
          className={`inline-flex items-center gap-1 select-none ${active ? "text-slate-900" : ""}`}
          onClick={() => {
            if (active) setSortDesc(d => !d);
            else { setSortKey(key); setSortDesc(true); }
          }}
          title={`Sort by ${label}`}
          aria-label={`Sort by ${label}`}
        >
          {label}
          <ArrowUpDown className={`w-3 h-3 ${active ? "opacity-100" : "opacity-30"}`} />
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] font-medium uppercase tracking-widest text-slate-500 border-b border-slate-200">
            {header("name",         "Scholarship", "left")}
            {header("impressions",  "Impr.")}
            {header("clicks",       "Clicks")}
            {header("saves",        "Saves")}
            {header("apply_starts", "Applies")}
            {header("ctr",          "CTR")}
            {header("save_rate",    "Save %")}
            {header("apply_rate",   "Apply %")}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.scholarship_id} className="border-b border-slate-100 hover:bg-white">
              <td className="px-2 py-2 font-medium text-slate-700 truncate max-w-[260px]" title={r.name}>
                {r.name}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{r.impressions}</td>
              <td className="px-2 py-2 text-right tabular-nums">{r.clicks}</td>
              <td className="px-2 py-2 text-right tabular-nums">{r.saves}</td>
              <td className="px-2 py-2 text-right tabular-nums">{r.apply_starts}</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-500">{r.ctr}%</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-500">{r.save_rate}%</td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-500">{r.apply_rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main client component ───────────────────────────────────

export default function AnalyticsClient({ bundle }: Props) {
  const {
    overview,
    topPages,
    topReferrers,
    utmSources,
    devices,
    scholarshipPerformance,
    statusDistribution,
    countryDistribution,
  } = bundle;
  const { summary, signups_30d, pageviews_30d, dau_30d, funnel_30d } = overview;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ───────────────────────────────────── */}
      <div>
        <h1 className="font-medium text-3xl display text-slate-900 tracking-tight">
          Official Analytics Report
        </h1>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mt-2">
          Platform Engagement &amp; Conversion · Last 30 Days
        </p>
      </div>

      {/* ── Top stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TopStat
          label="Total Users"
          value={summary.total_users}
          current={summary.users_last_7d}
          previous={summary.users_prev_7d}
          icon={Users}
        />
        <TopStat
          label="Active Scholarships"
          value={summary.total_scholarships}
          current={summary.scholarships_last_7d}
          previous={summary.scholarships_prev_7d}
          icon={BookOpen}
        />
        <TopStat
          label="Applications"
          value={summary.total_applications}
          current={summary.applications_last_7d}
          previous={summary.applications_prev_7d}
          icon={ListChecks}
        />
        <TopStat
          label="Saved Entries"
          value={summary.total_saved}
          current={summary.saved_last_7d}
          previous={summary.saved_prev_7d}
          icon={Bookmark}
        />
      </div>

      {/* ── 30-day trend charts ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader icon={Activity} title="Page Views" caption="30 days" />
          <TimeSeriesChart data={pageviews_30d} dataKey="views" color="#0f172a" />
        </Card>
        <Card>
          <SectionHeader icon={Users} title="Daily Active Users" caption="30 days" />
          <TimeSeriesChart data={dau_30d} dataKey="dau" color="#2563eb" />
        </Card>
      </div>

      {/* ── Match funnel + signups ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader icon={BarChart3} title="Match Funnel" caption="30 days" />
          <MatchFunnel funnel={funnel_30d} />
        </Card>
        <Card>
          <SectionHeader icon={Trophy} title="New Signups" caption="30 days" />
          <TimeSeriesChart data={signups_30d} dataKey="signups" color="#10b981" />
        </Card>
      </div>

      {/* ── Top pages + referrers ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader icon={Eye} title="Top Pages" caption="30 days · top 15" />
          <TopPagesTable rows={topPages} />
        </Card>
        <Card>
          <SectionHeader icon={Link2} title="Traffic Sources" caption="30 days" />
          <TopReferrersTable rows={topReferrers} />
        </Card>
      </div>

      {/* ── UTM attribution + Devices ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader icon={BarChart3} title="Application Status Distribution" />
          <DistributionBars
            rows={statusDistribution}
            emptyLabel="No application data logged."
            colorFor={(label) => STATUS_COLORS[label] || "bg-slate-400"}
          />
        </Card>
        <Card>
          <SectionHeader icon={BookOpen} title="Scholarship Geographic Spread" />
          <DistributionBars
            rows={countryDistribution}
            emptyLabel="No active scholarships."
            colorFor={() => "bg-slate-800"}
            leadFor={(label) => <span className="text-xs">{COUNTRY_FLAGS[label] || "🌍"}</span>}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader icon={Tag} title="Campaign Attribution (UTM)" caption="30 days" />
          <UtmTable rows={utmSources} />
        </Card>
        <Card>
          <SectionHeader icon={Smartphone} title="Devices" caption="Sessions" />
          <DeviceDonut rows={devices} />
        </Card>
      </div>

      {/* ── Scholarship performance ─────────────────── */}
      <Card>
        <SectionHeader icon={Globe} title="Scholarship Performance" caption="30 days · top 25 by impressions" />
        <ScholarshipPerformanceTable rows={scholarshipPerformance} />
      </Card>

      {/* ── Footer note ─────────────────────────────── */}
      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 text-center pt-2">
        All metrics computed against UTC days · Empty rows indicate no recorded activity for the period
      </p>
    </div>
  );
}
