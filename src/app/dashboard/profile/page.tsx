"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Camera, Sparkles, User, BookOpen, Globe, Star, Target, Heart, ChevronDown, X, Bell } from "lucide-react";
import { getTopNudge } from "@/lib/utils/profile-completeness";
import CountrySelect from "@/components/ui/CountrySelect";
import {
  getStudyFieldName,
  resolveStudyFieldSlug,
  STUDY_FIELD_OPTIONS,
} from "@/lib/constants/study-fields";
import { createPortal } from "react-dom";

const DEGREE_LEVELS = ["Undergraduate", "Masters", "PhD", "Any"];
const INTEREST_OPTIONS = [
  "Research","Community service","Entrepreneurship","Leadership","Sports",
  "Arts","Technology","Environment","Healthcare","International development",
];

const inp = [
  "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-zinc-800",
  "border-zinc-200 hover:border-zinc-300",
  "focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100",
  "transition-all placeholder:text-zinc-400",
].join(" ");

// ── Interests checkbox dropdown ────────────────────────────────────────────

function InterestsDropdown({
  options, selected, onChange, inputClass,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  inputClass: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  }

  const label = selected.length === 0
    ? "Select interests…"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between cursor-pointer text-left`}
      >
        <span className={selected.length === 0 ? "text-slate-400" : "text-slate-800"}>
          {label}
        </span>
        <ChevronDown className={`size-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Selected chips (shown below trigger when >0 selected) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:text-blue-900 transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown panel - rendered via portal to avoid overflow issues */}
      {open && createPortal(
        <div
          className="fixed bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10 py-2 max-h-72 overflow-y-auto z-[100]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                {/* Custom checkbox */}
                <div className={`size-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked ? "bg-blue-600 border-blue-600" : "border-slate-300"
                }`}>
                  {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-700">{option}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading]  = useState(true);
  const [saving,  setSaving]   = useState(false);
  const [saved,   setSaved]    = useState(false);
  const [dirty,   setDirty]    = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email,   setEmail]    = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    digest_email:       true,
    deadline_reminders: true,
  });
  const [form, setForm] = useState({
    full_name: "", country_of_origin: "", field_of_study: "",
    degree_level: "", gpa: "", bio: "",
    citizenship: "", career_goals: "",
    financial_need: "" as "" | "true" | "false",
    interests: [] as string[],
  });

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login?redirectTo=/dashboard/profile";
        return;
      }
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          full_name:         data.full_name         ?? "",
          country_of_origin: data.country_of_origin ?? "",
          field_of_study:    data.field_of_study
                           ?? getStudyFieldName((data as any).primary_field_slug)
                           ?? "",
          degree_level:      data.degree_level      ?? "",
          gpa:               data.gpa?.toString()   ?? "",
          bio:               data.bio               ?? "",
          citizenship:       (data as any).citizenship    ?? "",
          career_goals:      (data as any).career_goals   ?? "",
          financial_need:    (data as any).financial_need === true ? "true"
                           : (data as any).financial_need === false ? "false" : "",
          interests:         (data as any).interests ?? [],
        });
        const prefs = (data as any).notification_preferences ?? {};
        setNotifPrefs({
          digest_email:       prefs.digest_email       !== false,
          deadline_reminders: prefs.deadline_reminders !== false,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true); setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      window.location.href = "/auth/login?redirectTo=/dashboard/profile";
      return;
    }
    await supabase.from("profiles").update({
      full_name:         form.full_name         || null,
      country_of_origin: form.country_of_origin || null,
      field_of_study:    form.field_of_study    || null,
      primary_field_slug: resolveStudyFieldSlug(form.field_of_study),
      degree_level:      form.degree_level      || null,
      gpa:               form.gpa               ? parseFloat(form.gpa) : null,
      bio:               form.bio               || null,
      citizenship:       form.citizenship       || null,
      career_goals:      form.career_goals      || null,
      financial_need:    form.financial_need === "true" ? true
                       : form.financial_need === "false" ? false : null,
      interests:              form.interests.length > 0 ? form.interests : [],
      notification_preferences: notifPrefs,
    }).eq("id", user.id);
    setSaving(false); setSaved(true); setDirty(false); setIsEditing(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setDirty(false);
    setSaved(false);
  }

  const topNudge = getTopNudge({
    full_name:           form.full_name,
    country_of_origin:   form.country_of_origin,
    field_of_study:      form.field_of_study,
    degree_level:        form.degree_level,
    citizenship:         form.citizenship,
    gpa:                 form.gpa,
    career_goals:        form.career_goals,
    bio:                 form.bio,
    financial_need:      form.financial_need,
  });

  // Weighted completeness — mirrors server-side formula
  const weightedFields = [
    { value: form.full_name,           weight: 10, label: "Full name" },
    { value: form.country_of_origin,   weight: 10, label: "Country of origin" },
    { value: form.field_of_study,      weight: 15, label: "Field of study" },
    { value: form.degree_level,        weight: 15, label: "Degree level" },
    { value: form.citizenship,         weight: 15, label: "Citizenship" },
    { value: form.gpa,                 weight: 10, label: "GPA" },
    { value: form.career_goals,        weight: 10, label: "Career goals" },
    { value: form.bio,                 weight: 5,  label: "Background" },
    { value: form.financial_need,      weight: 10, label: "Financial need" },
  ];
  const totalWeight  = weightedFields.reduce((s, f) => s + f.weight, 0);
  const earnedWeight = weightedFields.filter((f) => Boolean(f.value)).reduce((s, f) => s + f.weight, 0);
  const completionPct = Math.round((earnedWeight / totalWeight) * 100);

  const initials = form.full_name
    ? form.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-5 animate-spin text-blue-600" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Account Settings</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile</h1>
          </div>
          {/* Desktop buttons - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/20"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving || !dirty}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/20">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
                  {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">

        {/* Profile nudge - only show when editing */}
        {isEditing && topNudge && completionPct < 90 && (
          <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="size-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Boost your matches: Add your <strong>{topNudge.label}</strong> to unlock <strong>{topNudge.gain}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Avatar card - only show when not editing (read-only) */}
        {!isEditing && (
          <div className="bg-white border border-slate-300 overflow-hidden">
            <div className="border-b border-slate-300 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-xl font-bold text-white">
                  {initials}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 uppercase tracking-wide">{form.full_name || "Your Name"}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">{email}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Profile Completion</p>
                  <div className="flex items-center gap-3">
                    <div className="w-48 h-2 bg-slate-200 rounded-sm overflow-hidden">
                      <div className="h-full bg-slate-800 transition-all duration-700 ease-out"
                        style={{ width: `${completionPct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{completionPct}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Status</p>
                  <p className={`text-sm font-semibold ${
                    completionPct === 100 ? "text-emerald-700" : completionPct >= 60 ? "text-blue-700" : "text-amber-700"
                  }`}>
                    {completionPct === 100 ? "Complete" : completionPct >= 60 ? "In Progress" : "Incomplete"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Academic Information</p>
                  <div className="space-y-1.5">
                    {form.degree_level && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-slate-600">Degree:</span>
                        <span className="font-medium text-slate-900">{form.degree_level}</span>
                      </div>
                    )}
                    {form.field_of_study && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-slate-600">Field:</span>
                        <span className="font-medium text-slate-900">{form.field_of_study}</span>
                      </div>
                    )}
                    {form.gpa && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-slate-600">GPA:</span>
                        <span className="font-medium text-slate-900">{form.gpa}</span>
                      </div>
                    )}
                    {form.country_of_origin && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-slate-600">Origin:</span>
                        <span className="font-medium text-slate-900">{form.country_of_origin}</span>
                      </div>
                    )}
                    {!form.degree_level && !form.field_of_study && !form.gpa && !form.country_of_origin && (
                      <p className="text-sm text-slate-400 italic">Not provided</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Details</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-28 text-slate-600">Email:</span>
                      <span className="font-medium text-slate-900">{email}</span>
                    </div>
                    {form.citizenship && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-28 text-slate-600">Citizenship:</span>
                        <span className="font-medium text-slate-900">{form.citizenship}</span>
                      </div>
                    )}
                    {!form.citizenship && (
                      <p className="text-sm text-slate-400 italic">Not provided</p>
                    )}
                  </div>
                </div>
                {form.bio && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Background</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{form.bio}</p>
                  </div>
                )}
                {form.career_goals && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Career Goals</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{form.career_goals}</p>
                  </div>
                )}
                {form.financial_need && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Financial Need</p>
                    <p className="text-sm text-slate-700">
                      {form.financial_need === "true" ? "Yes, I have financial need" : "No financial need"}
                    </p>
                  </div>
                )}
                {form.interests && form.interests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {form.interests.map((interest) => (
                        <span key={interest} className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 rounded">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Notifications</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-48 text-slate-600">Weekly digest:</span>
                      <span className={`font-medium ${notifPrefs.digest_email ? "text-emerald-700" : "text-slate-400"}`}>
                        {notifPrefs.digest_email ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-48 text-slate-600">Deadline reminders:</span>
                      <span className={`font-medium ${notifPrefs.deadline_reminders ? "text-emerald-700" : "text-slate-400"}`}>
                        {notifPrefs.deadline_reminders ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons - mobile only, hidden on desktop */}
        <div className="flex sm:hidden justify-end">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/20"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving || !dirty}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-slate-900/20">
                {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
                {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
              </button>
            </div>
          )}
        </div>

        {/* Form sections - only show when editing */}
        {isEditing && (
          <>
            {/* Personal info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center"><User className="size-4 text-blue-600" /></div>
                <div><h2 className="text-sm font-semibold text-slate-900">Personal Information</h2><p className="text-xs text-slate-500">Name, origin, and citizenship</p></div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Full Name</label>
                  <input className={inp} placeholder="e.g. Kofi Mensah" type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Country of Origin</label>
                  <CountrySelect 
                    value={form.country_of_origin} 
                    onChange={(v) => update("country_of_origin", v)}
                    placeholder="e.g. Ghana"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    Citizenship / Nationality <span className="normal-case font-normal text-slate-400">— used for eligibility filtering</span>
                  </label>
                  <CountrySelect 
                    value={form.citizenship} 
                    onChange={(v) => update("citizenship", v)}
                    placeholder="e.g. Ghana"
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">ℹ</span>
                    <span>This is the single most important field for filtering scholarships correctly.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Academic profile */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center"><BookOpen className="size-4 text-emerald-600" /></div>
                <div><h2 className="text-sm font-semibold text-slate-900">Academic Profile</h2><p className="text-xs text-slate-500">Degree, field, and GPA</p></div>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Field of Study</label>
                    <select className={inp + " cursor-pointer"} value={form.field_of_study} onChange={(e) => update("field_of_study", e.target.value)}>
                      <option value="">Select your field…</option>
                      {STUDY_FIELD_OPTIONS.map((field) => (
                        <option key={field.slug} value={field.name}>{field.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Degree Level</label>
                    <select className={inp + " cursor-pointer"} value={form.degree_level} onChange={(e) => update("degree_level", e.target.value)}>
                      <option value="">Select level…</option>
                      {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    GPA <span className="normal-case font-normal text-slate-400">— optional, 4.0 scale</span>
                  </label>
                  <div className="relative w-36">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input type="number" step="0.01" min="0" max="4" className={inp + " pl-9"} placeholder="3.7"
                      value={form.gpa} onChange={(e) => update("gpa", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    Background <span className="normal-case font-normal text-slate-400">— optional</span>
                  </label>
                  <textarea rows={3} className={inp + " resize-none"}
                    placeholder="Describe your academic background, research interests, and achievements. More context = better matches."
                    value={form.bio} onChange={(e) => update("bio", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Goals & interests */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="size-8 rounded-lg bg-purple-100 flex items-center justify-center"><Target className="size-4 text-purple-600" /></div>
                <div><h2 className="text-sm font-semibold text-slate-900">Goals & Interests</h2><p className="text-xs text-slate-500">Improves semantic matching</p></div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    Career Goals <span className="normal-case font-normal text-slate-400">— optional</span>
                  </label>
                  <textarea rows={2} className={inp + " resize-none"}
                    placeholder="e.g. Become a public health researcher focusing on infectious diseases in West Africa"
                    value={form.career_goals} onChange={(e) => update("career_goals", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      Financial Need <span className="normal-case font-normal text-slate-400">— optional</span>
                    </label>
                    <select
                      className={inp + " cursor-pointer"}
                      value={form.financial_need}
                      onChange={(e) => { setForm((p) => ({ ...p, financial_need: e.target.value as "" | "true" | "false" })); setDirty(true); setSaved(false); }}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="true">Yes, I have financial need</option>
                      <option value="false">No financial need</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                      Interests <span className="normal-case font-normal text-slate-400">— select all that apply</span>
                    </label>
                    <InterestsDropdown
                      options={INTEREST_OPTIONS}
                      selected={form.interests}
                      onChange={(selected) => {
                        setForm((p) => ({ ...p, interests: selected }));
                        setDirty(true); setSaved(false);
                      }}
                      inputClass={inp}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="size-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Bell className="size-4 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Email Notifications</h2>
                  <p className="text-xs text-slate-500">Choose which emails you receive from ScholarMatch</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {([
                  {
                    key:   "digest_email" as const,
                    label: "Weekly digest",
                    desc:  "Top matches, upcoming deadlines, and profile tips — every Sunday",
                  },
                  {
                    key:   "deadline_reminders" as const,
                    label: "Deadline reminders",
                    desc:  "Reminder emails 7 days and 3 days before tracked scholarship deadlines",
                  },
                ]).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => { setNotifPrefs((p) => ({ ...p, [key]: !p[key] })); setDirty(true); setSaved(false); }}
                      className={`mt-0.5 w-11 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${notifPrefs[key] ? "bg-blue-600" : "bg-slate-200"}`}
                      aria-checked={notifPrefs[key]}
                      role="switch"
                      aria-label={label}
                    >
                      <span className={`absolute top-1 size-4 bg-white rounded-full shadow transition-all ${notifPrefs[key] ? "left-6" : "left-1"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-none">{label}</p>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </div>
                  </label>
                ))}
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Transactional emails (password reset, account security) are always sent.
                </p>
              </div>
            </div>

            {/* Completeness checklist */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Heart className="size-4 text-rose-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-slate-900">Profile completeness</h2>
                  <p className="text-xs text-slate-500">Complete more fields to improve your matches</p>
                </div>
                <span className="text-lg font-bold text-slate-900">{completionPct}%</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {weightedFields.map((f) => (
                  <div key={f.label} className={["flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all",
                    f.value ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"
                  ].join(" ")}>
                    <div className={["size-4 rounded-full flex items-center justify-center flex-shrink-0",
                      f.value ? "bg-emerald-500" : "border-2 border-slate-300"
                    ].join(" ")}>
                      {f.value && <Check className="size-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1">{f.label}</span>
                    <span className="text-[10px] font-semibold opacity-60">+{f.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </form>
  );
}
