"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Clock, DollarSign, CheckSquare, Users, Shield,
  Heart, ChevronDown, X, Lock, RefreshCw,
  ExternalLink, BookmarkCheck, Loader2, Sparkles, CheckCircle, XCircle,
} from "lucide-react";
import { countryFlag, formatDeadline } from "@/lib/utils";
import { logMatchEvent, logImpressions, dismissScholarship, type NotRelevantReason } from "@/lib/utils/events";

// ── Types ──────────────────────────────────────────────────────────────────

interface MatchResult {
  scholarship: {
    id: string;
    slug?: string;
    name: string;
    provider: string;
    country: string;
    funding_type: string;
    funding_amount: string;
    degree_levels: string[];
    application_deadline: string | null;
    application_url: string;
    renewable?: boolean;
    effort_minutes?: number;
  };
  match_score: number;
  match_reasons: string[];
}

interface HistorySession {
  id: string;
  run_at: string;
  explanation: string | null;
  results: MatchResult[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
}

function scoreDot(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  return "bg-amber-400";
}

function tagColor(tag: string) {
  const m: Record<string, string> = {
    UK: "bg-blue-50 text-blue-600 border-blue-200",
    USA: "bg-indigo-50 text-indigo-600 border-indigo-200",
    Germany: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Canada: "bg-rose-50 text-rose-600 border-rose-200",
    Full: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Partial: "bg-sky-50 text-sky-600 border-sky-200",
    "Tuition Only": "bg-purple-50 text-purple-600 border-purple-200",
    "Living Allowance": "bg-orange-50 text-orange-600 border-orange-200",
  };
  return m[tag] ?? "bg-stone-50 text-slate-600 border-stone-200";
}

// ── Match Row ──────────────────────────────────────────────────────────────

function MatchRow({
  result, rank, saved, sessionId,
  onToggleSave, onDismiss,
}: {
  result: MatchResult;
  rank: number;
  saved: boolean;
  sessionId: string;
  onToggleSave: (id: string) => void;
  onDismiss: (id: string, reason?: NotRelevantReason) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const s = result.scholarship;

  const REASONS: { code: NotRelevantReason; label: string }[] = [
    { code: "wrong_country",  label: "Wrong country" },
    { code: "wrong_degree",   label: "Wrong degree level" },
    { code: "not_interested", label: "Not interested" },
  ];

  function handleClick() {
    logMatchEvent({ scholarshipId: s.id, eventType: "click", rankPosition: rank, matchScore: result.match_score, sessionId });
  }

  function handleSave() {
    logMatchEvent({ scholarshipId: s.id, eventType: saved ? "unsave" : "save", rankPosition: rank, matchScore: result.match_score, sessionId });
    onToggleSave(s.id);
  }

  function handleApply() {
    logMatchEvent({ scholarshipId: s.id, eventType: "apply_start", rankPosition: rank, matchScore: result.match_score, sessionId });
  }

  return (
    <div
      className="border-b border-stone-100 last:border-0 px-6 py-4 transition-colors relative"
      style={{ backgroundColor: hovered ? "rgba(251,146,60,0.04)" : "white" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReasons(false); }}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-slate-400 mt-0.5">
          {rank}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <a
            href={`/scholarships/${s.slug ?? s.id}`}
            onClick={handleClick}
            className="text-[15px] font-semibold text-slate-800 hover:text-orange-600 transition-colors leading-snug"
          >
            {s.name}
          </a>
          <p className="text-xs text-slate-400 mt-0.5">
            {countryFlag(s.country)} {s.provider} · {s.degree_levels?.join(", ")}
          </p>
        </div>

        {/* Stat columns */}
        <div className="hidden sm:flex items-start gap-5 flex-shrink-0 text-right">
          <div>
            <p className="text-sm font-bold text-slate-800">{s.funding_amount}</p>
            <p className="text-[11px] text-slate-400">Amount</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{formatDeadline(s.application_deadline)}</p>
            <p className="text-[11px] text-slate-400">Deadline</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border ${scoreColor(result.match_score)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${scoreDot(result.match_score)}`} />
              {result.match_score}%
            </span>
          </div>
        </div>

        {/* Hover action icons */}
        <div
          className="flex items-center gap-1 flex-shrink-0 transition-opacity"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          {/* Not relevant / dismiss */}
          <div className="relative">
            <button
              onClick={() => setShowReasons((v) => !v)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Not relevant"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
            {showReasons && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-3 w-48">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Why not relevant?</p>
                <div className="space-y-1">
                  {REASONS.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => { setShowReasons(false); onDismiss(s.id, r.code); }}
                      className="w-full text-left text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      {r.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowReasons(false); onDismiss(s.id); }}
                    className="w-full text-left text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg transition-colors border-t border-stone-100 mt-1 pt-2"
                  >
                    Just dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-lg transition-colors ${saved ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-rose-400 hover:bg-rose-50"}`}
          >
            {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
          </button>

          {/* Apply */}
          <a
            href={s.application_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApply}
            className="p-1.5 rounded-lg text-slate-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tags + reasons row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 ml-9">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${scoreColor(result.match_score)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${scoreDot(result.match_score)}`} />
          {result.match_score >= 80 ? "Strong match" : result.match_score >= 60 ? "Good match" : "Possible match"}
        </span>
        {s.renewable && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-50 text-slate-500 border border-stone-200">
            <RefreshCw className="w-2.5 h-2.5" /> Renewable
          </span>
        )}
        {[s.country, s.funding_type].map((tag) => (
          <span key={tag} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tagColor(tag)}`}>
            {tag}
          </span>
        ))}
        {result.match_reasons.slice(0, 2).map((reason) => (
          <span key={reason} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-2.5 h-2.5" /> {reason}
          </span>
        ))}
        {s.effort_minutes && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-50 text-slate-500 border border-stone-200">
            ~{s.effort_minutes} min
          </span>
        )}
      </div>
    </div>
  );
}

// ── Match score filter dropdown ────────────────────────────────────────────

function ScoreFilterDropdown({ selected, onToggle, onClear }: {
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const opts = [
    { v: "possible", label: "Possible (< 60%)",  desc: "May match some of your profile criteria." },
    { v: "good",     label: "Good (60% – 79%)",  desc: "Matches several key profile criteria." },
    { v: "strong",   label: "Strong (80%+)",     desc: "Highly aligned with your academic profile." },
  ];
  return (
    <div className="absolute top-full left-0 mt-1 w-68 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-4">
      <p className="text-sm font-bold text-slate-800 mb-3">Filter by match score</p>
      <div className="space-y-3">
        {opts.map((o) => (
          <label key={o.v} className="flex items-start gap-3 cursor-pointer">
            <button
              onClick={() => onToggle(o.v)}
              className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                selected.includes(o.v) ? "bg-orange-500 border-orange-500" : "border-stone-300 hover:border-orange-400"
              }`}
            >
              {selected.includes(o.v) && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-700">{o.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{o.desc}</p>
            </div>
          </label>
        ))}
      </div>
      <button onClick={onClear} className="text-xs font-semibold text-slate-400 hover:text-slate-700 mt-3 transition-colors">
        Clear
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MatchesDashboardPage() {
  const [session, setSession] = useState<HistorySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState<string[]>(["strong", "good", "possible"]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: sessionData }, { data: savedRows }, { data: dismissedRows }] = await Promise.all([
        supabase
          .from("match_history")
          .select("id, run_at, explanation, results")
          .eq("user_id", user.id)
          .order("run_at", { ascending: false })
          .limit(1)
          .single(),
        supabase.from("saved_scholarships").select("scholarship_id").eq("user_id", user.id),
        supabase.from("dismissed_scholarships").select("scholarship_id").eq("user_id", user.id),
      ]);

      const sess = sessionData as HistorySession | null;
      setSession(sess);
      setSavedIds(new Set((savedRows ?? []).map((r: any) => r.scholarship_id)));
      setDismissedIds(new Set((dismissedRows ?? []).map((r: any) => r.scholarship_id)));
      setLoading(false);

      // Log impressions for all shown results
      if (sess?.results?.length) {
        logImpressions(
          sess.results.map((r) => ({ scholarshipId: r.scholarship.id, matchScore: r.match_score })),
          sess.id
        );
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setOpenFilter(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function toggleSave(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (savedIds.has(id)) {
      await supabase.from("saved_scholarships").delete().eq("user_id", user.id).eq("scholarship_id", id);
      setSavedIds((p) => { const n = new Set(p); n.delete(id); return n; });
    } else {
      await supabase.from("saved_scholarships").insert({ user_id: user.id, scholarship_id: id });
      setSavedIds((p) => new Set([...p, id]));
    }
  }

  function handleDismiss(id: string, reason?: NotRelevantReason) {
    const result = session?.results.find((r) => r.scholarship.id === id);
    dismissScholarship(id, reason, undefined, result?.match_score);
    setDismissedIds((p) => new Set([...p, id]));
  }

  const results: MatchResult[] = (session?.results ?? [])
    .filter((r) => !dismissedIds.has(r.scholarship.id));

  const filtered = results.filter((r) => {
    const nameMatch = r.scholarship.name.toLowerCase().includes(search.toLowerCase()) ||
      r.scholarship.provider?.toLowerCase().includes(search.toLowerCase());
    const scoreMatch = scoreFilter.length === 0 || (
      (scoreFilter.includes("strong")   && r.match_score >= 80) ||
      (scoreFilter.includes("good")     && r.match_score >= 60 && r.match_score < 80) ||
      (scoreFilter.includes("possible") && r.match_score < 60)
    );
    return nameMatch && scoreMatch;
  });

  const filterButtons = [
    { key: "deadline",    icon: Clock,       label: "Time until deadline" },
    { key: "amount",      icon: DollarSign,  label: "Amount" },
    { key: "requirement", icon: CheckSquare, label: "Effort" },
    { key: "applicants",  icon: Users,       label: "Applicants" },
    { key: "credibility", icon: Shield,      label: "Match score" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading your matches…</span>
    </div>
  );

  if (!session) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scholarship matches</h1>
      <div className="bg-white rounded-xl border border-stone-200 py-20 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-sm font-bold text-slate-700 mb-1">No match results yet</p>
        <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
          Run the AI matching engine to see your personalised scholarship matches here.
        </p>
        <a href="/dashboard/match" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Sparkles className="w-4 h-4" /> Run AI Matching
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scholarship matches</h1>
        <a href="/dashboard/match" className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
          <Sparkles className="w-3.5 h-3.5" /> Re-run matching
        </a>
      </div>

      {session.explanation && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
          <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 leading-relaxed">{session.explanation}</p>
        </div>
      )}

      {/* Filter bar */}
      <div ref={filterRef} className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterButtons.map((btn) => (
          <div key={btn.key} className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter((p) => p === btn.key ? null : btn.key)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-all whitespace-nowrap ${
                openFilter === btn.key
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-stone-200 hover:border-slate-400"
              }`}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${openFilter === btn.key ? "rotate-180" : ""}`} />
            </button>
            {openFilter === "credibility" && btn.key === "credibility" && (
              <ScoreFilterDropdown
                selected={scoreFilter}
                onToggle={(v) => setScoreFilter((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v])}
                onClear={() => setScoreFilter([])}
              />
            )}
            {openFilter === "applicants" && btn.key === "applicants" && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 z-50 p-4">
                <p className="text-sm font-bold text-slate-800 mb-1">Filter by applicants number</p>
                <p className="text-xs text-slate-400 mb-4">Find scholarships with fewest applicants.</p>
                <button className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs px-4 py-2.5 rounded-lg border border-orange-200 transition-colors">
                  <Lock className="w-3.5 h-3.5" /> Go Pro to Unlock
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results bar + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-700">{filtered.length}</span> match{filtered.length !== 1 ? "es" : ""}
          {dismissedIds.size > 0 && <span className="ml-2 text-slate-400">· {dismissedIds.size} dismissed</span>}
        </p>
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by keywords"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm bg-white border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300/40 focus:border-orange-400 w-52 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 py-16 text-center shadow-sm">
          <Search className="w-8 h-8 mx-auto mb-3 text-stone-300" />
          <p className="text-sm font-medium text-slate-500">No matches found</p>
          <button onClick={() => { setSearch(""); setScoreFilter(["strong","good","possible"]); }} className="text-xs text-orange-500 hover:underline mt-1">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          {filtered.map((r, i) => (
            <MatchRow
              key={r.scholarship.id}
              result={r}
              rank={i + 1}
              saved={savedIds.has(r.scholarship.id)}
              sessionId={session.id}
              onToggleSave={toggleSave}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
