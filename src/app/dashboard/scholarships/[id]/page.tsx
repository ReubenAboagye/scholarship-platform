import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { countryFlagUrl } from "@/lib/utils";
import {
  ArrowLeft, ExternalLink, Calendar, MapPin, GraduationCap,
  Building2, Share2, Trophy, CheckCircle2,
} from "lucide-react";
import SaveButton from "@/components/scholarship/SaveButton";
import TrackButton from "@/components/scholarship/TrackButton";
import EligibilityChecklist, { EligibilityRow } from "@/components/scholarship/EligibilityChecklist";
import EligibilityStatus from "@/components/scholarship/EligibilityStatus";
import DeadlineCountdown from "@/components/scholarship/DeadlineCountdown";
import ScholarshipStickyBar from "@/components/scholarship/ScholarshipStickyBar";
import SimilarScholarships from "@/components/scholarship/SimilarScholarships";

// ─────────────────────────────────────────────────────────────
// Scholarship detail page — redesigned for clarity and trust.
// Government-portal aesthetic: single surface, muted colour,
// colour used only to communicate status (eligibility match,
// deadline urgency) or the primary Apply action.
// ─────────────────────────────────────────────────────────────

export default async function DashboardScholarshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: scholarship } = isUuid
    ? await supabase.from("scholarships").select("*").eq("id", id).single()
    : await supabase.from("scholarships").select("*").eq("slug", id).single();

  if (!scholarship) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const [profileResult, savedResult, trackedResult] = user
    ? await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("saved_scholarships").select("id")
          .eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
        supabase.from("application_tracker").select("status")
          .eq("user_id", user.id).eq("scholarship_id", scholarship.id).single(),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const profile = profileResult.data;
  const saved = savedResult.data;
  const tracked = trackedResult.data;

  // Similar scholarships via vector neighbours — up to 3 after filtering self
  const { data: similarRaw } = scholarship.embedding
    ? await supabase.rpc("match_scholarships_gated", {
        query_embedding: scholarship.embedding,
        match_count: 4,
      })
    : { data: [] };
  const similar = (similarRaw as any[])?.filter((s) => s.id !== scholarship.id).slice(0, 3) || [];

  const isPast = scholarship.application_deadline
    && new Date(scholarship.application_deadline) < new Date();

  // ── Build eligibility rows + overall status ──────────────
  const rows: EligibilityRow[] = [];
  const unmetReasons: string[] = [];
  const missingProfileFields: string[] = [];

  // Degree
  const degreeReq = scholarship.degree_levels?.length
    ? scholarship.degree_levels.join(", ")
    : "Any";
  const degreeAllowsAny =
    !scholarship.degree_levels?.length
    || scholarship.degree_levels.includes("Any");
  if (profile?.degree_level) {
    const degreeMet = degreeAllowsAny
      || scholarship.degree_levels.includes(profile.degree_level);
    rows.push({
      label: "Degree level",
      requirement: degreeReq,
      userValue: profile.degree_level,
      status: degreeMet ? "met" : "unmet",
    });
    if (!degreeMet) unmetReasons.push(`Requires ${degreeReq}, you have ${profile.degree_level}`);
  } else {
    rows.push({
      label: "Degree level",
      requirement: degreeReq,
      userValue: null,
      status: "unknown",
    });
    if (profile) missingProfileFields.push("degree level");
  }

  // GPA — only include the row if the scholarship actually requires one
  if (scholarship.min_gpa) {
    if (profile?.gpa != null) {
      const gpaMet = profile.gpa >= scholarship.min_gpa;
      rows.push({
        label: "Minimum GPA",
        requirement: String(scholarship.min_gpa),
        userValue: profile.gpa,
        status: gpaMet ? "met" : "unmet",
      });
      if (!gpaMet) unmetReasons.push(
        `Requires GPA ≥ ${scholarship.min_gpa}, yours is ${profile.gpa}`
      );
    } else {
      rows.push({
        label: "Minimum GPA",
        requirement: String(scholarship.min_gpa),
        userValue: null,
        status: "unknown",
      });
      if (profile) missingProfileFields.push("GPA");
    }
  }

  // Citizenship — only include if restricted
  if (scholarship.citizenship_required?.length) {
    const reqStr = scholarship.citizenship_required.join(", ");
    if (profile?.citizenship) {
      const citMet = scholarship.citizenship_required.some((c: string) =>
        profile.citizenship.toLowerCase().includes(c.toLowerCase())
      );
      rows.push({
        label: "Citizenship",
        requirement: reqStr,
        userValue: profile.citizenship,
        status: citMet ? "met" : "unmet",
      });
      if (!citMet) unmetReasons.push(`Requires ${reqStr}`);
    } else {
      rows.push({
        label: "Citizenship",
        requirement: reqStr,
        userValue: null,
        status: "unknown",
      });
      if (profile) missingProfileFields.push("citizenship");
    }
  }

  // Field of study — always informational (soft match)
  if (scholarship.fields_of_study?.length
      && !scholarship.fields_of_study.includes("Any")) {
    rows.push({
      label: "Field of study",
      requirement: scholarship.fields_of_study.slice(0, 3).join(", ")
        + (scholarship.fields_of_study.length > 3 ? "…" : ""),
      userValue: profile?.field_of_study ?? null,
      status: profile?.field_of_study
        ? (scholarship.fields_of_study.some((f: string) =>
            f.toLowerCase().includes(profile.field_of_study.toLowerCase())
            || profile.field_of_study.toLowerCase().includes(f.toLowerCase())
          ) ? "met" : "unmet")
        : "unknown",
    });
  }

  const eligState: "eligible" | "not_eligible" | "unknown" =
    !profile ? "unknown"
    : rows.every((r) => r.status === "met") ? "eligible"
    : rows.some((r) => r.status === "unmet") ? "not_eligible"
    : "unknown";

  return (
    <>
      <ScholarshipStickyBar
        name={scholarship.name}
        country={scholarship.country}
        deadline={scholarship.application_deadline}
        applicationUrl={scholarship.application_url}
        isPast={!!isPast}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">

        {/* ── Breadcrumb + hero-level actions ────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/scholarships"
              aria-label="Back to scholarships"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
              <a href="/dashboard" className="hover:text-slate-900 hover:underline">Dashboard</a>
              <span className="text-slate-300">/</span>
              <a href="/dashboard/scholarships" className="hover:text-slate-900 hover:underline">Scholarships</a>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 truncate max-w-[200px]">{scholarship.name}</span>
            </nav>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <SaveButton scholarshipId={scholarship.id} userId={user.id}
                initialSaved={!!saved} variant="default" />
              <TrackButton scholarshipId={scholarship.id} userId={user.id}
                initialStatus={(tracked as any)?.status ?? null} variant="default" />
              <button
                aria-label="Share"
                className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Hero ─────────────────────────────────────────── */}
        <header className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-5 text-xs">
            {countryFlagUrl(scholarship.country) && (
              <img
                src={countryFlagUrl(scholarship.country)!}
                alt=""
                className="w-6 h-4 object-cover rounded-sm border border-slate-200"
              />
            )}
            <span className="text-slate-600 font-medium">{scholarship.country}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">{scholarship.funding_type} funding</span>
            {scholarship.verified_at && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
            {scholarship.name}
          </h1>

          <div className="flex items-center gap-2 text-slate-600 mb-6">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm">{scholarship.provider}</span>
          </div>

          {/* Key facts row */}
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, label: "Location", value: scholarship.country },
              { icon: GraduationCap, label: "Degree", value:
                  scholarship.degree_levels?.[0] === "Any"
                    ? "All levels"
                    : scholarship.degree_levels?.join(", ") || "Any" },
              { icon: Trophy, label: "Funding", value: scholarship.funding_amount },
              { icon: Calendar, label: "Deadline", value: null },
            ].map((item, i) => (
              <div key={i}>
                <dt className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {item.label === "Deadline"
                    ? <DeadlineCountdown deadline={scholarship.application_deadline} size="md" />
                    : item.value}
                </dd>
              </div>
            ))}
          </dl>
        </header>

        {/* ── Main grid: content + sidebar ─────────────────── */}
        <div className="grid lg:grid-cols-3 gap-10">

          {/* LEFT (main content) */}
          <div className="lg:col-span-2 space-y-10">

            {/* Eligibility status */}
            <section aria-labelledby="eligibility-heading" className="space-y-4">
              <h2 id="eligibility-heading" className="text-lg font-semibold text-slate-900">
                Eligibility
              </h2>
              <EligibilityStatus
                state={eligState}
                unmetCriteria={unmetReasons}
                missingFields={missingProfileFields}
              />
              {rows.length > 0 && <EligibilityChecklist rows={rows} />}
              {scholarship.eligibility_criteria?.length > 0 && (
                <details className="group">
                  <summary className="text-sm text-brand-700 hover:text-brand-800 cursor-pointer font-medium">
                    Full eligibility requirements from the provider
                  </summary>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside pl-2">
                    {scholarship.eligibility_criteria.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            {/* About */}
            <section aria-labelledby="about-heading" className="space-y-3">
              <h2 id="about-heading" className="text-lg font-semibold text-slate-900">
                About this scholarship
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {scholarship.description}
              </p>
            </section>

            {/* Fields of study (only when specific) */}
            {scholarship.fields_of_study?.length > 0
              && !(scholarship.fields_of_study.length === 1
                   && scholarship.fields_of_study[0] === "Any") && (
              <section aria-labelledby="fields-heading" className="space-y-3">
                <h2 id="fields-heading" className="text-lg font-semibold text-slate-900">
                  Eligible fields of study
                </h2>
                <div className="flex flex-wrap gap-2">
                  {scholarship.fields_of_study.map((f: string) => (
                    <span key={f}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Apply CTA */}
            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {isPast ? "Applications are closed" : "Ready to apply?"}
              </h2>
              <p className="text-sm text-slate-600 mb-5 max-w-lg">
                {isPast
                  ? "This year's application window has closed. Save this scholarship to be reminded when the next cycle opens."
                  : "Applications are handled on the official provider portal. Review the full documentation requirements before starting."}
              </p>
              <div className="flex flex-wrap gap-3">
                {!isPast && (
                  <a
                    href={scholarship.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-md hover:bg-brand-700 transition-colors text-sm"
                  >
                    Visit official portal <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {user && !saved && (
                  <SaveButton scholarshipId={scholarship.id} userId={user.id}
                    initialSaved={false} variant="default" />
                )}
              </div>
            </section>
          </div>

          {/* RIGHT (sidebar) */}
          <aside className="lg:col-span-1 space-y-8">

            {/* Award breakdown */}
            <section aria-labelledby="award-heading">
              <h3 id="award-heading" className="text-sm font-semibold text-slate-900 mb-3">
                Award details
              </h3>
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Total value</p>
                  <p className="text-base font-semibold text-slate-900 leading-snug">
                    {scholarship.funding_amount}
                  </p>
                </div>
                <dl className="divide-y divide-slate-100 text-sm">
                  {[
                    { label: "Funding type", value: scholarship.funding_type },
                    { label: "Renewable", value: scholarship.renewable ? "Yes" : "No" },
                    { label: "Est. time to apply",
                      value: scholarship.effort_minutes
                        ? `${scholarship.effort_minutes} min`
                        : "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-slate-500">{item.label}</dt>
                      <dd className="text-slate-900 font-medium">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <SimilarScholarships scholarships={similar} />

            {/* Verification note */}
            {scholarship.verified_at && (
              <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-4">
                Scholarship details verified on{" "}
                <time dateTime={scholarship.verified_at}>
                  {new Date(scholarship.verified_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </time>
                . Always confirm requirements on the official provider portal before applying.
              </p>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
