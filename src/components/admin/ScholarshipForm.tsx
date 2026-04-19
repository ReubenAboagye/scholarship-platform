"use client";

import { useState } from "react";
import { Loader2, Save, ArrowLeft, Info } from "lucide-react";

const COUNTRIES   = ["UK", "USA", "Germany", "Canada"];
const FUNDING     = ["Full", "Partial", "Tuition Only", "Living Allowance"];
const DEGREES     = ["Undergraduate", "Masters", "PhD", "Any"];

interface Props {
  initial?: any;
  onSaved: () => void;
  onCancel: () => void;
}

const inp = "w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-3 border-b border-slate-100 mb-4">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function ScholarshipForm({ initial, onSaved, onCancel }: Props) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    // Core
    name:                  initial?.name                  ?? "",
    provider:              initial?.provider              ?? "",
    country:               initial?.country               ?? "UK",
    funding_type:          initial?.funding_type          ?? "Full",
    funding_amount:        initial?.funding_amount        ?? "",
    description:           initial?.description           ?? "",
    application_url:       initial?.application_url       ?? "",
    application_deadline:  initial?.application_deadline  ?? "",
    degree_levels:         (initial?.degree_levels  as string[]) ?? [],
    fields_of_study:       (initial?.fields_of_study as string[])?.join(", ")  ?? "",
    eligibility_criteria:  (initial?.eligibility_criteria as string[])?.join("\n") ?? "",
    // Structured eligibility (powers the matching engine hard-gates)
    citizenship_required:  (initial?.citizenship_required as string[])?.join(", ") ?? "",
    open_to_international: initial?.open_to_international ?? true,
    min_gpa:               initial?.min_gpa?.toString()   ?? "",
    renewable:             initial?.renewable             ?? false,
    effort_minutes:        initial?.effort_minutes?.toString() ?? "",
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
      // Structured eligibility
      citizenship_required:  form.citizenship_required.split(",").map((s) => s.trim()).filter(Boolean),
      open_to_international: form.open_to_international,
      min_gpa:               form.min_gpa ? parseFloat(form.min_gpa) : null,
      renewable:             form.renewable,
      effort_minutes:        form.effort_minutes ? parseInt(form.effort_minutes) : null,
      is_active:             true,
    };

    const endpoint = initial?.id ? `/api/scholarships/${initial.id}` : "/api/scholarships";
    const method   = initial?.id ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) { setError(result?.error ?? "Unable to save scholarship."); setSaving(false); return; }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-2xl text-slate-900">{initial ? "Edit Scholarship" : "Add Scholarship"}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{initial ? "Update scholarship details." : "Add a new scholarship to the platform."}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Core details ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <SectionHeader title="Core Details" subtitle="Basic scholarship information" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Scholarship Name *</label>
                <input className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chevening Scholarship" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Provider / Organisation *</label>
                <input className={inp} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. UK FCDO" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Country *</label>
                <select className={inp} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Funding Type *</label>
                <select className={inp} value={form.funding_type} onChange={(e) => setForm({ ...form, funding_type: e.target.value })}>
                  {FUNDING.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Funding Amount</label>
                <input className={inp} value={form.funding_amount} onChange={(e) => setForm({ ...form, funding_amount: e.target.value })} placeholder="e.g. Full tuition + £1,200/month" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description *</label>
              <textarea rows={3} className={inp + " resize-none"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Application URL *</label>
                <input type="url" className={inp} value={form.application_url} onChange={(e) => setForm({ ...form, application_url: e.target.value })} placeholder="https://…" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Application Deadline</label>
                <input type="date" className={inp} value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Eligibility & degrees ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <SectionHeader title="Eligibility & Degrees" subtitle="Who can apply — used for hard-gate matching" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Degree Levels</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Fields of Study <span className="normal-case font-normal text-slate-400">(comma-separated)</span></label>
              <input className={inp} value={form.fields_of_study} onChange={(e) => setForm({ ...form, fields_of_study: e.target.value })} placeholder="e.g. Engineering, Medicine, Any" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Eligibility Criteria <span className="normal-case font-normal text-slate-400">(one per line)</span></label>
              <textarea rows={4} className={inp + " resize-none"} value={form.eligibility_criteria}
                onChange={(e) => setForm({ ...form, eligibility_criteria: e.target.value })}
                placeholder={"Must be a citizen of a Commonwealth country\nHold a Bachelor's degree\nAge under 35"} />
            </div>
          </div>
        </div>

        {/* ── Structured eligibility (matching engine) ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <SectionHeader
            title="Matching Engine Settings"
            subtitle="Structured fields used for AI hard-gate filtering — keep accurate for best match quality"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Citizenship Restriction
                  <span title="Leave empty if open to all. Comma-separated list of nationalities required, e.g. &quot;African, non-Canadian&quot;.">
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  </span>
                </label>
                <input className={inp} value={form.citizenship_required}
                  onChange={(e) => setForm({ ...form, citizenship_required: e.target.value })}
                  placeholder="e.g. African, Commonwealth — leave blank if open to all" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Minimum GPA <span className="normal-case font-normal text-slate-400">(0–4 scale)</span>
                </label>
                <input type="number" step="0.1" min="0" max="4" className={inp}
                  value={form.min_gpa} onChange={(e) => setForm({ ...form, min_gpa: e.target.value })} placeholder="e.g. 3.5 — leave blank if no requirement" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Effort Estimate <span className="normal-case font-normal text-slate-400">(minutes)</span>
                </label>
                <input type="number" min="1" max="600" className={inp}
                  value={form.effort_minutes} onChange={(e) => setForm({ ...form, effort_minutes: e.target.value })} placeholder="e.g. 120 — estimated time to complete" />
              </div>
            </div>
            {/* Boolean toggles */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <button type="button" onClick={() => setForm((p) => ({ ...p, open_to_international: !p.open_to_international }))}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.open_to_international ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.open_to_international ? "left-5" : "left-1"}`} />
                </button>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Open to international students</p>
                  <p className="text-[11px] text-slate-400">Students studying abroad can apply</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <button type="button" onClick={() => setForm((p) => ({ ...p, renewable: !p.renewable }))}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.renewable ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.renewable ? "left-5" : "left-1"}`} />
                </button>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Renewable scholarship</p>
                  <p className="text-[11px] text-slate-400">Can be renewed for subsequent years</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : initial ? "Update Scholarship" : "Add Scholarship"}
          </button>
        </div>

      </form>
    </div>
  );
}
