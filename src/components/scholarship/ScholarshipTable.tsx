"use client";

import { Building2 } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";
import ScholarshipRow from "./ScholarshipRow";

// ─────────────────────────────────────────────────────────────
// ScholarshipTable — list view for the Browse pages.
//
// The Actions column is gone:
//   - The outbound "Apply" button bypassed the auth gate, and
//     belongs on the detail page anyway (where the user has
//     read the eligibility before committing to the click).
//   - "Details" is redundant when the scholarship name in the
//     first column is already a link.
//
// The whole-row-clickable pattern that works on cards doesn't
// translate cleanly to <tr>: stretched-link tricks fight with
// table layout, and onClick-on-row breaks middle-click and
// right-click. Tables across the modern web (Stripe, Linear,
// GitHub) keep navigation on the title and let the rest of the
// row be data — same approach here.
//
// Mobile (<lg) uses the ScholarshipRow stack which IS fully
// card-clickable, so the affordance differs but only in a
// context where it makes sense.
// ─────────────────────────────────────────────────────────────

interface Props {
  scholarships: any[];
  baseUrl?: string;
}

export default function ScholarshipTable({ scholarships, baseUrl = "/scholarships" }: Props) {
  if (!scholarships?.length) return null;

  return (
    <div className="w-full">
      {/* Mobile-tablet: card stack */}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scholarships.map((s) => {
              const href = `${baseUrl}/${s.slug || s.id}`;

              return (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Scholarship name + provider */}
                  <td className="px-5 py-4 align-top">
                    <a
                      href={href}
                      className="font-medium text-slate-900 hover:text-brand-700
                                 hover:underline underline-offset-4
                                 focus:outline-none focus-visible:underline"
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
