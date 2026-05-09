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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    : `${selected[0]} +${selected.length - 1} more`;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between cursor-pointer text-left`}
      >
        <span className={selected.length === 0 ? "text-zinc-400" : "text-zinc-800"}>
          {label}
        </span>
        <ChevronDown className={`size-4 text-zinc-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Selected chips (shown below trigger when >0 selected) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
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

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
              >
                {/* Custom checkbox */}
                <div className={`size-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked ? "bg-blue-600 border-blue-600" : "border-zinc-300"
                }`}>
                  {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-zinc-700">{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading]  = useState(true);
  const [saving,  setSaving]   = useState(false);
  const [saved,   setSaved]    = useState(false);
  const [dirty,   setDirty]    = useState(false);
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
    setSaving(false); setSaved(true); setDirty(false);
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
    <form onSubmit={handleSave} className="max-w-4xl mx-auto pb-8">

      {/* Header */}
      <div className="pb-2 mb-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Account</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl text-zinc-900">Profile Settings</h1>
            <p className="text-sm text-zinc-400 mt-1">Your profile powers the AI matching engine.</p>
          </div>
          <button type="submit" disabled={saving || !dirty}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all mt-1">
            {saving ? <Loader2 className="size-3 animate-spin" /> : saved ? <Check className="size-3" /> : null}
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="space-y-5">

        {/* Profile nudge */}
        {topNudge && completionPct < 90 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-sm text-amber-800 flex-1">
              Adding your <strong>{topNudge.label}</strong> will unlock <strong>{topNudge.gain}</strong>.
            </p>
          </div>
        )}

        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-400" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-5">
              <div className="relative">
                <div className="size-20 rounded-xl bg-zinc-900 border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-md">
                  {initials}
                </div>
                <button type="button" className="absolute -bottom-1 -right-1 size-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center shadow-sm hover:bg-zinc-50 transition-colors">
                  <Camera className="size-3 text-zinc-500" />
                </button>
              </div>
              {/* Match quality meter */}
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                <Sparkles className="size-3.5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-zinc-700">Match quality</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-24 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${completionPct}%`, backgroundColor: completionPct === 100 ? "#10b981" : completionPct >= 60 ? "#3b82f6" : "#f59e0b" }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: completionPct === 100 ? "#10b981" : completionPct >= 60 ? "#3b82f6" : "#f59e0b" }}>
                      {completionPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-bold text-zinc-900">{form.full_name || "Your Name"}</p>
            <p className="text-sm text-zinc-500">{email}</p>
            {form.field_of_study && form.degree_level && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                {form.degree_level} · {form.field_of_study}{form.country_of_origin ? ` · ${form.country_of_origin}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center"><User className="size-3.5 text-blue-600" /></div>
            <div><h2 className="text-sm text-zinc-900">Personal Info</h2><p className="text-xs text-zinc-400">Name, origin, and citizenship</p></div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input className={inp} placeholder="e.g. Kofi Mensah" type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">Country of Origin</label>
              <CountrySelect 
                value={form.country_of_origin} 
                onChange={(v) => update("country_of_origin", v)}
                placeholder="e.g. Ghana"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                Citizenship / Nationality <span className="normal-case font-normal text-zinc-400">— used for eligibility filtering</span>
              </label>
              <CountrySelect 
                value={form.citizenship} 
                onChange={(v) => update("citizenship", v)}
                placeholder="e.g. Ghana"
              />
              <p className="text-xs text-zinc-400 mt-1.5">This is the single most important field for filtering scholarships correctly.</p>
            </div>
          </div>
        </div>

        {/* Academic profile */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center"><BookOpen className="size-3.5 text-emerald-600" /></div>
            <div><h2 className="text-sm text-zinc-900">Academic Profile</h2><p className="text-xs text-zinc-400">Degree, field, and GPA</p></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">Field of Study</label>
                <select className={inp + " cursor-pointer"} value={form.field_of_study} onChange={(e) => update("field_of_study", e.target.value)}>
                  <option value="">Select your field…</option>
                  {STUDY_FIELD_OPTIONS.map((field) => (
                    <option key={field.slug} value={field.name}>{field.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">Degree Level</label>
                <select className={inp + " cursor-pointer"} value={form.degree_level} onChange={(e) => update("degree_level", e.target.value)}>
                  <option value="">Select level…</option>
                  {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                GPA <span className="normal-case font-normal text-zinc-400">— optional, 4.0 scale</span>
              </label>
              <div className="relative w-32">
                <Star className="absolute left-3 top-1/2 -tranzinc-y-1/2 size-3.5 text-zinc-400" />
                <input type="number" step="0.01" min="0" max="4" className={inp + " pl-8"} placeholder="3.7"
                  value={form.gpa} onChange={(e) => update("gpa", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                Background <span className="normal-case font-normal text-zinc-400">— optional</span>
              </label>
              <textarea rows={3} className={inp + " resize-none"}
                placeholder="Describe your academic background, research interests, and achievements. More context = better matches."
                value={form.bio} onChange={(e) => update("bio", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Goals & interests */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="size-7 rounded-lg bg-purple-50 flex items-center justify-center"><Target className="size-3.5 text-purple-600" /></div>
            <div><h2 className="text-sm text-zinc-900">Goals & Interests</h2><p className="text-xs text-zinc-400">Improves semantic matching</p></div>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                Career Goals <span className="normal-case font-normal text-zinc-400">— optional</span>
              </label>
              <textarea rows={2} className={inp + " resize-none"}
                placeholder="e.g. Become a public health researcher focusing on infectious diseases in West Africa"
                value={form.career_goals} onChange={(e) => update("career_goals", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                  Financial Need <span className="normal-case font-normal text-zinc-400">— optional</span>
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
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">
                  Interests <span className="normal-case font-normal text-zinc-400">— select all that apply</span>
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
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
            <div className="size-7 rounded-lg bg-sky-50 flex items-center justify-center">
              <Bell className="size-3.5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm text-zinc-900">Email Notifications</h2>
              <p className="text-xs text-zinc-400">Choose which emails you receive from ScholarMatch</p>
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
              <label key={key} className="flex items-start gap-4 cursor-pointer group">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => { setNotifPrefs((p) => ({ ...p, [key]: !p[key] })); setDirty(true); setSaved(false); }}
                  className={`mt-0.5 w-10 h-6 rounded-full transition-colors relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${notifPrefs[key] ? "bg-blue-600" : "bg-zinc-200"}`}
                  aria-checked={notifPrefs[key]}
                  role="switch"
                  aria-label={label}
                >
                  <span className={`absolute top-1 size-4 bg-white rounded-full shadow transition-all ${notifPrefs[key] ? "left-5" : "left-1"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 leading-none">{label}</p>
                  <p className="text-xs text-zinc-400 mt-1">{desc}</p>
                </div>
              </label>
            ))}
            <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-50">
              Transactional emails (password reset, account security) are always sent.
            </p>
          </div>
        </div>

        {/* Completeness checklist */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="size-4 text-rose-400 flex-shrink-0" />
            <h2 className="text-sm text-zinc-900">Profile completeness</h2>
            <span className="ml-auto text-xs font-bold text-blue-600">{completionPct}%</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {weightedFields.map((f) => (
              <div key={f.label} className={["flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium",
                f.value ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-400"
              ].join(" ")}>
                <div className={["size-3.5 rounded-full flex items-center justify-center flex-shrink-0",
                  f.value ? "bg-emerald-500" : "border-2 border-zinc-300"
                ].join(" ")}>
                  {f.value && <Check className="size-2 text-white" strokeWidth={3} />}
                </div>
                {f.label}
                <span className="ml-auto text-[10px] opacity-60">+{f.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pb-4">
          <button type="submit" disabled={saving || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all">
            {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

      </div>
    </form>
  );
}
