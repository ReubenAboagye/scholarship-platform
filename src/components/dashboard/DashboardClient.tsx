"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import type { Variants } from "framer-motion";
import { Sparkles, Bookmark, ListChecks, ArrowRight, AlertCircle, Clock, CheckCircle, Trophy, PlusCircle, RefreshCw, Search, User, CalendarDays } from "lucide-react";
import { formatDeadline, cn, countryFlag } from "@/lib/utils";
import { computeMatchConfidence, type ConfidenceResult } from "@/lib/utils/profile-completeness";

interface Props {
  firstName: string;
  profileComplete: boolean;
  onboardingComplete: boolean;
  completionPct: number;
  bannerHref: string;
  saved: number;
  savedData: any[];
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

function relationRow<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function daysLabel(days: number | null): string {
  if (days === null) return "No deadline";
  if (days <= 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function deadlinePill(days: number) {
  if (days <= 3)  return "bg-red-100 text-red-700 border-red-200";
  if (days <= 14) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-zinc-50 text-zinc-500 border-zinc-200";
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}

function confidenceColor(level: ConfidenceResult['level']) {
  switch (level) {
    case 'high': return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case 'medium': return "text-blue-700 bg-blue-50 border-blue-200";
    case 'low': return "text-amber-700 bg-amber-50 border-amber-200";
  }
}

export default function DashboardClient({
  firstName, profileComplete, onboardingComplete,
  completionPct, bannerHref, saved, savedData, tracked,
  dueThisWeek, topMatches, hasMatchHistory,
}: Props) {

  const activeCount    = tracked.filter((t) => ["Interested","In Progress"].includes(t.status)).length;
  const submittedCount = tracked.filter((t) => t.status === "Submitted").length;
  const acceptedCount  = tracked.filter((t) => t.status === "Accepted").length;
  const validTopMatches = topMatches.filter((r) => r?.scholarship?.id && r?.scholarship?.name);
  const activeDeadlineStatuses = ["Interested", "In Progress", "Submitted", "Awaiting Decision"];
  const trackedScholarshipIds = new Set(
    tracked
      .map((t) => t.scholarship_id ?? relationRow(t.scholarships)?.id)
      .filter(Boolean)
  );
  const savedNotTrackedCount = savedData.filter((item) => {
    const scholarshipId = item.scholarship_id ?? relationRow(item.scholarships)?.id;
    return scholarshipId && !trackedScholarshipIds.has(scholarshipId);
  }).length;
  const nextDeadline = tracked
    .map((item) => ({ item, scholarship: relationRow(item.scholarships) }))
    .filter(({ item, scholarship }) => {
      if (!scholarship?.application_deadline) return false;
      return activeDeadlineStatuses.includes(item.status) && daysLeft(scholarship.application_deadline) >= 0;
    })
    .sort((a, b) => (
      new Date(a.scholarship!.application_deadline).getTime()
      - new Date(b.scholarship!.application_deadline).getTime()
    ))[0] ?? null;
  const nextDeadlineDays = nextDeadline?.scholarship?.application_deadline
    ? daysLeft(nextDeadline.scholarship.application_deadline)
    : null;
  const hasPriorities = Boolean(nextDeadline || activeCount > 0 || savedNotTrackedCount > 0);
  const priorityHref = nextDeadline
    ? "/dashboard/deadlines"
    : activeCount > 0
      ? "/dashboard/tracker"
      : savedNotTrackedCount > 0
        ? "/dashboard/saved"
        : "/dashboard/scholarships";

  return (
    <LazyMotion features={domAnimation}>
      <m.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* ── Header ── */}
        <m.div variants={fade} className="flex items-start justify-between gap-3 pt-1">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-3xl text-zinc-900" style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif", fontWeight: 600 }}>Welcome, {firstName}</h1>
            <p className="text-sm text-zinc-500 mt-1">Here&apos;s what&apos;s happening with your scholarships.</p>
          </div>
          <a href="/dashboard/scholarships"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 px-3.5 py-2 rounded-md mt-1 transition-all">
            Browse Directory <ArrowRight className="size-3" />
          </a>
        </m.div>

        {/* ── Quick Actions Bar ── */}
        <m.div variants={fade}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {!profileComplete && (
              <a href={bannerHref}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 hover:border-amber-300 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-100/50">
                <div className="size-10 bg-gradient-to-br from-amber-200 to-orange-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <AlertCircle className="size-5 text-amber-700" />
                </div>
                <p className="text-sm font-semibold text-amber-900">Complete Profile</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Unlock AI matching</p>
                <ArrowRight className="size-3.5 text-amber-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            {profileComplete && !hasMatchHistory && (
              <a href="/dashboard/match"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-200/60 hover:border-brand-300 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-100/50">
                <div className="size-10 bg-gradient-to-br from-brand-200 to-violet-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="size-5 text-brand-700" />
                </div>
                <p className="text-sm font-semibold text-brand-900">Run AI Match</p>
                <p className="text-[11px] text-brand-600 mt-0.5">Find scholarships</p>
                <ArrowRight className="size-3.5 text-brand-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            <a href="/dashboard/scholarships"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200/60 hover:border-sky-300 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100/50">
              <div className="size-10 bg-gradient-to-br from-sky-200 to-blue-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="size-5 text-sky-700" />
              </div>
              <p className="text-sm font-semibold text-sky-900">Browse Scholarships</p>
              <p className="text-[11px] text-sky-600 mt-0.5">Explore opportunities</p>
              <ArrowRight className="size-3.5 text-sky-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href="/dashboard/profile"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-slate-50 border border-zinc-200/80 hover:border-zinc-300 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-100/50">
              <div className="size-10 bg-gradient-to-br from-zinc-200 to-slate-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <User className="size-5 text-zinc-700" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">Update Profile</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Improve matches</p>
              <ArrowRight className="size-3.5 text-zinc-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a href="/dashboard/tracker"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60 hover:border-indigo-300 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100/50">
              <div className="size-10 bg-gradient-to-br from-indigo-200 to-violet-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ListChecks className="size-5 text-indigo-700" />
              </div>
              <p className="text-sm font-semibold text-indigo-900">Track Applications</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">Monitor progress</p>
              <ArrowRight className="size-3.5 text-indigo-400 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </m.div>

        {/* ── Deadline Timeline ── */}
        <m.div variants={fade}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm text-zinc-800 flex items-center gap-2">
              <Clock className="size-4 text-red-500" /> Upcoming Deadlines
            </h2>
            <a href="/dashboard/deadlines" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</a>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            {dueThisWeek.length === 0 ? (
              <div className="text-center py-4">
                <Clock className="size-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No deadlines this week</p>
                <p className="text-xs text-zinc-400 mt-1">Great job staying ahead!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dueThisWeek.map((t: any) => {
                  const deadline = t.scholarships?.application_deadline;
                  const days = deadline ? daysLeft(deadline) : null;
                  const urgencyColor = days && days <= 3 ? 'text-red-600 bg-red-50' : 
                                       days && days <= 7 ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50';
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className={cn("size-2 rounded-full flex-shrink-0",
                        days && days <= 3 ? 'bg-red-500' : 
                        days && days <= 7 ? 'bg-amber-500' : 'bg-blue-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{t.scholarships?.name ?? "Scholarship"}</p>
                        <p className="text-xs text-zinc-500">
                          {deadline ? new Date(deadline).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'No deadline'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", urgencyColor)}>
                          {days !== null ? `${days}d left` : "TBA"}
                        </span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          t.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-500"
                        )}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </m.div>

        {/* ── Profile banner (only when incomplete) ── */}
        {!profileComplete && (
          <m.div variants={fade} className="relative overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="size-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="size-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                {!onboardingComplete ? "Complete onboarding to unlock AI matching" : "Your profile needs a few more details"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden max-w-[160px]">
                  <m.div
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
          </m.div>
        )}

        {/* ── Quick stats row ── */}
        <m.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Saved",     value: saved,          icon: Bookmark,    href: "/dashboard/saved",   color: "bg-brand-50 text-brand-600" },
            { label: "In Progress", value: activeCount,    icon: ListChecks,  href: "/dashboard/tracker", color: "bg-indigo-50 text-indigo-600" },
            { label: "Submitted", value: submittedCount, icon: Clock,       href: "/dashboard/tracker", color: "bg-amber-50 text-amber-600" },
            { label: "Accepted",  value: acceptedCount,  icon: CheckCircle, href: "/dashboard/tracker", color: "bg-emerald-50 text-emerald-600" },
          ].map((s) => (
            <m.div variants={fade} key={s.label}>
              <a href={s.href} className="flex items-center gap-3 bg-white border border-zinc-200 hover:border-zinc-300 p-3 rounded-lg flex-1 min-w-0 transition-all group">
                <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0", s.color)}>
                  <s.icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-zinc-900 leading-none">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                </div>
              </a>
            </m.div>
          ))}
        </m.div>

        {/* ── Due this week strip ── */}
        {dueThisWeek.length > 0 && (
          <m.div variants={fade}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm text-zinc-800 flex items-center gap-2">
                <Clock className="size-4 text-red-500" /> Due this week
              </h2>
              <a href="/dashboard/deadlines" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</a>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {dueThisWeek.map((t: any) => {
                const deadline = t.scholarships?.application_deadline;
                const days     = deadline ? daysLeft(deadline) : null;
                return (
                  <a
                    key={t.id}
                    href="/dashboard/deadlines"
                    className="flex-shrink-0 w-56 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg p-4 transition-all"
                  >
                    <p className="text-xs font-bold text-zinc-800 leading-snug truncate mb-2">
                      {t.scholarships?.name ?? "Scholarship"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", days ? deadlinePill(days) : "bg-zinc-50 text-zinc-400 border-zinc-200")}>
                        {days !== null ? `${days}d left` : "TBA"}
                      </span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        t.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-500"
                      )}>
                        {t.status}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </m.div>
        )}

        {/* ── Top matches from last AI run ── */}
        <m.div variants={fade}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm text-zinc-800 flex items-center gap-2">
              <Sparkles className="size-4 text-brand-600" /> Best for you
            </h2>
            <a href={hasMatchHistory ? "/dashboard/matches" : "/dashboard/match"}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              {hasMatchHistory ? "View all →" : "Run matching →"}
            </a>
          </div>

          {validTopMatches.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 text-center">
              <div className="size-10 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles className="size-5 text-zinc-300" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">No matches yet</p>
              <p className="text-xs text-zinc-400 mt-1 mb-3">Run the AI engine to get personalised scholarship rankings.</p>
              <a href={profileComplete ? "/dashboard/match" : bannerHref}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg transition-all">
                {profileComplete ? "Run AI Matching" : "Complete Profile First"}
              </a>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-50">
              {validTopMatches.map((r: any, i: number) => {
                const s = r.scholarship;
                const confidence = computeMatchConfidence(r.match_score, completionPct);
                return (
                  <a
                    key={s.id}
                    href={`/dashboard/scholarships/${s.slug || s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="size-5 rounded bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-zinc-400">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 group-hover:text-brand-700 truncate transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {countryFlag(s.country)} {s.provider} · {formatDeadline(s.application_deadline)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", confidenceColor(confidence.level))}>
                        {confidence.label}
                      </span>
                      <span className={cn("flex-shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full border", scoreColor(r.match_score))}>
                        {r.match_score}%
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </m.div>

        {/* ── Application Progress Pipeline ── */}
        <m.div variants={fade}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm text-zinc-800 flex items-center gap-2">
              <ListChecks className="size-4 text-indigo-500" /> Application Pipeline
            </h2>
            <a href="/dashboard/tracker" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Manage →</a>
          </div>

          {tracked.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 text-center">
              <p className="text-sm font-semibold text-zinc-500">No applications tracked</p>
              <a href="/scholarships" className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                Browse scholarships to start tracking →
              </a>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              {/* Pipeline stages */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { stage: "Draft", count: tracked.filter(t => ["Interested"].includes(t.status)).length, color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
                  { stage: "In Progress", count: tracked.filter(t => ["In Progress"].includes(t.status)).length, color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { stage: "Submitted", count: tracked.filter(t => ["Submitted"].includes(t.status)).length, color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { stage: "Decision", count: tracked.filter(t => ["Accepted", "Rejected", "Awaiting Decision"].includes(t.status)).length, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                ].map((stage, i) => (
                  <div key={stage.stage} className="text-center">
                    <div className={cn("text-xs font-bold px-2 py-1 rounded-lg border mb-1", stage.color)}>
                      {stage.count}
                    </div>
                    <p className="text-[10px] text-zinc-600">{stage.stage}</p>
                  </div>
                ))}
              </div>

              {/* Recent applications */}
              <div className="space-y-2">
                {tracked.slice(0, 5).map((t: any) => {
                  const getStageIndex = (status: string) => {
                    if (["Interested"].includes(status)) return 0;
                    if (["In Progress"].includes(status)) return 1;
                    if (["Submitted"].includes(status)) return 2;
                    if (["Accepted", "Rejected", "Awaiting Decision"].includes(status)) return 3;
                    return 0;
                  };
                  
                  const stageIndex = getStageIndex(t.status);
                  const stageColors = ["bg-zinc-500", "bg-blue-500", "bg-amber-500", "bg-emerald-500"];
                  
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{t.scholarships?.name ?? "Scholarship"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={cn("h-1 w-4 rounded-full", 
                                  i <= stageIndex ? stageColors[i] : "bg-zinc-200"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500">{t.status}</span>
                        </div>
                      </div>
                      {t.scholarships?.application_deadline && (
                        <span className="text-[11px] text-zinc-400 flex-shrink-0">
                          {formatDeadline(t.scholarships.application_deadline)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </m.div>

        {/* ── Upcoming Priorities ── */}
        <m.div variants={fade} className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-amber-600" />
              <h2 className="text-sm text-zinc-800">Upcoming Priorities</h2>
            </div>
            <a href={priorityHref} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Review →</a>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <a href="/dashboard/deadlines" className="group rounded-lg border border-zinc-100 bg-amber-50/60 p-3 transition-all hover:border-amber-200 hover:bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-7 rounded-lg bg-white/80 flex items-center justify-center text-amber-600">
                  <CalendarDays className="size-3.5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Next deadline</span>
              </div>
              <p className="text-lg font-bold text-zinc-900">{daysLabel(nextDeadlineDays)}</p>
              <p className="text-xs text-zinc-500 truncate mt-1">
                {nextDeadline?.scholarship?.name ?? "No active deadlines"}
              </p>
            </a>

            <a href="/dashboard/tracker" className="group rounded-lg border border-zinc-100 bg-indigo-50/60 p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-7 rounded-lg bg-white/80 flex items-center justify-center text-indigo-600">
                  <ListChecks className="size-3.5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Needs action</span>
              </div>
              <p className="text-lg font-bold text-zinc-900">{activeCount}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {activeCount === 1 ? "application to move forward" : activeCount > 1 ? "applications to move forward" : "No active drafts"}
              </p>
            </a>

            <a href="/dashboard/saved" className="group rounded-lg border border-zinc-100 bg-brand-50/60 p-3 transition-all hover:border-brand-200 hover:bg-brand-50">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-7 rounded-lg bg-white/80 flex items-center justify-center text-brand-600">
                  <PlusCircle className="size-3.5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Saved not tracked</span>
              </div>
              <p className="text-lg font-bold text-zinc-900">{savedNotTrackedCount}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {savedNotTrackedCount === 1 ? "saved scholarship needs a plan" : savedNotTrackedCount > 1 ? "saved scholarships need a plan" : "All saved items tracked"}
              </p>
            </a>
          </div>
          <div className={cn(
            "mt-3 rounded-lg px-3 py-2 text-xs",
            hasPriorities ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          )}>
            {hasPriorities
              ? "Start with the earliest deadline, then move saved scholarships into your tracker."
              : "You're caught up. Browse new scholarships when you're ready."}
          </div>
        </m.div>

        {/* ── Saved Scholarships Preview ── */}
        {saved > 0 && (
          <m.div variants={fade}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm text-zinc-800 flex items-center gap-2">
                <Bookmark className="size-4 text-brand-600" /> Saved Scholarships
              </h2>
              <a href="/dashboard/saved" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</a>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-50">
              {savedData.slice(0, 2).map((item: any) => {
                const s = item.scholarships;
                if (!s) return null;
                const deadline = s.application_deadline ? new Date(s.application_deadline) : null;
                const isUrgent = deadline && (deadline.getTime() - Date.now()) <= 7 * 24 * 60 * 60 * 1000;
                return (
                  <a
                    key={item.id}
                    href={`/dashboard/scholarships/${s.slug || s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="size-5 rounded bg-zinc-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-zinc-400">
                      <Bookmark className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 group-hover:text-brand-700 truncate transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {countryFlag(s.country)} {s.provider} · {s.funding_amount || "Amount TBD"}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {deadline && (
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", 
                          isUrgent ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"
                        )}>
                          {formatDeadline(s.application_deadline)}
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </m.div>
        )}

        {/* ── Profile completeness meter ── */}
        <m.div variants={fade} className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-600" />
              <h2 className="text-sm text-zinc-800">Profile & match quality</h2>
            </div>
            <span className="text-xs font-bold text-brand-600">{completionPct}%</span>
          </div>
          {/* Segmented bar */}
          <div className="flex gap-1 h-2 mb-3">
            {["Basics", "Academic", "Interests"].map((seg, i) => {
              const segPct = Math.max(0, Math.min(100, completionPct - i * 33));
              return (
                <div key={seg} className="flex-1 bg-zinc-100 rounded-full overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, segPct * 3)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                    className="h-full bg-brand-500 rounded-full"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 font-medium mb-3">
            <span>Basics</span><span>Academic</span><span>Interests</span>
          </div>
          {completionPct < 100 && (
            <a href="/dashboard/profile"
              className="block text-center text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg py-2 transition-colors">
              Complete profile to improve match accuracy →
            </a>
          )}
        </m.div>

        {/* ── Activity Feed ── */}
        <m.div variants={fade}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm text-zinc-800 flex items-center gap-2">
              <RefreshCw className="size-4 text-brand-600" /> Recent Activity
            </h2>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="space-y-3">
              {/* Recent match activity */}
              {hasMatchHistory && validTopMatches.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="size-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800">
                      <span className="font-semibold">New AI matches found</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {validTopMatches.length} scholarships matched to your profile
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400">Today</span>
                </div>
              )}

              {/* Saved scholarship activity */}
              {savedData.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-zinc-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bookmark className="size-4 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800">
                      <span className="font-semibold">{savedData.length} scholarship{savedData.length > 1 ? 's' : ''} saved</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Keep track of opportunities
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400">Recent</span>
                </div>
              )}

              {/* Application progress */}
              {tracked.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ListChecks className="size-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800">
                      <span className="font-semibold">{tracked.length} application{tracked.length > 1 ? 's' : ''} tracked</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {activeCount} in progress, {submittedCount} submitted, {acceptedCount} accepted
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400">Ongoing</span>
                </div>
              )}

              {/* Accepted applications */}
              {acceptedCount > 0 && (
                <div className="flex items-start gap-3">
                  <div className="size-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="size-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800">
                      <span className="font-semibold">{acceptedCount} application{acceptedCount > 1 ? 's' : ''} accepted</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Congratulations on your success!
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400">Achieved</span>
                </div>
              )}

              {/* No activity yet */}
              {!hasMatchHistory && savedData.length === 0 && tracked.length === 0 && (
                <div className="text-center py-4">
                  <RefreshCw className="size-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No recent activity</p>
                  <p className="text-xs text-zinc-400 mt-1">Start browsing scholarships to get started</p>
                </div>
              )}
            </div>
          </div>
        </m.div>

      </m.div>
    </LazyMotion>
  );
}
