"use client";

import { ExternalLink, Building2 } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";
import ScholarshipRow from "./ScholarshipRow";

// ─────────────────────────────────────────────────────────────
// ScholarshipTable — list view for the Browse page.
// Redesigned: single clean table, sentence-case headers, no
// uppercase micro-labels, DeadlineCountdown replaces raw date,
// Details as secondary link and Apply as primary button.
// Mobile (<lg) falls back to ScholarshipRow stack.
// ─────────────────────────────────────────────────────────────

interface Props {
  scholarships: any[];
  baseUrl?: string;
}

export default function ScholarshipTable({ scholarships, baseUrl = "/scholarships" }: Props) {
  if (!scholarships?.length) return null;

  return (
    <div className="w-full">
      {/* Mobile-tablet: simplified stack */}
      <div className="lg:hidden space-y-3">
        {scholarships.map((s, idx) => (
          <ScholarshipRow key={s.id} scholarship={s} index={idx} baseUrl={baseUrl} />
        ))}
      </div>

      {/* Desktop: data table */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-sm font-medium text-slate-600">Scholarship</th>
              <th className="px-5 py-3 text-sm font-medium text-slate-600">Country</th>
              <th className="px-5 py-3 text-sm font-medium text-slate-600">Award</th>
              <th className="px-5 py-3 text-sm font-medium text-slate-600">Deadline</th>
              <th className="px-5 py-3 text-sm font-medium text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scholarships.map((s) => {
              const href = `${baseUrl}/${s.slug || s.id}`;
              const isPast = s.application_deadline
                && new Date(s.application_deadline) < new Date();

              return (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Scholarship name + provider */}
                  <td className="px-5 py-4 align-top">
                    <a
                      href={href}
                      className="font-medium text-slate-900 hover:text-brand-700 hover:underline underline-offset-4"
                    >
                      {s.name}
                    </a>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[260px]">{s.provider}</span>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {countryFlagUrl(s.country) ? (
                        <img
                          src={countryFlagUrl(s.country)!}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded-sm border border-slate-200"
                        />
                      ) : (
                        <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />
                      )}
                      <span className="text-sm text-slate-700">{s.country}</span>
                    </div>
                  </td>

                  {/* Award */}
                  <td className="px-5 py-4 align-top">
                    <p className="text-sm font-medium text-slate-900 max-w-[220px]">
                      {s.funding_amount || "Varies"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.funding_type}
                    </p>
                  </td>

                  {/* Deadline */}
                  <td className="px-5 py-4 align-top whitespace-nowrap">
                    <DeadlineCountdown deadline={s.application_deadline} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <a
                        href={href}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900
                                   hover:underline underline-offset-4 transition-colors"
                      >
                        Details
                      </a>
                      <a
                        href={isPast ? undefined : s.application_url}
                        target={isPast ? undefined : "_blank"}
                        rel={isPast ? undefined : "noopener noreferrer"}
                        aria-disabled={isPast}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                          ${isPast
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-brand-600 text-white hover:bg-brand-700"}`}
                      >
                        {isPast ? "Closed" : "Apply"}
                        {!isPast && <ExternalLink className="w-3 h-3" />}
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
