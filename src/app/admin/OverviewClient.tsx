"use client";

import {
  BookOpen, Users, ListChecks, Bookmark,
  Calendar, ArrowUpRight, ArrowDownRight, Minus, MoreVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { countryFlag, formatDeadline } from "@/lib/utils";
import {
  weekOverWeekDelta,
  formatDelta,
  type AdminOverviewBundle,
} from "@/lib/admin/analytics";

type RecentScholarship = {
  id:                   string;
  name:                 string;
  country:              string;
  funding_type:         string;
  application_deadline: string | null;
  created_at:           string;
};

type RecentUser = {
  id:                string;
  full_name:         string | null;
  email:             string;
  created_at:        string;
  country_of_origin: string | null;
};

interface Props {
  bundle:             AdminOverviewBundle;
  recentScholarships: RecentScholarship[];
  recentUsers:        RecentUser[];
}

// ── Stat-card helpers ────────────────────────────────────────
// The trend pill now reflects real 7-day deltas; previously the
// values were hardcoded strings.

function StatCard({
  label,
  value,
  trendCurrent,
  trendPrevious,
  color,
  icon: Icon,
}: {
  label:         string;
  value:         number;
  trendCurrent:  number;
  trendPrevious: number;
  color:         string;
  icon:          React.ComponentType<{ className?: string }>;
}) {
  const delta = weekOverWeekDelta(trendCurrent, trendPrevious);
  const trendLabel = formatDelta(delta);

  const trendClass = delta.flat
    ? "text-slate-400"
    : delta.up
      ? "text-emerald-600"
      : "text-red-600";

  const TrendIcon = delta.flat ? Minus : delta.up ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      className="group relative bg-white border border-slate-200 border-t-4 rounded-lg p-5 shadow-sm transition-all"
      style={{ borderTopColor: color }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.1em]">{label}</p>
        <div className={`flex items-center gap-1 text-[10px] font-medium ${trendClass}`} title="vs. previous 7 days">
          <TrendIcon className="w-3 h-3" />
          {trendLabel}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-medium text-slate-900 tracking-tight">
          {value.toLocaleString()}
        </h3>
        <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

function MiniLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}

// ── Formatting helpers ───────────────────────────────────────

function shortDay(iso: string): string {
  // "2026-04-12" → "Apr 12"
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main component ───────────────────────────────────────────

export default function OverviewClient({
  bundle,
  recentScholarships,
  recentUsers,
}: Props) {
  const { summary, signups_30d, pageviews_30d } = bundle;

  const container = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  // Merge signups and pageviews into one series for the chart so
  // we can overlay both lines on the same axis. Each view has a
  // 30-row array; days are identical and sorted.
  type ChartRow = { day: string; label: string; signups: number; views: number };
  const chartData: ChartRow[] = signups_30d.map((row, i) => ({
    day:     row.day,
    label:   shortDay(row.day),
    signups: row.signups ?? 0,
    views:   pageviews_30d[i]?.views ?? 0,
  }));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* ── Page Header ──────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 display">Admin Overview</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1.5">
            Official Management Console
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards (real deltas) ─────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={summary.total_users}
          trendCurrent={summary.users_last_7d}
          trendPrevious={summary.users_prev_7d}
          color="#2563eb"
          icon={Users}
        />
        <StatCard
          label="Active Scholarships"
          value={summary.total_scholarships}
          trendCurrent={summary.scholarships_last_7d}
          trendPrevious={summary.scholarships_prev_7d}
          color="#10b981"
          icon={BookOpen}
        />
        <StatCard
          label="Applications"
          value={summary.total_applications}
          trendCurrent={summary.applications_last_7d}
          trendPrevious={summary.applications_prev_7d}
          color="#8b5cf6"
          icon={ListChecks}
        />
        <StatCard
          label="Saved Items"
          value={summary.total_saved}
          trendCurrent={summary.saved_last_7d}
          trendPrevious={summary.saved_prev_7d}
          color="#f59e0b"
          icon={Bookmark}
        />
      </motion.div>

      {/* ── 30-day trend chart ──────────────────────────── */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-medium text-slate-900 uppercase tracking-widest">30-Day Activity</h2>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            Signups + Page views
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  allowDecimals={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    fontSize:    12,
                    borderRadius: 6,
                    border:       "1px solid #e2e8f0",
                    padding:      "6px 10px",
                  }}
                  labelStyle={{ fontSize: 11, color: "#475569" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="signups"
                  name="Signups"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="views"
                  name="Page views"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── Main Content: recent scholarships + users ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Recent Scholarships */}
        <motion.div variants={item} className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-medium text-slate-900 uppercase tracking-widest">Recent Postings</h2>
            <MiniLink
              href="/admin/scholarships"
              className="text-[10px] font-medium text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </MiniLink>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {recentScholarships.length === 0 ? (
                <div className="px-5 py-10 text-center text-[11px] font-medium uppercase tracking-widest text-slate-400">
                  No scholarships yet
                </div>
              ) : recentScholarships.map((s) => (
                <div key={s.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-lg shadow-inner group-hover:bg-white transition-colors">
                    {countryFlag(s.country)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                        <Calendar className="w-3 h-3" /> {formatDeadline(s.application_deadline)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{s.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-medium uppercase tracking-widest ${
                      s.funding_type === "Full"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {s.funding_type}
                    </span>
                    <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <MiniLink
              href="/admin/scholarships"
              className="block w-full py-4 text-center text-sm font-bold text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all border-t border-slate-100"
            >
              Show all activities
            </MiniLink>
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div variants={item} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-medium text-slate-900 uppercase tracking-widest">New Enrollees</h2>
            <MiniLink
              href="/admin/users"
              className="text-[10px] font-medium text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              Directory <Users className="w-3 h-3" />
            </MiniLink>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <div className="space-y-1">
              {recentUsers.length === 0 ? (
                <div className="px-3 py-10 text-center text-[11px] font-medium uppercase tracking-widest text-slate-400">
                  No users yet
                </div>
              ) : recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-[10px] font-medium text-white uppercase">
                      {(u.full_name || u.email)[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{u.full_name || "New Explorer"}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-medium text-slate-900 uppercase tracking-tight">{u.country_of_origin || "Global"}</p>
                    <p className="text-[9px] font-medium text-slate-400 mt-0.5">Joined</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
