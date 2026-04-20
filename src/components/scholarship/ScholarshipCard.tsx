"use client";

import { motion } from "framer-motion";
import { ExternalLink, Building2 } from "lucide-react";
import { countryFlagUrl } from "@/lib/utils";
import DeadlineCountdown from "./DeadlineCountdown";

// ─────────────────────────────────────────────────────────────
// ScholarshipCard — grid view card for the Browse page.
// Redesigned for clarity: single surface, country + funding as
// quiet metadata (not pill badges), description truncated to
// 2 lines, funding amount as the visual anchor, Details as
// secondary text link + Apply as primary button.
// ─────────────────────────────────────────────────────────────

interface ScholarshipCardProps {
  scholarship: any;
  index: number;
  baseUrl?: string;
}

export default function ScholarshipCard({
  scholarship: s,
  index,
  baseUrl = "/scholarships",
}: ScholarshipCardProps) {
  const href = `${baseUrl}/${s.slug || s.id}`;
  const isPast = s.application_deadline
    && new Date(s.application_deadline) < new Date();

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col h-full bg-white border border-slate-200 rounded-lg
                 hover:border-slate-300 hover:shadow-sm transition-all duration-150"
    >
      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* Header: country + funding type (quiet metadata row) */}
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
          <span>{s.funding_type} funding</span>
        </div>

        {/* Title + provider */}
        <div>
          <a href={href} className="block">
            <h3 className="font-semibold text-slate-900 text-base leading-snug
                           group-hover:text-brand-700 transition-colors line-clamp-2">
              {s.name}
            </h3>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{s.provider}</span>
          </div>
        </div>

        {/* Description — deliberate 2-line clamp */}
        {s.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {s.description.replace(/^[""\u201c\u201d]|[""\u201c\u201d]$/g, "").trim()}
          </p>
        )}

        {/* Funding amount — visual anchor, no label needed */}
        {s.funding_amount && (
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
            {s.funding_amount}
          </p>
        )}

        {/* Footer: deadline + actions, pushed to bottom */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100">
          <DeadlineCountdown deadline={s.application_deadline} />

          <div className="flex items-center gap-3 shrink-0">
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
        </div>
      </div>
    </motion.article>
  );
}
