"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, ArrowLeft } from "lucide-react";

const COUNTRIES   = ["UK", "USA", "Germany", "Canada"];
const FUNDING     = ["Full", "Partial", "Tuition Only", "Living Allowance"];
const DEGREES     = ["Undergraduate", "Masters", "PhD", "Any"];

interface Props {
  initial?: any;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ScholarshipForm({ initial, onSaved, onCancel }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    name:                  initial?.name                  || "",
    provider:              initial?.provider              || "",
    country:               initial?.country               || "UK",
    funding_type:          initial?.funding_type          || "Full",
    funding_amount:        initial?.funding_amount        || "",
    description:           initial?.description           || "",
    application_url:       initial?.application_url       || "",
    application_deadline:  initial?.application_deadline  || "",
    degree_levels:         (initial?.degree_levels as string[]) || [],
    fields_of_study:       (initial?.fields_of_study as string[])?.join(", ") || "",
    eligibility_criteria:  (initial?.eligibility_criteria as string[])?.join("\n") || "",
  });

  function toggleDegree(d: string) {
    setForm((prev) => ({
      ...prev,
      degree_levels: prev.degree_levels.includes(d)
        ? prev.degree_levels.filter((x) => x !== d)
        : [...prev.degree_levels, d],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.provider || !form.description || !form.application_url) {
      setError("Please fill in all required fields."); return;
    }
    setSaving(true); setError(null);

    const payload = {
      name:                  form.name,
      provider:              form.provider,
      country:               form.country,
      funding_type:          form.funding_type,
      funding_amount:        form.funding_amount,
      description:           form.description,
      application_url:       form.application_url,
      application_deadline:  form.application_deadline || null,
      degree_levels:         form.degree_levels,
      fields_of_study:       form.fields_of_study.split(",").map((s) => s.trim()).filter(Boolean),
      eligibility_criteria:  form.eligibility_criteria.split("\n").map((s) => s.trim()).filter(Boolean),
      is_active:             true,
    };

    if (initial?.id) {
      const { error } = await supabase.from("scholarships").update(payload).eq("id", initial.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("scholarships").insert(payload);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
  }

  const inp = "w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-3xl text-slate-900">{initial ? "Edit Scholarship" : "Add Scholarship"}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{initial ? "Update scholarship details." : "Add a new scholarship to the platform."}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}

      <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Scholarship Name *</label>
            <input className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chevening Scholarship" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider / Organisation *</label>
            <input className={inp} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. UK FCDO" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country *</label>
            <select className={inp + " bg-white"} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Funding Type *</label>
            <select className={inp + " bg-white"} value={form.funding_type} onChange={(e) => setForm({ ...form, funding_type: e.target.value })}>
              {FUNDING.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Funding Amount</label>
            <input className={inp} value={form.funding_amount} onChange={(e) => setForm({ ...form, funding_amount: e.target.value })} placeholder="e.g. Full tuition + £1,200/month" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
          <textarea rows={3} className={inp + " resize-none"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Application URL *</label>
            <input type="url" className={inp} value={form.application_url} onChange={(e) => setForm({ ...form, application_url: e.target.value })} placeholder="https://…" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Application Deadline</label>
            <input type="date" className={inp} value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Degree Levels</label>
          <div className="flex flex-wrap gap-2">
            {DEGREES.map((d) => (
              <button type="button" key={d} onClick={() => toggleDegree(d)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  form.degree_levels.includes(d)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-slate-200 text-slate-600 hover:border-blue-300"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fields of Study <span className="text-slate-400 font-normal">(comma-separated)</span></label>
          <input className={inp} value={form.fields_of_study} onChange={(e) => setForm({ ...form, fields_of_study: e.target.value })} placeholder="e.g. Engineering, Medicine, Any" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Eligibility Criteria <span className="text-slate-400 font-normal">(one per line)</span></label>
          <textarea rows={4} className={inp + " resize-none"} value={form.eligibility_criteria} onChange={(e) => setForm({ ...form, eligibility_criteria: e.target.value })} placeholder={"Must be a citizen of a Commonwealth country\nHold a Bachelor's degree\nAge under 35"} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : initial ? "Update Scholarship" : "Add Scholarship"}
          </button>
        </div>
      </form>
    </div>
  );
}
