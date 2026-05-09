"use client";

import { useState, useMemo } from "react";
import {
  Loader2, Save, ArrowLeft, Info, AlertCircle, X,
  Eye, EyeOff, Award, ShieldCheck, Calendar, Link2,
  GraduationCap, DollarSign, FileText,
  Globe, Sparkles, Search, ChevronDown,
} from "lucide-react";
import CountrySelect from "@/components/ui/CountrySelect";
import { STUDY_FIELD_OPTIONS } from "@/lib/constants/study-fields";
import { useToast } from "@/components/admin/ToastProvider";

const FUNDING = ["Full", "Partial", "Tuition Only", "Living Allowance"];
const DEGREES = ["Undergraduate", "Masters", "PhD", "Any"];
const FIELD_SUGGESTIONS = STUDY_FIELD_OPTIONS.map((field) => field.name);

interface Props {
  initial?: any;
  onSaved: () => void;
  onCancel: () => void;
}

const inpBase = "w-full px-3.5 py-2.5 rounded-lg border outline-none text-sm transition-all bg-white";
const inpOk = "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";
const inpErr = "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 bg-red-50/30";

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ComponentType<{className?: string}> }) {
  return (
    <div className="pb-4 border-b border-slate-100 mb-6">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-blue-600" />}
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">{title}</h2>
      </div>
      {subtitle && <p className="text-[11px] font-normal text-slate-400 mt-1 ml-6">{subtitle}</p>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-600 font-medium">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  icon?: React.ComponentType<{className?: string}>;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border transition-all ${
        checked
          ? "border-blue-200 bg-blue-50/40"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`w-3.5 h-3.5 ${checked ? "text-blue-600" : "text-slate-400"}`} />}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-800">{label}</p>
        </div>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
    </button>
  );
}

function parseFieldList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function ScholarshipForm({ initial, onSaved, onCancel }: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [studySearch, setStudySearch] = useState("");
  const [studyOpen, setStudyOpen] = useState(false);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    provider: initial?.provider ?? "",
    country: initial?.country ?? "UK",
    funding_type: initial?.funding_type ?? "Full",
    funding_amount: initial?.funding_amount ?? "",
    description: initial?.description ?? "",
    application_url: initial?.application_url ?? "",
    application_deadline: initial?.application_deadline ?? "",
    degree_levels: (initial?.degree_levels as string[]) ?? [],
    fields_of_study: (initial?.fields_of_study as string[])?.join(", ") ?? "",
    eligibility_criteria: (initial?.eligibility_criteria as string[])?.join("\n") ?? "",
    citizenship_required: (initial?.citizenship_required as string[])?.join(", ") ?? "",
    open_to_international: initial?.open_to_international ?? true,
    min_gpa: initial?.min_gpa?.toString() ?? "",
    renewable: initial?.renewable ?? false,
    effort_minutes: initial?.effort_minutes?.toString() ?? "",
    is_active: initial?.is_active ?? true,
    verified: !!initial?.verified_at,
  });

  function markTouched(key: string) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function fieldClass(key: string, extra = "") {
    const hasErr = touched[key] && (fieldErrors[key] || liveErrors[key]);
    return `${inpBase} ${hasErr ? inpErr : inpOk} ${extra}`.trim();
  }

  const selectedFields = useMemo(() => parseFieldList(form.fields_of_study), [form.fields_of_study]);

  const filteredFieldSuggestions = useMemo(() => {
    const term = studySearch.trim().toLowerCase();
    if (!term) return FIELD_SUGGESTIONS;
    return FIELD_SUGGESTIONS.filter((f) => f.toLowerCase().includes(term));
  }, [studySearch]);

  function validate(fields = form) {
    const errs: Record<string, string> = {};
    if (!fields.name.trim()) errs.name = "Scholarship name is required";
    if (!fields.provider.trim()) errs.provider = "Provider is required";
    if (!fields.description.trim()) errs.description = "Description is required";
    if (!fields.application_url.trim()) errs.application_url = "Application URL is required";
    else {
      try {
        new URL(fields.application_url);
      } catch {
        errs.application_url = "Enter a valid URL";
      }
    }
    if (fields.degree_levels.length === 0) errs.degree_levels = "Select at least one degree level";
    if (fields.min_gpa) {
      const gpa = parseFloat(fields.min_gpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 4) errs.min_gpa = "GPA must be between 0 and 4";
    }
    if (fields.effort_minutes) {
      const min = parseInt(fields.effort_minutes);
      if (isNaN(min) || min < 1 || min > 600) errs.effort_minutes = "Must be between 1 and 600 minutes";
    }
    return errs;
  }

  const liveErrors = validate();

  const completion = useMemo(() => {
    const fields = [
      form.name,
      form.provider,
      form.country,
      form.funding_type,
      form.funding_amount,
      form.description,
      form.application_url,
      form.application_deadline,
      form.degree_levels.length > 0,
      form.fields_of_study,
      form.eligibility_criteria,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  function toggleDegree(d: string) {
    setForm((prev) => ({
      ...prev,
      degree_levels: prev.degree_levels.includes(d)
        ? prev.degree_levels.filter((x) => x !== d)
        : [...prev.degree_levels, d],
    }));
  }

  function addField(fieldName: string) {
    setForm((prev) => {
      const current = parseFieldList(prev.fields_of_study);
      if (current.includes(fieldName)) return prev;
      return { ...prev, fields_of_study: [...current, fieldName].join(", ") };
    });
  }

  function removeField(fieldName: string) {
    setForm((prev) => {
      const current = parseFieldList(prev.fields_of_study);
      return { ...prev, fields_of_study: current.filter((f) => f !== fieldName).join(", ") };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      name: true, provider: true, description: true,
      application_url: true, degree_levels: true, min_gpa: true, effort_minutes: true,
    });
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      provider: form.provider,
      country: form.country,
      funding_type: form.funding_type,
      funding_amount: form.funding_amount,
      description: form.description,
      application_url: form.application_url,
      application_deadline: form.application_deadline || null,
      degree_levels: form.degree_levels,
      fields_of_study: parseFieldList(form.fields_of_study),
      eligibility_criteria: form.eligibility_criteria.split("\n").map((s) => s.trim()).filter(Boolean),
      citizenship_required: form.citizenship_required.split(",").map((s) => s.trim()).filter(Boolean),
      open_to_international: form.open_to_international,
      min_gpa: form.min_gpa ? parseFloat(form.min_gpa) : null,
      renewable: form.renewable,
      effort_minutes: form.effort_minutes ? parseInt(form.effort_minutes) : null,
      is_active: form.is_active,
      verified_at: form.verified
        ? (initial?.verified_at ?? new Date().toISOString())
        : null,
    };

    const endpoint = initial?.id ? `/api/scholarships/${initial.id}` : "/api/scholarships";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      setError(result?.error ?? "Unable to save scholarship.");
      setSaving(false);
      return;
    }

    toast.addToast(initial ? "Scholarship updated" : "Scholarship created", "success");
    setSaving(false);
    onSaved();
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 max-lg:pb-24">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onCancel} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">
            {initial ? "Edit Scholarship" : "New Scholarship"}
          </h1>
          <p className="text-slate-400 text-[11px] font-medium uppercase tracking-widest mt-0.5">
            {initial ? "Update existing record" : "Create a new scholarship listing"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSave} className="flex-1 min-w-0 space-y-6">

          {/* Status & Visibility */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <SectionHeader
              title="Status & Visibility"
              subtitle="Control how this scholarship appears"
              icon={Eye}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Toggle
                checked={form.is_active}
                onChange={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                label="Published"
                description="Visible to students on the platform"
                icon={form.is_active ? Eye : EyeOff}
              />
              <Toggle
                checked={form.verified}
                onChange={() => setForm((p) => ({ ...p, verified: !p.verified }))}
                label="Verified"
                description="Admin has confirmed details are accurate"
                icon={ShieldCheck}
              />
            </div>
          </section>

          {/* Basic Information */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <SectionHeader title="Basic Information" subtitle="Name, provider, and country" icon={FileText} />
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                  Scholarship Name <span className="text-red-400">*</span>
                </label>
                <input
                  className={fieldClass("name")}
                  value={form.name}
                  onBlur={() => markTouched("name")}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Chevening Scholarship"
                />
                <FieldError msg={touched.name ? fieldErrors.name || liveErrors.name : undefined} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Provider <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={fieldClass("provider")}
                    value={form.provider}
                    onBlur={() => markTouched("provider")}
                    onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="e.g. UK FCDO"
                  />
                  <FieldError msg={touched.provider ? fieldErrors.provider || liveErrors.provider : undefined} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <CountrySelect value={form.country} onChange={(v) => setForm(prev => ({ ...prev, country: v }))} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  className={fieldClass("description", "resize-none")}
                  value={form.description}
                  onBlur={() => markTouched("description")}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the scholarship, its mission, and what it covers..."
                />
                <FieldError msg={touched.description ? fieldErrors.description || liveErrors.description : undefined} />
                <p className="text-[11px] text-slate-400 mt-1.5">{form.description.length} characters · Used for AI matching</p>
              </div>
            </div>
          </section>

          {/* Funding & Application */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <SectionHeader title="Funding & Application" subtitle="Financial details and how to apply" icon={DollarSign} />
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Funding Type <span className="text-red-400">*</span>
                  </label>
                  <select className={fieldClass("funding_type")} value={form.funding_type} onChange={(e) => setForm(prev => ({ ...prev, funding_type: e.target.value }))}>
                    {FUNDING.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">Funding Amount</label>
                  <input className={fieldClass("funding_amount")} value={form.funding_amount} onChange={(e) => setForm(prev => ({ ...prev, funding_amount: e.target.value }))} placeholder="e.g. Full tuition + £1,200/month" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Application URL <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      className={fieldClass("application_url", "pl-10")}
                      value={form.application_url}
                      onBlur={() => markTouched("application_url")}
                      onChange={(e) => setForm(prev => ({ ...prev, application_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <FieldError msg={touched.application_url ? fieldErrors.application_url || liveErrors.application_url : undefined} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">Application Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      className={fieldClass("application_deadline", "pl-10")}
                      value={form.application_deadline}
                      onChange={(e) => setForm(prev => ({ ...prev, application_deadline: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Eligibility & Degrees */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <SectionHeader title="Eligibility & Degrees" subtitle="Who can apply — used for AI matching" icon={GraduationCap} />
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-3 uppercase tracking-widest">
                  Degree Levels <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEGREES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDegree(d)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                        form.degree_levels.includes(d)
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <FieldError msg={touched.degree_levels ? fieldErrors.degree_levels || liveErrors.degree_levels : undefined} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">Fields of Study</label>
                <input
                  className={fieldClass("fields_of_study")}
                  value={form.fields_of_study}
                  onChange={(e) => setForm(prev => ({ ...prev, fields_of_study: e.target.value }))}
                  placeholder="e.g. Engineering, Medicine, Any"
                />
                {selectedFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedFields.map((field) => (
                      <span key={field} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                        {field}
                        <button type="button" onClick={() => removeField(field)} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mt-3">
                  <button
                    type="button"
                    onClick={() => setStudyOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Browse suggested fields
                    <ChevronDown className={`w-3 h-3 transition-transform ${studyOpen ? "rotate-180" : ""}`} />
                  </button>
                  {studyOpen && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={studySearch}
                          onChange={(e) => setStudySearch(e.target.value)}
                          placeholder="Search fields..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {filteredFieldSuggestions.map((fieldName) => {
                          const active = selectedFields.includes(fieldName);
                          return (
                            <button
                              key={fieldName}
                              type="button"
                              onClick={() => addField(fieldName)}
                              disabled={active}
                              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                                active
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                              }`}
                            >
                              {fieldName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Recognized canonical fields improve taxonomy-based match quality.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                  Eligibility Criteria <span className="normal-case font-normal text-slate-400">(one per line)</span>
                </label>
                <textarea
                  rows={4}
                  className={fieldClass("eligibility_criteria", "resize-none")}
                  value={form.eligibility_criteria}
                  onChange={(e) => setForm(prev => ({ ...prev, eligibility_criteria: e.target.value }))}
                  placeholder={"Must be a citizen of a Commonwealth country\nHold a Bachelor's degree\nAge under 35"}
                />
              </div>
            </div>
          </section>

          {/* Matching Engine */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <SectionHeader title="Matching Engine" subtitle="Hard-gate filters for AI matching" icon={Sparkles} />
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Citizenship Restriction
                    <span title="Leave empty if open to all">
                      <Info className="w-3 h-3 text-slate-400 cursor-help" />
                    </span>
                  </label>
                  <input
                    className={fieldClass("citizenship_required")}
                    value={form.citizenship_required}
                    onChange={(e) => setForm(prev => ({ ...prev, citizenship_required: e.target.value }))}
                    placeholder="e.g. African, Commonwealth"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Minimum GPA <span className="normal-case font-normal text-slate-400">(0–4)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    className={fieldClass("min_gpa")}
                    value={form.min_gpa}
                    onBlur={() => markTouched("min_gpa")}
                    onChange={(e) => setForm(prev => ({ ...prev, min_gpa: e.target.value }))}
                    placeholder="e.g. 3.5"
                  />
                  <FieldError msg={touched.min_gpa ? fieldErrors.min_gpa || liveErrors.min_gpa : undefined} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-widest">
                    Effort <span className="normal-case font-normal text-slate-400">(minutes)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    className={fieldClass("effort_minutes")}
                    value={form.effort_minutes}
                    onBlur={() => markTouched("effort_minutes")}
                    onChange={(e) => setForm(prev => ({ ...prev, effort_minutes: e.target.value }))}
                    placeholder="e.g. 120"
                  />
                  <FieldError msg={touched.effort_minutes ? fieldErrors.effort_minutes || liveErrors.effort_minutes : undefined} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Toggle
                  checked={form.open_to_international}
                  onChange={() => setForm((p) => ({ ...p, open_to_international: !p.open_to_international }))}
                  label="Open to international"
                  description="Students studying abroad can apply"
                  icon={Globe}
                />
                <Toggle
                  checked={form.renewable}
                  onChange={() => setForm((p) => ({ ...p, renewable: !p.renewable }))}
                  label="Renewable"
                  description="Can be renewed for subsequent years"
                  icon={Award}
                />
              </div>
            </div>
          </section>

        </form>

        {/* ── Sticky Sidebar ── */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Completion Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Completion</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={completion === 100 ? "#10b981" : "#3b82f6"}
                      strokeWidth="3"
                      strokeDasharray={`${completion * 0.94} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    {completion}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {completion === 100 ? "Ready to publish" : "Keep going"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {completion === 100 ? "All required fields filled" : "Fill required fields to publish"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Status Preview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Visibility</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${form.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {form.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {form.is_active ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Verification</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${form.verified ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {form.verified ? <ShieldCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {form.verified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <button
                type="submit"
                disabled={saving}
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-60 text-white font-semibold uppercase tracking-widest rounded-lg text-xs transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving…" : initial ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:hidden z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-60 text-white font-semibold uppercase tracking-widest rounded-lg text-xs transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : initial ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
