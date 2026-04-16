"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles, Loader2, ExternalLink, Bookmark, BookmarkCheck,
  ChevronRight, AlertCircle, CheckCircle, History, Trash2,
  ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

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
    description: string;
  };
  match_score: number;
  match_reasons: string[];
}

interface MatchResponse {
  results: MatchResult[];
  explanation: string | null;
}

interface HistorySession {
  id: string;
  run_at: string;
  explanation: string | null;
  profile_snapshot: {
    degree_level?: string;
    field_of_study?: string;
    country_of_origin?: string;
    gpa?: number;
    profile_text?: string;
  };
  results: MatchResult[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 60) return { bar: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  return { bar: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
}

function formatRunAt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({
  result, rank, saved, saving, onToggleSave,
}: {
  result: MatchResult;
  rank: number;
  saved: Set<string>;
  saving: Set<string>;
  onToggleSave: (id: string) => void;
}) {
  const s = result.scholarship;
  const colors = scoreColor(result.match_score);
  const isSaved = saved.has(s.id);
  const isSaving = saving.has(s.id);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-500">
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h3 className="font-bold text-slate-900 leading-snug">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {countryFlag(s.country)} {s.country} · {s.provider}
                </p>
              </div>
              <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${colors.bg} ${colors.text}`}>
                {result.match_score}% match
              </div>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                style={{ width: `${result.match_score}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fundingBadgeColor(s.funding_type)}`}>
                {s.funding_type} Funding
              </span>
              {s.degree_levels?.map((d) => (
                <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{d}</span>
              ))}
              <span className="text-xs text-slate-400">
                Deadline: {formatDeadline(s.application_deadline)}
              </span>
            </div>

            {result.match_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.match_reasons.map((reason) => (
                  <span key={reason}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-2.5 h-2.5" /> {reason}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs font-semibold text-slate-700">{s.funding_amount}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50">
        <button
          onClick={() => onToggleSave(s.id)}
          disabled={isSaving}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isSaved ? "text-blue-600 hover:text-red-500" : "text-slate-500 hover:text-blue-600"
            }`}
        >
          {isSaving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {isSaved ? "Saved" : "Save"}
        </button>
        <div className="flex items-center gap-3">
          <a href={`/scholarships/${s.slug ?? s.id}`}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            Details <ChevronRight className="w-3 h-3" />
          </a>
          <a href={s.application_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
            Apply <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── History session row ───────────────────────────────────────────────────────

function HistoryRow({
  session, saved, saving, onToggleSave, onDelete,
}: {
  session: HistorySession;
  saved: Set<string>;
  saving: Set<string>;
  onToggleSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const snap = session.profile_snapshot;
  const topScore = session.results[0]?.match_score ?? 0;
  const colors = scoreColor(topScore);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Row header — always visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer"
      >
        <div className="flex-shrink-0 w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {session.results.length} matches found
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {snap.degree_level && `${snap.degree_level} · `}
            {snap.field_of_study && `${snap.field_of_study} · `}
            {snap.country_of_origin}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Top score pill */}
          <span className={`hidden sm:inline text-[11px] font-black px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text}`}>
            Top: {topScore}%
          </span>
          <span className="text-xs text-slate-400">{formatRunAt(session.run_at)}</span>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete this session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-4">
          {session.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">AI Analysis</p>
                <p className="text-sm text-blue-800 leading-relaxed">{session.explanation}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {session.results.map((r, i) => (
              <MatchCard
                key={r.scholarship.id}
                result={r}
                rank={i + 1}
                saved={saved}
                saving={saving}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MatchPage() {
  const [tab, setTab] = useState<"run" | "history">("run");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<MatchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Load profile + saved scholarships ────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: savedRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("saved_scholarships").select("scholarship_id").eq("user_id", user.id),
      ]);

      setProfile(prof);
      if (savedRows) setSaved(new Set(savedRows.map((r: any) => r.scholarship_id)));
    }
    load();
  }, []);

  // ── Load history when tab switches ────────────────────────
  useEffect(() => {
    if (tab !== "history") return;
    loadHistory();
  }, [tab]);

  async function loadHistory() {
    setHistoryLoading(true);
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("match_history")
      .select("id, run_at, explanation, profile_snapshot, results")
      .order("run_at", { ascending: false })
      .limit(20);

    setHistory((rows as HistorySession[]) ?? []);
    setHistoryLoading(false);
  }

  // ── Run matching ──────────────────────────────────────────
  async function runMatching() {
    setStatus("loading");
    setData(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/matching", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Matching failed. Please try again.");
        setStatus("error");
        return;
      }

      setData(json.data);
      setStatus("done");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  // ── Toggle save ───────────────────────────────────────────
  async function toggleSave(scholarshipId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingIds((prev) => new Set([...prev, scholarshipId]));

    if (saved.has(scholarshipId)) {
      await supabase.from("saved_scholarships")
        .delete().eq("user_id", user.id).eq("scholarship_id", scholarshipId);
      setSaved((prev) => { const n = new Set(prev); n.delete(scholarshipId); return n; });
    } else {
      await supabase.from("saved_scholarships")
        .insert({ user_id: user.id, scholarship_id: scholarshipId });
      setSaved((prev) => new Set([...prev, scholarshipId]));
    }

    setSavingIds((prev) => { const n = new Set(prev); n.delete(scholarshipId); return n; });
  }

  // ── Delete history session ────────────────────────────────
  async function deleteSession(id: string) {
    const supabase = createClient();
    await supabase.from("match_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((s) => s.id !== id));
  }

  const profileComplete = !!(profile?.field_of_study && profile?.degree_level && profile?.country_of_origin);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            AI Matching
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">
            Ranks all scholarships against your academic profile using semantic similarity.
          </p>
        </div>
      </div>

      {/* ── Profile readiness banner ──────────────────────── */}
      {profile && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${profileComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
          }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${profileComplete ? "bg-emerald-100" : "bg-amber-100"
            }`}>
            {profileComplete
              ? <CheckCircle className="w-5 h-5 text-emerald-600" />
              : <AlertCircle className="w-5 h-5 text-amber-500" />}
          </div>
          <div className="flex-1 min-w-0">
            {profileComplete ? (
              <>
                <p className="text-sm font-bold text-emerald-800">Profile ready for matching</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {profile.degree_level} · {profile.field_of_study} · {profile.country_of_origin}
                  {profile.gpa ? ` · GPA ${profile.gpa}` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-amber-800">Profile incomplete</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Add your field of study, degree level, and country for accurate results.
                </p>
              </>
            )}
          </div>
          {!profileComplete && (
            <a href="/dashboard/profile"
              className="flex-shrink-0 text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
              Complete profile →
            </a>
          )}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("run")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === "run"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Run matching</span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === "history"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <History className="w-4 h-4" />
          History
          {history.length > 0 && (
            <span className="ml-1 text-[11px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          RUN TAB
      ══════════════════════════════════════════════════════ */}
      {tab === "run" && (
        <>
          {/* Idle / error — show run button */}
          {status !== "done" && (
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Ready to find your matches?</h2>
              <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
                We&apos;ll rank all scholarships against your profile in seconds. Every run is saved to history.
              </p>

              {status === "error" && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left max-w-sm mx-auto">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                onClick={runMatching}
                disabled={status === "loading" || !profileComplete}
                className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
              >
                {status === "loading"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="whitespace-nowrap">Matching...</span></>
                  : <><Sparkles className="w-4 h-4" /><span className="whitespace-nowrap">Run AI Matching</span></>}
              </button>
              {!profileComplete && (
                <p className="text-xs text-slate-400 mt-3">Complete your profile to enable matching</p>
              )}
            </div>
          )}

          {/* Results */}
          {status === "done" && data && (
            <div className="space-y-4">
              {data.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">AI Analysis</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{data.explanation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">
                  {data.results.length} matches found
                  <span className="ml-2 text-xs font-normal text-slate-400">— saved to history</span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setTab("history"); loadHistory(); }}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" /> View history
                  </button>
                  <button
                    onClick={runMatching}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Re-run matching
                  </button>
                </div>
              </div>

              {data.results.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <p className="text-slate-500 text-sm">No strong matches found above 50% threshold.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try adding more detail to your academic background in your profile.
                  </p>
                  <a href="/dashboard/profile" className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline">
                    Update Profile →
                  </a>
                </div>
              ) : (
                data.results.map((r, i) => (
                  <MatchCard
                    key={r.scholarship.id}
                    result={r}
                    rank={i + 1}
                    saved={saved}
                    saving={savingIds}
                    onToggleSave={toggleSave}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          HISTORY TAB
      ══════════════════════════════════════════════════════ */}
      {tab === "history" && (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No match history yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Every time you run AI matching, the session is saved here so you can revisit your results.
              </p>
              <button
                onClick={() => setTab("run")}
                className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Run your first match →
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                {history.length} session{history.length !== 1 ? "s" : ""} — click any row to expand results
              </p>
              {history.map((session) => (
                <HistoryRow
                  key={session.id}
                  session={session}
                  saved={saved}
                  saving={savingIds}
                  onToggleSave={toggleSave}
                  onDelete={deleteSession}
                />
              ))}
            </>
          )}
        </div>
      )}

    </div>
  );
}
