"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, ExternalLink, Bookmark, BookmarkCheck, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { countryFlag, formatDeadline, fundingBadgeColor } from "@/lib/utils";

interface MatchResult {
  scholarship: {
    id: string;
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

export default function MatchPage() {
  const [status,      setStatus]      = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data,        setData]        = useState<MatchResponse | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [profile,     setProfile]     = useState<any>(null);
  const [saved,       setSaved]       = useState<Set<string>>(new Set());
  const [savingIds,   setSavingIds]   = useState<Set<string>>(new Set());

  // Load profile + saved scholarships on mount
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

  const profileComplete = !!(profile?.field_of_study && profile?.degree_level && profile?.country_of_origin);

  // Score colour
  function scoreColor(score: number) {
    if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    if (score >= 60) return { bar: "bg-blue-500",    text: "text-blue-600",    bg: "bg-blue-50 border-blue-200" };
    return              { bar: "bg-amber-400",    text: "text-amber-600",   bg: "bg-amber-50 border-amber-200" };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            AI Scholarship Matching
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ranks all scholarships against your academic profile using semantic similarity.
          </p>
        </div>
      </div>

      {/* Profile summary card */}
      {profile && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${
          profileComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            profileComplete ? "bg-emerald-100" : "bg-amber-100"
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

      {/* Run button */}
      {status !== "done" && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Ready to find your matches?</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            We&apos;ll compare your profile against all 20 scholarships and return a ranked list in seconds.
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
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Matching your profile…</>
              : <><Sparkles className="w-4 h-4" /> Run AI Matching</>
            }
          </button>
          {!profileComplete && (
            <p className="text-xs text-slate-400 mt-3">Complete your profile to enable matching</p>
          )}
        </div>
      )}

      {/* Results */}
      {status === "done" && data && (
        <div className="space-y-4">

          {/* AI explanation */}
          {data.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">AI Analysis</p>
                <p className="text-sm text-blue-800 leading-relaxed">{data.explanation}</p>
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">
              {data.results.length} matches found
            </p>
            <button
              onClick={runMatching}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Re-run matching
            </button>
          </div>

          {/* Match cards */}
          {data.results.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-slate-500 text-sm">No strong matches found above 50% threshold.</p>
              <p className="text-slate-400 text-xs mt-1">Try adding more detail to your academic background in your profile.</p>
              <a href="/dashboard/profile" className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline">
                Update Profile →
              </a>
            </div>
          ) : (
            data.results.map((r, i) => {
              const colors  = scoreColor(r.match_score);
              const isSaved = saved.has(r.scholarship.id);
              const saving  = savingIds.has(r.scholarship.id);

              return (
                <div key={r.scholarship.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all">

                  <div className="p-5">
                    <div className="flex items-start gap-4">

                      {/* Rank */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-500">
                        {i + 1}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div>
                            <h3 className="font-bold text-slate-900 leading-snug">{r.scholarship.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {countryFlag(r.scholarship.country)} {r.scholarship.country} · {r.scholarship.provider}
                            </p>
                          </div>

                          {/* Match score badge */}
                          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${colors.bg} ${colors.text}`}>
                            {r.match_score}% match
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                            style={{ width: `${r.match_score}%` }}
                          />
                        </div>

                        {/* Tags row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fundingBadgeColor(r.scholarship.funding_type)}`}>
                            {r.scholarship.funding_type} Funding
                          </span>
                          {r.scholarship.degree_levels?.map((d) => (
                            <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {d}
                            </span>
                          ))}
                          <span className="text-xs text-slate-400">
                            Deadline: {formatDeadline(r.scholarship.application_deadline)}
                          </span>
                        </div>

                        {/* Match reasons */}
                        {r.match_reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {r.match_reasons.map((reason) => (
                              <span key={reason} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-2.5 h-2.5" /> {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Funding amount */}
                        <p className="text-xs font-semibold text-slate-700">
                          {r.scholarship.funding_amount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50">
                    <button
                      onClick={() => toggleSave(r.scholarship.id)}
                      disabled={saving}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        isSaved ? "text-blue-600 hover:text-red-500" : "text-slate-500 hover:text-blue-600"
                      }`}
                    >
                      {saving
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isSaved
                          ? <BookmarkCheck className="w-3.5 h-3.5" />
                          : <Bookmark className="w-3.5 h-3.5" />}
                      {isSaved ? "Saved" : "Save"}
                    </button>

                    <div className="flex items-center gap-3">
                      <a href={`/scholarships/${r.scholarship.id}`}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                        Details <ChevronRight className="w-3 h-3" />
                      </a>
                      <a href={r.scholarship.application_url}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
