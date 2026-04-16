"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Camera, Sparkles, User, BookOpen, Globe, Star } from "lucide-react";

const DEGREE_LEVELS = ["Undergraduate", "Masters", "PhD", "Any"];
const FIELDS = [
  "Architecture", "Agriculture", "Arts & Humanities", "Business & Management",
  "Computer Science", "Economics", "Education", "Engineering", "Environmental Studies",
  "Law", "Mathematics", "Medicine", "Political Science", "Psychology",
  "Public Health", "Public Policy", "Social Sciences", "Natural Sciences", "Other",
];

const inp = [
  "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-800",
  "border-slate-200 hover:border-slate-300",
  "focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100",
  "transition-all placeholder:text-slate-400",
].join(" ");

export default function ProfilePage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [email,    setEmail]    = useState("");
  const [form, setForm] = useState({
    full_name: "", country_of_origin: "", field_of_study: "",
    degree_level: "", gpa: "", bio: "",
  });

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setForm({
        full_name:         data.full_name         ?? "",
        country_of_origin: data.country_of_origin ?? "",
        field_of_study:    data.field_of_study    ?? "",
        degree_level:      data.degree_level      ?? "",
        gpa:               data.gpa?.toString()   ?? "",
        bio:               data.bio               ?? "",
      });
      setLoading(false);
    }
    load();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({
      full_name:         form.full_name         || null,
      country_of_origin: form.country_of_origin || null,
      field_of_study:    form.field_of_study    || null,
      degree_level:      form.degree_level      || null,
      gpa:               form.gpa               ? parseFloat(form.gpa) : null,
      bio:               form.bio               || null,
    }).eq("id", user!.id);
    setSaving(false);
    setSaved(true);
    setDirty(false);
  }

  const completedFields = [form.full_name, form.country_of_origin, form.field_of_study, form.degree_level];
  const completedCount  = completedFields.filter(Boolean).length;
  const completionPct   = Math.round((completedCount / completedFields.length) * 100);

  const initials = form.full_name
    ? form.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?";

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="min-h-screen bg-slate-50">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900">Profile Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Manage your academic profile and personal information</p>
          </div>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all"
          >
            {saving  ? <Loader2 className="w-3 h-3 animate-spin" /> :
             saved   ? <Check   className="w-3 h-3" />              :
                       null}
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── AVATAR CARD ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400" />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-xl bg-slate-900 border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-md">
                  {initials}
                </div>
                <button type="button"
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
                  <Camera className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {/* AI matching badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700">AI Match Quality</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${completionPct}%`,
                          backgroundColor: completionPct === 100 ? "#10b981" : completionPct >= 50 ? "#3b82f6" : "#f59e0b"
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{
                      color: completionPct === 100 ? "#10b981" : completionPct >= 50 ? "#3b82f6" : "#f59e0b"
                    }}>
                      {completionPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Name + email display */}
            <div>
              <p className="font-bold text-slate-900">{form.full_name || "Your Name"}</p>
              <p className="text-sm text-slate-500">{email}</p>
              {form.field_of_study && form.degree_level && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {form.degree_level} · {form.field_of_study}
                  {form.country_of_origin ? ` · ${form.country_of_origin}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── PERSONAL INFORMATION ────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Personal Info</h2>
              <p className="text-xs text-slate-400 truncate">Your name and where you are from</p>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input className={inp} placeholder="e.g. Kofi Mensah" type="text"
                value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Country of Origin</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input className={inp + " pl-8"} placeholder="e.g. Ghana" type="text"
                  value={form.country_of_origin} onChange={(e) => update("country_of_origin", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── ACADEMIC PROFILE ────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Academic Profile</h2>
              <p className="text-xs text-slate-400 truncate">Used directly by the AI matching engine</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Field of Study</label>
                <select className={inp + " cursor-pointer"}
                  value={form.field_of_study} onChange={(e) => update("field_of_study", e.target.value)}>
                  <option value="">Select your field…</option>
                  {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Degree Level</label>
                <select className={inp + " cursor-pointer"}
                  value={form.degree_level} onChange={(e) => update("degree_level", e.target.value)}>
                  <option value="">Select level…</option>
                  {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                GPA <span className="normal-case font-normal text-slate-400">— optional</span>
              </label>
              <div className="relative w-32">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="number" step="0.01" min="0" max="4"
                  className={inp + " pl-8"} placeholder="3.7"
                  value={form.gpa} onChange={(e) => update("gpa", e.target.value)} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">On a 4.0 scale — used for merit-based matching</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Background <span className="normal-case font-normal text-slate-400">— optional</span>
              </label>
              <textarea rows={4} className={inp + " resize-none"}
                placeholder="Describe your academic background, research interests, career goals, and any achievements. The more context you provide, the better the AI can match you."
                value={form.bio} onChange={(e) => update("bio", e.target.value)} />
              <p className="text-xs text-slate-400 mt-1.5">
                {form.bio.length} / 500 characters
              </p>
            </div>
          </div>
        </div>

        {/* ── COMPLETION CHECKLIST ────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">Completeness</h2>
            <span className="ml-auto text-xs font-bold text-blue-600 whitespace-nowrap">{completionPct}%</span>
          </div>

          <div className="space-y-2">
            {[
              { label: "Full name",      done: !!form.full_name },
              { label: "Country",        done: !!form.country_of_origin },
              { label: "Field of study", done: !!form.field_of_study },
              { label: "Degree level",   done: !!form.degree_level },
            ].map((item) => (
              <div key={item.label} className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium",
                item.done
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              ].join(" ")}>
                <div className={[
                  "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                  item.done ? "bg-emerald-500" : "border-2 border-slate-300"
                ].join(" ")}>
                  {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                {item.label}
              </div>
            ))}
          </div>

          {completionPct < 100 && (
            <p className="text-xs text-slate-400 mt-3">
              Complete all 4 required fields to unlock the highest-accuracy AI scholarship matching.
            </p>
          )}
          {completionPct === 100 && (
            <p className="text-xs text-emerald-600 font-medium mt-3">
              ✓ Your profile is complete — AI matching will give you the best results.
            </p>
          )}
        </div>

        {/* Bottom save */}
        <div className="flex justify-end pb-8">
          <button type="submit" disabled={saving || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

      </div>
    </form>
  );
}
