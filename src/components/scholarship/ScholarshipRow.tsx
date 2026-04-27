"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";

// ─────────────────────────────────────────────────────────────
// ScholarshipRow — mobile/tablet list row. Used by
// ScholarshipTable at <lg breakpoints.
//
// Same "stretched link" pattern as ScholarshipCard: the whole
// row is a navigation target, no Apply CTA. Apply lives on the
// detail page, behind the auth gate.
// ─────────────────────────────────────────────────────────────

interface Props {
  scholarship: any;
  index: number;
  baseUrl?: string;
}

export default function ScholarshipRow({
  scholarship: s,
  index,
  baseUrl = "/scholarships",
}: Props) {
  const href = `${baseUrl}/${s.slug || s.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white border border-slate-200 rounded-lg
                 hover:border-slate-300 transition-colors duration-150
                 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-300"
    >
      <a
        href={href}
        className="absolute inset-0 rounded-lg z-10 focus:outline-none"
        aria-label={`View details for ${s.name}`}
      />

      <div className="p-4 flex flex-col gap-3">

        {/* Country + funding type */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {countryFlagUrl(s.country) ? (
            <img
              src={countryFlagUrl(s.country)!}
              alt=""
              className="w-5 h-3.5 object-cover rounded-sm border border-slate-200"
            />
          ) : (
            <div className="w-5 h-3.5 bg-slate-100 rounded-sm" />
          )}
          <span className="font-medium">{s.country}</span>
          <span className="text-slate-300">·</span>
          <span>{s.funding_type}</span>
        </div>

        {/* Title + provider */}
        <div>
          <h3 className="font-semibold text-slate-900 leading-snug
                         group-hover:text-brand-700 transition-colors">
            {s.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{s.provider}</span>
          </div>
        </div>

        {/* Award */}
        {s.funding_amount && (
          <p className="text-sm font-medium text-slate-900">
            {s.funding_amount}
          </p>
        )}

        {/* Footer: deadline + nav affordance */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <DeadlineCountdown deadline={s.application_deadline} />
          <span
            className="text-xs font-medium text-slate-400 group-hover:text-brand-700
                       transition-colors"
            aria-hidden="true"
          >
            View details →
          </span>
        </div>
      </div>
    </motion.article>
  );
}
