"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle } from "lucide-react";

const DEGREE_LEVELS = ["Undergraduate", "Masters", "PhD", "Any"];
const FIELDS = [
  "Engineering", "Computer Science", "Medicine", "Law", "Business & Management",
  "Economics", "Social Sciences", "Natural Sciences", "Education", "Agriculture",
  "Public Health", "Environmental Studies", "Arts & Humanities", "Architecture",
  "Mathematics", "Psychology", "Political Science", "Public Policy", "Other",
];

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [form, setForm] = useState({
    full_name: "", country_of_origin: "", field_of_study: "",
    degree_level: "", gpa: "", bio: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setForm({
        full_name:        data.full_name        || "",
        country_of_origin: data.country_of_origin || "",
        field_of_study:   data.field_of_study   || "",
        degree_level:     data.degree_level     || "",
        gpa:              data.gpa?.toString()  || "",
        bio:              data.bio              || "",
      });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({
      full_name:         form.full_name || null,
      country_of_origin: form.country_of_origin || null,
      field_of_study:    form.field_of_study || null,
      degree_level:      form.degree_level || null,
      gpa:               form.gpa ? parseFloat(form.gpa) : null,
      bio:               form.bio || null,
    }).eq("id", user!.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  const completionFields = [form.full_name, form.country_of_origin, form.field_of_study, form.degree_level];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-black text-3xl text-slate-900">Your Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Complete your profile to improve AI scholarship matching accuracy.</p>
      </div>

      {/* Completion bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Profile completion</span>
          <span className="text-sm font-bold text-blue-600">{completionPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {completionPct < 100 && (
          <p className="text-xs text-slate-400 mt-2">Add all fields to unlock the most accurate AI matching.</p>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country of Origin</label>
            <input
              type="text"
              value={form.country_of_origin}
              onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
              placeholder="e.g. Ghana, Nigeria, Kenya"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Field of Study</label>
            <select
              value={form.field_of_study}
              onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
            >
              <option value="">Select your field</option>
              {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Degree Level</label>
            <select
              value={form.degree_level}
              onChange={(e) => setForm({ ...form, degree_level: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
            >
              <option value="">Select degree level</option>
              {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">GPA / Academic Score <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            type="number"
            step="0.01" min="0" max="4"
            value={form.gpa}
            onChange={(e) => setForm({ ...form, gpa: e.target.value })}
            className="w-full sm:w-40 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
            placeholder="e.g. 3.7"
          />
          <p className="text-xs text-slate-400 mt-1">Enter on a 4.0 scale. Used to match merit-based scholarships.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Academic Background <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none"
            placeholder="Briefly describe your academic background, interests, and goals. This helps the AI find better matches."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Saved successfully
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
