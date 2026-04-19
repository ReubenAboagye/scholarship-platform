"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles, Bookmark, ListChecks, ArrowRight, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { formatDeadline, cn, countryFlag } from "@/lib/utils";

interface Props {
  firstName: string;
  profileComplete: boolean;
  onboardingComplete: boolean;
  completionPct: number;
  bannerHref: string;
  saved: number;
  tracked: any[];
  dueThisWeek: any[];
  topMatches: any[];
  hasMatchHistory: boolean;
}

const fade: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

function daysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function deadlinePill(days: number) {
  if (days <= 3)  return "bg-red-100 text-red-700 border-red-200";
  if (days <= 14) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}

export default function DashboardClient({
  firstName, profileComplete, onboardingComplete,
  completionPct, bannerHref, saved, tracked,
  dueThisWeek, topMatches, hasMatchHistory,
}: Props) {

  const activeCount    = tracked.filter((t) => ["Interested","In Progress"].includes(t.status)).length;
  const submittedCount = tracked.filter((t) => t.status === "Submitted").length;
  const acceptedCount  = tracked.filter((t) => t.status === "Accepted").length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-5 pb-10">

      {/* ── Header ── */}
      <motion.div variants={fade} className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-slate-900">Hey, {firstName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Here&apos;s what&apos;s happening with your scholarships.</p>
        </div>
        <a href="/scholarships"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg mt-1 transition-all">
          Browse <ArrowRight className="w-3 h-3" />
        </a>
      </motion.div>

      {/* ── Profile banner (only when incomplete) ── */}
      {!profileComplete && (
        <motion.div variants={fade} className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              {!onboardingComplete ? "Complete onboarding to unlock AI matching" : "Your profile needs a few more details"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden max-w-[160px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
              <span className="text-xs font-bold text-amber-700">{completionPct}% complete</span>
            </div>
          </div>
          <a href={bannerHref}
            className="flex-shrink-0 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-all">
            {!onboardingComplete ? "Start setup" : "Complete now"} →
          </a>
        </motion.div>
      )}

      {/* ── Quick stats row ── */}
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Saved",     value: saved,          icon: Bookmark,    href: "/dashboard/saved",   color: "bg-brand-50 text-brand-600" },
          { label: "Active",    value: activeCount,    icon: ListChecks,  href: "/dashboard/tracker", color: "bg-indigo-50 text-indigo-600" },
          { label: "Submitted", value: submittedCount, icon: Clock,       href: "/dashboard/tracker", color: "bg-amber-50 text-amber-600" },
          { label: "Accepted",  value: acceptedCount,  icon: CheckCircle, href: "/dashboard/tracker", color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <motion.div variants={fade} key={s.label}>
            <a href={s.href} className="flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 px-3 py-3 rounded-xl transition-all group">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", s.color)}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 leading-none">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Due this week strip ── */}
      {dueThisWeek.length > 0 && (
        <motion.div variants={fade}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" /> Due this week
            </h2>
            <a href="/dashboard/tracker" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</a>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {dueThisWeek.map((t: any) => {
              const deadline = t.scholarships?.application_deadline;
              const days     = deadline ? daysLeft(deadline) : null;
              return (
                <a
                  key={t.id}
                  href="/dashboard/tracker"
                  className="flex-shrink-0 w-56 bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all"
                >
                  <p className="text-xs font-bold text-slate-800 leading-snug truncate mb-2">
                    {t.scholarships?.name ?? "Scholarship"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", days ? deadlinePill(days) : "bg-slate-50 text-slate-400 border-slate-200")}>
                      {days !== null ? `${days}d left` : "TBA"}
                    </span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      t.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {t.status}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Top matches from last AI run ── */}
      <motion.div variants={fade}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" /> Best for you
          </h2>
          <a href={hasMatchHistory ? "/dashboard/matches" : "/dashboard/match"}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            {hasMatchHistory ? "View all →" : "Run matching →"}
          </a>
        </div>

        {topMatches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No matches yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">Run the AI engine to get personalised scholarship rankings.</p>
            <a href={profileComplete ? "/dashboard/match" : bannerHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-all">
              {profileComplete ? "Run AI Matching" : "Complete Profile First"}
            </a>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
            {topMatches.map((r: any, i: number) => {
              const s = r.scholarship;
              return (
                <a
                  key={s.id}
                  href={`/scholarships/${s.slug ?? s.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-slate-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 truncate transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {countryFlag(s.country)} {s.provider} · {formatDeadline(s.application_deadline)}
                    </p>
                  </div>
                  <span className={cn("flex-shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full border", scoreColor(r.match_score))}>
                    {r.match_score}%
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Application tracker summary ── */}
      <motion.div variants={fade}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-indigo-500" /> Application tracker
          </h2>
          <a href="/dashboard/tracker" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Manage →</a>
        </div>

        {tracked.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
            <p className="text-sm font-semibold text-slate-500">No applications tracked</p>
            <a href="/scholarships" className="text-xs text-brand-600 hover:underline mt-1 inline-block">
              Browse scholarships to start tracking →
            </a>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
            {tracked.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                  t.status === "Accepted"          ? "bg-emerald-500"
                  : t.status === "Submitted"       ? "bg-brand-500"
                  : t.status === "In Progress"     ? "bg-blue-400"
                  : t.status === "Awaiting Decision" ? "bg-amber-400"
                  : t.status === "Rejected"        ? "bg-rose-400"
                  : "bg-slate-300"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{t.scholarships?.name ?? "Scholarship"}</p>
                  <p className="text-xs text-slate-400">{t.status}</p>
                </div>
                {t.scholarships?.application_deadline && (
                  <span className="text-[11px] text-slate-400 flex-shrink-0">
                    {formatDeadline(t.scholarships.application_deadline)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Profile completeness meter ── */}
      <motion.div variants={fade} className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800">Profile & match quality</h2>
          </div>
          <span className="text-xs font-bold text-brand-600">{completionPct}%</span>
        </div>
        {/* Segmented bar */}
        <div className="flex gap-1 h-2 mb-3">
          {["Basics", "Academic", "Interests"].map((seg, i) => {
            const segPct = Math.max(0, Math.min(100, completionPct - i * 33));
            return (
              <div key={seg} className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, segPct * 3)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-3">
          <span>Basics</span><span>Academic</span><span>Interests</span>
        </div>
        {completionPct < 100 && (
          <a href="/dashboard/profile"
            className="block text-center text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg py-2 transition-colors">
            Complete profile to improve match accuracy →
          </a>
        )}
      </motion.div>

    </motion.div>
  );
}
