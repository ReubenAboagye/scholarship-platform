"use client";

import { motion, type Variants } from "framer-motion";
import {
  Sparkles, Bookmark, ListChecks, ArrowRight,
  AlertCircle, TrendingUp, Clock,
} from "lucide-react";
import Link from "next/link";
import { countryFlagUrl, formatDeadline } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  firstName: string;
  profileComplete: boolean;
  onboardingComplete: boolean;
  completionPct: number;
  bannerHref: string;
  stats: any[];
  scholarships: any[];
  tracked: any[];
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const ICON_MAP: Record<string, any> = {
  Bookmark,
  ListChecks,
  Clock,
  TrendingUp,
};

export default function DashboardClient({
  firstName,
  profileComplete,
  onboardingComplete,
  completionPct,
  bannerHref,
  stats,
  scholarships,
  tracked
}: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-5 pb-10"
    >
      {/* ── Page header ── */}
      <motion.div variants={item} className="flex items-center justify-between gap-2 pt-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            Good morning, {firstName}
          </h1>
          <p className="hidden sm:block text-sm text-slate-400 mt-0.5">
            Here&apos;s your scholarship overview
          </p>
        </div>
        <Link
          href="/scholarships"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all px-3 py-1.5 rounded-lg group"
        >
          Browse <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* ── Profile completion banner: Glassmorphic ── */}
      {!profileComplete && (
        <motion.div variants={item} className="relative group overflow-hidden">
          <div className="absolute inset-0 bg-amber-400/5 blur-2xl group-hover:bg-amber-400/10 transition-colors" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 glass-card rounded-[2rem]">
            <div className="flex-shrink-0 w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100/50">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900">
                {!onboardingComplete
                  ? "Unlock AI Matching"
                  : "Complete your profile"}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {!onboardingComplete
                  ? "You are just a few steps away from unlocking personalized scholarship rankings."
                  : "Add your field of study and degree level to get 100% accurate recommendations."}
              </p>

              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                  />
                </div>
                <span className="text-xs font-black text-slate-600 whitespace-nowrap">
                  {completionPct}%
                </span>
              </div>
            </div>

            <Link
              href={bannerHref}
              className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-all px-6 py-3.5 rounded-2xl shadow-ambient active:scale-95"
            >
              Complete now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Stats grid ── */}
      <motion.div variants={container} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => {
          const Icon = ICON_MAP[s.iconName] || Bookmark;
          return (
            <motion.div variants={item} key={s.label}>
              <Link
                href={s.href}
                className="flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 px-3 py-3 rounded-xl transition-all group"
              >
                <div className={cn("w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0", s.accent)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900 leading-none">
                    {s.value === "—" ? (
                      <span className="text-xs font-medium text-slate-300">—</span>
                    ) : s.value}
                  </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Two-column content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Recently added */}
        <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-sm text-slate-800">Recently added</h2>
            <Link href="/scholarships" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {scholarships?.map((s) => (
              <Link
                key={s.id}
                href={`/scholarships/${s.slug ?? s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
              >
                {countryFlagUrl(s.country) ? (
                  <img src={countryFlagUrl(s.country)!} alt={s.country} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                ) : (
                  <span className="w-5 h-3.5 bg-slate-100 rounded-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 transition-colors truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {s.country} · {formatDeadline(s.application_deadline).replace(" (Closed)", "").replace(" · Closed", "")}
                  </p>
                </div>
                <span className={cn(
                  "hidden sm:inline text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md flex-shrink-0",
                  s.funding_type === "Full"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-brand-50 text-brand-700 border border-brand-100"
                )}>
                  {s.funding_type === "Full" ? "Full" : "Part"}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Tracker */}
        <motion.div variants={item} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-sm text-slate-800">Application tracker</h2>
            <Link href="/dashboard/tracker" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Manage →
            </Link>
          </div>
          <div>
            {!tracked || tracked.length === 0 ? (
              <div className="flex items-center gap-4 px-5 py-5">
                <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ListChecks className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">No applications tracked yet</p>
                  <Link href="/scholarships" className="text-xs text-brand-600 hover:underline mt-0.5 inline-block">
                    Browse scholarships to get started →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tracked.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      t.status === "Submitted"           ? "bg-brand-500"
                      : t.status === "Accepted"          ? "bg-emerald-500"
                      : t.status === "Rejected"          ? "bg-rose-400"
                      : t.status === "Awaiting Decision" ? "bg-amber-400"
                      : t.status === "In Progress"       ? "bg-blue-400"
                      : "bg-slate-300"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{t.scholarships?.name ?? "Scholarship"}</p>
                      <p className="text-xs text-slate-400">{t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── AI Match CTA ── */}
      <motion.div variants={item} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5">
        <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {profileComplete ? "Run AI matching" : "Unlock AI matching"}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {profileComplete ? "Matched to your profile" : "Complete profile to start"}
          </p>
        </div>
        <Link
          href={profileComplete ? "/dashboard/match" : bannerHref}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
        >
          {profileComplete ? "Match" : "Setup"} <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
