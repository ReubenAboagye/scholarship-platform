"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronLeft, GraduationCap, BookOpen, Globe, Sparkles, AlertTriangle, X } from "lucide-react";

// ── Data ────────────────────────────────────────────────────
const DEGREE_LEVELS = [
  { value: "Undergraduate", label: "Undergraduate",  desc: "Bachelor's degree program" },
  { value: "Masters",       label: "Masters",         desc: "Postgraduate taught degree" },
  { value: "PhD",           label: "PhD / Doctorate", desc: "Research degree" },
  { value: "Any",           label: "Not sure yet",    desc: "Show me all opportunities" },
];

const POPULAR_FIELDS = [
  "Business & Management", "Computer Science", "Engineering",
  "Medicine", "Law", "Economics", "Education", "Natural Sciences",
  "Social Sciences", "Public Policy", "Arts & Humanities", "Public Health",
  "Mathematics", "Agriculture", "Architecture", "Psychology",
];

const ALL_FIELDS = [
  ...POPULAR_FIELDS,
  "Environmental Studies", "Political Science", "Other",
].sort();

// ── Step progress bar ────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full flex items-center gap-1.5 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i < step ? "bg-brand-600" : i === step ? "bg-brand-300" : "bg-slate-200"
        }`} />
      ))}
    </div>
  );
}

// ── Option button ────────────────────────────────────────────
function OptionButton({
  selected, onClick, children, description,
}: { selected: boolean; onClick: () => void; children: React.ReactNode; description?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <p className={`font-semibold text-[15px] ${selected ? "text-brand-700" : "text-slate-900"}`}>
        {children}
      </p>
      {description && (
        <p className={`text-sm mt-0.5 ${selected ? "text-brand-500" : "text-slate-400"}`}>
          {description}
        </p>
      )}
    </button>
  );
}

// ── Field chip ───────────────────────────────────────────────
function FieldChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
        selected
          ? "bg-brand-600 border-brand-600 text-white"
          : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600"
      }`}
    >
      {selected ? "✓ " : "+ "}{label}
    </button>
  );
}
// ── Main Wizard Component ────────────────────────────────────
export default function OnboardingWizard() {
  const [step,        setStep]        = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Form state
  const [degreeLevel,      setDegreeLevel]      = useState("");
  const [fieldsOfStudy,    setFieldsOfStudy]    = useState<string[]>([]);
  const [countryOfOrigin,  setCountryOfOrigin]  = useState("");
  const [gpa,              setGpa]              = useState("");
  const [bio,              setBio]              = useState("");

  const TOTAL_STEPS = 4;

  // ── Nav helpers ────────────────────────────────────────────
  function canAdvance() {
    if (step === 0) return !!degreeLevel;
    if (step === 1) return fieldsOfStudy.length > 0;
    if (step === 2) return countryOfOrigin.trim().length > 1;
    return true; // step 3 is optional
  }

  function toggleField(field: string) {
    setFieldsOfStudy((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  }

  // ── Save & finish ──────────────────────────────────────────
  async function finish() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      degree_level:       degreeLevel,
      field_of_study:     fieldsOfStudy[0] ?? null,
      country_of_origin:  countryOfOrigin.trim(),
      gpa:                gpa ? parseFloat(gpa) : null,
      bio:                bio.trim() || null,
      onboarding_complete: true,
    }).eq("id", user.id);

    window.location.href = "/dashboard";
  }

  // ── Skip — saves whatever is filled so far, marks incomplete ─
  async function skip() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      degree_level:      degreeLevel      || null,
      field_of_study:    fieldsOfStudy[0] || null,
      country_of_origin: countryOfOrigin.trim() || null,
      gpa:               gpa ? parseFloat(gpa) : null,
      bio:               bio.trim() || null,
      onboarding_complete: false, // stays false — banner will show on dashboard
    }).eq("id", user.id);

    window.location.href = "/dashboard";
  }

  // ── Filtered fields for step 1 search ─────────────────────
  const visibleFields = fieldSearch.trim()
    ? ALL_FIELDS.filter((f) => f.toLowerCase().includes(fieldSearch.toLowerCase()))
    : POPULAR_FIELDS;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      {/* Top bar */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex items-center gap-1.5">
          <span className="font-black text-slate-900 text-[15px]">Scholar</span>
          <span className="font-black text-brand-600 text-[15px]">Match</span>
        </a>
        <p className="text-xs text-slate-400 font-medium">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Wizard content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-10 pb-32">
        <div className="w-full max-w-lg">

          <ProgressBar step={step} total={TOTAL_STEPS} />

          {/* ── STEP 0: Degree level ───────────────────────── */}
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                What is your current level of education?
              </h1>
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
                Many scholarships are designed for specific education levels.
                Selecting yours helps us find your best matches.
              </p>
              <div className="space-y-3">
                {DEGREE_LEVELS.map((d) => (
                  <OptionButton
                    key={d.value}
                    selected={degreeLevel === d.value}
                    onClick={() => setDegreeLevel(d.value)}
                    description={d.desc}
                  >
                    {d.label}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Field of study ─────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                What are you studying?
              </h1>
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
                Select your field of study so we can match you with
                relevant scholarship opportunities.
              </p>

              {/* Search */}
              <input
                type="text"
                placeholder="Search fields…"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="w-full px-4 py-2.5 mb-5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400"
              />

              {/* Selected chips */}
              {fieldsOfStudy.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {fieldsOfStudy.map((f) => (
                    <span key={f}
                      className="flex items-center gap-1.5 px-3 py-1 bg-brand-600 text-white text-sm font-medium rounded-full">
                      {f}
                      <button onClick={() => toggleField(f)} className="hover:text-brand-200 transition-colors text-base leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                {fieldSearch ? "Results" : "Popular Fields"}
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleFields.map((f) => (
                  <FieldChip
                    key={f}
                    label={f}
                    selected={fieldsOfStudy.includes(f)}
                    onClick={() => toggleField(f)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Country of origin ──────────────────── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Where are you from?
              </h1>
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed">
                Many scholarships are open only to applicants from specific
                countries. This helps us filter out ones you&apos;re not eligible for.
              </p>
              <input
                type="text"
                placeholder="e.g. Ghana, Nigeria, Kenya…"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                autoFocus
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base outline-none focus:ring-0 focus:border-brand-500 transition-colors placeholder:text-slate-400"
              />
            </div>
          )}

          {/* ── STEP 3: Optional details ───────────────────── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-brand-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                A little more about you
              </h1>
              <p className="text-slate-500 text-sm text-center mb-2 leading-relaxed">
                Optional — but the more context you give, the more accurate your AI matches will be.
              </p>
              <p className="text-xs text-brand-600 font-semibold text-center mb-8">
                You can always update this later in your profile.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    GPA / Academic Score
                    <span className="normal-case font-normal text-slate-400 ml-1">— optional</span>
                  </label>
                  <input
                    type="number" step="0.01" min="0" max="4"
                    placeholder="e.g. 3.7 (on a 4.0 scale)"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Academic background & goals
                    <span className="normal-case font-normal text-slate-400 ml-1">— optional</span>
                  </label>
                  <textarea
                    rows={5}
                    maxLength={500}
                    placeholder="Tell us about your academic background, research interests, career goals, or any achievements. The AI uses this to personalise your matches."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors resize-none placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{bio.length} / 500</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Skip confirmation modal ───────────────────────── */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowSkipModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <button
              onClick={() => setShowSkipModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-2">
              Your matches won&apos;t be accurate yet
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              The AI matching engine uses your education level, field of study, and country to rank scholarships.
              Without this, results will be generic rather than personalised to you.
            </p>
            <p className="text-xs text-slate-400 mb-6">
              You can complete your profile any time from the dashboard.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowSkipModal(false)}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Continue setup
              </button>
              <button
                onClick={skip}
                disabled={saving}
                className="w-full py-2.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed bottom nav ──────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">

          {/* Back */}
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className={`flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors ${
              step === 0 ? "invisible" : ""
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {/* Next / Finish */}
          <div className="flex-1 flex flex-col gap-2 items-stretch">
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                disabled={!canAdvance()}
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={finish}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your profile…</>
                  : <><Sparkles className="w-4 h-4" /> Find my scholarships</>
                }
              </button>
            )}

            {/* Skip link — only on steps 0-2, not on the optional step 3 */}
            {step < TOTAL_STEPS - 1 && (
              <button
                type="button"
                onClick={() => setShowSkipModal(true)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors text-center py-1"
              >
                Skip for now
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
