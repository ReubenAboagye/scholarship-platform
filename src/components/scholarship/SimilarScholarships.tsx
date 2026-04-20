import { ArrowRight } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// SimilarScholarships — quiet sidebar list of related awards.
// Renders inside the right column of the detail page.
// ─────────────────────────────────────────────────────────────

interface ScholarshipSummary {
  id: string;
  name: string;
  slug: string;
  country: string;
  funding_type: string;
}

export default function SimilarScholarships({
  scholarships,
}: {
  scholarships: ScholarshipSummary[];
}) {
  if (!scholarships || scholarships.length === 0) return null;

  return (
    <section aria-labelledby="similar-heading">
      <h3
        id="similar-heading"
        className="text-sm font-semibold text-slate-900 mb-3"
      >
        Similar scholarships
      </h3>

      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
        {scholarships.map((s) => (
          <li key={s.id}>
            <a
              href={`/dashboard/scholarships/${s.slug || s.id}`}
              className="group flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition-colors"
            >
              {countryFlagUrl(s.country) ? (
                <img
                  src={countryFlagUrl(s.country)!}
                  alt=""
                  className="w-6 h-4 object-cover rounded-sm border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-6 h-4 bg-slate-100 rounded-sm shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                  {s.name}
                </p>
                <p className="text-xs text-slate-500">
                  {s.country} · {s.funding_type}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
